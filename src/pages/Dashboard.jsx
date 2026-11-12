import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatHero from '@/components/dashboard/StatHero';
import MetricCard from '@/components/dashboard/MetricCard';
import BarGraph from '@/components/dashboard/BarGraph';
import LineGraph from '@/components/dashboard/LineGraph';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { Button } from '@/components/ui/button';
import { formatEUR, formatNumber } from '@/lib/format';

/* Aperçu temporaire — remplacé par les données réelles de l'espace syndic. */
const APERCU = {
  hero: {
    kicker: 'Appels de fonds · Novembre',
    value: 48250,
    delta: '+12 %',
    note: 'vs exercice précédent',
    percent: 68,
    percentLabel: 'du budget appelé déjà encaissé',
  },
  tickets: {
    bars: [4, 6, 3, 8, 5, 9, 6, 11, 7, 12, 9, 14, 10, 15],
    total: 42,
    urgent: 6,
    closed: 18,
  },
  interventions: {
    values: [3, 5, 4, 7, 6, 9, 11],
    planned: 11,
    today: 3,
    late: 2,
  },
  activity: [
    { id: 'a', label: 'Ticket', detail: 'Fuite en cave · Résidence Les Tilleuls', time: 'il y a 2 min', to: '/tickets' },
    { id: 'b', label: 'Intervention', detail: 'Entretien chaudière programmé vendredi', time: 'il y a 1 h', to: '/maintenance' },
    { id: 'c', label: 'Facture', detail: 'Appel de fonds T4 · 18 lots', time: 'hier', to: '/facturation' },
    { id: 'd', label: 'Assemblée', detail: 'AG ordinaire convoquée pour le 05/12', time: 'il y a 2 j', to: '/assemblees' },
  ],
};

export default function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-6">
      <PageHeader
        kicker="Espace syndic"
        title="Tableau de bord"
        description="Vue consolidée de vos copropriétés : encaissements, demandes des résidents et interventions en cours."
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
      />

      <section className="rounded-[30px] border border-border/70 bg-card/45 p-3 sm:p-4">
        <StatHero {...APERCU.hero} format={(value) => formatEUR(value)} />

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <MetricCard
            title="Tickets ouverts"
            sub="14 derniers jours"
            graphic={<BarGraph values={APERCU.tickets.bars} />}
            stats={[
              { label: 'Total', value: APERCU.tickets.total },
              { label: 'Urgents', value: APERCU.tickets.urgent },
              { label: 'Clôturés', value: APERCU.tickets.closed },
            ]}
          />
          <MetricCard
            title="Interventions"
            sub="7 prochains jours"
            graphic={<LineGraph values={APERCU.interventions.values} startLabel="Lun" endLabel="Dim" />}
            stats={[
              { label: 'Planifiées', value: APERCU.interventions.planned },
              { label: "Aujourd'hui", value: APERCU.interventions.today },
              { label: 'En retard', value: APERCU.interventions.late },
            ]}
          />
        </div>

        <div className="mt-3">
          <ActivityFeed
            rows={APERCU.activity}
            emptyText="Aucune activité enregistrée pour le moment."
          />
        </div>
      </section>

      <p className="px-1 text-[11px] text-muted-foreground">
        Aperçu de démonstration — {formatNumber(APERCU.tickets.total)} demandes suivies. Les données de
        votre espace remplaceront cet aperçu dès la création de vos immeubles.
      </p>
    </div>
  );
}