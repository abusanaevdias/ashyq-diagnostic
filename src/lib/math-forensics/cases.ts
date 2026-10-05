export type MathForensicsCase = {
  id: string;
  title: string;
  domain: 'Algebra' | 'Problem-Solving and Data Analysis';
  mechanism: string;
  mechanismOptions: string[];
  problem: string;
  steps: string[];
  wrongStepIndex: number;
  correctedStep: string;
  correctionWhy: string;
  finalAnswer: number;
  finalWorking: string;
  transfer: {
    problem: string;
    steps: string[];
    wrongStepIndex: number;
    answer: number;
    explanation: string;
  };
};

// All problems and worked solutions are original ASHYQ teaching examples.
export const mathForensicsCases: MathForensicsCase[] = [
  {
    id: 'distribution',
    title: 'Распределение множителя',
    domain: 'Algebra',
    mechanism: 'Множитель применили только к первому члену скобки',
    mechanismOptions: [
      'Множитель применили только к первому члену скобки',
      'Неверно сложили числа после раскрытия скобок',
      'Разделили обе части уравнения на разные числа',
    ],
    problem: 'Solve for x: 3(x − 4) = 18',
    steps: ['3(x − 4) = 18', '3x − 4 = 18', '3x = 22', 'x = 22/3'],
    wrongStepIndex: 1,
    correctedStep: '3x − 12 = 18',
    correctionWhy: 'При раскрытии скобок 3 умножается и на x, и на −4. Исправь именно первый неверный переход; последующие строки уже основаны на нём.',
    finalAnswer: 10,
    finalWorking: '3x − 12 = 18 → 3x = 30 → x = 10.',
    transfer: {
      problem: 'A student solves 4(x − 3) = 20. Find the first wrong line and then solve the equation yourself.',
      steps: ['4(x − 3) = 20', '4x − 3 = 20', '4x = 23', 'x = 23/4'],
      wrongStepIndex: 1,
      answer: 8,
      explanation: 'Первая ошибка — 4x − 3: нужно 4x − 12. Тогда 4x = 32 и x = 8.',
    },
  },
  {
    id: 'percent-base',
    title: 'Проценты от новой базы',
    domain: 'Problem-Solving and Data Analysis',
    mechanism: 'Повышение посчитали от исходной цены, а не от сниженной',
    mechanismOptions: [
      'Повышение посчитали от исходной цены, а не от сниженной',
      'Неверно вычислили первое снижение в процентах',
      'Проценты верны, но перепутали единицу измерения',
    ],
    problem: 'A jacket costs $100. Its price falls by 20%, then rises by 20% of the new price. What is the final price?',
    steps: ['Original price: $100', 'After 20% decrease: $80', 'After 20% increase: $100', 'Final price: $100'],
    wrongStepIndex: 2,
    correctedStep: 'After 20% increase: $96',
    correctionWhy: 'После скидки база равна $80. Следующее повышение составляет 20% от $80, то есть $16, а не $20.',
    finalAnswer: 96,
    finalWorking: '$80 + 0.20 × $80 = $96.',
    transfer: {
      problem: 'A service costs $150. Its price falls by 10%, then rises by 10% of the new price. Find the first wrong line and the final price.',
      steps: ['Original price: $150', 'After 10% decrease: $135', 'After 10% increase: $150', 'Final price: $150'],
      wrongStepIndex: 2,
      answer: 148.5,
      explanation: 'Первая ошибка — возврат к $150. Повышение равно 10% от $135 = $13.50, поэтому итог $148.50.',
    },
  },
];

export function parseNumericAnswer(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function numericAnswerMatches(input: string, expected: number): boolean {
  const value = parseNumericAnswer(input);
  return value !== null && Math.abs(value - expected) < 0.0000001;
}
