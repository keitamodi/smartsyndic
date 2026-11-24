import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { PLAN_PRICES, appId, getAppUrl, stripePost } from "../../shared/stripe.ts";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const planId = String(body?.plan_id || "");
    const plan = PLAN_PRICES[planId];
    if (!plan) return Response.json({ error: "Forfait inconnu" }, { status: 400 });

    const syndicId = user.syndic_id || user.data?.syndic_id;
    if (!syndicId) return Response.json({ error: "Aucun espace syndic rattaché à votre compte." }, { status: 400 });

    const syndic = await base44.asServiceRole.entities.Syndic.get(syndicId).catch((e: any) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!syndic) return Response.json({ error: "Espace syndic introuvable." }, { status: 404 });

    const appUrl = getAppUrl(req);
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("line_items[0][price]", plan.priceId);
    params.set("line_items[0][quantity]", "1");
    if (user.email) params.set("customer_email", user.email);
    params.set("client_reference_id", syndicId);
    params.set("allow_promotion_codes", "true");
    params.set("success_url", `${appUrl}/abonnement?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${appUrl}/abonnement?checkout=cancel`);
    params.set("metadata[base44_app_id]", appId());
    params.set("metadata[syndic_id]", syndicId);
    params.set("metadata[plan_tier]", planId);
    params.set("subscription_data[metadata][base44_app_id]", appId());
    params.set("subscription_data[metadata][syndic_id]", syndicId);
    params.set("subscription_data[metadata][plan_tier]", planId);

    const session = await stripePost("/checkout/sessions", params);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error: any) {
    console.error("createSubscriptionCheckout", error?.message);
    return Response.json({ error: error?.message || "Paiement indisponible" }, { status: 500 });
  }
}