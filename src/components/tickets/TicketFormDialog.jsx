import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FileField from '@/components/FileField';
import { base44 } from '@/api/base44Client';
import { logAction, notify } from '@/lib/audit';
import { options, REQUESTER_KIND, TICKET_CATEGORY, TICKET_PRIORITY } from '@/lib/constants';

const EMPTY = {
  title: '',
  description: '',
  building_id: '',
  lot_number: '',
  category: 'plomberie',
  priority: 'normale',
  requester_name: '',
  requester_email: '',
  requester_kind: 'coproprietaire',
  attachments: [],
};

export default function TicketFormDialog({ open, onOpenChange, ticket, buildings, syndicId, onSaved }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({ ...EMPTY, ...(ticket || {}), attachments: ticket?.attachments || [] });
    setError('');
  }, [open, ticket]);

  const update = (name, value) => setValues((previous) => ({ ...previous, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!values.title.trim()) {
      setError('Le titre de la demande est obligatoire.');
      return;
    }
    if (!values.building_id) {
      setError('Sélectionnez l’immeuble concerné.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const building = buildings.find((item) => item.id === values.building_id);
      const payload = {
        title: values.title.trim(),
        description: values.description || '',
        building_id: values.building_id,
        building_name: building?.name || '',
        lot_number: values.lot_number || '',
        category: values.category,
        priority: values.priority,
        requester_name: values.requester_name || '',
        requester_email: values.requester_email || '',
        requester_kind: values.requester_kind,
        attachments: values.attachments || [],
      };

      if (ticket?.id) {
        await base44.entities.Ticket.update(ticket.id, payload);
        await logAction({ syndicId, action: 'Mise à jour', entity: 'Ticket', entityLabel: payload.title });
      } else {
        await base44.entities.Ticket.create({ ...payload, syndic_id: syndicId, status: 'nouveau' });
        await logAction({ syndicId, action: 'Création', entity: 'Ticket', entityLabel: payload.title });
        if (payload.requester_email) {
          await notify({
            syndicId,
            recipientEmail: payload.requester_email,
            title: `Demande enregistrée : ${payload.title}`,
            message: 'Votre demande a bien été transmise au syndic. Vous serez informé de son avancement.',
            kind: 'ticket',
            link: '/tickets',
          });
        }
      }
      onSaved();
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError?.message || "L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{ticket?.id ? 'Modifier la demande' : 'Nouvelle demande'}</DialogTitle>
          <DialogDescription>
            Enregistrez une demande ou une réclamation d’un résident. Les notifications restent internes à la plateforme.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">Objet de la demande *</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="Fuite d'eau dans la cave"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Immeuble *</Label>
              <Select value={values.building_id || ''} onValueChange={(next) => update('building_id', next)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un immeuble" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lot_number" className="text-xs">Lot concerné</Label>
              <Input
                id="lot_number"
                value={values.lot_number}
                onChange={(event) => update('lot_number', event.target.value)}
                placeholder="A12"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Catégorie</Label>
              <Select value={values.category} onValueChange={(next) => update('category', next)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options(TICKET_CATEGORY).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priorité</Label>
              <Select value={values.priority} onValueChange={(next) => update('priority', next)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options(TICKET_PRIORITY).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requester_name" className="text-xs">Demandeur</Label>
              <Input
                id="requester_name"
                value={values.requester_name}
                onChange={(event) => update('requester_name', event.target.value)}
                placeholder="Marie Lambert"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requester_email" className="text-xs">Email du demandeur</Label>
              <Input
                id="requester_email"
                type="email"
                value={values.requester_email}
                onChange={(event) => update('requester_email', event.target.value)}
                placeholder="marie.lambert@email.fr"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Profil du demandeur</Label>
              <Select value={values.requester_kind} onValueChange={(next) => update('requester_kind', next)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options(REQUESTER_KIND).map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={values.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Décrivez le problème, sa localisation et les éventuels désordres constatés."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Pièces jointes</Label>
            <FileField values={values.attachments} onChange={(next) => update('attachments', next)} hint="Photos ou documents utiles (stockage privé)" />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {ticket?.id ? 'Mettre à jour' : 'Enregistrer la demande'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}