import { useState } from 'react';
import { Check, Globe, Loader2, Mail, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export const hasContact = (contact) =>
  !!(contact && (contact.phone || contact.email || contact.website));

const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;
const shortUrl = (url) => String(url).replace(/^https?:\/\//i, '').replace(/\/$/, '');

export default function DirectoryResultCard({ item, known, onAdd, savedContact }) {
  const [contact, setContact] = useState(hasContact(savedContact) ? savedContact : null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchContact = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await base44.functions.invoke('companyLookup', {
        siret: item.siret,
        name: item.name,
        postal_code: item.postal_code,
        city: item.city,
      });
      const found = response?.data?.contact;
      if (hasContact(found)) setContact(found);
      else setMessage('Aucune coordonnée publiée trouvée pour cette entreprise.');
    } catch (invokeError) {
      setMessage(invokeError?.response?.data?.error || invokeError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">{item.name}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {[item.naf_label, item.legal_form_label, item.employees].filter(Boolean).join(' · ') ||
              item.naf_code ||
              'Activité non précisée'}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-foreground/70">
            {item.address || [item.postal_code, item.city].filter(Boolean).join(' ')}
          </p>
          <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">SIRET {item.siret}</p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={known ? 'ghost' : 'outline'}
            disabled={known}
            onClick={() => onAdd(item)}
            className="gap-1.5"
          >
            {known ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {known ? 'Au répertoire' : 'Ajouter'}
          </Button>
          {!contact && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={fetchContact}
              className="gap-1.5 text-muted-foreground"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Phone className="h-3.5 w-3.5" />
              )}
              Coordonnées
            </Button>
          )}
        </div>
      </div>

      {contact && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 pt-2 text-[12px]">
          {contact.phone && (
            <a
              href={telHref(contact.phone)}
              className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {contact.phone}
            </a>
          )}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex min-w-0 items-center gap-1.5 text-foreground hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.website && (
            <a
              href={contact.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-0 items-center gap-1.5 text-foreground/75 hover:text-primary"
            >
              <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{shortUrl(contact.website)}</span>
            </a>
          )}
        </div>
      )}

      {message && <p className="mt-1.5 text-[11.5px] text-muted-foreground">{message}</p>}
    </div>
  );
}