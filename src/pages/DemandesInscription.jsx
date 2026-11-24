import { useState } from 'react';
import { Inbox, ShieldX } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import StatusBadge from '@/components/StatusBadge';
import SignupRequestDialog from '@/components/signup/SignupRequestDialog';
import useCollection from '@/hooks/useCollection';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { formatNumber } from '@/lib/format';
import {
  options,
  SIGNUP_REQUEST_STATUS,
  SIGNUP_REQUEST_TONE,
  SYNDIC_KIND,
} from '@/lib/constants';

const shortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
};

export default function DemandesInscription() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { items, loading, error, reload } = useCollection(
    'SignupRequest',
    {},
    { limit: 300, enabled: isAdmin },
  );

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-[560px] rounded-[26px] border border-border bg-card px-6 py-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
          <ShieldX className="h-5 w-5 text-destructive" strokeWidth={1.8} />
        </span>
        <h1 className="mt-4 font-heading text-[20px] font-semibold">Accès réservé à l’administration</h1>
        <p className="mx-auto mt-2 max-w-[380px] text-[12.5px] leading-relaxed text-muted-foreground">
          Les demandes d’inscription contiennent les coordonnées de prospects : seuls les administrateurs
          de la plateforme peuvent les consulter.
        </p>
      </div>
    );
  }

  const countBy = (status) => items.filter((row) => (row.status || 'nouveau') === status).length;
  const unnotified = items.filter((row) => !row.alert_sent_at).length;

  const rows = items.filter((row) => {
    if (statusFilter && (row.status || 'nouveau') !== statusFilter) return false;
    const haystack = `${row.syndic_name} ${row.contact_name} ${row.email} ${row.phone} ${row.city}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  const changeStatus = async (nextStatus) => {
    if (!detail) return;
    setSaving(true);
    setSaveError('');
    try {
      await base44.entities.SignupRequest.update(detail.id, {
        status: nextStatus,
        handled_at: new Date().toISOString().slice(0, 10),
        handled_by: user?.email || '',
      });
      setDetail((current) => (current ? { ...current, status: nextStatus } : current));
      await reload();
    } catch (failure) {
      setSaveError(failure?.message || 'La mise à jour a échoué. Réessayez dans un instant.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      kicker="Administration"
      title="Demandes d’inscription"
      description="Les fiches déposées depuis la page d’accueil. Contactez le référent puis faites avancer la demande jusqu’à la qualification ou au refus."
      wide
    >
      <StatStrip
        items={[
          {
            label: 'Nouvelles',
            value: formatNumber(countBy('nouveau')),
            hint: 'à traiter en priorité',
            onClick: () => setStatusFilter((current) => (current === 'nouveau' ? '' : 'nouveau')),
            active: statusFilter === 'nouveau',
          },
          {
            label: 'Contactées',
            value: formatNumber(countBy('contacte')),
            hint: 'premier échange fait',
            onClick: () => setStatusFilter((current) => (current === 'contacte' ? '' : 'contacte')),
            active: statusFilter === 'contacte',
          },
          {
            label: 'Qualifiées',
            value: formatNumber(countBy('qualifie')),
            hint: 'prêtes à ouvrir un espace',
            onClick: () => setStatusFilter((current) => (current === 'qualifie' ? '' : 'qualifie')),
            active: statusFilter === 'qualifie',
          },
          {
            label: 'Refusées',
            value: formatNumber(countBy('refuse')),
            hint: 'sans suite',
            onClick: () => setStatusFilter((current) => (current === 'refuse' ? '' : 'refuse')),
            active: statusFilter === 'refuse',
          },
        ]}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher un cabinet, un référent, une ville…"
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(SIGNUP_REQUEST_STATUS),
          },
        ]}
        columns={[
          {
            key: 'syndic_name',
            header: 'Cabinet',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.syndic_name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {SYNDIC_KIND[row.syndic_kind] || 'Syndic'}
                </p>
              </div>
            ),
          },
          {
            key: 'contact_name',
            header: 'Référent',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate text-foreground/85">{row.contact_name || '—'}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{row.email || ''}</p>
              </div>
            ),
          },
          {
            key: 'phone',
            header: 'Coordonnées',
            render: (row) => (
              <div className="min-w-0 text-[12.5px] text-foreground/75">
                <p className="truncate">{row.phone || '—'}</p>
                <p className="truncate text-[11px] text-muted-foreground">{row.city || ''}</p>
              </div>
            ),
          },
          {
            key: 'buildings_count',
            header: 'Immeubles',
            render: (row) => (
              <span className="font-mono text-[12px] text-foreground/80">
                {row.buildings_count ?? '—'}
              </span>
            ),
          },
          {
            key: 'created_date',
            header: 'Reçue le',
            render: (row) => (
              <span className="whitespace-nowrap text-[12px] text-muted-foreground">
                {shortDate(row.created_date)}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Statut',
            render: (row) => (
              <StatusBadge
                value={row.status || 'nouveau'}
                label={SIGNUP_REQUEST_STATUS[row.status || 'nouveau']}
                tone={SIGNUP_REQUEST_TONE[row.status || 'nouveau']}
              />
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={(row) => {
          setSaveError('');
          setDetail(row);
        }}
        empty={{
          icon: Inbox,
          title: 'Aucune demande d’inscription',
          description: 'Les fiches envoyées depuis le formulaire de la page d’accueil apparaîtront ici.',
        }}
      />

      {!loading && unnotified > 0 && (
        <p className="rounded-[14px] border border-border/70 bg-secondary/40 p-4 text-[11.5px] leading-relaxed text-muted-foreground">
          {unnotified} demande{unnotified > 1 ? 's' : ''} sans alerte e-mail confirmée. L’envoi vers une adresse
          qui n’est pas un utilisateur inscrit demande un forfait payant et un domaine d’envoi vérifié ;
          les demandes restent consultables et traitables ici.
        </p>
      )}

      <SignupRequestDialog
        request={detail}
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onStatusChange={changeStatus}
        saving={saving}
        error={saveError}
      />
    </Page>
  );
}