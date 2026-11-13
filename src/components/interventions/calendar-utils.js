export const WEEKDAYS_SHORT = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

export const WEEKDAYS_LONG = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export const PRIORITY_ORDER = ['urgente', 'haute', 'normale', 'basse'];

export const DAY_FIRST = 6 * 60;
export const DAY_LAST = 23 * 60 + 30;
export const STEP = 30;

const pad = (value) => String(value).padStart(2, '0');

export const isoDay = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const startMinutes = (intervention) => {
  const [hours, minutes] = String(intervention?.scheduled_time || '09:00').split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 9) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

export const endMinutes = (intervention) => {
  const duration = Number(intervention?.duration_minutes) || 60;
  return Math.min(DAY_LAST + 30, startMinutes(intervention) + duration);
};

export const formatMinutes = (value) => `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;

export const formatRange = (intervention) =>
  `${formatMinutes(startMinutes(intervention))} – ${formatMinutes(endMinutes(intervention))}`;

export const durationLabel = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1).replace('.', ',')} h`;
};

export const daysUntil = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};