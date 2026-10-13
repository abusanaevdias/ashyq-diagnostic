export type DraftSatRound = { id: string; skill: string; passage: string; question: string; choices: { text: string; feedback: string; trap: string; best: boolean }[]; key: number; evidence: string; explanation: string; prediction_guidance: string; repair_prompt: string };
export type DraftSatPair = { kind: 'sat-rw-pair-v1'; publication_ready: false; trainer: 'sat-optionless' | 'sat-distractor'; skill: string; difficulty: string; difficulty_status: 'AUTHOR_ESTIMATE_UNCALIBRATED'; rounds: DraftSatRound[]; review_notes: string[] };
/** Named punctuation keeps choices readable without relying on symbol pronunciation settings. */
export function draftSatChoiceText(value: string): string {
  if (value === ';') return 'Semicolon (;)';
  if (value === ',') return 'Comma (,)';
  if (value === '.') return 'Full stop (.)';
  if (value === '[no punctuation]') return 'No punctuation (leave the gap empty)';
  return value;
}
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 5000;
function parseRound(value: unknown): DraftSatRound | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (!text(v.id) || !text(v.skill) || !text(v.passage) || !text(v.question) || !text(v.evidence) || !text(v.explanation) || !text(v.prediction_guidance) || !text(v.repair_prompt)) return null;
  if (!Number.isInteger(v.key) || (v.key as number) < 0 || (v.key as number) > 3 || !v.passage.includes(v.evidence)) return null;
  if (!Array.isArray(v.choices) || v.choices.length !== 4 || !v.choices.every(choice => choice && typeof choice === 'object' && !Array.isArray(choice) && text(choice.text) && text(choice.feedback) && text(choice.trap) && typeof choice.best === 'boolean' && (choice.trap === 'none') === choice.best)) return null;
  if (v.choices.filter(choice => choice.best).length !== 1 || !v.choices[v.key as number].best || new Set(v.choices.map(choice => choice.text)).size !== 4) return null;
  return { id: v.id, skill: v.skill, passage: v.passage, question: v.question, choices: v.choices.map(choice => ({ text: choice.text, feedback: choice.feedback, trap: choice.trap, best: choice.best })), key: v.key as number, evidence: v.evidence, explanation: v.explanation, prediction_guidance: v.prediction_guidance, repair_prompt: v.repair_prompt };
}
export function parseDraftSatPair(value: unknown): DraftSatPair | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== 'sat-rw-pair-v1' || v.publication_ready !== false || (v.trainer !== 'sat-optionless' && v.trainer !== 'sat-distractor') || !text(v.skill) || !text(v.difficulty) || v.difficulty_status !== 'AUTHOR_ESTIMATE_UNCALIBRATED') return null;
  if (!Array.isArray(v.review_notes) || !v.review_notes.length || v.review_notes.length > 10 || !v.review_notes.every(text) || !Array.isArray(v.rounds) || v.rounds.length !== 2) return null;
  const rounds = v.rounds.map(parseRound);
  if (rounds.some(round => !round || round.skill !== v.skill)) return null;
  const [first, fresh] = rounds as DraftSatRound[];
  if (first.id === fresh.id || first.passage === fresh.passage || first.evidence === fresh.evidence) return null;
  return { kind: 'sat-rw-pair-v1', publication_ready: false, trainer: v.trainer, skill: v.skill, difficulty: v.difficulty, difficulty_status: 'AUTHOR_ESTIMATE_UNCALIBRATED', rounds: [first, fresh], review_notes: [...v.review_notes] };
}
