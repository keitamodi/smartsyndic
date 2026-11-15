import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { round2 } from '@/lib/appelFonds';

const FONDS_RATE = 0.05;
const HISTORY_YEARS = 3;

const yearsAgo = (years) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().slice(0, 10);
};

const fetchAll = async (entity, query, limit = 200) => {
  const page = await base44.entities[entity].filter(query, { limit });
  return page.items || [];
};

const sumTantiemes = (list = []) => list.reduce((sum, lot) => sum + (Number(lot.tantiemes) || 0), 0);

export default function useResidentSpace() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    me: null,
    lots: [],
    buildings: [],
    invoices: [],
    payments: [],
    fonds: [],
  });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const me = await base44.auth.me();
        const email = (me?.email || '').trim();
        if (!email) {
          if (active) setState((prev) => ({ ...prev, loading: false, me }));
          return;
        }

        const [ownedLots, residents] = await Promise.all([
          fetchAll('Lot', { owner_email: email }, 100),
          fetchAll('Resident', { email }, 20),
        ]);

        const residentIds = residents.map((row) => row.id);
        const linkedLots = residentIds.length
          ? await fetchAll('Lot', { resident_id: { $in: residentIds } }, 100)
          : [];

        const lotsMap = new Map();
        [...ownedLots, ...linkedLots].forEach((lot) => lotsMap.set(lot.id, lot));
        const lots = [...lotsMap.values()];

        const buildingIds = [...new Set(lots.map((lot) => lot.building_id).filter(Boolean))];
        const buildings = buildingIds.length
          ? await fetchAll('Building', { id: { $in: buildingIds } }, 50)
          : [];

        const invoiceGroups = await Promise.all(
          lots
            .filter((lot) => lot.building_id && lot.number)
            .map((lot) => fetchAll('Invoice', { building_id: lot.building_id, lot_number: lot.number }, 200)),
        );
        const invoiceMap = new Map();
        invoiceGroups.flat().forEach((invoice) => invoiceMap.set(invoice.id, invoice));
        const invoices = [...invoiceMap.values()]
          .filter((row) => !row.issue_date || row.issue_date >= yearsAgo(HISTORY_YEARS))
          .sort((a, b) => String(b.issue_date || '').localeCompare(String(a.issue_date || '')));

        const payments = invoices.length
          ? await fetchAll('Payment', { invoice_id: { $in: invoices.map((row) => row.id) } }, 300)
          : [];

        const fonds = [];
        for (const building of buildings) {
          const [assemblies, buildingLots] = await Promise.all([
            fetchAll('Assembly', { building_id: building.id }, 50),
            fetchAll('Lot', { building_id: building.id }, 300),
          ]);
          const budgeted = assemblies.filter((row) => Number(row.budget_amount) > 0);
          const total = sumTantiemes(buildingLots);
          const myTantiemes = sumTantiemes(lots.filter((lot) => lot.building_id === building.id));
          if (!budgeted.length || !total || !myTantiemes) continue;
          const share = myTantiemes / total;
          budgeted.forEach((assembly) => {
            const budget = Number(assembly.budget_amount) || 0;
            const year = new Date(assembly.date || assembly.created_date || Date.now()).getFullYear();
            fonds.push({
              id: `${building.id}-${assembly.id}`,
              building,
              assembly,
              year,
              budget,
              share,
              amount: round2(budget * FONDS_RATE * share),
            });
          });
        }
        fonds.sort((a, b) => b.year - a.year);

        if (active) {
          setState({ loading: false, error: '', me, lots, buildings, invoices, payments, fonds });
        }
      } catch (failure) {
        if (active) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: failure?.message || "Impossible de charger votre espace.",
          }));
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return state;
}

export const isSettled = (invoice) =>
  invoice?.status === 'payee' || (Number(invoice?.paid_amount) || 0) >= (Number(invoice?.amount) || 0) * 0.999;

export const paidOn = (invoice, payments = []) => {
  const rows = payments
    .filter((row) => row.invoice_id === invoice?.id)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return rows[0]?.date || invoice?.updated_date || invoice?.issue_date;
};