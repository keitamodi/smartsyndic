import useCountUp from '@/hooks/useCountUp';

function StatItem({ label, value, format }) {
  const numeric = typeof value === 'number';
  const animated = useCountUp(numeric ? value : 0);
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-mono text-[19px] leading-none text-foreground tnum">
        {numeric ? (typeof format === 'function' ? format(animated) : Math.round(animated)) : value}
      </dd>
    </div>
  );
}

export default function MetricCard({ title, sub, graphic, stats = [], footnote }) {
  return (
    <article className="flex flex-col gap-4 rounded-[24px] border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-foreground">{title}</h2>
        <p className="mt-1 text-[11.5px] text-muted-foreground">{sub}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-secondary/30 px-3 py-2">{graphic}</div>

      <dl className="flex flex-wrap gap-x-7 gap-y-3">
        {stats.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </dl>

      {footnote && <p className="text-[11.5px] leading-snug text-muted-foreground">{footnote}</p>}
    </article>
  );
}