import type { Material } from '@/lib/types';

/** Материалы (условия, таблицы, модели) для SAT Math. */

export const SAT_MATH_MATERIALS: Material[] = [
  {
    id: 'sat-math-12-material',
    exam: 'sat',
    section: 'math',
    kind: 'table',
    tag: 'Data',
    title: 'Study time and test scores',
    text: 'A scatterplot (not shown) displays the weekly study time and test score of 40 students. The line of best fit for the data is given by the equation below.',
    table: {
      caption: 'Line of best fit',
      headers: ['y', '=', '3.2x', '+', '18'],
      rows: [['test score', '', 'hours studied per week', '', 'intercept']],
      note: 'x — hours studied per week (0 ≤ x ≤ 20); y — predicted test score out of 100.',
    },
  },
  {
    id: 'sat-math-20-material',
    exam: 'sat',
    section: 'math',
    kind: 'table',
    tag: 'Model',
    title: 'Sapling growth model',
    text: 'A botanist models the height of a sapling with the equation below, where h is the height in metres and t is the number of years after planting.',
    table: {
      caption: 'Growth model',
      headers: ['h', '=', '0.8t', '+', '1.2'],
      rows: [['height (m)', '', 'years after planting', '', 'height at planting (m)']],
      note: 'Модель линейная: прирост постоянен каждый год.',
    },
  },
];
