import { Globe } from 'lucide-react';
import SettingsCard from '@/components/settings/SettingsCard';
import SelectRow from '@/components/settings/SelectRow';
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/lib/settings';

export default function GeneralTab({ settings, update }) {
  return (
    <SettingsCard
      icon={Globe}
      title="Préférences générales"
      description="Langue, fuseau horaire et formats appliqués à l’ensemble des modules."
    >
      <SelectRow
        label="Langue de l’interface"
        description="Langue utilisée dans les écrans et les e-mails envoyés par l’application."
        value={settings.language}
        onChange={(value) => update('language', value)}
        options={LANGUAGE_OPTIONS}
      />
      <SelectRow
        label="Fuseau horaire"
        description="Référence des dates d’intervention, d’assemblée et des relances."
        value={settings.timezone}
        onChange={(value) => update('timezone', value)}
        options={TIMEZONE_OPTIONS}
      />
      <SelectRow
        label="Format des dates"
        description="S’applique aux tableaux, documents et échéances."
        value={settings.date_format}
        onChange={(value) => update('date_format', value)}
        options={DATE_FORMAT_OPTIONS}
      />
      <SelectRow
        label="Devise"
        description="Utilisée pour les appels de fonds, factures et devis."
        value={settings.currency}
        onChange={(value) => update('currency', value)}
        options={CURRENCY_OPTIONS}
      />
    </SettingsCard>
  );
}