export type Method = "algebra" | "graph" | "table" | "other";
export const methods: Record<Method, string> = {
  algebra: "Алгебра",
  graph: "График",
  table: "Таблица",
  other: "Другой способ",
};
export type Item = {
  first: string;
  second: string;
  quadratic: boolean;
  slope: number;
  intercept: number;
  firstSlope: number;
  firstIntercept: number;
  x: number;
  y: number;
  explanation: string;
};
export const cases: { title: string; items: Item[] }[] = [
  {
    title: "Пересечение двух прямых",
    items: [
      {
        first: "y = 2x + 1",
        second: "y = −x + 10",
        quadratic: false,
        slope: -1,
        intercept: 10,
        firstSlope: 2,
        firstIntercept: 1,
        x: 3,
        y: 7,
        explanation:
          "2x + 1 = −x + 10 → 3x = 9 → x = 3. Подстановка в любое уравнение даёт y = 7.",
      },
      {
        first: "y = 3x − 2",
        second: "y = −x + 14",
        quadratic: false,
        slope: -1,
        intercept: 14,
        firstSlope: 3,
        firstIntercept: -2,
        x: 4,
        y: 10,
        explanation: "3x − 2 = −x + 14 → 4x = 16 → x = 4, y = 10.",
      },
    ],
  },
  {
    title: "Два пересечения. Одно условие.",
    items: [
      {
        first: "y = x²",
        second: "y = 2x + 3",
        quadratic: true,
        slope: 2,
        intercept: 3,
        firstSlope: 0,
        firstIntercept: 0,
        x: 3,
        y: 9,
        explanation:
          "x² − 2x − 3 = (x − 3)(x + 1) = 0. Пересечения: (−1, 1) и (3, 9). Условию x > 0 соответствует только (3, 9).",
      },
      {
        first: "y = x²",
        second: "y = 3x + 4",
        quadratic: true,
        slope: 3,
        intercept: 4,
        firstSlope: 0,
        firstIntercept: 0,
        x: 4,
        y: 16,
        explanation:
          "x² − 3x − 4 = (x − 4)(x + 1) = 0. Пересечения: (−1, 1) и (4, 16). Условию x > 0 соответствует только (4, 16).",
      },
    ],
  },
];
export function firstValue(item: Item, x: number) {
  return item.quadratic ? x * x : item.firstSlope * x + item.firstIntercept;
}
export function secondValue(item: Item, x: number) {
  return item.slope * x + item.intercept;
}
export function coordinate(text: string) {
  const trimmed = text.trim();
  return /^-?\d+(?:[.,]\d+)?$/.test(trimmed) &&
    Number.isFinite(Number(trimmed.replace(",", "."))) &&
    Math.abs(Number(trimmed.replace(",", "."))) <= 1e6
    ? Number(trimmed.replace(",", "."))
    : null;
}
