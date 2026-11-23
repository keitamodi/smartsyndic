import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { resolveAccess, UNRESTRICTED } from '@/lib/access';

let cached = null;
let pending = null;

export function clearAccessCache() {
  cached = null;
  pending = null;
}

export default function useAccess() {
  const { user } = useAuth();
  const [access, setAccess] = useState(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return undefined;
    let active = true;
    if (!pending) {
      pending = base44.functions
        .invoke('accessProfile', {})
        .then((response) => resolveAccess(response?.data || {}))
        .catch(() => (user?.role === 'admin' ? UNRESTRICTED : resolveAccess({ kind: 'inconnu' })))
        .then((result) => {
          cached = result;
          return result;
        });
    }
    pending.then((result) => {
      if (!active) return;
      setAccess(result);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user?.role]);

  const reload = useCallback(async () => {
    clearAccessCache();
    const response = await base44.functions.invoke('accessProfile', {});
    const result = resolveAccess(response?.data || {});
    cached = result;
    pending = Promise.resolve(result);
    setAccess(result);
    setLoading(false);
    return result;
  }, []);

  const can = useCallback(
    (module) => (access ? access.allowed.includes(module) : true),
    [access],
  );

  return { access, loading, can, reload };
}