import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { secrets } from "base44:runtime";
import { PLAN_PRICES, round2 } from "../../shared/stripe.ts";

const CHECKOUT_EVENTS = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
const SUBSCRIPTION_EVENTS = ["customer.subscription.updated", "customer.subscription.deleted"];

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function isValidSignature(payload: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts: Record<string, string[]> = {};
  for (const chunk of header.split(",")) {
    const [name, value] = chunk.split("=");
    if (!name || !value) continue;
    (parts[name.trim()] ||= []).push(value.trim());
  }
  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = await hmacHex(secret, `${timestamp}.${payload}`);
  return signatures.some((signature) => signature === expected);
}

function firstRow(page: any): any {
  return (Array.isArray(page) ? page : page?.items || [])[0] || null;
}

// Retrouve le cabinet concerné par un abonnement Stripe.
async function syndicForSubscription(entities: any, subscription: any): Promise<any> {
  const metaId = String(subscription?.metadata?.syndic_id || "");
  if (metaId) {
    const found = await entities.Syndic.get(metaId).catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
    if (found) return found;
  }
  if (!subscription?.id) return null;
  return firstRow(await entities.Syndic.filter({ stripe_subscription_id: subscription.id }, { limit: 1 }));
}

export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const payload = await req.text();
    const valid = await isValidSignature(payload, req.headers.get("stripe-signature"), secrets.get("STRIPE_WEBHOOK_SECRET"));
    if (!valid) {
      console.error("stripeWebhook: signature invalide");
      return Response.json({ error: "Signature invalide" }, { status: 400 });
    }

    const event = JSON.parse(payload);
    const entities = base44.asServiceRole.entities;
    const object = event.data?.object || {};

    // Charge de test Base44 : jamais un achat client.
    if (object.metadata?.base44_test_checkout === "true") {
      return Response.json({ received: true, skipped: "self-test" });
    }

    // Paiement (ou renouvellement) confirmé d'un abonnement
    if (CHECKOUT_EVENTS.includes(event.type)) {
      if (object.payment_status !== "paid") return Response.json({ received: true, skipped: "unpaid" });

      if (object.mode === "subscription") {
        const syndicId = object.metadata?.syndic_id;
        const planTier = object.metadata?.plan_tier;
        if (!syndicId || !planTier) return Response.json({ received: true, skipped: "metadata" });
        await entities.Syndic.update(syndicId, {
          plan_tier: planTier,
          subscription_status: "actif",
          stripe_customer_id: object.customer || "",
          stripe_subscription_id: object.subscription || "",
        });
        console.log("stripeWebhook: abonnement activé", syndicId, planTier);
        return Response.json({ received: true, plan_tier: planTier });
      }

      // Paiement d'un appel de fonds
      const invoiceId = object.metadata?.invoice_id;
      if (!invoiceId) return Response.json({ received: true, skipped: "no invoice" });

      const reference = `stripe:${object.id}`;
      const duplicates = await entities.Payment.filter({ reference });
      if (Array.isArray(duplicates) ? duplicates.length : duplicates?.items?.length) {
        return Response.json({ received: true, skipped: "duplicate" });
      }

      const invoice = await entities.Invoice.get(invoiceId).catch((e: any) =>
        e.status === 404 ? null : Promise.reject(e),
      );
      if (!invoice) return Response.json({ received: true, skipped: "invoice introuvable" });

      const amount = round2((Number(object.amount_total) || 0) / 100);
      await entities.Payment.create({
        syndic_id: invoice.syndic_id,
        invoice_id: invoiceId,
        building_id: invoice.building_id || "",
        amount,
        date: new Date().toISOString().slice(0, 10),
        method: "en_ligne",
        reference,
        status: "recu",
      });

      const paid = round2((Number(invoice.paid_amount) || 0) + amount);
      await entities.Invoice.update(invoiceId, {
        paid_amount: paid,
        status: paid >= (Number(invoice.amount) || 0) ? "payee" : "partiellement_payee",
      });
      console.log("stripeWebhook: facture réglée", invoiceId, amount);
      return Response.json({ received: true, paid_amount: paid });
    }

    // Cycle de vie de l'abonnement : changement de forfait, impayé, résiliation
    if (SUBSCRIPTION_EVENTS.includes(event.type)) {
      const syndic = await syndicForSubscription(entities, object);
      if (!syndic) return Response.json({ received: true, skipped: "syndic introuvable" });

      const status = String(object.status || "");
      const ended = event.type === "customer.subscription.deleted" || status === "canceled" || status === "incomplete_expired";
      if (ended) {
        await entities.Syndic.update(syndic.id, {
          plan_tier: "free",
          subscription_status: "resilie",
          stripe_subscription_id: "",
        });
        console.log("stripeWebhook: abonnement résilié", syndic.id);
        return Response.json({ received: true, subscription_status: "resilie" });
      }

      const planTier = String(object.metadata?.plan_tier || syndic.plan_tier || "free");
      const subscriptionStatus = ["past_due", "unpaid", "incomplete"].includes(status) ? "impaye" : "actif";
      await entities.Syndic.update(syndic.id, {
        plan_tier: PLAN_PRICES[planTier] ? planTier : syndic.plan_tier || "free",
        subscription_status: subscriptionStatus,
        stripe_customer_id: object.customer || syndic.stripe_customer_id || "",
        stripe_subscription_id: object.id || syndic.stripe_subscription_id || "",
      });
      console.log("stripeWebhook: abonnement mis à jour", syndic.id, planTier, subscriptionStatus);
      return Response.json({ received: true, plan_tier: planTier, subscription_status: subscriptionStatus });
    }

    // Échec de prélèvement : le forfait reste actif mais l'abonnement passe en impayé
    if (event.type === "invoice.payment_failed") {
      const subscriptionId = object.parent?.subscription_details?.subscription || object.subscription || "";
      if (!subscriptionId) return Response.json({ received: true, skipped: "no subscription" });
      const syndic = firstRow(await entities.Syndic.filter({ stripe_subscription_id: subscriptionId }, { limit: 1 }));
      if (!syndic) return Response.json({ received: true, skipped: "syndic introuvable" });
      await entities.Syndic.update(syndic.id, { subscription_status: "impaye" });
      console.log("stripeWebhook: prélèvement échoué", syndic.id);
      return Response.json({ received: true, subscription_status: "impaye" });
    }

    return Response.json({ received: true, ignored: event.type });
  } catch (error: any) {
    console.error("stripeWebhook", error?.message);
    return Response.json({ error: error?.message || "Erreur webhook" }, { status: 500 });
  }
}