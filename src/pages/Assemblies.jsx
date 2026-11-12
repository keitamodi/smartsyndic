import { useMemo, useState } from 'react';
import { CalendarDays, Gavel, Plus } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import AssemblyDetail from '@/components/assemblies/AssemblyDetail';
import DocumentsTab from '@/components/documents/DocumentsTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatDate, formatNumber } from '@/lib/format';
import { ASSEMBLY_KIND, ASSEMBLY_STATUS, options } from '@/lib/constants';

const EMPTY = {
  title: '',
  building_id: '',
  kind: 'ordinaire',
  date: '',
  time: '18:30',
  location: '',
  status: 'preparation',
  agenda: '',
  notes: '',
};

export default function Assemblies() {
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

  const { items, loading, error, reload } = useCollection('Assembly', query, { enabled: !!syndicId, limit: 200 });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: residents } = useCollection('Resident', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: documents } = useCollection('Document', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const buildingName = (id) => buildings.find((building) => building.id === id)?.name || 'Immeuble non précisé';

  const rows = items.filter((row) => {
    const haystack = `${row.title} ${buildingName(row.building_id)} ${row.location}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const upcoming = items
    .filter((row) => row.date && new Date(row.date) >= new Date(new Date().toDateString()) && row.status !== 'annulee')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const fields = [
    { name: 'title', label: 'Intitulé de l’assemblée', required: true, span: 2, placeholder: 'Assemblée générale annuelle 2026' },
    {
      name: 'building_id',
      label: 'Immeuble',
      type: 'select',
      options: buildings.map((building) => ({ value: building.id, label: building.name })),
    },
    { name: 'kind', label: 'Type', type: 'select', options: options(ASSEMBLY_KIND) },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'time', label: 'Heure', type: 'time' },
    { name: 'location', label: 'Lieu', span: 2, placeholder: 'Salle des fêtes, 14 avenue des Tilleuls' },
    { name: 'status', label: 'Statut', type: 'select', options: options(ASSEMBLY_STATUS) },
    {
      name: 'agenda',
      label: 'Ordre du jour',
      type: 'textarea',
      span: 2,
      rows: 4,
      placeholder: '1. Approbation des comptes\n2. Vote du budget prévisionnel\n3. Travaux de toiture',
    },
    { name: 'notes', label: 'Notes internes', type: 'textarea', span: 2, rows: 2 },
  ];

  const save = async (values) => {
    if (editing) {
      await base44.entities.Assembly.update(editing.id, values);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Assemblée', entityLabel: values.title });
    } else {
      await base44.entities.Assembly.create({ ...values, syndic_id: syndicId });
      await logAction({ syndicId, action: 'Création', entity: 'Assemblée', entityLabel: values.title });
    }
    await reload();
  };

  const remove = async (row) => {
    await base44.entities.Assembly.delete(row.id);
    await reload();
  };

  return (
    <Page
      kicker="Gouvernance"
      title="AG & Documents"
      description="Organisez les assemblées générales, convoquez les copropriétaires, consignez les votes et publiez les documents officiels."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Planifier une AG
        </Button>
      }
    >
      <Tabs defaultValue="assemblees" className="space-y-4">
        <TabsList className="h-10 rounded-xl bg-secondary/60 p-1">
          <TabsTrigger value="assemblees" className="rounded-lg px-3 text-[12.5px]">Assemblées générales</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-3 text-[12.5px]">
            Documents ({documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assemblees" className="space-y-4">
          <StatStrip
            items={[
              { label: 'Assemblées', value: formatNumber(items.length), hint: 'toutes périodes' },
              {
                label: 'Convoquées',
                value: formatNumber(items.filter((row) => row.status === 'convoquee').length),
                hint: 'convocations envoyées',
              },
              {
                label: 'PV publiés',
                value: formatNumber(items.filter((row) => row.minutes_uri).length),
                hint: 'procès-verbaux disponibles',
              },
              {
                label: 'Prochaine séance',
                value: upcoming[0] ? formatDate(upcoming[0].date) : '—',
                hint: upcoming[0]?.title || 'aucune AG planifiée',
              },
            ]}
          />

          <TablePanel
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher une assemblée, un immeuble, un lieu…"
            filters={[
              {
                key: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                placeholder: 'Statut',
                allLabel: 'Tous les statuts',
                options: options(ASSEMBLY_STATUS),
              },
            ]}
            columns={[
              {
                key: 'title',
                header: 'Assemblée',
                render: (row) => (
                  <div className="min-w-0 max-w-[260px]">
                    <p className="truncate font-medium text-foreground">{row.title}</p>
                    <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                      {ASSEMBLY_KIND[row.kind] || '—'} · {buildingName(row.building_id)}
                    </p>
                  </div>
                ),
              },
              {
                key: 'date',
                header: 'Date',
                render: (row) => (
                  <div>
                    <p>{formatDate(row.date)}</p>
                    <p className="text-[11px] text-muted-foreground">{row.time || '—'}</p>
                  </div>
                ),
              },
              { key: 'location', header: 'Lieu', render: (row) => <span className="text-foreground/75">{row.location || '—'}</span> },
              { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={ASSEMBLY_STATUS} /> },
              {
                key: 'convocation',
                header: 'Convocation',
                render: (row) => (
                  <StatusBadge
                    label={row.convocation_sent ? 'Envoyée' : 'À envoyer'}
                    tone={row.convocation_sent ? 'green' : 'yellow'}
                  />
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
              icon: Gavel,
              title: 'Aucune assemblée planifiée',
              description: 'Planifiez une assemblée générale pour préparer l’ordre du jour, convoquer les copropriétaires et consigner les votes.',
              action: (
                <Button className="gap-2" onClick={() => setFormOpen(true)}>
                  <CalendarDays className="h-4 w-4" />
                  Planifier une AG
                </Button>
              ),
            }}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab syndicId={syndicId} buildings={buildings} />
        </TabsContent>
      </Tabs>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Modifier l'assemblée" : 'Nouvelle assemblée générale'}
        description="L’ordre du jour structure les résolutions soumises au vote. Les convocations créent une notification interne par résident."
        fields={fields}
        initialValues={editing || EMPTY}
        onSubmit={save}
        submitLabel={editing ? 'Mettre à jour' : 'Créer l’assemblée'}
      />

      <AssemblyDetail
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        assembly={detail}
        syndicId={syndicId}
        residents={residents}
        onUpdated={reload}
      />
    </Page>
  );
}