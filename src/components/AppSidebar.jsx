import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Wrench,
  Ticket,
  FileSignature,
  FileText,
  Handshake,
  Gavel,
  Sparkles,
  MessageCircle,
  Users,
  HardHat,
  UserCog,
  Receipt,
  BookOpen,
  LifeBuoy,
  Info,
  Settings,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUPS = [
  {
    label: null,
    items: [{ to: '/', label: 'Tableau de bord', icon: LayoutDashboard }],
  },
  {
    label: 'Gestion',
    items: [
      { to: '/immeubles', label: 'Immeubles', icon: Building2 },
      { to: '/maintenance', label: 'Interventions', icon: Wrench },
      { to: '/tickets', label: 'Tickets & demandes', icon: Ticket },
      { to: '/contrats', label: 'Contrats', icon: FileSignature },
      { to: '/assemblees', label: 'AG & Documents', icon: Gavel },
    ],
  },
  {
    label: 'Relation',
    items: [
      { to: '/agent-ia', label: 'Agent IA', icon: Sparkles },
      { to: '/messagerie', label: 'Messagerie', icon: MessageCircle },
      { to: '/residents', label: 'Copropriétaires & propriétaires', icon: Users },
      { to: '/prestataires', label: 'Techniciens & prestataires', icon: HardHat },
      { to: '/equipe', label: 'Équipe', icon: UserCog },
    ],
  },
  {
    label: 'Travaux',
    items: [
      { to: '/devis', label: 'Demandes de devis', icon: FileText },
      { to: '/partenaires', label: 'Entreprises partenaires', icon: Handshake },
    ],
  },
  {
    label: 'Finances',
    items: [{ to: '/facturation', label: 'Facturation', icon: Receipt }],
  },
  {
    label: 'Ressources',
    items: [
      { to: '/guide', label: "Guide d'utilisation", icon: BookOpen },
      { to: '/aide', label: 'Aide', icon: LifeBuoy },
      { to: '/a-propos', label: 'À propos', icon: Info },
    ],
  },
  {
    label: 'Configuration',
    items: [{ to: '/parametres', label: 'Paramètres', icon: Settings }],
  },
];

export default function AppSidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_hsl(var(--primary))]">
          <span className="font-mono text-[13px] font-semibold tracking-tight">SV</span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-[17px] font-semibold leading-tight text-foreground">
            SyndicVibe
          </p>
          <p className="kicker mt-0.5 !tracking-[0.14em] !text-[9px]">Gestion de copropriété</p>
        </div>
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto px-3 pb-4">
        {GROUPS.map((group, index) => (
          <div key={group.label || `group-${index}`} className="mb-4">
            {group.label && (
              <p className="kicker mb-2 px-3 !text-[9px] !tracking-[0.2em]">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] leading-snug transition-colors',
                          isActive
                            ? 'bg-accent font-medium text-accent-foreground'
                            : 'text-foreground/70 hover:bg-secondary/70 hover:text-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'h-[17px] w-[17px] shrink-0',
                              isActive ? 'text-primary' : 'text-foreground/45 group-hover:text-foreground/70',
                            )}
                            strokeWidth={1.7}
                          />
                          <span className="min-w-0 flex-1">{item.label}</span>
                          {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <NavLink
          to="/guide"
          className="block rounded-2xl border border-border/80 bg-secondary/50 p-3.5 transition-colors hover:border-primary/40 hover:bg-accent/60"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70">
              Prise en main
            </p>
            <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">
            Configurez votre espace syndic en quelques minutes.
          </p>
        </NavLink>
      </div>
    </div>
  );
}