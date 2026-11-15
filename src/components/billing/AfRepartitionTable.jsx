import { formatEUR, formatNumber } from '@/lib/format';

export default function AfRepartitionTable({ rows, tantiemesTotal, includeArrears }) {
  if (!rows.length) {
    return (
      <p className="rounded-lg bg-secondary/50 px-3 py-3 text-[12px] text-muted-foreground">
        Sélectionnez un immeuble dont les lots ont des tantièmes et saisissez le montant global à appeler.
      </p>
    );
  }

  const totalAppel = rows.reduce((sum, row) => sum + row.amount, 0);
  const totalArrears = rows.reduce((sum, row) => sum + row.arrears, 0);

  return (
    <div className="max-h-60 overflow-y-auto thin-scroll rounded-xl border border-border/70">
      <table className="w-full text-[12px]">
        <thead className="sticky top-0 bg-card text-[10px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Lot</th>
            <th className="px-3 py-1.5 text-right font-medium">Tantièmes</th>
            <th className="px-3 py-1.5 text-right font-medium">Appel</th>
            {includeArrears && <th className="px-3 py-1.5 text-right font-medium">Arriérés</th>}
            <th className="px-3 py-1.5 text-right font-medium">Total dû</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map(({ lot, share, amount, arrears, total }) => (
            <tr key={lot.id}>
              <td className="px-3 py-1.5">
                <span className="font-medium text-foreground">{lot.number}</span>
                <span className="ml-1.5 text-[11px] text-muted-foreground">{lot.owner_name || '—'}</span>
                {!lot.owner_email && <span className="ml-1 text-[10px] text-rose-600">sans email</span>}
              </td>
              <td className="px-3 py-1.5 text-right font-mono tnum">
                {formatNumber(lot.tantiemes, 0)}
                <span className="ml-1 text-[10px] text-muted-foreground">{formatNumber(share * 100, 2)} %</span>
              </td>
              <td className="px-3 py-1.5 text-right font-mono tnum">{formatEUR(amount, 2)}</td>
              {includeArrears && (
                <td className="px-3 py-1.5 text-right font-mono tnum text-rose-700">
                  {arrears > 0 ? formatEUR(arrears, 2) : '—'}
                </td>
              )}
              <td className="px-3 py-1.5 text-right font-mono tnum font-medium">{formatEUR(total, 2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-border bg-secondary/40">
          <tr>
            <td className="px-3 py-1.5 font-medium" colSpan={2}>
              Total · {formatNumber(tantiemesTotal, 0)} tantièmes
            </td>
            <td className="px-3 py-1.5 text-right font-mono tnum">{formatEUR(totalAppel, 2)}</td>
            {includeArrears && (
              <td className="px-3 py-1.5 text-right font-mono tnum">{formatEUR(totalArrears, 2)}</td>
            )}
            <td className="px-3 py-1.5 text-right font-mono tnum">{formatEUR(totalAppel + totalArrears, 2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}