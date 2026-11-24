import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { PLAN_PRICES, applyPaidPlan, stripeGet } from "../../shared/stripe.ts";

// Confirmation au retour du paiement : le statut réel est demandé à Stripe
// (jamais déduit de l'URL de retour), puis le forfait est appliqué immédiatement.
// Le webhook reste la source de vérité ; cette fonction ne fait que le devancer.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body?.session_id || "");
    if (!sessionId) return Response.json({ error: "Session de paiement manquante" }, { status: 400 });

    const syndicId = user.syndic_id || user.data?.syndic_id;
    if (!syndicId) return Response.json({ error: "Aucun espace syndic rattaché à votre compte." }, { status: 400 });

    const session = await stripeGet(`/checkout/sessions/${encodeURIComponent(sessionId)}`);

    // Le paiement doit appartenir à l'espace du compte connecté.
    if (String(session?.metadata?.syndic_id || "") !== String(syndicId)) {
      console.error("confirmSubscriptionCheckout: session d'un autre espace", sessionId);
      return Response.json({ error: "Paiement rattaché à un autre espace." }, { status: 403 });
    }
    if (session?.mode !== "subscription") {
      return Response.json({ paid: false, reason: "mode" });
    }
    // Un code promo à 100 % produit « no_payment_required » : le règlement est réglé.
    if (!["paid", "no_payment_required"].includes(String(session?.payment_status || ""))) {
      return Response.json({ paid: false, reason: String(session?.payment_status || "unpaid") });
    }

    const planTier = String(session?.metadata?.plan_tier || "");
    if (!PLAN_PRICES[planTier]) {
      console.error("confirmSubscriptionCheckout: forfait inconnu", planTier, sessionId);
      return Response.json({ error: "Forfait inconnu" }, { status: 400 });
    }

    await applyPaidPlan(base44.asServiceRole.entities, {
      syndicId,
      planTier,
      customerId: session.customer || "",
      subscriptionId: session.subscription || "",
    });
    console.log("confirmSubscriptionCheckout: forfait appliqué", syndicId, planTier, sessionId);
    return Response.json({ paid: true, plan_tier: planTier });
  } catch (error: any) {
    console.error("confirmSubscriptionCheckout", error?.message);
    return Response.json({ error: error?.message || "Confirmation indisponible" }, { status: 500 });
  }
}