import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { round2 } from '@/lib/appelFonds';

const FONDS_RATE = 0.05;

const sumTantiemes = (list = []) => list.reduce((sum, lot) => sum + (Number(lot.tantiemes) || 0), 0);

const buildFonds = (lots, buildings, assemblies, buildingLots) => {
  const fonds = [];
  buildings.forEach((building) => {
    const budgeted = assemblies.filter((row) => row.building_id === building.id && Number(row.budget_amount) > 0);
    const totals = buildingLots.find((row) => row.building_id === building.id)?.lots || [];
    const total = sumTantiemes(totals);
    const myTantiemes = sumTantiemes(lots.filter((lot) => lot.building_id === building.id));
    if (!budgeted.length || !total || !myTantiemes) return;
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
  });
  return fonds.sort((a, b) => b.year - a.year);
};

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
    assemblies: [],
    documents: [],
    tickets: [],
    syndic: null,
  });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const me = await base44.auth.me();
        const response = await base44.functions.invoke('residentSpace', {});
        const data = response?.data || {};
        const lots = data.lots || [];
        const buildings = data.buildings || [];
        const invoices = data.invoices || [];
        const payments = data.payments || [];
        const fonds = buildFonds(lots, buildings, data.assemblies || [], data.buildingLots || []);

        if (active) {
          setState({
            loading: false,
            error: data.error || '',
            me,
            lots,
            buildings,
            invoices,
            payments,
            fonds,
            assemblies: data.assemblies || [],
            documents: data.documents || [],
            tickets: data.tickets || [],
            syndic: data.syndic || null,
          });
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