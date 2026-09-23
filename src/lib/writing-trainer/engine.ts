import type { Criterion, WritingCase } from './cases';

export const stages = ['grammar', 'task', 'coherence', 'lexical', 'report'] as const;
export type Stage = typeof stages[number];
type RevisionCriterion = Exclude<Criterion, 'grammar'>;

export interface TrainerSession {
  caseId: string;
  stage: Stage;
  furthestStage: Stage;
  selectedSentenceId: string | null;
  grammarDrafts: Record<string, string>;
  grammarChecked: boolean;
  appliedGrammar: Record<string, string>;
  revisionDrafts: Partial<Record<RevisionCriterion, string>>;
  revealed: Partial<Record<RevisionCriterion, boolean>>;
  appliedRevisions: Partial<Record<RevisionCriterion, string>>;
}

export function createSession(caseId: string): TrainerSession {
  return {
    caseId,
    stage: 'grammar',
    furthestStage: 'grammar',
    selectedSentenceId: null,
    grammarDrafts: {},
    grammarChecked: false,
    appliedGrammar: {},
    revisionDrafts: {},
    revealed: {},
    appliedRevisions: {},
  };
}

export function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").toLocaleLowerCase('en');
}

export function originalParagraph(essay: WritingCase, paragraphId: string): string {
  return essay.paragraphs.find((paragraph) => paragraph.id === paragraphId)?.sentences.map((sentence) => sentence.text).join(' ') ?? '';
}

export function originalSentence(essay: WritingCase, sentenceId: string): string {
  return essay.paragraphs.flatMap((paragraph) => paragraph.sentences).find((sentence) => sentence.id === sentenceId)?.text ?? '';
}

export function grammarAttemptStatus(essay: WritingCase, session: TrainerSession, sentenceId: string): 'found' | 'missed' | 'review' | 'unnecessary' | 'clean' {
  const issue = essay.grammarIssues.find((item) => item.sentenceId === sentenceId);
  const draft = session.grammarDrafts[sentenceId]?.trim();
  if (!issue) return draft && normalize(draft) !== normalize(originalSentence(essay, sentenceId)) ? 'unnecessary' : 'clean';
  if (!draft || normalize(draft) === normalize(originalSentence(essay, sentenceId))) return 'missed';
  return issue.accepted.some((candidate) => normalize(candidate) === normalize(draft)) ? 'found' : 'review';
}

export function canApplyGrammar(essay: WritingCase, session: TrainerSession, sentenceId: string): boolean {
  return grammarAttemptStatus(essay, session, sentenceId) === 'found';
}

export function canApplyRevision(essay: WritingCase, session: TrainerSession, criterion: RevisionCriterion): boolean {
  return normalize(session.revisionDrafts[criterion] ?? '') === normalize(essay.revisions[criterion].example);
}

export function workingParagraph(essay: WritingCase, session: TrainerSession, paragraphId: string): string {
  const replacement = (Object.keys(essay.revisions) as RevisionCriterion[])
    .find((criterion) => essay.revisions[criterion].paragraphId === paragraphId && session.appliedRevisions[criterion]);
  if (replacement) return session.appliedRevisions[replacement] ?? '';
  const paragraph = essay.paragraphs.find((item) => item.id === paragraphId);
  return paragraph?.sentences.map((sentence) => session.appliedGrammar[sentence.id] ?? sentence.text).join(' ') ?? '';
}

export function practiceScores(essay: WritingCase, session: TrainerSession): Record<Criterion, number> {
  const grammarComplete = essay.grammarIssues.every((issue) => Boolean(session.appliedGrammar[issue.sentenceId]));
  return {
    grammar: Math.min(essay.ceiling.grammar, essay.baseline.grammar + (grammarComplete ? 0.5 : 0)),
    task: Math.min(essay.ceiling.task, essay.baseline.task + (session.appliedRevisions.task ? 0.5 : 0)),
    coherence: Math.min(essay.ceiling.coherence, essay.baseline.coherence + (session.appliedRevisions.coherence ? 0.5 : 0)),
    lexical: Math.min(essay.ceiling.lexical, essay.baseline.lexical + (session.appliedRevisions.lexical ? 0.5 : 0)),
  };
}

export function hasWork(session: TrainerSession): boolean {
  return Object.values(session.grammarDrafts).some(Boolean) || Object.values(session.revisionDrafts).some(Boolean)
    || Object.keys(session.appliedGrammar).length > 0 || Object.keys(session.appliedRevisions).length > 0;
}
