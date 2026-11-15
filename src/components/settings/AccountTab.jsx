import { useEffect, useState } from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsCard from '@/components/settings/SettingsCard';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/lib/workspace';

export default function AccountTab() {
  const { syndic } = useWorkspace();
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

  const rows = [
    { label: 'Nom', value: user?.full_name || '—' },
    { label: 'E-mail', value: user?.email || '—' },
    { label: 'Rôle', value: user?.role === 'admin' ? 'Administrateur' : 'Utilisateur' },
    { label: 'Espace de travail', value: syndic?.name || '—' },
  ];

  return (
    <div className="space-y-4">
      <SettingsCard
        icon={UserCircle}
        title="Mon compte"
        description="Informations du compte utilisé pour accéder à l’application."
      >
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <span className="text-[12.5px] text-muted-foreground">{row.label}</span>
            <span className="text-[13px] font-medium text-foreground">{row.value}</span>
          </div>
        ))}
      </SettingsCard>

      <SettingsCard
        icon={LogOut}
        title="Session"
        description="La déconnexion ferme votre session sur cet appareil."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">Se déconnecter</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
              Vous devrez saisir vos identifiants pour revenir sur votre espace.
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 gap-2 text-foreground"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}