export type Model = { variable: string; setup: number; rate: number; total: number; form: string };
export type TranslationItem = { prompt: string; unit: string; variable: string; setup: number; rate: number; total: number; answer: number; explanation: string };
export const forms = [
  { id: 'once', label: 'Разовый платёж + ставка × x = общая сумма' },
  { id: 'repeated', label: '(Разовый платёж + ставка) × x = общая сумма' },
  { id: 'omitted', label: 'Ставка × x = общая сумма' },
];
export const translationCases: { title: string; items: TranslationItem[] }[] = [
  { title: 'Разовый взнос и месяцы', items: [
    { prompt: 'A sports club charges a one-time joining fee of $40 and a membership fee of $24 per month. Nora paid $184 altogether. For how many months did she pay membership fees?', unit: 'months', variable: 'months', setup: 40, rate: 24, total: 184, answer: 6, explanation: 'The joining fee is paid once. Only the $24 monthly fee is multiplied by the number of months: 40 + 24x = 184, so x = (184 − 40) / 24 = 6.' },
    { prompt: 'A language club charges a one-time registration fee of $25 and $18 per month. Amir paid $151 in total. How many months of membership did he pay for?', unit: 'months', variable: 'months', setup: 25, rate: 18, total: 151, answer: 7, explanation: 'The $25 registration fee is not monthly. The model is 25 + 18x = 151. Subtract 25, then divide 126 by 18: 7 months.' },
  ] },
  { title: 'Подготовка заказа и количество', items: [
    { prompt: 'A printer charges a one-time setup fee of $18 for an order, plus $3 for each poster. An order cost $90 altogether. How many posters were in the order?', unit: 'posters', variable: 'posters', setup: 18, rate: 3, total: 90, answer: 24, explanation: 'Setup belongs to the whole order; $3 belongs to each poster. The model is 18 + 3x = 90, so x = (90 − 18) / 3 = 24 posters.' },
    { prompt: 'Another printer charges a one-time setup fee of $12 and $4 per poster. The total price of an order was $116. How many posters were printed?', unit: 'posters', variable: 'posters', setup: 12, rate: 4, total: 116, answer: 26, explanation: 'The model is 12 + 4x = 116. The posters alone cost 104 dollars; at 4 dollars each, there are 26 posters.' },
  ] },
];

// Empty strings and arbitrary numeric coercions must never become valid answers.
export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && Math.abs(parsed) <= 1_000_000 ? parsed : null;
}
export function modelMatches(model: Model, item: TranslationItem): boolean {
  return model.variable === item.variable && model.setup === item.setup && model.rate === item.rate && model.total === item.total && model.form === 'once';
}
export function modelSolution(model: Model): number {
  return model.form === 'once' ? (model.total - model.setup) / model.rate : model.form === 'repeated' ? model.total / (model.setup + model.rate) : model.total / model.rate;
}
export function equation(model: Model): string {
  return model.form === 'once' ? `${model.setup} + ${model.rate}x = ${model.total}` : model.form === 'repeated' ? `(${model.setup} + ${model.rate})x = ${model.total}` : `${model.rate}x = ${model.total}`;
}
export const near = (a: number, b: number) => Math.abs(a - b) <= 0.01;
