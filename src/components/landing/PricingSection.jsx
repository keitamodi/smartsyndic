import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PlanCard from '@/components/pricing/PlanCard';
import { PLANS } from '@/lib/plans';

export default function PricingSection() {
  return (
    <section id="tarifs" className="border-t border-border/70 bg-secondary/25 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="kicker">Tarifs</p>
            <h2 className="mt-3 max-w-[520px] font-heading text-[26px] font-semibold leading-[1.12] sm:text-[34px]">
              Une formule par cabinet. Vos résidents, toujours gratuits.
            </h2>
          </div>
          <Link
            to="/pricing"
            className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary"
          >
            Comparer les forfaits en détail
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <p className="mt-3 max-w-[560px] text-[13px] leading-relaxed text-muted-foreground">
          Accès portail gratuits et illimités pour tous vos copropriétaires, propriétaires et
          techniciens invités.
        </p>

        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}