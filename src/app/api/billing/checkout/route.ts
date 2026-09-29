import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";
import { siteConfig } from "../../../../config/site";
import { waffoClient, waffoProductId } from "../../../../lib/billing/waffo";

export async function POST(request: Request) {
  if (process.env.WAFFO_BILLING_ENABLED !== "true" || !isSupabaseConfigured()) {
    return new Response("Billing is not available", { status: 503 });
  }
  if (request.headers.get("origin") !== siteConfig.siteUrl) {
    return new Response("Invalid origin", { status: 403 });
  }
  const bodySize = Number(request.headers.get("content-length"));
  if (!Number.isInteger(bodySize) || bodySize < 1 || bodySize > 2048 ||
      !request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return new Response("Invalid request", { status: 400 });
  }
  const form = await request.formData().catch(() => null);
  const plan = form?.get("plan");
  const interval = form?.get("billing_interval");
  if ((plan !== "starter" && plan !== "growth" && plan !== "pro") || (interval !== "month" && interval !== "year")) {
    return new Response("Invalid plan", { status: 400 });
  }
  const productId = waffoProductId(plan, interval);
  const client = waffoClient();
  if (!productId || !client) return new Response("Billing is not configured", { status: 503 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email) return new Response("Sign in required", { status: 401 });
  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id,role").eq("user_id", auth.user.id).eq("status", "active").eq("role", "owner").limit(1).maybeSingle();
  if (membershipError) return new Response("Membership could not be checked", { status: 503 });
  if (!membership) return new Response("Owner access required", { status: 403 });

  const { data: intentId, error: intentError } = await supabase.rpc("create_billing_checkout_intent", {
    p_company_id: membership.company_id,
    p_plan: plan,
    p_interval: interval,
    p_product_id: productId,
  });
  if (intentError || typeof intentId !== "string") {
    return new Response("Checkout is unavailable for this workspace. Check your current subscription and terms acceptance.", { status: 409 });
  }

  try {
    const checkout = await client.checkout.authenticated.create({
      productId,
      currency: "USD",
      buyerIdentity: auth.user.email,
      buyerEmail: auth.user.email,
      successUrl: new URL("/app/settings/billing?notice=payment-pending", siteConfig.siteUrl).toString(),
      metadata: { checkoutIntentId: intentId },
      orderMerchantExternalId: intentId,
    }, { idempotencyKey: intentId });
    const destination = new URL(checkout.checkoutUrl);
    if (destination.protocol !== "https:" || (destination.hostname !== "waffo.ai" && !destination.hostname.endsWith(".waffo.ai"))) {
      return new Response("Invalid checkout destination", { status: 502 });
    }
    const { error: startedError } = await supabase.rpc("mark_billing_checkout_started", {
      p_intent_id: intentId, p_session_id: checkout.sessionId,
    });
    if (startedError) return new Response("Checkout state could not be saved", { status: 503 });
    return Response.redirect(destination.toString(), 303);
  } catch {
    return new Response("Checkout could not be started", { status: 502 });
  }
}
