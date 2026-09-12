import type { Question } from '@/lib/types';

/**
 * IELTS ACADEMIC READING — question bank.
 *
 * Три коротких академических passage (120–220 слов) и 9 вопросов.
 * Типы: multiple choice · True/False/Not Given · sentence completion ·
 *       matching · main idea · vocabulary in context.
 *
 * Все ответы находятся в тексте; специальные знания темы не требуются.
 * Сложность: 3 easy / 4 medium / 2 hard (на выборку из 8 берётся 2/4/2).
 */

const TFNG = [
  { id: 'TRUE', label: 'True' },
  { id: 'FALSE', label: 'False' },
  { id: 'NG', label: 'Not Given' },
];

export const IELTS_READING_QUESTIONS: Question[] = [
  /* ---------------- Passage A: city trees ---------------- */
  {
    id: 'ielts-r-01',
    exam: 'ielts',
    section: 'reading',
    domain: 'Main Idea',
    skill: 'Identifying the main purpose of a passage',
    skillLabel: 'Reading — Main idea',
    difficulty: 'easy',
    kind: 'single-choice',
    materialId: 'ielts-reading-a',
    groupKey: 'ielts-reading-a',
    prompt: 'What is the main purpose of Passage A?',
    options: [
      { id: 'A', label: 'To argue that cities should remove asphalt from residential streets' },
      { id: 'B', label: 'To describe how street trees lower temperatures and which factors affect the result' },
      { id: 'C', label: 'To compare the cost of planting broad-leaved trees with the cost of planting conifers' },
      { id: 'D', label: 'To show that temperature measurements taken in European cities are unreliable' },
    ],
    correctAnswer: 'B',
    explanation:
      'Текст описывает эффект деревьев на температуру, два механизма охлаждения и факторы, которые влияют на результат (вид деревьев, плотность застройки). Про стоимость посадки и надёжность измерений в тексте ничего нет.',
    weight: 1,
    tags: ['main-idea'],
  },
  {
    id: 'ielts-r-02',
    exam: 'ielts',
    section: 'reading',
    domain: 'Detail',
    skill: 'True / False / Not Given',
    skillLabel: 'Reading — T/F/NG',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'ielts-reading-a',
    groupKey: 'ielts-reading-a',
    prompt:
      'Statement: Most cities that plant street trees record a temperature drop of at least three degrees Celsius.',
    options: TFNG,
    correctAnswer: 'NG',
    explanation:
      'В тексте сказано, что в трёх европейских городах улицы с деревьями были в среднем на 2–4 °C прохладнее. Ни про «большинство городов», ни про гарантированные «минимум три градуса» информации нет — значит Not Given.',
    weight: 1.5,
    tags: ['detail', 'tfng'],
  },
  {
    id: 'ielts-r-03',
    exam: 'ielts',
    section: 'reading',
    domain: 'Detail',
    skill: 'True / False / Not Given',
    skillLabel: 'Reading — T/F/NG',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'ielts-reading-a',
    groupKey: 'ielts-reading-a',
    prompt:
      'Statement: Streets planted with narrow conifers cooled the air more strongly than streets planted with broad-leaved species.',
    options: TFNG,
    correctAnswer: 'FALSE',
    explanation:
      'Текст утверждает обратное: улицы с широколиственными породами показывали более сильное охлаждение, чем улицы с узкими хвойными. Значит False.',
    weight: 1.5,
    tags: ['detail', 'tfng'],
  },
  {
    id: 'ielts-r-04',
    exam: 'ielts',
    section: 'reading',
    domain: 'Detail',
    skill: 'Sentence completion',
    skillLabel: 'Reading — Completion',
    difficulty: 'easy',
    kind: 'text-input',
    materialId: 'ielts-reading-a',
    groupKey: 'ielts-reading-a',
    prompt:
      'Complete the sentence with ONE WORD from Passage A.\n\nTrees cool streets through shade and through ______________, the release of water from leaves.',
    acceptedAnswers: ['evapotranspiration'],
    correctAnswer: 'evapotranspiration',
    explanation:
      'В тексте: «…and evapotranspiration, the process by which water released from leaves absorbs heat from the surrounding air».',
    weight: 1,
    tags: ['detail', 'completion'],
  },

  /* ---------------- Passage B: sleep and memory ---------------- */
  {
    id: 'ielts-r-05',
    exam: 'ielts',
    section: 'reading',
    domain: 'Detail',
    skill: 'Multiple choice (stated information)',
    skillLabel: 'Reading — Detail',
    difficulty: 'easy',
    kind: 'single-choice',
    materialId: 'ielts-reading-b',
    groupKey: 'ielts-reading-b',
    prompt: 'According to Passage B, what is one function of sleep mentioned by researchers?',
    options: [
      { id: 'A', label: 'It increases the speed at which new information is presented.' },
      { id: 'B', label: 'It helps stabilise information learned during the day.' },
      { id: 'C', label: 'It prevents the hippocampus from forming new memories.' },
      { id: 'D', label: 'It allows the cortex to rest after long periods of study.' },
    ],
    correctAnswer: 'B',
    explanation:
      'Прямо в тексте: сон, особенно глубокая стадия slow-wave sleep, «helps stabilise — or consolidate — information learned during the day». Про скорость подачи информации и «отдых кортекса» в тексте не говорится.',
    weight: 1,
    tags: ['detail'],
  },
  {
    id: 'ielts-r-06',
    exam: 'ielts',
    section: 'reading',
    domain: 'Vocabulary',
    skill: 'Understanding vocabulary in context',
    skillLabel: 'Reading — Vocabulary',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'ielts-reading-b',
    groupKey: 'ielts-reading-b',
    prompt: 'In Passage B, the word “consolidated” is closest in meaning to',
    options: [
      { id: 'A', label: 'examined in detail' },
      { id: 'B', label: 'made stable and lasting' },
      { id: 'C', label: 'moved quickly to another place' },
      { id: 'D', label: 'reduced in amount' },
    ],
    correctAnswer: 'B',
    explanation:
      'Слово стоит в паре со «stabilise»: «helps stabilise — or consolidate — information learned during the day». Значит речь о закреплении, а не о перемещении (это отдельная мысль текста про гиппокамп и кортекс).',
    weight: 1.5,
    tags: ['vocabulary'],
  },
  {
    id: 'ielts-r-07',
    exam: 'ielts',
    section: 'reading',
    domain: 'Inference',
    skill: 'Matching a statement to the writer’s view',
    skillLabel: 'Reading — Inference',
    difficulty: 'hard',
    kind: 'single-choice',
    materialId: 'ielts-reading-b',
    groupKey: 'ielts-reading-b',
    prompt: 'Which statement agrees with the views expressed in Passage B?',
    options: [
      { id: 'A', label: 'All types of memory are improved by sleep to the same degree.' },
      { id: 'B', label: 'A nap improves recall regardless of when it is taken.' },
      { id: 'C', label: 'A nap is useful for memory mainly when it follows learning closely.' },
      { id: 'D', label: 'The hippocampus stores memories permanently after slow-wave sleep.' },
    ],
    correctAnswer: 'C',
    explanation:
      'Финал текста: «a nap helps only when it occurs shortly after learning». A противоречит «Not every kind of memory benefits equally». B противоречит тому же финальному предложению. D противоречит описанию: гиппокамп участвует в быстром обучении, а долгосрочное хранение — в кортексе.',
    weight: 2,
    tags: ['inference'],
  },

  /* ---------------- Passage C: vertical farming ---------------- */
  {
    id: 'ielts-r-08',
    exam: 'ielts',
    section: 'reading',
    domain: 'Detail',
    skill: 'Multiple choice (stated information)',
    skillLabel: 'Reading — Detail',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'ielts-reading-c',
    groupKey: 'ielts-reading-c',
    prompt: 'Which crops does Passage C suggest are currently viable in vertical farms?',
    options: [
      { id: 'A', label: 'Wheat and rice' },
      { id: 'B', label: 'Leafy greens and herbs' },
      { id: 'C', label: 'Any crop that can grow without soil' },
      { id: 'D', label: 'Crops that require regular pesticide use' },
    ],
    correctAnswer: 'B',
    explanation:
      'В тексте: успешные вертикальные фермы выращивают «leafy greens and herbs», а пшеница и рис названы невыгодными в масштабе. Пестициды в таких фермах почти не нужны, поэтому D неверно.',
    weight: 1.5,
    tags: ['detail'],
  },
  {
    id: 'ielts-r-09',
    exam: 'ielts',
    section: 'reading',
    domain: 'Inference',
    skill: 'Summary completion',
    skillLabel: 'Reading — Summary',
    difficulty: 'hard',
    kind: 'text-input',
    materialId: 'ielts-reading-c',
    groupKey: 'ielts-reading-c',
    prompt:
      'Complete the sentence with ONE WORD from Passage C.\n\nA large share of a vertical farm’s operating costs comes from the ______________ needed to replace sunlight.',
    acceptedAnswers: ['electricity'],
    correctAnswer: 'electricity',
    explanation:
      'В тексте: «the electricity needed to replace sunlight accounts for a large share of operating costs».',
    weight: 2,
    tags: ['inference', 'completion'],
  },
];
