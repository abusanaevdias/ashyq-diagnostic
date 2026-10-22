import { trainerCatalog, type TrainerId } from './catalog';
import type { Snapshot, TrainerRecord } from './checkpoints';
import { practiceOutcome } from './outcomes';

export const practiceNeeds = [
  { id: 'grammar', label: 'Ошибаюсь в грамматике', trainer: 'writing-drills', why: 'Начни с одной конструкции: своя правка, затем сравнение с объяснением.' },
  { id: 'argument', label: 'Слабо развиваю аргументы', trainer: 'writing-drills', why: 'Выбери развитие аргумента: мысль → объяснение → пример. Затем перенеси это в эссе.' },
  { id: 'essay', label: 'Хочу улучшить эссе', trainer: 'writing-task2', why: 'Поработай с готовым учебным эссе: грамматика, аргументы, связность и лексика по очереди.' },
  { id: 'reading', label: 'Путаю FALSE и NOT GIVEN', trainer: 'reading-evidence', why: 'Проверь отдельно ответ и предложение, которым ты его обосновываешь.' },
  { id: 'listening', label: 'Теряю ответ в аудио', trainer: 'listening-replay', why: 'Услышь исправление говорящего, затем проверь окончательный ответ.' },
  { id: 'speaking', label: 'Не знаю, как улучшить речь', trainer: 'speaking-second-take', why: 'Запиши ответ, отметь конкретный момент и повтори с одним изменением. Это самопроверка, без AI-оценки.' },
  { id: 'overview', label: 'Не вижу главного на графике', trainer: 'task1-overview', why: 'Выдели общие тенденции и подкрепи их данными перед полным отчётом.' },
  { id: 'condition', label: 'Ошибаюсь в условиях SAT Math', trainer: 'sat-translation', why: 'Сначала назови переменную и собери модель условия. Считай после этого.' },
  { id: 'options', label: 'Путаюсь в вариантах SAT', trainer: 'sat-distractor', why: 'Проверь не только выбор ответа, но и причину, по которой каждый другой вариант не подходит.' },
  { id: 'math', label: 'Не нахожу ошибку в решении', trainer: 'math-forensics', why: 'Найди первый неверный переход, исправь его и попробуй другую задачу.' },
] as const satisfies readonly { id: string; label: string; trainer: TrainerId; why: string }[];

export function checkpointStage(data: Snapshot): string {
  const session = data.session as Snapshot | undefined;
  const stage = session?.stage ?? data.phase;
  const labels: Record<string, string> = {
    choose: 'Выбор примера', start: 'Подготовка', first: 'Первая попытка', predict: 'Свой прогноз', options: 'Выбор ответа',
    review: 'Разбор', feedback: 'Разбор', repair: 'Исправление', transfer: 'Новый пример', result: 'Итог занятия',
    reasons: 'Обоснование', continue: 'Продолжение решения', diagnose: 'Разбор затруднения', model: 'Модель условия',
    calculate: 'Расчёт', solve: 'Своё решение', select: 'Главное на графике', draft: 'Свой текст', revise: 'Редактура',
    prepare: 'Подготовка ответа', capture: 'Запись ответа', compare: 'Сравнение', grammar: 'Грамматика', task: 'Аргументы',
    coherence: 'Связность', lexical: 'Лексика', report: 'Итог занятия',
  };
  return typeof stage === 'string' ? labels[stage] ?? 'Текущий шаг' : 'Короткое упражнение';
}

export function latestCompleted(trainer: TrainerId, record: TrainerRecord | null) {
  const entry = [record?.checkpoint, ...(record?.history ?? [])]
    .filter(entry => entry && practiceOutcome(trainer, entry.data)?.complete)
    .sort((a, b) => Date.parse(b!.savedAt) - Date.parse(a!.savedAt))[0];
  const outcome = entry && practiceOutcome(trainer, entry.data);
  return entry && outcome ? { entry, outcome } : null;
}

export function practiceJourney(entries: { item: typeof trainerCatalog[number]; record: TrainerRecord | null }[]) {
  const saved = entries.flatMap(({ item, record }) => record?.checkpoint ? [{ item, entry: record.checkpoint, outcome: practiceOutcome(item.id, record.checkpoint.data) }] : [])
    .sort((a, b) => Date.parse(b.entry.savedAt) - Date.parse(a.entry.savedAt));
  const unfinished = saved.filter(row => row.outcome && !row.outcome.complete);
  const repeat = entries.flatMap(({ item, record }) => {
    const latest = latestCompleted(item.id, record);
    return latest?.outcome.repeat === true ? [{ item, ...latest }] : [];
  }).sort((a, b) => Date.parse(b.entry.savedAt) - Date.parse(a.entry.savedAt));
  return { latest: unfinished[0] ?? saved[0] ?? null, repeat };
}
