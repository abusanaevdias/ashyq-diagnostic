'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getAuth } from './auth';
import { lmsBus, storageAvailable } from './store';
import type { Session } from './types';

/* ---------- сессия: внешнее хранилище, без setState в эффекте ---------- */

let lastKey = '';
let lastSession: Session | null = null;

function sessionSnapshot(): Session | null {
  const session = getAuth().getSession();
  const key = session ? JSON.stringify(session) : '';
  if (key !== lastKey) {
    lastKey = key;
    lastSession = session;
  }
  return lastSession;
}

function subscribe(callback: () => void): () => void {
  const offAuth = getAuth().onAuthChange(callback);
  const offBus = lmsBus.on(callback);
  window.addEventListener('storage', callback); // вход/выход в другой вкладке
  return () => {
    offAuth();
    offBus();
    window.removeEventListener('storage', callback);
  };
}

/** ready=false до гидратации: сервер не знает о localStorage. */
export function useSession(): { session: Session | null; ready: boolean } {
  const session = useSyncExternalStore(subscribe, sessionSnapshot, () => undefined);
  return { session: session ?? null, ready: session !== undefined };
}

export function useStorageAvailable(): boolean | null {
  return useSyncExternalStore(
    () => () => {},
    storageAvailable,
    () => null,
  );
}

/* ---------- данные репозиториев: перечитываются на каждое изменение ---------- */

export function useLmsData<T>(load: () => Promise<T>, key: string): { data: T | null; error: string | null; loading: boolean } {
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null }>({ key: '', data: null, error: null });

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      load()
        .then((data) => alive && setState({ key, data, error: null }))
        .catch((error: unknown) => alive && setState({ key, data: null, error: error instanceof Error ? error.message : 'Не удалось загрузить данные' }));
    };
    refresh();
    const off = lmsBus.on(refresh);
    window.addEventListener('storage', refresh);
    return () => {
      alive = false;
      off();
      window.removeEventListener('storage', refresh);
    };
    // load пересоздаётся каждый рендер; перезагрузку задаёт key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state.key === key;
  return { data: current ? state.data : null, error: current ? state.error : null, loading: !current };
}
