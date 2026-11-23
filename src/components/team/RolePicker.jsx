import { Check } from 'lucide-react';
import { TEAM_ROLE_OPTIONS } from '@/lib/teamRoles';
import { cn } from '@/lib/utils';

export default function RolePicker({ value, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {TEAM_ROLE_OPTIONS.map((role) => {
        const active = value === role.value;
        return (
          <button
            key={role.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(role.value)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-left transition-colors',
              active ? 'border-primary/45 bg-accent' : 'border-border hover:bg-secondary/50',
            )}
          >
            <span className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  'text-[12.5px] font-medium leading-snug',
                  active ? 'text-accent-foreground' : 'text-foreground',
                )}
              >
                {role.label}
              </span>
              {active && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
            </span>
            <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{role.description}</span>
          </button>
        );
      })}
    </div>
  );
}