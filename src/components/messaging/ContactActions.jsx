import { useState } from 'react';
import { Check, Copy, Mail, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { gmailHref, mailtoHref, officeHref, outlookHref, phoneHref, whatsappHref } from '@/lib/contactLinks';

const ITEM = 'gap-2 text-[12px]';

const MailOption = ({ href, label, hint }) => (
  <DropdownMenuItem asChild className={ITEM}>
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Mail className="h-3.5 w-3.5" strokeWidth={1.8} />
      <span className="flex-1">{label}</span>
      {hint && <span className="font-mono text-[9.5px] uppercase tracking-wide text-muted-foreground">{hint}</span>}
    </a>
  </DropdownMenuItem>
);

export default function ContactActions({ email, phone, name, subject, className, compact = false }) {
  const [copied, setCopied] = useState(false);

  if (!email && !phone) return null;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      setCopied(false);
    }
  };

  const triggerClass = compact ? 'h-7 w-7' : 'gap-1.5 text-[11.5px]';
  const triggerSize = compact ? 'icon' : 'sm';
  const triggerVariant = compact ? 'ghost' : 'outline';

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', compact && 'flex-col', className)}>
      {phone && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={triggerVariant}
              size={triggerSize}
              className={triggerClass}
              title={`Appeler ${name || 'le contact'}`}
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.8} />
              {!compact && 'Appeler'}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-60 p-3">
            <p className="kicker">Numéro de {name || 'contact'}</p>
            <p className="mt-1 font-mono text-[13.5px] font-semibold tracking-tight text-foreground">{phone}</p>
            <div className="mt-2.5 space-y-1.5">
              <Button asChild size="sm" className="w-full justify-start gap-2 text-[12px]">
                <a href={phoneHref(phone)}>
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Appeler maintenant
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full justify-start gap-2 text-[12px]">
                <a
                  href={whatsappHref(phone, subject)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Contacter via WhatsApp
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start gap-2 text-[12px]"
                onClick={copyNumber}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                ) : (
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
                )}
                {copied ? 'Numéro copié' : 'Copier le numéro'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {email && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={triggerVariant}
              size={triggerSize}
              className={triggerClass}
              title={`Écrire à ${name || 'le contact'}`}
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={1.8} />
              {!compact && 'E-mail'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Écrire depuis
            </DropdownMenuLabel>
            <MailOption href={gmailHref(email, subject)} label="Gmail" hint="Google" />
            <MailOption href={outlookHref(email, subject)} label="Hotmail / Outlook.com" hint="Microsoft" />
            <MailOption href={officeHref(email, subject)} label="Outlook professionnel" hint="365" />
            <DropdownMenuSeparator />
            <MailOption href={mailtoHref(email, subject)} label="Application mail" hint="Défaut" />
            <DropdownMenuLabel className="truncate pt-1 text-[10.5px] font-normal normal-case tracking-normal text-muted-foreground">
              {email}
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}