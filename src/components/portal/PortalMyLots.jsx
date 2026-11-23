import { Building2, Mail, MapPin, Phone } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { LOT_KIND, LOT_OCCUPANCY } from '@/lib/constants';

const lotDetails = (lot) =>
  [
    LOT_KIND[lot.kind],
    lot.floor ? `étage ${lot.floor}` : null,
    lot.area ? `${formatNumber(lot.area)} m²` : null,
    LOT_OCCUPANCY[lot.occupancy],
  ]
    .filter(Boolean)
    .join(' · ');

export default function PortalMyLots({ lots = [], buildings = [], syndic }) {
  return (
    <section className="rounded-[24px] border border-border bg-card p-4">
      <p className="kicker">Ma copropriété</p>

      <ul className="mt-3 space-y-2">
        {lots.map((lot) => {
          const building = buildings.find((row) => row.id === lot.building_id);
          const address = [building?.address, building?.postal_code, building?.city].filter(Boolean).join(' ');
          return (
            <li key={lot.id} className="rounded-xl border border-border/70 px-3 py-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Building2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-foreground">
                    {building?.name || 'Immeuble'} · lot {lot.number}
                  </p>
                  {lotDetails(lot) && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{lotDetails(lot)}</p>
                  )}
                  {lot.tantiemes ? (
                    <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
                      {formatNumber(lot.tantiemes)} tantièmes
                    </p>
                  ) : null}
                </div>
              </div>
              {address && (
                <p className="mt-1.5 flex items-start gap-1 text-[10.5px] leading-snug text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  {address}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {syndic && (
        <div className="mt-3 rounded-xl bg-secondary/50 px-3 py-2.5">
          <p className="kicker !text-[9px]">Votre syndic</p>
          <p className="mt-1 text-[12.5px] font-medium text-foreground">{syndic.name}</p>
          <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
            {syndic.email && (
              <a href={`mailto:${syndic.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{syndic.email}</span>
              </a>
            )}
            {syndic.phone && (
              <a
                href={`tel:${String(syndic.phone).replace(/\s/g, '')}`}
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Phone className="h-3 w-3 shrink-0" />
                {syndic.phone}
              </a>
            )}
            {(syndic.address || syndic.city) && (
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{[syndic.address, syndic.postal_code, syndic.city].filter(Boolean).join(' ')}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}