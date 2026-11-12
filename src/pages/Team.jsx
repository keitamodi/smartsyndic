import { useMemo, useState } from 'react';
import { Mail, Plus, Send, UserCog } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatNumber } from '@/lib/format';
import { options, TEAM_ROLE, TEAM_STATUS } from '@/lib/constants';

const EMPTY = {
  full_name: '',
  email: '',
  role: 'gestionnaire',
  status: 'invite',
  building_ids: [],
  notes: '',
};

export default function Team() {
  const { syndicId } = useWorkspace();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const query = useMemo(() => {
    const next = { syndic_id: syndicId };
    if (roleFilter) next.role = roleFilter;
    return next;
  }, [syndicId, roleFilter]);

  const { items, loading, error, reload } = useCollection('TeamMember', query, { enabled: !!syndicId });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const rows = items.filter((row) => {
    const haystack = `${row.full_name} ${row.email} ${row.role}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const fields = [
    { name: 'full_name', label: 'Nom complet', required: true, placeholder: 'Camille Dubois' },
    { name: 'email', label: 'Email professionnel', type: 'email', required: true, placeholder: 'camille@cabinet.fr' },
    { name: 'role', label: 'Rôle', type: 'select', options: options(TEAM_ROLE), span: 2 },
    { name: 'status', label: 'Statut', type: 'select', options: options(TEAM_STATUS) },
    {
      name: 'building_ids',
      label: '',
      type: 'multiselect',
      options: buildings.map((building) => ({ value: building.id, label: building.name })),
    },
    { name: 'notes', label: 'Notes', type: 'textarea', span: 2, rows: 3 },
  ];

  const save = async (values) => {
    const payload = { ...values, building_ids: Array.isArray(values.building_ids) ? values.building_ids : [] };
    if (editing) {
      await base44.entities.TeamMember.update(editing.id, payload);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Équipe', entityLabel: payload.full_name });
    } else {
      await base44.entities.TeamMember.create({ ...payload, syndic_id: syndicId });
      await logAction({ syndicId, action: 'Création', entity: 'Équipe', entityLabel: payload.full_name });
    }
    await reload();
  };

  const remove = async (row) => {
    await base44.entities.TeamMember.delete(row.id);
    await reload();
  };

  const invite = async (member) => {
    try {
      await base44.users.inviteUser(member.email, 'user');
      await base44.entities.TeamMember.update(member.id, { status: 'invite' });
      await logAction({ syndicId, action: 'Invitation', entity: 'Équipe', entityLabel: member.full_name });
      toast({ title: 'Invitation envoyée', description: `Un email d’invitation a été adressé à ${member.email}.` });
      await reload();
    } catch (inviteError) {
      toast({
        title: 'Invitation impossible',
        description: inviteError?.message || "Seul un administrateur peut inviter des utilisateurs.",
        variant: 'destructive',
      });
    }
  };

  return (
    <Page
      kicker="Organisation"
      title="Équipe"
      description="Invitez vos collaborateurs, attribuez leurs rôles et définissez leur périmètre d’immeubles."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Ajouter un membre
        </Button>
      }
    >
      <StatStrip
        items={[
          { label: 'Membres', value: formatNumber(items.length), hint: 'équipe du syndic' },
          {
            label: 'Gestionnaires',
            value: formatNumber(items.filter((row) => row.role === 'gestionnaire').length),
            hint: 'référents de copropriété',
          },
          {
            label: 'Invitations en attente',
            value: formatNumber(items.filter((row) => row.status === 'invite').length),
            hint: 'accès non encore activé',
          },
          { label: 'Immeubles', value: formatNumber(buildings.length), hint: 'périmètre disponible' },
        ]}
      />

      <p className="rounded-2xl border border-border/70 bg-secondary/40 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
        Les invitations sont envoyées par email et créent un accès à la plateforme. Le rôle choisi ici définit les
        responsabilités dans le syndic ; le périmètre d’immeubles restreint les copropriétés visibles.
      </p>

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un membre, un email, un rôle…"
        filters={[
          {
            key: 'role',
            value: roleFilter,
            onChange: setRoleFilter,
            placeholder: 'Rôle',
            allLabel: 'Tous les rôles',
            options: options(TEAM_ROLE),
          },
        ]}
        columns={[
          {
            key: 'full_name',
            header: 'Membre',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.full_name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{row.email}</p>
              </div>
            ),
          },
          { key: 'role', header: 'Rôle', render: (row) => <StatusBadge value={row.role} map={TEAM_ROLE} tone="neutral" /> },
          {
            key: 'perimeter',
            header: 'Périmètre',
            render: (row) => {
              const scope = (row.building_ids || [])
                .map((id) => buildings.find((building) => building.id === id)?.name)
                .filter(Boolean);
              return (
                <span className="text-foreground/75">
                  {scope.length === 0 ? 'Tous les immeubles' : scope.length > 2 ? `${scope.length} immeubles` : scope.join(', ')}
                </span>
              );
            },
          },
          { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={TEAM_STATUS} /> },
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (row) => (
              <RowActions
                onEdit={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
                onDelete={() => remove(row)}
                label={row.full_name}
              >
                <DropdownMenuItem onSelect={() => invite(row)}>
                  <Send className="mr-2 h-3.5 w-3.5" />
                  Envoyer l’invitation
                </DropdownMenuItem>
              </RowActions>
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        empty={{
          icon: UserCog,
          title: 'Aucun membre dans l’équipe',
          description: 'Ajoutez vos gestionnaires, assistants et comptables pour leur confier un périmètre de copropriétés.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un membre
            </Button>
          ),
        }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? 'Modifier le membre' : 'Nouveau membre'}
        description="Le membre pourra accéder aux immeubles cochés dans son périmètre."
        fields={fields}
        initialValues={editing || EMPTY}
        onSubmit={save}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
      />
    </Page>
  );
}