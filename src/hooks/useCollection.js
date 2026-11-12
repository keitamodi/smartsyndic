import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useCollection(entityName, query = {}, { sort = '-created_date', limit = 200, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');
  const queryKey = JSON.stringify(query);

  const load = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await base44.entities[entityName].filter(JSON.parse(queryKey), { sort, limit });
      setItems(Array.isArray(result) ? result : result?.items || []);
    } catch (loadError) {
      setItems([]);
      setError(loadError?.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [entityName, queryKey, sort, limit, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}