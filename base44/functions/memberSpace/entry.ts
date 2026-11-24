import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeEmail } from '../../shared/memberInvite.ts';

/**
 * Espace des membres (copropriétaires, propriétaires, techniciens) :
 * - lecture des messages de leur conversation Agent IA (la lecture directe est
 *   réservée à l'équipe du cabinet par les règles de données) ;
 * - fil de discussion avec le syndic, créé au premier message.
 * Chaque appel est borné au compte connecté : aucun identifiant d'un autre
 * membre n'est accepté.
 */
const pageItems = (page: any) => (Array.isArray(page) ? page : page?.items || []);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'thread');
    const service = base44.asServiceRole.entities;
    const email = normalizeEmail(user.email);

    if (action === 'agentMessages') {
      const conversationId = String(body.conversation_id || '').trim();
      if (!conversationId) return Response.json({ error: 'conversation_id requis.' }, { status: 400 });
      const conversation = await service.Conversation.get(conversationId).catch((e) =>
        e.status === 404 ? null : Promise.reject(e),
      );
      if (!conversation || normalizeEmail(conversation.user_email) !== email) {
        return Response.json({ error: 'Conversation introuvable.' }, { status: 404 });
      }
      const messages = pageItems(
        await service.Message.filter({ conversation_id: conversationId }, { sort: 'created_date', limit: 200 }),
      );
      return Response.json({
        messages: messages.map((row: any) => ({
          id: row.id,
          role: row.role,
          content: row.content,
          created_date: row.created_date,
        })),
      });
    }

    const [providerRows, residentRows] = await Promise.all([
      service.Provider.filter({ email }, { limit: 5 }),
      service.Resident.filter({ email }, { limit: 5 }),
    ]);
    let provider = pageItems(providerRows)[0] || null;
    let resident = pageItems(residentRows)[0] || null;

    // Les fiches sont saisies à la main : on complète par une comparaison insensible à la casse.
    if (!provider || !resident) {
      const [allProviders, allResidents] = await Promise.all([
        provider ? { items: [] } : service.Provider.list({ limit: 500 }),
        resident ? { items: [] } : service.Resident.list({ limit: 500 }),
      ]);
      if (!provider) {
        provider = pageItems(allProviders).find((row: any) => normalizeEmail(row.email) === email) || null;
      }
      if (!resident) {
        resident = pageItems(allResidents).find((row: any) => normalizeEmail(row.email) === email) || null;
      }
    }

    const syndicId = String(provider?.syndic_id || resident?.syndic_id || '').trim();
    if (!syndicId) {
      return Response.json({ error: "Votre compte n'est rattaché à aucun cabinet pour le moment." }, { status: 400 });
    }

    const displayName =
      resident?.full_name || provider?.contact_name || provider?.name || user.full_name || user.email;
    const contactKind = provider ? 'technicien' : 'coproprietaire';

    const threads = pageItems(await service.Thread.filter({ syndic_id: syndicId }, { sort: '-updated_date', limit: 300 }));
    let thread = threads.find((row: any) => normalizeEmail(row.contact_email) === email) || null;

    const text = String(body.body || '').trim();
    if (action === 'send') {
      if (!text) return Response.json({ error: 'Votre message est vide.' }, { status: 400 });
      if (text.length > 4000) {
        return Response.json({ error: 'Message trop long (4000 caractères maximum).' }, { status: 400 });
      }
      if (!thread) {
        let buildingName = '';
        if (resident?.building_id) {
          const building = await service.Building.get(resident.building_id).catch((e) =>
            e.status === 404 ? null : Promise.reject(e),
          );
          buildingName = building?.name || '';
        }
        thread = await service.Thread.create({
          syndic_id: syndicId,
          subject: 'Échange avec le syndic',
          contact_name: displayName,
          contact_email: String(user.email || '').trim(),
          contact_phone: resident?.phone || provider?.phone || '',
          contact_kind: contactKind,
          building_id: resident?.building_id || '',
          building_name: buildingName,
          status: 'ouvert',
          last_message: text.slice(0, 140),
          last_author: displayName,
          unread_count: 0,
        });
      }
      await service.ThreadMessage.create({
        syndic_id: syndicId,
        thread_id: thread.id,
        direction: 'entrant',
        author_name: displayName,
        author_kind: contactKind,
        body: text,
      });
      await service.Thread.update(thread.id, {
        last_message: text.slice(0, 140),
        last_author: displayName,
        status: 'ouvert',
      });
    }

    const messages = thread
      ? pageItems(await service.ThreadMessage.filter({ thread_id: thread.id }, { sort: 'created_date', limit: 300 }))
      : [];

    const syndic = await service.Syndic.get(syndicId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));

    return Response.json({
      thread: thread ? { id: thread.id, subject: thread.subject || '', status: thread.status || 'ouvert' } : null,
      messages: messages.map((row: any) => ({
        id: row.id,
        body: row.body,
        direction: row.direction,
        author_name: row.author_name || '',
        created_date: row.created_date,
      })),
      syndic: syndic
        ? { name: syndic.name || '', email: syndic.contact_email || '', phone: syndic.phone || '' }
        : null,
      contact: { name: displayName, kind: contactKind },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}