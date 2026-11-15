import { Bell, Mail, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SettingsCard from '@/components/settings/SettingsCard';
import ToggleRow from '@/components/settings/ToggleRow';
import SelectRow from '@/components/settings/SelectRow';
import { DIGEST_OPTIONS } from '@/lib/settings';

const EVENT_ROWS = [
  { field: 'notify_tickets', label: 'Tickets & demandes', description: 'Nouvelle demande, réponse ou changement de statut.' },
  { field: 'notify_interventions', label: 'Interventions', description: 'Planification, rappel avant échéance et clôture.' },
  { field: 'notify_invoices', label: 'Facturation', description: 'Appel de fonds émis, paiement reçu ou retard détecté.' },
  { field: 'notify_contracts', label: 'Contrats', description: 'Échéance proche et renouvellement tacite.' },
  { field: 'notify_assemblies', label: 'Assemblées générales', description: 'Convocation, ordre du jour et procès-verbal.' },
  { field: 'notify_messages', label: 'Messagerie', description: 'Nouveau message d’un copropriétaire ou d’un prestataire.' },
];

export default function NotificationsTab({ settings, update }) {
  return (
    <div className="space-y-4">
      <SettingsCard
        icon={Bell}
        title="Alertes par module"
        description="Choisissez les événements qui remontent dans la cloche de notification."
      >
        {EVENT_ROWS.map((row) => (
          <ToggleRow
            key={row.field}
            label={row.label}
            description={row.description}
            checked={settings[row.field]}
            onChange={(value) => update(row.field, value)}
          />
        ))}
      </SettingsCard>

      <SettingsCard
        icon={Mail}
        title="E-mails et fréquence"
        description="Regroupe les alertes pour éviter les envois multiples dans la journée."
      >
        <SelectRow
          label="Rythme des e-mails"
          description="Les alertes urgentes restent envoyées immédiatement."
          value={settings.email_digest}
          onChange={(value) => update('email_digest', value)}
          options={DIGEST_OPTIONS}
        />
        <ToggleRow
          label="Plage de silence"
          description="Aucune alerte envoyée pendant cette période."
          checked={settings.quiet_hours}
          onChange={(value) => update('quiet_hours', value)}
        />
        {settings.quiet_hours && (
          <div className="grid gap-3 py-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-medium text-foreground">Début</span>
              <Input
                type="time"
                value={settings.quiet_start}
                onChange={(event) => update('quiet_start', event.target.value)}
                className="mt-1 h-9 bg-card text-[13px]"
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-medium text-foreground">Fin</span>
              <Input
                type="time"
                value={settings.quiet_end}
                onChange={(event) => update('quiet_end', event.target.value)}
                className="mt-1 h-9 bg-card text-[13px]"
              />
            </label>
          </div>
        )}
      </SettingsCard>

      <div className="flex items-start gap-2.5 rounded-[18px] border border-border/70 bg-secondary/40 px-4 py-3">
        <Moon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[11.5px] leading-snug text-muted-foreground">
          Les alertes de sécurité (validation de SIRET, accès refusé) restent toujours actives et ne
          peuvent pas être désactivées.
        </p>
      </div>
    </div>
  );
}