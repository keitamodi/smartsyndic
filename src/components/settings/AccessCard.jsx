import { Ban } from 'lucide-react';
import SettingsCard from '@/components/settings/SettingsCard';
import ToggleRow from '@/components/settings/ToggleRow';
import SelectRow from '@/components/settings/SelectRow';
import { ACCESS_LEVEL_OPTIONS } from '@/lib/settings';

export default function AccessCard({
  icon,
  title,
  description,
  levelField,
  rows = [],
  settings,
  update,
}) {
  const level = settings[levelField];
  const blocked = level === 'bloque';

  return (
    <SettingsCard icon={icon} title={title} description={description}>
      <SelectRow
        label="Niveau d’accès"
        description="Complet, limité aux fonctionnalités cochées, ou totalement bloqué."
        value={level}
        onChange={(value) => update(levelField, value)}
        options={ACCESS_LEVEL_OPTIONS}
      />

      {blocked && (
        <div className="flex items-start gap-2.5 py-2.5">
          <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" strokeWidth={1.8} />
          <p className="text-[11.5px] leading-snug text-muted-foreground">
            Accès bloqué : ce profil ne peut plus se connecter ni ouvrir de demande. Les fonctionnalités
            ci-dessous sont désactivées mais conservées pour un déblocage ultérieur.
          </p>
        </div>
      )}

      {rows.map((row) => (
        <ToggleRow
          key={row.field}
          label={row.label}
          description={row.description}
          checked={settings[row.field]}
          onChange={(value) => update(row.field, value)}
          disabled={blocked}
        />
      ))}
    </SettingsCard>
  );
}