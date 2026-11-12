import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StatusBadge from '@/components/StatusBadge';
import AttachmentList from '@/components/AttachmentList';
import { base44 } from '@/api/base44Client';
import { logAction, notify } from '@/lib/audit';
import { formatDate, relativeTime } from '@/lib/format';
import {
  ASSIGNEE_KIND,
  options,
  REQUESTER_KIND,
  TICKET_CATEGORY,
  TICKET_PRIORITY,
  TICKET_STATUS,
} from '@/lib/constants';

export default function TicketDetailDialog({ open, onOpenChange, ticket, providers = [], syndicId, onUpdated }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !ticket) return;
    setForm({
      status: ticket.status || 'nouveau',
      assignee_kind: ticket.assignee_kind || 'interne',
      provider_id: ticket.provider_id || '',
      assigned_name: ticket.assigned_name || '',
      due_date: ticket.due_date || '',
      resolution_note: ticket.resolution_note || '',
      intervention_date: '',
    });
    setError('');
  }, [open, ticket]);

  if (!ticket) return null;

  const update = (name, value) => setForm((previous) => ({ ...previous, [name]: value }));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const provider = providers.find((item) => item.id === form.provider_id);
      const closing = ['resolu', 'clos'].includes(form.status);

      await base44.entities.Ticket.update(ticket.id, {
        status: form.status,
        assignee_kind: form.assignee_kind,
        provider_id: form.provider_id,
        assigned_name: form.assigned_name || provider?.name || '',
        due_date: form.due_date,
        resolution_note: form.resolution_note,
        closed_date: closing ? new Date().toISOString().slice(0, 10) : ticket.closed_date || '',
      });

      if (form.intervention_date) {
        await base44.entities.Intervention.create({
          syndic_id: syndicId,
          building_id: ticket.building_id,
          building_name: ticket.building_name || '',
          ticket_id: ticket.id,
          title: `Intervention · ${ticket.title}`,
          description: ticket.description || '',
          kind: 'curative',
          status: 'planifiee',
          scheduled_date: form.intervention_date,
          provider_id: form.provider_id,
          provider_name: form.assigned_name || provider?.name || '',
        });
      }

      if (form.status !== ticket.status) {
        await logAction({
          syndicId,
          action: 'Changement de statut',
          entity: 'Ticket',
          entityLabel: ticket.title,
          details: `${TICKET_STATUS[ticket.status]} → ${TICKET_STATUS[form.status]}`,
        });
        if (ticket.requester_email) {
          await notify({
            syndicId,
            recipientEmail: ticket.requester_email,
            title: `Suivi de votre demande : ${ticket.title}`,
            message: `Votre demande est désormais « ${TICKET_STATUS[form.status]} ».`,
            kind: 'ticket',
            link: '/tickets',
          });
        }
      }

      await onUpdated();
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError?.message || "La mise à jour du ticket a échoué.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[660px]">
        <DialogHeader>
          <DialogTitle className="text-xl leading-snug">{ticket.title}</DialogTitle>
          <DialogDescription>
            {ticket.building_name || 'Immeuble non précisé'}
            {ticket.lot_number ? ` · Lot ${ticket.lot_number}` : ''} · créé {relativeTime(ticket.created_date)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge value={ticket.status} map={TICKET_STATUS} />
          <StatusBadge value={ticket.priority} map={TICKET_PRIORITY} />
          <StatusBadge value={ticket.category} map={TICKET_CATEGORY} tone="neutral" />
          {ticket.requester_kind && (
            <StatusBadge value={ticket.requester_kind} map={REQUESTER_KIND} tone="neutral" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-secondary/40 p-3 text-[12.5px] sm:grid-cols-4">
          <div>
            <p className="kicker !text-[9px]">Demandeur</p>
            <p className="mt-0.5 truncate">{ticket.requester_name || '—'}</p>
          </div>
          <div>
            <p className="kicker !text-[9px]">Email</p>
            <p className="mt-0.5 truncate">{ticket.requester_email || '—'}</p>
          </div>
          <div>
            <p className="kicker !text-[9px]">Affecté à</p>
            <p className="mt-0.5 truncate">{ticket.assigned_name || 'Non affecté'}</p>
          </div>
          <div>
            <p className="kicker !text-[9px]">Échéance</p>
            <p className="mt-0.5 truncate">{formatDate(ticket.due_date)}</p>
          </div>
        </div>

        {ticket.description && (
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">
            {ticket.description}
          </p>
        )}

        <div>
          <p className="kicker mb-1.5">Pièces jointes</p>
          <AttachmentList uris={ticket.attachments || []} />
        </div>

        <div className="space-y-3 border-t border-border/70 pt-4">
          <p className="kicker">Traitement de la demande</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Statut</Label>
              <Select value={form.status} onValueChange={(next) => update('status', next)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options(TICKET_STATUS).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type d’intervenant</Label>
              <Select value={form.assignee_kind} onValueChange={(next) => update('assignee_kind', next)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options(ASSIGNEE_KIND).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Technicien / prestataire</Label>
              <Select
                value={form.provider_id || ''}
                onValueChange={(next) => {
                  const provider = providers.find((item) => item.id === next);
                  setForm((previous) => ({
                    ...previous,
                    provider_id: next,
                    assigned_name: provider?.name || previous.assigned_name,
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Non affecté" /></SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assigned_name" className="text-xs">Nom affiché</Label>
              <Input
                id="assigned_name"
                value={form.assigned_name}
                onChange={(event) => update('assigned_name', event.target.value)}
                placeholder="Nom de l’intervenant"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date" className="text-xs">Échéance de traitement</Label>
              <Input id="due_date" type="date" value={form.due_date || ''} onChange={(event) => update('due_date', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="intervention_date" className="text-xs">Planifier une intervention</Label>
              <Input
                id="intervention_date"
                type="date"
                value={form.intervention_date || ''}
                onChange={(event) => update('intervention_date', event.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Crée une intervention à la date choisie.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resolution_note" className="text-xs">Compte rendu / résolution</Label>
            <Textarea
              id="resolution_note"
              rows={3}
              value={form.resolution_note}
              onChange={(event) => update('resolution_note', event.target.value)}
              placeholder="Travaux réalisés, pièces remplacées, suite à donner…"
            />
          </div>

          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer le traitement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}