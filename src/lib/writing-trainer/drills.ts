export type DrillMode = 'combine' | 'grammar' | 'argument';

export interface WritingDrill {
  id: string;
  mode: DrillMode;
  title: string;
  context: string;
  task: string;
  source: string[];
  choices: { text: string; feedback: string; best: boolean }[];
  example: string;
  explanation: string;
  criterion: string;
}

export const drillModes: { id: DrillMode; title: string; summary: string; skill: string }[] = [
  { id: 'combine', title: 'Соедини мысли', summary: 'Преврати короткие фразы в одно ясное предложение, сохранив их смысл.', skill: 'Связность и грамматика' },
  { id: 'grammar', title: 'Исправь точечно', summary: 'Найди грамматическую проблему и исправь её без лишней переделки.', skill: 'Грамматическая точность' },
  { id: 'argument', title: 'Усиль аргумент', summary: 'Добавь к тезису конкретное объяснение и пример, который его поддерживает.', skill: 'Ответ на вопрос' },
];

export const writingDrills: WritingDrill[] = [
  {
    id: 'combine-transport', mode: 'combine', title: 'Причина и результат',
    context: 'IELTS Task 2 · городской транспорт', task: 'Напиши одно предложение, которое связывает причину с возможным результатом. Затем выбери самый ясный вариант из трёх.',
    source: ['Bus fares are expensive for some workers.', 'Some workers drive to work instead.', 'Cheaper fares might encourage them to use buses.'],
    choices: [
      { text: 'Bus fares are expensive, and some workers drive, and cheaper fares might encourage buses.', feedback: 'Повтор «and» скрывает связь между причиной и следствием. К тому же people use buses, а не «encourage buses».', best: false },
      { text: 'Because bus fares are expensive for some workers, lower fares might persuade them to leave their cars at home.', feedback: 'Связь между ценой и поведением ясна; исходный смысл сохранён без повтора.', best: true },
      { text: 'Although fares are expensive, cheaper fares would certainly end traffic congestion.', feedback: '«Certainly end» — слишком сильный вывод: исходные идеи говорят лишь о возможном изменении поведения.', best: false },
    ],
    example: 'Because bus fares are expensive for some workers, lower fares might persuade them to leave their cars at home.',
    explanation: 'Хорошая связка показывает отношение идей и не превращает осторожное «might» в недоказанное обещание.', criterion: 'Coherence & Cohesion',
  },
  {
    id: 'combine-school', mode: 'combine', title: 'Контраст без потери смысла',
    context: 'IELTS Task 2 · обучение', task: 'Соедини мысли о двух видах заданий в одно предложение с ясным контрастом.',
    source: ['Group projects teach cooperation.', 'Individual assignments show what each student understands.'],
    choices: [
      { text: 'Group projects teach cooperation, whereas individual assignments reveal what each student understands.', feedback: '«Whereas» точно показывает контраст двух преимуществ.', best: true },
      { text: 'Group projects teach cooperation because individual assignments reveal understanding.', feedback: '«Because» ошибочно делает одно преимущество причиной другого.', best: false },
      { text: 'Group projects teach cooperation and individual assignments are bad.', feedback: 'В исходных идеях нет вывода, что индивидуальные задания плохи.', best: false },
    ],
    example: 'Group projects teach cooperation, whereas individual assignments reveal what each student understands.',
    explanation: 'Связующее слово должно передавать реальное отношение между идеями. Здесь это сопоставление, а не причина.', criterion: 'Coherence & Cohesion',
  },
  {
    id: 'grammar-agreement', mode: 'grammar', title: 'Согласование подлежащего',
    context: 'IELTS Task 2 · школьные проекты', task: 'Исправь одну ошибку в предложении. Смысл и остальные слова сохраняй.',
    source: ['Each student have a clear role in the project.'],
    choices: [
      { text: 'Each students have a clear role in the project.', feedback: 'После «each» существительное остаётся в единственном числе.', best: false },
      { text: 'Each student has a clear role in the project.', feedback: '«Each student» — единственное число; глагол «has» согласуется с ним.', best: true },
      { text: 'Each student have clear roles in the project.', feedback: 'Изменение «role» не исправляет согласование подлежащего и глагола.', best: false },
    ],
    example: 'Each student has a clear role in the project.', explanation: 'Проверь, к какому слову относится глагол: «student», а не «roles» или «project».', criterion: 'Grammatical Range & Accuracy',
  },
  {
    id: 'grammar-condition', mode: 'grammar', title: 'Условие без лишней уверенности',
    context: 'IELTS Task 2 · городской транспорт', task: 'Исправь форму глагола после if. Сохрани осторожный вывод автора.',
    source: ['If the city will reduce fares, more residents might use buses.'],
    choices: [
      { text: 'If the city reduces fares, more residents might use buses.', feedback: 'После «if» в этом реальном условии подходит present simple; «might» сохраняет осторожность.', best: true },
      { text: 'If the city reduced fares, more residents will definitely use buses.', feedback: 'Здесь смешаны конструкции, а «definitely» добавляет недоказанную уверенность.', best: false },
      { text: 'If the city will reduce fares, more residents will use buses.', feedback: 'Форма после «if» не исправлена, и осторожный вывод стал категоричным.', best: false },
    ],
    example: 'If the city reduces fares, more residents might use buses.', explanation: 'Исправление грамматики не должно менять степень уверенности исходного аргумента.', criterion: 'Grammatical Range & Accuracy',
  },
  {
    id: 'argument-transport', mode: 'argument', title: 'Тезис → механизм → пример',
    context: 'IELTS Task 2 · городской транспорт', task: 'Напиши одно-два предложения, которые объясняют тезис. Затем выбери наиболее убедительное развитие.',
    source: ['Thesis: Lower bus fares could help people on low incomes.'],
    choices: [
      { text: 'This is good because cheaper tickets are better for everyone.', feedback: 'Это повторяет тезис общими словами и не показывает, как именно возникает польза.', best: false },
      { text: 'For example, a worker who changes buses twice each day would spend less on commuting and keep more income for essential expenses.', feedback: 'Конкретный пример показывает механизм пользы и не заявляет, что мера решит все проблемы.', best: true },
      { text: 'Therefore, public transport should be completely free in every city.', feedback: 'Вывод расширяет тезис до «всех городов» без доказательства.', best: false },
    ],
    example: 'For example, a worker who changes buses twice each day would spend less on commuting and keep more income for essential expenses.',
    explanation: 'Пример полезен, когда читатель видит, кто выигрывает, почему и как это поддерживает позицию.', criterion: 'Task Response',
  },
  {
    id: 'argument-school', mode: 'argument', title: 'Объясни ограничение',
    context: 'IELTS Task 2 · обучение', task: 'Развей тезис конкретной причиной, не отрицая пользу групповой работы.',
    source: ['Thesis: A shared mark for a group project may be unfair.'],
    choices: [
      { text: 'Group work is always unfair and should be banned.', feedback: '«Always» не следует из тезиса; крайний вывод игнорирует возможную пользу группового проекта.', best: false },
      { text: 'This is a problem because it is not good for students.', feedback: 'Неясно, в чём проблема и кто именно получает несправедливую оценку.', best: false },
      { text: 'If one learner completes most of the research while others contribute little, the same mark would hide their different levels of effort.', feedback: 'Пример объясняет механизм несправедливости, сохраняя место для хорошо организованной групповой работы.', best: true },
    ],
    example: 'If one learner completes most of the research while others contribute little, the same mark would hide their different levels of effort.',
    explanation: 'Аргумент становится сильнее, когда пример раскрывает причину проблемы, а не просто повторяет мнение.', criterion: 'Task Response',
  },
];
