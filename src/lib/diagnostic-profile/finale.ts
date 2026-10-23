import type { DiagnosticResult, RunState } from '@/lib/types';
import { diagnosticRecommendations, freezeDiagnostic } from './model';

export function diagnosticFinale(run: RunState, result: DiagnosticResult) {
  let recommendation;
  try { recommendation = diagnosticRecommendations(freezeDiagnostic(run))[0]; } catch { /* Older local runs keep their existing result. */ }
  const tips: Record<string, { title: string; tip: string; signal: string; tokens: string[] }> = {
    tfng: { title: 'FALSE или NOT GIVEN?', tip: 'Найди опору в тексте. Есть противоречие — FALSE. Информации недостаточно — NOT GIVEN.', signal: 'Не додумывай за текст.', tokens: ['Утверждение', 'Опора в тексте', 'Твой ответ'] },
    'audio-correction': { title: 'Лови окончательный ответ.', tip: 'Если говорящий исправляет себя, проверь новую деталь. Первое услышанное число может оказаться ловушкой.', signal: 'Первый ответ — ещё не финальный.', tokens: ['Первое число', 'Исправление', 'Итоговая деталь'] },
    'sat-model': { title: 'Сначала смысл. Потом расчёт.', tip: 'Назови неизвестную величину и запиши связь из условия. Только после этого подставляй числа.', signal: 'Уравнение начинается с вопроса.', tokens: ['Что ищем?', 'Какая связь?', 'Считаем'] },
    'sat-inference': { title: 'Ответ не шире текста.', tip: 'Проверь, не добавляет ли вариант лишнее условие. Для выбора нужна опора в тексте, а не правдоподобность.', signal: 'Правдоподобно не значит доказано.', tokens: ['Что сказано?', 'Что добавили?', 'Что доказано?'] },
    'sat-transition': { title: 'Связь — до вариантов.', tip: 'Определи отношение между мыслями: причина, контраст или продолжение. Затем выбирай переход.', signal: 'Сначала назови связь.', tokens: ['Первая мысль', 'Связь', 'Следующая мысль'] },
  };
  const noAnswers = result.answeredQuestions === 0;
  // Conservative display rule, not a new score/confidence model.
  const noRange = result.answeredQuestions < Math.ceil(result.totalQuestions / 2);
  const generic = noAnswers
    ? { title: 'Пока мало данных.', tip: 'Пропуск не доказывает слабый навык. Сначала ответь на задания; затем выбирай, что тренировать.', signal: 'Ответы важнее догадки об уровне.', tokens: ['Попробуй', 'Проверь', 'Выбери фокус'] }
    : { title: 'Проверь себя в новом примере.', tip: 'Выбери упражнение своего экзамена. Сначала реши самостоятельно, затем сравни ответ и объяснение.', signal: 'Новый пример — следующий шаг.', tokens: ['Своя попытка', 'Разбор', 'Новый пример'] };
  const detail = !noAnswers && recommendation ? tips[recommendation.id] ?? generic : generic;
  return { ...detail, noAnswers, noRange, recommendation: noAnswers ? undefined : recommendation,
    href: !noAnswers && recommendation ? recommendation.item.href : '/trainers',
    action: !noAnswers && recommendation ? 'Попробовать мой тренажёр' : 'Выбрать упражнение',
    focus: !noAnswers && recommendation ? recommendation.label : 'Самостоятельная практика',
    band: noRange ? '—' : result.band.rangeLabel,
    caution: noRange ? `Для ориентира пока мало ответов: ${result.answeredQuestions} из ${result.totalQuestions}.` : 'Ориентир по короткой диагностике, не официальный балл.',
  };
}
export type DiagnosticFinale = ReturnType<typeof diagnosticFinale>;
