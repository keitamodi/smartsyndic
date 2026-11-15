import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL = '__all__';

export default function RepertoireFilters({
  search,
  onSearch,
  status,
  onStatus,
  statusOptions = [],
  statusAllLabel = 'Tous les statuts',
  work,
  onWork,
  workOptions = [],
  workAllLabel = 'Tous les métiers',
  onReset,
  active,
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-card text-muted-foreground ring-1 ring-inset ring-border">
            <SlidersHorizontal className="h-3 w-3" />
          </span>
          <p className="font-heading text-[13px] font-semibold text-foreground">
            Filtrer mon répertoire
          </p>
        </div>
        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-[11.5px] text-muted-foreground"
            onClick={onReset}
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_195px_195px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Rechercher une entreprise, une ville, un SIRET…"
            className="h-9 border-border/80 bg-card pl-9 text-[13px]"
          />
        </div>

        <Select value={status || ALL} onValueChange={(next) => onStatus(next === ALL ? '' : next)}>
          <SelectTrigger className="h-9 bg-card text-[13px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{statusAllLabel}</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={work || ALL} onValueChange={(next) => onWork(next === ALL ? '' : next)}>
          <SelectTrigger className="h-9 bg-card text-[13px]">
            <SelectValue placeholder="Métier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{workAllLabel}</SelectItem>
            {workOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}