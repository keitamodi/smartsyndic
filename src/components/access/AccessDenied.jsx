import { Link } from 'react-router-dom';
import { LifeBuoy, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MODULE_LABELS, ROLE_LABELS, homePath } from '@/lib/access';

export default function AccessDenied({ module, access }) {
  const label = MODULE_LABELS[module] || 'Ce module';
  const blocked = !!access?.blocked;
  const role = ROLE_LABELS[access?.role] || '';

  const description = blocked
    ? "Votre accès à cet espace a été suspendu par votre syndic. Contactez-le pour le réactiver."
    : access?.kind === 'equipe'
      ? `Votre rôle${role ? ` de ${role.toLowerCase()}` : ''} ne donne pas accès au module « ${label} ». Le syndic définit les accès de chaque collaborateur depuis Paramètres › Accès.`
      : `Le module « ${label} » ne fait pas partie de votre espace. Votre syndic en définit le contenu.`;

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="rounded-[26px] border border-border bg-card px-6 py-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
          <ShieldX className="h-5 w-5 text-destructive" strokeWidth={1.8} />
        </span>
        <h1 className="mt-4 font-heading text-[20px] font-semibold text-foreground">Accès restreint</h1>
        <p className="mx-auto mt-2 max-w-[420px] text-[12.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to={homePath(access)}>Retour à mon espace</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/aide">
              <LifeBuoy className="h-4 w-4" />
              Aide
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}