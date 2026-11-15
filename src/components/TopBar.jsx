import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, LogOut, Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SyndicFormDialog from '@/components/SyndicFormDialog';
import NotificationsMenu from '@/components/NotificationsMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { initials } from '@/lib/format';

export default function TopBar({ onMenu }) {
  const { syndics, syndic, syndicId, setSyndicId } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenu}
          aria-label="Ouvrir la navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 items-center gap-2">
          <Building2 className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" strokeWidth={1.8} />
          {syndics.length > 0 ? (
            <Select value={syndicId} onValueChange={setSyndicId}>
              <SelectTrigger className="h-9 w-[180px] border-transparent bg-transparent px-2 text-[13px] font-medium hover:bg-secondary/70 sm:w-[240px]">
                <SelectValue placeholder="Espace de travail" />
              </SelectTrigger>
              <SelectContent>
                {syndics.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="truncate text-[13px] font-medium text-muted-foreground">
              Aucun espace syndic
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => setCreating(true)}
            aria-label="Créer un espace syndic"
            title="Créer un espace syndic"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <NotificationsMenu />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 flex items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-1 pr-3 transition-colors hover:bg-secondary/60"
                aria-label="Menu du compte"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-semibold text-accent-foreground">
                  {initials(user?.full_name || user?.email || 'Utilisateur')}
                </span>
                <span className="hidden max-w-[140px] truncate text-[12.5px] text-foreground/80 sm:block">
                  {user?.full_name || syndic?.name || 'Mon espace'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="space-y-0.5">
                <span className="block truncate text-[13px] font-medium">
                  {user?.full_name || 'Mon compte'}
                </span>
                {user?.email && (
                  <span className="block truncate font-mono text-[10.5px] font-normal text-muted-foreground">
                    {user.email}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/mon-espace" className="cursor-pointer">
                  Mon espace
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/parametres" className="cursor-pointer">
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => base44.auth.logout('/login')}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SyndicFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}