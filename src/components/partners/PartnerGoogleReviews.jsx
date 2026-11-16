import { Loader2, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function PartnerGoogleReviews({
  rating,
  count,
  reviewsText,
  status,
  note,
  placeId,
  loading,
  onChange,
  onFetch,
}) {
  const hint =
    note ||
    (status === 'disponible'
      ? 'Note et nombre d’avis repris de la fiche Google de l’entreprise.'
      : 'Ces informations sont reprises dans la comparaison des devis.');

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="kicker !text-[9px]">Note et avis Google</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onFetch}
          disabled={loading}
          className="h-7 gap-1.5 px-2 text-[11.5px] text-muted-foreground"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Récupérer la note
        </Button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="mb-1 block text-[11.5px] text-foreground/70">Note (sur 5)</Label>
          <Input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(event) => onChange('google_rating', event.target.value)}
            placeholder="4.6"
          />
        </div>
        <div>
          <Label className="mb-1 block text-[11.5px] text-foreground/70">Nombre d’avis</Label>
          <Input
            type="number"
            min="0"
            value={count}
            onChange={(event) => onChange('google_reviews_count', event.target.value)}
            placeholder="38"
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1 block text-[11.5px] text-foreground/70">
            Extraits d’avis (un par ligne)
          </Label>
          <Textarea
            rows={4}
            value={reviewsText}
            onChange={(event) => onChange('google_reviews_text', event.target.value)}
            placeholder="« Travaux propres et dans les délais » — mars 2026"
          />
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Star className="h-3 w-3" />
        {hint}
      </p>
      {placeId && (
        <a
          href={`https://www.google.com/maps/place/?q=place_id:${placeId}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-[11.5px] font-medium text-primary underline underline-offset-2"
        >
          Lire les avis sur Google
        </a>
      )}
    </div>
  );
}