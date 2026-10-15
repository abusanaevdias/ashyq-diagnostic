/** Transcript observations describe text/model alignment, never IELTS or speech quality. */
export const MAX_TRANSCRIPT_CHARS = 6_000;
export const MAX_TRANSCRIPT_WORDS = 600;
export type TranscriptWord = { word: string; start: number; end: number };
export type SpeakingTranscript = {
  format: 'ashyq-speaking-transcript-v1';
  kind: 'manual' | 'openai';
  model: 'whisper-1' | null;
  text: string;
  audioHash: string | null;
  audioSeconds: number | null;
  words: TranscriptWord[] | null;
  timing: 'manual' | 'model-aligned' | 'unavailable';
  savedAt: string;
};
type Token = { value: string; start: number; end: number };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const normalize = (word: string) => word.normalize('NFKC').toLowerCase().replaceAll('’', "'");
export function transcriptTokens(text: string): Token[] {
  return Array.from(text.matchAll(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['’][\p{L}\p{N}][\p{L}\p{M}\p{N}]*)*/gu), match => ({ value: normalize(match[0]), start: match.index!, end: match.index! + match[0].length }));
}
const validText = (text: unknown): text is string => typeof text === 'string' && text.length <= MAX_TRANSCRIPT_CHARS && transcriptTokens(text).length > 0 && transcriptTokens(text).length <= MAX_TRANSCRIPT_WORDS;
export const validSpeakingTranscriptText = validText;
const iso = (s: unknown): s is string => typeof s === 'string' && Number.isFinite(Date.parse(s)) && new Date(s).toISOString() === s;

/** A literal word sequence and sane times are necessary, not proof of correct recognition. */
function validWords(value: unknown, text: string, seconds: number): value is TranscriptWord[] {
  if (!Array.isArray(value) || !value.length || value.length > MAX_TRANSCRIPT_WORDS) return false;
  let previousStart = -1, previousEnd = -1;
  const sequence: string[] = [];
  for (const word of value) {
    if (!object(word) || !exact(word, ['word', 'start', 'end']) || typeof word.word !== 'string' || !word.word.trim() || word.word.length > 80 || typeof word.start !== 'number' || typeof word.end !== 'number' || !Number.isFinite(word.start) || !Number.isFinite(word.end) || word.start < 0 || word.start < previousStart || word.end < previousEnd || word.end < word.start || word.end > seconds + 0.5) return false;
    const tokens = transcriptTokens(word.word);
    if (tokens.length !== 1) return false;
    sequence.push(tokens[0].value); previousStart = word.start; previousEnd = word.end;
  }
  return JSON.stringify(sequence) === JSON.stringify(transcriptTokens(text).map(t => t.value));
}
export function validSpeakingTranscript(value: unknown): value is SpeakingTranscript {
  if (!object(value) || !exact(value, ['format', 'kind', 'model', 'text', 'audioHash', 'audioSeconds', 'words', 'timing', 'savedAt']) || value.format !== 'ashyq-speaking-transcript-v1' || !validText(value.text) || !iso(value.savedAt)) return false;
  if (value.kind === 'manual') return value.model === null && value.audioHash === null && value.audioSeconds === null && value.words === null && value.timing === 'manual';
  if (value.kind !== 'openai' || value.model !== 'whisper-1' || typeof value.audioHash !== 'string' || !/^[a-f0-9]{64}$/.test(value.audioHash) || typeof value.audioSeconds !== 'number' || !Number.isFinite(value.audioSeconds) || value.audioSeconds < 0.2 || value.audioSeconds > 120) return false;
  return value.timing === 'unavailable' ? value.words === null : value.timing === 'model-aligned' && validWords(value.words, value.text, value.audioSeconds);
}
export function manualSpeakingTranscript(text: string, savedAt = new Date().toISOString()): SpeakingTranscript | null {
  const value: SpeakingTranscript = { format: 'ashyq-speaking-transcript-v1', kind: 'manual', model: null, text, audioHash: null, audioSeconds: null, words: null, timing: 'manual', savedAt };
  return validSpeakingTranscript(value) ? value : null;
}
export function providerSpeakingTranscript(value: unknown, audioHash: string, audioSeconds: number, savedAt = new Date().toISOString()): SpeakingTranscript | null {
  if (!object(value) || !validText(value.text)) return null;
  // Unsupported/inconsistent timing remains explicitly unknown; never invent zero gaps.
  const words = validWords(value.words, value.text, audioSeconds) ? value.words.map(w => ({ ...w })) : null;
  const result: SpeakingTranscript = { format: 'ashyq-speaking-transcript-v1', kind: 'openai', model: 'whisper-1', text: value.text, audioHash, audioSeconds, words, timing: words ? 'model-aligned' : 'unavailable', savedAt };
  return validSpeakingTranscript(result) ? result : null;
}
export type TextObservation = { quote: string; occurrences: Array<{ start: number; end: number; second: number | null }> };
export function speakingTextObservations(transcript: SpeakingTranscript, revision = transcript.text) {
  if (!validSpeakingTranscript(transcript) || !validText(revision)) throw Error('Расшифровка несовместима или превышает лимит.');
  const tokens = transcriptTokens(revision), aligned = revision === transcript.text && transcript.timing === 'model-aligned' ? transcript.words : null;
  const evidence = (start: number, size: number) => ({ start: tokens[start].start, end: tokens[start + size - 1].end, second: aligned?.[start].start ?? null });
  const phrases: TextObservation[] = [];
  for (let size = 4; size >= 2; size--) {
    const groups = new Map<string, number[]>();
    for (let i = 0; i + size <= tokens.length; i++) { const key = tokens.slice(i, i + size).map(t => t.value).join(' '), positions = groups.get(key) ?? []; if (!positions.length || i >= positions[positions.length - 1] + size) positions.push(i); groups.set(key, positions); }
    for (const positions of groups.values()) if (positions.length >= 2) {
      const occurrences = positions.map(i => evidence(i, size)), quote = revision.slice(occurrences[0].start, occurrences[0].end);
      if (!phrases.some(p => normalize(p.quote).includes(normalize(quote)))) phrases.push({ quote, occurrences });
    }
  }
  const repeatedWords: TextObservation[] = [];
  for (let i = 1; i < tokens.length; i++) if (tokens[i].value === tokens[i - 1].value) repeatedWords.push({ quote: revision.slice(tokens[i - 1].start, tokens[i].end), occurrences: [evidence(i - 1, 1), evidence(i, 1)] });
  const vocabulary = ['good', 'nice', 'interesting', 'thing', 'things'].flatMap(word => { const positions = tokens.flatMap((t, i) => t.value === word ? [i] : []); return positions.length >= 3 ? [{ word, occurrences: positions.map(i => evidence(i, 1)) }] : []; });
  const gaps = aligned ? aligned.slice(1).flatMap((word, i) => word.start - aligned[i].end >= 1 ? [{ afterWord: i, beforeWord: i + 1, start: aligned[i].end, end: word.start }] : []) : null;
  return { wordCount: tokens.length, repeatedPhrases: phrases.slice(0, 8), repeatedWords, vocabulary, gaps, wordsPerRecordingMinute: aligned && transcript.audioSeconds ? tokens.length * 60 / transcript.audioSeconds : null };
}
