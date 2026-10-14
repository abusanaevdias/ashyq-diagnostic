import { readingCases, evidenceMatches, type TfngAnswer } from '../reading-evidence/cases';
import { optionlessCases } from '../sat-optionless/cases';
import { distractorCases, expectedReason, type ReasonId } from '../sat-distractor/cases';
import { listeningCases, answerMatches } from '../listening-replay/cases';
import { mathForensicsCases, numericAnswerMatches } from '../math-forensics/cases';
import { overviewItems } from '../task1-overview/cases';
import { translationCases, modelMatches, near, type Model } from '../sat-translation/cases';
import { cases as methodCases } from '../math-method-switch/cases';
import { writingCases } from '../writing-trainer/cases';
import { grammarAttemptStatus, type TrainerSession } from '../writing-trainer/engine';
import { trainerById, type TrainerId } from './catalog';
import { validSnapshot, snapshotByteLimit, type Snapshot } from './checkpoints';

export type OutcomeCheck = { label: string; matches: boolean | null; stage: 'first' | 'repair' | 'transfer' | 'self' };
export type PracticeOutcome = { complete: boolean; checks: OutcomeCheck[]; repeat: boolean | null; next: TrainerId; advice: string; limitation: string };
const check = (label: string, matches: boolean | null, stage: OutcomeCheck['stage']): OutcomeCheck => ({ label, matches, stage });
const stageLabels = ['Первый пример', 'Новый пример'];
type ReadingAttempt = { answer: TfngAnswer; evidenceId: string };
type OverviewAttempt = { selected: number[]; evidence: Record<number, number>; reasons: Record<number, number> };

/** Only authored closed-answer checks are scored. Local records are never verified achievements. */
export function practiceOutcome(trainer: TrainerId, value: unknown, byteLimit=snapshotByteLimit(trainer)): PracticeOutcome | null {
  if (!validSnapshot(trainer, value,byteLimit)) return null;
  const v: Snapshot = value;
  const complete = trainer === 'writing-task2' ? (v.session as TrainerSession).stage === 'report'
    : trainer === 'writing-drills' ? v.mode === null && (v.completed as string[]).length > 0 : v.phase === 'result';
  const outcome: PracticeOutcome = { complete, checks: [], repeat: null, next: trainer, advice: 'Продолжи сохранённую попытку. Разбор и новый пример появятся после самостоятельного ответа.', limitation: 'Результат относится только к этим заданиям. Это не экзаменационный балл и не подтверждение устойчивого навыка.' };
  if (!complete) return outcome;
  if (trainer === 'reading-evidence') {
    const item = readingCases[v.caseIndex as number];
    const first = v.first as ReadingAttempt, repair = v.repair as ReadingAttempt, transfer = v.transfer as ReadingAttempt;
    outcome.checks = [check('Первый текст: ответ', first.answer === item.task.answer, 'first'), check('Первый текст: опора', evidenceMatches(item.task, first.evidenceId), 'first'), check('После разбора: ответ', repair.answer === item.task.answer, 'repair'), check('После разбора: опора', evidenceMatches(item.task, repair.evidenceId), 'repair'), check('Новый текст: ответ', transfer.answer === item.transfer.answer, 'transfer'), check('Новый текст: опора', evidenceMatches(item.transfer, transfer.evidenceId), 'transfer')];
    outcome.advice = 'Проверь ограничители и отличие противоречия от отсутствия информации. Затем реши другой текст без открытого разбора.';
  } else if (trainer === 'sat-optionless') {
    const item = optionlessCases[v.caseIndex as number];
    outcome.checks = [check('Первый вопрос: выбранный ответ', (v.first as {choiceIndex: number}).choiceIndex === item.first.correctIndex, 'first'), check('Новый вопрос: выбранный ответ', (v.transfer as {choiceIndex: number}).choiceIndex === item.transfer.correctIndex, 'transfer')];
    outcome.advice = 'Сначала сформулируй смысл или связь без вариантов. Затем проверь, какой вариант передаёт именно этот смысл.';
    outcome.limitation += ' Свободный прогноз не оценён автоматически.';
  } else if (trainer === 'sat-distractor') {
    const item = distractorCases[v.caseIndex as number];
    for (const [index, name] of (['first', 'transfer'] as const).entries()) {
      const attempt = v[name] as { answerIndex: number; reasons: Record<number, ReasonId> };
      outcome.checks.push(check(`${stageLabels[index]}: ответ`, attempt.answerIndex === item[name].correctIndex, index ? 'transfer' : 'first'));
      outcome.checks.push(check(`${stageLabels[index]}: причины для четырёх вариантов`, item[name].choices.every((_, i) => attempt.reasons[i] === expectedReason(item[name], i)), index ? 'transfer' : 'first'));
    }
    outcome.advice = 'Для каждого неверного варианта назови конкретный сдвиг смысла: шире, уже, сильнее или без опоры в тексте.';
    outcome.next = 'sat-optionless';
  } else if (trainer === 'math-forensics') {
    const item = mathForensicsCases[v.caseIndex as number];
    const first = v.firstAttempt as { stepIndex: number; mechanism: string }, transfer = v.transferAttempt as {stepIndex: number; answer: string};
    outcome.checks = [check('Первое решение: ошибочный переход', first.stepIndex === item.wrongStepIndex, 'first'), check('Первое решение: механизм ошибки', first.mechanism === item.mechanism, 'first'), check('После разбора: итог решения', numericAnswerMatches(v.ownAnswer as string, item.finalAnswer), 'repair'), check('Новая задача: переход', transfer.stepIndex === item.transfer.wrongStepIndex, 'transfer'), check('Новая задача: итог', numericAnswerMatches(transfer.answer, item.transfer.answer), 'transfer')];
    outcome.advice = 'Проверяй равенство на каждом переходе и отмечай, от какой величины берётся процент. Повтори на другой паре условий.';
    outcome.next = 'sat-translation';
    outcome.limitation += ' Свободная правка строки не оценена автоматически.';
  } else if (trainer === 'listening-replay') {
    const item = listeningCases[v.caseIndex as number];
    for (const [index, name] of (['first', 'transfer'] as const).entries()) {
      const attempt = v[name] as { answer: string; repaired: string; textMode: boolean; textHelp: boolean; stopped: boolean; level: number | null };
      const help = attempt.textMode || attempt.textHelp || attempt.level !== null;
      outcome.checks.push(check(`${stageLabels[index]}: исходный ответ${attempt.textMode ? ' по тексту' : ''}${attempt.stopped ? ' · прослушивание прерывалось' : ''}`, answerMatches(attempt.answer, item[name]), index ? 'transfer' : 'first'));
      outcome.checks.push(check(`${stageLabels[index]}: исправление${help ? ' с помощью' : ''}`, answerMatches(attempt.repaired, item[name]), 'repair'));
    }
    outcome.advice = 'Послушай другую запись без полного текста. Проверь окончательный ответ после исправления говорящего и точное написание.';
    outcome.limitation += ' Текстовый режим, помощь и прерывание видны в подписях. Они не равны непрерывному самостоятельному прослушиванию. Самоописание затруднения не является диагнозом системы.';
  } else if (trainer === 'task1-overview') {
    for (const [index, name] of (['first', 'transfer'] as const).entries()) {
      const item = overviewItems[index], attempt = v[name] as OverviewAttempt;
      const selected = new Set(attempt.selected);
      outcome.checks.push(check(`${stageLabels[index]}: три главные особенности`, selected.size === 3 && [...selected].every(i => item.claims[i]?.main), index ? 'transfer' : 'first'));
      outcome.checks.push(check(`${stageLabels[index]}: опора для выбранных особенностей`, selected.size === 3 && [...selected].every(i => attempt.evidence[i] === item.claims[i]?.evidence), index ? 'transfer' : 'first'));
      outcome.checks.push(check(`${stageLabels[index]}: виды неточностей`, item.inaccurate.every((entry, i) => attempt.reasons[i] === entry.reason), index ? 'transfer' : 'first'));
    }
    outcome.advice = 'Отдели общий тренд и устойчивый ранг от отдельной цифры. Для каждой фразы найди данные; не добавляй причины без источника.';
    outcome.limitation += ' Overview, полный ответ и его редактура не получили автоматической оценки.';
  } else if (trainer === 'sat-translation') {
    const items = translationCases[v.caseIndex as number].items;
    (v.attempts as {model: Model; answer: number}[]).forEach((attempt, index) => {
      outcome.checks.push(check(`${stageLabels[index]}: модель условия`, modelMatches(attempt.model, items[index]), index ? 'transfer' : 'first'));
      outcome.checks.push(check(`${stageLabels[index]}: числовой ответ`, near(attempt.answer, items[index].answer), index ? 'transfer' : 'first'));
    });
    outcome.advice = 'Назови переменную и единицы. Отдели разовый платёж от повторяющегося, запиши уравнение и только потом считай.';
    outcome.next = 'math-forensics';
  } else if (trainer === 'math-method-switch') {
    const items = methodCases[v.index as number].items;
    (v.attempts as {x: number; y: number}[]).forEach((attempt, index) => outcome.checks.push(check(`${stageLabels[index]}: координаты по условию`, attempt.x === items[index].x && attempt.y === items[index].y, index ? 'transfer' : 'first')));
    outcome.advice = 'Проверь найденные координаты подстановкой и ограничениями вопроса. На новой задаче сравни другой способ решения.';
    outcome.limitation += ' Качество записанного решения и выбор метода автоматически не оценивались.';
  } else if (trainer === 'writing-task2') {
    const session = v.session as TrainerSession, essay = writingCases.find(item => item.id === session.caseId)!;
    const statuses = essay.grammarIssues.map(issue => grammarAttemptStatus(essay, session, issue.sentenceId));
    outcome.checks = [check('Грамматические правки совпали с допустимыми вариантами', statuses.every(status => status === 'found') ? true : statuses.includes('review') ? null : false, 'self'), check('Аргументы, связность и лексика: самостоятельное сравнение', null, 'self')];
    outcome.repeat = statuses.some(status => status === 'missed') ? true : null;
    outcome.next = 'writing-drills';
    outcome.advice = 'Отработай грамматику и развитие аргумента на коротких заданиях, затем перепиши абзац другого эссе. Неизвестные системе формулировки требуют отдельной проверки.';
    outcome.limitation = 'Сравнение с ограниченным списком авторских правок не оценивает весь текст. Применение готового образца не доказывает самостоятельное улучшение или рост band.';
  } else if (trainer === 'speaking-second-take') {
    outcome.checks = [check('Три ответа и наблюдения: самопроверка', null, 'self')];
    outcome.advice = 'Прослушай свои отметки и выбери одно конкретное изменение для следующего ответа. Если нужно внешнее мнение, покажи учителю скачанную аудиозапись отдельно.';
    outcome.limitation = 'Заметки и выбранные аспекты речи — самооценка. Произношение, беглость и band системой не проверены; аудио не входит в историю.';
  } else {
    outcome.checks = [check(`Коротких заданий отмечено завершёнными: ${(v.completed as string[]).length}`, null, 'self')];
    outcome.next = 'writing-task2';
    outcome.advice = 'Примени отработанную конструкцию и цепочку «мысль → объяснение → пример» в абзаце эссе.';
    outcome.limitation = 'Счётчик завершённых заданий не является оценкой точности или общего уровня письма.';
  }
  if (outcome.repeat === null && !['writing-task2', 'writing-drills', 'speaking-second-take'].includes(trainer)) {
    outcome.repeat = outcome.checks.some(item => item.stage === 'transfer' && item.matches === false);
    if (outcome.repeat) outcome.next = trainer;
  }
  return outcome;
}

export const outcomeLabel = (check: OutcomeCheck) => check.matches === null ? 'Не оценено автоматически' : check.matches ? 'Совпало с разбором' : 'Нужно пересмотреть';
export const nextPracticeHref = (outcome: PracticeOutcome) => trainerById(outcome.next).href;
