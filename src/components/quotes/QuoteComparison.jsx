import QuoteCard from '@/components/quotes/QuoteCard';
import { formatEUR } from '@/lib/format';

export default function QuoteComparison({ offers = [], companies = [], locked, busy, onSelect }) {
  if (offers.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-secondary/30 px-4 py-6 text-center text-[12.5px] text-muted-foreground">
        Aucun devis reçu pour l’instant. Contactez les entreprises puis saisissez chaque réponse pour les comparer.
      </p>
    );
  }

  const sorted = [...offers].sort((a, b) => (a.amount || 0) - (b.amount || 0));
  const lowest = sorted[0]?.amount;

  return (
    <div className="space-y-2">
      <p className="text-[11.5px] text-muted-foreground">
        {sorted.length} devis comparés · le plus bas est à {formatEUR(lowest)}
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {sorted.map((offer) => (
          <QuoteCard
            key={offer.id}
            offer={offer}
            company={companies.find((company) => company.id === offer.company_id)}
            locked={locked}
            busy={busy}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}