'use client';

import Link from 'next/link';
import RequireRole from '@/components/lms/RequireRole';
import { useSession } from '@/lib/lms/hooks';
import { roleAllowed } from '@/lib/lms/permissions';
import { draftBatches } from '@/lib/trainers/draft-review';
import { findBankSource } from '@/lib/trainers/bank-sources';
import SpeakingSecondTake from './SpeakingSecondTake';
import ui from '@/components/ui/CleanUi.module.css';

export default function SpeakingDraftEntry({ batchId, version, unitId, contentHash }: { batchId: string; version:string; unitId: string; contentHash: string }) {
  const { session, ready } = useSession();
  if (!ready) return <main className="container"><p role="status">Проверяем вход рецензента…</p></main>;
  if (!session) {
    const next = `/trainers/speaking-second-take?${new URLSearchParams({ reviewBatch: batchId, reviewVersion:version, reviewUnit: unitId, reviewHash: contentHash })}`;
    return <main className="container"><h1>Нужно войти для Speaking-черновика</h1><p>Проба предназначена для учителя или автора. После входа откроется эта же версия материала.</p><Link href={`/login?next=${encodeURIComponent(next)}`} className={ui.buttonBlack}>Войти в учебный кабинет</Link></main>;
  }
  if (!roleAllowed(session.user.role, ['teacher','author'])) return <main><RequireRole roles={['teacher','author']}>{() => null}</RequireRole></main>;
  const batch = draftBatches.find(value => value.batch === batchId);
  const unit = batch?.units.find(value => value.id === unitId);
  const source=findBankSource({batchId,version,contentHash,unitId});
  const pair=source?.exercise.type==='speaking'?source.exercise.value:null;
  if (!batch || batch.content_sha256 !== contentHash || !unit || !pair || !source || String(batch.version)!==version) return <main className="container"><h1>Версия Speaking-черновика недоступна</h1><p>Ссылка устарела или материал не прошёл проверку. Другая тема не подставлена; открой свежую ссылку из библиотеки проверки.</p><Link href="/trainers/material-review">К проверке материалов</Link></main>;
  return <SpeakingSecondTake key={`${batch.content_sha256}:${unit.id}`} draft={{ pair, unitId: unit.id, title: unit.title, source }}/>;
}
