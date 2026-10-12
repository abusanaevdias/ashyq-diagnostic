export type DraftMathFamily = 'translation' | 'forensics' | 'method-switch';
export type DraftMathRound = { id: string; prompt: string; variable: string; unit: string; answer: number; corrected_working: string[]; explanation: string; models?: { equation: string; best: boolean; feedback: string }[]; steps?: { statement: string; valid: boolean; explanation: string }[]; first_invalid?: number; methods?: { title: string; working: string[]; tradeoff: string }[] };
export type DraftMathPair = { family: DraftMathFamily; skill: string; rounds: DraftMathRound[] };
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 5000;
const lines = (value: unknown): value is string[] => Array.isArray(value) && value.length >= 2 && value.length <= 12 && value.every(text);
export function parseDraftMathNumber(value: string): number | null {
  const normalized = value.trim();
  if (normalized.length > 15 || !/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(normalized)) return null;
  const number = Number(normalized.replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}
export function parseDraftMath(value: unknown): DraftMathPair | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.kind !== 'sat-math-pair-v1' || v.publication_ready !== false || !text(v.skill) || v.difficulty_status !== 'AUTHOR_ESTIMATE_UNCALIBRATED' || (v.family !== 'translation' && v.family !== 'forensics' && v.family !== 'method-switch') || !Array.isArray(v.rounds) || v.rounds.length !== 2) return null;
  const rounds: DraftMathRound[] = [];
  for (const value of v.rounds) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const r = value as Record<string, unknown>;
    if (!text(r.id) || !text(r.prompt) || !text(r.variable) || typeof r.unit !== 'string' || r.unit.length > 200 || typeof r.answer !== 'number' || !Number.isFinite(r.answer) || Math.abs(r.answer) > 1e12 || parseDraftMathNumber(String(r.answer)) === null || !lines(r.corrected_working) || !text(r.explanation)) return null;
    const round: DraftMathRound = { id: r.id, prompt: r.prompt, variable: r.variable, unit: r.unit, answer: r.answer, corrected_working: [...r.corrected_working], explanation: r.explanation };
    if (v.family === 'translation') {
      if (!Array.isArray(r.models) || r.models.length !== 3 || !r.models.every(model => model && typeof model === 'object' && !Array.isArray(model) && text(model.equation) && text(model.feedback) && typeof model.best === 'boolean') || r.models.filter(model => model.best).length !== 1 || new Set(r.models.map(model => model.equation)).size !== 3) return null;
      round.models = r.models.map(model => ({ equation: model.equation, best: model.best, feedback: model.feedback }));
    }
    if (v.family === 'forensics') {
      if (!Array.isArray(r.steps) || r.steps.length < 2 || r.steps.length > 10 || !r.steps.every(step => step && typeof step === 'object' && !Array.isArray(step) && text(step.statement) && text(step.explanation) && typeof step.valid === 'boolean') || !Number.isInteger(r.first_invalid) || (r.first_invalid as number) < 0 || r.steps.findIndex(step => !step.valid) !== r.first_invalid) return null;
      round.steps = r.steps.map(step => ({ statement: step.statement, valid: step.valid, explanation: step.explanation })); round.first_invalid = r.first_invalid as number;
    }
    if (v.family === 'method-switch') {
      if (!Array.isArray(r.methods) || r.methods.length < 2 || r.methods.length > 4 || !r.methods.every(method => method && typeof method === 'object' && !Array.isArray(method) && text(method.title) && lines(method.working) && text(method.tradeoff)) || new Set(r.methods.map(method => method.title)).size !== r.methods.length) return null;
      round.methods = r.methods.map(method => ({ title: method.title, working: [...method.working], tradeoff: method.tradeoff }));
    }
    rounds.push(round);
  }
  if (rounds[0].id === rounds[1].id || rounds[0].prompt === rounds[1].prompt) return null;
  return { family: v.family, skill: v.skill, rounds };
}
export function draftMathChoiceLabel(item: DraftMathRound, family: DraftMathFamily, choice: number): string {
  if (family === 'translation') return item.models?.[choice]?.best ? 'Выбор модели совпал с ключом.' : 'Выбор модели нужно пересмотреть; верное число не исправляет выбранную модель.';
  if (family === 'forensics') return choice === item.first_invalid ? 'Первый неверный переход выбран по ключу.' : item.steps?.[choice]?.valid ? 'Выбранная строка допустима; первый неверный переход находится в другой строке.' : 'Выбрана неверная строка, но есть более ранний неверный переход.';
  return 'Выбран допустимый способ для сравнения. Качество собственных действий проверяется вручную.';
}
