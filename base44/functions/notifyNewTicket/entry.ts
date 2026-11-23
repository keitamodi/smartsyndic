import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const APP_URL = 'https://smartsyndic.base44.app';
const PRIORITY_LABELS: Record<string, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

/**
 * Prévient le gestionnaire par email dès qu'un copropriétaire signale un incident.
 * Seul le demandeur de la demande peut déclencher l'alerte.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ticketId = String(body.ticket_id || '').trim();
    if (!ticketId) return Response.json({ error: 'ticket_id requis' }, { status: 400 });

    const service = base44.asServiceRole.entities;
    const ticket = await service.Ticket.get(ticketId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!ticket) return Response.json({ error: 'Demande introuvable.' }, { status: 404 });

    const requester = String(ticket.requester_email || '').toLowerCase();
    if (requester !== String(user.email).toLowerCase()) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const syndic = ticket.syndic_id
      ? await service.Syndic.get(ticket.syndic_id).catch(() => null)
      : null;

    let recipient = String(syndic?.contact_email || '').trim();
    if (!recipient && syndic?.created_by_id) {
      const owner = await service.User.get(syndic.created_by_id).catch(() => null);
      recipient = String(owner?.email || '').trim();
    }
    if (!recipient) return Response.json({ sent: false, reason: 'syndic_sans_email' });

    const variables = {
      syndic_name: syndic?.name || 'votre cabinet',
      building_name: ticket.building_name || 'votre immeuble',
      lot_number: ticket.lot_number || '—',
      ticket_title: ticket.title || 'Nouvelle demande',
      description: ticket.description || 'Aucun détail complémentaire.',
      priority_label: PRIORITY_LABELS[ticket.priority] || 'Normale',
      requester_name: ticket.requester_name || 'Un copropriétaire',
      requester_email: ticket.requester_email || '',
      ticket_url: `${APP_URL}/tickets`,
    };

    // Notification dans l'app : visible même si l'email est refusé.
    await service.Notification.create({
      syndic_id: ticket.syndic_id || '',
      recipient_email: recipient,
      title: `Nouvelle demande : ${variables.ticket_title}`,
      message: `${variables.requester_name} — ${variables.building_name}, lot ${variables.lot_number}`,
      kind: 'ticket',
      read: false,
      link: '/tickets',
    }).catch(() => null);

    try {
      const result = await base44.asServiceRole.integrations.Core.SendEmail({
        to: recipient,
        template_name: 'NouvelleDemande',
        category: 'transactional',
        from_name: syndic?.name || 'Smartsyndic',
        variables,
      });
      if (result?.success === false) {
        return Response.json({ sent: false, reason: result.reason || 'envoi_refuse', recipient });
      }
      return Response.json({ sent: true, recipient });
    } catch (error: any) {
      return Response.json({ sent: false, reason: error?.message || 'envoi_impossible', recipient });
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}