import type { WritingDrill } from '@/lib/writing-trainer/drills';

export type DraftWritingDrill = WritingDrill & {
  kind: 'writing-drill-v1';
  publication_ready: false;
  accepted_alternatives: string[];
  review_notes: string[];
};

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 4000;
const texts = (value: unknown, max: number): value is string[] => Array.isArray(value) && value.length > 0 && value.length <= max && value.every(text);

/** Draft-only adapter. Invalid data is never substituted with another exercise. */
export function parseDraftWriting(value: unknown): DraftWritingDrill | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== 'writing-drill-v1' || v.publication_ready !== false || !text(v.id) || !text(v.title) || !text(v.context) || !text(v.task) || !text(v.example) || !text(v.explanation) || !text(v.criterion)) return null;
  if ((v.mode !== 'combine' && v.mode !== 'grammar' && v.mode !== 'argument') || !texts(v.source, 5) || !texts(v.accepted_alternatives, 10) || !texts(v.review_notes, 10)) return null;
  if (!Array.isArray(v.choices) || v.choices.length !== 3 || !v.choices.every(choice => choice && typeof choice === 'object' && !Array.isArray(choice) && text(choice.text) && text(choice.feedback) && typeof choice.best === 'boolean')) return null;
  if (v.choices.filter(choice => choice.best).length !== 1 || v.example !== v.choices.find(choice => choice.best)?.text || new Set(v.choices.map(choice => choice.text)).size !== 3) return null;
  return { kind: 'writing-drill-v1', publication_ready: false, id: v.id, mode: v.mode, title: v.title, context: v.context, task: v.task, source: [...v.source], choices: v.choices.map(choice => ({ text: choice.text, feedback: choice.feedback, best: choice.best })), example: v.example, explanation: v.explanation, criterion: v.criterion, accepted_alternatives: [...v.accepted_alternatives], review_notes: [...v.review_notes] };
}
