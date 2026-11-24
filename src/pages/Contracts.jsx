import { useMemo, useState } from 'react';
import { AlertTriangle, FileSignature, Plus } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import QuickFilterBar from '@/components/QuickFilterBar';
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
import AttachmentList from '@/components/AttachmentList';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatDate, formatEUR, formatNumber } from '@/lib/format';
import {
  CONTRACT_KIND,
  CONTRACT_RENEWAL,
  CONTRACT_STATUS,
  options,
} from '@/lib/constants';

const EMPTY = {
  title: '',
  building_id: '',
  provider_id: '',
  kind: 'maintenance',
  reference: '',
  start_date: '',
  end_date: '',
  amount: '',
  renewal: 'tacite',
  status: 'actif',
  file_uri: [],
  notes: '',
};

const daysUntil = (date) => {
  if (!date) return null;
  const diff = new Date(date).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(diff / 86400000);
};

export default function Contracts() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quick, setQuick] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  // Filtres appliqués sur la liste : les compteurs des cartes restent stables.
  const query = useMemo(() => ({ syndic_id: syndicId }), [syndicId]);

  const { items, loading, error, reload } = useCollection('Contract', query, { enabled: !!syndicId, limit: 300 });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: providers } = useCollection('Provider', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const buildingName = (id) => buildings.find((building) => building.id === id)?.name || '';

  const expiringSoon = items.filter((row) => {
    const days = daysUntil(row.end_date);
    return row.status !== 'resilie' && days !== null && days >= 0 && days <= 60;
  });

  const rows = items.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false;
    if (quick === 'expiring' && !expiringSoon.some((item) => item.id === row.id)) return false;
    if (quick === 'closed' && !['echu', 'resilie'].includes(row.status)) return false;
    const haystack = `${row.title} ${row.provider_name} ${row.reference} ${buildingName(row.building_id)}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const annualAmount = items
    .filter((row) => row.status === 'actif' || row.status === 'a_renouveler')
    .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const fields = [
    { name: 'title', label: 'Intitulé du contrat', required: true, span: 2, placeholder: 'Contrat de maintenance chauffage' },
    {
      name: 'building_id',
      label: 'Immeuble',
      type: 'select',
      options: buildings.map((building) => ({ value: building.id, label: building.name })),
    },
    {
      name: 'provider_id',
      label: 'Prestataire',
      type: 'select',
      options: providers.map((provider) => ({ value: provider.id, label: provider.name })),
    },
    { name: 'kind', label: 'Type de contrat', type: 'select', options: options(CONTRACT_KIND) },
    { name: 'reference', label: 'Référence', placeholder: 'CT-2026-014' },
    { name: 'start_date', label: 'Date de début', type: 'date' },
    { name: 'end_date', label: 'Date de fin', type: 'date' },
    { name: 'amount', label: 'Montant annuel (€)', type: 'number', min: 0, step: '0.01' },
    { name: 'renewal', label: 'Renouvellement', type: 'select', options: options(CONTRACT_RENEWAL) },
    { name: 'status', label: 'Statut', type: 'select', options: options(CONTRACT_STATUS) },
    { name: 'file_uri', label: 'Document contractuel', type: 'file', span: 2, hint: 'PDF ou scan du contrat (stockage privé)' },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 3 },
  ];

  const save = async (values) => {
    const provider = providers.find((item) => item.id === values.provider_id);
    const files = Array.isArray(values.file_uri) ? values.file_uri : [];
    const payload = {
      ...values,
      provider_name: provider?.name || '',
      file_uri: files[0] || '',
    };
    if (editing) {
      await base44.entities.Contract.update(editing.id, payload);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Contrat', entityLabel: payload.title });
    } else {
      await base44.entities.Contract.create({ ...payload, syndic_id: syndicId });
      await logAction({ syndicId, action: 'Création', entity: 'Contrat', entityLabel: payload.title });
    }
    await reload();
  };

  const remove = async (row) => {
    await base44.entities.Contract.delete(row.id);
    await reload();
  };

  return (
    <Page
      kicker="Exploitation"
      title="Contrats"
      description="Suivez les contrats de vos prestataires, leurs échéances et les alertes de renouvellement."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouveau contrat
        </Button>
      }
    >
      <StatStrip
        items={[
          {
            label: 'Contrats actifs',
            value: formatNumber(items.filter((row) => row.status === 'actif').length),
            hint: 'en cours d’exécution',
            onClick: () => {
              setQuick('');
              setStatusFilter((current) => (current === 'actif' ? '' : 'actif'));
            },
            active: statusFilter === 'actif',
          },
          {
            label: 'À renouveler',
            value: formatNumber(expiringSoon.length),
            hint: 'échéance sous 60 jours',
            onClick: () => {
              setStatusFilter('');
              setQuick((current) => (current === 'expiring' ? '' : 'expiring'));
            },
            active: quick === 'expiring',
          },
          { label: 'Engagement annuel', value: formatEUR(annualAmount), hint: 'contrats actifs et à renouveler' },
          {
            label: 'Échus / résiliés',
            value: formatNumber(items.filter((row) => ['echu', 'resilie'].includes(row.status)).length),
            hint: 'à archiver',
            onClick: () => {
              setStatusFilter('');
              setQuick((current) => (current === 'closed' ? '' : 'closed'));
            },
            active: quick === 'closed',
          },
        ]}
      />
      <QuickFilterBar
        label={
          quick === 'expiring' ? 'Contrats à renouveler sous 60 jours' : quick === 'closed' ? 'Contrats échus ou résiliés' : ''
        }
        count={quick ? rows.length : null}
        onClear={() => setQuick('')}
      />

      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12.5px] leading-relaxed text-amber-900">
            <span className="font-medium">{expiringSoon.length} contrat(s)</span> arrivent à échéance dans les 60 prochains jours :{' '}
            {expiringSoon.slice(0, 3).map((row) => `${row.title} (${formatDate(row.end_date)})`).join(', ')}
            {expiringSoon.length > 3 ? '…' : ''}.
          </p>
        </div>
      )}

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un contrat, un prestataire, une référence…"
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(CONTRACT_STATUS),
          },
        ]}
        columns={[
          {
            key: 'title',
            header: 'Contrat',
            render: (row) => (
              <div className="min-w-0 max-w-[280px]">
                <p className="truncate font-medium text-foreground">{row.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {CONTRACT_KIND[row.kind] || '—'} · {row.provider_name || 'Prestataire non précisé'}
                </p>
              </div>
            ),
          },
          { key: 'building', header: 'Immeuble', render: (row) => buildingName(row.building_id) || '—' },
          {
            key: 'end_date',
            header: 'Échéance',
            render: (row) => {
              const days = daysUntil(row.end_date);
              return (
                <div>
                  <p>{formatDate(row.end_date)}</p>
                  {days !== null && days >= 0 && days <= 60 && row.status !== 'resilie' && (
                    <p className="text-[11px] text-amber-700">dans {days} jour(s)</p>
                  )}
                </div>
              );
            },
          },
          {
            key: 'amount',
            header: 'Montant',
            render: (row) => (
              <span className="font-mono text-[12.5px] tnum">{row.amount ? formatEUR(row.amount, 2) : '—'}</span>
            ),
          },
          { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={CONTRACT_STATUS} /> },
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
          icon: FileSignature,
          title: 'Aucun contrat enregistré',
          description: 'Ajoutez les contrats de maintenance, d’assurance ou de nettoyage pour anticiper les renouvellements.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouveau contrat
            </Button>
          ),
        }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Modifier le contrat' : 'Nouveau contrat'}
        description="Le document joint et les dates d’échéance alimentent les alertes de renouvellement."
        fields={fields}
        initialValues={editing ? { ...editing, file_uri: editing.file_uri ? [editing.file_uri] : [] } : EMPTY}
        onSubmit={save}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto thin-scroll sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{detail?.title}</DialogTitle>
            <DialogDescription>
              {detail?.provider_name || 'Prestataire non précisé'} · {CONTRACT_KIND[detail?.kind] || ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-1.5">
            <StatusBadge value={detail?.status} map={CONTRACT_STATUS} />
            <StatusBadge value={detail?.renewal} map={CONTRACT_RENEWAL} tone="neutral" />
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-secondary/40 p-3 text-[12.5px]">
            <div>
              <p className="kicker !text-[9px]">Immeuble</p>
              <p className="mt-0.5">{buildingName(detail?.building_id) || '—'}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Référence</p>
              <p className="mt-0.5">{detail?.reference || '—'}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Début</p>
              <p className="mt-0.5">{formatDate(detail?.start_date)}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Fin</p>
              <p className="mt-0.5">{formatDate(detail?.end_date)}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Montant annuel</p>
              <p className="mt-0.5">{detail?.amount ? formatEUR(detail.amount, 2) : '—'}</p>
            </div>
          </div>

          <div>
            <p className="kicker mb-1.5">Document</p>
            <AttachmentList uris={detail?.file_uri ? [detail.file_uri] : []} emptyText="Aucun document joint." />
          </div>

          {detail?.notes && (
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">{detail.notes}</p>
          )}
        </DialogContent>
      </Dialog>
    </Page>
  );
}