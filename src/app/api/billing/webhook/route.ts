import { verifyWebhook, type WebhookEventData } from "@waffo/pancake-ts";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const signature = request.headers.get("x-waffo-signature");
  const length = Number(request.headers.get("content-length"));
  if (!signature || (request.headers.has("content-length") && (!Number.isInteger(length) || length > 65536))) {
    return new Response("Invalid webhook", { status: 400 });
  }
  const rawBody = await request.text();
  if (rawBody.length > 65536) return new Response("Webhook too large", { status: 413 });

  let event;
  try {
    event = verifyWebhook<WebhookEventData>(rawBody, signature, { environment: "prod" });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }
  if (event.mode !== "prod" || event.storeId !== process.env.WAFFO_STORE_ID) {
    return new Response("Unknown store", { status: 403 });
  }
  const data = event.data;
  if (!["subscription.activated", "subscription.renewed", "subscription.recovered", "subscription.canceling",
    "subscription.uncanceled", "subscription.past_due", "subscription.canceled"].includes(event.eventType)) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response("Billing store unavailable", { status: 503 });
    }
    const auditDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (event.eventId && data?.orderId) {
      const { error } = await auditDb.from("billing_webhook_events").upsert({
        event_type: event.eventType, event_id: event.eventId, order_id: data.orderId,
      }, { onConflict: "event_type,event_id", ignoreDuplicates: true });
      if (error) return new Response("Billing event could not be saved", { status: 503 });
    }
    return new Response("Recorded", { status: 200 });
  }
  const intentId = data.orderMetadata?.checkoutIntentId;
  const eventDate = new Date(event.timestamp);
  const periodEnd = data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null;
  if (!intentId || !/^[0-9a-f-]{36}$/i.test(intentId) ||
      (data.orderMerchantExternalId && data.orderMerchantExternalId !== intentId) ||
      !data.orderId || !event.eventId || !Number.isFinite(eventDate.getTime()) ||
      (periodEnd && !Number.isFinite(periodEnd.getTime()))) {
    return new Response("Invalid subscription event", { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Billing store unavailable", { status: 503 });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: intent, error: intentError } = await supabase.from("billing_checkout_intents")
    .select("id,billing_interval,status").eq("id", intentId).maybeSingle();
  if (intentError) return new Response("Billing store unavailable", { status: 503 });
  if (!intent || (intent.status !== "started" && intent.status !== "fulfilled") ||
      data.currency !== "USD" ||
      (data.billingPeriod && data.billingPeriod !== (intent.billing_interval === "month" ? "monthly" : "yearly"))) {
    return new Response("Subscription does not match checkout", { status: 400 });
  }
  const { error } = await supabase.rpc("apply_waffo_subscription_event", {
    p_event_type: event.eventType,
    p_event_id: event.eventId,
    p_order_id: data.orderId,
    p_intent_id: intentId,
    p_occurred_at: eventDate.toISOString(),
    p_period_end: periodEnd?.toISOString() ?? null,
  });
  if (error) return new Response("Billing event could not be saved", { status: 503 });
  return new Response("OK", { status: 200 });
}
