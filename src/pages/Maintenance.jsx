import { useEffect, useRef, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import QuickFilterBar from '@/components/QuickFilterBar';
import TablePanel from '@/components/TablePanel';
import RowActions from '@/components/RowActions';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import InterventionCalendar from '@/components/interventions/InterventionCalendar';
import InterventionAlerts from '@/components/interventions/InterventionAlerts';
import { daysUntil } from '@/components/interventions/calendar-utils';
import { Button } from '@/components/ui/button';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { base44 } from '@/api/base44Client';
import { logAction } from '@/lib/audit';
import { formatDate, formatNumber } from '@/lib/format';
import {
  INTERVENTION_KIND,
  INTERVENTION_ORIGIN,
  INTERVENTION_PRIORITY,
  INTERVENTION_STATUS,
  PRIORITY_TONE,
  options,
} from '@/lib/constants';

const EMPTY = {
  title: '',
  building_id: '',
  provider_id: '',
  origin: 'entretien',
  priority: 'normale',
  kind: 'preventive',
  status: 'planifiee',
  scheduled_date: '',
  scheduled_time: '09:00',
  duration_minutes: 60,
  reminder_days: 7,
  contact_email: '',
  cost: '',
  description: '',
  report: '',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Maintenance() {
  const { syndicId } = useWorkspace();
  const [month, setMonth] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');
  const [quick, setQuick] = useState('');
  const tableRef = useRef(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reminding, setReminding] = useState(false);
  const [alertInfo, setAlertInfo] = useState('');

  const { items, loading, error, reload } = useCollection(
    'Intervention',
    { syndic_id: syndicId },
    { enabled: !!syndicId, limit: 500 },
  );
  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: providers } = useCollection('Provider', { syndic_id: syndicId }, { enabled: !!syndicId });

  const runReminders = async () => {
    if (!syndicId) return;
    setReminding(true);
    try {
      const response = await base44.functions.invoke('interventionReminders', { syndic_id: syndicId });
      const created = Number(response?.data?.created) || 0;
      setAlertInfo(created ? `${created} alerte(s) envoyée(s)` : 'Aucune nouvelle alerte à envoyer');
      if (created) await reload();
    } catch {
      setAlertInfo('Alertes indisponibles pour le moment');
    } finally {
      setReminding(false);
    }
  };

  useEffect(() => {
    if (!syndicId) return;
    runReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syndicId]);

  if (!syndicId) return <WorkspaceRequired />;

  const save = async (values, target) => {
    const payload = { ...values };
    if ('building_id' in values) {
      payload.building_name = buildings.find((item) => item.id === values.building_id)?.name || '';
    }
    if ('provider_id' in values) {
      const provider = providers.find((item) => item.id === values.provider_id);
      payload.provider_name = provider?.name || '';
      payload.provider_email = provider?.email || '';
    }
    if ('duration_minutes' in values) payload.duration_minutes = Number(values.duration_minutes) || 60;
    if ('reminder_days' in values) {
      payload.reminder_days =
        values.reminder_days === '' || values.reminder_days == null ? 7 : Number(values.reminder_days);
    }
    if ('cost' in values) payload.cost = values.cost === '' || values.cost == null ? null : Number(values.cost);
    if ('status' in values) {
      payload.completed_date = values.status === 'terminee' ? target?.completed_date || todayISO() : '';
    }

    if (target) {
      const rescheduled =
        ('scheduled_date' in values && values.scheduled_date !== target.scheduled_date) ||
        ('scheduled_time' in values && values.scheduled_time !== target.scheduled_time) ||
        ('reminder_days' in values && Number(values.reminder_days) !== Number(target.reminder_days));
      await base44.entities.Intervention.update(target.id, {
        ...payload,
        ...(rescheduled ? { reminder_sent: false, late_alert_sent: false } : {}),
      });
      await logAction({ syndicId, action: 'Mise à jour', entity: 'Intervention', entityLabel: payload.title });
    } else {
      await base44.entities.Intervention.create({
        ...payload,
        syndic_id: syndicId,
        reminder_sent: false,
        late_alert_sent: false,
      });
      await logAction({ syndicId, action: 'Création', entity: 'Intervention', entityLabel: payload.title });
    }
    await reload();
  };

  const saveFromCalendar = async (values, target) => {
    await save(
      target
        ? values
        : { ...values, kind: 'preventive', origin: 'entretien', status: 'planifiee', reminder_days: 7 },
      target,
    );
  };

  const remove = async (row) => {
    await base44.entities.Intervention.delete(row.id);
    await logAction({ syndicId, action: 'Suppression', entity: 'Intervention', entityLabel: row.title });
    await reload();
  };

  const isOpenRow = (row) => row.status !== 'terminee' && row.status !== 'annulee';
  const isWeekRow = (row) => {
    const days = daysUntil(row.scheduled_date);
    return days != null && days >= 0 && days <= 7;
  };
  const isLateRow = (row) => {
    const days = daysUntil(row.scheduled_date);
    return days != null && days < 0;
  };

  const active = items.filter(isOpenRow);
  const urgent = active.filter((row) => (row.priority || 'normale') === 'urgente').length;
  const week = active.filter(isWeekRow).length;
  const late = active.filter(isLateRow).length;
  const repairs = active.filter((row) => (row.origin || 'entretien') === 'depannage').length;

  // Chaque carte de synthèse ouvre la liste correspondante.
  const matchesQuick = (row) => {
    if (!quick) return true;
    if (!isOpenRow(row)) return false;
    if (quick === 'urgent') return (row.priority || 'normale') === 'urgente';
    if (quick === 'week') return isWeekRow(row);
    if (quick === 'late') return isLateRow(row);
    if (quick === 'repair') return (row.origin || 'entretien') === 'depannage';
    return true;
  };

  const toggleQuick = (value) => {
    setQuick((current) => (current === value ? '' : value));
    window.requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const QUICK_LABELS = {
    urgent: 'Urgences — pastille rouge',
    week: 'Entretiens des 7 prochains jours',
    late: 'Interventions à replanifier',
    repair: 'Dépannages — propriétaire prévenu',
  };

  const rows = items.filter((row) => {
    if (!matchesQuick(row)) return false;
    if (statusFilter && row.status !== statusFilter) return false;
    if (priorityFilter && (row.priority || 'normale') !== priorityFilter) return false;
    if (originFilter && (row.origin || 'entretien') !== originFilter) return false;
    const haystack = `${row.title} ${row.building_name} ${row.provider_name} ${row.contact_email}`.toLowerCase();
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
    {
      name: 'provider_id',
      label: 'Intervenant',
      type: 'select',
      options: providers.map((provider) => ({ value: provider.id, label: provider.name })),
    },
    { name: 'origin', label: 'Motif', type: 'select', options: options(INTERVENTION_ORIGIN) },
    { name: 'priority', label: 'Importance (pastille)', type: 'select', options: options(INTERVENTION_PRIORITY) },
    { name: 'kind', label: 'Type', type: 'select', options: options(INTERVENTION_KIND) },
    { name: 'status', label: 'Statut', type: 'select', options: options(INTERVENTION_STATUS) },
    { name: 'scheduled_date', label: 'Date', type: 'date', hint: 'Date de l’entretien ou du dépannage.' },
    { name: 'scheduled_time', label: 'Heure de début', type: 'time' },
    { name: 'duration_minutes', label: 'Durée (minutes)', type: 'number', min: 30, step: 15 },
    { name: 'reminder_days', label: 'Alerte X jours avant', type: 'number', min: 0, step: 1, hint: '7 par défaut.' },
    { name: 'cost', label: 'Coût (€)', type: 'number', min: 0, step: '0.01' },
    {
      name: 'contact_email',
      label: 'Propriétaire à prévenir',
      span: 2,
      placeholder: 'proprietaire@example.com',
      hint: 'Destinataire des alertes de dépannage. À défaut, le contact du syndic est utilisé.',
    },
    { name: 'description', label: 'Description', type: 'textarea', span: 2, rows: 3 },
    { name: 'report', label: 'Compte rendu', type: 'textarea', span: 2, rows: 3 },
  ];

  return (
    <Page
      kicker="Exploitation"
      title="Interventions"
      description="Planifiez les entretiens et les dépannages à l’heure près, suivez les priorités et recevez une alerte avant chaque échéance."
      actions={
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouvelle intervention
        </Button>
      }
      wide
    >
      <StatStrip
        items={[
          {
            label: 'Urgences',
            value: formatNumber(urgent),
            hint: 'pastille rouge',
            onClick: () => toggleQuick('urgent'),
            active: quick === 'urgent',
          },
          {
            label: '7 prochains jours',
            value: formatNumber(week),
            hint: 'entretiens à préparer',
            onClick: () => toggleQuick('week'),
            active: quick === 'week',
          },
          {
            label: 'En retard',
            value: formatNumber(late),
            hint: late ? 'à replanifier' : 'aucun retard',
            onClick: () => toggleQuick('late'),
            active: quick === 'late',
          },
          {
            label: 'Dépannages',
            value: formatNumber(repairs),
            hint: 'propriétaire prévenu',
            onClick: () => toggleQuick('repair'),
            active: quick === 'repair',
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <InterventionCalendar
          interventions={items}
          providers={providers}
          month={month}
          onMonthChange={setMonth}
          onSave={saveFromCalendar}
          onDelete={remove}
          loading={loading}
        />
        <InterventionAlerts
          interventions={items}
          onOpen={(intervention) => {
            setEditing(intervention);
            setFormOpen(true);
          }}
          onRemind={runReminders}
          reminding={reminding}
          info={alertInfo}
        />
      </div>

      <div ref={tableRef} className="scroll-mt-6 space-y-2.5">
      <QuickFilterBar
        label={QUICK_LABELS[quick]}
        count={quick ? rows.length : null}
        onClear={() => setQuick('')}
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
          {
            key: 'priority',
            value: priorityFilter,
            onChange: setPriorityFilter,
            placeholder: 'Importance',
            allLabel: 'Toutes les importances',
            options: options(INTERVENTION_PRIORITY),
          },
          {
            key: 'origin',
            value: originFilter,
            onChange: setOriginFilter,
            placeholder: 'Motif',
            allLabel: 'Tous les motifs',
            options: options(INTERVENTION_ORIGIN),
          },
        ]}
        columns={[
          {
            key: 'title',
            header: 'Intervention',
            render: (row) => (
              <div className="min-w-0 max-w-[300px]">
                <p className="truncate font-medium text-foreground">{row.title}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {row.building_name || 'Immeuble non précisé'} · {INTERVENTION_ORIGIN[row.origin || 'entretien']}
                </p>
              </div>
            ),
          },
          {
            key: 'priority',
            header: 'Importance',
            render: (row) => (
              <StatusBadge
                value={row.priority || 'normale'}
                map={INTERVENTION_PRIORITY}
                tone={PRIORITY_TONE[row.priority || 'normale']}
              />
            ),
          },
          {
            key: 'scheduled_date',
            header: 'Date & heure',
            render: (row) => (
              <div className="whitespace-nowrap">
                <p className="text-[12.5px] text-foreground">{formatDate(row.scheduled_date)}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {row.scheduled_time || '—'}
                  {row.duration_minutes ? ` · ${row.duration_minutes} min` : ''}
                </p>
              </div>
            ),
          },
          { key: 'provider_name', header: 'Intervenant', render: (row) => row.provider_name || 'À affecter' },
          {
            key: 'contact_email',
            header: 'Propriétaire prévenu',
            render: (row) => {
              const provider = providers.find((item) => item.id === row.provider_id);
              const phone = provider?.phone || '';
              return (
                <div className="min-w-0 max-w-[210px]">
                  {row.contact_email ? (
                    <a
                      href={`mailto:${row.contact_email}`}
                      onClick={(event) => event.stopPropagation()}
                      className="block truncate text-[12.5px] text-primary hover:underline"
                    >
                      {row.contact_email}
                    </a>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">Contact non renseigné</p>
                  )}
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {provider?.name || row.provider_name || 'Intervenant à affecter'}
                    {phone ? ` · ${phone}` : ''}
                  </p>
                </div>
              );
            },
          },
          { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} map={INTERVENTION_STATUS} /> },
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
                label={row.title}
              />
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        onRowClick={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        empty={{
          icon: Wrench,
          title: 'Aucune intervention planifiée',
          description: 'Planifiez un entretien ou un dépannage : il apparaît dans le calendrier et déclenche les alertes.',
          action: (
            <Button className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle intervention
            </Button>
          ),
        }}
      />
      </div>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? "Modifier l'intervention" : 'Nouvelle intervention'}
        description="Date, heure précise, importance et délai d’alerte : le syndic est prévenu avant l’échéance, le propriétaire pour les dépannages."
        fields={fields}
        initialValues={editing || EMPTY}
        onSubmit={(values) => save(values, editing)}
        submitLabel={editing ? 'Mettre à jour' : 'Enregistrer'}
      />
    </Page>
  );
}