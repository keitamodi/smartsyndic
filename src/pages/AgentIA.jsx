import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageSquarePlus, Send, Sparkles } from 'lucide-react';
import Page from '@/components/Page';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { relativeTime } from '@/lib/format';

const SUGGESTIONS = [
  'Quels sont les tickets urgents en cours ?',
  'Rédige un courrier de relance pour les appels de fonds impayés.',
  'Résume la situation des contrats arrivant à échéance.',
  'Prépare un ordre du jour pour la prochaine assemblée générale.',
];

export default function AgentIA() {
  const { syndicId, syndic } = useWorkspace();
  const [selectedId, setSelectedId] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const { items: conversations, reload: reloadConversations } = useCollection(
    'Conversation',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 30 },
  );

  const { items: messages, reload: reloadMessages } = useCollection(
    'Message',
    { conversation_id: selectedId || '__none__' },
    { enabled: !!selectedId, limit: 200 },
  );

  useEffect(() => {
    if (!selectedId && conversations.length > 0) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const history = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages],
  );

  if (!syndicId) return <WorkspaceRequired />;

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setSending(true);
    setError('');
    setInput('');
    let conversationId = selectedId;
    try {
      if (!conversationId) {
        const conversation = await base44.entities.Conversation.create({
          syndic_id: syndicId,
          title: content.slice(0, 70),
          user_email: '',
          last_message: content.slice(0, 140),
        });
        conversationId = conversation.id;
        setSelectedId(conversationId);
        await reloadConversations();
      }

      await base44.entities.Message.create({
        syndic_id: syndicId,
        conversation_id: conversationId,
        role: 'user',
        content,
      });
      await reloadMessages();

      const response = await base44.functions.invoke('agentIA', {
        syndic_id: syndicId,
        message: content,
        history,
      });

      const answer = response?.data?.answer;
      if (!answer) throw new Error(response?.data?.error || "L'assistant n'a pas répondu.");

      await base44.entities.Message.create({
        syndic_id: syndicId,
        conversation_id: conversationId,
        role: 'assistant',
        content: answer,
      });
      await base44.entities.Conversation.update(conversationId, { last_message: answer.slice(0, 140) });
      await Promise.all([reloadMessages(), reloadConversations()]);
    } catch (sendError) {
      setError(sendError?.message || "L'assistant est momentanément indisponible.");
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    setSelectedId('');
    setInput('');
    setError('');
  };

  return (
    <Page
      kicker="Intelligence artificielle"
      title="Agent IA"
      description="Interrogez vos données de copropriété, préparez des courriers et des comptes rendus. L’assistant s’appuie uniquement sur les informations de votre espace."
      actions={
        <Button variant="outline" className="gap-2" onClick={startNew}>
          <MessageSquarePlus className="h-4 w-4" />
          Nouvelle conversation
        </Button>
      }
      wide
    >
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[22px] border border-border bg-card p-2">
          <p className="kicker px-2 py-1.5">Conversations</p>
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-[12px] text-muted-foreground">Aucune conversation pour le moment.</p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={
                      selectedId === conversation.id
                        ? 'w-full rounded-xl bg-accent px-2.5 py-2 text-left'
                        : 'w-full rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-secondary/60'
                    }
                  >
                    <p className="truncate text-[12.5px] font-medium text-foreground">{conversation.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {conversation.last_message || relativeTime(conversation.created_date)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-h-[540px] flex-col rounded-[22px] border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">Agent SyndicVibe</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Contexte : {syndic?.name || 'espace syndic'} · {messages.length} message(s)
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !sending && (
              <div className="py-6">
                <p className="text-[13px] text-muted-foreground">
                  Posez une question sur vos immeubles, tickets, contrats ou finances. L’assistant peut aussi rédiger
                  un courrier ou un compte rendu à partir de vos données.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-full border border-border px-3 py-1.5 text-left text-[11.5px] text-foreground/75 transition-colors hover:border-primary/40 hover:bg-accent/50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-primary-foreground'
                    : 'mr-auto max-w-[92%] rounded-2xl rounded-bl-sm bg-secondary/60 px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground'
                }
              >
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            ))}

            {sending && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-secondary/60 px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                L’assistant analyse vos données…
              </div>
            )}
          </div>

          {error && (
            <p className="mx-4 mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>
          )}

          <div className="border-t border-border/70 p-3">
            <Textarea
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Votre question… (Entrée pour envoyer)"
              className="resize-none border-border/80 text-[13px]"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[10.5px] leading-tight text-muted-foreground">
                Réponses générées automatiquement — vérifiez les informations sensibles.
              </p>
              <Button className="gap-2" disabled={sending || !input.trim()} onClick={() => send()}>
                <Send className="h-3.5 w-3.5" />
                Envoyer
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}