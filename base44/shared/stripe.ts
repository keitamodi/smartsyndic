import { secrets } from "base44:runtime";

// Tarifs Stripe du cabinet (prix récurrents mensuels, en centimes).
export const PLAN_PRICES = {
  starter: { priceId: "price_1Uf9K0E9Oc02oNtMTNHobDTE", label: "Smartsyndic Starter", amount: 3290 },
  pro: { priceId: "price_1Uf9K1E9Oc02oNtMXPiJCSqD", label: "Smartsyndic Pro", amount: 6490 },
  expert: { priceId: "price_1Uf9K1E9Oc02oNtM2UG8vbVK", label: "Smartsyndic Expert", amount: 12990 },
};

// Origine publique de l'app, fournie par la plateforme (jamais déduite de la requête).
export function getAppUrl(req: Request): string {
  const url = req.headers.get("X-Base44-App-Url");
  if (!url) throw new Error("Origine de l'application indisponible");
  return url.replace(/\/+$/, "");
}

export function appId(): string {
  return secrets.get("BASE44_APP_ID") || "";
}

// Lecture Stripe côté serveur (clé secrète jamais exposée au client).
export async function stripeGet(path: string): Promise<any> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${secrets.get("STRIPE_SECRET_KEY")}`,
      "Stripe-Version": "2025-10-29.clover",
    },
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Stripe ${response.status}`);
  return data;
}

// Appel Stripe côté serveur : la clé secrète ne quitte jamais le backend.
export async function stripePost(path: string, params: URLSearchParams): Promise<any> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secrets.get("STRIPE_SECRET_KEY")}`,
      "Stripe-Version": "2025-10-29.clover",
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: params.toString(),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Stripe ${response.status}`);
  return data;
}

// Résilie un abonnement Stripe (arrêt immédiat des prélèvements).
export async function stripeDelete(path: string): Promise<any> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${secrets.get("STRIPE_SECRET_KEY")}`,
      "Stripe-Version": "2025-10-29.clover",
    },
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Stripe ${response.status}`);
  return data;
}

// Applique un forfait payant confirmé à l'espace syndic.
// Utilisé par le webhook Stripe et par la confirmation au retour du paiement,
// afin que les deux chemins activent exactement les mêmes forfaits.
export async function applyPaidPlan(
  entities: any,
  input: { syndicId: string; planTier: string; customerId?: string; subscriptionId?: string },
): Promise<string> {
  if (!PLAN_PRICES[input.planTier]) throw new Error(`Forfait inconnu: ${input.planTier}`);
  const patch: Record<string, any> = { plan_tier: input.planTier, subscription_status: "actif" };
  if (input.customerId) patch.stripe_customer_id = input.customerId;
  if (input.subscriptionId) patch.stripe_subscription_id = input.subscriptionId;
  await entities.Syndic.update(input.syndicId, patch);
  return input.planTier;
}

export function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}