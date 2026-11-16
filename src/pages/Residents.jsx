import { useMemo, useState } from 'react';
import { Mail, Phone, Plus, Users } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import InviteAccessCard from '@/components/access/InviteAccessCard';
import { inviteKindFromResident } from '@/lib/inviteKinds';
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
import { formatNumber } from '@/lib/format';
import { options, RESIDENT_KIND, RESIDENT_STATUS } from '@/lib/constants';

const EMPTY = {
  full_name: '',
  email: '',
  phone: '',
  building_id: '',
  kind: 'coproprietaire',
  lot_numbers: '',
  status: 'actif',
  notes: '',
};

export default function Residents() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const query = useMemo(() => {
    const next = { syndic_id: syndicId };
    if (kindFilter) next.kind = kindFilter;
    if (buildingFilter) next.building_id = buildingFilter;
    return next;
  }, [syndicId, kindFilter, buildingFilter]);

  const { items, loading, error, reload } = useCollection('Resident', query, { enabled: !!syndicId, limit: 400 });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: lots } = useCollection('Lot', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const buildingName = (id) => buildings.find((building) => building.id === id)?.name || '—';

  const rows = items.filter((row) => {
    const haystack = `${row.full_name} ${row.email} ${row.lot_numbers} ${buildingName(row.building_id)}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const fields = [
    { name: 'full_name', label: 'Nom complet', required: true, span: 2, placeholder: 'Marie Lambert' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'marie.lambert@email.fr' },
    { name: 'phone', label: 'Téléphone', placeholder: '06 12 34 56 78' },
    {
      name: 'building_id',
      label: 'Immeuble',
      type: 'select',
      options: buildings.map((building) => ({ value: building.id, label: building.name })),
    },
    { name: 'lot_numbers', label: 'Lots rattachés', placeholder: 'A12, P3' },
    { name: 'kind', label: 'Profil', type: 'select', options: options(RESIDENT_KIND) },
    { name: 'status', label: 'Statut', type: 'select', options: options(RESIDENT_STATUS) },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 3 },
  ];

  const save = async (values) => {
    if (editing) {
      await base44.entities.Resident.update(editing.id, values);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Résident', entityLabel: values.full_name });
    } else {
      await base44.entities.Resident.create({ ...values, syndic_id: syndicId });
      await logAction({ syndicId, action: 'Création', entity: 'Résident', entityLabel: values.full_name });
    }
    await reload();
  };

  const remove = async (row) => {
    await base44.entities.Resident.delete(row.id);
    await reload();
  };

  return (
    <Page
      kicker="Relation"
      title="Copropriétaires & propriétaires"
      description="Centralisez les coordonnées des copropriétaires, propriétaires bailleurs et occupants, et leurs lots."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Ajouter une personne
        </Button>
      }
    >
      <StatStrip
        items={[
          { label: 'Personnes', value: formatNumber(items.length), hint: 'dans cet espace syndic' },
          {
            label: 'Copropriétaires',
            value: formatNumber(items.filter((row) => row.kind === 'coproprietaire').length),
            hint: 'propriétaires occupants',
          },
          {
            label: 'Propriétaires bailleurs',
            value: formatNumber(items.filter((row) => row.kind === 'proprietaire_bailleur').length),
            hint: 'lots loués',
          },
          {
            label: 'Occupants',
            value: formatNumber(items.filter((row) => row.kind === 'occupant').length),
            hint: `${formatNumber(lots.length)} lots au total`,
          },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une personne, un email, un lot…"
        filters={[
          {
            key: 'building',
            value: buildingFilter,
            onChange: setBuildingFilter,
            placeholder: 'Immeuble',
            allLabel: 'Tous les immeubles',
            options: buildings.map((building) => ({ value: building.id, label: building.name })),
          },
          {
            key: 'kind',
            value: kindFilter,
            onChange: setKindFilter,
            placeholder: 'Profil',
            allLabel: 'Tous les profils',
            options: options(RESIDENT_KIND),
          },
        ]}
        columns={[
          {
            key: 'full_name',
            header: 'Personne',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.full_name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {row.email || row.phone || 'Coordonnées à compléter'}
                </p>
              </div>
            ),
          },
          { key: 'building', header: 'Immeuble', render: (row) => buildingName(row.building_id) },
          { key: 'lot_numbers', header: 'Lots', render: (row) => row.lot_numbers || '—' },
          { key: 'kind', header: 'Profil', render: (row) => <StatusBadge value={row.kind} map={RESIDENT_KIND} tone="neutral" /> },
          { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={RESIDENT_STATUS} /> },
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
                label={row.full_name}
              />
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={setDetail}
        empty={{
          icon: Users,
          title: 'Aucune personne enregistrée',
          description: 'Rattachez les copropriétaires, propriétaires bailleurs et occupants à vos immeubles.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter une personne
            </Button>
          ),
        }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Modifier la personne' : 'Nouvelle personne'}
        description="Les coordonnées permettent d’envoyer les convocations et de suivre les demandes."
        fields={fields}
        initialValues={editing || EMPTY}
        onSubmit={save}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{detail?.full_name}</DialogTitle>
            <DialogDescription>
              {RESIDENT_KIND[detail?.kind] || ''} · {buildingName(detail?.building_id)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-[13px]">
            {detail?.email && (
              <p className="flex items-center gap-2 text-foreground/75">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`mailto:${detail.email}`} className="hover:text-primary">{detail.email}</a>
              </p>
            )}
            {detail?.phone && (
              <p className="flex items-center gap-2 text-foreground/75">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`tel:${detail.phone}`} className="hover:text-primary">{detail.phone}</a>
              </p>
            )}
            <p className="text-foreground/75">Lots : {detail?.lot_numbers || 'non renseignés'}</p>
          </div>

          {detail?.notes && (
            <p className="rounded-xl bg-secondary/50 p-3 text-[12.5px] text-foreground/75">{detail.notes}</p>
          )}

          {detail && (
            <InviteAccessCard
              syndicId={detail.syndic_id || syndicId}
              email={detail.email}
              phone={detail.phone}
              kind={inviteKindFromResident(detail.kind)}
              memberId={detail.id}
              memberType="resident"
              fullName={detail.full_name}
              buildingId={detail.building_id}
              buildingName={buildingName(detail.building_id)}
              lotNumbers={detail.lot_numbers}
            />
          )}
        </DialogContent>
      </Dialog>
    </Page>
  );
}