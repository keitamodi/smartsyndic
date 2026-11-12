import { motion } from 'framer-motion';
import useCountUp from '@/hooks/useCountUp';

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StatHero({ kicker, value, format, delta, note, percent, percentLabel }) {
  const animated = useCountUp(value);
  const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="relative flex flex-col gap-5 overflow-hidden rounded-[26px] border border-border bg-card px-5 py-5 sm:flex-row sm:items-center sm:gap-7 sm:px-7 sm:py-6">
      <div
        className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-primary/[0.06] blur-2xl"
        aria-hidden="true"
      />

      <div className="order-1 min-w-0 flex-1">
        <p className="kicker">{kicker}</p>
        <p className="mt-2 font-mono text-[clamp(1.85rem,5.2vw,2.6rem)] font-medium leading-none tracking-[-0.02em] text-foreground tnum">
          {typeof format === 'function' ? format(animated) : Math.round(animated)}
        </p>
      </div>

      <div className="order-2 shrink-0 sm:order-3">
        <div className="relative h-[76px] w-[76px]">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" role="img" aria-label={`${Math.round(clamped)} pour cent`}>
            <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
            <motion.circle
              cx="40"
              cy="40"
              r={RADIUS}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[14px] text-foreground tnum">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>

      <div className="order-3 sm:order-2 sm:max-w-[210px]">
        <p className="flex flex-wrap items-baseline gap-2 text-[13px] leading-snug">
          {delta && <span className="font-mono text-primary">{delta}</span>}
          <span className="text-muted-foreground">{note}</span>
        </p>
        {percentLabel && <p className="mt-1 text-[11px] text-muted-foreground/80">{percentLabel}</p>}
      </div>
    </div>
  );
}