import { ShieldCheck } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import PlanCard from '@/components/pricing/PlanCard';
import { PLANS } from '@/lib/plans';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <div className="border-b border-primary/15 bg-accent/70">
        <div className="mx-auto flex w-full max-w-[1180px] items-start gap-3 px-5 py-3 sm:items-center sm:px-8">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
          <p className="text-[12.5px] leading-snug text-accent-foreground">
            Accès portail gratuits et illimités pour tous vos copropriétaires, propriétaires et
            techniciens invités.
          </p>
        </div>
      </div>

      <main className="pb-20">
        <section className="mx-auto w-full max-w-[1180px] px-5 pt-12 sm:px-8">
          <p className="kicker">Tarifs</p>
          <h1 className="mt-3 max-w-[640px] font-heading text-[32px] font-semibold leading-[1.08] sm:text-[44px]">
            Une formule par cabinet. Vos résidents, toujours gratuits.
          </h1>
          <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-muted-foreground">
            La souscription est réservée au syndic gestionnaire. Chaque forfait fait évoluer votre
            parc géré, votre enveloppe de questions IA et le nombre de sièges du cabinet.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className="mt-6 rounded-[14px] border border-border/70 bg-secondary/40 p-5">
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              L'enveloppe de questions IA est partagée entre le cabinet et les copropriétaires du
              compte, et se réinitialise le 1er de chaque mois. Les invitations de copropriétaires,
              propriétaires et techniciens sont illimitées et ne consomment aucun siège d'équipe.
              Les forfaits s'entendent hors taxes, par cabinet, sans engagement de durée.
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}