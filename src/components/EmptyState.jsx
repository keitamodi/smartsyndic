import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmptyState({ icon: Icon = Building2, title, description, action, className, compact }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-10' : 'py-16', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-secondary/60">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}