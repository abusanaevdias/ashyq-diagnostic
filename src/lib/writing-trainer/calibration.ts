import { type Criterion, type WritingCase } from './cases';
import { createSession, originalParagraph, workingParagraph } from './engine';

export type CalibrationVersion = 'A' | 'B';
export type CalibrationBand = '' | 'insufficient' | `${number}`;

export interface TeacherJudgment {
  band: CalibrationBand;
  excerpt: string;
  rationale: string;
}

export type CalibrationWorksheet = Record<CalibrationVersion, Record<Criterion, TeacherJudgment>>;

export const calibrationCriteria: { id: Criterion; label: string; cue: string }[] = [
  { id: 'task', label: 'Task Response', cue: 'Ответ на все части задания, позиция и развитие аргументов по всему эссе.' },
  { id: 'coherence', label: 'Coherence and Cohesion', cue: 'Логика абзацев, ход мысли и связи между предложениями во всём тексте.' },
  { id: 'lexical', label: 'Lexical Resource', cue: 'Точность и диапазон слов, сочетаемость, орфография и словообразование.' },
  { id: 'grammar', label: 'Grammatical Range and Accuracy', cue: 'Разнообразие конструкций, грамматика и пунктуация во всём тексте.' },
];

export function createWorksheet(): CalibrationWorksheet {
  const emptyVersion = (): Record<Criterion, TeacherJudgment> => ({
    task: { band: '', excerpt: '', rationale: '' },
    coherence: { band: '', excerpt: '', rationale: '' },
    lexical: { band: '', excerpt: '', rationale: '' },
    grammar: { band: '', excerpt: '', rationale: '' },
  });
  return { A: emptyVersion(), B: emptyVersion() };
}

export function essayParagraphs(essay: WritingCase, version: CalibrationVersion): string[] {
  if (version === 'A') return essay.paragraphs.map((paragraph) => originalParagraph(essay, paragraph.id));

  const session = createSession(essay.id);
  for (const issue of essay.grammarIssues) session.appliedGrammar[issue.sentenceId] = issue.accepted[0];
  for (const criterion of ['task', 'coherence', 'lexical'] as const) session.appliedRevisions[criterion] = essay.revisions[criterion].example;
  return essay.paragraphs.map((paragraph) => workingParagraph(essay, session, paragraph.id));
}

function normalizeEvidence(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

export function excerptMatches(paragraphs: string[], excerpt: string): boolean {
  const normalizedExcerpt = normalizeEvidence(excerpt);
  return Boolean(normalizedExcerpt) && normalizeEvidence(paragraphs.join(' ')).includes(normalizedExcerpt);
}

export function judgmentComplete(paragraphs: string[], judgment: TeacherJudgment): boolean {
  if (!judgment.band || !judgment.rationale.trim()) return false;
  if (judgment.band === 'insufficient') return !judgment.excerpt.trim() || excerptMatches(paragraphs, judgment.excerpt);
  return excerptMatches(paragraphs, judgment.excerpt);
}

export function worksheetHasWork(worksheet: CalibrationWorksheet): boolean {
  return Object.values(worksheet).some((version) => Object.values(version).some((judgment) => Boolean(judgment.band || judgment.excerpt || judgment.rationale)));
}

export function direction(from: CalibrationBand, to: CalibrationBand): 'up' | 'same' | 'down' | 'unknown' {
  if (!from || !to || from === 'insufficient' || to === 'insufficient') return 'unknown';
  const change = Number(to) - Number(from);
  return change > 0 ? 'up' : change < 0 ? 'down' : 'same';
}

export function wordCount(paragraphs: string[]): number {
  return paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
}
