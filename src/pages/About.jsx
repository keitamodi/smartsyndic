import { Building2, Handshake, Layers, ShieldCheck, Sparkles } from 'lucide-react';
import Page from '@/components/Page';

const AUDIENCES = [
  {
    title: 'Syndics professionnels',
    text: 'Portefeuilles multi-immeubles, gestionnaires dédiés, appels de fonds et assemblées : un poste de travail unique pour toute l’équipe.',
  },
  {
    title: 'Syndics bénévoles',
    text: 'Un cadre clair pour les copropriétaires qui administrent leur immeuble : suivi des demandes, contrats et décisions sans jargon.',
  },
  {
    title: 'Syndics coopératifs',
    text: 'Une organisation partagée où chaque rôle dispose des bonnes informations, avec un historique des décisions et des actions.',
  },
];

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Isolation des données',
    text: 'Chaque enregistrement est rattaché à son espace syndic. Les accès sont limités aux utilisateurs autorisés et les actions sensibles sont historisées.',
  },
  {
    icon: Layers,
    title: 'Une seule source de vérité',
    text: 'Immeubles, lots, résidents, demandes, interventions, contrats et finances partagent le même référentiel.',
  },
  {
    icon: Sparkles,
    title: 'Assistance par IA',
    text: 'L’Agent IA répond à partir de vos données, rédige courriers et comptes rendus, sans jamais inventer de chiffres absents.',
  },
  {
    icon: Handshake,
    title: 'Transparence',
    text: 'Aucune intégration non configurée n’est simulée : notifications internes, stockage privé des pièces jointes et états vides explicites.',
  },
];

export default function About() {
  return (
    <Page
      kicker="À propos"
      title="Smartsyndic"
      description="La plateforme de gestion de copropriété qui réunit le syndic, son équipe, les résidents et les prestataires autour des mêmes données."
    >
      <section className="overflow-hidden rounded-[28px] border border-border bg-card">
        <div className="grid gap-6 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div>
            <p className="kicker">Notre mission</p>
            <h2 className="mt-2 max-w-2xl text-[24px] leading-snug text-foreground sm:text-[30px]">
              Rendre la gestion de copropriété lisible, traçable et sereine.
            </h2>
            <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
              Smartsyndic centralise la gestion quotidienne des copropriétés : patrimoine, demandes des résidents,
              maintenance, contrats, assemblées générales et facturation. L’objectif est simple : que chaque acteur
              dispose de la bonne information au bon moment, sans ressaisie ni boîte mail parallèle.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-accent/50 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="font-mono text-[12px] font-semibold">SS</span>
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-accent-foreground">
              Plateforme SaaS
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/75">
              Conçue pour les syndics professionnels, bénévoles et coopératifs, et pour les résidents qu’ils
              accompagnent.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {AUDIENCES.map((audience) => (
          <article key={audience.title} className="rounded-[22px] border border-border bg-card p-5">
            <Building2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
            <p className="mt-3 text-[13.5px] font-medium text-foreground">{audience.title}</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{audience.text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[26px] border border-border bg-card p-6 sm:p-8">
        <p className="kicker">Nos engagements</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => {
            const Icon = principle.icon;
            return (
              <div key={principle.title} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/70">
                  <Icon className="h-4 w-4 text-foreground/70" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-foreground">{principle.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{principle.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        Smartsyndic est éditée comme un service en ligne. Les fonctionnalités d’envoi d’email transactionnel et de
        paiement en ligne nécessitent la configuration d’un fournisseur externe et sont signalées comme telles dans
        l’application.
      </p>
    </Page>
  );
}