import type { Question } from '@/lib/types';

/**
 * SAT MATH — question bank.
 *
 * Все задачи оригинальные (не копии College Board).
 * Домены: Algebra · Advanced Math · Problem-Solving and Data Analysis ·
 *         Geometry and Trigonometry
 *
 * Каждое значение пересчитано вручную; решение — в поле explanation.
 *
 * Сложность: 3 easy / 8 medium / 5 hard (на выборку 8 вопросов берётся 2/4/2).
 */

export const SAT_MATH_QUESTIONS: Question[] = [
  /* -------------------------------------------------------------- */
  /* ALGEBRA                                                        */
  /* -------------------------------------------------------------- */
  {
    id: 'sat-math-01',
    exam: 'sat',
    section: 'math',
    domain: 'Algebra',
    skill: 'Linear equations in one variable',
    skillLabel: 'Math — Linear equations',
    difficulty: 'easy',
    kind: 'single-choice',
    prompt: 'If 5x − 8 = 2x + 76, what is the value of x?',
    options: [
      { id: 'A', label: '18' },
      { id: 'B', label: '24' },
      { id: 'C', label: '28' },
      { id: 'D', label: '32' },
    ],
    correctAnswer: 'C',
    explanation: '5x − 2x = 76 + 8 → 3x = 84 → x = 28. Проверка: 5·28 − 8 = 132 и 2·28 + 76 = 132.',
    weight: 1,
    tags: ['algebra', 'linear'],
  },
  {
    id: 'sat-math-02',
    exam: 'sat',
    section: 'math',
    domain: 'Algebra',
    skill: 'Linear equations in one variable (word problem)',
    skillLabel: 'Math — Linear word problem',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt:
      'A printing service charges a one-time setup fee of $25 plus $8 for each T-shirt printed. If a customer paid $225 in total, how many T-shirts were printed?',
    options: [
      { id: 'A', label: '22' },
      { id: 'B', label: '25' },
      { id: 'C', label: '28' },
      { id: 'D', label: '31' },
    ],
    correctAnswer: 'B',
    explanation: '25 + 8n = 225 → 8n = 200 → n = 25. Проверка: 25·8 + 25 = 225.',
    weight: 1.5,
    tags: ['algebra', 'linear', 'contextual'],
  },
  {
    id: 'sat-math-03',
    exam: 'sat',
    section: 'math',
    domain: 'Algebra',
    skill: 'Linear inequalities',
    skillLabel: 'Math — Inequalities',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt:
      'A cinema hall holds 200 people. Tickets cost $6 each, and the manager wants ticket income of at least $900 for a single screening. Which inequality represents all values of t, the number of tickets sold, that meet the manager’s goal?',
    options: [
      { id: 'A', label: 't ≥ 150, t ≤ 200' },
      { id: 'B', label: 't ≥ 150' },
      { id: 'C', label: 't ≤ 150, t ≥ 200' },
      { id: 'D', label: 't ≥ 90' },
    ],
    correctAnswer: 'A',
    explanation:
      '6t ≥ 900 → t ≥ 150. При этом зал физически вмещает 200 человек, поэтому t ≤ 200. Оба ограничения должны выполняться одновременно, значит верен A. D (90) получается, если поделить 900 на 10 вместо 6.',
    weight: 1.5,
    tags: ['algebra', 'inequalities', 'contextual'],
  },
  {
    id: 'sat-math-04',
    exam: 'sat',
    section: 'math',
    domain: 'Algebra',
    skill: 'Systems of two linear equations',
    skillLabel: 'Math — Systems',
    difficulty: 'hard',
    kind: 'single-choice',
    prompt:
      'If 3x + 2y = 24 and x − 2y = 0, what is the value of y?',
    options: [
      { id: 'A', label: '2' },
      { id: 'B', label: '3' },
      { id: 'C', label: '4' },
      { id: 'D', label: '6' },
    ],
    correctAnswer: 'B',
    explanation:
      'Сложим уравнения: 4x = 24 → x = 6. Подставим: 6 − 2y = 0 → y = 3. Проверка: 3·6 + 2·3 = 24. D — это значение x, типичная ошибка «остановился на полпути».',
    weight: 2,
    tags: ['algebra', 'systems'],
  },
  {
    id: 'sat-math-05',
    exam: 'sat',
    section: 'math',
    domain: 'Algebra',
    skill: 'Linear functions',
    skillLabel: 'Math — Linear functions',
    difficulty: 'easy',
    kind: 'single-choice',
    prompt:
      'The function f is defined by f(x) = 3x − 7. For what value of x is f(x) = 8?',
    options: [
      { id: 'A', label: '3' },
      { id: 'B', label: '5' },
      { id: 'C', label: '8' },
      { id: 'D', label: '15' },
    ],
    correctAnswer: 'B',
    explanation: '3x − 7 = 8 → 3x = 15 → x = 5. Проверка: 3·5 − 7 = 8.',
    weight: 1,
    tags: ['algebra', 'linear-functions'],
  },

  /* -------------------------------------------------------------- */
  /* ADVANCED MATH                                                  */
  /* -------------------------------------------------------------- */
  {
    id: 'sat-math-06',
    exam: 'sat',
    section: 'math',
    domain: 'Advanced Math',
    skill: 'Quadratic functions (maximum value)',
    skillLabel: 'Math — Quadratics',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt:
      'The function g is defined by g(x) = −x² + 6x − 5. What is the maximum value of g?',
    options: [
      { id: 'A', label: '3' },
      { id: 'B', label: '4' },
      { id: 'C', label: '5' },
      { id: 'D', label: '9' },
    ],
    correctAnswer: 'B',
    explanation:
      'Ветви параболы вниз (a = −1), вершина в x = −b/(2a) = −6/(2·−1) = 3. g(3) = −9 + 18 − 5 = 4. A — это x-координата вершины, а не значение функции.',
    weight: 1.5,
    tags: ['advanced-math', 'quadratics'],
  },
  {
    id: 'sat-math-07',
    exam: 'sat',
    section: 'math',
    domain: 'Advanced Math',
    skill: 'Exponential functions (growth model)',
    skillLabel: 'Math — Exponentials',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt:
      'A savings account holds $1,000 at the beginning of year 1 and earns 3% interest per year, compounded once per year. Which expression gives the balance, in dollars, at the end of year t?',
    options: [
      { id: 'A', label: '1,000(0.03)^t' },
      { id: 'B', label: '1,000(1.03)^t' },
      { id: 'C', label: '1,000 + 30t' },
      { id: 'D', label: '1,000(1.30)^t' },
    ],
    correctAnswer: 'B',
    explanation:
      'Каждый год баланс умножается на 1 + 0.03 = 1.03, поэтому 1 000·(1.03)^t. C описывает простые проценты (линейный рост), A использует саму ставку вместо множителя роста, D — рост на 30% в год.',
    weight: 1.5,
    tags: ['advanced-math', 'exponential'],
  },
  {
    id: 'sat-math-08',
    exam: 'sat',
    section: 'math',
    domain: 'Advanced Math',
    skill: 'Rational expressions',
    skillLabel: 'Math — Rational expressions',
    difficulty: 'hard',
    kind: 'single-choice',
    prompt:
      'For x > 3, which of the following is equivalent to (x² − 9) / (x² − 6x + 9)?',
    options: [
      { id: 'A', label: '(x + 3) / (x − 3)' },
      { id: 'B', label: '(x − 3) / (x + 3)' },
      { id: 'C', label: 'x + 3' },
      { id: 'D', label: '(x + 9) / (x − 9)' },
    ],
    correctAnswer: 'A',
    explanation:
      'Числитель: x² − 9 = (x − 3)(x + 3). Знаменатель: x² − 6x + 9 = (x − 3)². Сокращаем (x − 3): получаем (x + 3)/(x − 3). Условие x > 3 нужно, чтобы знаменатель не равнялся нулю.',
    weight: 2,
    tags: ['advanced-math', 'rational'],
  },
  {
    id: 'sat-math-09',
    exam: 'sat',
    section: 'math',
    domain: 'Advanced Math',
    skill: 'Polynomial expressions and zeros',
    skillLabel: 'Math — Polynomials',
    difficulty: 'hard',
    kind: 'single-choice',
    prompt:
      'The function h is defined by h(x) = x² + ax + b, where a and b are constants. If h has zeros at x = −2 and x = 6, what is the value of a?',
    options: [
      { id: 'A', label: '−12' },
      { id: 'B', label: '−4' },
      { id: 'C', label: '4' },
      { id: 'D', label: '12' },
    ],
    correctAnswer: 'B',
    explanation:
      'h(x) = (x + 2)(x − 6) = x² − 4x − 12. Значит a = −4 (и b = −12). A — это значение b, классическая подмена коэффициентов.',
    weight: 2,
    tags: ['advanced-math', 'polynomials'],
  },

  /* -------------------------------------------------------------- */
  /* PROBLEM-SOLVING AND DATA ANALYSIS                              */
  /* -------------------------------------------------------------- */
  {
    id: 'sat-math-10',
    exam: 'sat',
    section: 'math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'Ratios and proportional relationships',
    skillLabel: 'Math — Ratios',
    difficulty: 'easy',
    kind: 'single-choice',
    prompt:
      'A drink is made by mixing concentrate and water in the ratio 2 : 5 by volume. How many millilitres of concentrate are in 350 millilitres of the finished drink?',
    options: [
      { id: 'A', label: '70' },
      { id: 'B', label: '100' },
      { id: 'C', label: '140' },
      { id: 'D', label: '250' },
    ],
    correctAnswer: 'B',
    explanation:
      '2 части + 5 частей = 7 частей. 350 / 7 = 50 мл на часть. Концентрат: 2·50 = 100 мл. C получается, если взять 2/5 от 350 — типичная ошибка: доля считается от общей смеси, а не от воды.',
    weight: 1,
    tags: ['data-analysis', 'ratios', 'contextual'],
  },
  {
    id: 'sat-math-11',
    exam: 'sat',
    section: 'math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'One-variable data: mean, median, range',
    skillLabel: 'Math — Statistics',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt:
      'A data set consists of the values 2, 4, 4, 6, 8, 8, 10, 14. What are the mean, median and range of the data set, in that order?',
    options: [
      { id: 'A', label: '7, 7, 12' },
      { id: 'B', label: '7, 6, 12' },
      { id: 'C', label: '8, 7, 12' },
      { id: 'D', label: '7, 7, 10' },
    ],
    correctAnswer: 'A',
    explanation:
      'Сумма = 2+4+4+6+8+8+10+14 = 56; 56 / 8 = 7 — среднее. Медиана = (6 + 8) / 2 = 7. Range = 14 − 2 = 12.',
    weight: 1.5,
    tags: ['data-analysis', 'statistics'],
  },
  {
    id: 'sat-math-12',
    exam: 'sat',
    section: 'math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'Linear model from a scatterplot',
    skillLabel: 'Math — Scatterplots',
    difficulty: 'medium',
    kind: 'single-choice',
    materialId: 'sat-math-12-material',
    prompt:
      'Based on the line of best fit, what is the predicted test score, out of 100, for a student who studies 12 hours per week?',
    options: [
      { id: 'A', label: '38.4' },
      { id: 'B', label: '56.4' },
      { id: 'C', label: '56' },
      { id: 'D', label: '60' },
    ],
    correctAnswer: 'B',
    explanation:
      'y = 3.2·12 + 18 = 38.4 + 18 = 56.4. A — это только часть 3.2·12, без intercept.',
    weight: 1.5,
    tags: ['data-analysis', 'scatterplot', 'contextual'],
  },
  {
    id: 'sat-math-13',
    exam: 'sat',
    section: 'math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'Rates and units',
    skillLabel: 'Math — Rates',
    difficulty: 'hard',
    kind: 'single-choice',
    prompt:
      'A bottling machine fills 240 bottles in 15 minutes at a constant rate. At this rate, how many minutes will the machine take to fill 1,000 bottles?',
    options: [
      { id: 'A', label: '60' },
      { id: 'B', label: '62.5' },
      { id: 'C', label: '64' },
      { id: 'D', label: '75' },
    ],
    correctAnswer: 'B',
    explanation:
      'Скорость: 240 / 15 = 16 бутылок в минуту. 1 000 / 16 = 62.5 минуты. Варианты 60 и 64 появляются при округлении скорости или результата — в задачах на rate промежуточное значение округлять нельзя.',
    weight: 2,
    tags: ['data-analysis', 'rates', 'contextual'],
  },

  /* -------------------------------------------------------------- */
  /* GEOMETRY AND TRIGONOMETRY                                      */
  /* -------------------------------------------------------------- */
  {
    id: 'sat-math-14',
    exam: 'sat',
    section: 'math',
    domain: 'Geometry and Trigonometry',
    skill: 'Similar triangles',
    skillLabel: 'Math — Similarity',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt:
      'At the same time of day, a vertical pole 1.5 metres tall casts a shadow 2 metres long, and a building casts a shadow 24 metres long. What is the height of the building, in metres?',
    options: [
      { id: 'A', label: '12' },
      { id: 'B', label: '16' },
      { id: 'C', label: '18' },
      { id: 'D', label: '32' },
    ],
    correctAnswer: 'C',
    explanation:
      'Треугольники подобны (одинаковый угол солнца): 1.5 / 2 = h / 24 → h = 1.5 · 12 = 18 м.',
    weight: 1.5,
    tags: ['geometry', 'similarity', 'contextual'],
  },
  {
    id: 'sat-math-15',
    exam: 'sat',
    section: 'math',
    domain: 'Geometry and Trigonometry',
    skill: 'Right triangles and basic trigonometry',
    skillLabel: 'Math — Trigonometry',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt:
      'In right triangle ABC, the right angle is at C. If AC = 12, BC = 5 and angle x is at vertex A, what is the value of sin x?',
    options: [
      { id: 'A', label: '5/12' },
      { id: 'B', label: '5/13' },
      { id: 'C', label: '12/13' },
      { id: 'D', label: '13/5' },
    ],
    correctAnswer: 'B',
    explanation:
      'Гипотенуза AB = √(12² + 5²) = √169 = 13. Угол x при вершине A, значит противолежащий катет — BC = 5. sin x = 5/13. C — это cos x.',
    weight: 1.5,
    tags: ['geometry', 'trigonometry'],
  },
  {
    id: 'sat-math-16',
    exam: 'sat',
    section: 'math',
    domain: 'Geometry and Trigonometry',
    skill: 'Volume and surface area',
    skillLabel: 'Math — Volume',
    difficulty: 'hard',
    kind: 'single-choice',
    prompt:
      'A cube-shaped water tank has a total surface area of 150 square metres. What is the volume of the tank, in cubic metres?',
    options: [
      { id: 'A', label: '25' },
      { id: 'B', label: '100' },
      { id: 'C', label: '125' },
      { id: 'D', label: '225' },
    ],
    correctAnswer: 'C',
    explanation:
      '6 граней: 6s² = 150 → s² = 25 → s = 5 м. Объём: 5³ = 125 м³. A — это площадь одной грани.',
    weight: 2,
    tags: ['geometry', 'volume'],
  },
  {
    id: 'sat-math-17',
    exam: 'sat',
    section: 'math',
    domain: 'Geometry and Trigonometry',
    skill: 'Angles and triangles',
    skillLabel: 'Math — Angles',
    difficulty: 'easy',
    kind: 'single-choice',
    prompt:
      'In an isosceles triangle, two of the interior angles each measure x°, and the third measures 40°. What is the value of x?',
    options: [
      { id: 'A', label: '50' },
      { id: 'B', label: '70' },
      { id: 'C', label: '80' },
      { id: 'D', label: '100' },
    ],
    correctAnswer: 'B',
    explanation: '2x + 40 = 180 → 2x = 140 → x = 70. C (80) — это сумма двух равных углов, а не один угол. D (100) получится, если вычесть 40 из 180 и принять остаток за искомый угол.',
    weight: 1,
    tags: ['geometry', 'angles'],
  },
  {
    id: 'sat-math-18',
    exam: 'sat',
    section: 'math',
    domain: 'Geometry and Trigonometry',
    skill: 'Circles in the coordinate plane',
    skillLabel: 'Math — Circles',
    difficulty: 'hard',
    kind: 'single-choice',
    prompt:
      'A circle in the xy-plane has its center at (2, −3) and passes through the point (5, 1). What is the radius of the circle?',
    options: [
      { id: 'A', label: '4' },
      { id: 'B', label: '5' },
      { id: 'C', label: '7' },
      { id: 'D', label: '25' },
    ],
    correctAnswer: 'B',
    explanation:
      'r = √((5 − 2)² + (1 − (−3))²) = √(9 + 16) = √25 = 5. D — это r², частая ошибка при переходе от уравнения окружности к радиусу.',
    weight: 2,
    tags: ['geometry', 'circles'],
  },
  {
    id: 'sat-math-19',
    exam: 'sat',
    section: 'math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'Percentages and unit conversion',
    skillLabel: 'Math — Percentages',
    difficulty: 'medium',
    kind: 'single-choice',
    prompt:
      'A shop reduces the price of a jacket from 24,000 tenge to 18,000 tenge. By what percent was the price reduced?',
    options: [
      { id: 'A', label: '20%' },
      { id: 'B', label: '25%' },
      { id: 'C', label: '30%' },
      { id: 'D', label: '33%' },
    ],
    correctAnswer: 'B',
    explanation:
      'Скидка: 24 000 − 18 000 = 6 000. Процент считается от исходной цены: 6 000 / 24 000 = 0.25 = 25%. D (33%) получается, если поделить скидку на новую цену 18 000 — частая ошибка.',
    weight: 1.5,
    tags: ['data-analysis', 'percentages', 'contextual'],
  },
  {
    id: 'sat-math-20',
    exam: 'sat',
    section: 'math',
    domain: 'Algebra',
    skill: 'Linear equations in two variables (slope in context)',
    skillLabel: 'Math — Slope in context',
    difficulty: 'hard',
    kind: 'single-choice',
    materialId: 'sat-math-20-material',
    prompt:
      'In the model, what does the number 0.8 represent?',
    options: [
      {
        id: 'A',
        label: 'The predicted height of a sapling at the moment it is planted',
      },
      {
        id: 'B',
        label: 'The increase in height, in metres, for each additional year of growth',
      },
      {
        id: 'C',
        label: 'The number of years needed for the sapling to reach 1.2 metres',
      },
      {
        id: 'D',
        label: 'The total height of the sapling after one year',
      },
    ],
    correctAnswer: 'B',
    explanation:
      'h = 0.8t + 1.2 — линейная модель: 0.8 это наклон, то есть прирост 0.8 м за каждый год. 1.2 — высота при t = 0 (в момент посадки), поэтому A и C описывают не тот коэффициент, а D равен 0.8·1 + 1.2 = 2.0.',
    weight: 2,
    tags: ['algebra', 'linear-functions', 'contextual'],
  },
];
