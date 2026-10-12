import type { TrainerId } from './catalog';
import { writingDrills } from '../writing-trainer/drills';
import { MAX_DRILL_CHOICES, MAX_DRILL_RECORDS } from './drill-records';

export const CHECKPOINT_VERSION = 1;
export const MAX_RECORD_BYTES = 1_500_000;
export const MAX_SNAPSHOT_BYTES = 100_000;
export const MAX_HISTORY = 20;
export const utf8Bytes = (value: string) => new TextEncoder().encode(value).byteLength;
export type Snapshot = Record<string, unknown>;
export type Entry = { id: string; savedAt: string; data: Snapshot };
export type TrainerRecord = { version: 1; trainer: TrainerId; revision: string; checkpoint: Entry | null; history: Entry[] };
type Check = (v: unknown) => boolean;
const object = (v: unknown): v is Snapshot => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const text: Check = v => typeof v === 'string' && v.length <= 12000;
const bool: Check = v => typeof v === 'boolean';
const number: Check = v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e12;
const duration: Check = v => number(v) && (v as number) >= 0;
const integer = (max: number): Check => v => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max;
const one = (...values: unknown[]): Check => v => values.includes(v);
const nullable = (check: Check): Check => v => v === null || check(v);
const array = (check: Check, max = 50): Check => v => Array.isArray(v) && v.length <= max && v.every(check);
const record = (check: Check, key: RegExp = /^(?:[a-z][a-z0-9-]*|[0-9]+)$/i): Check => v => object(v) && Object.keys(v).length <= 100 && Object.entries(v).every(([k, x]) => key.test(k) && !['__proto__', 'constructor', 'prototype'].includes(k) && check(x));
const shape = (fields: Record<string, Check>): Check => v => object(v) && Object.keys(v).length === Object.keys(fields).length && Object.entries(fields).every(([key, check]) => Object.hasOwn(v, key) && check(v[key]));
const shapeWithOptional = (required: Record<string, Check>, optional: Record<string, Check>): Check => v => object(v) && Object.keys(v).every(key => Object.hasOwn(required, key) || Object.hasOwn(optional, key)) && Object.entries(required).every(([key, check]) => Object.hasOwn(v, key) && check(v[key])) && Object.entries(optional).every(([key, check]) => !Object.hasOwn(v, key) || check(v[key]));
const phase = (...values: string[]) => one(...values);
const completedDrills: Check = v => array(one(...writingDrills.map(item => item.id)), writingDrills.length)(v) && new Set(v as string[]).size === (v as string[]).length;
const drillRecordShape = shape({ savedAt: v => typeof v === 'string' && !Number.isNaN(Date.parse(v)), draft: v => typeof v === 'string' && v.length <= 600, choices: array(integer(2), MAX_DRILL_CHOICES), attemptCount: integer(10000), revealedByHelp: nullable(bool) });
const drillRecord: Check = v => drillRecordShape(v) && ((v as Snapshot).attemptCount as number) >= ((v as Snapshot).choices as unknown[]).length;
const drillRecords: Check = v => object(v) && Object.entries(v).every(([id, values]) => writingDrills.some(item => item.id === id) && array(drillRecord, MAX_DRILL_RECORDS)(values));
const index = nullable(integer(1));
const confidence = one('', 'low', 'medium', 'high');
const listeningConfidence = one('', 'Низкая', 'Средняя', 'Высокая');
const tfng = one('TRUE', 'FALSE', 'NOT GIVEN');
const readAttempt = shape({ answer: tfng, evidenceId: text, confidence: one('low', 'medium', 'high') });
const optionAttempt = shape({ prediction: text, choiceIndex: integer(3) });
const reason = one('may-be-correct', 'unsupported', 'too-broad', 'too-narrow', 'too-strong', 'opposite', 'scope-shift', 'wrong-comparison');
const reasonMap = record(reason, /^[0-3]$/);
const distractorAttempt = shape({ answerIndex: integer(3), reasons: reasonMap });
const firstMath = shape({ stepIndex: integer(5), mechanism: text, repairLine: text });
const transferMath = shape({ stepIndex: integer(5), answer: text });
const listeningAttempt = shape({ answer: text, type: text, cue: text, confidence: listeningConfidence, diagnosis: text, level: nullable(integer(3)), repaired: text, textMode: bool, textHelp: bool, stopped: bool });
const overviewAttempt = shape({ selected: array(integer(5), 6), overview: text, evidence: record(integer(20), /^[0-5]$/), reasons: record(integer(20), /^[0-5]$/), correction: text });
const model = shape({ variable: text, setup: number, rate: v => number(v) && (v as number) > 0, total: number, form: one('once', 'repeated', 'omitted') });
const translationAttempt = shape({ model, answer: number, working: text, repair: text });
const method = one('algebra', 'graph', 'table', 'other');
const methodAttempt = shape({ x: number, y: number, working: text, method, seconds: nullable(duration), plan: text });
const marker = shape({ id: integer(1e9), second: nullable(duration), kind: text, note: text });
const take = shapeWithOptional({ url: one(null), seconds: nullable(duration), markers: array(marker, 100), ratings: v => array(text, 4)(v) && (v as unknown[]).length === 4, plan: text, confirmed: bool }, { preparationNotes: v => typeof v === 'string' && v.length <= 3000 });
const revisions = record(text, /^(task|coherence|lexical)$/);
const writingSession = shape({ caseId: one('city-transport', 'school-projects'), stage: phase('grammar', 'task', 'coherence', 'lexical', 'report'), furthestStage: phase('grammar', 'task', 'coherence', 'lexical', 'report'), selectedSentenceId: nullable(text), grammarDrafts: record(text), grammarChecked: bool, appliedGrammar: record(text), revisionDrafts: revisions, postFeedbackDrafts: revisions, revealed: record(bool, /^(task|coherence|lexical)$/), appliedRevisions: revisions });

const schemas: Record<TrainerId, Check> = {
  'reading-evidence': shape({ caseIndex: index, phase: phase('choose', 'first', 'review', 'repair', 'transfer', 'result'), answer: one('', 'TRUE', 'FALSE', 'NOT GIVEN'), evidenceId: text, confidence, first: nullable(readAttempt), repair: nullable(readAttempt), transfer: nullable(readAttempt), reason: text }),
  'sat-optionless': shape({ caseIndex: nullable(integer(4)), phase: phase('choose', 'predict', 'options', 'review', 'result'), round: one('first', 'transfer'), prediction: text, choiceIndex: nullable(integer(3)), first: nullable(optionAttempt), transfer: nullable(optionAttempt) }),
  'sat-distractor': shape({ caseIndex: index, phase: phase('choose', 'answer', 'reasons', 'review', 'result'), round: one('first', 'transfer'), answerIndex: nullable(integer(3)), reasons: reasonMap, first: nullable(distractorAttempt), transfer: nullable(distractorAttempt) }),
  'math-forensics': shape({ caseIndex: index, phase: phase('choose', 'locate', 'feedback', 'continue', 'transfer', 'result'), stepIndex: nullable(integer(5)), mechanism: text, repairLine: text, firstAttempt: nullable(firstMath), ownAnswer: text, transferStep: nullable(integer(5)), transferAnswer: text, transferAttempt: nullable(transferMath) }),
  'listening-replay': shape({ caseIndex: index, round: one('first', 'transfer'), phase: phase('choose', 'predict', 'answer', 'diagnose', 'repair', 'review', 'result'), prediction: text, cue: text, answer: text, confidence: listeningConfidence, diagnosis: text, repair: text, level: integer(3), attemptedLevel: bool, feedback: text, textMode: bool, textHelp: bool, stopped: bool, first: nullable(listeningAttempt), transfer: nullable(listeningAttempt) }),
  'task1-overview': shape({ round: integer(1), phase: phase('start', 'select', 'evidence', 'accuracy', 'review', 'draft', 'revise', 'result'), selected: array(integer(5), 6), overview: text, evidence: record(integer(20), /^[0-5]$/), reasons: record(integer(20), /^[0-5]$/), correction: text, first: nullable(overviewAttempt), transfer: nullable(overviewAttempt), draft: text, revision: text, focus: text, noChanges: bool }),
  'sat-translation': shape({ phase: phase('choose', 'model', 'calculate', 'review', 'result'), caseIndex: integer(1), round: integer(1), variable: text, setup: text, rate: text, total: text, form: text, model: nullable(model), answer: text, working: text, attempts: array(translationAttempt, 2), repair: text }),
  'math-method-switch': shape({ phase: phase('choose', 'solve', 'review', 'result'), index: integer(1), round: integer(1), x: text, y: text, working: text, method: v => v === ' ' || method(v), alternative: v => v === ' ' || method(v), plan: text, attempts: array(methodAttempt, 2) }),
  'speaking-second-take': shape({ phase: phase('start', 'prepare', 'capture', 'review', 'compare', 'result'), takeIndex: integer(2), takes: array(take, 3), notes: text, kind: text, markerNote: text, noMarkers: bool }),
  'writing-task2': shape({ session: writingSession }),
  'writing-drills': shapeWithOptional({ mode: nullable(one('combine', 'grammar', 'argument')), index: integer(1), draft: text, optionsVisible: bool, choice: nullable(integer(2)), attempts: integer(10000), feedback: text, revealed: bool, completed: completedDrills }, { currentChoices: array(integer(2), MAX_DRILL_CHOICES), revealedByHelp: nullable(bool), drillRecords }),
};

export function validSnapshot(trainer: TrainerId, value: unknown): value is Snapshot {
  if (!schemas[trainer](value)) return false;
  const v = value as Snapshot;
  const p = v.phase;
  if ('caseIndex' in v && p !== 'choose' && v.caseIndex === null) return false;
  if (trainer === 'reading-evidence') {
    if (['review', 'repair', 'transfer', 'result'].includes(p as string) && !v.first) return false;
    if (['transfer', 'result'].includes(p as string) && !v.repair) return false;
    if (p === 'result' && !v.transfer) return false;
  }
  if (trainer === 'math-forensics') {
    if (['feedback', 'continue', 'transfer', 'result'].includes(p as string) && !v.firstAttempt) return false;
    if (p === 'result' && !v.transferAttempt) return false;
  }
  if (trainer === 'sat-optionless' || trainer === 'sat-distractor' || trainer === 'listening-replay') {
    if ((v.round === 'transfer' || p === 'result') && !v.first) return false;
    if (p === 'result' && !v.transfer) return false;
    if (p === 'review' && !(v.round === 'first' ? v.first : v.transfer)) return false;
  }
  if (trainer === 'sat-distractor' && p === 'reasons' && v.answerIndex === null) return false;
  if (trainer === 'sat-translation' || trainer === 'math-method-switch') {
    const attempts = v.attempts as unknown[];
    if (v.round === 1 && attempts.length < 1) return false;
    if (p === 'review' && attempts.length !== (v.round as number) + 1) return false;
    if (p === 'result' && attempts.length !== 2) return false;
    if (trainer === 'sat-translation' && ['calculate', 'review', 'result'].includes(p as string) && !v.model) return false;
  }
  if (trainer === 'task1-overview') {
    if (v.round === 1 && !v.first) return false;
    if (['draft', 'revise', 'result'].includes(p as string) && !v.first) return false;
    if (p === 'result' && !v.transfer) return false;
    if (p === 'review' && !(v.round === 0 ? v.first : v.transfer)) return false;
  }
  if (trainer === 'speaking-second-take') {
    const takes = v.takes as unknown[];
    if (['review', 'compare'].includes(p as string) && !takes[v.takeIndex as number]) return false;
    if (p === 'result' && takes.length !== 3) return false;
  }
  return utf8Bytes(JSON.stringify(value)) <= MAX_SNAPSHOT_BYTES;
}

export function emptyRecord(trainer: TrainerId): TrainerRecord {
  return { version: 1, trainer, revision: '', checkpoint: null, history: [] };
}
export function parseRecord(raw: string | null, trainer: TrainerId): TrainerRecord | null {
  if (!raw || raw.length > MAX_RECORD_BYTES || utf8Bytes(raw) > MAX_RECORD_BYTES) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.version !== CHECKPOINT_VERSION || value.trainer !== trainer || !text(value.revision) || !Array.isArray(value.history) || value.history.length > MAX_HISTORY) return null;
    const validEntry = (e: unknown): e is Entry => object(e) && typeof e.id === 'string' && e.id.length <= 100 && typeof e.savedAt === 'string' && !Number.isNaN(Date.parse(e.savedAt)) && validSnapshot(trainer, e.data);
    if (value.checkpoint !== null && !validEntry(value.checkpoint)) return null;
    if (!value.history.every(validEntry)) return null;
    if (new Set(value.history.map(entry => entry.id)).size !== value.history.length) return null;
    return value as TrainerRecord;
  } catch { return null; }
}
export function createEntry(data: Snapshot, now = new Date()): Entry {
  return { id: crypto.randomUUID(), savedAt: now.toISOString(), data };
}
export function archiveEntry(record: TrainerRecord, entry: Entry): TrainerRecord {
  // The same completed snapshot cannot inflate the history counter.
  if (record.history.some(old => JSON.stringify(old.data) === JSON.stringify(entry.data))) return record;
  return { ...record, revision: entry.id, history: [entry, ...record.history].slice(0, MAX_HISTORY) };
}
export const checkpointKey = (trainer: TrainerId, scope: string) => `ashyq:trainers:v${CHECKPOINT_VERSION}:${scope}:${trainer}`;
