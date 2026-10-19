/** Owner's update 2026-09-28. Counts are first-party statements, not an audited rating. */
export const CLUB_OFFER = {
  updated: '2026-09-28',
  students: 84,
  teachers: 4,
  workingDays: 'Понедельник — суббота',
  workingHours: '19:00–23:00',
  timezone: 'Астана, UTC+5',
  course: { previous: 112_000, current: 84_000, period: null as 'month' | 'course' | null, exams: [] as Array<'ielts' | 'sat'> },
  mentoring: { description: 'Помогаем поступать в Европу, США, ОАЭ и другие страны.', pricing: 'Стоимость и условия согласовываем на встрече.' },
  allInclusive: { previous: 370_000, current: 250_000 },
  previousCohort: { number: 3, students: 112, achievedTarget: 89, targetBand: '7.0+', months: 'Июль — сентябрь', updated: '19 октября 2026' },
  // No invented expiry, live seat inventory, billing unit or exam verification.
};

export type EnrolmentProgram = 'ielts' | 'sat' | 'mentoring' | 'all-inclusive';
export const PROGRAM_LABELS: Record<EnrolmentProgram, string> = {
  ielts: 'IELTS', sat: 'Digital SAT', mentoring: 'Менторство по поступлению',
  'all-inclusive': 'Всё включено — IELTS + SAT + менторство',
};
export const ALL_INCLUSIVE_SERVICES = [
  { title: 'IELTS: все четыре навыка', text: 'Подготовка к Reading, Listening, Writing и Speaking. Практика экзаменационных заданий, обратная связь по эссе и устным ответам, разбор типичных ошибок.' },
  { title: 'Digital SAT: язык и математика', text: 'Reading & Writing и Math: чтение условий, выбор стратегии, работа со временем и разбор решений. Тренировочные задания и анализ слабых тем.' },
  { title: 'Приоритетная помощь тренеров', text: 'Вопросы по заданиям и сложным темам, обратная связь по подготовке и корректировка плана. Для участников пакета — приоритет в очереди обращений в рабочие часы команды.' },
  { title: 'Личный маршрут поступления', text: 'Оценка стартового уровня и академического профиля, подбор стран и университетов, календарь экзаменов и дедлайнов. Европа, США, ОАЭ и другие направления.' },
  { title: 'Документы и сильная заявка', text: 'Помощь с CV, мотивационными эссе и Personal Statement, рекомендации по запросу рекомендательных писем. Проверка комплектности документов и сопровождение подачи заявок.' },
  { title: 'Сопровождение до начала учёбы', text: 'Помощь с ответами университетов, сравнением офферов и шагами для зачисления. После выбора вуза — план подготовки к переезду и началу обучения.' },
  { title: 'Помощь с визовой подготовкой', text: 'План сбора документов, помощь с заполнением анкет и подготовкой к интервью, если оно требуется. Разбираем последовательность действий для выбранной страны.' },
  { title: 'Один согласованный план', text: 'Экзамены и поступление в одном пакете: учебные материалы, практика и менторские встречи привязаны к вашему маршруту. Помогаем расставлять приоритеты и следить за дедлайнами.' },
] as const;
export const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
export const PREFERRED_WINDOWS = ['19:00–21:00', '21:00–23:00'];
/** Owner delegated planning. These identifiers are not verified existing class rosters. */
export const PLANNED_GROUPS = Array.from({ length: 8 }, (_, index) => ({
  id: `group-${index + 1}`,
  label: `Группа ${String(index + 1).padStart(2, '0')}`,
  time: PREFERRED_WINDOWS[index < 4 ? 0 : 1],
}));
export const formatTenge = (value: number) => `${new Intl.NumberFormat('ru-KZ').format(value)} ₸`;

export function enrolmentMessage(program: EnrolmentProgram, days: string[], time: string, groupId?: string) {
  if (program === 'all-inclusive') return `Здравствуйте! Интересует пакет ASHYQ «Всё включено»: IELTS + SAT + менторство за ${formatTenge(CLUB_OFFER.allInclusive.current)} вместо ${formatTenge(CLUB_OFFER.allInclusive.previous)}. Удобные дни для связи: ${days.join(', ')}. Время: ${time} по Астане (UTC+5). Хочу обсудить мой уровень, страны и сроки поступления. Пожалуйста, подтвердите длительность и расписание подготовки, количество занятий и менторских встреч, число заявок в вузы, срок сопровождения до начала учёбы и объём визовой помощи. Выбор времени не бронирует место.`;
  const group = program === 'mentoring' ? undefined : PLANNED_GROUPS.find((item) => item.id === groupId);
  return `Здравствуйте! Хочу записаться в ASHYQ. Направление: ${PROGRAM_LABELS[program]}. Удобные дни: ${days.join(', ')}. Предпочтительное время: ${time} по Астане (UTC+5).${group ? ` Выбранный вариант планируемого расписания: ${group.label} (${group.time}).` : ''} Пожалуйста, подтвердите подходящую группу, наличие места, расписание и полные условия оплаты. Понимаю, что выбор времени на сайте не бронирует место.`;
}
