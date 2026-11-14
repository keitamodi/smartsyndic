import { useState } from 'react';
import { Loader2, Mail, Phone, Search, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { WORK_TYPE } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function InviteDialog({ open, onOpenChange, request, companies = [], invites = [], syndicId, onDone }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const invitedIds = invites.map((invite) => invite.company_id);
  const available = companies.filter(
    (company) => company.status === 'valide' && !invitedIds.includes(company.id),
  );
  const rows = available.filter((company) =>
    `${company.name} ${company.city} ${company.postal_code} ${(company.work_types || []).join(' ')}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const toggle = (id) =>
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );

  const submit = async () => {
    const chosen = available.filter((company) => selected.includes(company.id));
    if (chosen.length === 0) {
      setError('Sélectionnez au moins une entreprise.');
      return;
    }
    setSending(true);
    setError('');
    setNotice('');
    try {
      const created = await base44.entities.QuoteInvite.bulkCreate(
        chosen.map((company) => ({
          syndic_id: syndicId,
          request_id: request.id,
          company_id: company.id,
          company_name: company.name,
          company_email: company.email || '',
          company_phone: company.phone || '',
          channel: company.email ? 'email' : 'telephone',
          status: 'a_contacter',
        })),
      );
      const rowsCreated = Array.isArray(created) ? created : created?.items || [];
      const ids = rowsCreated.map((row) => row.id).filter(Boolean);

      let pending = 0;
      if (ids.length > 0) {
        const response = await base44.functions.invoke('sendQuoteRequest', {
          request_id: request.id,
          invite_ids: ids,
        });
        const results = response?.data?.results || [];
        pending = results.filter((row) => row.status !== 'envoye').length;
      }

      setSelected([]);
      await onDone();

      if (pending > 0) {
        setNotice(
          `${ids.length - pending} demande(s) envoyée(s) par e-mail. ${pending} entreprise(s) restent « à contacter » : l'envoi automatique n'a pas abouti (adresse non joignable), contactez-les par téléphone puis saisissez leur devis.`,
        );
        return;
      }

      onOpenChange(false);
    } catch (inviteError) {
      setError(
        inviteError?.response?.data?.error ||
          inviteError?.message ||
          "L'envoi de la demande a échoué. Veuillez réessayer.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Solliciter des entreprises</DialogTitle>
          <DialogDescription>
            Seules les entreprises validées apparaissent ici. La demande part par e-mail ; les entreprises sans
            adresse e-mail sont marquées « à contacter par téléphone ».
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une entreprise, une ville, un corps de métier…"
            className="h-9 pl-9 text-[13px]"
          />
        </div>

        <div className="max-h-[280px] space-y-1.5 overflow-y-auto thin-scroll">
          {rows.length === 0 && (
            <p className="rounded-xl bg-secondary/60 px-3 py-6 text-center text-[12.5px] text-muted-foreground">
              Aucune entreprise validée disponible. Validez une entreprise dans le répertoire pour la solliciter.
            </p>
          )}
          {rows.map((company) => {
            const active = selected.includes(company.id);
            return (
              <button
                key={company.id}
                type="button"
                onClick={() => toggle(company.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
                  active ? 'border-primary/50 bg-accent/60' : 'border-border/80 hover:bg-secondary/50',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    active ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                  )}
                >
                  {active && <span className="text-[10px] leading-none">✓</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-foreground">{company.name}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                    {(company.work_types || []).map((type) => WORK_TYPE[type]).filter(Boolean).join(' · ') ||
                      'Corps de métier non précisé'}
                    {' · '}
                    {[company.postal_code, company.city].filter(Boolean).join(' ')}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                  {company.google_rating ? (
                    <span className="inline-flex items-center gap-0.5 font-mono">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {company.google_rating.toFixed(1)}
                    </span>
                  ) : null}
                  {company.email ? <Mail className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                </span>
              </button>
            );
          })}
        </div>

        {notice && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-800">
            {notice}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2 pt-2">
          {notice ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={submit} disabled={sending} className="gap-2">
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                Envoyer la demande ({selected.length})
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}