import { base44 } from '@/api/base44Client';
import { logAction, notify } from '@/lib/audit';
import { formatEUR } from '@/lib/format';
import { isLate, outstandingOf, reminderMessage, stageOf, todayISO } from '@/lib/impayes';

/** Retrouve l'email du copropriétaire concerné quand la facture n'en porte pas. */
async function ownerEmailOf(invoice) {
  if (invoice?.recipient_email) return invoice.recipient_email;
  if (!invoice?.building_id || !invoice?.lot_number) return '';
  const page = await base44.entities.Lot.filter(
    { building_id: invoice.building_id, number: invoice.lot_number },
    { limit: 1 },
  );
  return page.items?.[0]?.owner_email || '';
}

/**
 * Relance en un clic du copropriétaire ou propriétaire concerné par une facture
 * ou un appel de fonds : notification au destinataire, montée d'un cran dans
 * l'échelle de relance et trace dans l'historique.
 */
export async function relancerFacture({ syndicId, invoice }) {
  const stage = stageOf(invoice);
  const email = await ownerEmailOf(invoice);
  const { title, message } = reminderMessage(invoice, stage);
  const status = isLate(invoice) ? 'en_retard' : invoice.status === 'brouillon' ? 'envoyee' : invoice.status;

  await base44.entities.Invoice.update(invoice.id, {
    reminder_level: Math.min((Number(invoice.reminder_level) || 0) + 1, 3),
    last_reminder_at: todayISO(),
    status,
    ...(email && !invoice.recipient_email ? { recipient_email: email } : {}),
  });

  if (email) {
    await notify({ syndicId, recipientEmail: email, title, message, kind: 'facture', link: '/mon-espace' });
  }

  await logAction({
    syndicId,
    action: stage.label,
    entity: 'Facture',
    entityLabel: invoice.reference,
    details: `${formatEUR(outstandingOf(invoice), 2)} · ${email || 'destinataire non renseigné'}`,
  });

  return { stage, notified: Boolean(email), email };
}