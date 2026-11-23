import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { TICKET_PRIORITY, options } from '@/lib/constants';

export default function PortalReportDialog({ open, onOpenChange, lots = [], buildings = [] }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ lotId: '', title: '', description: '', priority: 'normale' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const lotId = form.lotId || lots[0]?.id || '';
  const lot = lots.find((row) => row.id === lotId);
  const building = buildings.find((row) => row.id === lot?.building_id);

  const reset = () => {
    setForm({ lotId: '', title: '', description: '', priority: 'normale' });
    setError('');
    setDone(false);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setError('Précisez l’objet de votre signalement.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await base44.entities.Ticket.create({
        syndic_id: building?.syndic_id || '',
        building_id: lot?.building_id || '',
        building_name: building?.name || lot?.buildingName || '',
        lot_number: lot?.number || '',
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: 'nouveau',
        requester_name: user?.full_name || '',
        requester_email: user?.email || '',
        requester_kind: 'coproprietaire',
      });
      setForm({ lotId, title: '', description: '', priority: 'normale' });
      setDone(true);
      // Alerte email du gestionnaire, sans bloquer la confirmation affichée au résident.
      if (created?.id) {
        base44.functions.invoke('notifyNewTicket', { ticket_id: created.id }).catch(() => {});
      }
    } catch (failure) {
      setError(failure?.message || 'Votre signalement n’a pas pu être envoyé.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Signaler un incident</DialogTitle>
          <DialogDescription>
            Votre demande arrive directement chez le gestionnaire de votre immeuble et vous pouvez suivre son traitement.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Votre signalement a bien été transmis au syndic.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={reset}>Nouveau signalement</Button>
              <Button onClick={() => { reset(); onOpenChange(false); }}>Fermer</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {lots.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Lot concerné</Label>
                <Select value={lotId} onValueChange={(value) => setForm((prev) => ({ ...prev, lotId: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {lots.map((row) => (
                      <SelectItem key={row.id} value={row.id}>
                        {row.buildingName || 'Immeuble'} · lot {row.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ticket-title" className="text-xs">Objet</Label>
              <Input
                id="ticket-title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Fuite sous l’évier de la cuisine"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-description" className="text-xs">Détail</Label>
              <Textarea
                id="ticket-description"
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Depuis quand, où exactement, ce que vous avez déjà constaté…"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Urgence</Label>
              <Select value={form.priority} onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options(TICKET_PRIORITY).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button onClick={submit} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Envoyer au syndic
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}