import batch from '@/data/trainer-drafts/batch-01.json';
import batch02 from '@/data/trainer-drafts/batch-02.json';
import batch03 from '@/data/trainer-drafts/batch-03.json';
import batch04 from '@/data/trainer-drafts/batch-04.json';
import batch05 from '@/data/trainer-drafts/batch-05.json';
import batch06 from '@/data/trainer-drafts/batch-06.json';
import batch07 from '@/data/trainer-drafts/batch-07.json';
import batch08 from '@/data/trainer-drafts/batch-08.json';
import batch09 from '@/data/trainer-drafts/batch-09.json';
import batch10 from '@/data/trainer-drafts/batch-10.json';
import batch11 from '@/data/trainer-drafts/batch-11.json';
import batch12 from '@/data/trainer-drafts/batch-12.json';
import batch13 from '@/data/trainer-drafts/batch-13.json';
import batch14 from '@/data/trainer-drafts/batch-14.json';
import batch15 from '@/data/trainer-drafts/batch-15.json';
import batch01v1 from '@/data/trainer-draft-archives/batch-01-v1.json';
import batch02v1 from '@/data/trainer-draft-archives/batch-02-v1.json';
import batch10v1 from '@/data/trainer-draft-archives/batch-10-v1.json';
import batch01v2 from '@/data/trainer-draft-archives/batch-01-v2.0.json';
import batch03v1 from '@/data/trainer-draft-archives/batch-03-v1.json';
import batch04v1 from '@/data/trainer-draft-archives/batch-04-v1.json';
import batch08v1 from '@/data/trainer-draft-archives/batch-08-v1.json';
import batch10v2 from '@/data/trainer-draft-archives/batch-10-v2.0.json';
import batch11v1 from '@/data/trainer-draft-archives/batch-11-v1.json';
import batch13v1 from '@/data/trainer-draft-archives/batch-13-v1.json';

export const draftBatch = batch;
export const draftBatches = [batch, batch02, batch03, batch04, batch05, batch06, batch07, batch08, batch09, batch10, batch11, batch12, batch13, batch14, batch15];
/** Archives retain source-bound decisions; never add them to the active bank or migrate attestations. */
export const draftArchives: DraftBatch[] = [batch01v1,batch02v1,batch10v1,batch01v2,batch03v1,batch04v1,batch08v1,batch10v2,batch11v1,batch13v1];
export type DraftBatch = { batch: string; version: string | number; content_sha256: string; author: string; methodically_approved: boolean; units: DraftUnit[] };
export type DraftUnit = { id: string; title: string; category: string; status: string; student_markdown: string; teacher_markdown: string; language_only_markdown: string | null; exercise_data?: unknown };
export type ReviewDecision = 'pending' | 'recommend' | 'revise' | 'hold';
export type DraftDecision = { decision: ReviewDecision; comment: string; attested: boolean; savedAt: string };
export type DraftReview = { format: 'ashyq-draft-review-v1'; batch: string; source_sha256: string; reviewerId: string; decisions: Record<string, DraftDecision> };
export const MAX_DRAFT_REVIEW_BYTES = 1_300_000;
export const DRAFT_REVIEW_CHANGED = 'ashyq:draft-review-change';
export const decisionSignature = (decision?: DraftDecision): string | null => decision ? JSON.stringify([decision.decision, decision.comment, decision.attested, decision.savedAt]) : null;
export function emptyDraftReview(reviewerId: string, selectedBatch: DraftBatch = batch): DraftReview {
  const batch = selectedBatch;
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
export function parseDraftReview(raw: string | null, reviewerId: string, selectedBatch: DraftBatch = batch): DraftReview | null {
  const batch = selectedBatch;
  if (!raw || raw.length > MAX_DRAFT_REVIEW_BYTES || new TextEncoder().encode(raw).byteLength > MAX_DRAFT_REVIEW_BYTES) return null;
  try {
    const v = JSON.parse(raw) as Partial<DraftReview>;
    if (!v || v.format !== 'ashyq-draft-review-v1' || v.batch !== batch.batch || v.source_sha256 !== batch.content_sha256 || v.reviewerId !== reviewerId || !v.decisions || typeof v.decisions !== 'object' || Array.isArray(v.decisions)) return null;
    if (!Object.entries(v.decisions).every(([id, decision]) => batch.units.some(unit => unit.id === id) && validDecision(decision))) return null;
    return v as DraftReview;
  } catch { return null; }
}
export const reviewKey = (reviewerId: string, selectedBatch: DraftBatch = batch) => `ashyq:trainer-review:v1:${selectedBatch.batch}:${selectedBatch.content_sha256}:${reviewerId}`;

/** Local recommendations cannot publish or change a source material's status. */
export function reviewCounts(review: DraftReview, selectedBatch: DraftBatch = batch) {
  const batch = selectedBatch;
  const decisions = Object.values(review.decisions);
  return { total: batch.units.length, considered: decisions.filter(item => item.decision !== 'pending').length, recommended: decisions.filter(item => item.decision === 'recommend').length, revise: decisions.filter(item => item.decision === 'revise').length, hold: decisions.filter(item => item.decision === 'hold').length };
}
