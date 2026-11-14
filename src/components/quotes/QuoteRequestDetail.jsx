import { useState } from 'react';
import { CalendarDays, Mail, MapPin, Phone, Plus, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import FileLink from '@/components/quotes/FileLink';
import InviteDialog from '@/components/quotes/InviteDialog';
import OfferDialog from '@/components/quotes/OfferDialog';
import QuoteComparison from '@/components/quotes/QuoteComparison';
import { base44 } from '@/api/base44Client';
import { formatDate, formatEUR } from '@/lib/format';
import { buildQuoteMessage } from '@/lib/quoteMessage';
import {
  QUOTE_CHANNEL,
  QUOTE_INVITE_STATUS,
  QUOTE_REQUEST_STATUS,
  WORK_TYPE,
} from '@/lib/constants';

const TODAY = () => new Date().toISOString().slice(0, 10);

export default function QuoteRequestDetail({
  open,
  onOpenChange,
  request,
  invites = [],
  offers = [],
  companies = [],
  syndicId,
  onChanged,
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerSeed, setOfferSeed] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!request) return null;

  const locked = request.status === 'cloturee';
  const photos = request.photos || [];
  const message = buildQuoteMessage(request, '');

  const markContacted = async (invite) => {
    await base44.entities.QuoteInvite.update(invite.id, {
      status: 'envoyee',
      last_contact_at: TODAY(),
    });
    await onChanged();
  };

  const openOffer = (invite) => {
    setOfferSeed(invite ? { company_name: invite.company_name, received_channel: invite.channel, documents: [] } : null);
    setOfferOpen(true);
  };

  const saveOffer = async (values) => {
    const invite = invites.find((row) => row.company_name === values.company_name);
    const documents = Array.isArray(values.documents) ? values.documents : [];
    await base44.entities.QuoteOffer.create({
      syndic_id: syndicId,
      request_id: request.id,
      company_id: invite?.company_id || '',
      company_name: values.company_name,
      amount: Number(values.amount) || 0,
      duration_days: values.duration_days ? Number(values.duration_days) : undefined,
      validity_days: values.validity_days ? Number(values.validity_days) : undefined,
      conditions: values.conditions || '',
      received_channel: values.received_channel || 'email',
      file_uri: documents[0] || '',
      notes: values.notes || '',
      status: 'recu',
    });
    if (invite) {
      await base44.entities.QuoteInvite.update(invite.id, {
        status: 'repondue',
        last_contact_at: TODAY(),
      });
    }
    if (!locked) {
      await base44.entities.QuoteRequest.update(request.id, { status: 'reponses_recues' });
    }
    await onChanged();
  };

  const selectOffer = async (offer) => {
    setBusy(true);
    try {
      await base44.entities.QuoteOffer.update(offer.id, { status: 'retenu' });
      const others = offers.filter((row) => row.id !== offer.id && row.status === 'recu');
      if (others.length > 0) {
        await base44.entities.QuoteOffer.bulkUpdate(
          others.map((row) => ({ id: row.id, status: 'ecarte' })),
        );
      }
      await base44.entities.QuoteRequest.update(request.id, {
        status: 'cloturee',
        selected_offer_id: offer.id,
        selected_company_name: offer.company_name,
        selected_amount: offer.amount,
        decided_at: TODAY(),
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[920px]">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={request.status} map={QUOTE_REQUEST_STATUS} />
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {request.reference}
              </span>
            </div>
            <DialogTitle className="text-xl">{request.title}</DialogTitle>
            <DialogDescription>
              {WORK_TYPE[request.work_type] || 'Travaux'}
              {request.building_name ? ` · ${request.building_name}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <section className="space-y-3 rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">
                {request.description || 'Aucune description.'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {[request.postal_code, request.city].filter(Boolean).join(' ') || 'Localisation non précisée'}
                </span>
                {request.deadline ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Devis avant le {formatDate(request.deadline)}
                  </span>
                ) : null}
                {request.budget_max ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    Budget {formatEUR(request.budget_max)}
                  </span>
                ) : null}
              </div>
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {photos.map((uri, index) => (
                    <FileLink key={uri || index} uri={uri} label={`Photo ${index + 1}`} />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="kicker">Entreprises sollicitées ({invites.length})</p>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setInviteOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Solliciter
                </Button>
              </div>

              {invites.length === 0 && (
                <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-[12.5px] text-muted-foreground">
                  Aucune entreprise contactée. Choisissez des entreprises validées dans le répertoire.
                </p>
              )}

              <ul className="space-y-1.5">
                {invites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-foreground">{invite.company_name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {invite.channel === 'telephone' ? (
                            <Phone className="h-3 w-3" />
                          ) : (
                            <Mail className="h-3 w-3" />
                          )}
                          {QUOTE_CHANNEL[invite.channel] || invite.channel}
                        </span>
                        {invite.company_phone && <span>{invite.company_phone}</span>}
                        {invite.company_email && <span className="truncate">{invite.company_email}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {invite.company_email && (
                        <Button size="sm" variant="ghost" className="gap-1.5" asChild>
                          <a
                            href={`mailto:${invite.company_email}?subject=${encodeURIComponent(
                              message.subject,
                            )}&body=${encodeURIComponent(message.body)}`}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            E-mail
                          </a>
                        </Button>
                      )}
                      <StatusBadge value={invite.status} map={QUOTE_INVITE_STATUS} />
                      {invite.status === 'a_contacter' && (
                        <Button size="sm" variant="ghost" onClick={() => markContacted(invite)}>
                          Marquer contactée
                        </Button>
                      )}
                      {invite.status !== 'repondue' && (
                        <Button size="sm" variant="outline" onClick={() => openOffer(invite)}>
                          Saisir le devis
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="kicker">Devis reçus ({offers.length})</p>
                {invites.length > 0 && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openOffer(null)}>
                    <Plus className="h-3.5 w-3.5" />
                    Saisir un devis
                  </Button>
                )}
              </div>
              <QuoteComparison
                offers={offers}
                companies={companies}
                locked={locked}
                busy={busy}
                onSelect={selectOffer}
              />
            </section>

            {request.selected_offer_id && (
              <section className="rounded-2xl border border-primary/40 bg-accent/50 p-3.5">
                <p className="kicker !text-[9px]">Décision</p>
                <p className="mt-1 text-[13px] text-foreground">
                  Devis retenu : <span className="font-medium">{request.selected_company_name}</span> —{' '}
                  <span className="font-mono tnum">{formatEUR(request.selected_amount)}</span>
                </p>
                {request.decided_at && (
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    Décision enregistrée le {formatDate(request.decided_at)}
                  </p>
                )}
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        request={request}
        companies={companies}
        invites={invites}
        syndicId={syndicId}
        onDone={onChanged}
      />

      <OfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        invites={invites}
        initial={offerSeed}
        onSubmit={saveOffer}
      />
    </>
  );
}