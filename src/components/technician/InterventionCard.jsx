import { Building2, CalendarClock, CheckCircle2, Mail, PlayCircle, Ticket } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { INTERVENTION_PRIORITY, INTERVENTION_STATUS, PRIORITY_TONE } from '@/lib/constants';
import { formatDate } from '@/lib/format';

export default function InterventionCard({ row, saving, canReport, onStart, onFinish }) {
  const when = `${formatDate(row.scheduled_date)}${row.scheduled_time ? ` à ${row.scheduled_time}` : ''}`;

  return (
    <article className="rounded-[20px] border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{row.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {row.building_name || 'Immeuble non précisé'}
          </p>
          {row.building_address && (
            <p className="mt-0.5 pl-5 text-[11.5px] text-muted-foreground">{row.building_address}</p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            {when}
            {row.duration_minutes ? ` · ${row.duration_minutes} min` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge value={row.priority} map={INTERVENTION_PRIORITY} tone={PRIORITY_TONE[row.priority]} />
          <StatusBadge value={row.status} map={INTERVENTION_STATUS} />
        </div>
      </div>

      {row.ticket && (
        <div className="mt-3 rounded-xl border border-border/70 bg-secondary/40 p-2.5">
          <p className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
            <Ticket className="h-3 w-3" />
            Demande d’origine
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-foreground/85">{row.ticket.title}</p>
          {row.ticket.requester_name && (
            <p className="text-[11.5px] text-muted-foreground">Signalée par {row.ticket.requester_name}</p>
          )}
          {row.ticket.description && (
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{row.ticket.description}</p>
          )}
        </div>
      )}

      {row.description && (
        <p className="mt-3 whitespace-pre-line text-[12.5px] leading-relaxed text-foreground/75">
          {row.description}
        </p>
      )}

      {row.contact_email && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          Prévenir :
          <a href={`mailto:${row.contact_email}`} className="text-primary hover:underline">
            {row.contact_email}
          </a>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {row.status !== 'en_cours' && (
          <Button size="sm" variant="outline" className="gap-1.5" disabled={saving} onClick={() => onStart(row)}>
            <PlayCircle className="h-4 w-4" />
            Démarrer
          </Button>
        )}
        {canReport && (
          <Button size="sm" className="gap-1.5" disabled={saving} onClick={() => onFinish(row)}>
            <CheckCircle2 className="h-4 w-4" />
            Terminer
          </Button>
        )}
      </div>
    </article>
  );
}