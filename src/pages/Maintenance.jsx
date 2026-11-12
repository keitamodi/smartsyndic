import { useMemo, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatDate, formatEUR, formatNumber } from '@/lib/format';
import {
  INTERVENTION_KIND,
  INTERVENTION_STATUS,
  options,
} from '@/lib/constants';

const EMPTY = {
  title: '',
  building_id: '',
  kind: 'curative',
  status: 'planifiee',
  scheduled_date: '',
  provider_id: '',
  cost: '',
  description: '',
  report: '',
};

export default function Maintenance() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const query = useMemo(() => {
    const next = { syndic_id: syndicId };
    if (statusFilter) next.status = statusFilter;
    return next;
  }, [syndicId, statusFilter]);

  const { items, loading, error, reload } = useCollection('Intervention', query, { enabled: !!syndicId, limit: 300 });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: providers } = useCollection('Provider', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const rows = items.filter((row) => {
    const haystack = `${row.title} ${row.building_name} ${row.provider_name}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const fields = [
    { name: 'title', label: 'Intitulé de l’intervention', required: true, span: 2, placeholder: 'Révision annuelle de la chaudière' },
    {
      name: 'building_id',
      label: 'Immeuble',
      type: 'select',
      options: buildings.map((building) => ({ value: building.id, label: building.name })),
    },
    { name: 'kind', label: 'Type', type: 'select', options: options(INTERVENTION_KIND) },
    { name: 'status', label: 'Statut', type: 'select', options: options(INTERVENTION_STATUS) },
    { name: 'scheduled_date', label: 'Date planifiée', type: 'date' },
    {
      name: 'provider_id',
      label: 'Intervenant',
      type: 'select',
      options: providers.map((provider) => ({ value: provider.id, label: provider.name })),
    },
    { name: 'cost', label: 'Coût (€)', type: 'number', min: 0, step: '0.01' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 3 },
    { name: 'report', label: 'Compte rendu', type: 'textarea', span: 2, rows: 3 },
  ];

  const save = async (values) => {
    const building = buildings.find((item) => item.id === values.building_id);
    const provider = providers.find((item) => item.id === values.provider_id);
    const payload = {
      ...values,
      building_name: building?.name || '',
      provider_name: provider?.name || '',
      completed_date: values.status === 'terminee' ? editing?.completed_date || new Date().toISOString().slice(0, 10) : '',
    };
    if (editing) {
      await base44.entities.Intervention.update(editing.id, payload);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Intervention', entityLabel: payload.title });
    } else {
      await base44.entities.Intervention.create({ ...payload, syndic_id: syndicId });
      await logAction({ syndicId, action: 'Création', entity: 'Intervention', entityLabel: payload.title });
    }
    await reload();
  };

  const remove = async (row) => {
    await base44.entities.Intervention.delete(row.id);
    await reload();
  };

  const totalCost = items.reduce((sum, row) => sum + (Number(row.cost) || 0), 0);
  const late = items.filter(
    (row) => row.status === 'planifiee' && row.scheduled_date && new Date(row.scheduled_date) < new Date(new Date().toDateString()),
  ).length;

  return (
    <Page
      kicker="Exploitation"
      title="Maintenance"
      description="Planifiez les interventions préventives et curatives, suivez leur avancement et conservez les comptes rendus."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Planifier une intervention
        </Button>
      }
    >
      <StatStrip
        items={[
          {
            label: 'Planifiées',
            value: formatNumber(items.filter((row) => row.status === 'planifiee').length),
            hint: late ? `${late} en retard` : 'aucun retard',
          },
          { label: 'En cours', value: formatNumber(items.filter((row) => row.status === 'en_cours').length), hint: 'sur le terrain' },
          { label: 'Terminées', value: formatNumber(items.filter((row) => row.status === 'terminee').length), hint: 'comptes rendus disponibles' },
          { label: 'Coût cumulé', value: formatEUR(totalCost), hint: 'interventions enregistrées' },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une intervention, un immeuble, un intervenant…"
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(INTERVENTION_STATUS),
          },
        ]}
        columns={[
          {
            key: 'title',
            header: 'Intervention',
            render: (row) => (
              <div className="min-w-0 max-w-[280px]">
                <p className="truncate font-medium text-foreground">{row.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {INTERVENTION_KIND[row.kind] || '—'} · {row.building_name || 'Immeuble non précisé'}
                </p>
              </div>
            ),
          },
          { key: 'provider_name', header: 'Intervenant', render: (row) => row.provider_name || 'À affecter' },
          { key: 'scheduled_date', header: 'Date', render: (row) => formatDate(row.scheduled_date) },
          { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={INTERVENTION_STATUS} /> },
          {
            key: 'cost',
            header: 'Coût',
            render: (row) => <span className="font-mono text-[12.5px] tnum">{row.cost ? formatEUR(row.cost, 2) : '—'}</span>,
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
          icon: Wrench,
          title: 'Aucune intervention planifiée',
          description: 'Planifiez une intervention préventive ou curative pour suivre son exécution et son coût.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Planifier une intervention
            </Button>
          ),
        }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Modifier l'intervention" : 'Nouvelle intervention'}
        description="Renseignez l’immeuble, l’intervenant et la date d’exécution. Le compte rendu reste attaché à l’historique."
        fields={fields}
        initialValues={editing || EMPTY}
        onSubmit={save}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto thin-scroll sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{detail?.title}</DialogTitle>
            <DialogDescription>
              {detail?.building_name || 'Immeuble non précisé'} · {INTERVENTION_KIND[detail?.kind] || ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge value={detail?.status} map={INTERVENTION_STATUS} />
            {detail?.provider_name && <StatusBadge label={detail.provider_name} tone="neutral" />}
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-secondary/40 p-3 text-[12.5px]">
            <div>
              <p className="kicker !text-[9px]">Date planifiée</p>
              <p className="mt-0.5">{formatDate(detail?.scheduled_date)}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Terminée le</p>
              <p className="mt-0.5">{formatDate(detail?.completed_date)}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Coût</p>
              <p className="mt-0.5">{detail?.cost ? formatEUR(detail.cost, 2) : '—'}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Créée</p>
              <p className="mt-0.5">{formatDate(detail?.created_date)}</p>
            </div>
          </div>

          {detail?.description && (
            <div>
              <p className="kicker mb-1">Description</p>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">{detail.description}</p>
            </div>
          )}
          {detail?.report && (
            <div>
              <p className="kicker mb-1">Compte rendu</p>
              <p className="whitespace-pre-line rounded-xl bg-accent/40 p-3 text-[13px] leading-relaxed text-foreground/85">
                {detail.report}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Page>
  );
}