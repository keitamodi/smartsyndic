import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const HISTORY_YEARS = 3;

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

    const email = String(user.email).trim();
    const service = base44.asServiceRole.entities;

    const [ownedLots, residents] = await Promise.all([
      service.Lot.filter({ owner_email: email }, { limit: 100 }),
      service.Resident.filter({ email }, { limit: 20 }),
    ]);

    const residentIds = (residents.items || []).map((row) => row.id);
    const linkedLots = residentIds.length
      ? await service.Lot.filter({ resident_id: { $in: residentIds } }, { limit: 100 })
      : { items: [] };

    const lotsMap = new Map();
    [...(ownedLots.items || []), ...(linkedLots.items || [])].forEach((lot) => lotsMap.set(lot.id, lot));
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

    return Response.json({
      lots,
      buildings,
      invoices,
      payments,
      assemblies: assembliesByBuilding.flatMap((page) =>
        (page.items || []).map((row) => ({
          id: row.id,
          building_id: row.building_id,
          date: row.date,
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