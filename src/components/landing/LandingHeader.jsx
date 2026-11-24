import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function LandingHeader() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const goToForm = () => {
    const target = document.getElementById('inscription');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate('/');
    setTimeout(() => document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth' }), 300);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary text-primary-foreground shadow-[0_6px_16px_-8px_hsl(var(--primary))]">
            <span className="font-mono text-[12px] font-semibold tracking-tight">SS</span>
          </div>
          <div className="min-w-0">
            <p className="font-heading text-[15.5px] font-semibold leading-tight">Smartsyndic</p>
            <p className="kicker !text-[8.5px] !tracking-[0.16em]">Gestion de copropriété</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden text-[12.5px] text-foreground/70 sm:inline-flex"
          >
            <Link to="/pricing">Tarifs</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden text-[12.5px] text-foreground/70 sm:inline-flex"
          >
            <Link to={isAuthenticated ? '/tableau-de-bord' : '/login'}>
              {isAuthenticated ? 'Mon espace' : 'Se connecter'}
            </Link>
          </Button>
          <Button size="sm" className="text-[12.5px]" onClick={goToForm}>
            Inscription syndic
          </Button>
        </div>
      </div>
    </header>
  );
}