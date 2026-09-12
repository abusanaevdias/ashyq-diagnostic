import type { ExamId, UtmParams } from './types';

/**
 * Лид — единственное, ради чего существует диагностика.
 *
 * Раньше результат жил только в localStorage браузера ученика: если он не нажимал
 * WhatsApp, Ashyq не узнавал о нём вообще. Теперь каждый дошедший до результата
 * отправляется на сервер — сначала анонимно (kind: 'result'), а если оставил
 * контакт, то повторно с контактом (kind: 'contact').
 */

export type LeadKind = 'result' | 'contact' | 'whatsapp';

export interface LeadPayload {
  kind: LeadKind;
  runId: string;
  exam: ExamId;
  /** Контакт — только для kind: 'contact' */
  name?: string;
  phone?: string;
  grade?: string;
  target?: string | null;
  plannedWhen?: string | null;
  band?: string | null;
  level?: string | null;
  correct?: number;
  total?: number;
  strongest?: string | null;
  weakest?: string | null;
  elapsedMin?: number;
  utm?: UtmParams;
}

export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

/** Оставляем только цифры: пользователь может ввести +7 (706) 708-01-81 */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * Казахстанские номера пользователь чаще пишет как 8xxx — приводим к 7xxx,
 * иначе WhatsApp не находит контакт.
 */
export function toInternationalKz(digits: string): string {
  if (digits.length === 11 && digits.startsWith('8')) return `7${digits.slice(1)}`;
  if (digits.length === 10) return `7${digits}`;
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return digits.length >= PHONE_MIN_DIGITS && digits.length <= PHONE_MAX_DIGITS;
}

/** Человеческий формат для подтверждения: +7 706 708 01 81 */
export function formatPhoneForDisplay(raw: string): string {
  const d = toInternationalKz(normalizePhone(raw));
  if (d.length !== 11) return `+${d}`;
  return `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
}

/**
 * Отправка лида. Никогда не бросает и никогда не блокирует UI:
 * если сеть легла, ученик всё равно видит результат и кнопку WhatsApp.
 *
 * keepalive нужен, чтобы запрос дожил до конца, даже если пользователь
 * сразу уходит в WhatsApp и вкладка выгружается.
 */
export async function sendLead(payload: LeadPayload): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}
