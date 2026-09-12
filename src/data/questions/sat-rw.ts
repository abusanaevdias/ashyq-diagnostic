import type { Question } from '@/lib/types';

/**
 * SAT READING & WRITING — question bank.
 *
 * Все задания оригинальные, написаны в формате и по навыкам Digital SAT,
 * но НЕ копируют официальные вопросы College Board.
 *
 * Домены: Information and Ideas · Craft and Structure ·
 *         Expression of Ideas · Standard English Conventions
 *
 * Сложность: 4 easy / 8 medium / 4 hard (на выборку 8 вопросов берётся 2/4/2).
 */

export const SAT_RW_QUESTIONS: Question[] = [
  /* -------------------------------------------------------------- */
  /* INFORMATION AND IDEAS                                            */
  /* -------------------------------------------------------------- */
  {
    id: 'sat-rw-01',
    exam: 'sat',
    section: 'rw',
    domain: 'Information and Ideas',
    skill: 'Central Ideas and Details',
    skillLabel: 'R&W — Central Idea',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt: 'Which choice best states the main idea of the text?',
    materialId: 'sat-rw-01-material',
    options: [
      {
        id: 'A',
        label: 'Successful mangrove restoration depends less on how many seedlings are planted than on whether a site’s water flow suits the species.',
      },
      {
        id: 'B',
        label: 'Mangrove forests in Southeast Asia have declined steadily because local communities stopped maintaining them.',
      },
      {
        id: 'C',
        label: 'Scientists now agree that mangroves should only be replanted in areas that were previously forested.',
      },
      {
        id: 'D',
        label: 'Restoring tidal flow is more expensive than planting seedlings, so most projects have been abandoned.',
      },
    ],
    correctAnswer: 'A',
    explanation:
      'Текст строится вокруг одной мысли: первые проекты проваливались, потому что сажали сеянцы там, где не подходила гидрология. Вариант B противоречит тексту (проекты вели внешние агентства). C — слишком сильное утверждение («only», «now agree»). D про стоимость в тексте не обсуждается.',
    weight: 1.5,
    tags: ['information-and-ideas', 'central-idea'],
  },
  {
    id: 'sat-rw-02',
    exam: 'sat',
    section: 'rw',
    domain: 'Information and Ideas',
    skill: 'Command of Evidence (quantitative)',
    skillLabel: 'R&W — Data Evidence',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'sat-rw-02-material',
    prompt:
      'Which choice best describes the data in the table?',
    options: [
      { id: 'A', label: 'Undergraduate enrollment increased every year from 2019 to 2023.' },
      { id: 'B', label: 'The largest single-year increase in total enrollment occurred between 2020 and 2021.' },
      { id: 'C', label: 'Graduate enrollment made up at least 40 percent of total enrollment in every year shown.' },
      { id: 'D', label: 'Total enrollment declined between 2021 and 2022.' },
    ],
    correctAnswer: 'B',
    explanation:
      'Суммарный набор: 600, 700, 1 050, 1 100, 1 400. Прирост по годам: +100, +350, +50, +300 — самый большой между 2020 и 2021, поэтому B верно. A неверно: undergraduate падает с 700 (2021) до 650 (2022). C неверно: доля graduate — 33% в 2019 и 25% в 2023. D неверно: между 2021 и 2022 набор вырос с 1 050 до 1 100.',
    weight: 1.5,
    tags: ['information-and-ideas', 'data'],
  },
  {
    id: 'sat-rw-03',
    exam: 'sat',
    section: 'rw',
    domain: 'Information and Ideas',
    skill: 'Inferences',
    skillLabel: 'R&W — Inference',
    difficulty: 'hard',
    kind: 'single-choice',
    materialId: 'sat-rw-03-material',
    prompt: 'Which choice most logically completes the text?',
    options: [
      { id: 'A', label: 'steel expands faster than concrete when the two materials are joined together' },
      { id: 'B', label: 'a bridge’s joints are usually its structurally weakest components' },
      { id: 'C', label: 'temperature changes affect the materials used in a bridge structure unequally' },
      { id: 'D', label: 'strain gauges can predict when a bridge requires major repair work' },
    ],
    correctAnswer: 'C',
    explanation:
      'В тексте прямо сказано: сталь и бетон расширяются с разной скоростью, поэтому в соединениях возникает напряжение. Значит температура влияет на материалы неравномерно — это и есть логичный вывод. A добавляет сравнение «when joined», которого в тексте нет. B — про «weakest components» текста не поддерживает. D — про предсказание ремонта речь не идёт.',
    weight: 2,
    tags: ['information-and-ideas', 'inference'],
  },
  {
    id: 'sat-rw-04',
    exam: 'sat',
    section: 'rw',
    domain: 'Craft and Structure',
    skill: 'Cross-Text Connections',
    skillLabel: 'R&W — Cross-Text',
    difficulty: 'hard',
    kind: 'single-choice',
    materialId: 'sat-rw-04-material',
    prompt:
      'Based on the texts, how would Researcher 2 most likely respond to Researcher 1’s conclusion?',
    options: [
      {
        id: 'A',
        label: 'By arguing that the reported increase may reflect improved detection rather than a larger population',
      },
      {
        id: 'B',
        label: 'By confirming that conservation measures were the main cause of the population increase',
      },
      {
        id: 'C',
        label: 'By suggesting that point counts should be replaced with satellite imaging',
      },
      {
        id: 'D',
        label: 'By claiming that warbler numbers declined during the same period',
      },
    ],
    correctAnswer: 'A',
    explanation:
      'Researcher 2 говорит, что выросла вероятность обнаружения птиц, а не обязательно их число, — то есть ставит под сомнение вывод Researcher 1. B противоречит позиции Researcher 2. C — про спутники в текстах ничего нет. D — Researcher 2 не утверждает, что численность падала.',
    weight: 2,
    tags: ['craft-and-structure', 'cross-text'],
  },
  {
    id: 'sat-rw-05',
    exam: 'sat',
    section: 'rw',
    domain: 'Information and Ideas',
    skill: 'Central Ideas and Details',
    skillLabel: 'R&W — Detail',
    difficulty: 'easy',
    kind: 'single-choice',
    materialId: 'sat-rw-05-material',
    prompt: 'According to the text, why do libraries keep local newspaper archives?',
    options: [
      { id: 'A', label: 'To record how a community changed over time' },
      { id: 'B', label: 'To compare reporting quality between different cities' },
      { id: 'C', label: 'To increase the number of visitors to the library' },
      { id: 'D', label: 'To reduce the storage space needed for printed material' },
    ],
    correctAnswer: 'A',
    explanation:
      'В тексте прямо сказано: страницы фиксируют «how the community around them changed». Остальные варианты в тексте не упоминаются.',
    weight: 1,
    tags: ['information-and-ideas', 'detail'],
  },

  /* -------------------------------------------------------------- */
  /* CRAFT AND STRUCTURE                                              */
  /* -------------------------------------------------------------- */
  {
    id: 'sat-rw-06',
    exam: 'sat',
    section: 'rw',
    domain: 'Craft and Structure',
    skill: 'Words in Context',
    skillLabel: 'R&W — Vocabulary',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'sat-rw-06-material',
    prompt: 'As used in the text, what does the word “checked” most nearly mean?',
    options: [
      { id: 'A', label: 'examined' },
      { id: 'B', label: 'halted' },
      { id: 'C', label: 'marked' },
      { id: 'D', label: 'measured' },
    ],
    correctAnswer: 'B',
    explanation:
      'Речь про эрозию почвы: террасы её «checked», то есть остановили. «Examined», «marked» и «measured» не подходят по смыслу — террасы физически удерживают воду и почву.',
    weight: 1.5,
    tags: ['craft-and-structure', 'vocabulary'],
  },
  {
    id: 'sat-rw-07',
    exam: 'sat',
    section: 'rw',
    domain: 'Craft and Structure',
    skill: 'Text Structure and Purpose',
    skillLabel: 'R&W — Structure',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'sat-rw-07-material',
    prompt: 'Which choice best describes the structure of the text?',
    options: [
      { id: 'A', label: 'It presents a phenomenon, explains one mechanism behind it, and notes an intervention that reduces it.' },
      { id: 'B', label: 'It compares two competing scientific theories and argues that both are incomplete.' },
      { id: 'C', label: 'It describes a failed urban project and identifies the decision that caused the failure.' },
      { id: 'D', label: 'It introduces a research method and evaluates its reliability across different cities.' },
    ],
    correctAnswer: 'A',
    explanation:
      'Структура: явление (город теплее окружения) → механизм (поглощение тепла покрытиями, отсутствие тени) → интервенция (светлые покрытия и деревья снижают эффект). Никаких конкурирующих теорий, проваленных проектов или оценки методики в тексте нет.',
    weight: 1.5,
    tags: ['craft-and-structure', 'structure'],
  },

  /* -------------------------------------------------------------- */
  /* EXPRESSION OF IDEAS                                              */
  /* -------------------------------------------------------------- */
  {
    id: 'sat-rw-08',
    exam: 'sat',
    section: 'rw',
    domain: 'Expression of Ideas',
    skill: 'Rhetorical Synthesis',
    skillLabel: 'R&W — Synthesis',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'sat-rw-08-material',
    prompt:
      'The student wants to emphasize a difference between the two groups. Which choice most effectively uses relevant information from the notes to accomplish this goal?',
    options: [
      {
        id: 'A',
        label: 'Both groups of students were asked to rate their level of alertness during the day.',
      },
      {
        id: 'B',
        label: 'Researchers tracked the sleep of 120 first-year students for one month.',
      },
      {
        id: 'C',
        label: 'Students with a consistent bedtime averaged 7 hours 50 minutes of sleep, while those with irregular bedtimes averaged 6 hours 20 minutes.',
      },
      {
        id: 'D',
        label: 'Students with irregular bedtimes reported alertness levels similar to those reported by students with consistent bedtimes.',
      },
    ],
    correctAnswer: 'C',
    explanation:
      'Задача — подчеркнуть РАЗЛИЧИЕ. Только вариант C сопоставляет две группы по конкретному показателю (7:50 против 6:20). A и D, наоборот, подчёркивают сходство, B просто описывает дизайн исследования.',
    weight: 1.5,
    tags: ['expression-of-ideas', 'synthesis'],
  },
  {
    id: 'sat-rw-09',
    exam: 'sat',
    section: 'rw',
    domain: 'Expression of Ideas',
    skill: 'Transitions',
    skillLabel: 'R&W — Transitions',
    difficulty: 'easy',
    kind: 'single-choice',
    materialId: 'sat-rw-09-material',
    prompt: 'Which choice completes the text with the most logical transition?',
    options: [
      { id: 'A', label: 'Therefore,' },
      { id: 'B', label: 'However,' },
      { id: 'C', label: 'For example,' },
      { id: 'D', label: 'Similarly,' },
    ],
    correctAnswer: 'B',
    explanation:
      'Первое предложение — ценность seed banks, второе — ограничение (сборы прерываются из-за финансирования). Это противопоставление, значит нужен «However». «Therefore» дал бы причинно-следственную связь, которой нет.',
    weight: 1,
    tags: ['expression-of-ideas', 'transitions'],
  },

  /* -------------------------------------------------------------- */
  /* STANDARD ENGLISH CONVENTIONS                                     */
  /* -------------------------------------------------------------- */
  {
    id: 'sat-rw-10',
    exam: 'sat',
    section: 'rw',
    domain: 'Standard English Conventions',
    skill: 'Boundaries of Independent and Subordinate Clauses',
    skillLabel: 'R&W — Boundaries',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'sat-rw-10-material',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    options: [
      { id: 'A', label: 'work, critics' },
      { id: 'B', label: 'work; critics' },
      { id: 'C', label: 'work critics' },
      { id: 'D', label: 'work, critics’' },
    ],
    correctAnswer: 'B',
    explanation:
      'Здесь два самостоятельных предложения: «…shaped her work» и «critics have read…». Соединять их запятой — comma splice. Точка с запятой корректна. Вариант C даёт run-on, D ломает смысл.',
    weight: 1.5,
    tags: ['conventions', 'boundaries'],
  },
  {
    id: 'sat-rw-11',
    exam: 'sat',
    section: 'rw',
    domain: 'Standard English Conventions',
    skill: 'Subject–Verb Agreement',
    skillLabel: 'R&W — Agreement',
    difficulty: 'easy',
    kind: 'single-choice',
    materialId: 'sat-rw-11-material',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    options: [
      { id: 'A', label: 'reveal' },
      { id: 'B', label: 'reveals' },
      { id: 'C', label: 'revealing' },
      { id: 'D', label: 'have revealed' },
    ],
    correctAnswer: 'B',
    explanation:
      'Подлежащее — «analysis» (единственное число), а «of sediment samples» только описывает его. Значит нужен «reveals». «Have revealed» требовало бы множественного подлежащего, «revealing» оставил бы предложение без сказуемого.',
    weight: 1,
    tags: ['conventions', 'agreement'],
  },
  {
    id: 'sat-rw-12',
    exam: 'sat',
    section: 'rw',
    domain: 'Standard English Conventions',
    skill: 'Modifiers and Sentence Structure',
    skillLabel: 'R&W — Modifiers',
    difficulty: 'hard',
    kind: 'single-choice',
    materialId: 'sat-rw-12-material',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    options: [
      { id: 'A', label: '1911, its reading room' },
      { id: 'B', label: '1911, the library’s reading room' },
      { id: 'C', label: '1911, the reading room of the library' },
      { id: 'D', label: '1911 the library’s reading room,' },
    ],
    correctAnswer: 'B',
    explanation:
      'Причастный оборот «Built in 1911» должен относиться к «the library». В варианте B после запятой сразу идёт «the library’s reading room» — модификатор на месте. В A получается, что построили «reading room». В C библиотека спрятана в конец оборота «of the library», и модификатор повисает. В D нет запятой после вводного оборота и она лишняя в конце.',
    weight: 2,
    tags: ['conventions', 'modifiers'],
  },
  {
    id: 'sat-rw-13',
    exam: 'sat',
    section: 'rw',
    domain: 'Standard English Conventions',
    skill: 'Form, Structure, and Sense',
    skillLabel: 'R&W — Sentence Sense',
    difficulty: 'hard',
    kind: 'single-choice',
    materialId: 'sat-rw-13-material',
    prompt:
      'Which choice completes the text with the most logical and grammatically correct option?',
    options: [
      { id: 'A', label: 'and compiling' },
      { id: 'B', label: 'to compile' },
      { id: 'C', label: 'compiled' },
      { id: 'D', label: 'compile' },
    ],
    correctAnswer: 'C',
    explanation:
      'Нужно сказуемое в Past Simple: «the team collected … and compiled …». Вариант A оставил бы предложение без главного глагола, B дал бы инфинитив цели и сломал параллелизм, D — форму настоящего времени при «last summer».',
    weight: 2,
    tags: ['conventions', 'form-structure-sense'],
  },
  {
    id: 'sat-rw-14',
    exam: 'sat',
    section: 'rw',
    domain: 'Standard English Conventions',
    skill: 'Punctuation (nonessential elements)',
    skillLabel: 'R&W — Punctuation',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'sat-rw-14-material',
    prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
    options: [
      { id: 'A', label: 'survey, conducted' },
      { id: 'B', label: 'survey conducted,' },
      { id: 'C', label: 'survey conducted' },
      { id: 'D', label: 'survey; conducted' },
    ],
    correctAnswer: 'C',
    explanation:
      '«Conducted over three months» — ограничительный оборот: он указывает, какой именно опрос имеется в виду, поэтому запятыми не выделяется. Правильно: «…a survey conducted over three months showed…». Варианты A и B разрывают связь, D ставит лишнюю точку с запятой.',
    weight: 1.5,
    tags: ['conventions', 'punctuation'],
  },
  {
    id: 'sat-rw-15',
    exam: 'sat',
    section: 'rw',
    domain: 'Expression of Ideas',
    skill: 'Transitions',
    skillLabel: 'R&W — Transitions',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'sat-rw-15-material',
    prompt: 'Which choice completes the text with the most logical transition?',
    options: [
      { id: 'A', label: 'Consequently,' },
      { id: 'B', label: 'Nonetheless,' },
      { id: 'C', label: 'In contrast,' },
      { id: 'D', label: 'Meanwhile,' },
    ],
    correctAnswer: 'B',
    explanation:
      'Первое предложение — рост удалённой работы, второе — офисы в центре всё равно заполнены. Это уступка/противопоставление ожиданию: «Nonetheless». «Consequently» дал бы следствие, «In contrast» требует прямо противоположных явлений, «Meanwhile» — только одновременность.',
    weight: 1.5,
    tags: ['expression-of-ideas', 'transitions'],
  },
  {
    id: 'sat-rw-16',
    exam: 'sat',
    section: 'rw',
    domain: 'Craft and Structure',
    skill: 'Words in Context',
    skillLabel: 'R&W — Vocabulary',
    difficulty: 'hard',
    kind: 'single-choice',
    materialId: 'sat-rw-16-material',
    prompt: 'Which choice completes the text with the most logical and precise word?',
    options: [
      { id: 'A', label: 'obsolete' },
      { id: 'B', label: 'preliminary' },
      { id: 'C', label: 'rigorous' },
      { id: 'D', label: 'spontaneous' },
    ],
    correctAnswer: 'B',
    explanation:
      'Команда описывает находки как «_____ findings that later work may revise» — то есть предварительные. «Obsolete» (устаревшие) противоречит смыслу, «rigorous» (тщательные) не вяжется с «may revise», «spontaneous» здесь бессмысленно.',
    weight: 2,
    tags: ['craft-and-structure', 'vocabulary'],
  },
];
