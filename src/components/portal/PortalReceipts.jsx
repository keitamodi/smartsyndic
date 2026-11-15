import { Download, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatEUR } from '@/lib/format';
import { isSettled, paidOn } from '@/hooks/useResidentSpace';
import { downloadQuittancePdf } from '@/lib/quittancePdf';

export default function PortalReceipts({ invoices = [], lots = [], buildings = [], payments = [] }) {
  const settled = invoices.filter(isSettled);
  if (!settled.length) return null;

  return (
    <section className="rounded-[24px] border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-foreground">Mes reçus libératoires</h2>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          {settled.length} disponible(s)
        </span>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {settled.map((invoice) => {
          const lot = lots.find(
            (row) => row.building_id === invoice.building_id && row.number === invoice.lot_number,
          );
          const building = buildings.find((row) => row.id === invoice.building_id);
          return (
            <li
              key={invoice.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-foreground">
                  {invoice.period || 'Appel de fonds'} · Lot {invoice.lot_number || '—'}
                </p>
                <p className="text-[10.5px] text-muted-foreground">
                  réglé le {formatDate(paidOn(invoice, payments))} · {formatEUR(invoice.paid_amount || invoice.amount, 2)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 gap-1 text-[11.5px]"
                onClick={() =>
                  downloadQuittancePdf({
                    invoice,
                    building,
                    lot,
                    paidDate: paidOn(invoice, payments),
                  })
                }
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex items-center gap-1 text-[10.5px] text-muted-foreground">
        <FileCheck2 className="h-3 w-3" />
        Chaque reçu atteste du règlement intégral de l’échéance.
      </p>
    </section>
  );
}