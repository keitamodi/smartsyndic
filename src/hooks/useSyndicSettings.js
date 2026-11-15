import { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_SETTINGS, normalizeSettings } from '@/lib/settings';

export default function useSyndicSettings(syndicId) {
  const [recordId, setRecordId] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!syndicId) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    base44.entities.SyndicSettings.filter({ syndic_id: syndicId }, { limit: 1 })
      .then((page) => {
        if (!active) return;
        const found = page?.items?.[0] || null;
        const normalized = normalizeSettings(found || {});
        setRecordId(found?.id || null);
        setSettings(normalized);
        setSaved(normalized);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [syndicId]);

  const update = useCallback((field, value) => {
    setSettings((previous) => ({ ...previous, [field]: value }));
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(saved),
    [settings, saved],
  );

  const save = useCallback(async () => {
    if (!syndicId) return;
    setSaving(true);
    try {
      const payload = { ...settings, syndic_id: syndicId };
      if (recordId) {
        await base44.entities.SyndicSettings.update(recordId, payload);
      } else {
        const created = await base44.entities.SyndicSettings.create(payload);
        setRecordId(created?.id || null);
      }
      setSaved(settings);
    } finally {
      setSaving(false);
    }
  }, [settings, syndicId, recordId]);

  return { settings, update, dirty, loading, saving, save };
}