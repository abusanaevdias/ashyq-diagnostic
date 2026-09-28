export type FeedbackCriterion = 'grammar' | 'task' | 'coherence' | 'lexical';

export type WritingFeedback = {
  summary: string;
  strengths: string[];
  issues: Array<{ quote: string; why: string; suggestion: string }>;
  nextAction: string;
};

export const feedbackCriteria: readonly FeedbackCriterion[] = ['grammar', 'task', 'coherence', 'lexical'];

/** A schema-conforming model result can still be wrong or ungrounded. */
export function sanitizeFeedback(value: unknown, essay: string): WritingFeedback | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  if (typeof result.summary !== 'string' || typeof result.nextAction !== 'string' || !Array.isArray(result.strengths) || !Array.isArray(result.issues)) return null;
  const strengths = result.strengths.filter((item): item is string => typeof item === 'string').slice(0, 2).map((item) => item.trim().slice(0, 300)).filter(Boolean);
  const issues = result.issues.slice(0, 4).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const issue = item as Record<string, unknown>;
    if (typeof issue.quote !== 'string' || typeof issue.why !== 'string' || typeof issue.suggestion !== 'string') return [];
    const quote = issue.quote.trim();
    if (!quote || quote.length > 220 || !essay.includes(quote)) return [];
    const why = issue.why.trim().slice(0, 500);
    const suggestion = issue.suggestion.trim().slice(0, 500);
    if (!why || !suggestion) return [];
    return [{ quote, why, suggestion }];
  });
  const summary = result.summary.trim().slice(0, 500);
  const nextAction = result.nextAction.trim().slice(0, 400);
  if (!summary || !nextAction) return null;
  return { summary, strengths, issues, nextAction };
}
