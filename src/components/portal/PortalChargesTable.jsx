import { Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { formatDate, formatEUR } from '@/lib/format';
import { INVOICE_KIND, INVOICE_STATUS } from '@/lib/constants';
import { isSettled, paidOn } from '@/hooks/useResidentSpace';
import { downloadQuittancePdf } from '@/lib/quittancePdf';

export default function PortalChargesTable({ invoices = [], lots = [], buildings = [], payments = [] }) {
  if (!invoices.length) {
    return (
      <div className="rounded-[24px] border border-border bg-card">
        <EmptyState
          icon={Receipt}
          compact
          title="Aucun appel de fonds sur les 3 dernières années"
          description="Vos prochains avis d’échéance apparaîtront ici dès leur émission par le syndic."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <h2 className="text-[13px] font-medium text-foreground">Historique de mes appels de fonds</h2>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">3 ans</span>
      </div>
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full min-w-[560px] text-[12.5px]">
          <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border/70">
              <th className="px-4 py-2 text-left font-medium">Échéance</th>
              <th className="px-2 py-2 text-left font-medium">Immeuble / lot</th>
              <th className="px-2 py-2 text-right font-medium">Montant</th>
              <th className="px-2 py-2 text-left font-medium">Statut</th>
              <th className="px-4 py-2 text-right font-medium">Reçu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {invoices.map((invoice) => {
              const lot = lots.find(
                (row) => row.building_id === invoice.building_id && row.number === invoice.lot_number,
              );
              const building = buildings.find((row) => row.id === invoice.building_id);
              const settled = isSettled(invoice);
              return (
                <tr key={invoice.id} className="align-top">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-foreground">{invoice.period || '—'}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {INVOICE_KIND[invoice.kind] || 'Appel de fonds'} · {formatDate(invoice.due_date)}
                    </p>
                  </td>
                  <td className="px-2 py-2.5 text-foreground/75">
                    {building?.name || invoice.building_name || '—'}
                    {invoice.lot_number ? ` · ${invoice.lot_number}` : ''}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono tnum">
                    <p>{formatEUR(invoice.amount, 2)}</p>
                    {invoice.paid_amount > 0 && !settled && (
                      <p className="text-[11px] text-emerald-700">réglé {formatEUR(invoice.paid_amount, 2)}</p>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <StatusBadge value={invoice.status} map={INVOICE_STATUS} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {settled ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-[11.5px]"
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
                        Reçu
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}