import { useState } from 'react';
import { Landmark, Loader2, MessageSquareWarning, Receipt, UserRound, Wallet } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import EmptyState from '@/components/EmptyState';
import PortalChargesTable from '@/components/portal/PortalChargesTable';
import PortalReceipts from '@/components/portal/PortalReceipts';
import PortalNextDue from '@/components/portal/PortalNextDue';
import PortalTickets from '@/components/portal/PortalTickets';
import PortalDocuments from '@/components/portal/PortalDocuments';
import PortalAssemblies from '@/components/portal/PortalAssemblies';
import PortalMyLots from '@/components/portal/PortalMyLots';
import FondsTravauxPanel from '@/components/portal/FondsTravauxPanel';
import PortalShortcuts from '@/components/portal/PortalShortcuts';
import PortalReportDialog from '@/components/portal/PortalReportDialog';
import { useAuth } from '@/lib/AuthContext';
import useResidentSpace, { isSettled } from '@/hooks/useResidentSpace';
import { formatDate, formatEUR, formatNumber } from '@/lib/format';

const OPEN_TICKET_STATUSES = ['nouveau', 'qualifie', 'en_cours', 'en_attente'];

const firstName = (me) => {
  const raw = me?.full_name || me?.email || '';
  return raw.split(/[\s@]/)[0] || '';
};

export default function MonEspace() {
  const { loading, error, me, lots, buildings, invoices, payments, fonds, assemblies, documents, tickets, syndic } =
    useResidentSpace();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <Page kicker="Espace personnel" title="Mon espace">
        <div className="flex items-center justify-center rounded-[24px] border border-border bg-card py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Page>
    );
  }

  const myLots = lots.map((lot) => ({
    ...lot,
    buildingName: buildings.find((row) => row.id === lot.building_id)?.name || 'Immeuble',
  }));

  const totalCalled = invoices.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const openInvoices = invoices.filter((row) => !isSettled(row));
  const outstanding = openInvoices.reduce(
    (sum, row) => sum + Math.max((Number(row.amount) || 0) - (Number(row.paid_amount) || 0), 0),
    0,
  );
  const nextDue =
    [...openInvoices].sort((a, b) =>
      String(a.due_date || '9999-12-31').localeCompare(String(b.due_date || '9999-12-31')),
    )[0] || null;
  const latestYear = fonds.length ? Math.max(...fonds.map((row) => row.year)) : null;
  const fondsAnnual = fonds.filter((row) => row.year === latestYear).reduce((sum, row) => sum + row.amount, 0);
  const openTickets = tickets.filter((ticket) => OPEN_TICKET_STATUSES.includes(ticket.status)).length;

  return (
    <Page
      kicker="Espace personnel"
      title={firstName(me) ? `Bonjour ${firstName(me)}` : 'Mon espace'}
      description="Vos charges et reçus, vos demandes, les documents et assemblées de votre copropriété, au même endroit."
      actions={
        myLots.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {myLots.map((lot) => (
              <span
                key={lot.id}
                className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground"
              >
                {lot.buildingName} · lot {lot.number}
              </span>
            ))}
          </div>
        )
      }
    >
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      {!myLots.length ? (
        <div className="rounded-[24px] border border-border bg-card">
          <EmptyState
            icon={UserRound}
            title="Votre espace n’est pas encore rattaché"
            description={`Aucun lot ne correspond à l’adresse ${me?.email || 'de votre compte'}. Demandez à votre syndic de renseigner cet email sur votre fiche copropriétaire pour accéder à vos appels de fonds.`}
          />
        </div>
      ) : (
        <>
          <StatStrip
            items={[
              {
                label: 'Reste à payer',
                value: formatEUR(outstanding, 2),
                hint: nextDue ? `échéance du ${formatDate(nextDue.due_date)}` : 'à jour de vos charges',
                icon: Wallet,
              },
              {
                label: 'Appelé sur 3 ans',
                value: formatEUR(totalCalled, 0),
                hint: `${formatNumber(invoices.length)} avis d’échéance`,
                icon: Receipt,
              },
              {
                label: 'Fonds de travaux',
                value: formatEUR(fondsAnnual, 0),
                hint: latestYear ? `quote-part ${latestYear}` : 'budget non voté',
                icon: Landmark,
              },
              {
                label: 'Demandes en cours',
                value: formatNumber(openTickets),
                hint: tickets.length ? `${formatNumber(tickets.length)} au total` : 'aucun signalement',
                icon: MessageSquareWarning,
              },
            ]}
          />

          <PortalNextDue next={nextDue} syndic={syndic} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <PortalChargesTable
                invoices={invoices}
                lots={lots}
                buildings={buildings}
                payments={payments}
              />
              <PortalReceipts invoices={invoices} lots={lots} buildings={buildings} payments={payments} />
              <PortalTickets tickets={tickets} onReport={() => setReportOpen(true)} />
            </div>
            <div className="min-w-0 space-y-4">
              <FondsTravauxPanel fonds={fonds} />
              <PortalMyLots lots={lots} buildings={buildings} syndic={syndic} />
              <PortalShortcuts isAdmin={isAdmin} onReport={() => setReportOpen(true)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 [&>section]:min-w-0">
            <PortalDocuments documents={documents} buildings={buildings} />
            <PortalAssemblies assemblies={assemblies} buildings={buildings} />
          </div>
        </>
      )}

      <PortalReportDialog open={reportOpen} onOpenChange={setReportOpen} lots={myLots} buildings={buildings} />
    </Page>
  );
}