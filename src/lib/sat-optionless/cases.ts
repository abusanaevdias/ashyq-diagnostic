export type OptionlessItem = {
  passage: string;
  question: string;
  predictionPrompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  modelPrediction: string;
};

export type OptionlessCase = {
  id: string;
  title: string;
  domain: string;
  predictionType: 'text' | 'relation' | 'punctuation';
  relationChoices?: string[];
  first: OptionlessItem;
  transfer: OptionlessItem;
};

// Original short SAT-style practice items. No College Board question text is used.
export const optionlessCases: OptionlessCase[] = [
  {
    id: 'words', title: 'Слово в контексте', domain: 'Craft and Structure', predictionType: 'text',
    first: {
      passage: 'When heavy rain threatened the riverside garden, volunteers built a low wall of sandbags. The wall curbed the flow long enough for them to move young plants to higher ground.',
      question: 'Which choice best expresses the meaning of “curbed” as used in the text?',
      predictionPrompt: 'До вариантов напиши свой синоним для “curbed” в этом контексте.',
      choices: ['measured', 'held back', 'described', 'copied'], correctIndex: 1,
      explanation: 'Sandbags slowed or held back the water. “Measured” and “described” are possible actions near a river, but not the action of this wall.',
      modelPrediction: 'held back / slowed',
    },
    transfer: {
      passage: 'The school planted trees beside a busy road. Within a few years, the dense leaves muted some of the traffic noise in nearby classrooms, although the road itself remained just as busy.',
      question: 'Which choice best expresses the meaning of “muted” as used in the text?',
      predictionPrompt: 'Напиши свой синоним для “muted”, прежде чем увидеть варианты.',
      choices: ['reduced', 'recorded', 'predicted', 'repeated'], correctIndex: 0,
      explanation: 'Leaves reduced the sound reaching classrooms; they did not change traffic or record it.',
      modelPrediction: 'reduced / softened',
    },
  },
  {
    id: 'transitions', title: 'Логический переход', domain: 'Expression of Ideas', predictionType: 'relation',
    relationChoices: ['Контраст', 'Причина → следствие', 'Пример', 'Продолжение'],
    first: {
      passage: 'The new water filter uses fewer materials than the old model. _____, it takes twice as long to assemble. Engineers are now trying to simplify the assembly process.',
      question: 'Which choice completes the text with the most logical transition?',
      predictionPrompt: 'Как связаны первое и второе предложения?',
      choices: ['For example', 'However', 'Therefore', 'Similarly'], correctIndex: 1,
      explanation: 'The second sentence contrasts an advantage (fewer materials) with a disadvantage (longer assembly). “However” marks that contrast.',
      modelPrediction: 'Контраст',
    },
    transfer: {
      passage: 'A storm damaged the bridge over the eastern canal. _____, delivery trucks used a longer route through the town until the bridge reopened.',
      question: 'Which choice completes the text with the most logical transition?',
      predictionPrompt: 'Как связаны повреждение моста и новый маршрут?',
      choices: ['Nevertheless', 'For instance', 'As a result', 'Likewise'], correctIndex: 2,
      explanation: 'The changed route is a result of the damaged bridge. “As a result” expresses cause and consequence.',
      modelPrediction: 'Причина → следствие',
    },
  },
  {
    id: 'punctuation', title: 'Поставь знак сам', domain: 'Standard English Conventions', predictionType: 'punctuation',
    first: {
      passage: 'Although the samples were small_____the pattern was consistent across all three groups.',
      question: 'Which choice correctly completes the text?',
      predictionPrompt: 'Какой знак нужен на месте пропуска? Впиши только знак.',
      choices: [',', ';', ':', '—'], correctIndex: 0,
      explanation: 'An introductory dependent clause beginning with “Although” is followed by a comma before the independent clause.',
      modelPrediction: ',',
    },
    transfer: {
      passage: 'After the storm passed_____the researchers returned to the coastal station to check their instruments.',
      question: 'Which choice correctly completes the text?',
      predictionPrompt: 'Впиши только знак, который отделяет вступительную часть.',
      choices: [';', ',', ':', 'no punctuation'], correctIndex: 1,
      explanation: 'The introductory phrase “After the storm passed” is followed by a comma.',
      modelPrediction: ',',
    },
  },
  {
    id: 'central', title: 'Главная мысль', domain: 'Information and Ideas', predictionType: 'text',
    first: {
      passage: 'Researchers compared two rooftop gardens during a hot summer. The garden with deeper soil stayed cooler for longer after sunset. Both gardens grew healthy plants, but the deeper soil also reduced the building’s indoor temperature on several evenings.',
      question: 'Which choice best states the main idea of the text?',
      predictionPrompt: 'Сформулируй главную мысль одним предложением до появления вариантов.',
      choices: ['All rooftops should have gardens.', 'Deeper soil may provide cooling benefits in rooftop gardens.', 'The researchers studied only indoor plants.', 'Summer temperatures always fall after sunset.'], correctIndex: 1,
      explanation: 'The comparison centers on the additional cooling associated with deeper soil. The other choices overstate, contradict, or miss the focus.',
      modelPrediction: 'The garden with deeper soil had an additional cooling effect.',
    },
    transfer: {
      passage: 'A town library began lending small tool kits alongside books. In the first six months, residents used the kits mostly for short home repairs. Staff then added instruction sheets because borrowers often asked how to use unfamiliar tools safely.',
      question: 'Which choice best states the main idea of the text?',
      predictionPrompt: 'Сформулируй главную мысль до появления вариантов.',
      choices: ['The library expanded a tool-lending service in response to how residents used it.', 'Libraries should replace books with tools.', 'Most residents already knew how to use every tool.', 'Instruction sheets ended all home repair problems.'], correctIndex: 0,
      explanation: 'The passage describes a tool-lending service and a practical change based on borrower needs; the other choices go beyond or against the text.',
      modelPrediction: 'The library adapted its tool-lending service to users’ needs.',
    },
  },
  {
    id: 'synthesis', title: 'Риторическая цель', domain: 'Expression of Ideas', predictionType: 'text',
    first: {
      passage: 'Student notes: A school garden opened in 2023. Biology classes use it to observe insects. Art classes use it to draw plants. The student wants to emphasize how different subjects use the same space.',
      question: 'Which choice best uses the notes to accomplish the student’s goal?',
      predictionPrompt: 'Опиши, что должно сделать итоговое предложение, не видя вариантов.',
      choices: ['The garden opened in 2023.', 'In the school garden, biology students observe insects while art students draw plants.', 'Insects live in many gardens.', 'Art students can draw plants in many places.'], correctIndex: 1,
      explanation: 'Only the second choice explicitly connects both subjects to the same garden, fulfilling the stated goal.',
      modelPrediction: 'Show biology and art using the same garden for different activities.',
    },
    transfer: {
      passage: 'Student notes: A local museum offers an audio guide in three languages. Printed labels are available in the same languages. The student wants to emphasize two ways visitors can access multilingual explanations.',
      question: 'Which choice best uses the notes to accomplish the student’s goal?',
      predictionPrompt: 'Опиши функцию нужного предложения до появления вариантов.',
      choices: ['The museum has visitors from several countries.', 'The museum uses printed labels.', 'Visitors can use either an audio guide or printed labels to read or hear explanations in three languages.', 'Many museums offer audio guides.'], correctIndex: 2,
      explanation: 'The third choice includes both forms of access and the shared three-language feature required by the goal.',
      modelPrediction: 'Mention both audio and printed explanations in three languages.',
    },
  },
];
