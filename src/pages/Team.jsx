import { useMemo, useState } from 'react';
import { Plus, Send, UserCog } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import QuickFilterBar from '@/components/QuickFilterBar';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import TeamGuide from '@/components/team/TeamGuide';
import InviteTeamMemberDialog from '@/components/team/InviteTeamMemberDialog';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import useCollection from '@/hooks/useCollection';
import useQuota from '@/hooks/useQuota';
import QuotaLimitDialog from '@/components/quota/QuotaLimitDialog';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatNumber, initials } from '@/lib/format';
import { roleDescription } from '@/lib/teamRoles';
import { options, TEAM_ROLE, TEAM_STATUS } from '@/lib/constants';

export default function Team() {
  const { syndicId } = useWorkspace();
  const { toast } = useToast();
  const { check, limits, planName, reload: reloadQuota } = useQuota();
  const [quotaBlock, setQuotaBlock] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [quick, setQuick] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Filtres appliqués sur la liste : les compteurs des cartes restent stables.
  const query = useMemo(() => ({ syndic_id: syndicId }), [syndicId]);

  const { items, loading, error, reload } = useCollection('TeamMember', query, { enabled: !!syndicId });
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });

  if (!syndicId) return <WorkspaceRequired />;

  const rows = items.filter((row) => {
    if (roleFilter && (row.role || '') !== roleFilter) return false;
    if (quick === 'invite' && row.status !== 'invite') return false;
    const haystack = `${row.full_name} ${row.email} ${row.role}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const openCreate = () => {
    const quota = check('seats');
    if (quota.reached) {
      setQuotaBlock(quota);
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  const submitMember = async (values, { sendInvite }) => {
    const payload = { ...values, building_ids: Array.isArray(values.building_ids) ? values.building_ids : [] };

    if (editing) {
      await base44.entities.TeamMember.update(editing.id, payload);
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Équipe', entityLabel: payload.full_name });
      toast({ title: 'Collaborateur mis à jour', description: `${payload.full_name} · ${payload.email}` });
      await reload();
      return;
    }

    const used = Number(await base44.entities.TeamMember.count({ syndic_id: syndicId })) || 0;
    if (used >= limits.seats) {
      setFormOpen(false);
      setQuotaBlock({ ...check('seats'), used });
      return;
    }

    const created = await base44.entities.TeamMember.create({
      ...payload,
      syndic_id: syndicId,
      status: sendInvite ? 'invite' : 'actif',
    });
    await logAction({ syndicId, action: 'Création', entity: 'Équipe', entityLabel: payload.full_name });

    if (sendInvite) {
      try {
        await base44.users.inviteUser(created.email, 'admin');
        toast({
          title: 'Invitation envoyée',
          description: `Un email d’invitation a été adressé à ${created.email}.`,
        });
      } catch (inviteError) {
        toast({
          title: 'Membre enregistré, invitation non envoyée',
          description: inviteError?.message || 'Utilisez « Renvoyer l’invitation » depuis la liste.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Membre enregistré',
        description: 'Aucune invitation envoyée : relancez-la depuis la liste quand vous le souhaitez.',
      });
    }

    await Promise.all([reload(), reloadQuota()]);
  };

  const resendInvite = async (member) => {
    try {
      await base44.users.inviteUser(member.email, 'admin');
      await base44.entities.TeamMember.update(member.id, { status: 'invite' });
      await logAction({ syndicId, action: 'Invitation', entity: 'Équipe', entityLabel: member.full_name });
      toast({ title: 'Invitation renvoyée', description: `Un email a été adressé à ${member.email}.` });
      await reload();
    } catch (inviteError) {
      toast({
        title: 'Invitation impossible',
        description: inviteError?.message || 'Seul un administrateur peut inviter des utilisateurs.',
        variant: 'destructive',
      });
    }
  };

  const remove = async (row) => {
    await base44.entities.TeamMember.delete(row.id);
    await Promise.all([reload(), reloadQuota()]);
  };

  return (
    <Page
      kicker="Organisation"
      title="Équipe"
      description="Invitez vos collaborateurs, attribuez leurs rôles et définissez leur périmètre d’immeubles."
      actions={
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Ajouter un membre
        </Button>
      }
    >
      <StatStrip
        items={[
          {
            label: 'Membres',
            value: formatNumber(items.length),
            hint: `${items.length} / ${limits.seats} sièges`,
            onClick: () => {
              setRoleFilter('');
              setQuick('');
            },
            active: !roleFilter && !quick,
          },
          {
            label: 'Gestionnaires',
            value: formatNumber(items.filter((row) => row.role === 'gestionnaire').length),
            hint: 'référents de copropriété',
            onClick: () => setRoleFilter((current) => (current === 'gestionnaire' ? '' : 'gestionnaire')),
            active: roleFilter === 'gestionnaire',
          },
          {
            label: 'Invitations en attente',
            value: formatNumber(items.filter((row) => row.status === 'invite').length),
            hint: 'accès non encore activé',
            onClick: () => setQuick((current) => (current === 'invite' ? '' : 'invite')),
            active: quick === 'invite',
          },
          { label: 'Immeubles', value: formatNumber(buildings.length), hint: 'périmètre disponible' },
        ]}
      />
      <QuickFilterBar
        label={quick === 'invite' ? 'Invitations en attente' : ''}
        count={quick === 'invite' ? rows.length : null}
        onClear={() => setQuick('')}
      />

      <TeamGuide />

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
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary font-mono text-[10px] font-semibold text-foreground/70">
                  {initials(row.full_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.full_name}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{row.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Rôle',
            render: (row) => (
              <div className="min-w-0 space-y-1">
                <StatusBadge value={row.role} map={TEAM_ROLE} tone="neutral" />
                <p className="max-w-[220px] truncate text-[11px] text-muted-foreground">{roleDescription(row.role)}</p>
              </div>
            ),
          },
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
                {row.status !== 'actif' && (
                  <DropdownMenuItem onSelect={() => resendInvite(row)}>
                    <Send className="mr-2 h-3.5 w-3.5" />
                    {row.status === 'invite' ? 'Renvoyer l’invitation' : 'Inviter ce collaborateur'}
                  </DropdownMenuItem>
                )}
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
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Ajouter un membre
            </Button>
          ),
        }}
      />

      <InviteTeamMemberDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editing}
        buildings={buildings}
        onSubmit={submitMember}
      />

      <QuotaLimitDialog quota={quotaBlock} planName={planName} onClose={() => setQuotaBlock(null)} />
    </Page>
  );
}