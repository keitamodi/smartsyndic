import { useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ContactActions from '@/components/messaging/ContactActions';
import { THREAD_KIND, THREAD_TONE, THREAD_STATUS } from '@/lib/constants';
import { initials, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const FILTERS = [
  { value: 'tous', label: 'Toutes' },
  { value: 'ouvert', label: 'Ouvertes' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'clos', label: 'Closes' },
];



export default function ThreadList({ threads, selectedId, onSelect, loading }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('tous');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return threads.filter((thread) => {
      if (status !== 'tous' && thread.status !== status) return false;
      if (!term) return true;
      return [thread.contact_name, thread.subject, thread.last_message, thread.building_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [threads, search, status]);

  return (
    <aside className="flex max-h-[420px] min-w-0 flex-col rounded-[22px] border border-border bg-card md:max-h-[560px] lg:max-h-[640px]">
      <div className="space-y-2 border-b border-border/70 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un contact, un sujet…"
            className="h-9 pl-8 text-[12px]"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatus(item.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-colors',
                status === item.value
                  ? 'border-primary/40 bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="thin-scroll flex-1 overflow-y-auto p-1.5">
        {loading && (
          <p className="flex items-center gap-2 px-2 py-4 text-[11.5px] text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Chargement…
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="px-2 py-4 text-[11.5px] leading-snug text-muted-foreground">
            Aucune conversation ne correspond. Ouvrez une nouvelle conversation pour écrire à un copropriétaire, un
            propriétaire ou un prestataire.
          </p>
        )}
        <ul className="space-y-0.5">
          {filtered.map((thread) => (
            <li key={thread.id}>
              <div
                className={cn(
                  'flex items-stretch rounded-xl transition-colors',
                  selectedId === thread.id ? 'bg-accent' : 'hover:bg-secondary/60',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  className="min-w-0 flex-1 rounded-l-xl px-2.5 py-2 text-left"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-[10px] font-semibold text-foreground/70">
                      {initials(thread.contact_name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[12.5px] font-medium text-foreground">{thread.contact_name}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {relativeTime(thread.updated_date)}
                        </span>
                      </div>
                      <p className="truncate text-[11px] font-medium text-foreground/70">{thread.subject}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[9.5px] uppercase tracking-wide text-muted-foreground">
                          {THREAD_KIND[thread.contact_kind] || 'Contact'}
                        </span>
                        <p className="truncate text-[10.5px] text-muted-foreground">{thread.last_message || '—'}</p>
                      </div>
                    </div>
                  </div>
                </button>
                <div className="flex flex-col items-center justify-center gap-0.5 pr-1">
                  <ContactActions
                    compact
                    phone={thread.contact_phone}
                    email={thread.contact_email}
                    name={thread.contact_name}
                    subject={`SyndicVibe — ${thread.subject}`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-border/70 px-3 py-2 text-[10.5px] text-muted-foreground">
        {filtered.length} conversation(s) · statuts : {Object.values(THREAD_STATUS).join(' · ')}
      </p>
    </aside>
  );
}