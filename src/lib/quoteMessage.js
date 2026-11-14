import { WORK_TYPE } from '@/lib/constants';

export function buildQuoteMessage(request, companyName) {
  if (!request) return { subject: '', body: '' };
  const lines = [
    `Bonjour${companyName ? ` ${companyName}` : ''},`,
    '',
    'Nous vous sollicitons pour une demande de devis dans le cadre de la gestion d’une copropriété.',
    '',
    `Objet : ${request.title}`,
    `Type de travaux : ${WORK_TYPE[request.work_type] || 'Travaux'}`,
  ];
  if (request.building_name) lines.push(`Immeuble : ${request.building_name}`);
  if (request.city || request.postal_code) {
    lines.push(`Localisation : ${[request.postal_code, request.city].filter(Boolean).join(' ')}`);
  }
  if (request.deadline) lines.push(`Date souhaitée de remise des devis : ${request.deadline}`);
  if (request.budget_max) lines.push(`Budget indicatif : ${request.budget_max} €`);
  lines.push('', 'Description du besoin :', request.description || '—', '');
  const photos = request.photos || [];
  if (photos.length > 0) lines.push(`${photos.length} photo(s) du site sont disponibles sur demande.`, '');
  lines.push(
    'Merci de nous répondre avec le montant total, le délai d’exécution, la durée de validité et vos conditions.',
    '',
    'Bien cordialement,',
    'Le service gestion de copropriété',
  );
  return { subject: `Demande de devis — ${request.title}`, body: lines.join('\n') };
}