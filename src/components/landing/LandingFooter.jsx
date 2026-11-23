import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LEGAL_PAGES } from '@/lib/legal';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-heading text-[14.5px] font-semibold">SyndicVibe</p>
            <p className="mt-0.5 max-w-[320px] text-[12px] text-muted-foreground">
              Gestion de copropriété pour les syndics et leurs résidents.
            </p>
          </div>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_PAGES.map((page) => (
              <Link
                key={page.to}
                to={page.to}
                className="text-[12px] text-muted-foreground transition hover:text-foreground"
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-muted-foreground">© {new Date().getFullYear()} SyndicVibe</p>
          <Button variant="outline" size="sm" asChild className="text-[12px]">
            <Link to="/login">Espace syndic</Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}