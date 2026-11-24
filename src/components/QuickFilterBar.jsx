import { X } from 'lucide-react';

export default function QuickFilterBar({ label, count, onClear }) {
  if (!label) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent px-2.5 py-1 text-[12px] text-accent-foreground">
        <span className="font-medium">{label}</span>
        {count != null && <span className="font-mono text-[10.5px] opacity-70">{count}</span>}
        <button
          type="button"
          onClick={onClear}
          className="rounded-full p-0.5 transition-colors hover:bg-primary/15"
          aria-label="Retirer le filtre"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    </div>
  );
}