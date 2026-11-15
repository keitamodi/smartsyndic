import { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { logAction } from '@/lib/audit';
import { formatEUR, formatNumber } from '@/lib/format';
import { summaryOf } from '@/lib/impayes';
import { relancerFacture } from '@/lib/relance';
import ImpayeRow from '@/components/billing/ImpayeRow';

export default function ImpayesPanel({ syndicId, invoices, onOpenInvoice, onChanged }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const { late, lateTotal, openTotal, buckets } = useMemo(() => summaryOf(invoices), [invoices]);

  const relancer = async (invoice) => {
    const result = await relancerFacture({ syndicId, invoice });
    toast({
      title: `${result.stage.label} envoyée`,
      description: result.notified
        ? `${invoice.reference} · ${result.email}`
        : `${invoice.reference} · aucun email de copropriétaire : relance enregistrée`,
    });
  };

  const relancerTout = async () => {
    setBusy(true);
    try {
      const results = await Promise.allSettled(late.map((invoice) => relancer(invoice)));
      const sent = results.filter((row) => row.status === 'fulfilled').length;
      await logAction({
        syndicId,
        action: 'Relances groupées',
        entity: 'Facture',
        entityLabel: `${sent} retard(s)`,
        details: formatEUR(lateTotal, 2),
      });
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[24px] border border-border bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Impayés</p>
          <h2 className="mt-1 text-lg font-heading">Retards de paiement détectés</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {formatNumber(late.length)} échéance(s) en retard · {formatEUR(lateTotal, 2)} à recouvrer · encours total{' '}
            {formatEUR(openTotal, 2)}
          </p>
        </div>
        <Button className="gap-2" onClick={relancerTout} disabled={busy || !late.length}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Relancer les {late.length || ''} retards
        </Button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {buckets.map((bucket) => (
          <div key={bucket.key} className="rounded-xl border border-border/70 px-3 py-2">
            <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{bucket.label}</p>
            <p className={`mt-0.5 font-mono text-[14px] tnum ${bucket.tone}`}>{formatEUR(bucket.amount, 2)}</p>
            <p className="text-[10.5px] text-muted-foreground">{formatNumber(bucket.count)} copropriétaire(s)</p>
          </div>
        ))}
      </div>

      {late.length === 0 ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12px] text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Aucun retard de paiement : tous les copropriétaires sont à jour.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border/60">
          {late.map((invoice) => (
            <ImpayeRow
              key={invoice.id}
              invoice={invoice}
              busy={busy}
              onRelance={async (row) => {
                setBusy(true);
                try {
                  await relancer(row);
                  await onChanged?.();
                } finally {
                  setBusy(false);
                }
              }}
              onOpen={onOpenInvoice}
            />
          ))}
        </ul>
      )}
    </section>
  );
}