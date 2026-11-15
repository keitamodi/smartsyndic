import { Link } from 'react-router-dom';
import { ArrowRight, LifeBuoy, Lock, Mail, Sparkles } from 'lucide-react';
import Page from '@/components/Page';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = [
  {
    question: 'Comment les résidents reçoivent-ils les notifications ?',
    answer:
      'Les notifications sont internes à la plateforme : elles apparaissent dans l’espace de chaque personne concernée. L’envoi d’emails transactionnels nécessite la configuration d’un fournisseur d’envoi ; sans cette configuration, aucun email n’est envoyé et SyndicVibe ne le simule pas.',
  },
  {
    question: 'Où sont stockés les documents et les pièces jointes ?',
    answer:
      'Les fichiers sont stockés de façon privée. Ils ne sont accessibles que par un lien signé temporaire généré pour un utilisateur autorisé, et jamais par une adresse publique permanente.',
  },
  {
    question: 'Puis-je gérer plusieurs syndics ou portefeuilles ?',
    answer:
      'Oui. Utilisez le sélecteur d’espace en haut de l’écran pour basculer d’un espace syndic à un autre, ou créez un nouvel espace avec le bouton « + ». Les données de chaque espace restent isolées.',
  },
  {
    question: 'Comment fonctionnent les rôles et les périmètres ?',
    answer:
      'Chaque membre de l’équipe possède un rôle (administrateur, directeur, gestionnaire, assistant, comptable) et un périmètre d’immeubles. Les invitations sont envoyées par email et activent l’accès à la plateforme.',
  },
  {
    question: 'Comment enregistrer un paiement sur un appel de fonds ?',
    answer:
      'Ouvrez la facture depuis la rubrique Appel de fonds, cliquez sur « Enregistrer un paiement », puis renseignez le montant, la date et le moyen de paiement. Le statut de la facture est recalculé automatiquement.',
  },
  {
    question: 'Que se passe-t-il si une donnée est incomplète ?',
    answer:
      'Les listes affichent un état vide explicite et les formulaires signalent les champs obligatoires. Aucune donnée de démonstration n’est présentée comme réelle : les chiffres du tableau de bord proviennent uniquement de vos enregistrements.',
  },
];

export default function Help() {
  return (
    <Page
      kicker="Ressources"
      title="Aide"
      description="Les réponses aux questions les plus fréquentes sur la gestion quotidienne de vos copropriétés dans SyndicVibe."
      actions={
        <Button asChild className="gap-2">
          <Link to="/agent-ia">
            <Sparkles className="h-4 w-4" />
            Demander à l’Agent IA
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-[26px] border border-border bg-card px-5 py-2 sm:px-7">
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, index) => (
              <AccordionItem key={item.question} value={`item-${index}`} className="border-border/70">
                <AccordionTrigger className="py-4 text-left text-[13.5px] font-medium text-foreground hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-[12.5px] leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <aside className="space-y-3">
          <div className="rounded-[22px] border border-border bg-card p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
              <LifeBuoy className="h-4 w-4 text-primary" />
            </span>
            <p className="mt-3 text-[13.5px] font-medium text-foreground">Besoin d’un accompagnement ?</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              L’Agent IA répond à partir des données de votre espace et peut rédiger vos courriers et comptes rendus.
            </p>
            <Button asChild variant="outline" className="mt-3 w-full gap-2">
              <Link to="/agent-ia">
                Ouvrir l’Agent IA
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="rounded-[22px] border border-border bg-card p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
              <Lock className="h-4 w-4 text-foreground/70" />
            </span>
            <p className="mt-3 text-[13.5px] font-medium text-foreground">Sécurité des données</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Les données sont rattachées à leur espace syndic et accessibles uniquement aux utilisateurs autorisés.
              Les actions sensibles sont historisées.
            </p>
          </div>

          <div className="rounded-[22px] border border-border bg-secondary/40 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card">
              <Mail className="h-4 w-4 text-foreground/70" />
            </span>
            <p className="mt-3 text-[13.5px] font-medium text-foreground">Demande support</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              Enregistrez votre demande depuis la rubrique Tickets : elle sera qualifiée et suivie comme toute
              réclamation, avec son historique.
            </p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link to="/tickets">Créer une demande</Link>
            </Button>
          </div>
        </aside>
      </div>
    </Page>
  );
}