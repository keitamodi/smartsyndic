import { cn } from '@/lib/utils';

export default function CurrentPlanPanel({ plan, usage }) {
  const meters = [
    { label: 'Immeubles gérés', used: usage.buildings, max: plan.limits.buildings },
    { label: 'Lots principaux', used: usage.lots, max: plan.limits.lots },
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
            const percent = meter.max ? Math.min(Math.round((meter.used / meter.max) * 100), 100) : 0;
            const saturated = percent >= 80;
            return (
              <div key={meter.label}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12.5px] text-foreground/80">{meter.label}</p>
                  <p className="tnum font-mono text-[11.5px] text-muted-foreground">
                    {meter.used} / {meter.max}
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

          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
              <p className="kicker !text-[9px]">Enveloppe IA</p>
              <p className="mt-1 text-[13px] font-medium">
                {plan.limits.ai ? `${plan.limits.ai} questions / mois` : 'Questions illimitées'}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-secondary/40 p-3">
              <p className="kicker !text-[9px]">Équipe cabinet</p>
              <p className="mt-1 text-[13px] font-medium">
                {plan.limits.seats} siège{plan.limits.seats > 1 ? 's' : ''} inclus
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}