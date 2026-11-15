import { useMemo, useState } from 'react';
import { Building2, Mail, Phone, Plus, Star } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import PartnerDialog from '@/components/partners/PartnerDialog';
import PartnerDetail from '@/components/partners/PartnerDetail';
import CompanyDirectory from '@/components/partners/CompanyDirectory';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatNumber } from '@/lib/format';
import { options, PARTNER_STATUS, SIRET_STATUS, WORK_TYPE } from '@/lib/constants';

export default function Partenaires() {
  const { syndicId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workFilter, setWorkFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [detailId, setDetailId] = useState(null);

  const { items, loading, error, reload } = useCollection(
    'PartnerCompany',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 300 },
  );

  const detail = items.find((row) => row.id === detailId) || null;

  const rows = useMemo(() => {
    const term = search.toLowerCase();
    return items.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (workFilter && !(row.work_types || []).includes(workFilter)) return false;
      return `${row.name} ${row.city} ${row.postal_code} ${row.siret} ${row.email}`
        .toLowerCase()
        .includes(term);
    });
  }, [items, search, statusFilter, workFilter]);

  if (!syndicId) return <WorkspaceRequired />;

  const save = async (payload) => {
    if (payload.status === 'valide' && !payload.validated_at) {
      const me = await base44.auth.me().catch(() => null);
      payload.validated_by = me?.email || '';
      payload.validated_at = new Date().toISOString().slice(0, 10);
    }
    if (editing) {
      await base44.entities.PartnerCompany.update(editing.id, payload);
      await logAction({
        syndicId,
        action: 'Mise à jour',
        entity: 'Entreprise partenaire',
        entityLabel: payload.name,
      });
    } else {
      await base44.entities.PartnerCompany.create({ ...payload, syndic_id: syndicId });
      await logAction({
        syndicId,
        action: 'Création',
        entity: 'Entreprise partenaire',
        entityLabel: payload.name,
      });
    }
    await reload();
  };

  const validate = async (partner) => {
    const me = await base44.auth.me().catch(() => null);
    await base44.entities.PartnerCompany.update(partner.id, {
      status: 'valide',
      validated_by: me?.email || '',
      validated_at: new Date().toISOString().slice(0, 10),
    });
    await logAction({
      syndicId,
      action: 'Validation',
      entity: 'Entreprise partenaire',
      entityLabel: partner.name,
    });
    await reload();
  };

  const remove = async (row) => {
    await base44.entities.PartnerCompany.delete(row.id);
    await reload();
  };

  const openForm = (partner = null) => {
    setEditing(partner);
    setPrefill(null);
    setFormOpen(true);
  };

  const addFromDirectory = (company) => {
    setEditing(null);
    setPrefill(company);
    setFormOpen(true);
  };

  return (
    <Page
      kicker="Travaux"
      title="Entreprises partenaires"
      description="Répertoire des entreprises contactées pour vos devis, validées manuellement après vérification du SIRET auprès de l’API de l’État."
      actions={
        <Button className="gap-2" onClick={() => openForm()}>
          <Plus className="h-4 w-4" />
          Ajouter une entreprise
        </Button>
      }
    >
      <StatStrip
        items={[
          { label: 'Entreprises', value: formatNumber(items.length), hint: 'au répertoire' },
          {
            label: 'Validées',
            value: formatNumber(items.filter((row) => row.status === 'valide').length),
            hint: 'sollicitables pour un devis',
          },
          {
            label: 'À vérifier',
            value: formatNumber(items.filter((row) => row.status === 'a_verifier').length),
            hint: 'validation en attente',
          },
          {
            label: 'Avis Google',
            value: formatNumber(
              items.reduce((total, row) => total + (row.google_reviews_count || 0), 0),
            ),
            hint: 'avis cumulés',
          },
        ]}
      />

      <CompanyDirectory
        knownSirets={items
          .map((row) => (row.siret || '').replace(/\D/g, ''))
          .filter(Boolean)}
        onAdd={addFromDirectory}
      />

      <TablePanel
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher une entreprise, une ville, un SIRET…"
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Statut',
            allLabel: 'Tous les statuts',
            options: options(PARTNER_STATUS),
          },
          {
            key: 'work_type',
            value: workFilter,
            onChange: setWorkFilter,
            placeholder: 'Métier',
            allLabel: 'Tous les métiers',
            options: options(WORK_TYPE),
          },
        ]}
        columns={[
          {
            key: 'name',
            header: 'Entreprise',
            render: (row) => (
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {(row.work_types || []).map((type) => WORK_TYPE[type]).filter(Boolean).join(' · ') ||
                    'Corps de métier non précisé'}
                </p>
              </div>
            ),
          },
          {
            key: 'city',
            header: 'Zone',
            render: (row) => (
              <span className="text-[12.5px] text-foreground/75">
                {[row.postal_code, row.city].filter(Boolean).join(' ') || '—'}
              </span>
            ),
          },
          {
            key: 'siret',
            header: 'SIRET',
            render: (row) => (
              <div className="min-w-0 space-y-1">
                <p className="truncate font-mono text-[11.5px] text-foreground/75">{row.siret || '—'}</p>
                <StatusBadge value={row.siret_status || 'non_verifie'} map={SIRET_STATUS} />
              </div>
            ),
          },
          {
            key: 'google',
            header: 'Google',
            render: (row) =>
              row.google_rating ? (
                <span className="inline-flex items-center gap-1 font-mono text-[12px]">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {row.google_rating.toFixed(1)}
                  <span className="text-[11px] text-muted-foreground">({row.google_reviews_count || 0})</span>
                </span>
              ) : (
                <span className="text-[11.5px] text-muted-foreground">Indisponible</span>
              ),
          },
          {
            key: 'contact',
            header: 'Contact',
            render: (row) => (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/75">
                {row.email ? <Mail className="h-3 w-3 text-muted-foreground" /> : <Phone className="h-3 w-3 text-muted-foreground" />}
                <span className="truncate">{row.email || row.phone || '—'}</span>
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Statut',
            render: (row) => <StatusBadge value={row.status} map={PARTNER_STATUS} />,
          },
          {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (row) => (
              <RowActions
                onView={() => setDetailId(row.id)}
                onEdit={() => openForm(row)}
                onDelete={() => remove(row)}
                label={row.name}
              />
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={(row) => setDetailId(row.id)}
        empty={{
          icon: Building2,
          title: 'Aucune entreprise partenaire',
          description:
            'Ajoutez une entreprise, vérifiez son SIRET auprès de l’API de l’État, puis validez-la pour la solliciter.',
          action: (
            <Button className="gap-2" onClick={() => openForm()}>
              <Plus className="h-4 w-4" />
              Ajouter une entreprise
            </Button>
          ),
        }}
      />

      <PartnerDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setPrefill(null);
        }}
        initial={editing}
        prefill={prefill}
        onSubmit={save}
      />

      <PartnerDetail
        open={!!detail}
        onOpenChange={(open) => !open && setDetailId(null)}
        partner={detail}
        onEdit={(partner) => {
          setDetailId(null);
          openForm(partner);
        }}
        onValidate={validate}
      />
    </Page>
  );
}