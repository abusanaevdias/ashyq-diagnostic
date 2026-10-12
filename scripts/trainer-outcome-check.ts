import assert from 'node:assert/strict';
import fs from 'node:fs';
import { trainerCatalog, type TrainerId } from '../src/lib/trainers/catalog';
import { practiceOutcome } from '../src/lib/trainers/outcomes';
import { readingCases } from '../src/lib/reading-evidence/cases';
import { optionlessCases } from '../src/lib/sat-optionless/cases';
import { distractorCases, expectedReason } from '../src/lib/sat-distractor/cases';
import { listeningCases } from '../src/lib/listening-replay/cases';
import { overviewItems } from '../src/lib/task1-overview/cases';
import { mathForensicsCases } from '../src/lib/math-forensics/cases';
import { translationCases } from '../src/lib/sat-translation/cases';
import { cases as methods } from '../src/lib/math-method-switch/cases';
import { writingCases } from '../src/lib/writing-trainer/cases';
import { createSession } from '../src/lib/writing-trainer/engine';
import { writingDrills } from '../src/lib/writing-trainer/drills';
import type { Snapshot } from '../src/lib/trainers/checkpoints';

// Defaults captured through the real UI by trainer-checkpoint-check.ts.
const defaults = JSON.parse(fs.readFileSync('artifacts/trainers-complete-033/checkpoint-defaults.json', 'utf8')) as Record<TrainerId, Snapshot>;
for (const item of trainerCatalog) {
  assert.equal(practiceOutcome(item.id, defaults[item.id])?.complete, false, item.id);
  assert.equal(practiceOutcome(item.id, { ...defaults[item.id], alien: true }), null);
}
const read = (task: typeof readingCases[number]['task']) => ({ answer: task.answer, evidenceId: task.evidenceId, confidence: 'high' });
const reading = { ...defaults['reading-evidence'], caseIndex: 0, phase: 'result', first: { ...read(readingCases[0].task), answer: 'TRUE' }, repair: read(readingCases[0].task), transfer: read(readingCases[0].transfer) };
assert.equal(practiceOutcome('reading-evidence', reading)?.repeat, false, 'a repaired first mistake must not erase successful fresh transfer');
assert.equal(practiceOutcome('reading-evidence', reading)?.checks[0].matches, false);
assert.equal(practiceOutcome('reading-evidence', { ...reading, transfer: { ...reading.transfer, answer: 'TRUE' } })?.repeat, true);
assert.equal(practiceOutcome('reading-evidence', { ...reading, transfer: { ...reading.transfer, evidenceId: 't1' } })?.repeat, true, 'right answer without relevant evidence needs review');

const completed: Partial<Record<TrainerId, Snapshot>> = { 'reading-evidence': reading };
completed['sat-optionless'] = { ...defaults['sat-optionless'], caseIndex: 0, phase: 'result', first: { prediction: 'own prediction', choiceIndex: optionlessCases[0].first.correctIndex }, transfer: { prediction: 'own prediction', choiceIndex: optionlessCases[0].transfer.correctIndex } };
const distractor = distractorCases[0];
const da = (item: typeof distractor.first) => ({ answerIndex: item.correctIndex, reasons: Object.fromEntries(item.choices.map((_, i) => [i, expectedReason(item, i)])) });
completed['sat-distractor'] = { ...defaults['sat-distractor'], caseIndex: 0, phase: 'result', first: da(distractor.first), transfer: da(distractor.transfer) };
const math = mathForensicsCases[0];
completed['math-forensics'] = { ...defaults['math-forensics'], caseIndex: 0, phase: 'result', firstAttempt: { stepIndex: math.wrongStepIndex, mechanism: math.mechanism, repairLine: 'own line' }, ownAnswer: String(math.finalAnswer), transferAttempt: { stepIndex: math.transfer.wrongStepIndex, answer: String(math.transfer.answer) } };
const la = (item: typeof listeningCases[number]['first']) => ({ answer: item.answer, type: item.answerType, cue: item.cue, confidence: 'high', diagnosis: 'Не было затруднений', level: null, repaired: item.answer, textMode: false, textHelp: false, stopped: false });
completed['listening-replay'] = { ...defaults['listening-replay'], caseIndex: 0, phase: 'result', first: la(listeningCases[0].first), transfer: la(listeningCases[0].transfer) };
const oa = (item: typeof overviewItems[number]) => ({ selected: [0,1,2], overview: 'own overview', evidence: Object.fromEntries([0,1,2].map(i => [i, item.claims[i].evidence])), reasons: Object.fromEntries(item.inaccurate.map((entry, i) => [i, entry.reason])), correction: 'own correction' });
completed['task1-overview'] = { ...defaults['task1-overview'], phase: 'result', round: 1, first: oa(overviewItems[0]), transfer: oa(overviewItems[1]) };
const ta = (item: typeof translationCases[number]['items'][number]) => ({ model: { variable: item.variable, setup: item.setup, rate: item.rate, total: item.total, form: 'once' }, answer: item.answer, working: 'own work', repair: 'own plan' });
const translationAttempts = translationCases[0].items.map(ta);
completed['sat-translation'] = { ...defaults['sat-translation'], phase: 'result', round: 1, attempts: translationAttempts, model: translationAttempts[1].model };
completed['math-method-switch'] = { ...defaults['math-method-switch'], phase: 'result', round: 1, attempts: methods[0].items.map(item => ({ x: item.x, y: item.y, working: 'own work', method: 'algebra', seconds: null, plan: 'own plan' })) };
for (const [id, data] of Object.entries(completed)) {
  const outcome = practiceOutcome(id as TrainerId, data);
  assert.ok(outcome?.complete, `${id}: valid completion`);
  assert.equal(outcome.repeat, false, `${id}: new closed checks match`);
  assert.ok(outcome.checks.some(check => check.stage === 'transfer'));
  assert.ok(outcome.limitation.length > 0);
}
const badReasons = { ...da(distractor.transfer), reasons: {} };
assert.equal(practiceOutcome('sat-distractor', { ...completed['sat-distractor'], transfer: badReasons })?.repeat, true);
const textListening = practiceOutcome('listening-replay', { ...completed['listening-replay'], transfer: { ...la(listeningCases[0].transfer), textMode: true, textHelp: true, level: 3 } });
assert.ok(textListening?.checks.some(check => check.label.includes('по тексту')));
assert.ok(textListening?.checks.some(check => check.label.includes('с помощью')));
const duplicateOverview = { ...oa(overviewItems[1]), selected: [0,0,0] };
assert.equal(practiceOutcome('task1-overview', { ...completed['task1-overview'], transfer: duplicateOverview })?.repeat, true, 'duplicate choices must not look like three features');
const session = { ...createSession(writingCases[0].id), stage: 'report', furthestStage: 'report' };
assert.equal(practiceOutcome('writing-task2', { session })?.repeat, true, 'missing grammar drafts need practice');
const unknownDrafts = Object.fromEntries(writingCases[0].grammarIssues.map(issue => [issue.sentenceId, 'A different potentially correct sentence.']));
assert.equal(practiceOutcome('writing-task2', { session: { ...session, grammarDrafts: unknownDrafts } })?.repeat, null, 'unrecognized alternatives are unknown, not incorrect');
assert.equal(practiceOutcome('writing-drills', { ...defaults['writing-drills'], completed: [writingDrills[0].id] })?.repeat, null);
assert.equal(practiceOutcome('writing-drills', { ...defaults['writing-drills'], completed: [writingDrills[0].id, writingDrills[0].id] }), null, 'duplicate IDs cannot inflate the completion count');
const take = { url: null, seconds: null, markers: [], ratings: ['', '', '', ''], plan: '', confirmed: true };
assert.equal(practiceOutcome('speaking-second-take', { ...defaults['speaking-second-take'], phase: 'result', takes: [take, take, take] })?.repeat, null);
console.log('PASS eleven outcome types; closed-answer keys, evidence, fresh transfer, duplicates, text/audio help and unknown/self-assessed responses');
