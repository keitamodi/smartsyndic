import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function ActivityFeed({ rows = [], emptyText }) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-border bg-card">
      <div className="flex items-baseline justify-between px-5 pb-1 pt-4">
        <h2 className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-foreground">
          Activité récente
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {rows.length} évènement{rows.length > 1 ? 's' : ''}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul>
          {rows.map((row, index) => {
            const content = (
              <>
                <div className="flex items-baseline justify-between gap-3 sm:block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80">
                    {row.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground sm:hidden">
                    {row.time}
                  </span>
                </div>
                <span className="mt-1 block min-w-0 truncate text-[13px] text-foreground/75 sm:mt-0">
                  {row.detail}
                </span>
                <span className="hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground sm:block">
                  {row.time}
                </span>
              </>
            );

            const className = cn(
              'grid gap-x-5 px-5 py-3 transition-colors sm:grid-cols-[minmax(0,190px)_minmax(0,1fr)_auto] sm:items-center',
              index > 0 && 'border-t border-border/60',
              row.to && 'hover:bg-secondary/40',
            );

            return (
              <li key={row.id}>
                {row.to ? (
                  <Link to={row.to} className={className}>
                    {content}
                  </Link>
                ) : (
                  <div className={className}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}