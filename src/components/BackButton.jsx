import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Retour discret vers la page précédente.
 * Masqué s'il n'y a pas d'historique de navigation (ex. page ouverte directement).
 */
export default function BackButton() {
  const navigate = useNavigate();
  useLocation(); // recalcule la visibilité à chaque changement de page

  const canGoBack = (window.history.state?.idx ?? 0) > 0;
  if (!canGoBack) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="Revenir à la page précédente"
      className="mb-3 inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[12px] font-medium text-muted-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Retour
    </button>
  );
}