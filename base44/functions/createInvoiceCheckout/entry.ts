import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { appId, getAppUrl, round2, stripePost } from "../../shared/stripe.ts";

const RETURN_PATHS = ["/facturation", "/mon-espace"];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const invoiceId = String(body?.invoice_id || "");
    if (!invoiceId) return Response.json({ error: "Facture manquante" }, { status: 400 });

    // Lecture filtrée par les règles d'accès : seuls le copropriétaire destinataire
    // et l'équipe du cabinet peuvent payer cette facture.
    const invoice = await base44.entities.Invoice.get(invoiceId).catch((e: any) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!invoice) return Response.json({ error: "Facture introuvable" }, { status: 404 });

    const outstanding = round2((Number(invoice.amount) || 0) - (Number(invoice.paid_amount) || 0));
    if (outstanding <= 0) return Response.json({ error: "Cette facture est déjà réglée." }, { status: 400 });

    const appUrl = getAppUrl(req);
    const returnPath = RETURN_PATHS.includes(body?.return_path) ? body.return_path : "/facturation";
    const label = `${invoice.reference || "Appel de fonds"}${invoice.lot_number ? ` · lot ${invoice.lot_number}` : ""}`;

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "eur");
    params.set("line_items[0][price_data][unit_amount]", String(Math.round(outstanding * 100)));
    params.set("line_items[0][price_data][product_data][name]", label);
    if (invoice.period) params.set("line_items[0][price_data][product_data][description]", `Période ${invoice.period}`);
    if (user.email) params.set("customer_email", user.email);
    params.set("client_reference_id", invoiceId);
    params.set("success_url", `${appUrl}${returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${appUrl}${returnPath}?checkout=cancel`);
    params.set("metadata[base44_app_id]", appId());
    params.set("metadata[invoice_id]", invoiceId);
    params.set("metadata[syndic_id]", invoice.syndic_id || "");

    const session = await stripePost("/checkout/sessions", params);
    return Response.json({ url: session.url, session_id: session.id });
  } catch (error: any) {
    console.error("createInvoiceCheckout", error?.message);
    return Response.json({ error: error?.message || "Paiement indisponible" }, { status: 500 });
  }
}