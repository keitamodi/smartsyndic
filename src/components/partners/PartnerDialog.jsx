import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Loader2 } from 'lucide-react';
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
import PartnerGoogleReviews from '@/components/partners/PartnerGoogleReviews';

const EMPTY_LEGAL = {
  legal_name: '',
  legal_form: '',
  legal_form_label: '',
  naf_code: '',
  naf_label: '',
  siren: '',
  address: '',
  website: '',
  employees: '',
  company_created_at: '',
  dirigeants: [],
  siret_status: 'non_verifie',
  siret_checked_at: '',
  google_status: 'non_verifie',
  google_place_id: '',
  google_checked_at: '',
  validated_by: '',
  validated_at: '',
};

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

export default function PartnerDialog({ open, onOpenChange, initial: incoming, prefill, onSubmit }) {
  const initial = prefill || incoming;
  const [values, setValues] = useState(EMPTY);
  const [legal, setLegal] = useState(EMPTY_LEGAL);
  const [contact, setContact] = useState(null);
  const [lookup, setLookup] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsNote, setReviewsNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const checkedSiret = useRef('');

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
        ...EMPTY_LEGAL,
        legal_name: initial.legal_name || '',
        legal_form: initial.legal_form || '',
        legal_form_label: initial.legal_form_label || '',
        naf_code: initial.naf_code || '',
        naf_label: initial.naf_label || '',
        siren: initial.siren || '',
        address: initial.address || '',
        website: initial.website || '',
        employees: initial.employees || '',
        company_created_at: initial.company_created_at || '',
        dirigeants: initial.dirigeants || [],
        siret_status: initial.siret_status || 'non_verifie',
        siret_checked_at: initial.siret_checked_at || '',
        google_status: initial.google_status || 'non_verifie',
        google_place_id: initial.google_place_id || '',
        google_checked_at: initial.google_checked_at || '',
        validated_by: initial.validated_by || '',
        validated_at: initial.validated_at || '',
      });
    } else {
      setValues(EMPTY);
      setLegal(EMPTY_LEGAL);
    }
    setLookup(null);
    setContact(null);
    setReviewsNote('');
    checkedSiret.current = prefill ? '' : (incoming?.siret || '').replace(/\D/g, '');
    setError('');
  }, [open, incoming, prefill]);

  const update = (name, value) => setValues((previous) => ({ ...previous, [name]: value }));

  // Reporte la note et les avis Google renvoyés par la fiche Google de l'entreprise.
  const applyGoogle = (google, checkedAt) => {
    const reviews = Array.isArray(google?.reviews) ? google.reviews : [];
    const hasRating = typeof google?.rating === 'number';
    const hasCount = typeof google?.reviews_count === 'number';
    if (!google || google.status !== 'disponible') return false;
    if (!hasRating && !hasCount && reviews.length === 0) return false;
    setValues((previous) => ({
      ...previous,
      google_rating: google.rating ?? previous.google_rating,
      google_reviews_count: google.reviews_count ?? previous.google_reviews_count,
      google_reviews_text: reviews.length > 0 ? reviews.join('\n') : previous.google_reviews_text,
    }));
    setLegal((previous) => ({
      ...previous,
      google_status: 'disponible',
      google_place_id: google.place_id || previous.google_place_id,
      google_checked_at: checkedAt || previous.google_checked_at,
    }));
    setReviewsNote(
      reviews.length > 0
        ? `${reviews.length} avis récupérés sur Google${checkedAt ? ` le ${checkedAt}` : ''}.`
        : 'Note et nombre d’avis récupérés sur Google. Les avis s’ouvrent sur Google Maps.',
    );
    return true;
  };

  const fetchReviews = async () => {
    if (!values.name.trim()) {
      setError("Renseignez le nom de l'entreprise avant de chercher ses avis Google.");
      return;
    }
    setReviewsLoading(true);
    setReviewsNote('');
    setError('');
    try {
      const response = await base44.functions.invoke('companyLookup', {
        name: values.name,
        city: values.city,
        postal_code: values.postal_code,
        address: legal.address,
        reviews_only: true,
      });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      if (!applyGoogle(data.google, data.checked_at)) {
        setReviewsNote('Aucun avis Google trouvé pour cette entreprise.');
      }
    } catch (lookupError) {
      setError(lookupError?.response?.data?.error || lookupError.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  const verify = async (rawSiret) => {
    const targetSiret = String(rawSiret ?? values.siret);
    if (!targetSiret.replace(/\D/g, '') && !values.name.trim()) {
      setError("Renseignez un SIRET ou le nom de l'entreprise avant de vérifier.");
      return;
    }
    checkedSiret.current = targetSiret.replace(/\D/g, '');
    setVerifying(true);
    setError('');
    setLookup(null);
    setContact(null);
    try {
      const response = await base44.functions.invoke('companyLookup', {
        siret: targetSiret,
        name: values.name,
        postal_code: values.postal_code,
        city: values.city,
      });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      setLookup(data);
      if (data.company) {
        const company = data.company;
        const found = data.contact || null;
        setContact(found);
        setValues((previous) => ({
          ...previous,
          name: previous.name.trim() ? previous.name : company.name,
          siret: company.siret || previous.siret,
          city: previous.city || company.city,
          postal_code: previous.postal_code || company.postal_code,
          contact_name: previous.contact_name || company.contact_name || '',
          phone: previous.phone || found?.phone || '',
          email: previous.email || found?.email || '',
          work_types:
            previous.work_types.length > 0 ? previous.work_types : company.work_types || [],
        }));
        setLegal((previous) => ({
          ...previous,
          legal_name: company.legal_name,
          legal_form: company.legal_form,
          legal_form_label: company.legal_form_label,
          naf_code: company.naf_code,
          naf_label: company.naf_label,
          siren: company.siren,
          address: company.address,
          employees: company.employees,
          company_created_at: company.created_at,
          dirigeants: company.dirigeants || [],
          website: previous.website || found?.website || '',
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
      applyGoogle(data.google, data.checked_at);
    } catch (verifyError) {
      setError(verifyError?.response?.data?.error || verifyError.message);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const siretDigits = values.siret.replace(/\D/g, '');
    if (siretDigits.length !== 14 || siretDigits === checkedSiret.current) return undefined;
    const timer = setTimeout(() => verify(siretDigits), 700);
    return () => clearTimeout(timer);
  }, [values.siret]);

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
            {incoming ? "Modifier l'entreprise" : 'Ajouter une entreprise'}
          </DialogTitle>
          <DialogDescription>
            Saisissez le SIRET : la fiche se complète automatiquement avec les données officielles de l’État,
            puis validez l’entreprise manuellement pour pouvoir la solliciter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {verifying && (
            <p className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-[12px] text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Recherche de l’entreprise et de ses coordonnées…
            </p>
          )}
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
              <Button
                type="button"
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => verify()}
                disabled={verifying}
              >
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
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-foreground/80">Adresse</Label>
              <Input
                value={legal.address}
                onChange={(event) =>
                  setLegal((previous) => ({ ...previous, address: event.target.value }))
                }
                placeholder="12 rue de la République"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs text-foreground/80">Site web</Label>
              <Input
                value={legal.website}
                onChange={(event) =>
                  setLegal((previous) => ({ ...previous, website: event.target.value }))
                }
                placeholder="https://www.toiture-rhone.fr"
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
                <div className="mt-0.5 space-y-0.5">
                  <p>{lookup.company.legal_name}</p>
                  <p className="text-[11.5px] opacity-90">
                    {[
                      lookup.company.legal_form_label || lookup.company.legal_form,
                      lookup.company.naf_label ||
                        (lookup.company.naf_code ? `NAF ${lookup.company.naf_code}` : ''),
                      lookup.company.employees,
                      lookup.company.address,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {lookup.company.dirigeants?.length > 0 && (
                    <p className="text-[11.5px] opacity-90">
                      Dirigeant(s) : {lookup.company.dirigeants.join(', ')}
                    </p>
                  )}
                  {lookup.company.created_at && (
                    <p className="text-[11px] opacity-80">
                      Établissement créé le {lookup.company.created_at}
                    </p>
                  )}
                  {contact ? (
                    <p className="mt-1 text-[11.5px]">
                      Téléphone, e-mail et site trouvés sur le web
                      {contact.source ? ` (${contact.source})` : ''} : à vérifier avant de solliciter
                      l’entreprise.
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] opacity-80">
                      Aucune coordonnée publiée trouvée : complétez le téléphone et l’e-mail à la main.
                    </p>
                  )}
                  {legal.website && (
                    <a
                      href={legal.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block break-all text-[11.5px] underline underline-offset-2"
                    >
                      {legal.website}
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-0.5">Aucun établissement trouvé pour ce SIRET ou ce nom.</p>
              )}
              {lookup.google?.status === 'indisponible' && (
                <p className="mt-1 text-[11.5px] opacity-80">
                  Aucune fiche Google trouvée pour cette entreprise : saisissez la note et les avis à la main ci-dessous.
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

          <PartnerGoogleReviews
            rating={values.google_rating}
            count={values.google_reviews_count}
            reviewsText={values.google_reviews_text}
            status={legal.google_status}
            note={reviewsNote}
            placeId={legal.google_place_id}
            loading={reviewsLoading}
            onChange={update}
            onFetch={fetchReviews}
          />

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
            {incoming ? 'Mettre à jour' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}