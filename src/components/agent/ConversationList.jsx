import { Loader2, MessageSquare } from 'lucide-react';
import { relativeTime } from '@/lib/format';

export default function ConversationList({ conversations, selectedId, onSelect, loading }) {
  return (
    <aside className="thin-scroll max-h-[560px] overflow-y-auto rounded-[22px] border border-border bg-card p-2">
      <p className="kicker px-2 py-1.5">Conversations</p>
      {loading && (
        <p className="flex items-center gap-2 px-2 py-4 text-[11.5px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Chargement…
        </p>
      )}
      {!loading && conversations.length === 0 && (
        <div className="px-2 py-4">
          <MessageSquare className="h-4 w-4 text-muted-foreground" strokeWidth={1.6} />
          <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">
            Aucune conversation. Posez votre première question.
          </p>
        </div>
      )}
      <ul className="space-y-0.5">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
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
    </aside>
  );
}