import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeEmail } from '../../shared/memberInvite.ts';

const HISTORY_YEARS = 3;

const pageItems = (page: any) => (Array.isArray(page) ? page : page?.items || []);

const yearsAgo = (years) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().slice(0, 10);
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = normalizeEmail(user.email);
    const service = base44.asServiceRole.entities;

    const [ownedLotsPage, residentsPage] = await Promise.all([
      service.Lot.filter({ owner_email: email }, { limit: 100 }),
      service.Resident.filter({ email }, { limit: 20 }),
    ]);

    // Les fiches sont saisies à la main : on complète par une comparaison insensible à la casse.
    let residentRows = pageItems(residentsPage);
    if (!residentRows.length) {
      const all = pageItems(await service.Resident.list({ limit: 500 }));
      residentRows = all.filter((row: any) => normalizeEmail(row.email) === email);
    }

    let ownedLots = pageItems(ownedLotsPage);
    if (!ownedLots.length) {
      const allLots = pageItems(await service.Lot.list({ limit: 500 }));
      ownedLots = allLots.filter((lot: any) => normalizeEmail(lot.owner_email) === email);
    }

    const residentIds = residentRows.map((row: any) => row.id);
    const linkedLots = residentIds.length
      ? await service.Lot.filter({ resident_id: { $in: residentIds } }, { limit: 100 })
      : { items: [] };

    const lotsMap = new Map();
    [...ownedLots, ...pageItems(linkedLots)].forEach((lot: any) => lotsMap.set(lot.id, lot));
    const lots = [...lotsMap.values()];

    const buildingIds = [...new Set(lots.map((lot) => lot.building_id).filter(Boolean))];
    const buildings = buildingIds.length
      ? (await service.Building.filter({ id: { $in: buildingIds } }, { limit: 50 })).items || []
      : [];

    const pairs = lots.filter((lot) => lot.building_id && lot.number);
    const invoiceGroups = await Promise.all(
      pairs.map((lot) => service.Invoice.filter({ building_id: lot.building_id, lot_number: lot.number }, { limit: 200 })),
    );
    const invoiceMap = new Map();
    invoiceGroups.flatMap((page) => page.items || []).forEach((invoice) => invoiceMap.set(invoice.id, invoice));
    const invoices = [...invoiceMap.values()]
      .filter((row) => !row.issue_date || row.issue_date >= yearsAgo(HISTORY_YEARS))
      .sort((a, b) => String(b.issue_date || '').localeCompare(String(a.issue_date || '')));

    const payments = invoices.length
      ? (await service.Payment.filter({ invoice_id: { $in: invoices.map((row) => row.id) } }, { limit: 300 })).items || []
      : [];

    const assembliesByBuilding = await Promise.all(
      buildings.map((building) => service.Assembly.filter({ building_id: building.id }, { limit: 50 })),
    );
    const lotsByBuilding = await Promise.all(
      buildings.map((building) => service.Lot.filter({ building_id: building.id }, { limit: 300 })),
    );

    const [documentsPage, byEmailTickets, byAuthorTickets] = await Promise.all([
      buildingIds.length
        ? service.Document.filter(
            { building_id: { $in: buildingIds }, visible_residents: true },
            { limit: 80, sort: '-created_date' },
          )
        : { items: [] },
      service.Ticket.filter({ requester_email: email }, { limit: 50, sort: '-created_date' }),
      service.Ticket.filter({ created_by_id: user.id }, { limit: 50, sort: '-created_date' }),
    ]);

    const ticketsMap = new Map();
    [...(byEmailTickets.items || []), ...(byAuthorTickets.items || [])].forEach((ticket) => ticketsMap.set(ticket.id, ticket));
    const tickets = [...ticketsMap.values()].sort((a, b) =>
      String(b.created_date || '').localeCompare(String(a.created_date || '')),
    );

    const syndicIds = [...new Set(buildings.map((building) => building.syndic_id).filter(Boolean))];
    const syndics = syndicIds.length
      ? (await service.Syndic.filter({ id: { $in: syndicIds } }, { limit: 5 })).items || []
      : [];
    const mySyndic = syndics[0];

    return Response.json({
      lots,
      buildings,
      invoices,
      payments,
      documents: (documentsPage.items || []).map((row) => ({
        id: row.id,
        building_id: row.building_id,
        title: row.title,
        category: row.category,
        published_date: row.published_date || row.created_date,
        summary: row.summary,
        file_uri: row.file_uri,
      })),
      tickets: tickets.map((row) => ({
        id: row.id,
        title: row.title,
        building_name: row.building_name,
        lot_number: row.lot_number,
        status: row.status,
        priority: row.priority,
        created_date: row.created_date,
        due_date: row.due_date,
        closed_date: row.closed_date,
        resolution_note: row.resolution_note,
        assigned_name: row.assigned_name,
      })),
      syndic: mySyndic
        ? {
            name: mySyndic.name,
            kind: mySyndic.kind,
            email: mySyndic.contact_email,
            phone: mySyndic.phone,
            address: mySyndic.address,
            postal_code: mySyndic.postal_code,
            city: mySyndic.city,
          }
        : null,
      assemblies: assembliesByBuilding.flatMap((page) =>
        (page.items || []).map((row) => ({
          id: row.id,
          building_id: row.building_id,
          title: row.title,
          kind: row.kind,
          date: row.date,
          time: row.time,
          location: row.location,
          status: row.status,
          convocation_sent: row.convocation_sent,
          minutes_uri: row.minutes_uri,
          created_date: row.created_date,
          budget_amount: row.budget_amount,
        })),
      ),
      buildingLots: buildings.map((building, index) => ({
        building_id: building.id,
        lots: (lotsByBuilding[index]?.items || []).map((lot) => ({
          id: lot.id,
          number: lot.number,
          tantiemes: lot.tantiemes,
        })),
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}