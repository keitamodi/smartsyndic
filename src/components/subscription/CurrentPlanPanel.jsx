import { cn } from '@/lib/utils';

export default function CurrentPlanPanel({ plan, usage }) {
  const meters = [
    { label: 'Immeubles gérés', used: usage.buildings, max: plan.limits.buildings },
    { label: 'Lots principaux', used: usage.lots, max: plan.limits.lots },
    { label: 'Questions IA ce mois', used: usage.ai, max: plan.limits.ai },
    { label: 'Sièges équipe', used: usage.seats, max: plan.limits.seats },
  ];

  return (
    <section
      id="abonnement-actuel"
      className="rounded-[24px] border border-border bg-card p-5 sm:p-6"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_1fr] md:gap-8">
        <div>
          <p className="kicker">Forfait actuel</p>
          <div className="mt-2 flex items-center gap-2">
            <h2 className="font-heading text-[26px] font-semibold leading-none">{plan.name}</h2>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
              Actif
            </span>
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            {plan.price} {plan.suffix}
          </p>
          <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
            {plan.subtitle} · sans engagement, changez de formule à tout moment.
          </p>
        </div>

        <div className="space-y-4">
          {meters.map((meter) => {
            const max = Number(meter.max) || 0;
            const percent = max ? Math.min(Math.round(((Number(meter.used) || 0) / max) * 100), 100) : 0;
            const saturated = percent >= 80;
            return (
              <div key={meter.label}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12.5px] text-foreground/80">{meter.label}</p>
                  <p className="tnum font-mono text-[11.5px] text-muted-foreground">
                    {Number(meter.used) || 0} / {max}
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full', saturated ? 'bg-destructive' : 'bg-primary')}
                    style={{ width: `${Math.max(percent, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}