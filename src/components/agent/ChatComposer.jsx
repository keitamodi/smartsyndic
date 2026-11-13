import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ChatComposer({ value, onChange, onSend, sending, placeholder, hint }) {
  const submit = () => {
    if (!value.trim() || sending) return;
    onSend();
  };

  return (
    <div className="border-t border-border/70 p-3">
      <Textarea
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="resize-none border-border/80 text-[13px]"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[10.5px] leading-tight text-muted-foreground">{hint}</p>
        <Button className="gap-2" disabled={sending || !value.trim()} onClick={submit}>
          <Send className="h-3.5 w-3.5" />
          Envoyer
        </Button>
      </div>
    </div>
  );
}