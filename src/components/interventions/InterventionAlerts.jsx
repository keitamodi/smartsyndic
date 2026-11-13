import { BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { INTERVENTION_ORIGIN, INTERVENTION_PRIORITY, PRIORITY_TONE } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { daysUntil, formatRange } from './calendar-utils';

const dayLabel = (days) => {
  if (days < 0) return `en retard de ${Math.abs(days)} j`;
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  return `dans ${days} j`;
};

function AlertRow({ intervention, onOpen }) {
  const days = daysUntil(intervention.scheduled_date);
  const priority = intervention.priority || 'normale';
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(intervention)}
        className="w-full rounded-xl border border-border/70 p-2.5 text-left transition-colors hover:bg-secondary/50"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">{intervention.title}</p>
          <StatusBadge value={priority} map={INTERVENTION_PRIORITY} tone={PRIORITY_TONE[priority]} />
        </div>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {intervention.building_name || 'Immeuble non précisé'} · {formatDate(intervention.scheduled_date)} ·{' '}
          {formatRange(intervention)}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.06em]',
              days < 0
                ? 'bg-rose-50 text-rose-700'
                : days <= 2
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-secondary text-muted-foreground',
            )}
          >
            {dayLabel(days)}
          </span>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
            {INTERVENTION_ORIGIN[intervention.origin] || 'Entretien programmé'}
          </span>
          {intervention.reminder_sent && (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-emerald-700">alerte envoyée</span>
          )}
        </div>
      </button>
    </li>
  );
}

export default function InterventionAlerts({ interventions, onOpen, onRemind, reminding, info }) {
  const active = interventions.filter(
    (item) => item.scheduled_date && item.status !== 'terminee' && item.status !== 'annulee',
  );

  const sorted = [...active].sort((a, b) => {
    const diff = String(a.scheduled_date).localeCompare(String(b.scheduled_date));
    return diff || String(a.scheduled_time || '').localeCompare(String(b.scheduled_time || ''));
  });

  const late = sorted.filter((item) => daysUntil(item.scheduled_date) < 0);
  const upcoming = sorted.filter((item) => {
    const days = daysUntil(item.scheduled_date);
    return days >= 0 && days <= 30;
  });

  return (
    <aside className="flex flex-col rounded-[22px] border border-border bg-card">
      <header className="border-b border-border/70 p-3.5">
        <p className="kicker !text-[9px]">Alertes</p>
        <p className="mt-1 font-heading text-[15px] font-semibold text-foreground">Échéances & rappels</p>
        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
          Alerte au syndic pour les entretiens programmés, au propriétaire concerné pour les dépannages.
        </p>
        <Button variant="outline" size="sm" className="mt-2.5 gap-2" onClick={onRemind} disabled={reminding}>
          {reminding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
          Vérifier les alertes
        </Button>
        {info && <p className="mt-1.5 text-[11px] text-muted-foreground">{info}</p>}
      </header>

      <div className="thin-scroll max-h-[560px] overflow-y-auto p-2.5">
        {late.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1.5 px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
              En retard ({late.length})
            </p>
            <ul className="space-y-1.5">
              {late.map((item) => (
                <AlertRow key={item.id} intervention={item} onOpen={onOpen} />
              ))}
            </ul>
          </div>
        )}

        <p className="mb-1.5 px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          30 prochains jours ({upcoming.length})
        </p>
        {upcoming.length === 0 ? (
          <p className="px-1 py-3 text-[11.5px] leading-snug text-muted-foreground">
            Aucune échéance dans les 30 prochains jours. Planifiez un entretien depuis le calendrier pour activer les
            rappels.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((item) => (
              <AlertRow key={item.id} intervention={item} onOpen={onOpen} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}