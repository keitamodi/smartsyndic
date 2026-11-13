import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const byDate = (a, b) => String(a.created_date || '').localeCompare(String(b.created_date || ''));

export default function useRealtimeMessages(entityName, field, value, { limit = 200 } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(value));

  const load = useCallback(async () => {
    if (!value) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await base44.entities[entityName].filter(
        { [field]: value },
        { sort: 'created_date', limit },
      );
      setItems((Array.isArray(result) ? result : result?.items || []).slice().sort(byDate));
    } finally {
      setLoading(false);
    }
  }, [entityName, field, value, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!value) return undefined;
    const unsubscribe = base44.entities[entityName].subscribe((event) => {
      const record = event?.data;
      if (!record || record[field] !== value) return;
      if (event.type === 'delete') {
        setItems((previous) => previous.filter((row) => row.id !== record.id));
        return;
      }
      setItems((previous) => {
        const exists = previous.some((row) => row.id === record.id);
        const next = exists
          ? previous.map((row) => (row.id === record.id ? record : row))
          : [...previous, record];
        return next.slice().sort(byDate);
      });
    });
    return unsubscribe;
  }, [entityName, field, value]);

  return { items, loading, reload: load };
}