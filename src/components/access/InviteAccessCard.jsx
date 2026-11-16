import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, KeyRound, Loader2, Mail, MailCheck, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { inviteKindLabel } from '@/lib/inviteKinds';
import { INVITE_DAYS, inviteLink, inviteMessage, smsHref } from '@/lib/inviteLinks';
import { whatsappHref } from '@/lib/contactLinks';

export default function InviteAccessCard({
  syndicId,
  kind,
  fullName,
  buildingId,
  buildingName,
  lotNumbers,
  memberId,
  memberType,
  email,
  phone,
}) {
  const savedEmail = String(email || '').trim();
  const savedPhone = String(phone || '').trim();

  const [channel, setChannel] = useState(savedEmail ? 'email' : 'sms');
  const [address, setAddress] = useState(savedEmail);
  const [number, setNumber] = useState(savedPhone);
  const [state, setState] = useState('idle');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [invite, setInvite] = useState(null);

  const label = inviteKindLabel(kind);
  const hasContact = Boolean(savedEmail || savedPhone);

  useEffect(() => {
    if (!syndicId || !hasContact) return undefined;
    let active = true;
    const conditions = [savedEmail && { email: savedEmail }, savedPhone && { phone: savedPhone }].filter(Boolean);
    base44.entities.MemberInvite.filter({ syndic_id: syndicId, $or: conditions }, { sort: '-created_date', limit: 1 })
      .then((page) => {
        const found = (page.items || [])[0];
        if (!active || !found) return;
        setInvite(found);
        setLink(inviteLink(found.token));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [syndicId, savedEmail, savedPhone, hasContact]);

  const ready = channel === 'email' ? /.+@.+\..+/.test(address.trim()) : number.replace(/\D/g, '').length >= 9;

  const send = async () => {
    setState('sending');
    setMessage('');
    setCopied(false);
    try {
      const response = await base44.functions.invoke('inviteMember', {
        syndic_id: syndicId,
        kind,
        full_name: fullName || '',
        building_id: buildingId || '',
        building_name: buildingName || '',
        lot_numbers: lotNumbers || '',
        member_id: memberId || '',
        member_type: memberType || '',
        channel,
        email: channel === 'email' ? address.trim() : '',
        phone: number.trim(),
      });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      setLink(data.link || '');
      setInvite({ status: 'en_attente', email: data.email, phone: data.phone });
      setMessage(
        channel === 'email'
          ? data.email_sent
            ? `Invitation envoyée à ${address.trim()}.`
            : data.warning || "L'email n'a pas pu être envoyé : utilisez le lien ci-dessous."
          : 'Lien prêt : envoyez-le par SMS ou WhatsApp, ou copiez-le.',
      );
    } catch (failure) {
      setMessage(failure?.response?.data?.error || failure?.message || "L'invitation n'a pas pu être envoyée.");
    } finally {
      setState('idle');
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

  const shareText = inviteMessage({ kindLabel: label, buildingName, lotNumbers, link, days: INVITE_DAYS });

  return (
    <div className="rounded-xl border border-border/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="kicker !text-[9px]">Accès {label}</p>
        {invite?.status === 'acceptee' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <Check className="h-3 w-3" /> Compte activé
          </span>
        )}
        {invite?.status === 'en_attente' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            <MailCheck className="h-3 w-3" /> Invitation en attente
          </span>
        )}
      </div>

      <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
        Un lien personnel pour créer son mot de passe et retrouver son espace {label.toLowerCase()}. Sans ce lien,
        aucune inscription n’est possible.
      </p>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <Button
          size="sm"
          variant={channel === 'email' ? 'default' : 'outline'}
          className="gap-1.5"
          onClick={() => setChannel('email')}
        >
          <Mail className="h-3.5 w-3.5" /> Par email
        </Button>
        <Button
          size="sm"
          variant={channel === 'email' ? 'outline' : 'default'}
          className="gap-1.5"
          onClick={() => setChannel('sms')}
        >
          <Smartphone className="h-3.5 w-3.5" /> Par téléphone
        </Button>
      </div>

      <div className="mt-2">
        {channel === 'email' ? (
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="marie.lambert@email.fr"
            className="h-9 text-[12.5px]"
            aria-label="Email du destinataire"
          />
        ) : (
          <Input
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder="06 12 34 56 78"
            className="h-9 text-[12.5px]"
            aria-label="Téléphone du destinataire"
          />
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        className="mt-2 gap-1.5"
        onClick={send}
        disabled={state === 'sending' || !ready}
      >
        {state === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {channel === 'email'
          ? link
            ? 'Renvoyer le lien'
            : "Envoyer le lien d'inscription"
          : link
            ? 'Régénérer le lien'
            : "Générer le lien d'inscription"}
      </Button>

      {link && (
        <div className="mt-2 flex items-center gap-1.5">
          <Input readOnly value={link} className="h-8 text-[11px]" onFocus={(event) => event.target.select()} />
          <Button size="sm" variant="ghost" onClick={copyLink} aria-label="Copier le lien">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {link && channel !== 'email' && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={smsHref(number, shareText)}>
              <MessageSquare className="h-3.5 w-3.5" /> SMS
            </a>
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <a href={whatsappHref(number, shareText)} target="_blank" rel="noreferrer">
              <Smartphone className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </Button>
        </div>
      )}

      {message && <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">{message}</p>}

      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        {kind === 'technicien' ? (
          <>
            Ses interventions se programment dans{' '}
            <Link to="/maintenance" className="font-medium text-primary hover:underline">
              Interventions
            </Link>
            .
          </>
        ) : (
          <>Son immeuble et ses lots se règlent sur sa fiche : ils s’ouvrent dans son espace après activation.</>
        )}
      </p>
    </div>
  );
}