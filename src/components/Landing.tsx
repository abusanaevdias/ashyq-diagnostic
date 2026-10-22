'use client';

import type { ExamId, RunState } from '@/lib/types';
import ApprovedHome from './public-design/ApprovedHome';
export { continueLabel } from '@/lib/landing-continuation';

/** Native public presentation. The diagnostic controller remains the source of state/actions. */
export default function Landing({ runs, onSelect }: { runs: Record<ExamId, RunState | null>; onSelect: (exam: ExamId) => void }) {
  return <ApprovedHome runs={runs} onSelect={onSelect} />;
}