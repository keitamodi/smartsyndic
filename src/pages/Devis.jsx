import { useMemo, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import QuoteRequestDialog from '@/components/quotes/QuoteRequestDialog';
import QuoteRequestDetail from '@/components/quotes/QuoteRequestDetail';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatDate, formatEUR, formatNumber } from '@/lib/format';
import { options, QUOTE_REQUEST_STATUS, WORK_TYPE } from '@/lib/constants';

export default function Devis() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workFilter, setWorkFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const { items: requests, loading, error, reload } = useCollection(
    'QuoteRequest',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 300 },
  );
  const { items: invites, reload: reloadInvites } = useCollection(
    'QuoteInvite',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 500 },
  );
  const { items: offers, reload: reloadOffers } = useCollection(
    'QuoteOffer',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 500 },
  );
  const { items: companies, reload: reloadCompanies } = useCollection(
    'PartnerCompany',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 300 },
  );
  const { items: buildings } = useCollection(
    'Building',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 200 },
  );

  const detail = requests.find((row) => row.id === detailId) || null;

  const rows = useMemo(() => {
    const term = search.toLowerCase();
    return requests.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (workFilter && row.work_type !== workFilter) return false;
      return `${row.title} ${row.reference} ${row.city} ${row.postal_code}`
        .toLowerCase()
        .includes(term);
    });
  }, [requests, search, statusFilter, workFilter]);

  if (!syndicId) return <WorkspaceRequired />;

  const reloadAll = async () => {
    await Promise.all([reload(), reloadInvites(), reloadOffers(), reloadCompanies()]);
  };

  const invitesOf = (requestId) => invites.filter((row) => row.request_id === requestId);
  const offersOf = (requestId) => offers.filter((row) => row.request_id === requestId);
  const bestOf = (requestId) => {
    const amounts = offersOf(requestId).map((row) => row.amount || 0);
    return amounts.length > 0 ? Math.min(...amounts) : null;
  };

  const save = async (values) => {
    const building = buildings.find((row) => row.id === values.building_id);
    const payload = { ...values, building_name: building?.name || '' };
    if (editing) {
      await base44.entities.QuoteRequest.update(editing.id, payload);
      await logAction({
        syndicId,
        action: 'Mise à jour',
        entity: 'Demande de devis',
        entityLabel: payload.title,
      });
    } else {
      const year = new Date().getFullYear();
      const reference = `DEV-${year}-${String(requests.length + 1).padStart(3, '0')}`;
      await base44.entities.QuoteRequest.create({
        ...payload,
        syndic_id: syndicId,
        reference,
        status: 'brouillon',
      });
      await logAction({
        syndicId,
        action: 'Création',
        entity: 'Demande de devis',
        entityLabel: payload.title,
      });
    }
    await reload();
  };

  const remove = async (row) => {
    await base44.entities.QuoteOffer.deleteMany({ request_id: row.id });
    await base44.entities.QuoteInvite.deleteMany({ request_id: row.id });
    await base44.entities.QuoteRequest.delete(row.id);
    await reloadAll();
  };

  const openRequests = requests.filter((row) => ['envoyee', 'reponses_recues'].includes(row.status));

  return (
    <Page
      kicker="Travaux"
      title="Demandes de devis"
      description="Décrivez un besoin, consultez plusieurs entreprises validées et comparez leurs devis avant de choisir."
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
          { label: 'Demandes en cours', value: formatNumber(openRequests.length), hint: 'envoyées ou en réponse' },
          { label: 'Devis reçus', value: formatNumber(offers.length), hint: 'toutes demandes confondues' },
          { label: 'Entreprises contactées', value: formatNumber(invites.length), hint: 'par e-mail ou téléphone' },
          {
            label: 'Demandes clôturées',
            value: formatNumber(requests.filter((row) => row.status === 'cloturee').length),
            hint: 'devis retenu',
          },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une demande, un type de travaux, une ville…"
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(QUOTE_REQUEST_STATUS),
          },
          {
            key: 'work_type',
            value: workFilter,
            onChange: setWorkFilter,
            placeholder: 'Travaux',
            allLabel: 'Tous les travaux',
            options: options(WORK_TYPE),
          },
        ]}
        columns={[
          {
            key: 'title',
            header: 'Demande',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {row.reference} · {WORK_TYPE[row.work_type] || 'Travaux'}
                  {row.city ? ` · ${row.city} ${row.postal_code || ''}` : ''}
                </p>
              </div>
            ),
          },
          {
            key: 'invites',
            header: 'Entreprises',
            render: (row) => {
              const count = invitesOf(row.id).length;
              return (
                <span className="font-mono text-[12px]">{count > 0 ? count : '—'}</span>
              );
            },
          },
          {
            key: 'offers',
            header: 'Devis',
            render: (row) => {
              const count = offersOf(row.id).length;
              return <span className="font-mono text-[12px]">{count > 0 ? count : '—'}</span>;
            },
          },
          {
            key: 'best',
            header: 'Meilleur prix',
            render: (row) => {
              const best = bestOf(row.id);
              return best === null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <span className="font-mono text-[12.5px] tnum">{formatEUR(best)}</span>
              );
            },
          },
          {
            key: 'status',
            header: 'Statut',
            render: (row) => <StatusBadge value={row.status} map={QUOTE_REQUEST_STATUS} />,
          },
          {
            key: 'created_date',
            header: 'Créée le',
            render: (row) => (
              <span className="text-[12px] text-muted-foreground">{formatDate(row.created_date)}</span>
            ),
          },
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (row) => (
              <RowActions
                onView={() => setDetailId(row.id)}
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
        onRowClick={(row) => setDetailId(row.id)}
        empty={{
          icon: FileText,
          title: 'Aucune demande de devis',
          description:
            'Créez une demande, joignez des photos et sollicitez vos entreprises partenaires pour comparer leurs devis.',
          action: (
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
          ),
        }}
      />

      <QuoteRequestDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        buildings={buildings}
        initial={editing}
        onSubmit={save}
      />

      <QuoteRequestDetail
        open={!!detail}
        onOpenChange={(open) => !open && setDetailId(null)}
        request={detail}
        invites={detail ? invitesOf(detail.id) : []}
        offers={detail ? offersOf(detail.id) : []}
        companies={companies}
        syndicId={syndicId}
        onChanged={reloadAll}
      />
    </Page>
  );
}