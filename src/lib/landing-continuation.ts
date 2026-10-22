import type { RunState } from './types';

/** Existing diagnostic continuation contract, shared with the new public presentation. */
export function continueLabel(run: RunState): string | null {
  if (run.stage === 'quiz' && !run.finished) {
    const index = Math.min(run.currentIndex + 1, run.questionIds.length);
    return `Продолжить · вопрос ${index} из ${run.questionIds.length}`;
  }
  if (run.finished) return 'Посмотреть результат';
  if (run.stage === 'onboarding' && (run.target || run.plannedWhen)) return 'Продолжить настройку';
  return null;
}
