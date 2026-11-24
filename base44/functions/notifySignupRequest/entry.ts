import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const ALERT_RECIPIENT = 'smartsyndic@hotmail.com';
const APP_URL = 'https://smartsyndic.base44.app';
const MAX_AGE_MS = 60 * 60 * 1000;

const KIND_LABELS: Record<string, string> = {
  professionnel: 'Syndic professionnel',
  benevole: 'Syndic bénévole',
  cooperatif: 'Syndic coopératif',
};

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Prévient l'équipe par email dès qu'une fiche d'inscription est déposée.
 * Appelée juste après l'enregistrement public : l'envoi ne bloque jamais
 * l'enregistrement, et une demande ne déclenche qu'une seule alerte.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const requestId = String(body.request_id || '').trim();
    if (!requestId) return Response.json({ error: 'request_id requis' }, { status: 400 });

    const service = base44.asServiceRole.entities;
    const request = await service.SignupRequest.get(requestId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!request) return Response.json({ error: 'Demande introuvable.' }, { status: 404 });

    if (request.alert_sent_at) return Response.json({ sent: false, reason: 'deja_notifiee' });

    const created = new Date(request.created_date || '').getTime();
    if (!Number.isFinite(created) || Date.now() - created > MAX_AGE_MS) {
      return Response.json({ sent: false, reason: 'demande_ancienne' });
    }

    const variables = {
      syndic_name: request.syndic_name || 'Cabinet sans nom',
      syndic_kind: KIND_LABELS[request.syndic_kind] || 'Syndic',
      contact_name: request.contact_name || 'Référent non renseigné',
      email: request.email || '—',
      phone: request.phone || '—',
      city: request.city || '—',
      buildings_count:
        request.buildings_count === 0 || request.buildings_count
          ? String(request.buildings_count)
          : '—',
      received_on: new Date(request.created_date || Date.now()).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      message: request.message || 'Aucun message complémentaire.',
      request_url: `${APP_URL}/demandes-inscription`,
    };

    const send = async (to: string) => {
      try {
        const result = await base44.asServiceRole.integrations.Core.SendEmail({
          to,
          template_name: 'NouvelleInscription',
          category: 'transactional',
          from_name: 'Smartsyndic',
          variables,
        });
        if (result?.success === false) return { ok: false, reason: result.reason || result.message };
        return { ok: true, reason: '' };
      } catch (error: any) {
        return { ok: false, reason: error?.message };
      }
    };

    const direct = await send(ALERT_RECIPIENT);
    if (direct.ok) {
      await service.SignupRequest.update(requestId, { alert_sent_at: today() }).catch(() => null);
      return Response.json({ sent: true, recipient: ALERT_RECIPIENT });
    }

    // Adresse de l'équipe non joignable (domaine d'envoi non vérifié) :
    // on prévient les comptes administrateurs, qui sont des utilisateurs inscrits.
    const admins = await service.User.filter({ role: 'admin' }).catch(() => []);
    const recipients = (Array.isArray(admins) ? admins : [])
      .map((item: any) => String(item?.email || '').trim())
      .filter((email: string) => email && email.toLowerCase() !== ALERT_RECIPIENT.toLowerCase())
      .slice(0, 3);

    for (const email of recipients) {
      const attempt = await send(email);
      if (attempt.ok) {
        await service.SignupRequest.update(requestId, { alert_sent_at: today() }).catch(() => null);
        return Response.json({ sent: true, recipient: email, fallback: true });
      }
    }

    return Response.json({
      sent: false,
      reason: direct.reason || 'envoi_impossible',
      recipient: ALERT_RECIPIENT,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}