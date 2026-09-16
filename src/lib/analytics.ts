/**
 * Analytics-абстракция.
 *
 * Сейчас события уходят в window.dataLayer (совместимо с GA4 / GTM)
 * и в консоль в dev. Чтобы подключить Amplitude / Mixpanel / метрику —
 * достаточно дописать провайдер в track(), UI трогать не нужно.
 */

import type { UtmParams } from './types';

export type AnalyticsEvent =
  | 'diagnostic_landing_view'
  | 'exam_selected'
  | 'diagnostic_started'
  | 'onboarding_completed'
  | 'question_answered'
  | 'question_skipped'
  | 'diagnostic_completed'
  | 'result_viewed'
  | 'review_opened'
  | 'share_clicked'
  | 'whatsapp_cta_clicked'
  | 'prep_cta_clicked'
  | 'restart_clicked'
  | 'lead_captured'
  | 'program_page_view'
  | 'progress_page_view'
  | 'lms_signed_in'
  | 'lms_assignment_created'
  | 'lms_submission_created'
  | 'lms_comment_created'
  | 'lms_grade_set'
  | 'blog_post_published'
  | 'season_created'
  | 'season_team_created'
  | 'season_points_awarded'
  | 'season_match_submitted'
  | 'season_match_reviewed'
  | 'career_test_started'
  | 'career_test_completed'
  | 'career_result_shared'
  | 'career_diagnostic_cta_clicked';

export interface EventPayload {
  exam?: string;
  target?: string | null;
  plannedWhen?: string | null;
  readiness?: number;
  band?: string;
  level?: string;
  strongestDomain?: string;
  weakestDomain?: string;
  questionId?: string;
  section?: string;
  domain?: string;
  difficulty?: string;
  utm?: UtmParams;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    ashqDebug?: boolean;
  }
}

export function track(event: AnalyticsEvent, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') return;

  const data = {
    event,
    ts: Date.now(),
    ...payload,
  };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  } catch {
    /* приватный режим / заблокированный storage — не ломаем UX */
  }

  if (process.env.NODE_ENV !== 'production' || window.ashqDebug) {
    console.debug('[ashyq:event]', event, payload);
  }
}

/**
 * Сохраняем срез лида локально (без PII: только экзамен, цель, результат, UTM).
 * Позже этот же объект можно отправить на backend / в CRM одним вызовом.
 */
export function recordLeadSnapshot(snapshot: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    const key = 'ashyq:v1:leads';
    const raw = window.localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ ...snapshot, ts: Date.now() });
    window.localStorage.setItem(key, JSON.stringify(list.slice(-50)));
  } catch {
    /* storage может быть недоступен — не критично */
  }
}
