import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { stripeDelete } from "../../shared/stripe.ts";

// Retour au forfait Gratuit : l'abonnement Stripe est résilié pour arrêter
// immédiatement les prélèvements, puis l'espace repasse en accès gratuit.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const syndicId = user.syndic_id || user.data?.syndic_id;
    if (!syndicId) return Response.json({ error: "Aucun espace syndic rattaché à votre compte." }, { status: 400 });

    const entities = base44.asServiceRole.entities;
    const syndic = await entities.Syndic.get(syndicId).catch((e: any) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!syndic) return Response.json({ error: "Espace syndic introuvable." }, { status: 404 });

    const subscriptionId = String(syndic.stripe_subscription_id || "");
    let canceled = false;
    if (subscriptionId) {
      try {
        await stripeDelete(`/subscriptions/${subscriptionId}`);
        canceled = true;
      } catch (error: any) {
        // Sans résiliation confirmée, on ne bascule pas le forfait : le cabinet
        // resterait prélevé tout en perdant ses accès payants.
        console.error("cancelSubscription: Stripe", error?.message);
        return Response.json(
          { error: "La résiliation du paiement n'a pas abouti. Réessayez dans un instant." },
          { status: 502 },
        );
      }
    }

    await entities.Syndic.update(syndicId, {
      plan_tier: "free",
      subscription_status: "aucun",
      stripe_subscription_id: "",
    });
    console.log("cancelSubscription: forfait Gratuit rétabli", syndicId, canceled);
    return Response.json({ canceled, plan_tier: "free" });
  } catch (error: any) {
    console.error("cancelSubscription", error?.message);
    return Response.json({ error: error?.message || "Résiliation impossible" }, { status: 500 });
  }
}