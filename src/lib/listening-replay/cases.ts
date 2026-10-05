export type ListeningItem = {
  id: string;
  question: string;
  answer: string;
  answerType: string;
  cues: string[];
  cue: string;
  transcript: string;
  segment: string;
  explanation: string;
};

export const answerTypes = ['День недели', 'Время', 'Место', 'Число', 'Предмет во множественном числе'];
export const helpLevels = ['Повтор всей записи', 'Короткий фрагмент', 'Фрагмент с закрытым ответом', 'Полный текст'];
export const diagnoses = ['Услышал первый вариант и пропустил исправление', 'Не расслышал слово', 'Не узнал перефразирование', 'Ошибка в написании', 'Потерял окончание множественного числа', 'Потерял место в вопросе', 'Не было затруднений', 'Пока не знаю'];

// Original scripts, rendered locally with Microsoft Zira English speech synthesis.
export const listeningCases: { id: string; title: string; first: ListeningItem; transfer: ListeningItem }[] = [
  {
    id: 'correction', title: 'Первый вариант или окончательное решение?',
    first: {
      id: 'workshop', question: 'The updated workshop day is _____.', answer: 'Thursday', answerType: 'День недели', cues: ['updated', 'workshop', 'day'], cue: 'updated',
      transcript: 'Here is an update about the photography workshop. The room is still the small studio beside the entrance, and the session starts at ten in the morning. We initially booked it for Tuesday, but the instructor is unavailable that day, so the workshop will now take place on Thursday. Please use the new day when you complete your booking. You do not need to bring a camera.',
      segment: 'We initially booked it for Tuesday, but the instructor is unavailable that day, so the workshop will now take place on Thursday.',
      explanation: 'Tuesday — первоначальная дата. После «but» говорящий исправляет её на Thursday. Вопрос спрашивает обновлённый день, а не время или место.',
    },
    transfer: {
      id: 'delivery', question: 'The revised delivery day is _____.', answer: 'Friday', answerType: 'День недели', cues: ['delivery', 'revised', 'day'], cue: 'revised',
      transcript: 'This is a message for everyone waiting for the new library desks. The delivery team will use the back entrance, so please keep that area clear. The original delivery day was Monday, but a vehicle repair has delayed the journey, and the desks will now arrive on Friday. The team will telephone the office shortly before arriving. There is no change to the number of desks in the order.',
      segment: 'The original delivery day was Monday, but a vehicle repair has delayed the journey, and the desks will now arrive on Friday.',
      explanation: 'Monday относится к первоначальному плану; revised и «now arrive» направляют к Friday. Остальные сведения не отвечают на вопрос о дне.',
    },
  },
  {
    id: 'plural', title: 'Что нужно принести самому?',
    first: {
      id: 'garden', question: 'Each visitor should bring a pair of _____.', answer: 'gloves', answerType: 'Предмет во множественном числе', cues: ['visitor', 'should bring', 'pair'], cue: 'should bring',
      transcript: 'Welcome to the community garden visit. We will meet beside the main gate at nine, and a guide will show you where to put your bags. Safety goggles will be provided by the garden. However, each visitor needs to bring a pair of gloves for handling the plants. Please choose a comfortable pair that you can wear outside. Drinking water will be available at the meeting point.',
      segment: 'Safety goggles will be provided by the garden. However, each visitor needs to bring a pair of gloves for handling the plants.',
      explanation: 'Goggles выдаёт организатор. Самому нужно принести gloves. После «a pair of» сохраняем форму множественного числа; ответ glove не подходит.',
    },
    transfer: {
      id: 'walk', question: 'Each participant must bring a pair of _____.', answer: 'boots', answerType: 'Предмет во множественном числе', cues: ['participant', 'must bring', 'pair'], cue: 'must bring',
      transcript: 'Before the nature walk, please check the equipment list. The group will meet at the visitor centre, and the route will take around two hours. Waterproof coats can be borrowed at the centre. However, every participant must bring a pair of boots because parts of the path may be muddy. Choose a pair that you have already worn. The guide will provide a map before the walk begins.',
      segment: 'Waterproof coats can be borrowed at the centre. However, every participant must bring a pair of boots because parts of the path may be muddy.',
      explanation: 'Coats можно взять на месте. Участник должен принести boots. Вопрос требует один предмет во множественном числе, без «a pair of» в ответе.',
    },
  },
];

export function answerMatches(value: string, item: ListeningItem) {
  return value.trim().toLowerCase() === item.answer.toLowerCase();
}
export function maskedSegment(item: ListeningItem) {
  return item.segment.replace(new RegExp(`\\b${item.answer}\\b`, 'gi'), '[_____]');
}
