import { useMemo, useState } from 'react';
import { Building2, Home, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import useCollection from '@/hooks/useCollection';
import useQuota from '@/hooks/useQuota';
import QuotaLimitDialog from '@/components/quota/QuotaLimitDialog';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatNumber } from '@/lib/format';
import {
  BUILDING_KIND,
  BUILDING_STATUS,
  LOT_KIND,
  LOT_OCCUPANCY,
  LOT_STATUS,
  options,
} from '@/lib/constants';

const BUILDING_FIELDS = [
  { name: 'name', label: "Nom de l'immeuble", required: true, span: 2, placeholder: 'Résidence Les Tilleuls' },
  { name: 'reference', label: 'Référence interne', placeholder: 'IMM-001' },
  { name: 'manager_name', label: 'Gestionnaire référent', placeholder: 'Camille Dubois' },
  { name: 'address', label: 'Adresse', span: 2, placeholder: '14 avenue des Tilleuls' },
  { name: 'postal_code', label: 'Code postal', placeholder: '69006' },
  { name: 'city', label: 'Ville', placeholder: 'Lyon' },
  { name: 'kind', label: 'Type', type: 'select', options: options(BUILDING_KIND) },
  { name: 'status', label: 'Statut', type: 'select', options: options(BUILDING_STATUS) },
  { name: 'floors', label: 'Nombre d’étages', type: 'number', min: 0 },
  { name: 'units_count', label: 'Nombre de lots', type: 'number', min: 0 },
  { name: 'year_built', label: 'Année de construction', type: 'number', min: 1800, max: 2100 },
  { name: 'notes', label: 'Notes internes', type: 'textarea', span: 2, rows: 3 },
];

const LOT_FIELDS = [
  { name: 'number', label: 'Numéro de lot', required: true, placeholder: 'A12' },
  { name: 'floor', label: 'Étage', placeholder: '3e étage' },
  { name: 'kind', label: 'Type de lot', type: 'select', options: options(LOT_KIND) },
  { name: 'area', label: 'Surface (m²)', type: 'number', min: 0, step: '0.1' },
  { name: 'tantiemes', label: 'Tantièmes', type: 'number', min: 0 },
  { name: 'occupancy', label: 'Occupation', type: 'select', options: options(LOT_OCCUPANCY) },
  { name: 'owner_name', label: 'Propriétaire', placeholder: 'Marie Lambert' },
  { name: 'owner_email', label: 'Email du propriétaire', type: 'email' },
  { name: 'status', label: 'Statut', type: 'select', options: options(LOT_STATUS) },
  { name: 'notes', label: 'Notes', span: 2, placeholder: 'Travaux votés en AG 2026…' },
];

const EMPTY_BUILDING = {
  name: '',
  reference: '',
  manager_name: '',
  address: '',
  postal_code: '',
  city: '',
  kind: 'residentiel',
  status: 'actif',
  floors: '',
  units_count: '',
  year_built: '',
  notes: '',
};

const EMPTY_LOT = {
  number: '',
  floor: '',
  kind: 'appartement',
  area: '',
  tantiemes: '',
  occupancy: 'proprietaire_occupant',
  owner_name: '',
  owner_email: '',
  status: 'occupe',
  notes: '',
};

export default function Buildings() {
  const { syndicId } = useWorkspace();
  const { check, limits, planName, reload: reloadQuota } = useQuota();
  const [quotaBlock, setQuotaBlock] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [lotFormOpen, setLotFormOpen] = useState(false);
  const [editingLot, setEditingLot] = useState(null);

  const query = useMemo(() => {
    const next = { syndic_id: syndicId };
    if (statusFilter) next.status = statusFilter;
    return next;
  }, [syndicId, statusFilter]);

  const { items: buildings, loading, error, reload } = useCollection('Building', query, { enabled: !!syndicId });
  const { items: lots, reload: reloadLots } = useCollection('Lot', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const rows = buildings.filter((building) => {
    const haystack = `${building.name} ${building.city} ${building.address} ${building.reference}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const occupied = lots.filter((lot) => lot.status === 'occupe').length;
  const vacant = lots.filter((lot) => lot.status === 'vacant').length;
  const buildingLots = detail ? lots.filter((lot) => lot.building_id === detail.id) : [];

  const openBuildingForm = () => {
    const quota = check('buildings');
    if (quota.reached) {
      setQuotaBlock(quota);
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  const saveBuilding = async (values) => {
    if (editing) {
      await base44.entities.Building.update(editing.id, values);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Immeuble', entityLabel: values.name });
    } else {
      const used = Number(await base44.entities.Building.count({ syndic_id: syndicId })) || 0;
      if (used >= limits.buildings) {
        setFormOpen(false);
        setQuotaBlock({ ...check('buildings'), used });
        return;
      }
      await base44.entities.Building.create({ ...values, syndic_id: syndicId });
      await logAction({ syndicId, action: 'Création', entity: 'Immeuble', entityLabel: values.name });
    }
    await Promise.all([reload(), reloadQuota()]);
  };

  const removeBuilding = async (building) => {
    await base44.entities.Lot.deleteMany({ building_id: building.id });
    await base44.entities.Building.delete(building.id);
    await logAction({ syndicId, action: 'Suppression', entity: 'Immeuble', entityLabel: building.name });
    if (detail?.id === building.id) setDetail(null);
    await Promise.all([reload(), reloadLots()]);
  };

  const openLotForm = (lot = null) => {
    if (!lot) {
      const quota = check('lots');
      if (quota.reached) {
        setQuotaBlock(quota);
        return;
      }
    }
    setEditingLot(lot);
    setLotFormOpen(true);
  };

  const saveLot = async (values) => {
    if (editingLot) {
      await base44.entities.Lot.update(editingLot.id, values);
    } else {
      const used = Number(await base44.entities.Lot.count({ syndic_id: syndicId })) || 0;
      if (used >= limits.lots) {
        setLotFormOpen(false);
        setQuotaBlock({ ...check('lots'), used });
        return;
      }
      await base44.entities.Lot.create({ ...values, syndic_id: syndicId, building_id: detail.id });
    }
    await Promise.all([reloadLots(), reloadQuota()]);
  };

  const removeLot = async (lot) => {
    await base44.entities.Lot.delete(lot.id);
    await reloadLots();
  };

  return (
    <Page
      kicker="Patrimoine"
      title="Immeubles"
      description="Gérez vos copropriétés, leurs lots et les propriétaires rattachés. Chaque immeuble regroupe ses demandes, contrats et finances."
      actions={
        <Button className="gap-2" onClick={openBuildingForm}>
          <Plus className="h-4 w-4" />
          Nouvel immeuble
        </Button>
      }
    >
      <StatStrip
        items={[
          { label: 'Immeubles', value: formatNumber(buildings.length), hint: 'dans cet espace syndic' },
          { label: 'Lots', value: formatNumber(lots.length), hint: 'appartements, parkings, caves' },
          { label: 'Lots occupés', value: formatNumber(occupied), hint: `${formatNumber(vacant)} vacant(s)` },
          {
            label: 'Gestionnaire',
            value: buildings[0]?.manager_name || '—',
            hint: buildings.length ? 'référent du premier immeuble' : 'à définir',
          },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un immeuble, une ville, une référence…"
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(BUILDING_STATUS),
          },
        ]}
        columns={[
          {
            key: 'name',
            header: 'Immeuble',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {row.reference || 'Sans référence'} · {lots.filter((lot) => lot.building_id === row.id).length} lot(s)
                </p>
              </div>
            ),
          },
          {
            key: 'address',
            header: 'Adresse',
            render: (row) => (
              <span className="text-foreground/75">
                {[row.address, row.postal_code, row.city].filter(Boolean).join(', ') || '—'}
              </span>
            ),
          },
          { key: 'manager_name', header: 'Gestionnaire', render: (row) => row.manager_name || '—' },
          { key: 'kind', header: 'Type', render: (row) => BUILDING_KIND[row.kind] || '—' },
          {
            key: 'status',
            header: 'Statut',
            render: (row) => <StatusBadge value={row.status} map={BUILDING_STATUS} />,
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
                onDelete={() => removeBuilding(row)}
                label={row.name}
              />
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={setDetail}
        empty={{
          icon: Building2,
          title: 'Aucun immeuble enregistré',
          description: 'Créez votre premier immeuble pour y rattacher des lots, des résidents et des interventions.',
          action: (
            <Button className="gap-2" onClick={openBuildingForm}>
              <Plus className="h-4 w-4" />
              Créer un immeuble
            </Button>
          ),
        }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Modifier l'immeuble" : 'Nouvel immeuble'}
        description="Les informations de l'immeuble servent de base aux lots, aux contrats et à la facturation."
        fields={BUILDING_FIELDS}
        initialValues={editing || EMPTY_BUILDING}
        onSubmit={saveBuilding}
        submitLabel={editing ? 'Mettre à jour' : "Créer l'immeuble"}
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{detail?.name}</DialogTitle>
            <DialogDescription>
              {[detail?.address, detail?.postal_code, detail?.city].filter(Boolean).join(', ') ||
                'Adresse non renseignée'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
            <div>
              <p className="kicker !text-[9px]">Référence</p>
              <p className="mt-1">{detail?.reference || '—'}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Gestionnaire</p>
              <p className="mt-1">{detail?.manager_name || '—'}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Étages</p>
              <p className="mt-1">{detail?.floors ? formatNumber(detail.floors) : '—'}</p>
            </div>
            <div>
              <p className="kicker !text-[9px]">Année</p>
              <p className="mt-1">{detail?.year_built ? formatNumber(detail.year_built) : '—'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/70 pt-4">
            <p className="kicker">Lots ({buildingLots.length})</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => openLotForm()}
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un lot
            </Button>
          </div>

          {buildingLots.length === 0 ? (
            <EmptyState
              compact
              icon={Layers}
              title="Aucun lot défini"
              description="Ajoutez les appartements, parkings et caves de cet immeuble pour rattacher les propriétaires et les occupants."
            />
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
              {buildingLots.map((lot) => (
                <li key={lot.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/70">
                    <Home className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      Lot {lot.number} · {LOT_KIND[lot.kind] || 'Lot'}
                    </p>
                    <p className="truncate text-[11.5px] text-muted-foreground">
                      {[lot.floor, lot.area ? `${lot.area} m²` : null, lot.owner_name].filter(Boolean).join(' · ') ||
                        'Informations à compléter'}
                    </p>
                  </div>
                  <StatusBadge value={lot.status} map={LOT_STATUS} />
                  <div className="flex items-center gap-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openLotForm(lot)}
                      aria-label="Modifier le lot"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLot(lot)}
                      aria-label="Supprimer le lot"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {detail?.notes && (
            <p className="rounded-xl bg-secondary/50 p-3 text-[12.5px] text-foreground/75">{detail.notes}</p>
          )}
        </DialogContent>
      </Dialog>

      <FormDialog
        open={lotFormOpen}
        onOpenChange={setLotFormOpen}
        title={editingLot ? 'Modifier le lot' : 'Nouveau lot'}
        description={`Immeuble : ${detail?.name || ''}`}
        fields={LOT_FIELDS}
        initialValues={editingLot || EMPTY_LOT}
        onSubmit={saveLot}
        submitLabel={editingLot ? 'Mettre à jour' : 'Ajouter le lot'}
      />

      <QuotaLimitDialog quota={quotaBlock} planName={planName} onClose={() => setQuotaBlock(null)} />
    </Page>
  );
}