import { useState } from 'react';
import { CalendarClock, Loader2, MessageSquareWarning, Plus, Wrench } from 'lucide-react';
import Page from '@/components/Page';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import PortalReportDialog from '@/components/portal/PortalReportDialog';
import { Button } from '@/components/ui/button';
import useResidentSpace from '@/hooks/useResidentSpace';
import { INTERVENTION_KIND, INTERVENTION_STATUS, TICKET_STATUS } from '@/lib/constants';
import { formatDate } from '@/lib/format';

const OPEN_TICKET_STATUSES = ['nouveau', 'qualifie', 'en_cours', 'en_attente'];
const OPEN_INTERVENTION_STATUSES = ['planifiee', 'en_cours'];

const byDate = (a, b) => String(a.scheduled_date || '9999').localeCompare(String(b.scheduled_date || '9999'));

export default function MonImmeuble() {
  const { loading, error, maintenance = [], tickets = [], lots = [], buildings = [] } = useResidentSpace();
  const [reportOpen, setReportOpen] = useState(false);

  const myLots = lots.map((lot) => ({
    ...lot,
    buildingName: buildings.find((row) => row.id === lot.building_id)?.name || 'Immeuble',
  }));

  const upcoming = maintenance
    .filter((row) => OPEN_INTERVENTION_STATUSES.includes(row.status))
    .sort(byDate);
  const done = maintenance.filter((row) => row.status === 'terminee').sort(byDate).slice(0, 6);
  const openTickets = tickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status));

  if (loading) {
    return (
      <Page kicker="Mon immeuble" title="Maintenance & dépannages">
        <div className="flex items-center justify-center rounded-[24px] border border-border bg-card py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      kicker="Mon immeuble"
      title="Maintenance & dépannages"
      description="La maintenance programmée de votre immeuble et le suivi de vos demandes de dépannage en cours."
      actions={
        <Button className="gap-2" onClick={() => setReportOpen(true)}>
          <Plus className="h-4 w-4" />
          Signaler un incident
        </Button>
      }
    >
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <h2 className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <Wrench className="h-4 w-4 text-primary" strokeWidth={1.8} />
              Maintenance de votre immeuble
            </h2>
            <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
              {upcoming.length ? `${upcoming.length} à venir` : 'à jour'}
            </span>
          </div>

          {upcoming.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarClock}
              title="Aucune maintenance programmée"
              description="Les entretiens et contrôles planifiés sur votre immeuble apparaîtront ici dès que le syndic les aura programmés."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((row) => (
                <li key={row.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-foreground">{row.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {[row.building_name || 'Votre immeuble', INTERVENTION_KIND[row.kind] || 'Maintenance']
                          .filter(Boolean)
                          .join(' · ')}
                        {row.scheduled_date ? ` · ${formatDate(row.scheduled_date)}` : ''}
                      </p>
                      {row.description && (
                        <p className="mt-1 text-[11.5px] leading-snug text-foreground/70">{row.description}</p>
                      )}
                    </div>
                    <StatusBadge value={row.status} map={INTERVENTION_STATUS} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {done.length > 0 && (
            <div className="border-t border-border/70 px-4 py-3">
              <p className="kicker mb-2 !text-[9px]">Dernières interventions réalisées</p>
              <ul className="space-y-1.5">
                {done.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 text-[11.5px] text-muted-foreground">
                    <span className="min-w-0 truncate">{row.title}</span>
                    <span className="shrink-0">{formatDate(row.completed_date || row.scheduled_date)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <h2 className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <MessageSquareWarning className="h-4 w-4 text-primary" strokeWidth={1.8} />
              Vos dépannages en cours
            </h2>
            <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
              {openTickets.length ? `${openTickets.length} en cours` : 'aucun en cours'}
            </span>
          </div>

          {openTickets.length === 0 ? (
            <EmptyState
              compact
              icon={MessageSquareWarning}
              title="Aucune demande en cours"
              description="Une fuite, une panne, un bruit dans les parties communes ? Signalez-le : vous suivez ici son traitement par le syndic."
              action={
                <Button size="sm" className="gap-1.5" onClick={() => setReportOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Signaler un incident
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {openTickets.map((ticket) => (
                <li key={ticket.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-foreground">{ticket.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {[ticket.building_name, ticket.lot_number && `lot ${ticket.lot_number}`]
                          .filter(Boolean)
                          .join(' · ') || 'Copropriété'}
                        {' · ouvert le '}
                        {formatDate(ticket.created_date)}
                      </p>
                      {ticket.assigned_name && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Intervenant : {ticket.assigned_name}
                        </p>
                      )}
                    </div>
                    <StatusBadge value={ticket.status} map={TICKET_STATUS} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <PortalReportDialog open={reportOpen} onOpenChange={setReportOpen} lots={myLots} buildings={buildings} />
    </Page>
  );
}