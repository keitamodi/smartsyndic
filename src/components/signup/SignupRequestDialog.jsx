import { Building2, Loader2, Mail, MapPin, MessageSquareQuote, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/StatusBadge';
import { SIGNUP_REQUEST_STATUS, SIGNUP_REQUEST_TONE, SYNDIC_KIND } from '@/lib/constants';

const ACTIONS = [
  { value: 'contacte', label: 'Marquer contacté' },
  { value: 'qualifie', label: 'Qualifier' },
  { value: 'refuse', label: 'Refuser' },
];

export default function SignupRequestDialog({ request, open, onOpenChange, onStatusChange, saving, error }) {
  const current = request?.status || 'nouveau';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{request?.syndic_name}</DialogTitle>
          <DialogDescription>
            {SYNDIC_KIND[request?.syndic_kind] || 'Syndic'}
            {request?.buildings_count ? ` · ${request.buildings_count} immeuble(s)` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 px-3 py-2.5">
          <span className="kicker !text-[9px]">Statut de la demande</span>
          <StatusBadge
            value={current}
            label={SIGNUP_REQUEST_STATUS[current]}
            tone={SIGNUP_REQUEST_TONE[current]}
          />
        </div>

        <div className="space-y-2 text-[13px]">
          <p className="font-medium text-foreground">{request?.contact_name || 'Référent non renseigné'}</p>
          {request?.email && (
            <p className="flex items-center gap-2 text-foreground/75">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`mailto:${request.email}`} className="hover:text-primary">
                {request.email}
              </a>
            </p>
          )}
          {request?.phone && (
            <p className="flex items-center gap-2 text-foreground/75">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`tel:${request.phone}`} className="hover:text-primary">
                {request.phone}
              </a>
            </p>
          )}
          {request?.city && (
            <p className="flex items-center gap-2 text-foreground/75">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {request.city}
            </p>
          )}
          <p className="flex items-center gap-2 text-foreground/75">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            {request?.buildings_count ? `${request.buildings_count} immeuble(s) géré(s)` : 'Parc non précisé'}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3">
          <p className="kicker !text-[9px]">Besoin exprimé</p>
          <p className="mt-1.5 flex gap-2 text-[12.5px] leading-relaxed text-foreground/80">
            <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{request?.message || 'Aucun message complémentaire.'}</span>
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">{error}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <Button
              key={action.value}
              variant={action.value === current ? 'default' : 'outline'}
              className="gap-2 text-[12.5px]"
              disabled={saving || action.value === current}
              onClick={() => onStatusChange(action.value)}
            >
              {saving && action.value === current ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {action.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}