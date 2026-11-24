import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mail, Phone, RotateCw, Send } from 'lucide-react';
import Page from '@/components/Page';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';

const stamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Messagerie du copropriétaire ou du technicien : un seul fil, avec le syndic. */
export default function MemberMessaging() {
  const [data, setData] = useState({ thread: null, messages: [], syndic: null });
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('memberSpace', { action: 'thread' });
      const payload = response?.data || {};
      if (payload.error) throw new Error(payload.error);
      setData({
        thread: payload.thread || null,
        messages: payload.messages || [],
        syndic: payload.syndic || null,
      });
    } catch (failure) {
      setError(failure?.response?.data?.error || failure?.message || 'Messagerie indisponible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollTop = bottomRef.current.scrollHeight;
  }, [data.messages, sending]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await base44.functions.invoke('memberSpace', { action: 'send', body });
      const payload = response?.data || {};
      if (payload.error) throw new Error(payload.error);
      setData({
        thread: payload.thread || null,
        messages: payload.messages || [],
        syndic: payload.syndic || data.syndic,
      });
      setInput('');
    } catch (failure) {
      setError(failure?.response?.data?.error || failure?.message || "Votre message n'a pas pu être envoyé.");
    } finally {
      setSending(false);
    }
  };

  const syndic = data.syndic;

  return (
    <Page
      kicker="Échanges"
      title="Messagerie"
      description="Écrivez directement au syndic de votre immeuble : vos échanges restent dans votre espace."
      wide
      actions={
        <Button variant="outline" className="gap-2" onClick={load}>
          <RotateCw className="h-4 w-4" />
          Actualiser
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="flex min-h-[520px] flex-col rounded-[22px] border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                {data.thread?.subject || 'Conversation avec le syndic'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {syndic?.name || 'Votre syndic'} · réponse pendant les heures d’ouverture
              </p>
            </div>
          </div>

          <div ref={bottomRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : data.messages.length === 0 ? (
              <p className="py-6 text-[13px] leading-relaxed text-muted-foreground">
                Aucun message pour l’instant. Écrivez votre question ci-dessous : le syndic la reçoit dans sa
                messagerie et vous répond ici.
              </p>
            ) : (
              data.messages.map((message) => {
                const mine = message.direction === 'entrant';
                return (
                  <div key={message.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        mine
                          ? 'max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[12.5px] leading-relaxed text-primary-foreground'
                          : 'max-w-[85%] rounded-2xl rounded-bl-md bg-secondary/70 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-foreground'
                      }
                    >
                      {!mine && (
                        <p className="mb-1 font-mono text-[9.5px] uppercase tracking-wide opacity-70">
                          {message.author_name || syndic?.name || 'Syndic'}
                        </p>
                      )}
                      <p className="whitespace-pre-line">{message.body}</p>
                      <p className={mine ? 'mt-1 text-right text-[10px] opacity-70' : 'mt-1 text-[10px] opacity-60'}>
                        {stamp(message.created_date)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {sending && (
              <div className="flex justify-end">
                <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2 text-[11.5px] text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Envoi…
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="mx-4 mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>
          )}

          <div className="border-t border-border/70 p-3">
            <Textarea
              rows={3}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Votre message au syndic…"
              className="resize-none"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[10.5px] text-muted-foreground">
                Pour une urgence (fuite, panne), signalez un incident depuis « Mes charges & reçus ».
              </p>
              <Button className="gap-2" onClick={send} disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[22px] border border-border bg-card p-4">
            <p className="kicker">Votre syndic</p>
            <p className="mt-2 text-[13px] font-medium text-foreground">{syndic?.name || 'Cabinet syndic'}</p>
            {syndic?.email && (
              <a
                href={`mailto:${syndic.email}`}
                className="mt-2 flex items-center gap-2 text-[12px] text-foreground/75 hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{syndic.email}</span>
              </a>
            )}
            {syndic?.phone && (
              <a
                href={`tel:${syndic.phone}`}
                className="mt-1.5 flex items-center gap-2 text-[12px] text-foreground/75 hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{syndic.phone}</span>
              </a>
            )}
          </section>
          <p className="rounded-[18px] border border-border/70 bg-secondary/40 px-3.5 py-3 text-[11px] leading-relaxed text-muted-foreground">
            Vos échanges sont conservés dans le dossier de votre immeuble. Les questions sur vos droits et devoirs
            peuvent aussi être posées à l’agent IA.
          </p>
        </aside>
      </div>
    </Page>
  );
}