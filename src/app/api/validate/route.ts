import { NextResponse } from 'next/server';
import { QUESTION_BANK } from '@/data/questions';
import { MATERIALS } from '@/data/materials';
import { validateBank } from '@/lib/validate-bank';

/**
 * GET /api/validate
 *
 * Быстрая проверка банка вопросов без запуска CLI.
 * Удобно дёргать после правки контента (и можно повесить на CI).
 */
export const dynamic = 'force-static';

export function GET() {
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

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    bankSize: QUESTION_BANK.length,
    ...report,
  });
}
