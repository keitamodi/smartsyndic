import { useState } from 'react';
import { KeyRound, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function ProviderAccessCard({ provider }) {
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');

  if (!provider) return null;

  const invite = async () => {
    setState('sending');
    setMessage('');
    try {
      await base44.users.inviteUser(provider.email, 'user');
      setState('done');
      setMessage(`Invitation envoyée à ${provider.email}.`);
    } catch (failure) {
      setState('idle');
      setMessage(failure?.message || "L’invitation n’a pas pu être envoyée.");
    }
  };

  return (
    <div className="rounded-xl border border-border/70 p-3">
      <p className="kicker !text-[9px]">Accès technicien</p>
      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
        {provider.email
          ? `${provider.email} reçoit une invitation : une fois connecté, il retrouve ses interventions dans « Mes interventions ».`
          : 'Renseignez un email sur la fiche pour ouvrir l’espace technicien.'}
      </p>
      {provider.email && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 gap-1.5"
          onClick={invite}
          disabled={state === 'sending' || state === 'done'}
        >
          {state === 'sending' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : state === 'done' ? (
            <MailCheck className="h-4 w-4" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {state === 'done' ? 'Invitation envoyée' : 'Inviter à se connecter'}
        </Button>
      )}
      {message && <p className="mt-2 text-[11.5px] text-muted-foreground">{message}</p>}
    </div>
  );
}