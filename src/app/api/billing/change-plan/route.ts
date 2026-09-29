import { ChangeTiming } from "@waffo/pancake-ts";
import { siteConfig } from "../../../../config/site";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { isBillingInterval, isPaidPlan, planChangeTiming } from "../../../../lib/billing/lifecycle";
import { waffoClient, waffoProductId } from "../../../../lib/billing/waffo";

function validDestination(url: string) {
  const destination = new URL(url);
  return destination.protocol === "https:" &&
    (destination.hostname === "waffo.ai" || destination.hostname.endsWith(".waffo.ai"))
    ? destination
    : null;
}

export async function POST(request: Request) {
  if (process.env.WAFFO_BILLING_ENABLED !== "true" || !isSupabaseConfigured()) {
    return new Response("Billing is not available", { status: 503 });
  }
  if (request.headers.get("origin") !== siteConfig.siteUrl) {
    return new Response("Invalid origin", { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return new Response("Invalid request", { status: 400 });
  }

  const form = await request.formData().catch(() => null);
  const targetPlan = form?.get("plan");
  const targetInterval = form?.get("billing_interval");
  if (!isPaidPlan(targetPlan) || !isBillingInterval(targetInterval)) {
    return new Response("Invalid plan", { status: 400 });
  }

  const client = waffoClient();
  if (!client) return new Response("Billing is not configured", { status: 503 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email) return new Response("Sign in required", { status: 401 });

  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id,role").eq("user_id", auth.user.id).eq("status", "active").eq("role", "owner").limit(1).maybeSingle();
  if (membershipError) return new Response("Membership could not be checked", { status: 503 });
  if (!membership) return new Response("Owner access required", { status: 403 });

  const { data: subscription, error: subscriptionError } = await supabase.from("billing_subscriptions")
    .select("order_id,plan,billing_interval,status")
    .eq("company_id", membership.company_id).maybeSingle();
  if (subscriptionError) return new Response("Subscription could not be checked", { status: 503 });
  if (!subscription || !isPaidPlan(subscription.plan) || !isBillingInterval(subscription.billing_interval)) {
    return new Response("Active paid subscription required", { status: 409 });
  }
  if (subscription.status !== "active") {
    return new Response("Resolve the current subscription status before changing plans", { status: 409 });
  }

  let timing: "immediate" | "next_period";
  try {
    timing = planChangeTiming(subscription.plan, subscription.billing_interval, targetPlan, targetInterval);
  } catch {
    return new Response("That plan and billing interval are already active", { status: 409 });
  }

  const productId = waffoProductId(targetPlan, targetInterval);
  const { data: intentId, error: intentError } = await supabase.rpc("create_billing_plan_change_intent", {
    p_company_id: membership.company_id,
    p_to_plan: targetPlan,
    p_to_interval: targetInterval,
    p_product_id: productId,
    p_timing: timing,
  });
  if (intentError || typeof intentId !== "string") {
    return new Response("A plan change is already pending or this subscription cannot be changed right now.", { status: 409 });
  }

  try {
    const session = await client.checkout.createPlanChangeSession({
      originOrderId: subscription.order_id,
      productId,
      currency: "USD",
      changeTiming: timing === "immediate" ? ChangeTiming.Immediate : ChangeTiming.NextPeriod,
      successUrl: new URL("/app/settings/billing?notice=plan-change-pending", siteConfig.siteUrl).toString(),
      metadata: { billingPlanChangeIntentId: intentId },
      orderMerchantExternalId: intentId,
    }, { idempotencyKey: intentId });

    const destination = validDestination(session.checkoutUrl);
    if (!destination) {
      await supabase.rpc("fail_billing_plan_change_intent", { p_intent_id: intentId });
      return new Response("Invalid plan-change destination", { status: 502 });
    }

    const { error: startedError } = await supabase.rpc("mark_billing_plan_change_started", {
      p_intent_id: intentId,
      p_session_id: session.sessionId,
    });
    if (startedError) {
      await supabase.rpc("fail_billing_plan_change_intent", { p_intent_id: intentId });
      return new Response("Plan-change state could not be saved", { status: 503 });
    }
    return Response.redirect(destination.toString(), 303);
  } catch {
    await supabase.rpc("fail_billing_plan_change_intent", { p_intent_id: intentId });
    return new Response("Plan change could not be started", { status: 502 });
  }
}
