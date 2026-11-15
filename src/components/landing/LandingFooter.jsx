import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/40">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <p className="font-heading text-[14.5px] font-semibold">SyndicVibe</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Gestion de copropriété pour les syndics et leurs résidents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[11.5px] text-muted-foreground">© {new Date().getFullYear()} SyndicVibe</p>
          <Button
            variant="outline"
            size="sm"
            className="text-[12px]"
            onClick={() => base44.auth.redirectToLogin('/tableau-de-bord')}
          >
            Espace syndic
          </Button>
        </div>
      </div>
    </footer>
  );
}