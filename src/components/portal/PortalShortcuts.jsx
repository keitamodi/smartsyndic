import { Link } from 'react-router-dom';
import { ArrowUpRight, MessageCircle, Sparkles, Ticket } from 'lucide-react';

const SHORTCUTS = [
  {
    to: '/agent-ia',
    icon: Sparkles,
    title: 'Poser une question à l’agent IA',
    description: 'Règlement, travaux, charges : une réponse immédiate sur votre copropriété.',
  },
  {
    to: '/messagerie',
    icon: MessageCircle,
    title: 'Écrire au syndic',
    description: 'Échangez directement avec le gestionnaire de votre immeuble.',
  },
  {
    to: '/tickets',
    icon: Ticket,
    title: 'Signaler un incident',
    description: 'Déclarez un problème et suivez son traitement.',
  },
];

export default function PortalShortcuts() {
  return (
    <section className="rounded-[24px] border border-border bg-card p-4">
      <p className="kicker">Besoin d’aide ?</p>
      <ul className="mt-3 space-y-2">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className="group flex items-start gap-3 rounded-xl border border-border/70 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-[12.5px] font-medium text-foreground">
                    {item.title}
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}