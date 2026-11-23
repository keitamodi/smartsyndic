import { CalendarClock, CheckCircle2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatEUR } from '@/lib/format';
import { INVOICE_STATUS } from '@/lib/constants';

const daysUntil = (value) => {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

const delayLabel = (days) => {
  if (days === null) return '';
  if (days < 0) return ` · ${Math.abs(days)} jour(s) de retard`;
  if (days === 0) return ' · échéance aujourd’hui';
  return ` · dans ${days} jour(s)`;
};

export default function PortalNextDue({ next, syndic }) {
  if (!next) {
    return (
      <section className="flex items-start gap-3 rounded-[24px] border border-emerald-600/20 bg-emerald-50/70 px-4 py-3.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[13px] font-medium text-emerald-900">Vous êtes à jour de vos charges</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-emerald-800/80">
            Aucune échéance en attente de règlement sur les trois dernières années.
          </p>
        </div>
      </section>
    );
  }

  const remaining = Math.max((Number(next.amount) || 0) - (Number(next.paid_amount) || 0), 0);
  const days = daysUntil(next.due_date);
  const late = days !== null && days < 0;

  return (
    <section className="rounded-[24px] border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <CalendarClock className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div>
            <p className="kicker">Prochaine échéance</p>
            <p className="mt-1 text-[13px] font-medium text-foreground">
              {next.period || 'Appel de fonds'} · lot {next.lot_number || '—'}
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              à régler avant le {formatDate(next.due_date)}
              {delayLabel(days)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[20px] leading-none text-foreground tnum">{formatEUR(remaining, 2)}</p>
          <div className="mt-1.5 flex justify-end">
            <StatusBadge value={late ? 'en_retard' : next.status} map={INVOICE_STATUS} />
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-secondary/50 px-3 py-2 text-[11.5px] leading-snug text-muted-foreground">
        Règlement par virement ou prélèvement auprès de votre syndic
        {syndic?.email ? ` (${syndic.email})` : ''}. Votre reçu libératoire apparaît ici dès l’encaissement.
      </p>
    </section>
  );
}