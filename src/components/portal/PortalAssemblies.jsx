import { CalendarDays } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import FileLink from '@/components/quotes/FileLink';
import { formatDate } from '@/lib/format';
import { ASSEMBLY_KIND, ASSEMBLY_STATUS } from '@/lib/constants';

const VISIBLE_STATUSES = ['convoquee', 'en_cours', 'cloturee'];

const isUpcoming = (row) => {
  if (!row.date) return false;
  const date = new Date(row.date);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

export default function PortalAssemblies({ assemblies = [], buildings = [] }) {
  const visible = assemblies.filter((row) => VISIBLE_STATUSES.includes(row.status));
  const byDateDesc = [...visible].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const upcoming = byDateDesc.filter(isUpcoming).reverse();
  const past = byDateDesc.filter((row) => !isUpcoming(row));
  const ordered = [...upcoming, ...past];

  return (
    <section className="rounded-[24px] border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <h2 className="text-[13px] font-medium text-foreground">Assemblées générales</h2>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          {upcoming.length ? `prochaine le ${formatDate(upcoming[0].date)}` : `${past.length} archivée(s)`}
        </span>
      </div>

      {!ordered.length ? (
        <EmptyState
          compact
          icon={CalendarDays}
          title="Aucune assemblée programmée"
          description="Dès que votre syndic convoque une assemblée générale, vous retrouvez ici la date, le lieu et le procès-verbal."
        />
      ) : (
        <ul className="divide-y divide-border/60">
          {ordered.map((row) => {
            const building = buildings.find((item) => item.id === row.building_id);
            return (
              <li key={row.id} className="px-4 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-foreground">{row.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {ASSEMBLY_KIND[row.kind] || 'Assemblée'} · {formatDate(row.date)}
                      {row.time ? ` à ${row.time}` : ''}
                      {building?.name ? ` · ${building.name}` : ''}
                    </p>
                    {row.location && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{row.location}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge value={row.status} map={ASSEMBLY_STATUS} />
                    {row.minutes_uri && <FileLink uri={row.minutes_uri} label="PV" />}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}