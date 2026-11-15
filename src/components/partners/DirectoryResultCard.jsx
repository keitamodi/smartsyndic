import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DirectoryResultCard({ item, known, onAdd }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground">{item.name}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
          {[item.naf_label, item.legal_form_label, item.employees].filter(Boolean).join(' · ') ||
            item.naf_code ||
            'Activité non précisée'}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] text-foreground/70">
          {item.address || [item.postal_code, item.city].filter(Boolean).join(' ')}
        </p>
        <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">SIRET {item.siret}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={known ? 'ghost' : 'outline'}
        disabled={known}
        onClick={() => onAdd(item)}
        className="shrink-0 gap-1.5"
      >
        {known ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        {known ? 'Au répertoire' : 'Ajouter'}
      </Button>
    </div>
  );
}