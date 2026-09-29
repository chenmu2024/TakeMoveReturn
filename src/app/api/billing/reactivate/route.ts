import { siteConfig } from "../../../../config/site";
import { billingIdempotencyKey, canRequestReactivation, isBillingInterval, isPaidPlan } from "../../../../lib/billing/lifecycle";
import { waffoClient, waffoProductId } from "../../../../lib/billing/waffo";
import { createClient, isSupabaseConfigured } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  if (process.env.WAFFO_BILLING_ENABLED !== "true" || !isSupabaseConfigured()) {
    return new Response("Billing is not available", { status: 503 });
  }
  if (request.headers.get("origin") !== siteConfig.siteUrl) {
    return new Response("Invalid origin", { status: 403 });
  }

  const client = waffoClient();
  if (!client) return new Response("Billing is not configured", { status: 503 });

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user?.email) return new Response("Sign in required", { status: 401 });

  const { data: membership, error: membershipError } = await supabase.from("organization_members")
    .select("company_id").eq("user_id", auth.user.id).eq("status", "active").eq("role", "owner").limit(1).maybeSingle();
  if (membershipError) return new Response("Membership could not be checked", { status: 503 });
  if (!membership) return new Response("Owner access required", { status: 403 });

  const { data: subscription, error: subscriptionError } = await supabase.from("billing_subscriptions")
    .select("order_id,plan,billing_interval,status,updated_at")
    .eq("company_id", membership.company_id).maybeSingle();
  if (subscriptionError) return new Response("Subscription could not be checked", { status: 503 });
  if (!subscription || !isPaidPlan(subscription.plan) || !isBillingInterval(subscription.billing_interval) ||
      !canRequestReactivation(subscription.status)) {
    return new Response("Only a canceling subscription can be reactivated", { status: 409 });
  }

  try {
    const { token } = await client.auth.issueSessionToken({
      productId: waffoProductId(subscription.plan, subscription.billing_interval),
      buyerIdentity: auth.user.email,
    });
    const customer = client.customer(token);
    await customer.reactivateSubscription(
      { orderId: subscription.order_id },
      { idempotencyKey: billingIdempotencyKey("reactivate", subscription.order_id, subscription.updated_at) },
    );
    return Response.redirect(new URL("/app/settings/billing?notice=reactivation-pending", siteConfig.siteUrl).toString(), 303);
  } catch {
    return new Response("Reactivation could not be requested. Use the Waffo link in your receipt or contact billing@takemovereturn.com.", { status: 502 });
  }
}
