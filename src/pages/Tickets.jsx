import { useMemo, useState } from 'react';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import QuickFilterBar from '@/components/QuickFilterBar';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import TicketFormDialog from '@/components/tickets/TicketFormDialog';
import TicketDetailDialog from '@/components/tickets/TicketDetailDialog';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatDate, formatNumber, relativeTime } from '@/lib/format';
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS, options } from '@/lib/constants';

const CLOSED_STATUSES = ['resolu', 'clos'];
const URGENT_PRIORITIES = ['haute', 'urgente'];

export default function Tickets() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  // Un seul jeu de filtres : cliquer une carte remplace les autres filtres,
  // pour afficher exactement le nombre annoncé par la carte.
  const [filters, setFilters] = useState({ status: '', priority: '', scope: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  // Filtres appliqués sur la liste : les compteurs des cartes restent stables.
  const query = useMemo(() => ({ syndic_id: syndicId }), [syndicId]);

  const { items: tickets, loading, error, reload } = useCollection('Ticket', query, {
    enabled: !!syndicId,
    limit: 300,
  });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: providers } = useCollection('Provider', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const isClosed = (ticket) => CLOSED_STATUSES.includes(ticket.status);
  const isUrgent = (ticket) => URGENT_PRIORITIES.includes(ticket.priority || 'normale') && !isClosed(ticket);

  // Applique le filtre d'une carte en effaçant les précédents (ou le retire si déjà actif).
  const focus = (patch) =>
    setFilters((current) => {
      const same =
        current.status === (patch.status || '') &&
        current.priority === (patch.priority || '') &&
        current.scope === (patch.scope || '');
      return same ? { status: '', priority: '', scope: '' } : { status: '', priority: '', scope: '', ...patch };
    });

  const rows = tickets.filter((ticket) => {
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.priority && (ticket.priority || 'normale') !== filters.priority) return false;
    if (filters.scope === 'urgent' && !isUrgent(ticket)) return false;
    if (filters.scope === 'closed' && !isClosed(ticket)) return false;
    const haystack = `${ticket.title} ${ticket.building_name} ${ticket.requester_name} ${ticket.lot_number}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const count = (status) => tickets.filter((ticket) => ticket.status === status).length;
  const closedCount = tickets.filter(isClosed).length;
  const urgentCount = tickets.filter(isUrgent).length;
  const hasFilter = Boolean(filters.status || filters.priority || filters.scope);
  const scopeLabel =
    filters.scope === 'closed'
      ? 'Tickets résolus et clos'
      : filters.scope === 'urgent'
        ? 'Tickets urgents en cours de traitement'
        : '';

  const remove = async (ticket) => {
    await base44.entities.Ticket.delete(ticket.id);
    await logAction({ syndicId, action: 'Suppression', entity: 'Ticket', entityLabel: ticket.title });
    await reload();
  };

  return (
    <Page
      kicker="Relation résidents"
      title="Tickets & demandes"
      description="Centralisez les demandes et réclamations, qualifiez-les, affectez-les à un intervenant et suivez leur résolution."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </Button>
      }
    >
      <StatStrip
        items={[
          {
            label: 'Nouvelles',
            value: formatNumber(count('nouveau')),
            hint: 'à qualifier',
            onClick: () => focus({ status: 'nouveau' }),
            active: filters.status === 'nouveau',
          },
          {
            label: 'En cours',
            value: formatNumber(count('en_cours')),
            hint: `${formatNumber(count('en_attente'))} en attente`,
            onClick: () => focus({ status: 'en_cours' }),
            active: filters.status === 'en_cours',
          },
          {
            label: 'Urgentes',
            value: formatNumber(urgentCount),
            hint: 'priorité haute ou urgente, non clôturées',
            onClick: () => focus({ scope: 'urgent' }),
            active: filters.scope === 'urgent',
          },
          {
            label: 'Clôturées',
            value: formatNumber(closedCount),
            hint: 'résolues et closes',
            onClick: () => focus({ scope: 'closed' }),
            active: filters.scope === 'closed',
          },
        ]}
      />
      <QuickFilterBar
        label={scopeLabel}
        count={scopeLabel ? rows.length : null}
        onClear={() => setFilters((current) => ({ ...current, scope: '' }))}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une demande, un immeuble, un demandeur…"
        filters={[
          {
            key: 'status',
            value: filters.status,
            onChange: (value) => setFilters((current) => ({ ...current, status: value })),
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(TICKET_STATUS),
          },
          {
            key: 'priority',
            value: filters.priority,
            onChange: (value) => setFilters((current) => ({ ...current, priority: value })),
            placeholder: 'Priorité',
            allLabel: 'Toutes priorités',
            options: options(TICKET_PRIORITY),
          },
        ]}
        columns={[
          {
            key: 'title',
            header: 'Demande',
            render: (row) => (
              <div className="min-w-0 max-w-[280px]">
                <p className="truncate font-medium text-foreground">{row.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {TICKET_CATEGORY[row.category] || 'Autre'} · {row.building_name || 'Immeuble non précisé'}
                  {row.lot_number ? ` · Lot ${row.lot_number}` : ''}
                </p>
              </div>
            ),
          },
          {
            key: 'requester_name',
            header: 'Demandeur',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate">{row.requester_name || '—'}</p>
                <p className="truncate text-[11px] text-muted-foreground">{row.requester_email || ''}</p>
              </div>
            ),
          },
          { key: 'priority', header: 'Priorité', render: (row) => <StatusBadge value={row.priority} map={TICKET_PRIORITY} /> },
          { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={TICKET_STATUS} /> },
          {
            key: 'assigned_name',
            header: 'Affecté à',
            render: (row) => <span className="text-foreground/75">{row.assigned_name || 'Non affecté'}</span>,
          },
          {
            key: 'created_date',
            header: 'Créée',
            render: (row) => (
              <div>
                <p className="text-foreground/75">{relativeTime(row.created_date)}</p>
                {row.due_date && <p className="text-[11px] text-muted-foreground">échéance {formatDate(row.due_date)}</p>}
              </div>
            ),
          },
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (row) => (
              <RowActions
                onView={() => setDetail(row)}
                onEdit={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
                onDelete={() => remove(row)}
                label={row.title}
              />
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={setDetail}
        empty={
          hasFilter
            ? {
                icon: TicketIcon,
                title: 'Aucune demande ne correspond à ce filtre',
                description: 'Retirez le filtre pour retrouver l’ensemble de vos demandes.',
                action: (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({ status: '', priority: '', scope: '' });
                      setSearch('');
                    }}
                  >
                    Retirer les filtres
                  </Button>
                ),
              }
            : {
                icon: TicketIcon,
                title: 'Aucune demande enregistrée',
                description: 'Créez une première demande pour suivre son traitement de bout en bout.',
                action: (
                  <Button className="gap-2" onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nouvelle demande
                  </Button>
                ),
              }
        }
      />

      <TicketFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ticket={editing}
        buildings={buildings}
        syndicId={syndicId}
        onSaved={reload}
      />

      <TicketDetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        ticket={detail}
        providers={providers}
        syndicId={syndicId}
        onUpdated={reload}
      />
    </Page>
  );
}