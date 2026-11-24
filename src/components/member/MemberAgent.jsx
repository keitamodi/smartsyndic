import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RotateCw, Sparkles } from 'lucide-react';
import Page from '@/components/Page';
import ChatBubble from '@/components/agent/ChatBubble';
import ChatComposer from '@/components/agent/ChatComposer';
import { Button } from '@/components/ui/button';
import useAccess from '@/hooks/useAccess';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

const SUGGESTIONS = [
  'Quels sont mes droits et devoirs sur les parties communes ?',
  'Qui doit payer la réparation d’une fenêtre de mon balcon ?',
  'Que disent les documents sur les travaux votés en assemblée ?',
  'Puis-je installer une climatisation en façade ?',
];

/** Agent IA du copropriétaire ou du technicien : ses questions, ses droits et devoirs. */
export default function MemberAgent() {
  const { access } = useAccess();
  const { user } = useAuth();
  const syndicId = access?.syndicId || '';
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sourcesById, setSourcesById] = useState({});
  const scrollRef = useRef(null);

  const loadMessages = useCallback(async (targetId) => {
    if (!targetId) {
      setMessages([]);
      return;
    }
    const response = await base44.functions.invoke('memberSpace', {
      action: 'agentMessages',
      conversation_id: targetId,
    });
    if (response?.data?.error) throw new Error(response.data.error);
    setMessages(response?.data?.messages || []);
  }, []);

  // Une seule conversation personnelle avec l'agent, en mode « questions copropriétaires ».
  useEffect(() => {
    let active = true;
    (async () => {
      if (!syndicId) {
        setLoading(false);
        return;
      }
      try {
        const page = await base44.entities.Conversation.filter(
          { syndic_id: syndicId, mode: 'resident' },
          { sort: '-updated_date', limit: 1 },
        );
        const rows = page?.items || (Array.isArray(page) ? page : []);
        const id = rows[0]?.id || '';
        if (!active) return;
        setConversationId(id);
        await loadMessages(id);
      } catch (failure) {
        if (active) setError(failure?.response?.data?.error || failure?.message || 'Conversation indisponible.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [syndicId, loadMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const history = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages],
  );

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending || !syndicId) return;
    setSending(true);
    setError('');
    setInput('');
    let id = conversationId;
    try {
      if (!id) {
        const conversation = await base44.entities.Conversation.create({
          syndic_id: syndicId,
          title: content.slice(0, 70),
          mode: 'resident',
          user_email: user?.email || '',
          last_message: content.slice(0, 140),
        });
        id = conversation.id;
        setConversationId(id);
      }

      await base44.entities.Message.create({
        syndic_id: syndicId,
        conversation_id: id,
        role: 'user',
        content,
      });
      await loadMessages(id);

      const response = await base44.functions.invoke('agentIA', {
        syndic_id: syndicId,
        message: content,
        mode: 'resident',
        history,
      });
      const answer = response?.data?.answer;
      if (!answer) throw new Error(response?.data?.error || "L'agent n'a pas répondu.");

      const saved = await base44.entities.Message.create({
        syndic_id: syndicId,
        conversation_id: id,
        role: 'assistant',
        content: answer,
      });
      const sources = response?.data?.sources;
      if (saved?.id && Array.isArray(sources) && sources.length > 0) {
        setSourcesById((previous) => ({ ...previous, [saved.id]: sources }));
      }
      await base44.entities.Conversation.update(id, { last_message: answer.slice(0, 140) });
      await loadMessages(id);
    } catch (failure) {
      setError(
        failure?.response?.data?.error || failure?.message || "L'assistant est momentanément indisponible.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Page
      kicker="Vos droits et devoirs"
      title="Agent IA"
      description="Posez vos questions sur la copropriété : l’assistant répond à partir des documents intégrés par votre syndic."
      actions={
        conversationId && (
          <Button variant="outline" className="gap-2" onClick={() => loadMessages(conversationId)}>
            <RotateCw className="h-4 w-4" />
            Actualiser
          </Button>
        )
      }
    >
      <section className="flex min-h-[520px] flex-col rounded-[22px] border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">Agent Smartsyndic</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Réponses issues des documents de votre copropriété
            </p>
          </div>
        </div>

        <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 && !sending ? (
            <div className="py-6">
              <p className="text-[13px] text-muted-foreground">
                Posez une question sur vos droits et vos devoirs : l’assistant s’appuie sur les documents de
                votre copropriété et sur le règlement intégré par votre syndic.
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
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                role={message.role}
                content={message.content}
                sources={sourcesById[message.id]}
              />
            ))
          )}

          {sending && (
            <div className="mr-auto flex items-center gap-2 rounded-2xl bg-secondary/60 px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              L’assistant consulte les documents de votre copropriété…
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
          hint="Réponse informative : elle ne remplace pas une décision d’assemblée générale ni un conseil juridique."
        />
      </section>
    </Page>
  );
}