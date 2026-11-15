import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatEUR } from '@/lib/format';
import { daysLate, outstandingOf, stageOf } from '@/lib/impayes';

export default function ImpayeRow({ invoice, onRelance, onOpen, busy }) {
  const days = daysLate(invoice);
  const stage = stageOf(invoice);
  const tone = days > 30 ? 'text-rose-700' : days > 15 ? 'text-orange-700' : 'text-amber-700';

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen?.(invoice)}>
        <p className="truncate text-[12.5px] font-medium text-foreground">
          {invoice.building_name || 'Immeuble'} · lot {invoice.lot_number || '—'}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {invoice.reference} · {invoice.recipient_email || 'email non renseigné'} · échéance{' '}
          {formatDate(invoice.due_date)}
        </p>
      </button>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-mono text-[12.5px] tnum">{formatEUR(outstandingOf(invoice), 2)}</p>
          <p className={`text-[10.5px] font-medium ${tone}`}>
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            {days} j de retard
          </p>
        </div>
        <div className="hidden w-32 text-right text-[10.5px] text-muted-foreground sm:block">
          <p>{stage.label}</p>
          <p>{invoice.last_reminder_at ? `le ${formatDate(invoice.last_reminder_at)}` : 'jamais relancé'}</p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={busy} onClick={() => onRelance(invoice)}>
          {stage.short}
        </Button>
      </div>
    </li>
  );
}