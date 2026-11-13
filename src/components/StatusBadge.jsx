import { cn } from '@/lib/utils';
import { STATUS_TONES } from '@/lib/constants';

const TONE_CLASSES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/15',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  gray: 'bg-secondary text-muted-foreground ring-border',
  neutral: 'bg-secondary text-foreground/70 ring-border',
};

export default function StatusBadge({ value, map, label, tone, className }) {
  const text = label || map?.[value] || value || '—';
  const resolved = tone || STATUS_TONES[value] || 'neutral';
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        TONE_CLASSES[resolved] || TONE_CLASSES.neutral,
        className,
      )}
    >
      {text}
    </span>
  );
}