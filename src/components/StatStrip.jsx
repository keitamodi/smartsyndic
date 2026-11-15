export default function StatStrip({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm"
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
          </div>
        );
      })}
    </div>
  );
}