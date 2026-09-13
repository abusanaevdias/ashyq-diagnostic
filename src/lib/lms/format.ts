/** Форматы дат и размеров для учебного слоя (формат из ТЗ, не Intl: «сен», «12 мин назад»). */

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const pad = (n: number) => String(n).padStart(2, '0');

/** «20 сен, 18:00» — в часовом поясе устройства. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isOverdue(dueAt: string, now = Date.now()): boolean {
  return Date.parse(dueAt) < now;
}

/** «только что», «12 мин назад», «3 ч назад», «вчера», «4 дн назад», дальше — дата. */
export function relativeTime(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дн назад`;
  return formatDate(iso).split(',')[0];
}

/** «20 сен» — дата без времени (посты блога). */
export function formatDay(iso: string): string {
  return formatDate(iso).split(',')[0];
}

/** Обложка поста: только локальный путь из /public (next/image упадёт на чужом хосте). */
export function postCover(coverUrl?: string): string {
  return coverUrl && /^\/(?!\/)/.test(coverUrl) ? coverUrl : '/brand/lesson-grid.jpg';
}

/** Ссылки материалов — только http(s): javascript:/data: в href недопустимы. */
export function isHttpUrl(url: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

export function formatBytes(bytes = 0): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}
