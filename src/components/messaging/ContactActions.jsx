import { Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const phoneHref = (phone) => `tel:${String(phone).replace(/[^+\d]/g, '')}`;

export default function ContactActions({ email, phone, name, subject, className }) {
  if (!email && !phone) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {phone && (
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-[11.5px]">
          <a href={phoneHref(phone)} title={`Appeler ${name || 'le contact'}`}>
            <Phone className="h-3.5 w-3.5" strokeWidth={1.8} />
            Appeler
          </a>
        </Button>
      )}
      {email && (
        <Button asChild variant="outline" size="sm" className="gap-1.5 text-[11.5px]">
          <a
            href={`mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`}
            title={`Écrire à ${name || 'le contact'}`}
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={1.8} />
            E-mail
          </a>
        </Button>
      )}
    </div>
  );
}