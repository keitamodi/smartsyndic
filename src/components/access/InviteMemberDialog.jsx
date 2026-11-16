import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import InviteAccessCard from '@/components/access/InviteAccessCard';

const FREE = 'libre';

export default function InviteMemberDialog({
  open,
  onOpenChange,
  syndicId,
  people = [],
  defaultKind,
  memberType,
  initialPersonId = '',
  title,
  description,
  kindOptions = [],
}) {
  const [personId, setPersonId] = useState(FREE);
  const [freeName, setFreeName] = useState('');
  const [freeKind, setFreeKind] = useState(defaultKind);

  useEffect(() => {
    if (!open) return;
    setPersonId(initialPersonId || people[0]?.id || FREE);
    setFreeName('');
    setFreeKind(defaultKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPersonId]);

  const person = people.find((entry) => entry.id === personId) || null;
  const cardKey = person?.id || `libre-${freeKind}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {people.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[12px]">Destinataire</Label>
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue placeholder="Choisir une fiche" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </SelectItem>
                  ))}
                  <SelectItem value={FREE}>Nouveau contact (saisie libre)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!person && (
            <div className="space-y-1.5">
              <Label className="text-[12px]">Nom de la personne</Label>
              <Input
                value={freeName}
                onChange={(event) => setFreeName(event.target.value)}
                placeholder="Marie Lambert"
                className="h-9 text-[12.5px]"
              />
            </div>
          )}

          {!person && kindOptions.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-[12px]">Profil ouvert</Label>
              <Select value={freeKind} onValueChange={setFreeKind}>
                <SelectTrigger className="h-9 text-[12.5px]">
                  <SelectValue placeholder="Choisir un profil" />
                </SelectTrigger>
                <SelectContent>
                  {kindOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <InviteAccessCard
            key={cardKey}
            syndicId={syndicId}
            kind={person?.kind || freeKind}
            fullName={person?.label || freeName}
            email={person?.email}
            phone={person?.phone}
            memberId={person?.id}
            memberType={person?.memberType || memberType}
            buildingId={person?.buildingId}
            buildingName={person?.buildingName}
            lotNumbers={person?.lotNumbers}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}