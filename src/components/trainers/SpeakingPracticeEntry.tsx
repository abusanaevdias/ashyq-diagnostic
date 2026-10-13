'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SpeakingSecondTake from './SpeakingSecondTake';

const SpeakingDraftEntry = dynamic(() => import('./SpeakingDraftEntry'), { loading: () => <main className="container"><p role="status">Открываем черновую Speaking-пробу…</p></main> });
export default function SpeakingPracticeEntry() {
  const params = useSearchParams();
  const names = ['reviewBatch','reviewVersion','reviewUnit','reviewHash'];
  if (!names.some(name => params.has(name))) return <SpeakingSecondTake/>;
  if (names.some(name => params.getAll(name).length !== 1)) return <main className="container"><h1>Не удалось открыть черновик</h1><p>Нужна полная ссылка на одну версию материала. Публичная тема не подставлена.</p><Link href="/trainers/material-review">К проверке материалов</Link></main>;
  return <SpeakingDraftEntry key={names.map(name => params.get(name)).join(':')} batchId={params.get('reviewBatch')!} version={params.get('reviewVersion')!} unitId={params.get('reviewUnit')!} contentHash={params.get('reviewHash')!}/>;
}
