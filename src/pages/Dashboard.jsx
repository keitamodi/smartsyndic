import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Plus } from 'lucide-react';
import Page from '@/components/Page';
import StatHero from '@/components/dashboard/StatHero';
import MetricCard from '@/components/dashboard/MetricCard';
import BarGraph from '@/components/dashboard/BarGraph';
import LineGraph from '@/components/dashboard/LineGraph';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AutomationsPanel from '@/components/automations/AutomationsPanel';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import { Button } from '@/components/ui/button';
import useCollection from '@/hooks/useCollection';
import { useWorkspace } from '@/lib/workspace';
import { formatEUR, formatNumber, relativeTime } from '@/lib/format';

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const sameDay = (a, b) => a.toDateString() === b.toDateString();

export default function Dashboard() {
  const { syndicId } = useWorkspace();

  const { items: buildings } = useCollection('Building', { syndic_id: syndicId }, { enabled: !!syndicId });
  const { items: tickets } = useCollection('Ticket', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 300 });
  const { items: interventions } = useCollection('Intervention', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 300 });
  const { items: invoices } = useCollection('Invoice', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 300 });
  const { items: contracts } = useCollection('Contract', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 200 });
  const { items: assemblies } = useCollection('Assembly', { syndic_id: syndicId }, { enabled: !!syndicId, limit: 100 });

  if (!syndicId) return <WorkspaceRequired />;

  const called = invoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
  const paid = invoices.reduce((sum, invoice) => sum + (Number(invoice.paid_amount) || 0), 0);
  const recovery = called > 0 ? Math.min((paid / called) * 100, 100) : 0;

  const openTickets = tickets.filter((ticket) => !['clos', 'resolu'].includes(ticket.status));
  const urgentTickets = openTickets.filter((ticket) => ['haute', 'urgente'].includes(ticket.priority));
  const closedTickets = tickets.filter((ticket) => ['clos', 'resolu'].includes(ticket.status));

  const days = Array.from({ length: 14 }, (_, index) => {
    const day = startOfDay(new Date());
    day.setDate(day.getDate() - (13 - index));
    return day;
  });
  const ticketBars = days.map(
    (day) => tickets.filter((ticket) => ticket.created_date && sameDay(new Date(ticket.created_date), day)).length,
  );

  const nextDays = Array.from({ length: 7 }, (_, index) => {
    const day = startOfDay(new Date());
    day.setDate(day.getDate() + index);
    return day;
  });
  const interventionSeries = nextDays.map(
    (day) =>
      interventions.filter(
        (intervention) => intervention.scheduled_date && sameDay(new Date(intervention.scheduled_date), day),
      ).length,
  );

  const todayStart = startOfDay(new Date());
  const scheduled = interventions.filter((intervention) => intervention.status === 'planifiee');
  const todayInterventions = scheduled.filter(
    (intervention) => intervention.scheduled_date && sameDay(new Date(intervention.scheduled_date), todayStart),
  );
  const lateInterventions = scheduled.filter(
    (intervention) => intervention.scheduled_date && new Date(intervention.scheduled_date) < todayStart,
  );

  const expiringContracts = contracts.filter((contract) => {
    if (!contract.end_date || contract.status === 'resilie') return false;
    const daysLeft = Math.round((new Date(contract.end_date) - todayStart) / 86400000);
    return daysLeft >= 0 && daysLeft <= 60;
  });

  const nextAssembly = assemblies
    .filter((assembly) => assembly.date && new Date(assembly.date) >= todayStart && assembly.status !== 'annulee')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const feed = [
    ...tickets.slice(0, 4).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      label: 'Ticket',
      detail: `${ticket.title}${ticket.building_name ? ` · ${ticket.building_name}` : ''}`,
      time: relativeTime(ticket.created_date),
      at: ticket.created_date,
      to: '/tickets',
    })),
    ...interventions.slice(0, 3).map((intervention) => ({
      id: `intervention-${intervention.id}`,
      label: 'Intervention',
      detail: `${intervention.title}${intervention.building_name ? ` · ${intervention.building_name}` : ''}`,
      time: relativeTime(intervention.created_date),
      at: intervention.created_date,
      to: '/maintenance',
    })),
    ...invoices.slice(0, 3).map((invoice) => ({
      id: `invoice-${invoice.id}`,
      label: 'Facture',
      detail: `${invoice.reference} · ${formatEUR(invoice.amount, 2)}${invoice.building_name ? ` · ${invoice.building_name}` : ''}`,
      time: relativeTime(invoice.created_date),
      at: invoice.created_date,
      to: '/facturation',
    })),
  ]
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
    .slice(0, 6);

  const hasData = buildings.length > 0 || tickets.length > 0 || invoices.length > 0;

  return (
    <Page
      kicker="Espace syndic"
      title="Tableau de bord"
      description="Vue consolidée de vos copropriétés : appels de fonds, demandes des résidents, interventions et échéances."
      actions={
        <>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/tickets">
              Voir les tickets
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/immeubles">
              <Plus className="h-4 w-4" />
              Nouvel immeuble
            </Link>
          </Button>
        </>
      }
    >
      {!hasData && (
        <div className="flex flex-col items-start gap-3 rounded-[22px] border border-primary/20 bg-accent/40 px-5 py-4 sm:flex-row sm:items-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card">
            <Building2 className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-foreground">Votre espace est prêt à recevoir vos données</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Créez votre premier immeuble puis ajoutez ses lots pour activer le suivi des demandes et des finances.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/immeubles">Créer un immeuble</Link>
          </Button>
        </div>
      )}

      <section className="rounded-[30px] border border-border/70 bg-card/45 p-3 sm:p-4">
        <StatHero
          kicker="Appels de fonds · exercice en cours"
          value={called}
          format={(value) => formatEUR(value)}
          delta={called > 0 ? `${formatEUR(paid)} encaissés` : 'Aucun appel émis'}
          note={`sur ${formatNumber(invoices.length)} document(s)`}
          percent={recovery}
          percentLabel={
            called > 0
              ? `${Math.round(recovery)} % du montant appelé déjà encaissé`
              : 'Créez un appel de fonds pour suivre le recouvrement'
          }
        />

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <MetricCard
            title="Tickets ouverts"
            sub="14 derniers jours"
            graphic={<BarGraph values={ticketBars} />}
            stats={[
              { label: 'Ouverts', value: openTickets.length },
              { label: 'Urgents', value: urgentTickets.length },
              { label: 'Clôturés', value: closedTickets.length },
            ]}
            footnote={
              urgentTickets.length > 0
                ? `${urgentTickets.length} demande(s) à traiter en priorité.`
                : 'Aucune demande urgente en attente.'
            }
          />
          <MetricCard
            title="Interventions"
            sub="7 prochains jours"
            graphic={<LineGraph values={interventionSeries} startLabel="Auj." endLabel="+6j" />}
            stats={[
              { label: 'Planifiées', value: scheduled.length },
              { label: "Aujourd'hui", value: todayInterventions.length },
              { label: 'En retard', value: lateInterventions.length },
            ]}
            footnote={
              lateInterventions.length > 0
                ? `${lateInterventions.length} intervention(s) dépassent la date prévue.`
                : 'Planning à jour.'
            }
          />
        </div>

        <div className="mt-3">
          <ActivityFeed
            rows={feed}
            emptyText="Aucune activité enregistrée. Les créations de tickets, interventions et factures apparaîtront ici."
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <p className="kicker !text-[9px]">Contrats à échéance</p>
          <p className="mt-1.5 font-mono text-[21px] leading-none tnum">{formatNumber(expiringContracts.length)}</p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">sous 60 jours</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <p className="kicker !text-[9px]">Prochaine assemblée</p>
          <p className="mt-1.5 truncate text-[13px] font-medium leading-snug text-foreground">
            {nextAssembly?.title || 'Aucune AG planifiée'}
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {nextAssembly?.date ? new Date(nextAssembly.date).toLocaleDateString('fr-FR') : 'Planifiez votre prochaine AG'}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <p className="kicker !text-[9px]">Immeubles gérés</p>
          <p className="mt-1.5 font-mono text-[21px] leading-none tnum">{formatNumber(buildings.length)}</p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">dans cet espace syndic</p>
        </div>
      </section>

      <AutomationsPanel syndicId={syndicId} />
    </Page>
  );
}