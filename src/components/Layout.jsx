import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import TopBar from '@/components/TopBar';
import RouteAccess from '@/components/access/RouteAccess';
import { WorkspaceProvider } from '@/lib/workspace';
import { Button } from '@/components/ui/button';

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[266px] border-r border-border/70 bg-card lg:block">
        <AppSidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3 text-muted-foreground"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer la navigation"
            >
              <X className="h-5 w-5" />
            </Button>
            <AppSidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-[266px]">
        <TopBar onMenu={() => setMenuOpen(true)} />
        <main className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          <div key={location.pathname} className="page-in">
            <RouteAccess />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}