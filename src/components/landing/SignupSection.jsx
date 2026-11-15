import { Receipt, Gavel, Wrench, Sparkles } from 'lucide-react';
import SyndicSignupForm from '@/components/landing/SyndicSignupForm';

const PILLARS = [
  {
    icon: Receipt,
    title: 'Appels de fonds sans tableur',
    text: 'Répartition par tantièmes, avis d’échéance, relances et suivi des impayés au même endroit.',
  },
  {
    icon: Gavel,
    title: 'Assemblées générales préparées',
    text: 'Convocations, résolutions et procès-verbaux archivés par immeuble.',
  },
  {
    icon: Wrench,
    title: 'Interventions suivies',
    text: 'Du ticket du copropriétaire au compte rendu du prestataire, avec rappels automatiques.',
  },
  {
    icon: Sparkles,
    title: 'Agent IA documenté',
    text: 'Un assistant qui répond à partir des documents et des données de votre espace.',
  },
];

export default function SignupSection() {
  return (
    <section id="inscription" className="mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
        <div>
          <p className="kicker">Inscription</p>
          <h2 className="mt-3 max-w-[420px] font-heading text-[clamp(1.75rem,1.2rem+2vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            Un espace par syndicat, ouvert en quelques minutes.
          </h2>
          <p className="mt-4 max-w-[430px] text-[14px] leading-relaxed text-muted-foreground">
            Décrivez votre portefeuille : nous préparons votre espace, importons vos immeubles et formons votre
            équipe. Vos résidents accèdent ensuite à leurs appels de fonds et à leurs documents.
          </p>

          <ul className="mt-8 space-y-4">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <li key={pillar.title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-foreground">{pillar.title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{pillar.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <SyndicSignupForm />
      </div>
    </section>
  );
}