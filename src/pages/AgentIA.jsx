import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageSquarePlus, Sparkles } from 'lucide-react';
import Page from '@/components/Page';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import ConversationList from '@/components/agent/ConversationList';
import ChatBubble from '@/components/agent/ChatBubble';
import ChatComposer from '@/components/agent/ChatComposer';
import DocumentSources from '@/components/agent/DocumentSources';
import { Button } from '@/components/ui/button';
import useCollection from '@/hooks/useCollection';
import useQuota from '@/hooks/useQuota';
import QuotaLimitDialog from '@/components/quota/QuotaLimitDialog';
import useRealtimeMessages from '@/hooks/useRealtimeMessages';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const MODES = [
  { value: 'syndic', label: 'Assistant syndic' },
  { value: 'resident', label: 'Questions copropriétaires' },
];

const SUGGESTIONS = {
  syndic: [
    'Quels sont les tickets urgents en cours ?',
    'Résume les documents de la prochaine assemblée générale.',
    'Rédige un courrier de relance pour les appels de fonds impayés.',
    'Quels contrats arrivent à échéance dans les trois mois ?',
  ],
  resident: [
    'Quels sont mes droits et devoirs concernant les parties communes ?',
    'Qui doit payer la réparation d’une fenêtre de mon balcon ?',
    'Que disent les documents sur les travaux votés en assemblée ?',
    'Puis-je installer une climatisation en façade ?',
  ],
};

export default function AgentIA() {
  const { syndicId, syndic } = useWorkspace();
  const { check, limits, planName, reload: reloadQuota } = useQuota();
  const [quotaBlock, setQuotaBlock] = useState(null);
  const [mode, setMode] = useState('syndic');
  const [selectedId, setSelectedId] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sourcesById, setSourcesById] = useState({});
  const scrollRef = useRef(null);

  const {
    items: allConversations,
    loading: loadingConversations,
    reload: reloadConversations,
  } = useCollection('Conversation', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 60 });

  const { items: documents, loading: loadingDocuments } = useCollection(
    'Document',
    { syndic_id: syndicId },
    { enabled: !!syndicId, sort: '-published_date', limit: 40 },
  );

  const { items: messages, reload: reloadMessages } = useRealtimeMessages(
    'Message',
    'conversation_id',
    selectedId,
  );

  const conversations = useMemo(
    () => allConversations.filter((conversation) => (conversation.mode || 'syndic') === mode),
    [allConversations, mode],
  );

  const visibleDocuments = useMemo(
    () => (mode === 'resident' ? documents.filter((document) => document.visible_residents !== false) : documents),
    [documents, mode],
  );

  useEffect(() => {
    if (!conversations.some((conversation) => conversation.id === selectedId)) {
      setSelectedId(conversations[0]?.id || '');
    }
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
    const quota = check('ai');
    if (quota.reached) {
      setQuotaBlock(quota);
      return;
    }
    setSending(true);
    setError('');
    setInput('');
    let conversationId = selectedId;
    try {
      if (!conversationId) {
        const conversation = await base44.entities.Conversation.create({
          syndic_id: syndicId,
          title: content.slice(0, 70),
          mode,
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

      const response = await base44.functions.invoke('agentIA', {
        syndic_id: syndicId,
        message: content,
        mode,
        history,
      });

      const answer = response?.data?.answer;
      if (!answer) throw new Error(response?.data?.error || "L'assistant n'a pas répondu.");

      const saved = await base44.entities.Message.create({
        syndic_id: syndicId,
        conversation_id: conversationId,
        role: 'assistant',
        content: answer,
      });

      const sources = response?.data?.sources;
      if (saved?.id && Array.isArray(sources) && sources.length > 0) {
        setSourcesById((previous) => ({ ...previous, [saved.id]: sources }));
      }

      await base44.entities.Conversation.update(conversationId, { last_message: answer.slice(0, 140) });
      await Promise.all([reloadMessages(), reloadConversations(), reloadQuota()]);
    } catch (sendError) {
      const message = sendError?.message || "L'assistant est momentanément indisponible.";
      setError(message);
      if (/quota ia/i.test(message)) {
        setQuotaBlock({ ...check('ai'), used: limits.ai });
      }
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
      kicker="Relation & intelligence artificielle"
      title="Agent IA"
      description="Interrogez vos données et vos documents, ou faites préparer les réponses aux questions des copropriétaires sur leurs droits et devoirs."
      actions={
        <Button variant="outline" className="gap-2" onClick={startNew}>
          <MessageSquarePlus className="h-4 w-4" />
          Nouvelle conversation
        </Button>
      }
      wide
    >
      <div className="inline-flex rounded-full border border-border bg-card p-0.5">
        {MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setMode(item.value);
              setError('');
            }}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[11.5px] font-medium transition-colors',
              mode === item.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_250px]">
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loadingConversations}
        />

        <section className="flex min-h-[560px] flex-col rounded-[22px] border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">Agent Smartsyndic</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {mode === 'resident' ? 'Droits et devoirs des copropriétaires' : 'Assistant du syndic'} ·{' '}
                {syndic?.name || 'espace syndic'} · {visibleDocuments.length} document(s)
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !sending && (
              <div className="py-6">
                <p className="text-[13px] text-muted-foreground">
                  {mode === 'resident'
                    ? 'Posez une question comme le ferait un copropriétaire : l’assistant répond à partir de vos documents et du règlement de votre espace.'
                    : 'Posez une question sur vos immeubles, tickets, contrats, finances ou documents. L’assistant peut aussi rédiger un courrier ou un compte rendu.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTIONS[mode].map((suggestion) => (
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
              <ChatBubble
                key={message.id}
                role={message.role}
                content={message.content}
                sources={sourcesById[message.id]}
              />
            ))}

            {sending && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-secondary/60 px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                L’assistant consulte vos documents…
              </div>
            )}
          </div>

          {error && (
            <p className="mx-4 mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>
          )}

          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => send()}
            sending={sending}
            placeholder="Votre question… (Entrée pour envoyer)"
            hint="Réponses générées à partir de vos données et documents — vérifiez les informations sensibles."
          />
        </section>

        <DocumentSources documents={visibleDocuments} mode={mode} loading={loadingDocuments} />
      </div>

      <QuotaLimitDialog quota={quotaBlock} planName={planName} onClose={() => setQuotaBlock(null)} />
    </Page>
  );
}