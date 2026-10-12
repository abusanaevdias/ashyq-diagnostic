import { decisionSignature, DRAFT_REVIEW_CHANGED, emptyDraftReview, parseDraftReview, reviewKey, validDecision, type DraftBatch, type DraftDecision } from './draft-review';

export const reviewWriteLock = (reviewerId: string, batch: DraftBatch) => `ashyq:review-write:${reviewKey(reviewerId, batch)}`;

/** Serialize read/merge/write across tabs; never overwrite another view of the same decision. */
export async function saveDraftDecision(reviewerId: string, batch: DraftBatch, unitId: string, value: DraftDecision, expected: string | null): Promise<void> {
  if (!validDecision(value) || !batch.units.some(unit => unit.id === unitId)) throw new Error('Решение или материал не прошли проверку. Запись не изменена.');
  if (typeof navigator === 'undefined' || !navigator.locks?.request) throw new Error('Браузер не поддерживает безопасное сохранение между вкладками. Скопируй замечание; сохранённые ранее решения можно скачать отдельно.');
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    await navigator.locks.request(reviewWriteLock(reviewerId, batch), { mode: 'exclusive', signal: controller.signal }, () => {
      const key = reviewKey(reviewerId, batch), raw = localStorage.getItem(key), parsed = parseDraftReview(raw, reviewerId, batch);
      if (raw !== null && !parsed) throw new Error('Локальная запись повреждена или относится к другой версии. Она не заменена. Скопируй замечание и сохрани имеющиеся решения отдельно.');
      const current = parsed ?? emptyDraftReview(reviewerId, batch);
      if (decisionSignature(current.decisions[unitId]) !== expected) throw new Error('Этот материал изменён в другой вкладке. Сохранённое решение не заменено. Скопируй свою правку и обнови страницу, чтобы сравнить версии.');
      const next = { ...emptyDraftReview(reviewerId, batch), decisions: { ...current.decisions, [unitId]: { decision: value.decision, comment: value.comment, attested: value.attested, savedAt: value.savedAt } } };
      const serialized = JSON.stringify(next);
      if (!parseDraftReview(serialized, reviewerId, batch)) throw new Error('Не удалось подготовить запись в допустимом размере. Скопируй замечание и скачай сохранённые решения.');
      localStorage.setItem(key, serialized);
      window.dispatchEvent(new Event(DRAFT_REVIEW_CHANGED));
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Другая вкладка слишком долго удерживает запись. Ничего не заменено. Повтори сохранение позже или скопируй замечание.');
    throw error;
  } finally { clearTimeout(timeout); }
}
