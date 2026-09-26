export type Criterion = 'grammar' | 'task' | 'coherence' | 'lexical';

export const criterionLabels: Record<Criterion, string> = {
  grammar: 'Грамматика',
  task: 'Ответ на вопрос',
  coherence: 'Связность',
  lexical: 'Лексика',
};

export interface Sentence {
  id: string;
  text: string;
}

export interface Paragraph {
  id: string;
  sentences: Sentence[];
}

export interface GrammarIssue {
  sentenceId: string;
  accepted: string[];
  explanation: string;
}

export interface RevisionTarget {
  paragraphId: string;
  instruction: string;
  example: string;
  explanation: string;
}

export interface WritingCase {
  id: string;
  label: string;
  topic: string;
  question: string;
  paragraphs: Paragraph[];
  grammarIssues: GrammarIssue[];
  revisions: Record<Exclude<Criterion, 'grammar'>, RevisionTarget>;
  baseline: Record<Criterion, number>;
  ceiling: Record<Criterion, number>;
  nextPractice: string;
}

export const writingCases: WritingCase[] = [
  {
    id: 'city-transport',
    label: 'Кейс 01',
    topic: 'Городской транспорт',
    question: 'Some people think cities should make public transport free for everyone. Others believe passengers should pay the full cost. Discuss both views and give your own opinion.',
    baseline: { grammar: 5.5, task: 5.5, coherence: 5.5, lexical: 5.5 },
    ceiling: { grammar: 6, task: 6, coherence: 6, lexical: 6 },
    paragraphs: [
      { id: 'intro', sentences: [
        { id: 'i1', text: 'The cost of public transport is a common problem in many growing cities.' },
        { id: 'i2', text: 'Some people believes that buses and trains should be free, while others want passengers to cover the whole cost.' },
        { id: 'i3', text: 'I think a small fare is reasonable if local authorities also support the service.' },
        { id: 'i4', text: 'The main challenge is to balance access for residents with the cost of running a dependable network.' },
      ] },
      { id: 'task', sentences: [
        { id: 't1', text: 'Free transport could help people on low incomes travel to work and school.' },
        { id: 't2', text: 'It could also encourage drivers to leave their cars at home, which might reduce traffic.' },
        { id: 't3', text: 'However, somebody would still need to pay for drivers, repairs and new vehicles.' },
        { id: 't4', text: 'This is why the question is difficult for city leaders.' },
      ] },
      { id: 'coherence', sentences: [
        { id: 'c1', text: 'Passengers already pay for many other services in daily life.' },
        { id: 'c2', text: 'Ticket income can help keep a transport network reliable.' },
        { id: 'c3', text: 'There are also people who never use buses.' },
        { id: 'c4', text: 'The city should think about this when it decides how much money to collect.' },
      ] },
      { id: 'lexical', sentences: [
        { id: 'l1', text: 'A good answer is to make the price cheap for people who need help.' },
        { id: 'l2', text: 'The city can also use money from fares to make buses better.' },
        { id: 'l3', text: 'This good plan could make transport useful for more people without making every trip free.' },
      ] },
      { id: 'conclusion', sentences: [
        { id: 'e1', text: 'In conclusion, both free travel and full fares have clear problems.' },
        { id: 'e2', text: 'A shared funding system give cities a more practical choice.' },
        { id: 'e3', text: 'Reduced fares for some residents may be fairer than one price for everyone.' },
        { id: 'e4', text: 'Such a policy would ask regular passengers to contribute while protecting people who cannot easily afford daily travel.' },
        { id: 'e5', text: 'It could also be adjusted as the city grows and its transport needs change.' },
      ] },
    ],
    grammarIssues: [
      { sentenceId: 'i2', accepted: ['Some people believe that buses and trains should be free, while others want passengers to cover the whole cost.'], explanation: 'После множественного подлежащего “people” нужна форма “believe”.' },
      { sentenceId: 'e2', accepted: ['A shared funding system gives cities a more practical choice.'], explanation: 'Единственное число “system” требует “gives”.' },
    ],
    revisions: {
      task: { paragraphId: 'task', instruction: 'Покажи, почему бесплатный проезд полезен, и оцени конкретную проблему финансирования. Не ограничивайся общим выводом.', example: 'Free transport could help people on low incomes reach jobs and schools, and it might persuade some drivers to leave their cars at home. Yet the service would still need funding for staff, repairs and new vehicles. If the city paid for every journey through general taxes, residents who rarely use public transport would also bear that cost. This makes targeted discounts more convincing to me than a universal free service.', explanation: 'Пример развивает обе стороны аргумента и прямо связывает их с позицией автора.' },
      coherence: { paragraphId: 'coherence', instruction: 'Собери мысли о платном проезде в логическую цепочку: тезис → причина → оговорка → вывод.', example: 'On the other hand, charging a fare gives the network a regular source of income. That revenue can help operators maintain vehicles and offer dependable services. Nevertheless, asking passengers to cover the full cost could exclude residents with the lowest incomes. A better approach is therefore to combine moderate fares with public funding.', explanation: 'Каждое следующее предложение опирается на предыдущее; связки показывают смену направления аргумента.' },
      lexical: { paragraphId: 'lexical', instruction: 'Замени расплывчатые “good”, “cheap” и “better” более точными словами, сохранив смысл и естественный стиль.', example: 'A practical compromise is to offer discounted fares to residents who need financial support. Cities could use the remaining ticket revenue to improve service frequency and vehicle maintenance. This approach would make the network more accessible without requiring every journey to be free.', explanation: 'Более точные слова называют меру, источник денег и ожидаемый эффект без искусственно сложной лексики.' },
    },
    nextPractice: 'Напиши новый абзац о том, как город мог бы финансировать льготные билеты, и проверь, связан ли пример с твоей позицией.',
  },
  {
    id: 'school-projects',
    label: 'Кейс 02',
    topic: 'Обучение в школе',
    question: 'Some people believe schools should give students more group projects, while others think individual work is more effective. Discuss both views and give your own opinion.',
    baseline: { grammar: 5.5, task: 5.5, coherence: 5.5, lexical: 5.5 },
    ceiling: { grammar: 6, task: 6, coherence: 6, lexical: 6 },
    paragraphs: [
      { id: 'intro', sentences: [
        { id: 'i1', text: 'Schools use both group projects and individual assignments to help students learn.' },
        { id: 'i2', text: 'Each method have supporters because students need different skills.' },
        { id: 'i3', text: 'In my view, schools should use both methods, but assess each student fairly.' },
        { id: 'i4', text: 'This issue matters because classroom tasks influence both academic progress and the way young people work with others.' },
      ] },
      { id: 'task', sentences: [
        { id: 't1', text: 'Group projects let students share ideas and practise cooperation.' },
        { id: 't2', text: 'Students can learn something new from classmates with different strengths.' },
        { id: 't3', text: 'However, some students do most of the work while others contribute very little.' },
        { id: 't4', text: 'This can make the final mark unfair.' },
        { id: 't5', text: 'A teacher may also struggle to see who planned the project and who simply followed the group.' },
      ] },
      { id: 'coherence', sentences: [
        { id: 'c1', text: 'Working alone can help a student focus.' },
        { id: 'c2', text: 'Teachers can see what that student understands.' },
        { id: 'c3', text: 'Students also need to learn how to work with other people.' },
        { id: 'c4', text: 'Schools should use more than one type of assignment.' },
        { id: 'c5', text: 'For example, a short individual reflection could follow a shared presentation so that students explain their own learning.' },
      ] },
      { id: 'lexical', sentences: [
        { id: 'l1', text: 'A good way to solve this problem is to give everyone a clear job.' },
        { id: 'l2', text: 'The teacher can look at the work of each person.' },
        { id: 'l3', text: 'This makes the group task better and helps students do useful work.' },
        { id: 'l4', text: 'Students would know what they are expected to contribute before the project begins.' },
      ] },
      { id: 'conclusion', sentences: [
        { id: 'e1', text: 'In conclusion, group work can build cooperation, while individual work shows personal progress.' },
        { id: 'e2', text: 'A balanced programme help students develop both abilities.' },
        { id: 'e3', text: 'Teachers should make each learner responsible for a clear part of a shared project.' },
        { id: 'e4', text: 'If both the group result and individual effort matter, students can practise teamwork without losing personal accountability.' },
      ] },
    ],
    grammarIssues: [
      { sentenceId: 'i2', accepted: ['Each method has supporters because students need different skills.'], explanation: '“Each method” — единственное число, поэтому “has”.' },
      { sentenceId: 'e2', accepted: ['A balanced programme helps students develop both abilities.'], explanation: 'Единственное число “programme” требует “helps”.' },
    ],
    revisions: {
      task: { paragraphId: 'task', instruction: 'Уточни пользу группового проекта и оцени риск несправедливой оценки. Свяжи вывод со своей позицией.', example: 'Group projects can teach students to explain ideas, divide tasks and solve disagreements. For example, a science presentation requires both research and clear communication. However, a shared mark may hide the fact that one student did most of the work. In my view, group tasks are valuable only when teachers can also assess each person’s contribution.', explanation: 'Пример показывает конкретный механизм обучения и условие, при котором автор поддерживает групповые задания.' },
      coherence: { paragraphId: 'coherence', instruction: 'Свяжи аргументы об индивидуальной работе с общим выводом. Сделай понятным, зачем нужны оба формата.', example: 'Individual assignments, by contrast, make each learner’s understanding easier to assess. They also give quieter students time to develop an idea without pressure from a group. Still, independent work does not teach negotiation or shared responsibility. For this reason, a balanced programme should include both individual tasks and carefully designed projects.', explanation: 'Переходы связывают преимущества, ограничение и вывод в одну последовательность.' },
      lexical: { paragraphId: 'lexical', instruction: 'Уточни общие слова “good”, “look” и “better” словами, которые точно описывают оценивание.', example: 'One practical solution is to assign each student a defined role within the project. The teacher can then assess individual contributions alongside the final group result. Clear responsibilities also help students explain what they learned from working with their peers. This makes the assessment fairer while preserving the benefits of collaboration.', explanation: 'Точная лексика объясняет, что именно меняется в организации и оценке работы.' },
    },
    nextPractice: 'Придумай пример задания, где нужны и индивидуальная ответственность, и сотрудничество. Объясни, как учитель оценит оба навыка.',
  },
];
