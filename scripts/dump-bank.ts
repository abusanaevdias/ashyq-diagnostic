import { QUESTION_BANK } from '../src/data/questions';
import { EXAMS } from '../src/lib/config';
import { MATERIALS } from '../src/data/materials';
import { validateBank } from '../src/lib/validate-bank';
import { writeFileSync } from 'node:fs';

/**
 * Генерирует docs/QUESTION_BANK.md — инвентарь всех вопросов с ответами
 * и результат валидации. Запуск: npm run docs:bank
 */

const lines: string[] = [];
lines.push('# ASHYQ Quick Diagnostic — инвентарь банка вопросов');
lines.push('');
lines.push(`Сгенерировано: ${new Date().toISOString()}`);
lines.push('');
lines.push(`Всего вопросов: **${QUESTION_BANK.length}** · материалов: **${MATERIALS.length}**`);
lines.push('');

(Object.keys(EXAMS) as Array<keyof typeof EXAMS>).forEach((examId) => {
  const exam = EXAMS[examId];
  const qs = QUESTION_BANK.filter((q) => q.exam === examId);
  lines.push(`## ${exam.fullName} (${qs.length} вопросов)`);
  lines.push('');
  exam.sections.forEach((section) => {
    const list = qs.filter((q) => q.section === section);
    if (list.length === 0) return;
    lines.push(`### ${exam.sectionLabels[section]}`);
    lines.push('');
    lines.push('| id | domain | skill | сложность | ответ | материал |');
    lines.push('|---|---|---|---|---|---|');
    list.forEach((q) => {
      lines.push(
        `| \`${q.id}\` | ${q.domain} | ${q.skill} | ${q.difficulty} | **${q.correctAnswer}** | ${q.materialId ?? '—'} |`,
      );
    });
    lines.push('');
    const easy = list.filter((q) => q.difficulty === 'easy').length;
    const medium = list.filter((q) => q.difficulty === 'medium').length;
    const hard = list.filter((q) => q.difficulty === 'hard').length;
    lines.push(`Сложность: ${easy} easy / ${medium} medium / ${hard} hard.`);
    lines.push('');
  });
});

/* ---------- валидация ---------- */
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

lines.push('## Результат валидации');
lines.push('');
lines.push(`Статус: **${report.ok ? 'OK — ошибок нет' : 'ЕСТЬ ОШИБКИ'}**`);
lines.push('');
lines.push('| проверка | результат |');
lines.push('|---|---|');
report.buildChecks.forEach((c) => {
  lines.push(`| ${c.name} | ${c.ok ? '✅' : '❌'} ${c.detail ?? ''} |`);
});
const warnings = report.issues.filter((i) => i.level === 'warning');
if (warnings.length > 0) {
  lines.push('');
  lines.push('Предупреждения:');
  warnings.forEach((w) => lines.push(`- ${w.questionId ? `[${w.questionId}] ` : ''}${w.message}`));
}

writeFileSync('docs/QUESTION_BANK.md', `${lines.join('\n')}\n`, 'utf-8');
console.log('docs/QUESTION_BANK.md обновлён');
console.log(report.ok ? 'валидация: OK' : 'валидация: ОШИБКИ');
