import { motion } from 'framer-motion';

export default function LineGraph({ values = [], startLabel = '', endLabel = '' }) {
  const series = values.length ? values : [0, 0];
  const max = Math.max(...series);
  const min = Math.min(...series);
  const span = Math.max(max - min, 1);
  const step = series.length > 1 ? 184 / (series.length - 1) : 0;
  const points = series.map((value, index) => [
    8 + index * step,
    74 - ((value - min) / span) * 54,
  ]);
  const path = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];

  return (
    <svg viewBox="0 0 200 96" className="h-16 w-full overflow-visible text-primary" aria-hidden="true">
      <line x1="4" y1="20" x2="196" y2="20" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="4" y1="47" x2="196" y2="47" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="4" y1="74" x2="196" y2="74" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2 3" />
      <motion.path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      {points.map(([x, y], index) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={index === points.length - 1 ? 3.2 : 1.8}
          fill="hsl(var(--card))"
          stroke="currentColor"
          strokeWidth="2"
        />
      ))}
      {startLabel && (
        <text x="4" y="92" className="fill-muted-foreground font-mono text-[8px] uppercase tracking-wider">
          {startLabel}
        </text>
      )}
      {endLabel && (
        <text
          x="196"
          y="92"
          textAnchor="end"
          className="fill-muted-foreground font-mono text-[8px] uppercase tracking-wider"
        >
          {endLabel}
        </text>
      )}
      <title>{`Dernier point : ${last[1].toFixed(0)}`}</title>
    </svg>
  );
}