import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ContactActions from '@/components/messaging/ContactActions';

export default function NewThreadDialog({ open, onOpenChange, contacts, onCreate }) {
  const [contactId, setContactId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const groups = useMemo(() => {
    const map = new Map();
    contacts.forEach((contact) => {
      if (!map.has(contact.group)) map.set(contact.group, []);
      map.get(contact.group).push(contact);
    });
    return Array.from(map.entries());
  }, [contacts]);

  useEffect(() => {
    if (!open) {
      setContactId('');
      setSubject('');
      setMessage('');
      setError('');
      setSaving(false);
    }
  }, [open]);

  const selectedContact = contacts.find((item) => item.id === contactId) || null;

  const submit = async () => {
    const contact = contacts.find((item) => item.id === contactId);
    if (!contact) {
      setError('Sélectionnez un destinataire.');
      return;
    }
    if (!subject.trim()) {
      setError('Renseignez l’objet de la conversation.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onCreate({ contact, subject: subject.trim(), message: message.trim() });
      onOpenChange(false);
    } catch (createError) {
      setError(createError?.message || 'Création impossible pour le moment.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-[17px]">Nouvelle conversation</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Écrivez à un copropriétaire, un propriétaire, un technicien, un prestataire ou un membre de l’équipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[12px]">Destinataire</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="text-[12.5px]">
                <SelectValue placeholder="Choisir un contact" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(([group, items]) => (
                  <div key={group}>
                    <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {group}
                    </p>
                    {items.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id} className="text-[12.5px]">
                        {contact.name}
                        {contact.building_name ? ` — ${contact.building_name}` : ''}
                      </SelectItem>
                    ))}
                  </div>
                ))}
                {contacts.length === 0 && (
                  <p className="px-2 py-2 text-[12px] text-muted-foreground">Aucun contact disponible.</p>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedContact && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2">
              <div className="min-w-0 space-y-0.5 text-[11.5px] text-muted-foreground">
                {selectedContact.phone && <p className="truncate">Tél. {selectedContact.phone}</p>}
                {selectedContact.email && <p className="truncate">{selectedContact.email}</p>}
                {!selectedContact.phone && !selectedContact.email && (
                  <p className="text-[11px]">Aucune coordonnée enregistrée pour ce contact.</p>
                )}
              </div>
              <ContactActions
                email={selectedContact.email}
                phone={selectedContact.phone}
                name={selectedContact.name}
                subject={`SyndicVibe — ${subject || 'Votre copropriété'}`}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[12px]">Objet</Label>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Ex. Travaux de ravalement — échéancier des appels de fonds"
              className="text-[12.5px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Premier message (optionnel)</Label>
            <Textarea
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Rédigez votre message…"
              className="resize-none text-[12.5px]"
            />
          </div>

          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Ouvrir la conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}