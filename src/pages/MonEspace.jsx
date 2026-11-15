import { Landmark, Loader2, PiggyBank, Receipt, UserRound, Wallet } from 'lucide-react';
import Page from '@/components/Page';
import StatStrip from '@/components/StatStrip';
import EmptyState from '@/components/EmptyState';
import PortalChargesTable from '@/components/portal/PortalChargesTable';
import PortalReceipts from '@/components/portal/PortalReceipts';
import FondsTravauxPanel from '@/components/portal/FondsTravauxPanel';
import PortalShortcuts from '@/components/portal/PortalShortcuts';
import useResidentSpace, { isSettled } from '@/hooks/useResidentSpace';
import { formatEUR, formatNumber } from '@/lib/format';

const firstName = (me) => {
  const raw = me?.full_name || me?.email || '';
  return raw.split(/[\s@]/)[0] || '';
};

export default function MonEspace() {
  const { loading, error, me, lots, buildings, invoices, payments, fonds } = useResidentSpace();

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
  const outstanding = invoices
    .filter((row) => !isSettled(row))
    .reduce((sum, row) => sum + Math.max((Number(row.amount) || 0) - (Number(row.paid_amount) || 0), 0), 0);
  const receipts = invoices.filter(isSettled).length;
  const latestYear = fonds.length ? Math.max(...fonds.map((row) => row.year)) : null;
  const fondsAnnual = fonds
    .filter((row) => row.year === latestYear)
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <Page
      kicker="Espace personnel"
      title={firstName(me) ? `Bonjour ${firstName(me)}` : 'Mon espace'}
      description="Historique de vos appels de fonds sur trois ans, quote-part du fonds de travaux et reçus libératoires, au même endroit."
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
                label: 'Appelé sur 3 ans',
                value: formatEUR(totalCalled, 0),
                hint: `${formatNumber(invoices.length)} avis d’échéance`,
                icon: Receipt,
              },
              {
                label: 'Reste à payer',
                value: formatEUR(outstanding, 2),
                hint: outstanding > 0 ? 'échéances ouvertes' : 'à jour de vos charges',
                icon: Wallet,
              },
              {
                label: 'Fonds de travaux',
                value: formatEUR(fondsAnnual, 0),
                hint: latestYear ? `quote-part ${latestYear}` : 'budget non voté',
                icon: Landmark,
              },
              {
                label: 'Reçus libératoires',
                value: formatNumber(receipts),
                hint: 'téléchargeables en PDF',
                icon: PiggyBank,
              },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <PortalChargesTable
                invoices={invoices}
                lots={lots}
                buildings={buildings}
                payments={payments}
              />
              <PortalReceipts invoices={invoices} lots={lots} buildings={buildings} payments={payments} />
            </div>
            <div className="space-y-4">
              <FondsTravauxPanel fonds={fonds} />
              <PortalShortcuts />
            </div>
          </div>
        </>
      )}
    </Page>
  );
}