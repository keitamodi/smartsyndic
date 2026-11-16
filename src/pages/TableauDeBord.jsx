import { Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import useMemberKind from '@/hooks/useMemberKind';

export default function TableauDeBord() {
  const { kind, loading } = useMemberKind();

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (kind === 'admin') return <Dashboard />;

  return <Navigate to={kind === 'technicien' ? '/mes-interventions' : '/mon-espace'} replace />;
}