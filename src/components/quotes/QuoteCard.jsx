import { CheckCircle2, Clock, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import FileLink from '@/components/quotes/FileLink';
import { formatEUR } from '@/lib/format';
import { QUOTE_OFFER_STATUS } from '@/lib/constants';

export default function QuoteCard({ offer, company, locked, busy, onSelect }) {
  const selected = offer.status === 'retenu';
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-3.5 transition-colors ${
        selected ? 'border-primary/60 bg-accent/40' : 'border-border/80 bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">{offer.company_name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Devis reçu par {offer.received_channel === 'telephone' ? 'téléphone' : offer.received_channel}
          </p>
        </div>
        <StatusBadge value={offer.status} map={QUOTE_OFFER_STATUS} />
      </div>

      <div>
        <p className="font-mono text-[22px] font-semibold leading-none tnum text-foreground">
          {formatEUR(offer.amount)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
          {offer.duration_days ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {offer.duration_days} j de travaux
            </span>
          ) : null}
          {offer.validity_days ? (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              valable {offer.validity_days} j
            </span>
          ) : null}
          {company?.google_rating ? (
            <span className="inline-flex items-center gap-1 font-mono">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {company.google_rating.toFixed(1)}
              {company.google_reviews_count ? ` (${company.google_reviews_count})` : ''}
            </span>
          ) : (
            <span>Avis Google indisponibles</span>
          )}
        </div>
      </div>

      {offer.conditions && (
        <p className="line-clamp-3 text-[12px] leading-snug text-foreground/70">{offer.conditions}</p>
      )}

      {offer.file_uri ? <FileLink uri={offer.file_uri} label="Ouvrir le devis" /> : null}

      {selected ? (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1.5 text-[11.5px] font-medium text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Devis retenu
        </p>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={locked || busy}
          onClick={() => onSelect(offer)}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {locked ? 'Décision enregistrée' : 'Retenir ce devis'}
        </Button>
      )}
    </div>
  );
}