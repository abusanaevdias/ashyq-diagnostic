import type { Question } from '@/lib/types';

/**
 * IELTS LISTENING — question bank.
 *
 * Две оригинальные записи (социальный разговор + учебный разговор),
 * 4 вопроса: multiple choice · note completion · matching.
 *
 * Аудио: public/audio/ielts/listening-1.mp3 и listening-2.mp3.
 * Если файла нет, плеер честно уходит в fallback-режим (см. components/listening/AudioPlayer).
 * Browser TTS используется ТОЛЬКО как временный preview, не как production-решение.
 */

export const IELTS_LISTENING_QUESTIONS: Question[] = [
  {
    id: 'ielts-l-01',
    exam: 'ielts',
    section: 'listening',
    domain: 'Form completion',
    skill: 'Listening for specific numbers and prices',
    skillLabel: 'Listening — Detail',
    difficulty: 'easy',
    kind: 'single-choice',
    materialId: 'ielts-listening-1',
    groupKey: 'ielts-listening-1',
    prompt: 'What is the monthly membership fee for a student with a student card?',
    options: [
      { id: 'A', label: '£30' },
      { id: 'B', label: '£35' },
      { id: 'C', label: '£45' },
      { id: 'D', label: '£50' },
    ],
    correctAnswer: 'C',
    explanation:
      'В записи: «That’s fifty pounds a month normally, but with a student card it’s forty-five.» £50 — обычная цена, £45 — цена для студентов. £30 — это размер скидки в разговоре, а не цена.',
    weight: 1,
    tags: ['listening-detail', 'numbers'],
  },
  {
    id: 'ielts-l-02',
    exam: 'ielts',
    section: 'listening',
    domain: 'Multiple choice',
    skill: 'Distinguishing similar time details',
    skillLabel: 'Listening — Time details',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'ielts-listening-1',
    groupKey: 'ielts-listening-1',
    prompt: 'When does the pool close earlier than usual?',
    options: [
      { id: 'A', label: 'On weekdays at 22:00' },
      { id: 'B', label: 'On Thursdays at 20:00' },
      { id: 'C', label: 'On Thursdays at 21:00' },
      { id: 'D', label: 'At weekends at 18:00' },
    ],
    correctAnswer: 'B',
    explanation:
      'Регистратор говорит, что бассейн закрывается в 21:00, «except on Thursdays, when it closes at eight for club training». 22:00 и 18:00 — это часы работы всего центра, а не бассейна.',
    weight: 1.5,
    tags: ['listening-detail', 'distractors'],
  },
  {
    id: 'ielts-l-03',
    exam: 'ielts',
    section: 'listening',
    domain: 'Note completion',
    skill: 'Listening for a number and writing it correctly',
    skillLabel: 'Listening — Note completion',
    difficulty: 'medium',
    kind: 'text-input',
    materialId: 'ielts-listening-2',
    groupKey: 'ielts-listening-2',
    prompt:
      'Complete the note. Write a NUMBER.\n\nEssay length: a minimum of ______________ words',
    acceptedAnswers: ['2500', '2,500', 'two thousand five hundred'],
    correctAnswer: '2500',
    explanation:
      'Мистер Грант: «The word limit is two thousand five hundred words minimum». В IELTS числа можно писать цифрами.',
    weight: 1.5,
    tags: ['listening-detail', 'numbers'],
  },
  {
    id: 'ielts-l-04',
    exam: 'ielts',
    section: 'listening',
    domain: 'Matching',
    skill: 'Tracking who is responsible for what',
    skillLabel: 'Listening — Matching',
    difficulty: 'hard',
    kind: 'single-choice',
    materialId: 'ielts-listening-2',
    groupKey: 'ielts-listening-2',
    prompt: 'Which task does Mr Grant give to Yerlan alone?',
    options: [
      { id: 'A', label: 'Collecting the survey data' },
      { id: 'B', label: 'Preparing the presentation slides' },
      { id: 'C', label: 'Writing the first draft of the essay' },
      { id: 'D', label: 'Choosing an article from the reading list' },
    ],
    correctAnswer: 'B',
    explanation:
      '«Dana, you take the data collection. Yerlan, you handle the presentation slides for next week.» Эссе они пишут вместе, поэтому C не подходит. D не распределялось — преподаватель лишь назвал статью хорошей отправной точкой.',
    weight: 2,
    tags: ['listening-matching', 'speakers'],
  },
];
