import batch from '@/data/trainer-drafts/batch-01.json';

export const draftBatch = batch;
export type DraftUnit = typeof batch.units[number];
export type ReviewDecision = 'pending' | 'recommend' | 'revise' | 'hold';
export type DraftDecision = { decision: ReviewDecision; comment: string; attested: boolean; savedAt: string };
export type DraftReview = { format: 'ashyq-draft-review-v1'; batch: string; source_sha256: string; reviewerId: string; decisions: Record<string, DraftDecision> };
export function emptyDraftReview(reviewerId: string): DraftReview {
  return { format: 'ashyq-draft-review-v1', batch: batch.batch, source_sha256: batch.content_sha256, reviewerId, decisions: {} };
}
export function validDecision(value: unknown): value is DraftDecision {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (!['pending','recommend','revise','hold'].includes(v.decision as string) || typeof v.comment !== 'string' || v.comment.length > 3000 || typeof v.attested !== 'boolean' || typeof v.savedAt !== 'string' || Number.isNaN(Date.parse(v.savedAt))) return false;
  if (v.decision === 'recommend' && !v.attested) return false;
  if (v.decision === 'revise' && !v.comment.trim()) return false;
  return true;
}
export function parseDraftReview(raw: string | null, reviewerId: string): DraftReview | null {
  if (!raw || raw.length > 100_000) return null;
  try {
    const v = JSON.parse(raw) as Partial<DraftReview>;
    if (!v || v.format !== 'ashyq-draft-review-v1' || v.batch !== batch.batch || v.source_sha256 !== batch.content_sha256 || v.reviewerId !== reviewerId || !v.decisions || typeof v.decisions !== 'object' || Array.isArray(v.decisions)) return null;
    if (!Object.entries(v.decisions).every(([id, decision]) => batch.units.some(unit => unit.id === id) && validDecision(decision))) return null;
    return v as DraftReview;
  } catch { return null; }
}
export const reviewKey = (reviewerId: string) => `ashyq:trainer-review:v1:${batch.batch}:${batch.content_sha256}:${reviewerId}`;

/** Local recommendations cannot publish or change a source material's status. */
export function reviewCounts(review: DraftReview) {
  const decisions = Object.values(review.decisions);
  return { total: batch.units.length, considered: decisions.filter(item => item.decision !== 'pending').length, recommended: decisions.filter(item => item.decision === 'recommend').length, revise: decisions.filter(item => item.decision === 'revise').length, hold: decisions.filter(item => item.decision === 'hold').length };
}
