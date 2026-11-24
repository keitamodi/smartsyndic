import { useMemo, useState } from 'react';
import { HardHat, Mail, Phone, Plus, Star, UserPlus } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import ProviderAccessCard from '@/components/providers/ProviderAccessCard';
import InviteMemberDialog from '@/components/access/InviteMemberDialog';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
import {
  options,
  PROVIDER_KIND,
  PROVIDER_SPECIALTY,
  PROVIDER_STATUS,
} from '@/lib/constants';

const EMPTY = {
  name: '',
  kind: 'prestataire_externe',
  specialty: 'multiservices',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
  siret: '',
  status: 'actif',
  rating: '',
  notes: '',
};

const FIELDS = [
  { name: 'name', label: 'Nom du technicien ou prestataire', required: true, span: 2, placeholder: 'Plomberie Martin' },
  { name: 'kind', label: 'Catégorie', type: 'select', options: options(PROVIDER_KIND) },
  { name: 'specialty', label: 'Spécialité', type: 'select', options: options(PROVIDER_SPECIALTY) },
  { name: 'contact_name', label: 'Contact', placeholder: 'Thomas Martin' },
  { name: 'phone', label: 'Téléphone', placeholder: '06 12 34 56 78' },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'contact@plomberie-martin.fr' },
  { name: 'siret', label: 'SIRET', placeholder: '987 654 321 00010' },
  { name: 'address', label: 'Adresse', span: 2 },
  { name: 'status', label: 'Statut', type: 'select', options: options(PROVIDER_STATUS) },
  { name: 'rating', label: 'Note interne (1 à 5)', type: 'number', min: 1, max: 5 },
  { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 3 },
];

export default function Providers() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitePersonId, setInvitePersonId] = useState('');

  // Filtres appliqués sur la liste : les compteurs des cartes restent stables.
  const query = useMemo(() => ({ syndic_id: syndicId }), [syndicId]);

  const { items, loading, error, reload } = useCollection('Provider', query, { enabled: !!syndicId, limit: 300 });
  const { items: interventions } = useCollection('Intervention', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const rows = items.filter((row) => {
    if (kindFilter && (row.kind || '') !== kindFilter) return false;
    const haystack = `${row.name} ${row.contact_name} ${row.email} ${row.phone}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const save = async (values) => {
    if (editing) {
      await base44.entities.Provider.update(editing.id, values);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Prestataire', entityLabel: values.name });
    } else {
      await base44.entities.Provider.create({ ...values, syndic_id: syndicId });
      await logAction({ syndicId, action: 'Création', entity: 'Prestataire', entityLabel: values.name });
    }
    await reload();
  };

  const remove = async (row) => {
    await base44.entities.Provider.delete(row.id);
    await reload();
  };

  const openInvite = (row) => {
    setInvitePersonId(row?.id || '');
    setInviteOpen(true);
  };

  const invitePeople = items.map((row) => ({
    id: row.id,
    label: row.name,
    kind: 'technicien',
    email: row.email,
    phone: row.phone,
    memberType: 'provider',
  }));

  return (
    <Page
      kicker="Relation"
      title="Techniciens & prestataires"
      description="Gérez vos intervenants internes et externes, leurs coordonnées et leurs spécialités."
      actions={
        <>
          <Button variant="outline" className="gap-2" onClick={() => openInvite(null)}>
            <UserPlus className="h-4 w-4" />
            Inviter
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Ajouter un intervenant
          </Button>
        </>
      }
    >
      <StatStrip
        items={[
          {
            label: 'Intervenants',
            value: formatNumber(items.length),
            hint: 'techniciens et prestataires',
            onClick: () => setKindFilter(''),
            active: !kindFilter,
          },
          {
            label: 'Techniciens internes',
            value: formatNumber(items.filter((row) => row.kind === 'technicien_interne').length),
            hint: 'salariés du syndic',
            onClick: () => setKindFilter((current) => (current === 'technicien_interne' ? '' : 'technicien_interne')),
            active: kindFilter === 'technicien_interne',
          },
          {
            label: 'Prestataires externes',
            value: formatNumber(items.filter((row) => row.kind === 'prestataire_externe').length),
            hint: 'entreprises partenaires',
            onClick: () =>
              setKindFilter((current) => (current === 'prestataire_externe' ? '' : 'prestataire_externe')),
            active: kindFilter === 'prestataire_externe',
          },
          {
            label: 'Interventions suivies',
            value: formatNumber(interventions.length),
            hint: 'toutes interventions confondues',
          },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un intervenant, une spécialité, un contact…"
        filters={[
          {
            key: 'kind',
            value: kindFilter,
            onChange: setKindFilter,
            placeholder: 'Catégorie',
            allLabel: 'Toutes catégories',
            options: options(PROVIDER_KIND),
          },
        ]}
        columns={[
          {
            key: 'name',
            header: 'Intervenant',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {PROVIDER_SPECIALTY[row.specialty] || 'Multiservices'} · {PROVIDER_KIND[row.kind] || '—'}
                </p>
              </div>
            ),
          },
          {
            key: 'contact',
            header: 'Contact',
            render: (row) => (
              <div className="min-w-0 text-[12.5px] text-foreground/75">
                <p className="truncate">{row.contact_name || '—'}</p>
                <p className="truncate text-[11px] text-muted-foreground">{row.phone || row.email || ''}</p>
              </div>
            ),
          },
          {
            key: 'rating',
            header: 'Note',
            render: (row) =>
              row.rating ? (
                <span className="inline-flex items-center gap-1 font-mono text-[12px]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {row.rating}/5
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={PROVIDER_STATUS} /> },
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
                label={row.name}
              >
                <DropdownMenuItem onSelect={() => openInvite(row)}>
                  <UserPlus className="mr-2 h-3.5 w-3.5" />
                  Inviter
                </DropdownMenuItem>
              </RowActions>
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={setDetail}
        empty={{
          icon: HardHat,
          title: 'Aucun intervenant enregistré',
          description: 'Ajoutez vos techniciens et prestataires pour leur affecter des interventions et des contrats.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un intervenant
            </Button>
          ),
        }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Modifier l'intervenant" : 'Nouvel intervenant'}
        description="Ces coordonnées sont utilisées pour affecter les interventions et suivre les contrats."
        fields={FIELDS}
        initialValues={editing || EMPTY}
        onSubmit={save}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
      />

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{detail?.name}</DialogTitle>
            <DialogDescription>
              {PROVIDER_KIND[detail?.kind] || ''} · {PROVIDER_SPECIALTY[detail?.specialty] || ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-[13px]">
            {detail?.contact_name && <p className="font-medium">{detail.contact_name}</p>}
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
            {detail?.address && <p className="text-foreground/75">{detail.address}</p>}
            {detail?.siret && <p className="font-mono text-[11.5px] text-muted-foreground">SIRET {detail.siret}</p>}
          </div>

          <div className="rounded-xl bg-secondary/40 p-3">
            <p className="kicker !text-[9px]">Interventions associées</p>
            <p className="mt-1 text-[12.5px]">
              {interventions.filter((row) => row.provider_id === detail?.id).length} intervention(s) enregistrée(s)
            </p>
          </div>

          <ProviderAccessCard provider={detail} />

          {detail?.notes && <p className="text-[12.5px] text-foreground/75">{detail.notes}</p>}
        </DialogContent>
      </Dialog>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        syndicId={syndicId}
        people={invitePeople}
        defaultKind="technicien"
        memberType="provider"
        initialPersonId={invitePersonId}
        title="Inviter un technicien ou un prestataire"
        description="Choisissez la fiche à ouvrir, puis envoyez son lien personnel par email, SMS ou WhatsApp."
      />
    </Page>
  );
}