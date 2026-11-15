import SettingsCard from '@/components/settings/SettingsCard';
import ToggleRow from '@/components/settings/ToggleRow';

export default function AccessCard({ icon, title, description, rows = [], settings, update }) {
  return (
    <SettingsCard icon={icon} title={title} description={description}>
      {rows.map((row) => (
        <ToggleRow
          key={row.field}
          label={row.label}
          description={row.description}
          checked={settings[row.field]}
          onChange={(value) => update(row.field, value)}
        />
      ))}
      <p className="pt-2.5 text-[11px] text-muted-foreground">
        Ces réglages s’appliquent à tous les espaces gérés par votre cabinet.
      </p>
    </SettingsCard>
  );
}