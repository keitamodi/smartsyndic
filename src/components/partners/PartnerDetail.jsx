import { BadgeCheck, Mail, MapPin, Phone, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';
import { PARTNER_STATUS, SIRET_STATUS, WORK_TYPE } from '@/lib/constants';

export default function PartnerDetail({ open, onOpenChange, partner, onEdit, onValidate }) {
  if (!partner) return null;
  const reviews = partner.google_reviews || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={partner.status} map={PARTNER_STATUS} />
            <StatusBadge value={partner.siret_status} map={SIRET_STATUS} />
          </div>
          <DialogTitle className="text-xl">{partner.name}</DialogTitle>
          <DialogDescription>
            {(partner.work_types || []).map((type) => WORK_TYPE[type]).filter(Boolean).join(' · ') ||
              'Corps de métier non précisé'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-[13px]">
          {partner.legal_name && partner.legal_name !== partner.name && (
            <p className="text-foreground/75">Raison sociale : {partner.legal_name}</p>
          )}

          <div className="rounded-xl border border-border/80 bg-secondary/30 p-3">
            <p className="kicker !text-[9px]">Vérification SIRET</p>
            <p className="mt-1 flex items-center gap-1.5 font-mono text-[12px]">
              <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
              {partner.siret || 'Non renseigné'}
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {SIRET_STATUS[partner.siret_status] || 'SIRET non vérifié'}
              {partner.siret_checked_at ? ` · contrôlé le ${formatDate(partner.siret_checked_at)}` : ''}
              {partner.naf_code ? ` · NAF ${partner.naf_code}` : ''}
            </p>
          </div>

          {partner.address && (
            <p className="flex items-start gap-1.5 text-foreground/75">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {partner.address}
            </p>
          )}

          <div className="space-y-1">
            {partner.contact_name && <p className="font-medium">{partner.contact_name}</p>}
            {partner.email && (
              <p className="flex items-center gap-2 text-foreground/75">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`mailto:${partner.email}`} className="hover:text-primary">
                  {partner.email}
                </a>
              </p>
            )}
            {partner.phone && (
              <p className="flex items-center gap-2 text-foreground/75">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <a href={`tel:${partner.phone}`} className="hover:text-primary">
                  {partner.phone}
                </a>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/80 p-3">
            <p className="kicker !text-[9px]">Réputation Google</p>
            {partner.google_rating ? (
              <>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-[13px]">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {partner.google_rating.toFixed(1)} / 5
                  {partner.google_reviews_count ? (
                    <span className="font-body text-[11.5px] text-muted-foreground">
                      ({partner.google_reviews_count} avis)
                    </span>
                  ) : null}
                </p>
                {reviews.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {reviews.map((review, index) => (
                      <li
                        key={index}
                        className="rounded-lg bg-secondary/50 px-2 py-1.5 text-[11.5px] leading-snug text-foreground/75"
                      >
                        {review}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1.5 text-[10.5px] text-muted-foreground">
                  {partner.google_checked_at
                    ? `Relevé le ${formatDate(partner.google_checked_at)}`
                    : 'Note relevée sur Google par le gestionnaire'}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[12px] text-muted-foreground">
                Aucune note Google enregistrée. La récupération automatique n’est pas configurée : la note et les
                avis peuvent être saisis à la main dans la fiche.
              </p>
            )}
          </div>

          {partner.notes && <p className="text-[12.5px] text-foreground/75">{partner.notes}</p>}

          {partner.validated_at && (
            <p className="text-[11px] text-muted-foreground">
              Validée le {formatDate(partner.validated_at)}
              {partner.validated_by ? ` par ${partner.validated_by}` : ''}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button type="button" variant="outline" onClick={() => onEdit(partner)}>
            Modifier
          </Button>
          {partner.status !== 'valide' && (
            <Button type="button" onClick={() => onValidate(partner)} className="gap-1.5">
              <BadgeCheck className="h-4 w-4" />
              Valider
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}