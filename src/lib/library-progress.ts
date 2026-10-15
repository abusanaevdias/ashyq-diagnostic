import type { PracticeSet } from './library-practice';

export type LibraryProgress = { version: 1; source: string; current: number; values: Record<string, string>; checked: Record<string, boolean> };
/** Content identity only, not a security token. Changed source never reuses a stale grade. */
export function progressSource(value: unknown): string {
  const text = JSON.stringify(value); let a = 2166136261, b = 5381;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ text.charCodeAt(i); }
  return `${(a >>> 0).toString(16)}-${(b >>> 0).toString(16)}`;
}
export const emptyProgress = (source: string): LibraryProgress => ({ version: 1, source, current: 0, values: {}, checked: {} });
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function readProgress(raw: string, source: string, fields: {id: string; max: number}[]): LibraryProgress | null {
  if (!raw) return emptyProgress(source);
  // JSON may escape one allowed character as six bytes (e.g. a control code).
  // Bound the envelope without invalidating responses that meet each field's limit.
  const maxEnvelope = Math.min(4000000, fields.reduce((sum, field) => sum + field.max * 6 + 200, 1000));
  if (raw.length > maxEnvelope) return null;
  try {
    const p: unknown = JSON.parse(raw);
    if (!object(p) || Object.keys(p).some(k => !['version','source','current','values','checked'].includes(k)) || p.version !== 1 || p.source !== source || !Number.isInteger(p.current) || Number(p.current) < 0 || Number(p.current) >= fields.length || !object(p.values) || !object(p.checked)) return null;
    const values = p.values, checked = p.checked;
    const allowed = new Map(fields.map(f => [f.id, f.max]));
    if (Object.keys(values).some(k => !allowed.has(k) || typeof values[k] !== 'string' || (values[k] as string).length > allowed.get(k)!)) return null;
    if (Object.keys(checked).some(k => !allowed.has(k) || typeof checked[k] !== 'boolean' || (checked[k] && !(values[k] as string)?.trim()))) return null;
    return {version: 1, source, current: Number(p.current), values: p.values as Record<string,string>, checked: p.checked as Record<string,boolean>};
  } catch { return null; }
}
export const practiceFields = (set: PracticeSet) => set.questions.map(q => ({id: q.id, max: q.mode === 'auto' ? 200 : 24000}));
