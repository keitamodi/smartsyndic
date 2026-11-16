import { useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { inviteKindLabel } from '@/lib/inviteKinds';

export default function InviteAccessCard({ syndicId, email, kind, fullName, buildingId, buildingName, lotNumbers }) {
  const [state, setState] = useState('idle');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [invite, setInvite] = useState(null);

  const address = String(email || '').trim().toLowerCase();
  const label = inviteKindLabel(kind);

  useEffect(() => {
    if (!syndicId || !address) return undefined;
    let active = true;
    base44.entities.MemberInvite.filter({ syndic_id: syndicId, email: address }, { sort: '-created_date', limit: 1 })
      .then((page) => {
        if (active) setInvite((page.items || [])[0] || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [syndicId, address]);

  const send = async () => {
    setState('sending');
    setMessage('');
    setCopied(false);
    try {
      const response = await base44.functions.invoke('inviteMember', {
        syndic_id: syndicId,
        email: address,
        kind,
        full_name: fullName || '',
        building_id: buildingId || '',
        building_name: buildingName || '',
        lot_numbers: lotNumbers || '',
      });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      setLink(data.link || '');
      setState('done');
      setInvite({ status: 'en_attente', sent_at: new Date().toISOString().slice(0, 10) });
      setMessage(
        data.email_sent
          ? `Invitation envoyée à ${address}.`
          : data.warning || "L'email n'a pas pu être envoyé : copiez le lien ci-dessous.",
      );
    } catch (failure) {
      setState('idle');
      setMessage(failure?.response?.data?.error || failure?.message || "L'invitation n'a pas pu être envoyée.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setMessage(link);
    }
  };

  return (
    <div className="rounded-xl border border-border/70 p-3">
      <p className="kicker !text-[9px]">Accès {label}</p>
      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
        {address
          ? `${address} reçoit un lien personnel pour créer son mot de passe et retrouver son espace ${label.toLowerCase()}. Sans ce lien, aucune inscription n'est possible.`
          : 'Renseignez un email sur la fiche pour ouvrir un accès.'}
      </p>

      {invite?.status === 'acceptee' && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
          <Check className="h-3 w-3" /> Compte activé
        </p>
      )}
      {invite?.status === 'en_attente' && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
          <MailCheck className="h-3 w-3" /> Invitation en attente
        </p>
      )}

      {address && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 gap-1.5"
          onClick={send}
          disabled={state === 'sending'}
        >
          {state === 'sending' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : state === 'done' ? (
            <MailCheck className="h-4 w-4" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {state === 'done' ? 'Renvoyer le lien' : "Envoyer le lien d'inscription"}
        </Button>
      )}

      {link && (
        <div className="mt-2 flex items-center gap-1.5">
          <Input readOnly value={link} className="h-8 text-[11px]" onFocus={(event) => event.target.select()} />
          <Button size="sm" variant="ghost" onClick={copyLink} aria-label="Copier le lien">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {message && <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">{message}</p>}
    </div>
  );
}