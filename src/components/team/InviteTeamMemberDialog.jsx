import { useEffect, useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import RolePicker from '@/components/team/RolePicker';
import { roleLabel } from '@/lib/teamRoles';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function InviteTeamMemberDialog({
  open,
  onOpenChange,
  member,
  buildings = [],
  defaultRole = 'gestionnaire',
  onSubmit,
}) {
  const editing = Boolean(member?.id);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(defaultRole);
  const [buildingIds, setBuildingIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(member?.full_name || '');
    setEmail(member?.email || '');
    setRole(member?.role || defaultRole);
    setBuildingIds(member?.building_ids || []);
    setNotes(member?.notes || '');
    setSendInvite(!member?.id);
    setBusy(false);
    setError('');
    setTouched(false);
  }, [open, member, defaultRole]);

  const nameError = touched && !fullName.trim() ? 'Indiquez le nom du collaborateur.' : '';
  const emailError = touched && !EMAIL_RE.test(email.trim()) ? 'Adresse email professionnelle invalide.' : '';

  const toggleBuilding = (id) => {
    setBuildingIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const submit = async () => {
    setTouched(true);
    if (!fullName.trim() || !EMAIL_RE.test(email.trim()) || busy) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(
        {
          full_name: fullName.trim(),
          email: email.trim(),
          role,
          building_ids: buildingIds,
          notes: notes.trim(),
        },
        { sendInvite: editing ? false : sendInvite },
      );
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError?.message || "L’enregistrement a échoué. Réessayez dans un instant.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto thin-scroll sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editing ? 'Modifier le collaborateur' : 'Inviter un collaborateur'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? 'Ajustez son rôle et son périmètre d’immeubles. L’email d’invitation n’est pas renvoyé automatiquement.'
              : 'Il reçoit un email d’invitation, puis active son accès en quelques minutes.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="member-name" className="text-[12px]">
                Nom complet <span className="text-primary">*</span>
              </Label>
              <Input
                id="member-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Camille Dubois"
                className="h-9 text-[12.5px]"
              />
              {nameError && <p className="text-[11px] text-destructive">{nameError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-email" className="text-[12px]">
                Email professionnel <span className="text-primary">*</span>
              </Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="camille@cabinet.fr"
                className="h-9 text-[12.5px]"
              />
              {emailError && <p className="text-[11px] text-destructive">{emailError}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px]">Rôle dans le cabinet</Label>
            <RolePicker value={role} onChange={setRole} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[12px]">Périmètre d’immeubles</Label>
              <span className="text-[10.5px] text-muted-foreground">
                {buildingIds.length === 0
                  ? 'Tous les immeubles'
                  : `${buildingIds.length} immeuble(s) sélectionné(s)`}
              </span>
            </div>
            {buildings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-[11.5px] leading-snug text-muted-foreground">
                Aucun immeuble enregistré pour l’instant : le collaborateur aura accès à tous les immeubles créés
                ensuite.
              </p>
            ) : (
              <div className="thin-scroll max-h-[168px] space-y-1 overflow-y-auto rounded-xl border border-border p-1.5">
                {buildings.map((building) => {
                  const checked = buildingIds.includes(building.id);
                  return (
                    <label
                      key={building.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors',
                        checked ? 'bg-accent/70' : 'hover:bg-secondary/60',
                      )}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleBuilding(building.id)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] text-foreground">{building.name}</span>
                        {(building.city || building.postal_code) && (
                          <span className="block truncate text-[10.5px] text-muted-foreground">
                            {[building.postal_code, building.city].filter(Boolean).join(' ')}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="member-notes" className="text-[12px]">
              Note interne <span className="font-normal text-muted-foreground">(optionnel)</span>
            </Label>
            <Textarea
              id="member-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex. reprend les copropriétés du secteur 3 à partir de janvier."
              className="resize-none text-[12.5px]"
            />
          </div>

          {!editing && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
              <Checkbox checked={sendInvite} onCheckedChange={(value) => setSendInvite(Boolean(value))} />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Envoyer l’invitation par email dès l’enregistrement
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  L’email part vers {email.trim() || 'l’adresse indiquée'} avec le rôle « {roleLabel(role)} ».
                </span>
              </span>
            </label>
          )}

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-[12px] text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Annuler
          </Button>
          <Button className="gap-2" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {editing ? 'Mettre à jour' : sendInvite ? 'Enregistrer et inviter' : 'Enregistrer le membre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}