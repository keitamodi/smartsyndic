import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
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
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import GoogleAuthButton from '@/components/GoogleAuthButton';

const EMPTY = {
  syndic_name: '',
  syndic_kind: 'professionnel',
  contact_name: '',
  email: '',
  phone: '',
  city: '',
  buildings_count: '',
  message: '',
};

const KINDS = [
  { value: 'professionnel', label: 'Syndic professionnel' },
  { value: 'benevole', label: 'Syndic bénévole' },
  { value: 'cooperatif', label: 'Syndic coopératif' },
];

export default function SyndicSignupForm() {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target?.value ?? event }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.syndic_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      setError('Renseignez le nom du syndicat, votre nom et votre email.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await base44.entities.SignupRequest.create({
        syndic_name: form.syndic_name.trim(),
        syndic_kind: form.syndic_kind,
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        buildings_count: form.buildings_count ? Number(form.buildings_count) : undefined,
        message: form.message.trim(),
        source: 'page_accueil',
      });
      setDone(true);
      // L'alerte e-mail ne doit jamais empêcher l'affichage de la confirmation.
      if (created?.id) {
        base44.functions.invoke('notifySignupRequest', { request_id: created.id }).catch(() => null);
      }
    } catch (submitError) {
      setError(submitError?.message || "La demande n'a pas pu être enregistrée. Réessayez dans un instant.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex h-full flex-col items-start justify-center gap-3 rounded-[26px] border border-border bg-card p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <h3 className="font-heading text-[22px] font-semibold leading-tight">Demande enregistrée</h3>
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          Merci {form.contact_name.split(' ')[0] || ''} — votre fiche d’inscription est bien reçue. Nous revenons vers
          vous sous 24 h ouvrées pour ouvrir l’espace de {form.syndic_name}.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setForm(EMPTY);
              setDone(false);
            }}
          >
            Inscrire un autre syndicat
          </Button>
          <Button asChild>
            <Link to="/register">Créer mon espace maintenant</Link>
          </Button>
          <Link to="/login" className="text-[12.5px] font-medium text-primary hover:underline">
            J’ai déjà un espace, me connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[26px] border border-border bg-card p-6 shadow-[0_24px_60px_-40px_rgba(41,25,15,0.45)] sm:p-8"
    >
      <p className="kicker">Fiche d’inscription</p>
      <h3 className="mt-2 font-heading text-[24px] font-semibold leading-tight">Ouvrir mon espace syndic</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        Deux minutes suffisent. Aucun engagement, aucun moyen de paiement demandé.
      </p>

      <GoogleAuthButton className="mt-5" label="Créer mon espace avec Google" />

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.16em]">
          <span className="bg-card px-3 text-muted-foreground">ou remplissez la fiche</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="syndic_name">Nom du syndicat</Label>
          <Input
            id="syndic_name"
            value={form.syndic_name}
            onChange={update('syndic_name')}
            placeholder="Cabinet Verne & Associés"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="syndic_kind">Type de syndic</Label>
          <Select value={form.syndic_kind} onValueChange={update('syndic_kind')}>
            <SelectTrigger id="syndic_kind" className="mt-1.5">
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((kind) => (
                <SelectItem key={kind.value} value={kind.value}>
                  {kind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="buildings_count">Immeubles gérés</Label>
          <Input
            id="buildings_count"
            type="number"
            min="0"
            value={form.buildings_count}
            onChange={update('buildings_count')}
            placeholder="12"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="contact_name">Votre nom</Label>
          <Input
            id="contact_name"
            value={form.contact_name}
            onChange={update('contact_name')}
            placeholder="Camille Verne"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="email">Email professionnel</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="camille@cabinet-verne.fr"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            placeholder="01 84 00 00 00"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            value={form.city}
            onChange={update('city')}
            placeholder="Lyon"
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="message">Votre besoin (optionnel)</Label>
          <Textarea
            id="message"
            value={form.message}
            onChange={update('message')}
            rows={3}
            placeholder="Reprise d’un portefeuille de 30 copropriétés, migration des appels de fonds…"
            className="mt-1.5"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={saving} className="mt-5 w-full gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Envoyer ma fiche d’inscription
      </Button>
      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        Vous préférez démarrer seul ?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Créer mon espace maintenant
        </Link>
      </p>
    </form>
  );
}