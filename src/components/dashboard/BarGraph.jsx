import { motion } from 'framer-motion';

export default function BarGraph({ values = [] }) {
  const series = values.slice(-14);
  if (!series.length) {
    return <div className="flex h-16 items-center justify-center text-[11px] text-muted-foreground">Aucune donnée</div>;
  }
  const max = Math.max(...series, 1);

  return (
    <svg
      viewBox="0 0 150 64"
      preserveAspectRatio="none"
      className="h-16 w-full text-primary"
      aria-hidden="true"
    >
      {series.map((value, index) => {
        const height = Math.max(3, Math.round((value / max) * 62));
        return (
          <motion.rect
            key={index}
            x={index * 11}
            y={64 - height}
            width={6}
            height={height}
            rx={1.5}
            fill="currentColor"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.55, delay: index * 0.035, ease: 'easeOut' }}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'bottom',
              opacity: 0.35 + (0.65 * (index + 1)) / series.length,
            }}
          />
        );
      })}
    </svg>
  );
}