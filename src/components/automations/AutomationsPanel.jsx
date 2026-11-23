import { useEffect, useState } from 'react';
import { CalendarClock, Receipt, Sparkles, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { AUTOMATIONS, AUTOMATION_EMAIL } from '@/lib/automations';
import { relativeTime } from '@/lib/format';

const ICONS = { interventions: Wrench, impayes: Receipt, assemblees: CalendarClock };

export default function AutomationsPanel({ syndicId }) {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    let active = true;
    if (!syndicId) return undefined;
    base44.entities.AuditLog
      .filter(
        { syndic_id: syndicId, actor_email: AUTOMATION_EMAIL },
        { sort: '-created_date', limit: 12 },
      )
      .then((page) => active && setLogs(page.items || []))
      .catch(() => active && setLogs([]));
    return () => {
      active = false;
    };
  }, [syndicId]);

  return (
    <section className="rounded-[26px] border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <p className="kicker">Tâches récurrentes</p>
          <h2 className="mt-1 text-[15px] font-semibold text-foreground">Automatisations planifiées</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          {AUTOMATIONS.length} actives
        </span>
      </div>

      <ul className="divide-y divide-border">
        {AUTOMATIONS.map((automation) => {
          const Icon = ICONS[automation.key] || Sparkles;
          const last = logs?.find((log) => log.action === automation.logLabel);
          return (
            <li key={automation.key} className="flex items-start gap-3 px-5 py-3.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent">
                <Icon className="h-4 w-4 text-accent-foreground" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">{automation.title}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                  {automation.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {automation.cadence}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {last ? `${last.entity_label} · ${relativeTime(last.created_date)}` : 'Premier passage cette nuit'}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}