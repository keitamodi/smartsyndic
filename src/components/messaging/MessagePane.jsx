import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import StatusBadge from '@/components/StatusBadge';
import ContactActions from '@/components/messaging/ContactActions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { THREAD_KIND, THREAD_STATUS, THREAD_TONE } from '@/lib/constants';
import { formatDateTime, initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function MessagePane({ thread, messages, loading, onSend, onDraft, onStatus }) {
  const [body, setBody] = useState('');
  const [asIncoming, setAsIncoming] = useState(false);
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    setBody('');
    setAsIncoming(false);
    setError('');
  }, [thread?.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thread?.id]);

  if (!thread) {
    return (
      <section className="flex min-h-[320px] min-w-0 items-center justify-center rounded-[22px] border border-dashed border-border bg-card p-6 lg:min-h-[560px]">
        <p className="max-w-[320px] text-center text-[12.5px] leading-relaxed text-muted-foreground">
          Sélectionnez une conversation ou ouvrez-en une nouvelle pour échanger avec un copropriétaire, un propriétaire,
          un technicien ou un prestataire.
        </p>
      </section>
    );
  }

  const submit = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      await onSend(text, asIncoming ? 'entrant' : 'sortant');
      setBody('');
      setAsIncoming(false);
    } catch (sendError) {
      setError(sendError?.message || 'Envoi impossible pour le moment.');
    } finally {
      setSending(false);
    }
  };

  const generateDraft = async () => {
    if (drafting) return;
    setDrafting(true);
    setError('');
    try {
      const text = await onDraft();
      if (text) setBody(text);
    } catch (draftError) {
      setError(draftError?.message || "L'assistant n'a pas pu rédiger de réponse.");
    } finally {
      setDrafting(false);
    }
  };

  return (
    <section className="flex min-h-[420px] min-w-0 flex-col rounded-[22px] border border-border bg-card md:min-h-[560px]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary font-mono text-[11px] font-semibold text-foreground/70">
            {initials(thread.contact_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-foreground">{thread.contact_name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {THREAD_KIND[thread.contact_kind] || 'Contact'}
              {thread.building_name ? ` · ${thread.building_name}` : ''}
              {thread.contact_phone ? ` · ${thread.contact_phone}` : ''}
              {thread.contact_email ? ` · ${thread.contact_email}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ContactActions
            email={thread.contact_email}
            phone={thread.contact_phone}
            name={thread.contact_name}
            subject={`SyndicVibe — ${thread.subject}`}
          />
          <StatusBadge value={thread.status} map={THREAD_STATUS} tone={THREAD_TONE[thread.status]} />
          <Select value={thread.status || 'ouvert'} onValueChange={onStatus}>
            <SelectTrigger className="h-8 w-[132px] text-[11.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(THREAD_STATUS).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-[12px]">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-b border-border/70 px-4 py-2">
        <p className="text-[11.5px] font-medium text-foreground/80">{thread.subject}</p>
      </div>

      <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading && messages.length === 0 && (
          <p className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Chargement des messages…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p className="py-8 text-center text-[12px] text-muted-foreground">
            Aucun message pour le moment. Écrivez le premier message de cette conversation.
          </p>
        )}
        {messages.map((message) => {
          const outgoing = message.direction !== 'entrant';
          return (
            <div key={message.id} className={cn('flex', outgoing ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[86%] space-y-1', outgoing && 'items-end text-right')}>
                <p className="text-[10px] text-muted-foreground">
                  {outgoing ? message.author_name || 'Syndic' : message.author_name || thread.contact_name} ·{' '}
                  {formatDateTime(message.created_date)}
                </p>
                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed',
                    outgoing
                      ? 'rounded-br-sm bg-primary text-primary-foreground'
                      : 'rounded-bl-sm bg-secondary/60 text-foreground',
                  )}
                >
                  <p className="whitespace-pre-line">{message.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mx-4 mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>
      )}

      <div className="border-t border-border/70 p-3">
        <Textarea
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className="resize-none border-border/80 text-[13px]"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="as-incoming"
              checked={asIncoming}
              onCheckedChange={(checked) => setAsIncoming(Boolean(checked))}
            />
            <Label htmlFor="as-incoming" className="text-[11px] font-normal text-muted-foreground">
              Enregistrer comme réponse reçue du contact
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={generateDraft} disabled={drafting || sending}>
              {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Réponse IA
            </Button>
            <Button className="gap-2" onClick={submit} disabled={sending || !body.trim()}>
              <Send className="h-3.5 w-3.5" />
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}