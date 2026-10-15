'use client';

import { useSyncExternalStore } from 'react';

type Entry = { raw: string; problem: string; snapshot: string };
const entries = new Map<string, Entry>();
const event = 'ashyq-library-progress';
const server = () => '';
function publish(key: string, raw: string, problem = '') {
  const entry = {raw, problem, snapshot: JSON.stringify({raw, problem})}; entries.set(key, entry);
  window.dispatchEvent(new CustomEvent(event, {detail: key})); return entry;
}
function entryFor(key: string): Entry {
  const prior = entries.get(key); if (prior) return prior;
  let raw = '', problem = '';
  try { raw = localStorage.getItem(key) ?? ''; } catch { problem = 'Браузер запретил сохранение. Ответы остаются только на этой странице: скопируйте их перед выходом.'; }
  const entry = {raw, problem, snapshot: JSON.stringify({raw, problem})}; entries.set(key, entry); return entry;
}
function subscribe(key: string, listener: () => void) {
  const local = () => listener();
  const external = (e: StorageEvent) => {
    if (e.key !== key && e.key !== null) return;
    const old = entryFor(key);
    if (old.problem || old.raw === (e.newValue ?? '')) return;
    publish(key, old.raw, 'Ответы изменены в другой вкладке. Текущая страница оставлена без изменений. Скопируйте нужные правки и загрузите сохранённую версию.');
  };
  window.addEventListener(event, local); window.addEventListener('storage', external);
  // SPA navigation keeps this module alive while no lesson is subscribed.
  // Refresh clean snapshots on remount; never discard an unsaved/conflicting draft.
  const existing = entryFor(key);
  if (!existing.problem) {
    try {
      const disk = localStorage.getItem(key) ?? '';
      if (disk !== existing.raw) publish(key, disk);
    } catch { publish(key, existing.raw, 'Браузер запретил чтение сохранённых ответов. Текущий текст остаётся на странице; скопируйте его перед выходом.'); }
  }
  return () => {window.removeEventListener(event, local); window.removeEventListener('storage', external);};
}
/** Synchronous device writes survive an immediate reload. Compare before writing to avoid overwriting a changed tab. */
export function useDeviceProgress(code: string) {
  const key = `ashyq:library-progress:v1:${code}`;
  const snapshot = useSyncExternalStore(listener => subscribe(key, listener), () => entryFor(key).snapshot, server);
  const {raw, problem}: {raw: string; problem: string} = snapshot ? JSON.parse(snapshot) : {raw:'', problem:''};
  function update(next: string, reset = false) {
    if (!snapshot) return false;
    try {
      if(reset) {localStorage.removeItem(key); publish(key, ''); return true;}
      if (!reset && (problem || (localStorage.getItem(key) ?? '') !== raw)) {
        publish(key, next, problem || 'Ответы изменены в другой вкладке. Ваша текущая версия не перезаписывает сохранённую. Скопируйте её; затем загрузите сохранённую версию.'); return false;
      }
      localStorage.setItem(key, next); publish(key, next); return true;
    } catch { publish(key, reset ? raw : next, reset ? 'Не удалось удалить сохранённые ответы. Данные сохранены без изменений; попробуйте очистить данные сайта в настройках браузера.' : 'Не удалось сохранить на устройстве. Скопируйте ответы перед выходом: после перезагрузки эти изменения могут исчезнуть.'); return false; }
  }
  function reload() {
    try { publish(key, localStorage.getItem(key) ?? ''); }
    catch { /* Keep the local draft and the existing failure notice. */ }
  }
  return {raw, problem, ready: !!snapshot, update, reload};
}
