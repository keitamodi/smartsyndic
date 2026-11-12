import { useMemo, useState } from 'react';
import { Plus, Ticket as TicketIcon } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
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

export default function Tickets() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const query = useMemo(() => {
    const next = { syndic_id: syndicId };
    if (statusFilter) next.status = statusFilter;
    if (priorityFilter) next.priority = priorityFilter;
    return next;
  }, [syndicId, statusFilter, priorityFilter]);

  const { items: tickets, loading, error, reload } = useCollection('Ticket', query, {
    enabled: !!syndicId,
    limit: 300,
  });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: providers } = useCollection('Provider', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const rows = tickets.filter((ticket) => {
    const haystack = `${ticket.title} ${ticket.building_name} ${ticket.requester_name} ${ticket.lot_number}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const count = (status) => tickets.filter((ticket) => ticket.status === status).length;
  const urgent = tickets.filter((ticket) => ticket.priority === 'urgente' && ticket.status !== 'clos').length;

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
          { label: 'Nouvelles', value: formatNumber(count('nouveau')), hint: 'à qualifier' },
          { label: 'En cours', value: formatNumber(count('en_cours')), hint: `${formatNumber(count('en_attente'))} en attente` },
          { label: 'Urgentes', value: formatNumber(urgent), hint: 'priorité haute ou urgente' },
          { label: 'Clôturées', value: formatNumber(count('clos') + count('resolu')), hint: 'résolues et closes' },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une demande, un immeuble, un demandeur…"
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(TICKET_STATUS),
          },
          {
            key: 'priority',
            value: priorityFilter,
            onChange: setPriorityFilter,
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
        empty={{
          icon: TicketIcon,
          title: 'Aucune demande enregistrée',
          description: 'Créez une première demande pour suivre son traitement de bout en bout.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle demande
            </Button>
          ),
        }}
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