export const distractorReasons = [
  { id: 'may-be-correct', label: 'Возможно, это лучший ответ' },
  { id: 'unsupported', label: 'В тексте нет подтверждения' },
  { id: 'too-broad', label: 'Слишком широко' },
  { id: 'too-narrow', label: 'Слишком узко' },
  { id: 'too-strong', label: 'Слишком категорично' },
  { id: 'opposite', label: 'Противоречит тексту' },
  { id: 'scope-shift', label: 'Меняет предмет утверждения' },
  { id: 'wrong-comparison', label: 'Сравнивает не те величины' },
] as const;

export type ReasonId = typeof distractorReasons[number]['id'];

export type DistractorItem = {
  passage: string;
  question: string;
  choices: { text: string; reason: ReasonId | 'best'; explanation: string }[];
  correctIndex: number;
  takeaway: string;
};

export type DistractorCase = {
  id: string;
  title: string;
  domain: string;
  first: DistractorItem;
  transfer: DistractorItem;
};

// Original short SAT-style practice content; no official question text.
export const distractorCases: DistractorCase[] = [
  {
    id: 'main-idea', title: 'Главная мысль без преувеличения', domain: 'Information and Ideas · Central Ideas',
    first: {
      passage: 'At three city schools, staff placed small reading carts in hallways. Students borrowed books from the carts during breaks. Staff noticed that the carts were used most often on days when the central library was closed for meetings.',
      question: 'Which choice best states the main idea of the text?',
      correctIndex: 0,
      choices: [
        { text: 'Hallway carts gave students another way to borrow books, especially when the library was closed.', reason: 'best', explanation: 'This includes the carts’ purpose and the key observation without claiming more than the text says.' },
        { text: 'Hallway carts completely replaced the libraries at all three schools.', reason: 'too-strong', explanation: '“Completely replaced” goes far beyond an alternative used during breaks and closures.' },
        { text: 'Students borrowed mostly science-fiction books from the carts.', reason: 'unsupported', explanation: 'The passage never identifies the genres borrowed.' },
        { text: 'Schools should stop holding meetings in their central libraries.', reason: 'scope-shift', explanation: 'The text reports cart use; it does not make a recommendation about meeting locations.' },
      ],
      takeaway: 'Сверь масштаб вывода с текстом: «дополнительный способ» не равно «полная замена».',
    },
    transfer: {
      passage: 'A town opened two temporary book-drop points near bus stops. Residents returned library books there on their way to work. The points were busiest on mornings when the main library opened later than usual.',
      question: 'Which choice best states the main idea of the text?',
      correctIndex: 2,
      choices: [
        { text: 'The main library was never open in the morning.', reason: 'too-strong', explanation: 'It opened later than usual on some mornings, not never.' },
        { text: 'The book-drop points were designed only for bus drivers.', reason: 'unsupported', explanation: 'No such user restriction appears in the passage.' },
        { text: 'Temporary book-drop points offered a convenient return option, particularly when the library opened late.', reason: 'best', explanation: 'This preserves both the service and the observed timing.' },
        { text: 'The town should replace its bus stops with larger libraries.', reason: 'scope-shift', explanation: 'This recommendation is unrelated to the reported book returns.' },
      ],
      takeaway: 'Новый текст снова требует умеренного вывода из наблюдения, без «never» и выдуманных советов.',
    },
  },
  {
    id: 'comparison', title: 'Что именно сравнивают?', domain: 'Information and Ideas · Command of Evidence',
    first: {
      passage: 'Two neighborhoods planted shade trees. North added 40 trees and South added 20. The same monitoring method found that average afternoon temperature fell by 2°C in North and 1°C in South. The project did not collect household energy bills.',
      question: 'Which choice is best supported by the text?',
      correctIndex: 1,
      choices: [
        { text: 'North was always cooler than South before and after planting.', reason: 'wrong-comparison', explanation: 'The passage compares changes in temperature, not the absolute temperatures of the neighborhoods.' },
        { text: 'The measured temperature drop was larger in North than in South.', reason: 'best', explanation: 'The reported drops are 2°C in North and 1°C in South.' },
        { text: 'Shade trees reduced household energy bills in both neighborhoods.', reason: 'unsupported', explanation: 'Energy bills were not collected.' },
        { text: 'Every household in North experienced exactly a 2°C drop.', reason: 'too-strong', explanation: 'The figure is an average afternoon temperature change, not a value for every household.' },
      ],
      takeaway: 'Не заменяй разницу изменений абсолютным сравнением и не превращай среднее в «каждый дом».',
    },
    transfer: {
      passage: 'Two community gardens tracked weekly visitors before and after adding benches. Garden A recorded an increase of 30 visitors per week; Garden B recorded an increase of 10. The records do not state how many visitors each garden had before the benches were added.',
      question: 'Which choice is best supported by the text?',
      correctIndex: 3,
      choices: [
        { text: 'Garden A had more total visitors than Garden B after the benches were added.', reason: 'wrong-comparison', explanation: 'Only the increases are known; the original totals are not.' },
        { text: 'Every visitor used a new bench.', reason: 'too-strong', explanation: 'The records count visits, not bench use by each person.' },
        { text: 'The benches made both gardens equally popular.', reason: 'unsupported', explanation: 'No total popularity comparison or causal proof appears in the records.' },
        { text: 'The increase in weekly visitors was larger at Garden A than at Garden B.', reason: 'best', explanation: 'The recorded increases are 30 and 10 visitors per week.' },
      ],
      takeaway: 'Известно изменение посещаемости, а не итоговый размер аудитории каждого сада.',
    },
  },
];

export function expectedReason(item: DistractorItem, choiceIndex: number): ReasonId {
  return choiceIndex === item.correctIndex ? 'may-be-correct' : item.choices[choiceIndex].reason as ReasonId;
}
