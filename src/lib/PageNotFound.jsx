import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  // Indique aux moteurs de recherche qu'il s'agit bien d'une page inexistante.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'prerender-status-code';
    meta.content = '404';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[64px] font-light leading-none text-primary/25">404</p>
        <h1 className="mt-3 font-heading text-[24px] font-semibold tracking-[-0.02em]">Page introuvable</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {pageName ? (
            <>
              La page <span className="font-medium text-foreground">« {pageName} »</span> n’existe pas ou a été
              déplacée.
            </>
          ) : (
            'Cette page n’existe pas ou a été déplacée.'
          )}
        </p>
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Retour à l’accueil
            </Link>
          </Button>
          <Button asChild variant="ghost" className="text-[12.5px] text-muted-foreground">
            <Link to="/tableau-de-bord">Ouvrir mon espace</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}