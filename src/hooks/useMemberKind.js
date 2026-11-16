import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

let cachedKind = null;
let pendingRequest = null;

/**
 * Profil du compte connecté : administrateur du cabinet, technicien ou résident.
 * Le serveur rattache aussi automatiquement une invitation en attente.
 */
export default function useMemberKind() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [state, setState] = useState(() =>
    isAdmin ? { kind: 'admin', loading: false } : { kind: cachedKind, loading: !cachedKind },
  );

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      setState({ kind: 'admin', loading: false });
      return;
    }
    if (cachedKind) {
      setState({ kind: cachedKind, loading: false });
      return;
    }

    let active = true;
    if (!pendingRequest) {
      pendingRequest = base44.functions
        .invoke('memberAccess', { action: 'whoami' })
        .then((response) => response?.data?.kind || 'resident')
        .catch(() => 'resident');
    }
    pendingRequest.then((kind) => {
      cachedKind = kind;
      if (active) setState({ kind, loading: false });
    });

    return () => {
      active = false;
    };
  }, [user, isAdmin]);

  return state;
}