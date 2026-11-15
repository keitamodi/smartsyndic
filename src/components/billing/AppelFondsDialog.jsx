import { useEffect, useMemo, useState } from 'react';
import { Download, FileCheck2, Loader2, Send, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { logAction, notify } from '@/lib/audit';
import { formatDate, formatEUR, formatNumber } from '@/lib/format';
import {
  buildReference,
  computeShares,
  periodLabel,
  QUARTERS,
  quarterOfDate,
  round2,
  totalTantiemes,
  yearOfDate,
} from '@/lib/appelFonds';
import { outstandingOf } from '@/lib/impayes';
import { downloadAvisPdf } from '@/lib/appelFondsPdf';
import AfRepartitionTable from '@/components/billing/AfRepartitionTable';
import AfReminderPlan from '@/components/billing/AfReminderPlan';

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const inputClass = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';
const labelClass = 'mb-1 block text-xs text-foreground/80';

export default function AppelFondsDialog({ open, onOpenChange, syndicId, buildings, invoices = [], onGenerated }) {
  const [buildingId, setBuildingId] = useState('');
  const [assemblies, setAssemblies] = useState([]);
  const [assemblyId, setAssemblyId] = useState('');
  const [lots, setLots] = useState([]);
  const [quarter, setQuarter] = useState(quarterOfDate());
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(inDays(30));
  const [includeArrears, setIncludeArrears] = useState(true);
  const [cadence, setCadence] = useState(7);
  const [generated, setGenerated] = useState([]);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setGenerated([]);
    setSent(false);
    setError('');
    setAssemblyId('');
    setAmount('');
    setBuildingId(buildings[0]?.id || '');
  }, [open]);

  useEffect(() => {
    if (!open || !buildingId) {
      setAssemblies([]);
      setLots([]);
      return;
    }
    let active = true;
    Promise.all([
      base44.entities.Assembly.filter({ building_id: buildingId }, { sort: '-date', limit: 50 }),
      base44.entities.Lot.filter({ building_id: buildingId }, { sort: 'number', limit: 300 }),
    ]).then(([assemblyPage, lotPage]) => {
      if (!active) return;
      setAssemblies((assemblyPage.items || []).filter((row) => Number(row.budget_amount) > 0));
      setLots(lotPage.items || []);
    });
    return () => {
      active = false;
    };
  }, [open, buildingId]);

  const building = buildings.find((row) => row.id === buildingId);
  const assembly = assemblies.find((row) => row.id === assemblyId);
  const budget = Number(assembly?.budget_amount) || 0;
  const totalAmount = Number(amount) || 0;
  const tantiemesTotal = totalTantiemes(lots);
  const period = periodLabel(quarter, year);

  const arrearsByLot = useMemo(() => {
    const map = {};
    invoices.forEach((invoice) => {
      if (invoice.building_id !== buildingId) return;
      if (invoice.status === 'brouillon' || invoice.status === 'payee') return;
      const remaining = outstandingOf(invoice);
      if (!remaining) return;
      const key = invoice.lot_number || '';
      map[key] = round2((map[key] || 0) + remaining);
    });
    return map;
  }, [invoices, buildingId]);

  const rows = useMemo(
    () =>
      computeShares(lots, totalAmount).map((row) => {
        const arrears = includeArrears ? arrearsByLot[row.lot.number] || 0 : 0;
        return { ...row, arrears, total: round2(row.amount + arrears) };
      }),
    [lots, totalAmount, arrearsByLot, includeArrears],
  );

  const lotsWithArrears = rows.filter((row) => row.arrears > 0).length;
  const lotsWithoutEmail = rows.filter((row) => !row.lot.owner_email).length;
  const totalCalled = rows.reduce((sum, row) => sum + row.total, 0);
  const totalArrears = rows.reduce((sum, row) => sum + row.arrears, 0);

  const pickAssembly = (id) => {
    setAssemblyId(id);
    const next = assemblies.find((row) => row.id === id);
    if (next) {
      const annual = Number(next.budget_amount) || 0;
      setAmount(annual ? String(Math.round((annual / 4) * 100) / 100) : '');
      setYear(yearOfDate(next.date));
    }
  };

  const generate = async () => {
    if (!building || !rows.length) return;
    setBusy(true);
    setError('');
    try {
      const payloads = rows.map(({ lot, amount: share, total, arrears, share: ratio }) => ({
        syndic_id: syndicId,
        building_id: buildingId,
        building_name: building.name,
        reference: buildReference(quarter, year, lot.number),
        kind: 'appel_fonds',
        lot_number: lot.number,
        period,
        issue_date: issueDate,
        due_date: dueDate,
        amount: total,
        paid_amount: 0,
        arrears_amount: arrears,
        reminder_level: 0,
        reminder_days: cadence,
        status: 'brouillon',
        recipient_email: lot.owner_email || '',
        notes: [
          `Quote-part ${formatNumber(ratio * 100, 2)} % des tantièmes — budget prévisionnel ${formatEUR(
            budget,
            2,
          )} voté en AG (${assembly?.title || '—'}).`,
          `Appel ${formatEUR(share, 2)}${arrears > 0 ? ` + arriérés ${formatEUR(arrears, 2)}` : ''}.`,
        ].join(' '),
      }));
      const created = await base44.entities.Invoice.bulkCreate(payloads);
      await logAction({
        syndicId,
        action: 'Appel de fonds généré',
        entity: 'Facture',
        entityLabel: period,
        details: `${payloads.length} avis · ${formatEUR(totalCalled, 2)} dont ${formatEUR(
          totalArrears,
          2,
        )} d'arriérés · rappel à J+${cadence}`,
      });
      setGenerated(
        rows.map((row) => ({
          invoice: created.find((item) => item.reference === buildReference(quarter, year, row.lot.number)) || {
            reference: buildReference(quarter, year, row.lot.number),
            lot_number: row.lot.number,
            amount: row.total,
            due_date: dueDate,
          },
          lot: row.lot,
          share: row.share,
          appel: row.amount,
          arrears: row.arrears,
          recipient_email: row.lot.owner_email || '',
        })),
      );
      onGenerated?.();
    } catch (failure) {
      setError(failure?.message || "La génération des appels de fonds a échoué.");
    } finally {
      setBusy(false);
    }
  };

  const sendAvis = async () => {
    setBusy(true);
    setError('');
    try {
      const targets = generated.filter((item) => item.invoice?.id);
      await base44.entities.Invoice.bulkUpdate(
        targets.map((item) => ({ id: item.invoice.id, status: 'envoyee' })),
      );
      const notifiable = targets.filter((item) => item.recipient_email);
      await Promise.all(
        notifiable.map((item) =>
          notify({
            syndicId,
            recipientEmail: item.recipient_email,
            title: `Appel de fonds ${item.invoice.reference} — ${period}`,
            message: `${formatEUR(item.invoice.amount, 2)} à régler avant le ${formatDate(
              item.invoice.due_date || dueDate,
            )}. Rappel automatique à J+${cadence} en cas de non-paiement.`,
            kind: 'facture',
            link: '/mon-espace',
          }),
        ),
      );
      await logAction({
        syndicId,
        action: 'Avis d’échéance envoyés',
        entity: 'Facture',
        entityLabel: period,
        details: `${notifiable.length} notification(s) sur ${targets.length} avis`,
      });
      setSent(true);
      setGenerated((prev) =>
        prev.map((item) => ({ ...item, invoice: { ...item.invoice, status: 'envoyee' } })),
      );
      onGenerated?.();
    } catch (failure) {
      setError(failure?.message || "L'envoi des avis a échoué.");
    } finally {
      setBusy(false);
    }
  };

  const download = (item) =>
    downloadAvisPdf({
      invoice: item.invoice,
      building,
      lot: item.lot,
      budget,
      share: item.share,
      tantiemesTotal,
    });

  const downloadAll = async () => {
    for (const item of generated) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => window.setTimeout(resolve, 320));
      download(item);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Appel de fonds en un clic</DialogTitle>
          <DialogDescription>
            Le budget voté en AG est croisé avec les tantièmes de chaque lot, les impayés du lot sont repris dans
            l’appel et l’échéancier de rappels est posé automatiquement.
          </DialogDescription>
        </DialogHeader>

        {generated.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-secondary/50 px-3 py-2">
                <p className="kicker !text-[9px]">Avis créés</p>
                <p className="font-mono text-[13px] tnum">{formatNumber(generated.length)}</p>
              </div>
              <div className="rounded-xl bg-secondary/50 px-3 py-2">
                <p className="kicker !text-[9px]">Total appelé</p>
                <p className="font-mono text-[13px] tnum">{formatEUR(totalCalled, 2)}</p>
              </div>
              <div className="rounded-xl bg-secondary/50 px-3 py-2">
                <p className="kicker !text-[9px]">Dont arriérés</p>
                <p className="font-mono text-[13px] tnum text-rose-700">{formatEUR(totalArrears, 2)}</p>
              </div>
            </div>

            <p className="flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2 text-[12px] text-foreground">
              <FileCheck2 className="h-4 w-4 text-primary" />
              {sent
                ? `Avis envoyés pour ${period} · rappel automatique à J+${cadence}`
                : `Avis au brouillon pour ${period} · échéance ${formatDate(dueDate)}`}
            </p>

            <div className="max-h-64 overflow-y-auto thin-scroll rounded-xl border border-border/70">
              <ul className="divide-y divide-border/60">
                {generated.map((item) => (
                  <li key={item.invoice.reference} className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-foreground">
                        Lot {item.invoice.lot_number} · {item.lot?.owner_name || 'Copropriétaire non renseigné'}
                      </p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {item.invoice.reference}
                        {item.arrears > 0 ? ` · dont ${formatEUR(item.arrears, 2)} d’arriérés` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] tnum">{formatEUR(item.invoice.amount, 2)}</span>
                      <Button size="sm" variant="ghost" className="gap-1 text-[11.5px]" onClick={() => download(item)}>
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
              <Button variant="outline" className="gap-2" onClick={downloadAll}>
                <Download className="h-4 w-4" />
                Télécharger les PDF
              </Button>
              <Button className="gap-2" onClick={sendAvis} disabled={busy || sent}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sent ? 'Avis envoyés' : `Envoyer les ${generated.length} avis`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <section className="space-y-3">
              <p className="kicker">1 · Budget prévisionnel validé</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="af-building">Immeuble</label>
                  <select
                    id="af-building"
                    className={inputClass}
                    value={buildingId}
                    onChange={(event) => setBuildingId(event.target.value)}
                  >
                    <option value="">Sélectionner…</option>
                    {buildings.map((row) => (
                      <option key={row.id} value={row.id}>{row.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="af-assembly">Budget voté en AG</label>
                  <select
                    id="af-assembly"
                    className={inputClass}
                    value={assemblyId}
                    onChange={(event) => pickAssembly(event.target.value)}
                    disabled={!assemblies.length}
                  >
                    <option value="">
                      {assemblies.length ? 'Sélectionner…' : 'Aucun budget validé'}
                    </option>
                    {assemblies.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.title} · {formatEUR(row.budget_amount, 2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {buildingId && !assemblies.length && (
                <p className="rounded-lg bg-secondary/50 px-3 py-2 text-[11.5px] text-muted-foreground">
                  Renseignez le budget prévisionnel voté dans une assemblée générale (montant du budget) pour cet
                  immeuble : il alimentera automatiquement la répartition.
                </p>
              )}
              {assembly && (
                <p className="text-[11.5px] text-muted-foreground">
                  {assembly.title} · {formatDate(assembly.date)} · budget annuel {formatEUR(budget, 2)} →{' '}
                  {formatEUR(budget / 4, 2)} par trimestre
                </p>
              )}
            </section>

            <section className="space-y-3 border-t border-border/70 pt-3">
              <p className="kicker">2 · Appel de fonds</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="af-quarter">Trimestre</label>
                  <select
                    id="af-quarter"
                    className={inputClass}
                    value={quarter}
                    onChange={(event) => setQuarter(event.target.value)}
                  >
                    {QUARTERS.map((row) => (
                      <option key={row.value} value={row.value}>{row.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="af-year">Année</label>
                  <input
                    id="af-year"
                    type="number"
                    className={inputClass}
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="af-amount">Montant global appelé (€)</label>
                  <input
                    id="af-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="Ex. 8 750"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="af-issue">Émission</label>
                    <input
                      id="af-issue"
                      type="date"
                      className={inputClass}
                      value={issueDate}
                      onChange={(event) => setIssueDate(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="af-due">Échéance</label>
                    <input
                      id="af-due"
                      type="date"
                      className={inputClass}
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-2 border-t border-border/70 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="kicker">3 · Répartition par tantièmes</p>
                <p className="font-mono text-[11px] text-muted-foreground tnum">
                  {formatNumber(rows.length)} lot(s) · {formatNumber(tantiemesTotal, 0)} tantièmes
                </p>
              </div>

              <label className="flex items-start gap-2 rounded-xl border border-border/70 px-3 py-2 text-[11.5px]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 accent-primary"
                  checked={includeArrears}
                  onChange={(event) => setIncludeArrears(event.target.checked)}
                />
                <span>
                  <span className="font-medium text-foreground">Reprendre les arriérés de chaque lot</span>
                  <span className="block text-muted-foreground">
                    {lotsWithArrears > 0
                      ? `${lotsWithArrears} lot(s) présentent un solde impayé, repris dans le montant appelé.`
                      : 'Aucun impayé sur cet immeuble : la case reste sans effet.'}
                  </span>
                </span>
              </label>

              <AfRepartitionTable
                rows={rows}
                tantiemesTotal={tantiemesTotal}
                includeArrears={includeArrears}
              />

              {lotsWithoutEmail > 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
                  {lotsWithoutEmail} lot(s) sans email de copropriétaire : leur avis sera édité mais aucune
                  notification ne pourra partir.
                </p>
              )}
            </section>

            <AfReminderPlan dueDate={dueDate} cadence={cadence} onCadenceChange={setCadence} />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-3">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button className="gap-2" onClick={generate} disabled={busy || !rows.length || !totalAmount}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Générer {rows.length || ''} avis d’échéance
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}