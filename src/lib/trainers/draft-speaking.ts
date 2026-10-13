export type DraftSpeakingTopic = { prompt: string; cues: string[]; followup: string; ideas: string[] };
export type DraftSpeakingPair = { topics: [DraftSpeakingTopic, DraftSpeakingTopic]; skill: string | null };
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000;
const lines = (value: unknown, length: number): value is string[] => Array.isArray(value) && value.length === length && value.every(text) && new Set(value).size === length;
export function parseDraftSpeaking(value: unknown): DraftSpeakingPair | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== 'speaking-pair-v1' || v.publication_ready !== false || !Array.isArray(v.topics) || v.topics.length !== 2 || ('skill' in v && !text(v.skill))) return null;
  const topics: DraftSpeakingTopic[] = [];
  for (const candidate of v.topics) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
    const t = candidate as Record<string, unknown>;
    if (!text(t.prompt) || !lines(t.cues, 4) || !text(t.followup) || !lines(t.ideas, 3)) return null;
    topics.push({ prompt: t.prompt, cues: [...t.cues], followup: t.followup, ideas: [...t.ideas] });
  }
  if (topics[0].prompt === topics[1].prompt) return null;
  return { topics: [topics[0], topics[1]], skill: typeof v.skill === 'string' ? v.skill : null };
}
