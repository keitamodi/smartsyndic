import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

const STORAGE_KEY = 'syndicvibe.workspace';
const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [syndics, setSyndics] = useState([]);
  const [syndicId, setSyndicIdState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await base44.entities.Syndic.list();
      const rows = Array.isArray(result) ? result : result?.items || [];
      setSyndics(rows);
      setSyndicIdState((previous) => {
        const next = rows.some((row) => row.id === previous) ? previous : rows[0]?.id || '';
        try {
          if (next) localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* stockage indisponible */
        }
        return next;
      });
    } catch (loadError) {
      setSyndics([]);
      setError(loadError?.message || 'Espaces de travail indisponibles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setSyndicId = useCallback((id) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* stockage indisponible */
    }
    setSyndicIdState(id);
  }, []);

  const value = useMemo(
    () => ({
      syndics,
      syndicId,
      setSyndicId,
      syndic: syndics.find((item) => item.id === syndicId) || null,
      loading,
      error,
      refresh,
    }),
    [syndics, syndicId, setSyndicId, loading, error, refresh],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace utilisé hors du WorkspaceProvider');
  return context;
}