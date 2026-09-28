export type TfngAnswer = 'TRUE' | 'FALSE' | 'NOT GIVEN';
export type Confidence = 'low' | 'medium' | 'high';

export type ReadingTask = {
  passageTitle: string;
  sentences: { id: string; text: string }[];
  statement: string;
  answer: TfngAnswer;
  evidenceId: string;
  acceptedEvidenceIds?: string[];
  relation: string;
  explanation: string;
};

export type ReadingCase = {
  id: string;
  title: string;
  focus: string;
  task: ReadingTask;
  transfer: ReadingTask;
  reasons: string[];
};

// Original ASHYQ practice material. These short passages are invented and are
// deliberately separate from official IELTS and Cambridge test content.
export const readingCases: ReadingCase[] = [
  {
    id: 'scope',
    title: 'Проверь слово «все»',
    focus: 'FALSE или NOT GIVEN · ограничитель и противоречие',
    task: {
      passageTitle: 'City Museum',
      sentences: [
        { id: 's1', text: 'In March, the City Museum began offering free admission to local residents on Fridays.' },
        { id: 's2', text: 'Visitors from outside the city still paid the usual price, and weekend tickets remained unchanged.' },
        { id: 's3', text: 'The museum reported more Friday visits during the first month of the scheme.' },
        { id: 's4', text: 'It has not yet published figures showing whether those visitors returned later.' },
      ],
      statement: 'The museum made admission free for every visitor on every day of the week.',
      answer: 'FALSE',
      evidenceId: 's2',
      acceptedEvidenceIds: ['s1', 's2'],
      relation: 'every visitor / every day ↔ visitors from outside the city still paid / weekends unchanged',
      explanation: 'Текст прямо ограничивает льготу жителями города и пятницами. Это противоречие, поэтому FALSE, а не NOT GIVEN.',
    },
    transfer: {
      passageTitle: 'Community Pool',
      sentences: [
        { id: 't1', text: 'The community pool offers free morning sessions to children under twelve during the summer holidays.' },
        { id: 't2', text: 'Adults pay the standard entry fee, including when they accompany a child.' },
        { id: 't3', text: 'Afternoon sessions are open to swimmers of all ages at the usual price.' },
      ],
      statement: 'Adults can enter the pool without paying during the free morning sessions.',
      answer: 'FALSE',
      evidenceId: 't2',
      relation: 'adults without paying ↔ adults pay the standard entry fee',
      explanation: 'В новом тексте прямо сказано, что взрослые платят даже в сопровождении ребёнка. Это снова противоречие.',
    },
    reasons: ['Не проверил ограничитель every / all', 'Перепутал прямое противоречие с отсутствием информации', 'Увидел знакомые слова и перестал сравнивать смысл', 'Другая причина или ответ был верным'],
  },
  {
    id: 'absence',
    title: 'Не додумывай результат',
    focus: 'NOT GIVEN · факта в тексте нет',
    task: {
      passageTitle: 'Solar Lights Pilot',
      sentences: [
        { id: 's1', text: 'Two university campuses tested solar-powered path lights from April to June.' },
        { id: 's2', text: 'The lights stayed on for longer after cloudy days than the organisers had expected.' },
        { id: 's3', text: 'A report on installation costs was published in July.' },
        { id: 's4', text: 'The universities plan to assess maintenance costs next year.' },
      ],
      statement: 'The solar lights reduced the campuses’ annual maintenance costs.',
      answer: 'NOT GIVEN',
      evidenceId: 's4',
      relation: 'reduced annual maintenance costs ↔ maintenance costs will be assessed next year',
      explanation: 'В тексте пока нет результата по обслуживанию. Ближайшая релевантная фраза указывает лишь на будущую оценку; сама по себе она не «доказывает отсутствие». Нужно проверить весь отрывок.',
    },
    transfer: {
      passageTitle: 'Library Evening Hours',
      sentences: [
        { id: 't1', text: 'The town library extended its opening hours until 9 p.m. on Tuesdays in September.' },
        { id: 't2', text: 'Staff counted 140 visits during the first three Tuesday evenings.' },
        { id: 't3', text: 'A survey about why visitors came will be carried out at the end of the year.' },
      ],
      statement: 'Most evening visitors came to borrow books for school.',
      answer: 'NOT GIVEN',
      evidenceId: 't3',
      relation: 'most visitors came for school books ↔ reasons have not yet been surveyed',
      explanation: 'Посещения посчитали, но причины визитов ещё не выясняли. Ни подтверждения, ни противоречия утверждению нет.',
    },
    reasons: ['Подставил вероятный результат вместо сказанного в тексте', 'Принял будущий план за уже измеренный факт', 'Перепутал NOT GIVEN с FALSE', 'Другая причина или ответ был верным'],
  },
];

export const answerLabels: Record<TfngAnswer, string> = {
  TRUE: 'TRUE · совпадает с текстом',
  FALSE: 'FALSE · текст противоречит',
  'NOT GIVEN': 'NOT GIVEN · информации недостаточно',
};

export function evidenceMatches(task: ReadingTask, evidenceId: string) {
  return (task.acceptedEvidenceIds ?? [task.evidenceId]).includes(evidenceId);
}
