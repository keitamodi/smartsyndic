import { round2 } from '@/lib/appelFonds';
import { formatDate, formatEUR } from '@/lib/format';

const DAY = 86400000;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const toDate = (value) => {
  const raw = String(value || '').slice(0, 10);
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const addDays = (value, days) => {
  const date = toDate(value);
  if (!date) return '';
  return new Date(date.getTime() + days * DAY).toISOString().slice(0, 10);
};

/** Reste dû d'une facture, jamais négatif. */
export const outstandingOf = (invoice) =>
  Math.max(round2((Number(invoice?.amount) || 0) - (Number(invoice?.paid_amount) || 0)), 0);

/** Facture émise et non soldée : elle pèse sur la trésorerie de l'immeuble. */
export const isOpen = (invoice) =>
  Boolean(invoice) && invoice.status !== 'brouillon' && invoice.status !== 'payee' && outstandingOf(invoice) > 0;

export const daysLate = (invoice, reference = new Date()) => {
  const due = toDate(invoice?.due_date);
  if (!due) return 0;
  const base = toDate(reference) || new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  return Math.floor((start.getTime() - due.getTime()) / DAY);
};

export const isLate = (invoice, reference = new Date()) => isOpen(invoice) && daysLate(invoice, reference) > 0;

export const AGE_BUCKETS = [
  { key: 'j15', label: '1 à 15 jours', tone: 'text-amber-700', min: 1, max: 15 },
  { key: 'j30', label: '16 à 30 jours', tone: 'text-orange-700', min: 16, max: 30 },
  { key: 'j30plus', label: 'Plus de 30 jours', tone: 'text-rose-700', min: 31, max: Infinity },
];

/** Échelle de relance : chaque envoi fait monter d'un cran. */
export const REMINDER_STAGES = [
  { level: 0, label: 'Rappel amiable', short: 'Rappel', offset: 1 },
  { level: 1, label: 'Relance écrite', short: 'Relancer', offset: 2 },
  { level: 2, label: 'Mise en demeure', short: 'Mise en demeure', offset: 4 },
  { level: 3, label: 'Recouvrement contentieux', short: 'Contentieux', offset: 6 },
];

export const stageOf = (invoice) =>
  REMINDER_STAGES[Math.min(Math.max(Number(invoice?.reminder_level) || 0, 0), REMINDER_STAGES.length - 1)];

/** Échéancier prévisionnel des rappels à partir de l'échéance et de la cadence. */
export const reminderPlan = (dueDate, cadence = 7) => {
  const step = Math.max(Number(cadence) || 7, 1);
  return [
    { label: 'Rappel amiable', date: addDays(dueDate, step) },
    { label: 'Relance écrite', date: addDays(dueDate, step * 2) },
    { label: 'Mise en demeure', date: addDays(dueDate, step * 4) },
  ];
};

export const summaryOf = (invoices = [], reference = new Date()) => {
  const open = invoices.filter((row) => isOpen(row));
  const late = open
    .filter((row) => isLate(row, reference))
    .sort((a, b) => daysLate(b, reference) - daysLate(a, reference));
  const buckets = AGE_BUCKETS.map((bucket) => {
    const rows = late.filter((row) => {
      const days = daysLate(row, reference);
      return days >= bucket.min && days <= bucket.max;
    });
    return {
      ...bucket,
      count: rows.length,
      amount: round2(rows.reduce((sum, row) => sum + outstandingOf(row), 0)),
    };
  });
  return {
    open,
    late,
    buckets,
    lateTotal: round2(late.reduce((sum, row) => sum + outstandingOf(row), 0)),
    openTotal: round2(open.reduce((sum, row) => sum + outstandingOf(row), 0)),
  };
};

export const reminderMessage = (invoice, stage) => {
  const remaining = formatEUR(outstandingOf(invoice), 2);
  const due = formatDate(invoice?.due_date);
  const days = daysLate(invoice);
  const delay = days > 0 ? `${days} jour(s) de retard` : days === 0 ? 'échéance ce jour' : 'échéance à venir';
  const closing = {
    0: "Merci de régulariser rapidement pour garantir la continuité des services de l'immeuble.",
    1: 'Sans règlement sous 8 jours, une mise en demeure vous sera adressée.',
    2: 'À défaut de règlement sous 15 jours, le dossier sera transmis au service de recouvrement.',
    3: 'Le dossier est transmis au recouvrement contentieux.',
  };
  return {
    title: `${stage.label} — ${invoice?.reference || 'appel de fonds'}`,
    message: `${remaining} restent dus au titre de l'échéance du ${due} (${delay}). ${closing[stage.level] || ''}`.trim(),
  };
};