import { Landmark } from 'lucide-react';
import { formatEUR, formatNumber } from '@/lib/format';
import { formatShare } from '@/lib/quittancePdf';

export default function FondsTravauxPanel({ fonds = [] }) {
  const latestYear = fonds.length ? Math.max(...fonds.map((row) => row.year)) : null;
  const annual = fonds.filter((row) => row.year === latestYear).reduce((sum, row) => sum + row.amount, 0);
  const cumulative = fonds.reduce((sum, row) => sum + row.amount, 0);

  return (
    <section className="rounded-[24px] border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="kicker">Fonds de travaux</p>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
            Quote-part calculée sur 5 % du budget prévisionnel voté en AG.
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Landmark className="h-4 w-4" strokeWidth={1.8} />
        </span>
      </div>

      {!fonds.length ? (
        <p className="mt-4 rounded-xl bg-secondary/50 px-3 py-3 text-[12px] text-muted-foreground">
          Aucun budget prévisionnel voté n’est encore enregistré pour vos immeubles.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-3">
            <div>
              <p className="kicker !text-[9px]">Cotisation {latestYear}</p>
              <p className="mt-1 font-mono text-[19px] leading-none tnum">{formatEUR(annual, 2)}</p>
            </div>
            <div className="text-right">
              <p className="kicker !text-[9px]">Cumul</p>
              <p className="mt-1 font-mono text-[13px] leading-none text-muted-foreground tnum">
                {formatEUR(cumulative, 0)}
              </p>
            </div>
          </div>

          <ul className="mt-3 divide-y divide-border/60">
            {fonds.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2 py-2 text-[12px]">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {row.year} · {row.building.name}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">
                    budget {formatEUR(row.budget, 0)} · {formatShare(row.share)} des tantièmes
                  </p>
                </div>
                <span className="shrink-0 font-mono tnum">{formatEUR(row.amount, 2)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10.5px] text-muted-foreground">
            {formatNumber(fonds.length)} exercice(s) pris en compte.
          </p>
        </>
      )}
    </section>
  );
}