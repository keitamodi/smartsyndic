import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { useWorkspace } from '@/lib/workspace';
import { planById } from '@/lib/plans';

export default function SidebarPlanCard() {
  const { syndic } = useWorkspace();
  const plan = planById(syndic?.plan_tier);

  return (
    <Link
      to="/abonnement"
      className="block rounded-2xl border border-primary/25 bg-accent/60 p-3.5 transition-colors hover:border-primary/50 hover:bg-accent"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-foreground/80">
          Abonnement
        </p>
        <CreditCard className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
      </div>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
        <span className="font-heading text-[15px] font-semibold leading-none text-foreground">
          {plan.name}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {plan.price} {plan.suffix}
        </span>
      </p>
      <span className="mt-2.5 flex items-center justify-center rounded-lg bg-primary px-2.5 py-1.5 text-[11.5px] font-medium text-primary-foreground">
        Voir l'abonnement actuel
      </span>
    </Link>
  );
}