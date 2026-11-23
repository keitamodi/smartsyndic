import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useWorkspace } from '@/lib/workspace';
import { planById } from '@/lib/plans';
import { monthStartISO, quotaLimits, quotaState } from '@/lib/quota';

const EMPTY_USAGE = { buildings: 0, lots: 0, seats: 0, ai: 0 };

/** Consommation réelle du cabinet comparée aux plafonds de son forfait. */
export default function useQuota() {
  const { syndicId, syndic } = useWorkspace();
  const [usage, setUsage] = useState(EMPTY_USAGE);
  const limits = quotaLimits(syndic);
  const planName = planById(syndic?.plan_tier).name;

  const reload = useCallback(async () => {
    if (!syndicId) {
      setUsage(EMPTY_USAGE);
      return;
    }
    const [buildings, lots, seats, ai] = await Promise.all([
      base44.entities.Building.count({ syndic_id: syndicId }),
      base44.entities.Lot.count({ syndic_id: syndicId }),
      base44.entities.TeamMember.count({ syndic_id: syndicId }),
      base44.entities.Message.count({
        syndic_id: syndicId,
        role: 'user',
        created_date: { $gte: monthStartISO() },
      }),
    ]);
    setUsage({
      buildings: Number(buildings) || 0,
      lots: Number(lots) || 0,
      seats: Number(seats) || 0,
      ai: Number(ai) || 0,
    });
  }, [syndicId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const check = useCallback((key) => quotaState(usage, limits, key), [usage, limits]);

  return { usage, limits, planName, check, reload };}