import { useState } from 'react';
import { AlertTriangle, Check, Copy, Link2, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

export default function AccessCheckTable({ icon: Icon, title, rows, emptyLabel, onPrepare }) {
  const [links, setLinks] = useState({});
  const [copied, setCopied] = useState('');
  const [busy, setBusy] = useState('');

  const linkFor = (row) => links[row.id] || row.link;

  const copy = async (row) => {
    try {
      await navigator.clipboard.writeText(linkFor(row));
      setCopied(row.id);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  };

  const prepare = async (row) => {
    if (!onPrepare) return;
    setBusy(row.id);
    try {
      const created = await onPrepare(row);
      if (created) setLinks((prev) => ({ ...prev, [row.id]: created }));
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="rounded-[22px] border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-[14px] font-medium text-foreground">{title}</h2>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">{rows.length}</span>
      </header>

      {!rows.length ? (
        <p className="px-4 py-6 text-[12.5px] text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="grid gap-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">{row.name}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {row.profile}
                    {row.email ? ` · ${row.email}` : ''}
                  </p>
                </div>

                <div className="min-w-0 text-[12px]">
                  <p className="text-foreground/80">{row.scope}</p>
                  <p className="truncate text-[11.5px] text-muted-foreground">{row.detail}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                  <StatusBadge label={row.status} tone={row.statusTone} />
                  {linkFor(row) ? (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copy(row)}>
                      {copied === row.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Lien d’accès
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={busy === row.id || !onPrepare}
                      onClick={() => prepare(row)}
                    >
                      {busy === row.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                      Créer le lien
                    </Button>
                  )}
                </div>
              </div>

              {row.warning && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11.5px] leading-snug text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  {row.warning}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}