export const speakingPrompts = [
  { title: 'A skill you learned with someone else', bullets: ['What the skill was', 'Who helped you and how', 'What was difficult at first', 'Explain what changed when you became more confident'] },
  { title: 'A small project you completed with another person', bullets: ['What you worked on', 'How you divided the work', 'What problem you encountered', 'Explain what you learned from working together'] },
];
export const speakingCriteria = [
  { name: 'Fluency and Coherence', help: 'Связаны ли идеи? Где пришлось долго искать продолжение?' },
  { name: 'Lexical Resource', help: 'Где не хватило точного слова или повторялась одна фраза?' },
  { name: 'Grammatical Range and Accuracy', help: 'Какие предложения было трудно закончить? Какие формы стоит проверить?' },
  { name: 'Pronunciation', help: 'Какие слова или ударения стоит переслушать и проверить?' },
];
export const markerKinds = ['Долгая пауза', 'Повтор фразы', 'Не хватило слова', 'Трудно закончить предложение', 'Не уверен в произношении'];
export const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
