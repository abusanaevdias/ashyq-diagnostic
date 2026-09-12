import { QUESTION_BANK } from '../src/data/questions';
import { MATERIALS } from '../src/data/materials';
import { validateBank } from '../src/lib/validate-bank';

/**
 * CLI-валидация банка вопросов:
 *   npm run validate:bank
 *
 * Перед добавлением новых вопросов прогони скрипт — он ловит
 * отсутствующие ответы, дубликаты, битые ссылки на материалы,
 * несбалансированную сборку теста и «угадываемый» скоринг.
 */

const materialMap = new Map(
  MATERIALS.map((m) => [
    m.id,
    {
      exam: m.exam,
      section: m.section,
      kind: m.kind,
      text: m.text,
      transcript: m.audio?.transcript,
    },
  ]),
);

const report = validateBank(QUESTION_BANK, materialMap);

console.log('\n=== ASHYQ QUESTION BANK VALIDATION ===\n');
console.log('Вопросов в банке:', report.counts.total);
Object.entries(report.counts)
  .filter(([key]) => key !== 'total')
  .forEach(([key, value]) => console.log(`  ${key}: ${value}`));

console.log('\n--- Проверки сборки и скоринга ---');
report.buildChecks.forEach((check) => {
  console.log(`${check.ok ? 'OK  ' : 'FAIL'}  ${check.name}${check.detail ? ` — ${check.detail}` : ''}`);
});

const errors = report.issues.filter((i) => i.level === 'error');
const warnings = report.issues.filter((i) => i.level === 'warning');

if (warnings.length > 0) {
  console.log('\n--- Предупреждения ---');
  warnings.forEach((w) => console.log(`WARN  ${w.questionId ? `[${w.questionId}] ` : ''}${w.message}`));
}

if (errors.length > 0) {
  console.log('\n--- Ошибки ---');
  errors.forEach((e) => console.log(`ERROR ${e.questionId ? `[${e.questionId}] ` : ''}${e.message}`));
  console.log(`\nИТОГ: ${errors.length} ошибок, ${warnings.length} предупреждений\n`);
  process.exit(1);
}

console.log(`\nИТОГ: ошибок нет, предупреждений ${warnings.length}. Банк валиден.\n`);
