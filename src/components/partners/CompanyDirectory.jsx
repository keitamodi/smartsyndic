import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
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
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="kicker">Annuaire officiel · registre de l’État</p>
      <h2 className="mt-1 font-heading text-[15px] font-semibold text-foreground">
        Trouver une entreprise dans une ville
      </h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        Choisissez un métier et une commune : toutes les entreprises actives qui y sont répertoriées
        s’affichent, prêtes à être ajoutées au répertoire. Le bouton « Coordonnées » affiche le
        téléphone et l’e-mail publiés pour joindre directement l’entreprise.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TRADES.map((trade) => (
          <button
            key={trade}
            type="button"
            onClick={() => setQuery(trade)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11.5px] transition-colors',
              query === trade
                ? 'border-primary/40 bg-accent text-accent-foreground'
                : 'border-border text-muted-foreground hover:bg-secondary',
            )}
          >
            {trade}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_190px_auto]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && run()}
          placeholder="Électricité, serrurier, isolation, nom de l’entreprise…"
        />
        <Input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && run()}
          placeholder="Ville ou code postal"
        />
        <Button type="button" onClick={run} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Rechercher
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
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
    </section>
  );
}