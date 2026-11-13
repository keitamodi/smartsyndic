import { cn } from '@/lib/utils';

export default function ChatBubble({ role, content, sources }) {
  const isUser = role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-secondary/60 text-foreground',
        )}
      >
        <p className="whitespace-pre-line">{content}</p>
        {Array.isArray(sources) && sources.length > 0 && (
          <p className="mt-2 border-t border-border/70 pt-1.5 text-[10.5px] leading-snug text-muted-foreground">
            Documents consultés : {sources.join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}