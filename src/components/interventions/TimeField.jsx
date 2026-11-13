import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { durationLabel, formatMinutes } from './calendar-utils';
import { cn } from '@/lib/utils';

export default function TimeField({ label, value, options, onChange, durationsFrom }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) listRef.current.scrollTop = Math.max(0, selected.offsetTop - 70);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex min-h-[38px] items-center gap-2 rounded-md border border-input bg-secondary/50 px-3 font-mono text-[12.5px] tabular-nums text-foreground transition-colors hover:border-foreground/40"
      >
        {formatMinutes(value)}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="ivc-timelist absolute left-0 top-[calc(100%+4px)] z-30 w-max min-w-[160px] rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {options.map((minutes) => (
            <li key={minutes} role="option" aria-selected={minutes === value} data-selected={minutes === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(minutes);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left font-mono text-[12.5px] tabular-nums',
                  minutes === value
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'hover:bg-secondary/70',
                )}
              >
                <span>{formatMinutes(minutes)}</span>
                {durationsFrom != null && (
                  <span className="ml-auto pl-3 text-[11px] text-muted-foreground">
                    {durationLabel(minutes - durationsFrom)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}