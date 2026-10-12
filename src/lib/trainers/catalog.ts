export const trainerCatalog = [
  { id: 'reading-evidence', title: 'Докажи ответ текстом', href: '/trainers/reading-evidence', exam: 'IELTS', skill: 'Reading' },
  { id: 'listening-replay', title: 'Услышь, где меняется ответ', href: '/trainers/listening-replay', exam: 'IELTS', skill: 'Listening' },
  { id: 'speaking-second-take', title: 'Запиши ответ второй раз', href: '/trainers/speaking-second-take', exam: 'IELTS', skill: 'Speaking' },
  { id: 'task1-overview', title: 'Выдели главное на графике', href: '/trainers/task1-overview', exam: 'IELTS', skill: 'Writing Task 1' },
  { id: 'writing-task2', title: 'Улучши эссе сам', href: '/writing/trainer/practice', exam: 'IELTS', skill: 'Writing Task 2' },
  { id: 'writing-drills', title: 'Отработай один навык за раз', href: '/writing/trainer/drills', exam: 'IELTS', skill: 'Writing' },
  { id: 'sat-optionless', title: 'Реши до вариантов', href: '/trainers/sat-optionless', exam: 'SAT', skill: 'Reading & Writing' },
  { id: 'sat-distractor', title: 'Разбери ложные варианты', href: '/trainers/sat-distractor', exam: 'SAT', skill: 'Reading & Writing' },
  { id: 'math-forensics', title: 'Найди первую ошибку', href: '/trainers/math-forensics', exam: 'SAT', skill: 'Math' },
  { id: 'sat-translation', title: 'От текста к уравнению', href: '/trainers/sat-translation', exam: 'SAT', skill: 'Math' },
  { id: 'math-method-switch', title: 'Сравни способы решения', href: '/trainers/math-method-switch', exam: 'SAT', skill: 'Math' },
] as const;
export type TrainerId = typeof trainerCatalog[number]['id'];
export const trainerById = (id: TrainerId) => trainerCatalog.find(item => item.id === id)!;
