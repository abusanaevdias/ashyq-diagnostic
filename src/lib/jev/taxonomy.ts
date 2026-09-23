/** Draft labels for observable properties of a short written answer. */
export const JEV_TAXONOMY_VERSION = 'synthetic-draft-2';

export const JEV_LABELS = [
  {
    code: 'relation_changed',
    title: 'Искажена связь между фактами',
    criterion: 'The answer changes an explicit contrast, cause, condition, or time relation in the source. Prefer this over source_contradiction when the relation itself is the error.',
  },
  {
    code: 'source_contradiction',
    title: 'Факт противоречит тексту',
    criterion: 'The answer states a fact opposite to the source, without changing an explicit logical relation.',
  },
  {
    code: 'missing_required_part',
    title: 'Пропущена часть ответа',
    criterion: 'The answer includes a correct part but omits another part explicitly required by the question and rubric.',
  },
  {
    code: 'unsupported_detail',
    title: 'Деталь без опоры на текст',
    criterion: 'The answer adds a factual claim that the source does not support, without directly contradicting the source.',
  },
  {
    code: 'no_supported_label',
    title: 'Тип ошибки не определён',
    criterion: 'The answer is acceptable, the evidence is insufficient, or more than one of the other labels is equally plausible. Do not force a specific error.',
  },
] as const;

export const RULE_LABELS = [
  { code: 'missing_answer', title: 'Ответ отсутствует' },
  { code: 'word_limit_exceeded', title: 'Превышен лимит слов' },
] as const;

export type JevChoiceCode = (typeof JEV_LABELS)[number]['code'];
export type JevLabelCode = JevChoiceCode | (typeof RULE_LABELS)[number]['code'];

export function isJevChoiceCode(value: unknown): value is JevChoiceCode {
  return typeof value === 'string' && JEV_LABELS.some((label) => label.code === value);
}

export function isJevLabelCode(value: unknown): value is JevLabelCode {
  return isJevChoiceCode(value) || (typeof value === 'string' && RULE_LABELS.some((label) => label.code === value));
}

export function labelTitle(code: JevLabelCode): string {
  return [...JEV_LABELS, ...RULE_LABELS].find((label) => label.code === code)?.title ?? code;
}
