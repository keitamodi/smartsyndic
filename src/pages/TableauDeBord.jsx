import { Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import WorkspaceRequired from '@/components/WorkspaceRequired';
import useAccess from '@/hooks/useAccess';

export default function TableauDeBord() {
  const { access, loading } = useAccess();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (access?.kind === 'syndic' || access?.kind === 'equipe') return <Dashboard />;
  // Compte connecté sans espace (première connexion avec Google ou inscription email) :
  // on l'invite à ouvrir son espace syndic plutôt que de le renvoyer vers l'espace résident.
  if (access?.kind === 'inconnu') return <WorkspaceRequired />;

  return <Navigate to={access?.kind === 'technicien' ? '/mes-interventions' : '/mon-espace'} replace />;
}