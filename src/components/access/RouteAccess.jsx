import { Outlet, useLocation } from 'react-router-dom';
import AccessDenied from '@/components/access/AccessDenied';
import useAccess from '@/hooks/useAccess';
import { ROUTE_MODULES } from '@/lib/access';

/** Contrôle d'accès de chaque route : le module doit figurer dans le profil du compte. */
export default function RouteAccess() {
  const { access, loading } = useAccess();
  const { pathname } = useLocation();
  const module = ROUTE_MODULES[pathname];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (module && access && !access.allowed.includes(module)) {
    return <AccessDenied module={module} access={access} />;
  }

  return <Outlet />;
}