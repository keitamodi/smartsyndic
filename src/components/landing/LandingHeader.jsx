import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function LandingHeader() {
  const goToForm = () => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_hsl(var(--primary))]">
            <span className="font-mono text-[12px] font-semibold tracking-tight">SV</span>
          </div>
          <div className="min-w-0">
            <p className="font-heading text-[15.5px] font-semibold leading-tight">SyndicVibe</p>
            <p className="kicker !text-[8.5px] !tracking-[0.16em]">Gestion de copropriété</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-[12.5px] text-foreground/70 sm:inline-flex"
            onClick={() => base44.auth.redirectToLogin('/tableau-de-bord')}
          >
            Se connecter
          </Button>
          <Button size="sm" className="text-[12.5px]" onClick={goToForm}>
            Inscrire mon syndicat
          </Button>
        </div>
      </div>
    </header>
  );
}