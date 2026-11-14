import { useEffect, useState } from 'react';
import { BadgeCheck, Loader2, Star } from 'lucide-react';
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
import { base44 } from '@/api/base44Client';
import { options, PARTNER_STATUS, SIRET_STATUS, WORK_TYPE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const EMPTY = {
  name: '',
  siret: '',
  city: '',
  postal_code: '',
  contact_name: '',
  email: '',
  phone: '',
  work_types: [],
  notes: '',
  status: 'a_verifier',
  google_rating: '',
  google_reviews_count: '',
  google_reviews_text: '',
};

export default function PartnerDialog({ open, onOpenChange, initial, onSubmit }) {
  const [values, setValues] = useState(EMPTY);
  const [legal, setLegal] = useState({ siret_status: 'non_verifie', google_status: 'non_verifie' });
  const [lookup, setLookup] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setValues({
        ...EMPTY,
        ...initial,
        work_types: initial.work_types || [],
        google_rating: initial.google_rating ?? '',
        google_reviews_count: initial.google_reviews_count ?? '',
        google_reviews_text: (initial.google_reviews || []).join('\n'),
      });
      setLegal({
        legal_name: initial.legal_name || '',
        legal_form: initial.legal_form || '',
        naf_code: initial.naf_code || '',
        siren: initial.siren || '',
        address: initial.address || '',
        siret_status: initial.siret_status || 'non_verifie',
        siret_checked_at: initial.siret_checked_at || '',
        google_status: initial.google_status || 'non_verifie',
        google_place_id: initial.google_place_id || '',
        validated_by: initial.validated_by || '',
        validated_at: initial.validated_at || '',
      });
    } else {
      setValues(EMPTY);
      setLegal({ siret_status: 'non_verifie', google_status: 'non_verifie' });
    }
    setLookup(null);
    setError('');
  }, [open, initial]);

  const update = (name, value) => setValues((previous) => ({ ...previous, [name]: value }));

  const verify = async () => {
    if (!values.siret.replace(/\D/g, '') && !values.name.trim()) {
      setError("Renseignez un SIRET ou le nom de l'entreprise avant de vérifier.");
      return;
    }
    setVerifying(true);
    setError('');
    setLookup(null);
    try {
      const response = await base44.functions.invoke('companyLookup', {
        siret: values.siret,
        name: values.name,
        postal_code: values.postal_code,
        city: values.city,
      });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      setLookup(data);
      if (data.company) {
        setValues((previous) => ({
          ...previous,
          name: previous.name || data.company.name,
          siret: data.company.siret || previous.siret,
          city: previous.city || data.company.city,
          postal_code: previous.postal_code || data.company.postal_code,
        }));
        setLegal((previous) => ({
          ...previous,
          legal_name: data.company.legal_name,
          legal_form: data.company.legal_form,
          naf_code: data.company.naf_code,
          siren: data.company.siren,
          address: data.company.address,
          siret_status: data.siret_status,
          siret_checked_at: data.checked_at,
        }));
      } else {
        setLegal((previous) => ({
          ...previous,
          siret_status: 'introuvable',
          siret_checked_at: data.checked_at,
        }));
      }
    } catch (verifyError) {
      setError(verifyError?.response?.data?.error || verifyError.message);
    } finally {
      setVerifying(false);
    }
  };

  const save = async () => {
    if (!values.name.trim()) {
      setError("Le nom de l'entreprise est obligatoire.");
      return;
    }
    setSaving(true);
    setError('');
    try {
      const reviews = values.google_reviews_text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const payload = {
        ...legal,
        name: values.name.trim(),
        siret: values.siret,
        city: values.city,
        postal_code: values.postal_code,
        contact_name: values.contact_name,
        email: values.email,
        phone: values.phone,
        work_types: values.work_types,
        notes: values.notes,
        status: values.status,
        google_rating: values.google_rating === '' ? undefined : Number(values.google_rating),
        google_reviews_count:
          values.google_reviews_count === '' ? undefined : Number(values.google_reviews_count),
        google_reviews: reviews,
        google_status: reviews.length > 0 || values.google_rating !== '' ? 'disponible' : 'indisponible',
      };
      await onSubmit(payload);
      onOpenChange(false);
    } catch (saveError) {
      setError(saveError?.response?.data?.error || saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto thin-scroll sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initial ? "Modifier l'entreprise" : 'Ajouter une entreprise'}
          </DialogTitle>
          <DialogDescription>
            Vérifiez le SIRET auprès de l’API officielle de l’État, puis validez l’entreprise manuellement pour
            pouvoir la solliciter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-foreground/80">Nom de l’entreprise *</Label>
              <Input
                value={values.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Toiture Rhône Étanchéité"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-foreground/80">SIRET</Label>
              <Input
                value={values.siret}
                onChange={(event) => update('siret', event.target.value)}
                placeholder="812 456 789 00021"
                className="font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full gap-1.5" onClick={verify} disabled={verifying}>
                {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                Vérifier le SIRET
              </Button>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-foreground/80">Ville</Label>
              <Input value={values.city} onChange={(event) => update('city', event.target.value)} placeholder="Lyon" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-foreground/80">Code postal</Label>
              <Input
                value={values.postal_code}
                onChange={(event) => update('postal_code', event.target.value)}
                placeholder="69007"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-foreground/80">Contact</Label>
              <Input
                value={values.contact_name}
                onChange={(event) => update('contact_name', event.target.value)}
                placeholder="Thomas Martin"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs text-foreground/80">Téléphone</Label>
              <Input
                value={values.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="04 78 00 11 22"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-foreground/80">E-mail</Label>
              <Input
                type="email"
                value={values.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="devis@toiture-rhone.fr"
              />
            </div>
          </div>

          {lookup && (
            <div
              className={cn(
                'rounded-xl px-3 py-2.5 text-[12px]',
                legal.siret_status === 'valide'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-amber-50 text-amber-800',
              )}
            >
              <p className="font-medium">{SIRET_STATUS[legal.siret_status] || 'Vérification terminée'}</p>
              {lookup.company ? (
                <p className="mt-0.5">
                  {lookup.company.legal_name}
                  {lookup.company.naf_code ? ` · NAF ${lookup.company.naf_code}` : ''}
                  {lookup.company.address ? ` · ${lookup.company.address}` : ''}
                </p>
              ) : (
                <p className="mt-0.5">Aucun établissement trouvé pour ce SIRET ou ce nom.</p>
              )}
              {lookup.google?.status === 'indisponible' && (
                <p className="mt-1 text-[11.5px] opacity-80">
                  Note et avis Google indisponibles automatiquement : vous pouvez les reporter à la main ci-dessous.
                </p>
              )}
            </div>
          )}

          <div>
            <Label className="mb-1.5 block text-xs text-foreground/80">Corps de métier</Label>
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-border p-2">
              {Object.entries(WORK_TYPE).map(([value, label]) => {
                const active = values.work_types.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      update(
                        'work_types',
                        active
                          ? values.work_types.filter((item) => item !== value)
                          : [...values.work_types, value],
                      )
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11.5px] transition-colors',
                      active
                        ? 'border-primary/40 bg-accent text-accent-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <p className="kicker !text-[9px]">Note et avis Google</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-[11.5px] text-foreground/70">Note (sur 5)</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={values.google_rating}
                  onChange={(event) => update('google_rating', event.target.value)}
                  placeholder="4.6"
                />
              </div>
              <div>
                <Label className="mb-1 block text-[11.5px] text-foreground/70">Nombre d’avis</Label>
                <Input
                  type="number"
                  min="0"
                  value={values.google_reviews_count}
                  onChange={(event) => update('google_reviews_count', event.target.value)}
                  placeholder="38"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-[11.5px] text-foreground/70">
                  Extraits d’avis (un par ligne)
                </Label>
                <Textarea
                  rows={3}
                  value={values.google_reviews_text}
                  onChange={(event) => update('google_reviews_text', event.target.value)}
                  placeholder="« Travaux propres et dans les délais » — mars 2026"
                />
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="h-3 w-3" />
              Ces informations sont reprises dans la comparaison des devis.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-foreground/80">Statut</Label>
              <Select value={values.status} onValueChange={(next) => update('status', next)}>
                <SelectTrigger>
                  <SelectValue placeholder="À vérifier" />
                </SelectTrigger>
                <SelectContent>
                  {options(PARTNER_STATUS).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                La validation reste humaine : choisissez « Validée » après vérification.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-foreground/80">Notes internes</Label>
              <Textarea
                rows={2}
                value={values.notes}
                onChange={(event) => update('notes', event.target.value)}
                placeholder="Entreprise recommandée par le conseil syndical…"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {initial ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}