import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const WORK_TYPES = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  toiture: 'Toiture & façades',
  chauffage: 'Chauffage',
  ascenseur: 'Ascenseur',
  ravalement: 'Ravalement',
  espaces_verts: 'Espaces verts',
  nettoyage: 'Nettoyage',
  autre: 'Travaux divers',
};

function buildBody(request, invite) {
  const lines = [
    `Bonjour ${invite.company_name},`,
    '',
    'Nous vous sollicitons pour une demande de devis dans le cadre de la gestion d’une copropriété.',
    '',
    `Objet : ${request.title}`,
    `Type de travaux : ${WORK_TYPES[request.work_type] || 'Travaux'}`,
  ];
  if (request.building_name) lines.push(`Immeuble : ${request.building_name}`);
  if (request.city || request.postal_code) {
    lines.push(`Localisation : ${[request.postal_code, request.city].filter(Boolean).join(' ')}`);
  }
  if (request.deadline) lines.push(`Date souhaitée de remise des devis : ${request.deadline}`);
  if (request.budget_max) lines.push(`Budget indicatif : ${request.budget_max} €`);
  lines.push('', 'Description du besoin :', request.description || '—', '');
  if ((request.photos || []).length > 0) {
    lines.push(`${request.photos.length} photo(s) du site sont disponibles sur demande.`, '');
  }
  lines.push(
    'Merci de nous répondre par retour de courriel (ou par téléphone) avec :',
    '- le montant total de votre devis,',
    '- le délai d’exécution,',
    '- la durée de validité et vos conditions,',
    '- votre devis en pièce jointe si disponible.',
    '',
    'Bien cordialement,',
    'Le service gestion de copropriété',
  );
  return lines.join('\n');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requestId = body.request_id;
    const inviteIds = Array.isArray(body.invite_ids) ? body.invite_ids.slice(0, 20) : [];
    if (!requestId || inviteIds.length === 0) {
      return Response.json({ error: 'Sélectionnez au moins une entreprise.' }, { status: 400 });
    }

    const request = await base44.entities.QuoteRequest.get(requestId).catch((e) =>
      e.status === 404 ? null : Promise.reject(e),
    );
    if (!request) return Response.json({ error: 'Demande introuvable.' }, { status: 404 });

    const result = await base44.entities.QuoteInvite.filter(
      { request_id: requestId, id: { $in: inviteIds } },
      { limit: 20 },
    );
    const invites = Array.isArray(result) ? result : result.items || [];

    const subject = `Demande de devis — ${request.title}`;
    const results = [];

    for (let index = 0; index < invites.length; index += 6) {
      const chunk = invites.slice(index, index + 6);
      const settled = await Promise.allSettled(
        chunk.map(async (invite) => {
          if (!invite.company_email) {
            await base44.entities.QuoteInvite.update(invite.id, {
              channel: 'telephone',
              status: 'a_contacter',
              last_contact_at: new Date().toISOString().slice(0, 10),
            });
            return { id: invite.id, status: 'sans_email' };
          }
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: invite.company_email,
            subject,
            body: buildBody(request, invite),
            from_name: 'SyndicVibe',
          });
          await base44.entities.QuoteInvite.update(invite.id, {
            channel: 'email',
            status: 'envoyee',
            sent_at: new Date().toISOString().slice(0, 10),
          });
          return { id: invite.id, status: 'envoye' };
        }),
      );
      settled.forEach((entry, position) => {
        if (entry.status === 'fulfilled') results.push(entry.value);
        else results.push({ id: chunk[position].id, status: 'echec', error: entry.reason?.message || 'Envoi impossible' });
      });
    }

    const sent = results.filter((entry) => entry.status === 'envoye').length;
    if (sent > 0 && request.status !== 'reponses_recues') {
      await base44.entities.QuoteRequest.update(requestId, { status: 'envoyee' });
    }

    return Response.json({ results, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}