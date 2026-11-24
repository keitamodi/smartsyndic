import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StatStrip({ items = [] }) {
  if (!items.length) return null;

  // Un clic applique le filtre de la carte puis amène directement à la liste.
  const activate = (item) => () => {
    item.onClick();
    window.requestAnimationFrame(() => {
      document.querySelector('[data-page-list]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const clickable = typeof item.onClick === 'function';
        const Tag = clickable ? 'button' : 'div';
        return (
          <Tag
            key={item.label}
            type={clickable ? 'button' : undefined}
            onClick={clickable ? activate(item) : undefined}
            aria-pressed={clickable ? Boolean(item.active) : undefined}
            className={cn(
              'rounded-2xl border bg-card px-4 py-3.5 text-left shadow-sm',
              clickable &&
                'cursor-pointer transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              item.active ? 'border-primary/60 bg-accent/40 ring-1 ring-primary/25' : 'border-border',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="kicker !text-[9px]">{item.label}</p>
              {Icon && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            <p className="mt-1.5 font-mono text-[21px] leading-none text-foreground tnum">
              {item.value}
            </p>
            {item.hint && (
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{item.hint}</p>
            )}
            {clickable && (
              <span className="mt-1.5 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">
                Voir le détail
                <ArrowRight className="h-2.5 w-2.5" />
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}