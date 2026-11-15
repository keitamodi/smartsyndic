import { UserCog } from 'lucide-react';
import SettingsCard from '@/components/settings/SettingsCard';
import ToggleRow from '@/components/settings/ToggleRow';
import SelectRow from '@/components/settings/SelectRow';
import { TEAM_ROLE, options } from '@/lib/constants';

export default function TeamTab({ settings, update }) {
  return (
    <SettingsCard
      icon={UserCog}
      title="Équipe du cabinet"
      description="Règles appliquées aux nouveaux membres invités."
    >
      <SelectRow
        label="Rôle par défaut"
        description="Attribué à chaque nouveau collaborateur invité."
        value={settings.team_default_role}
        onChange={(value) => update('team_default_role', value)}
        options={options(TEAM_ROLE)}
      />
      <ToggleRow
        label="Envoyer l’invitation par e-mail"
        description="Le collaborateur reçoit un lien pour activer son accès."
        checked={settings.team_invite_email}
        onChange={(value) => update('team_invite_email', value)}
      />
      <ToggleRow
        label="Limiter aux immeubles assignés"
        description="Un membre ne voit que les immeubles de son périmètre."
        checked={settings.team_scope_restricted}
        onChange={(value) => update('team_scope_restricted', value)}
      />
      <ToggleRow
        label="Validation par un administrateur"
        description="Un accès invité doit être confirmé avant d’être actif."
        checked={settings.team_validation_required}
        onChange={(value) => update('team_validation_required', value)}
      />
    </SettingsCard>
  );
}