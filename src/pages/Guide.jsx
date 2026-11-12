import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileSignature,
  Gavel,
  Receipt,
  ShieldCheck,
  Ticket,
  Users,
  Wrench,
} from 'lucide-react';
import Page from '@/components/Page';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    title: 'Créez votre espace syndic',
    text: 'Renseignez le nom du cabinet ou du syndicat. Chaque espace isole ses immeubles, son équipe et ses données.',
  },
  {
    title: 'Ajoutez vos immeubles et leurs lots',
    text: 'Décrivez chaque copropriété, puis créez les lots (appartements, parkings, caves) avec leurs tantièmes.',
  },
  {
    title: 'Rattachez les résidents',
    text: 'Copropriétaires, propriétaires bailleurs et occupants : les coordonnées servent aux convocations et au suivi des demandes.',
  },
  {
    title: 'Invitez votre équipe',
    text: 'Attribuez un rôle à chaque collaborateur et définissez son périmètre d’immeubles.',
  },
  {
    title: 'Traitez les demandes',
    text: 'Qualifiez les tickets, affectez un technicien ou un prestataire, planifiez l’intervention et clôturez avec un compte rendu.',
  },
  {
    title: 'Pilotez les finances et les AG',
    text: 'Émettez les appels de fonds, enregistrez les paiements, préparez les assemblées et publiez les PV.',
  },
];

const MODULES = [
  { icon: Building2, title: 'Immeubles & lots', text: 'Patrimoine, gestionnaire référent, lots et propriétaires rattachés.' },
  { icon: Wrench, title: 'Maintenance', text: 'Interventions préventives et curatives, coûts et comptes rendus.' },
  { icon: Ticket, title: 'Tickets & demandes', text: 'Qualification, priorisation, affectation et suivi jusqu’à la clôture.' },
  { icon: FileSignature, title: 'Contrats', text: 'Contrats prestataires, documents joints et alertes de renouvellement.' },
  { icon: Gavel, title: 'AG & Documents', text: 'Convocations, résolutions, votes, PV et bibliothèque de documents.' },
  { icon: Users, title: 'Résidents & équipe', text: 'Annuaire des résidents, rôles internes et périmètres d’accès.' },
  { icon: Receipt, title: 'Facturation', text: 'Appels de fonds par lot, paiements, recouvrement par immeuble.' },
  { icon: ShieldCheck, title: 'Traçabilité', text: 'Historique des actions sensibles et notifications internes.' },
];

const ROLES = [
  ['Administrateur du syndic', 'Paramètre l’espace, invite l’équipe et gère l’ensemble du portefeuille.'],
  ['Directeur', 'Supervise les copropriétés et les indicateurs consolidés.'],
  ['Gestionnaire de copropriété', 'Gère les immeubles de son périmètre, les demandes et les interventions.'],
  ['Assistant de gestion', 'Traite les demandes et prépare les assemblées.'],
  ['Comptable', 'Émet les appels de fonds et suit les encaissements.'],
  ['Copropriétaire / Propriétaire bailleur / Occupant', 'Consulte ses lots, soumet des demandes et suit leur traitement.'],
  ['Technicien / Prestataire', 'Reçoit les interventions affectées et renseigne le compte rendu.'],
];

export default function Guide() {
  return (
    <Page
      kicker="Ressources"
      title="Guide d’utilisation"
      description="De la création de votre espace syndic au suivi des finances : les étapes clés pour prendre en main SyndicVibe."
      actions={
        <Button asChild className="gap-2">
          <Link to="/">
            Ouvrir le tableau de bord
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <section className="rounded-[26px] border border-border bg-card p-6 sm:p-8">
        <p className="kicker">Prise en main</p>
        <h2 className="mt-2 max-w-2xl text-[22px] leading-snug text-foreground sm:text-[26px]">
          Six étapes pour rendre votre gestion de copropriété opérationnelle
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <span className="font-mono text-[11px] text-primary">0{index + 1}</span>
              <p className="mt-1.5 text-[13.5px] font-medium text-foreground">{step.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-[26px] border border-border bg-card p-6 sm:p-8">
        <p className="kicker">Les rubriques</p>
        <h2 className="mt-2 text-[20px] text-foreground">Ce que couvre chaque module</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.title} className="flex gap-3 rounded-2xl border border-border/60 p-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={1.7} />
                </span>
                <div>
                  <p className="text-[13px] font-medium text-foreground">{module.title}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{module.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[26px] border border-border bg-card p-6 sm:p-8">
        <p className="kicker">Rôles & permissions</p>
        <h2 className="mt-2 text-[20px] text-foreground">Qui fait quoi dans SyndicVibe</h2>
        <ul className="mt-4 divide-y divide-border/60">
          {ROLES.map(([role, description]) => (
            <li key={role} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-full max-w-[280px] text-[13px] font-medium text-foreground">{role}</span>
              <span className="text-[12.5px] leading-relaxed text-muted-foreground">{description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[26px] border border-primary/20 bg-accent/40 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-[14px] font-medium text-foreground">Bonnes pratiques</p>
            <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-foreground/75">
              <li>• Renseignez les coordonnées des résidents : elles servent aux convocations et aux relances.</li>
              <li>• Consignez systématiquement un compte rendu après une intervention.</li>
              <li>• Surveillez les contrats à échéance sous 60 jours pour éviter une reconduction non souhaitée.</li>
              <li>• Enregistrez les paiements au fil de l’eau pour garder un recouvrement fiable.</li>
            </ul>
          </div>
        </div>
      </section>
    </Page>
  );
}