/** Owner's update 2026-09-28. Counts are first-party statements, not an audited rating. */
export const CLUB_OFFER = {
  updated: '2026-09-28',
  students: 84,
  teachers: 4,
  workingDays: 'Понедельник — суббота',
  workingHours: '19:00–23:00',
  timezone: 'Астана, UTC+5',
  course: { previous: 84_000, current: 68_000, period: null as 'month' | 'course' | null, exams: [] as Array<'ielts' | 'sat'> },
  mentoring: { previous: 180_000, current: 127_000, period: 'month' as const },
  previousCohort: { students: 112, average: '7.0', months: 'Июль — сентябрь' },
  // No invented expiry, live seat inventory, billing unit or exam verification.
};

export type EnrolmentProgram = 'ielts' | 'sat' | 'mentoring';
export const PROGRAM_LABELS: Record<EnrolmentProgram, string> = {
  ielts: 'IELTS', sat: 'Digital SAT', mentoring: 'Менторство по поступлению',
};
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
  const group = program === 'mentoring' ? undefined : PLANNED_GROUPS.find((item) => item.id === groupId);
  return `Здравствуйте! Хочу записаться в ASHYQ. Направление: ${PROGRAM_LABELS[program]}. Удобные дни: ${days.join(', ')}. Предпочтительное время: ${time} по Астане (UTC+5).${group ? ` Выбранный вариант планируемого расписания: ${group.label} (${group.time}).` : ''} Пожалуйста, подтвердите подходящую группу, наличие места, расписание и полные условия оплаты. Понимаю, что выбор времени на сайте не бронирует место.`;
}
