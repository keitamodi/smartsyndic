export const QUARTERS = [
  { value: 'T1', label: 'T1 · janvier à mars' },
  { value: 'T2', label: 'T2 · avril à juin' },
  { value: 'T3', label: 'T3 · juillet à septembre' },
  { value: 'T4', label: 'T4 · octobre à décembre' },
];

export const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const quarterOfDate = (value) => {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return `T${Math.floor(safe.getMonth() / 3) + 1}`;
};

export const yearOfDate = (value) => {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  return safe.getFullYear();
};

export const periodLabel = (quarter, year) => `${quarter} ${year}`;

export const buildReference = (quarter, year, lotNumber) =>
  `AF-${year}-${quarter}-${lotNumber}`.replace(/\s+/g, '');

export const totalTantiemes = (lots = []) =>
  lots.reduce((sum, lot) => sum + (Number(lot.tantiemes) || 0), 0);

/**
 * Croise le tableau des tantièmes avec un montant global.
 * Le reliquat d'arrondi est reporté sur le lot au tantième le plus élevé.
 */
export const computeShares = (lots = [], totalAmount = 0) => {
  const eligible = lots.filter((lot) => (Number(lot.tantiemes) || 0) > 0);
  const base = totalTantiemes(eligible);
  if (!base || !(Number(totalAmount) > 0)) return [];

  const rows = eligible.map((lot) => {
    const share = (Number(lot.tantiemes) || 0) / base;
    return { lot, share, amount: round2(Number(totalAmount) * share) };
  });

  const diff = round2(Number(totalAmount) - rows.reduce((sum, row) => sum + row.amount, 0));
  if (diff !== 0) {
    const target = rows.reduce((best, row) => (row.amount > best.amount ? row : best), rows[0]);
    target.amount = round2(target.amount + diff);
  }

  return rows;
};