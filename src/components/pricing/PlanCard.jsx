import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PlanCard({ plan }) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-[18px] border p-6',
        plan.recommended
          ? 'border-primary/35 bg-card shadow-[0_30px_70px_-50px_hsl(var(--primary))] ring-1 ring-primary/20'
          : 'border-border/80 bg-card/70'
      )}
    >
      {plan.recommended && (
        <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-primary-foreground">
          <Sparkles className="h-3 w-3" />
          Recommandé
        </span>
      )}

      <div>
        <h2 className="font-heading text-[17px] font-semibold leading-tight">{plan.name}</h2>
        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{plan.subtitle}</p>
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="tnum font-heading text-[30px] font-semibold leading-none">{plan.price}</span>
        <span className="text-[11.5px] text-muted-foreground">{plan.suffix}</span>
      </div>

      <div className="my-5 h-px bg-border/80" />

      <ul className="space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-[12.5px] leading-snug">
              <span className="text-muted-foreground">{feature.label} · </span>
              <span className="font-medium">{feature.value}</span>
            </span>
          </li>
        ))}
      </ul>

      {plan.note && (
        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">{plan.note}</p>
      )}

      <div className="mt-auto pt-6">
        <Button
          asChild
          variant={plan.recommended ? 'default' : 'outline'}
          className="w-full text-[12.5px]"
        >
          <Link to={`/register?plan=${plan.id}`}>{plan.cta}</Link>
        </Button>
      </div>
    </div>
  );
}