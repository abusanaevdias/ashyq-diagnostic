import type { MockModule, MockTemplateIdentity } from './types';

const VOLUMES = [16, 17, 18, 19, 20, 21] as const;
const TEST_NUMBERS = [1, 2, 3, 4] as const;
const MODULES: readonly MockModule[] = ['reading', 'listening'];

/** Metadata only. Copyrighted passages, recordings, URLs, answer keys, and band values do not belong here. */
export const MOCK_TEMPLATE_IDENTITIES: MockTemplateIdentity[] = VOLUMES.flatMap((volume) =>
  TEST_NUMBERS.flatMap((testNumber) =>
    MODULES.map((module) => ({
      id: `cambridge-${volume}-test-${testNumber}-${module}`,
      code: `cambridge-${volume}-test-${testNumber}-${module}`,
      exam: 'ielts_academic' as const,
      series: 'Cambridge IELTS Academic' as const,
      volume,
      testNumber,
      module,
    })),
  ),
);

export const MOCK_QUESTION_TYPE_TAXONOMY = [
  'multiple_choice',
  'true_false_not_given',
  'yes_no_not_given',
  'matching_information',
  'matching_headings',
  'matching_features',
  'matching_sentence_endings',
  'sentence_completion',
  'summary_completion',
  'note_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
  'short_answer',
  'plan_map_diagram_labelling',
] as const;

export const MOCK_SKILL_TAXONOMY = [
  'reading.main_idea',
  'reading.detail',
  'reading.inference',
  'reading.vocabulary',
  'reading.paraphrase',
  'listening.gist',
  'listening.detail',
  'listening.speaker_view',
  'listening.number',
  'listening.distractor',
] as const;

export const MOCK_CAUSE_TAXONOMY = [
  'misread_instruction',
  'word_limit',
  'spelling',
  'grammar',
  'vocabulary',
  'paraphrase',
  'inference',
  'distractor',
  'not_given_confusion',
  'number_format',
  'concentration',
  'time_management',
] as const;
