import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { secrets } from "base44:runtime";
import { round2 } from "../../shared/stripe.ts";

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
    const handled = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
    if (!handled.includes(event.type)) return Response.json({ received: true, ignored: event.type });

    const session = event.data?.object || {};
    if (session.metadata?.base44_test_checkout === "true") {
      return Response.json({ received: true, skipped: "self-test" });
    }
    if (session.payment_status !== "paid") {
      return Response.json({ received: true, skipped: "unpaid" });
    }

    const entities = base44.asServiceRole.entities;

    // Abonnement d'un cabinet
    if (session.mode === "subscription") {
      const syndicId = session.metadata?.syndic_id;
      const planTier = session.metadata?.plan_tier;
      if (!syndicId || !planTier) return Response.json({ received: true, skipped: "metadata" });
      await entities.Syndic.update(syndicId, {
        plan_tier: planTier,
        subscription_status: "actif",
        stripe_customer_id: session.customer || "",
        stripe_subscription_id: session.subscription || "",
      });
      console.log("stripeWebhook: abonnement activé", syndicId, planTier);
      return Response.json({ received: true, plan_tier: planTier });
    }

    // Paiement d'un appel de fonds
    const invoiceId = session.metadata?.invoice_id;
    if (!invoiceId) return Response.json({ received: true, skipped: "no invoice" });

    const reference = `stripe:${session.id}`;
    const duplicates = await entities.Payment.filter({ reference });
    if (Array.isArray(duplicates) ? duplicates.length : duplicates?.items?.length) {
      return Response.json({ received: true, skipped: "duplicate" });
    }

    const invoice = await entities.Invoice.get(invoiceId).catch((e: any) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!invoice) return Response.json({ received: true, skipped: "invoice introuvable" });

    const amount = round2((Number(session.amount_total) || 0) / 100);
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
  } catch (error: any) {
    console.error("stripeWebhook", error?.message);
    return Response.json({ error: error?.message || "Erreur webhook" }, { status: 500 });
  }
}