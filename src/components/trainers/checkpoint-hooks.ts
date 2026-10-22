'use client';

import { useSyncExternalStore } from 'react';
import { useSession } from '@/lib/lms/hooks';
import { trainerCatalog } from '@/lib/trainers/catalog';
import { checkpointKey, parseRecord } from '@/lib/trainers/checkpoints';

export const checkpointChanged = 'ashyq:trainer-checkpoint-change';
export function subscribeCheckpoints(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(checkpointChanged, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(checkpointChanged, callback);
  };
}

/** Read only the current account/guest scope, using existing validators and keys. */
export function useCheckpointLibrary() {
  const { session, ready } = useSession();
  const scope = session?.user.id ?? 'guest';
  const raw = useSyncExternalStore(subscribeCheckpoints, () => {
    if (!ready) return '[]';
    try { return JSON.stringify(trainerCatalog.map(item => localStorage.getItem(checkpointKey(item.id, scope)))); }
    catch { return JSON.stringify(trainerCatalog.map(() => '!storage-unavailable')); }
  }, () => '[]');
  const values = JSON.parse(raw) as (string | null)[];
  return { ready, entries: trainerCatalog.map((item, index) => ({ item, raw: values[index] ?? null, record: parseRecord(values[index] ?? null, item.id) })) };
}
