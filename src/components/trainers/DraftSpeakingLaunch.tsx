import {trainerBank} from '@/lib/trainers/bank-sources';
import { parseDraftSpeaking } from '@/lib/trainers/draft-speaking';
import styles from './TrainerCheckpoint.module.css';

export default function DraftSpeakingLaunch({ value, batchId, unitId, contentHash }: { value: unknown; batchId: string; unitId: string; contentHash: string }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'speaking-pair-v1') return null;
  if (!parseDraftSpeaking(value)) return <p role="alert">Структура Speaking-черновика не прошла проверку. Другая тема не подставлена.</p>;
  const source=trainerBank.sources.find(s=>s.ref.batchId===batchId&&s.ref.unitId===unitId&&s.ref.contentHash===contentHash&&s.exercise.type==='speaking');
  if(!source)return <p role="alert">Версия темы недоступна. Открой актуальную библиотеку.</p>;
  const href = `/trainers/speaking-second-take?${new URLSearchParams({ reviewBatch: batchId, reviewVersion:source.ref.version, reviewUnit: unitId, reviewHash: contentHash })}`;
  return <section className={styles.preview} aria-labelledby="speaking-draft-launch-title"><h3 id="speaking-draft-launch-title">Пробное Speaking · DRAFT</h3><p>Открой отдельную пробу: первый ответ, повтор той же темы и новая тема. Микрофон включится только по отдельной кнопке. Можно ответить самостоятельно без записи. Заметки и самопроверку можно сохранить в этом браузере или скачать файлом для этой версии темы. Аудио скачивается отдельно и исчезнет после закрытия вкладки; в файл заметок оно не входит. Это проверка черновой темы, без публикации, AI-оценки или band.</p><a href={href} target="_blank" rel="noopener noreferrer nofollow">Открыть Speaking-пробу в новой вкладке ↗</a></section>;
}
