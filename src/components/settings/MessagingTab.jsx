import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import SettingsCard from '@/components/settings/SettingsCard';
import ToggleRow from '@/components/settings/ToggleRow';

export default function MessagingTab({ settings, update }) {
  return (
    <SettingsCard
      icon={MessageSquare}
      title="Messagerie"
      description="Signature, réponses automatiques et notifications envoyées aux interlocuteurs."
    >
      <div className="py-2.5">
        <p className="text-[13px] font-medium text-foreground">Signature des messages</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
          Ajoutée en bas de chaque message envoyé depuis la messagerie.
        </p>
        <Textarea
          rows={3}
          value={settings.msg_signature}
          onChange={(event) => update('msg_signature', event.target.value)}
          placeholder="Camille Dubois — Cabinet Dubois, gestionnaire de copropriété"
          className="mt-2 resize-none bg-card text-[13px]"
        />
      </div>

      <ToggleRow
        label="Réponse automatique"
        description="Envoyée dès qu’un message arrive en dehors de vos horaires."
        checked={settings.msg_auto_reply}
        onChange={(value) => update('msg_auto_reply', value)}
      />
      {settings.msg_auto_reply && (
        <div className="py-2.5">
          <p className="text-[12px] font-medium text-foreground">Texte de la réponse</p>
          <Textarea
            rows={2}
            value={settings.msg_auto_reply_text}
            onChange={(event) => update('msg_auto_reply_text', event.target.value)}
            className="mt-1.5 resize-none bg-card text-[13px]"
          />
        </div>
      )}

      <ToggleRow
        label="Prévenir les résidents par e-mail"
        description="Un e-mail est envoyé au copropriétaire à chaque nouveau message du syndic."
        checked={settings.msg_notify_residents}
        onChange={(value) => update('msg_notify_residents', value)}
      />
      <ToggleRow
        label="Archiver les conversations closes"
        description="Les fils clôturés depuis plus de 90 jours sont masqués de la liste."
        checked={settings.msg_archive_closed}
        onChange={(value) => update('msg_archive_closed', value)}
      />
    </SettingsCard>
  );
}