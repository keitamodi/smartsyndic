import { planById } from '@/lib/plans';

export const QUOTAS = {
  buildings: { label: 'Immeubles', one: 'immeuble', many: 'immeubles' },
  lots: { label: 'Lots', one: 'lot', many: 'lots' },
  seats: { label: 'Sièges équipe', one: 'siège', many: 'sièges' },
  ai: { label: 'Questions IA', one: 'question IA', many: 'questions IA' },
};

/** Limites du forfait du cabinet (free / starter / pro / expert). */
export function quotaLimits(syndic) {
  return planById(syndic?.plan_tier).limits;
}

/** État d'un quota : usage courant, plafond, reste disponible et dépassement. */
export function quotaState(usage, limits, key) {
  const meta = QUOTAS[key] || { label: key, one: 'élément', many: 'éléments' };
  const limit = Number(limits?.[key]) || 0;
  const used = Number(usage?.[key]) || 0;
  return {
    key,
    label: meta.label,
    unit: limit > 1 ? meta.many : meta.one,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    reached: used >= limit,
  };
}

/** Premier instant du mois en cours (les quotas IA sont mensuels). */
export function monthStartISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}