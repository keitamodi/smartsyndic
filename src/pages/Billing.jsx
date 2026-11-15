import { useMemo, useState } from 'react';
import { Banknote, Download, Plus, Receipt, Sparkles } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import AppelFondsDialog from '@/components/billing/AppelFondsDialog';
import { downloadAvisPdf } from '@/lib/appelFondsPdf';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction, notify } from '@/lib/audit';
import { formatDate, formatEUR, formatNumber } from '@/lib/format';
import {
  INVOICE_KIND,
  INVOICE_STATUS,
  options,
  PAYMENT_METHOD,
} from '@/lib/constants';

const EMPTY_INVOICE = {
  reference: '',
  building_id: '',
  kind: 'appel_fonds',
  lot_number: '',
  period: '',
  issue_date: '',
  due_date: '',
  amount: '',
  status: 'brouillon',
  recipient_email: '',
  notes: '',
};

const today = () => new Date().toISOString().slice(0, 10);

export default function Billing() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState({ amount: '', date: today(), method: 'virement', reference: '' });
  const [paymentError, setPaymentError] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [appelOpen, setAppelOpen] = useState(false);

  const query = useMemo(() => {
    const next = { syndic_id: syndicId };
    if (statusFilter) next.status = statusFilter;
    if (buildingFilter) next.building_id = buildingFilter;
    return next;
  }, [syndicId, statusFilter, buildingFilter]);

  const { items, loading, error, reload } = useCollection('Invoice', query, { enabled: !!syndicId, limit: 400 });
  const { items: payments, reload: reloadPayments } = useCollection('Payment', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const rows = items.filter((row) => {
    const haystack = `${row.reference} ${row.building_name} ${row.period} ${row.lot_number}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const totalAmount = items.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const totalPaid = items.reduce((sum, row) => sum + (Number(row.paid_amount) || 0), 0);
  const lateCount = items.filter((row) => row.status === 'en_retard').length;

  const fields = [
    { name: 'reference', label: 'Référence', required: true, placeholder: 'AF-2026-11-001' },
    {
      name: 'building_id',
      label: 'Immeuble',
      type: 'select',
      options: buildings.map((building) => ({ value: building.id, label: building.name })),
    },
    { name: 'kind', label: 'Type', type: 'select', options: options(INVOICE_KIND) },
    { name: 'lot_number', label: 'Lot concerné', placeholder: 'A12 (vide = tous les lots)' },
    { name: 'period', label: 'Période', placeholder: 'T4 2026' },
    { name: 'issue_date', label: 'Date d’émission', type: 'date' },
    { name: 'due_date', label: 'Date d’échéance', type: 'date' },
    { name: 'amount', label: 'Montant (€)', type: 'number', min: 0, step: '0.01', required: true },
    { name: 'status', label: 'Statut', type: 'select', options: options(INVOICE_STATUS) },
    { name: 'recipient_email', label: 'Email du destinataire', type: 'email' },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 3 },
  ];

  const saveInvoice = async (values) => {
    const building = buildings.find((item) => item.id === values.building_id);
    const payload = { ...values, building_name: building?.name || '' };
    if (editing) {
      await base44.entities.Invoice.update(editing.id, payload);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Facture', entityLabel: payload.reference });
    } else {
      await base44.entities.Invoice.create({ ...payload, syndic_id: syndicId, paid_amount: 0 });
      await logAction({ syndicId, action: 'Création', entity: 'Facture', entityLabel: payload.reference });
    }
    await reload();
  };

  const removeInvoice = async (row) => {
    await base44.entities.Invoice.delete(row.id);
    await reload();
  };

  const addPayment = async () => {
    const amount = Number(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError('Saisissez un montant valide.');
      return;
    }
    setSavingPayment(true);
    setPaymentError('');
    try {
      await base44.entities.Payment.create({
        syndic_id: syndicId,
        invoice_id: detail.id,
        building_id: detail.building_id,
        amount,
        date: payment.date || today(),
        method: payment.method,
        reference: payment.reference,
        status: 'recu',
      });
      const paid = (Number(detail.paid_amount) || 0) + amount;
      await base44.entities.Invoice.update(detail.id, {
        paid_amount: paid,
        status: paid >= (Number(detail.amount) || 0) ? 'payee' : 'partiellement_payee',
      });
      await logAction({
        syndicId,
        action: 'Paiement enregistré',
        entity: 'Facture',
        entityLabel: detail.reference,
        details: formatEUR(amount, 2),
      });
      await Promise.all([reload(), reloadPayments()]);
      setDetail({ ...detail, paid_amount: paid });
      setPayment({ amount: '', date: today(), method: 'virement', reference: '' });
      setPaymentOpen(false);
    } catch (paymentFailure) {
      setPaymentError(paymentFailure?.message || "L'enregistrement du paiement a échoué.");
    } finally {
      setSavingPayment(false);
    }
  };

  const markSent = async (invoice) => {
    await base44.entities.Invoice.update(invoice.id, { status: 'envoyee' });
    if (invoice.recipient_email) {
      await notify({
        syndicId,
        recipientEmail: invoice.recipient_email,
        title: `Nouvel appel de fonds : ${invoice.reference}`,
        message: `Un montant de ${formatEUR(invoice.amount, 2)} est dû au plus tard le ${formatDate(invoice.due_date)}.`,
        kind: 'facture',
        link: '/facturation',
      });
    }
    await reload();
  };

  const invoicePayments = detail ? payments.filter((row) => row.invoice_id === detail.id) : [];

  const byBuilding = buildings
    .map((building) => {
      const scoped = items.filter((row) => row.building_id === building.id);
      return {
        name: building.name,
        count: scoped.length,
        amount: scoped.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
        paid: scoped.reduce((sum, row) => sum + (Number(row.paid_amount) || 0), 0),
      };
    })
    .filter((row) => row.count > 0);

  return (
    <Page
      kicker="Finances"
      title="Facturation"
      description="Émettez les appels de fonds et factures par lot, enregistrez les paiements et suivez le recouvrement par immeuble."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setAppelOpen(true)}>
            <Sparkles className="h-4 w-4" />
            Appel de fonds en un clic
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>
      }
    >
      <StatStrip
        items={[
          { label: 'Montant appelé', value: formatEUR(totalAmount), hint: `${formatNumber(items.length)} document(s)` },
          { label: 'Encaissé', value: formatEUR(totalPaid), hint: totalAmount ? `${Math.round((totalPaid / totalAmount) * 100)} % du total` : '—' },
          { label: 'Reste à recouvrer', value: formatEUR(Math.max(totalAmount - totalPaid, 0)), hint: 'toutes échéances' },
          { label: 'En retard', value: formatNumber(lateCount), hint: 'relances à effectuer' },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une référence, un immeuble, une période…"
        filters={[
          {
            key: 'building',
            value: buildingFilter,
            onChange: setBuildingFilter,
            placeholder: 'Immeuble',
            allLabel: 'Tous les immeubles',
            options: buildings.map((building) => ({ value: building.id, label: building.name })),
          },
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(INVOICE_STATUS),
          },
        ]}
        columns={[
          {
            key: 'reference',
            header: 'Document',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.reference}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {INVOICE_KIND[row.kind] || '—'} · {row.period || 'période non précisée'}
                </p>
              </div>
            ),
          },
          {
            key: 'building',
            header: 'Immeuble / lot',
            render: (row) => (
              <span className="text-foreground/75">
                {row.building_name || '—'}
                {row.lot_number ? ` · ${row.lot_number}` : ''}
              </span>
            ),
          },
          { key: 'due_date', header: 'Échéance', render: (row) => formatDate(row.due_date) },
          {
            key: 'amount',
            header: 'Montant',
            render: (row) => (
              <div className="font-mono text-[12.5px] tnum">
                <p>{formatEUR(row.amount, 2)}</p>
                {row.paid_amount > 0 && (
                  <p className="text-[11px] text-emerald-700">payé {formatEUR(row.paid_amount, 2)}</p>
                )}
              </div>
            ),
          },
          { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={INVOICE_STATUS} /> },
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (row) => (
              <RowActions
                onView={() => setDetail(row)}
                onEdit={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
                onDelete={() => removeInvoice(row)}
                label={row.reference}
              />
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={setDetail}
        empty={{
          icon: Receipt,
          title: 'Aucune facture enregistrée',
          description: 'Créez un premier appel de fonds pour suivre les encaissements et les relances.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle facture
            </Button>
          ),
        }}
      />

      {byBuilding.length > 0 && (
        <section className="rounded-[24px] border border-border bg-card p-5">
          <h2 className="kicker mb-3">Situation par immeuble</h2>
          <ul className="divide-y divide-border/60">
            {byBuilding.map((row) => (
              <li key={row.name} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                <span className="font-medium text-foreground">{row.name}</span>
                <span className="font-mono text-[12px] text-muted-foreground tnum">
                  {formatEUR(row.paid, 2)} encaissés / {formatEUR(row.amount, 2)} appelés
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AppelFondsDialog
        open={appelOpen}
        onOpenChange={setAppelOpen}
        syndicId={syndicId}
        buildings={buildings}
        onGenerated={reload}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Modifier la facture' : 'Nouvelle facture'}
        description="Un appel de fonds peut cibler un lot précis ou l’ensemble de l’immeuble."
        fields={fields}
        initialValues={editing || EMPTY_INVOICE}
        onSubmit={saveInvoice}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
        notice="L’envoi par email nécessite un fournisseur d’envoi configuré. Sans configuration, une notification interne est créée."
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{detail?.reference}</DialogTitle>
            <DialogDescription>
              {INVOICE_KIND[detail?.kind] || ''} · {detail?.building_name || 'Immeuble non précisé'}
              {detail?.lot_number ? ` · Lot ${detail.lot_number}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5">
            <StatusBadge value={detail?.status} map={INVOICE_STATUS} />
            {detail?.period && <StatusBadge label={detail.period} tone="neutral" />}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-secondary/40 p-3 text-[12.5px]">
            <div>
              <p className="kicker !text-[9px]">Montant</p>
              <p className="mt-0.5 font-mono">{formatEUR(detail?.amount, 2)}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Encaissé</p>
              <p className="mt-0.5 font-mono">{formatEUR(detail?.paid_amount || 0, 2)}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Émission</p>
              <p className="mt-0.5">{formatDate(detail?.issue_date)}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Échéance</p>
              <p className="mt-0.5">{formatDate(detail?.due_date)}</p>
            </div>
          </div>

          <div>
            <p className="kicker mb-1.5">Paiements enregistrés</p>
            {invoicePayments.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">Aucun paiement enregistré.</p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
                {invoicePayments.map((row) => (
                  <li key={row.id} className="flex items-center justify-between px-3 py-2 text-[12.5px]">
                    <span>{formatDate(row.date)} · {PAYMENT_METHOD[row.method] || '—'}</span>
                    <span className="font-mono">{formatEUR(row.amount, 2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                downloadAvisPdf({
                  invoice: detail,
                  building: buildings.find((row) => row.id === detail.building_id),
                })
              }
            >
              <Download className="h-4 w-4" />
              Avis d’échéance PDF
            </Button>
            {['brouillon', 'envoyee'].includes(detail?.status) && (
              <Button variant="outline" onClick={() => markSent(detail)}>
                Marquer comme envoyée
              </Button>
            )}
            <Button className="gap-2" onClick={() => setPaymentOpen(true)}>
              <Banknote className="h-4 w-4" />
              Enregistrer un paiement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Facture {detail?.reference} · reste dû{' '}
              {formatEUR(Math.max((Number(detail?.amount) || 0) - (Number(detail?.paid_amount) || 0), 0), 2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-foreground/80" htmlFor="payment-amount">Montant (€)</label>
              <input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={payment.amount}
                onChange={(event) => setPayment({ ...payment, amount: event.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/80" htmlFor="payment-date">Date</label>
              <input
                id="payment-date"
                type="date"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={payment.date}
                onChange={(event) => setPayment({ ...payment, date: event.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/80" htmlFor="payment-method">Moyen de paiement</label>
              <select
                id="payment-method"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={payment.method}
                onChange={(event) => setPayment({ ...payment, method: event.target.value })}
              >
                {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-foreground/80" htmlFor="payment-ref">Référence</label>
              <input
                id="payment-ref"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={payment.reference}
                onChange={(event) => setPayment({ ...payment, reference: event.target.value })}
                placeholder="VIR-88420"
              />
            </div>

            {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setPaymentOpen(false)}>Annuler</Button>
              <Button onClick={addPayment} disabled={savingPayment}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}