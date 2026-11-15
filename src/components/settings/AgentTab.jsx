import { Sparkles } from 'lucide-react';
import SettingsCard from '@/components/settings/SettingsCard';
import ToggleRow from '@/components/settings/ToggleRow';
import SelectRow from '@/components/settings/SelectRow';
import {
  AGENT_MODE_OPTIONS,
  AGENT_RETENTION_OPTIONS,
  AGENT_TONE_OPTIONS,
} from '@/lib/settings';

export default function AgentTab({ settings, update }) {
  return (
    <div className="space-y-4">
      <SettingsCard
        icon={Sparkles}
        title="Comportement de l’assistant"
        description="Définit à qui l’agent répond et sur quel ton."
      >
        <SelectRow
          label="Public de l’assistant"
          value={settings.agent_mode}
          onChange={(value) => update('agent_mode', value)}
          options={AGENT_MODE_OPTIONS}
        />
        <SelectRow
          label="Ton des réponses"
          value={settings.agent_tone}
          onChange={(value) => update('agent_tone', value)}
          options={AGENT_TONE_OPTIONS}
        />
        <SelectRow
          label="Conservation des conversations"
          description="Durée pendant laquelle l’historique reste consultable."
          value={settings.agent_retention}
          onChange={(value) => update('agent_retention', value)}
          options={AGENT_RETENTION_OPTIONS}
        />
      </SettingsCard>

      <SettingsCard
        icon={Sparkles}
        title="Sources et restitution"
        description="Comment l’agent justifie ses réponses et les partage."
      >
        <ToggleRow
          label="Citer les documents sources"
          description="Chaque réponse affiche les documents de la copropriété utilisés."
          checked={settings.agent_sources}
          onChange={(value) => update('agent_sources', value)}
        />
        <ToggleRow
          label="Proposer un résumé de conversation"
          description="Un résumé court est généré à la clôture d’un échange."
          checked={settings.agent_summary}
          onChange={(value) => update('agent_summary', value)}
        />
        <ToggleRow
          label="M’envoyer une copie des réponses"
          description="Une copie par e-mail est envoyée aux conversations traitées par l’agent."
          checked={settings.agent_copy_email}
          onChange={(value) => update('agent_copy_email', value)}
        />
      </SettingsCard>
    </div>
  );
}