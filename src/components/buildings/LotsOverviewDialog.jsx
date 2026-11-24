import { Building2, Home } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { LOT_KIND, LOT_OCCUPANCY, LOT_STATUS } from '@/lib/constants';

const VIEWS = [
  { value: 'tous', label: 'Tous les lots' },
  { value: 'occupe', label: 'Occupés' },
  { value: 'vacant', label: 'Vacants' },
];

const TITLES = {
  tous: 'Tous les lots',
  occupe: 'Lots occupés',
  vacant: 'Lots vacants',
};

export default function LotsOverviewDialog({
  view,
  onViewChange,
  onOpenChange,
  lots = [],
  buildings = [],
  onOpenBuilding,
}) {
  const rows = view === 'tous' || !view ? lots : lots.filter((lot) => lot.status === view);
  const buildingName = (id) => buildings.find((building) => building.id === id)?.name || 'Immeuble non précisé';

  return (
    <Dialog open={!!view} onOpenChange={(open) => !open && onOpenChange()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{TITLES[view] || TITLES.tous}</DialogTitle>
          <DialogDescription>
            {rows.length} lot(s) — ouvrez un lot pour accéder à son immeuble.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {VIEWS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onViewChange(item.value)}
              className={
                (view || 'tous') === item.value
                  ? 'rounded-full border border-primary/40 bg-accent px-3 py-1 text-[12px] text-accent-foreground'
                  : 'rounded-full border border-border px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-secondary'
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            compact
            icon={Home}
            title="Aucun lot dans cette vue"
            description="Ajoutez des lots depuis la fiche de l’immeuble pour les retrouver ici."
          />
        ) : (
          <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
            {rows.map((lot) => (
              <li key={lot.id}>
                <button
                  type="button"
                  onClick={() => onOpenBuilding(lot.building_id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/40"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/70">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      Lot {lot.number} · {LOT_KIND[lot.kind] || 'Lot'}
                    </p>
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      {[buildingName(lot.building_id), LOT_OCCUPANCY[lot.occupancy], lot.owner_name]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <StatusBadge value={lot.status} map={LOT_STATUS} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}