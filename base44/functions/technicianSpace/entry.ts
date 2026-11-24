import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeEmail } from '../../shared/memberInvite.ts';

/**
 * Espace technicien : ne renvoie que les interventions affectées au compte connecté
 * (comparaison insensible à la casse) et les informations utiles pour les réaliser.
 * Les documents techniques sont limités aux immeubles où il intervient.
 */
const DEFAULTS: Record<string, any> = {
  access_tech: 'complet',
  r_tech_interventions: true,
  r_tech_tickets: true,
  r_tech_docs: true,
  r_tech_reports: true,
};

const pageItems = (page: any) => (Array.isArray(page) ? page : page?.items || []);

const addressOf = (building: any) =>
  building
    ? [building.address, [building.postal_code, building.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ')
    : '';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const service = base44.asServiceRole.entities;
    const email = normalizeEmail(user.email);

    let provider = pageItems(await service.Provider.filter({ email }, { limit: 1 }))[0] || null;
    if (!provider) {
      const all = pageItems(await service.Provider.list({ limit: 500 }));
      provider = all.find((row: any) => normalizeEmail(row.email) === email) || null;
    }

    const emails = [
      ...new Set(
        [
          email,
          normalizeEmail(provider?.email),
          String(user.email || '').trim(),
          String(provider?.email || '').trim(),
        ].filter(Boolean),
      ),
    ];

    const assigned = pageItems(
      await service.Intervention.filter(
        { provider_email: { $in: emails } },
        { sort: 'scheduled_date', limit: 200 },
      ),
    );

    // Mise à jour d'une intervention affectée : le périmètre est revérifié côté serveur.
    if (body.action === 'update') {
      const id = String(body.id || '').trim();
      const target = assigned.find((row: any) => row.id === id);
      if (!target) {
        return Response.json({ error: "Cette intervention ne vous est pas affectée." }, { status: 403 });
      }
      const patch: any = {};
      if (['en_cours', 'terminee'].includes(String(body.status || ''))) patch.status = String(body.status);
      if (body.report !== undefined) patch.report = String(body.report || '').slice(0, 4000);
      if (patch.status === 'terminee') patch.completed_date = new Date().toISOString().slice(0, 10);
      if (!Object.keys(patch).length) return Response.json({ error: 'Aucune modification.' }, { status: 400 });
      await service.Intervention.update(target.id, patch);
      return Response.json({ ok: true, id: target.id, status: patch.status || target.status });
    }

    const syndicId = provider?.syndic_id || assigned[0]?.syndic_id || '';
    const settings = { ...DEFAULTS };
    if (syndicId) {
      const row = pageItems(await service.SyndicSettings.filter({ syndic_id: syndicId }, { limit: 1 }))[0];
      if (row) {
        Object.keys(DEFAULTS).forEach((key) => {
          if (row[key] !== undefined && row[key] !== null && row[key] !== '') settings[key] = row[key];
        });
      }
    }

    const blocked = settings.access_tech === 'bloque';
    const showInterventions = !blocked && settings.r_tech_interventions !== false;
    const visible = showInterventions ? assigned : [];
    const buildingIds = [...new Set(visible.map((row: any) => row.building_id).filter(Boolean))];
    const ticketIds = [...new Set(visible.map((row: any) => row.ticket_id).filter(Boolean))];

    const [buildingsPage, ticketsPage, documentsPage, syndic] = await Promise.all([
      buildingIds.length ? service.Building.filter({ id: { $in: buildingIds } }, { limit: 50 }) : { items: [] },
      !blocked && settings.r_tech_tickets !== false && ticketIds.length
        ? service.Ticket.filter({ id: { $in: ticketIds } }, { limit: 100 })
        : { items: [] },
      !blocked && settings.r_tech_docs !== false && buildingIds.length
        ? service.Document.filter(
            { building_id: { $in: buildingIds }, category: 'technique' },
            { limit: 80, sort: '-created_date' },
          )
        : { items: [] },
      syndicId
        ? service.Syndic.get(syndicId).catch((e) => (e.status === 404 ? null : Promise.reject(e)))
        : null,
    ]);

    const buildingById = new Map(pageItems(buildingsPage).map((row: any) => [row.id, row]));
    const ticketById = new Map(pageItems(ticketsPage).map((row: any) => [row.id, row]));

    return Response.json({
      blocked,
      caps: {
        interventions: showInterventions,
        tickets: !blocked && settings.r_tech_tickets !== false,
        docs: !blocked && settings.r_tech_docs !== false,
        reports: !blocked && settings.r_tech_reports !== false,
      },
      provider: provider
        ? {
            id: provider.id,
            name: provider.name || '',
            contact_name: provider.contact_name || '',
            specialty: provider.specialty || '',
            email: provider.email || '',
            phone: provider.phone || '',
            status: provider.status || '',
          }
        : null,
      syndic: syndic
        ? { name: syndic.name || '', email: syndic.contact_email || '', phone: syndic.phone || '' }
        : null,
      interventions: visible.map((row: any) => {
        const building = buildingById.get(row.building_id);
        const ticket = ticketById.get(row.ticket_id);
        return {
          id: row.id,
          title: row.title || '',
          description: row.description || '',
          kind: row.kind || '',
          origin: row.origin || '',
          priority: row.priority || 'normale',
          status: row.status || 'planifiee',
          scheduled_date: row.scheduled_date || '',
          scheduled_time: row.scheduled_time || '',
          duration_minutes: row.duration_minutes || 0,
          completed_date: row.completed_date || '',
          report: row.report || '',
          contact_email: row.contact_email || '',
          building_name: row.building_name || building?.name || '',
          building_address: addressOf(building),
          ticket: ticket
            ? {
                id: ticket.id,
                title: ticket.title || '',
                description: ticket.description || '',
                requester_name: ticket.requester_name || '',
                status: ticket.status || '',
              }
            : null,
        };
      }),
      documents: pageItems(documentsPage).map((row: any) => ({
        id: row.id,
        title: row.title || '',
        category: row.category || '',
        file_uri: row.file_uri || '',
        published_date: row.published_date || row.created_date || '',
        building_name: buildingById.get(row.building_id)?.name || '',
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}