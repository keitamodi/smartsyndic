import { Link, NavLink } from 'react-router-dom';
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
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAccess from '@/hooks/useAccess';
import { ROLE_LABELS } from '@/lib/access';
import { LEGAL_PAGES } from '@/lib/legal';

const GROUPS = [
  {
    label: null,
    items: [
      { to: '/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard, module: 'dashboard' },
      { to: '/mon-espace', label: 'Mon espace', icon: UserRound, module: 'portal' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { to: '/immeubles', label: 'Immeubles', icon: Building2, module: 'buildings' },
      { to: '/maintenance', label: 'Maintenance', icon: Wrench, module: 'interventions' },
      { to: '/tickets', label: 'Tickets & demandes', icon: Ticket, module: 'tickets' },
      { to: '/contrats', label: 'Contrats', icon: FileSignature, module: 'contracts' },
      { to: '/assemblees', label: 'AG & Documents', icon: Gavel, module: 'assemblies' },
    ],
  },
  {
    label: 'Relation',
    items: [
      { to: '/agent-ia', label: 'Agent IA', icon: Sparkles, module: 'agent' },
      { to: '/messagerie', label: 'Messagerie', icon: MessageCircle, module: 'messaging' },
      { to: '/residents', label: 'Copropriétaires & propriétaires', icon: Users, module: 'residents' },
      { to: '/prestataires', label: 'Techniciens & prestataires', icon: HardHat, module: 'providers' },
      { to: '/equipe', label: 'Équipe', icon: UserCog, module: 'team' },
    ],
  },
  {
    label: 'Travaux',
    items: [
      { to: '/devis', label: 'Demandes de devis', icon: FileText, module: 'quotes' },
      { to: '/partenaires', label: 'Entreprises partenaires', icon: Handshake, module: 'partners' },
    ],
  },
  {
    label: 'Finances',
    items: [{ to: '/facturation', label: 'Appel de fonds', icon: Receipt, module: 'billing' }],
  },
  {
    label: 'Ressources',
    items: [
      { to: '/guide', label: "Guide d'utilisation", icon: BookOpen, module: 'guide' },
      { to: '/aide', label: 'Aide', icon: LifeBuoy, module: 'help' },
      { to: '/a-propos', label: 'À propos', icon: Info, module: 'about' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/parametres', label: 'Paramètres', icon: Settings, module: 'settings' },
      { to: '/test-acces', label: 'Vérifier les accès', icon: ShieldCheck, module: 'access_test' },
    ],
  },
];

// Espace technicien : uniquement ses interventions, la messagerie et l'agent IA.
const TECH_GROUPS = [
  {
    label: 'Mon activité',
    items: [{ to: '/mes-interventions', label: 'Mes interventions', icon: Wrench, module: 'my_interventions' }],
  },
  {
    label: 'Échanges',
    items: [
      { to: '/messagerie', label: 'Messagerie', icon: MessageCircle, module: 'messaging' },
      { to: '/agent-ia', label: 'Agent IA', icon: Sparkles, module: 'agent' },
    ],
  },
];

// Espace copropriétaire / propriétaire : ses charges, la maintenance de son
// immeuble et ses dépannages, la messagerie et l'agent IA.
const RESIDENT_GROUPS = [
  {
    label: 'Mon espace',
    items: [
      { to: '/mon-espace', label: 'Mes charges & reçus', icon: Receipt, module: 'portal' },
      { to: '/mon-immeuble', label: 'Maintenance & dépannages', icon: Wrench, module: 'my_building' },
    ],
  },
  {
    label: 'Échanges',
    items: [
      { to: '/messagerie', label: 'Messagerie', icon: MessageCircle, module: 'messaging' },
      { to: '/agent-ia', label: 'Agent IA', icon: Sparkles, module: 'agent' },
    ],
  },
];

export default function AppSidebar({ onNavigate }) {
  const { access } = useAccess();
  const kind = access?.kind || 'inconnu';
  const isSyndic = !!access?.isSyndic;
  const allowed = access?.allowed || [];

  const baseGroups =
    kind === 'technicien'
      ? TECH_GROUPS
      : kind === 'resident' || kind === 'inconnu'
        ? RESIDENT_GROUPS
        : GROUPS;

  // Chaque profil ne voit que les modules que le syndic lui a ouverts.
  const groups = baseGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.includes(item.module)),
    }))
    .filter((group) => group.items.length);

  const scopeLabel = access?.buildingIds
    ? `${access.buildingIds.length} immeuble${access.buildingIds.length > 1 ? 's' : ''}`
    : 'tous les immeubles';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_hsl(var(--primary))]">
          <span className="font-mono text-[13px] font-semibold tracking-tight">SS</span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-[17px] font-semibold leading-tight text-foreground">
            Smartsyndic
          </p>
          <p className="kicker mt-0.5 !tracking-[0.14em] !text-[9px]">Gestion de copropriété</p>
        </div>
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group, index) => (
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

      {!isSyndic && kind === 'equipe' && (
        <div className="px-3 pb-4">
          <div className="rounded-2xl border border-border/80 bg-secondary/50 p-3.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground/70">
              Mon périmètre
            </p>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">
              {ROLE_LABELS[access?.role] || 'Collaborateur'} · {scopeLabel}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border/70 px-5 py-3">
        {LEGAL_PAGES.map((page) => (
          <Link
            key={page.to}
            to={page.to}
            onClick={onNavigate}
            className="text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {page.label}
          </Link>
        ))}
      </div>
    </div>
  );
}