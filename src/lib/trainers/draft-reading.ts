export const READING_LABELS = ['TRUE', 'FALSE', 'NOT GIVEN'] as const;
export type ReadingLabel = typeof READING_LABELS[number];
export type DraftReadingClaim = { statement: string; answer: ReadingLabel; evidence: string; explanation: string };
export type DraftReadingRound = { id: string; text: string; claims: DraftReadingClaim[] };
export type DraftReadingPair = { skill: string; rounds: DraftReadingRound[] };
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 6000;
export const isReadingLabel = (value: unknown): value is ReadingLabel => typeof value === 'string' && READING_LABELS.some(label => label === value);
export function parseDraftReading(value: unknown): DraftReadingPair | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== 'reading-evidence-pair-v1' || v.publication_ready !== false || v.difficulty_status !== 'AUTHOR_ESTIMATE_UNCALIBRATED' || !text(v.skill) || !Array.isArray(v.rounds) || v.rounds.length !== 2) return null;
  const rounds: DraftReadingRound[] = [];
  for (const candidate of v.rounds) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
    const r = candidate as Record<string, unknown>;
    if (!text(r.id) || !text(r.text) || !Array.isArray(r.claims) || r.claims.length !== 3) return null;
    const claims: DraftReadingClaim[] = [];
    for (const candidate of r.claims) {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
      const c = candidate as Record<string, unknown>;
      if (!text(c.statement) || !isReadingLabel(c.answer) || !text(c.evidence) || !r.text.includes(c.evidence) || !text(c.explanation)) return null;
      claims.push({ statement: c.statement, answer: c.answer, evidence: c.evidence, explanation: c.explanation });
    }
    if (new Set(claims.map(claim => claim.statement)).size !== claims.length) return null;
    rounds.push({ id: r.id, text: r.text, claims });
  }
  if (rounds[0].id === rounds[1].id || rounds[0].text === rounds[1].text) return null;
  return { skill: v.skill, rounds };
}
