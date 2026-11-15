import { useState } from 'react';
import { Building2, Loader2, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import DirectoryResultCard from '@/components/partners/DirectoryResultCard';
import { cn } from '@/lib/utils';

const TRADES = [
  'Électricité',
  'Plomberie',
  'Serrurerie',
  'Isolation',
  'Toiture',
  'Ravalement',
  'Chauffage',
  'Ascenseur',
  'Nettoyage',
  'Espaces verts',
];

export default function CompanyDirectory({ knownSirets = [], contacts = {}, onAdd }) {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const run = async () => {
    if (query.trim().length < 2) {
      setError('Indiquez un métier (électricité, serrurier, isolation…) ou une raison sociale.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('companySearch', { query, city });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (invokeError) {
      setError(invokeError?.response?.data?.error || invokeError.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Building2 className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="kicker">Annuaire officiel · registre de l’État</p>
          <h2 className="mt-1 font-heading text-[15px] font-semibold text-foreground">
            Trouver une entreprise dans une ville
          </h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            Choisissez un métier et une commune : toutes les entreprises actives qui y sont
            répertoriées s’affichent, prêtes à être ajoutées au répertoire. Le bouton
            « Coordonnées » affiche le téléphone et l’e-mail publiés pour joindre directement
            l’entreprise.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TRADES.map((trade) => (
          <button
            key={trade}
            type="button"
            onClick={() => setQuery(trade)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11.5px] transition-colors',
              query === trade
                ? 'border-primary/40 bg-accent font-medium text-accent-foreground'
                : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {trade}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_200px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && run()}
            placeholder="Électricité, serrurier, isolation, nom de l’entreprise…"
            className="h-9 border-border/80 bg-background pl-9 text-[13px]"
          />
        </div>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && run()}
            placeholder="Ville ou code postal"
            className="h-9 border-border/80 bg-background pl-9 text-[13px]"
          />
        </div>
        <Button type="button" onClick={run} disabled={loading} className="h-9 gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Rechercher
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive"
        >
          {error}
        </p>
      )}

      {result && !loading && (
        <div className="mt-3">
          <p className="text-[12.5px] text-foreground/75">
            <span className="font-medium text-foreground">{result.total}</span> entreprise
            {result.total > 1 ? 's' : ''} trouvée{result.total > 1 ? 's' : ''}
            {result.trade ? ` en ${result.trade.toLowerCase()}` : ` pour « ${query} »`}
            {result.city ? ` à ${result.city}` : ' en France'}
            {result.total > result.items.length
              ? ` · ${result.items.length} affichées, précisez la ville pour affiner`
              : ''}
            .
          </p>
          {result.items.length > 0 ? (
            <div className="mt-2 grid gap-2">
              {result.items.map((item) => (
                <DirectoryResultCard
                  key={item.siret}
                  item={item}
                  known={knownSirets.includes(item.siret)}
                  savedContact={contacts[item.siret]}
                  onAdd={onAdd}
                />
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-xl border border-dashed border-border px-3 py-4 text-center text-[12.5px] text-muted-foreground">
              Aucune entreprise active pour cette recherche. Essayez un autre métier ou élargissez la zone.
            </p>
          )}
        </div>
      )}
    </div>
  );
}