import { MessageSquareWarning, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { formatDate } from '@/lib/format';
import { TICKET_STATUS } from '@/lib/constants';

const OPEN_STATUSES = ['nouveau', 'qualifie', 'en_cours', 'en_attente'];

export default function PortalTickets({ tickets = [], onReport }) {
  const openCount = tickets.filter((ticket) => OPEN_STATUSES.includes(ticket.status)).length;

  return (
    <section className="rounded-[24px] border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <h2 className="text-[13px] font-medium text-foreground">Mes demandes</h2>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          {openCount ? `${openCount} en cours` : 'aucune en cours'}
        </span>
      </div>

      {!tickets.length ? (
        <EmptyState
          compact
          icon={MessageSquareWarning}
          title="Aucune demande pour l’instant"
          description="Une fuite, une panne, un bruit dans les parties communes ? Signalez-le : vous suivez ici son traitement par le syndic."
          action={
            <Button size="sm" className="gap-1.5" onClick={onReport}>
              <Plus className="h-3.5 w-3.5" />
              Signaler un incident
            </Button>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-border/60">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="px-4 py-2.5">
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
                  </div>
                  <StatusBadge value={ticket.status} map={TICKET_STATUS} />
                </div>
                {ticket.resolution_note && (
                  <p className="mt-1.5 rounded-lg bg-secondary/50 px-2.5 py-1.5 text-[11px] leading-snug text-foreground/75">
                    {ticket.resolution_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-end border-t border-border/70 px-4 py-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-[11.5px]" onClick={onReport}>
              <Plus className="h-3.5 w-3.5" />
              Nouvelle demande
            </Button>
          </div>
        </>
      )}
    </section>
  );
}