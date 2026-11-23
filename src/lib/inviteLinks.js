// Les liens suivent l'environnement courant (aperçu, production, domaine personnalisé).
export const SITE_URL =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://smartsyndic.base44.app';
export const INVITE_DAYS = 30;

export const inviteLink = (token) =>
  `${SITE_URL}/register?invite=${encodeURIComponent(String(token || ''))}`;

export const smsHref = (phone, message) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  return `sms:${digits}${message ? `?&body=${encodeURIComponent(message)}` : ''}`;
};

export function inviteMessage({ kindLabel, buildingName, lotNumbers, link, days = INVITE_DAYS }) {
  const role = String(kindLabel || 'membre').toLowerCase();
  const place = buildingName ? ` pour ${buildingName}` : '';
  const lots = lotNumbers ? ` (lots ${lotNumbers})` : '';
  return `Votre syndic vous invite à rejoindre SyndicVibe comme ${role}${place}${lots}. Créez votre mot de passe ici : ${link}. Lien valable ${days} jours.`;
}