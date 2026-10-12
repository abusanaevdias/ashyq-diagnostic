import { parseDraftSpeaking } from '@/lib/trainers/draft-speaking';
import styles from './TrainerCheckpoint.module.css';

export default function DraftSpeakingLaunch({ value, batchId, unitId, contentHash }: { value: unknown; batchId: string; unitId: string; contentHash: string }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'speaking-pair-v1') return null;
  if (!parseDraftSpeaking(value)) return <p role="alert">Структура Speaking-черновика не прошла проверку. Другая тема не подставлена.</p>;
  const href = `/trainers/speaking-second-take?${new URLSearchParams({ reviewBatch: batchId, reviewUnit: unitId, reviewHash: contentHash })}`;
  return <section className={styles.preview} aria-labelledby="speaking-draft-launch-title"><h3 id="speaking-draft-launch-title">Пробное Speaking · DRAFT</h3><p>Открой отдельную пробу: первый ответ, повтор той же темы и новая тема. Микрофон включится только по отдельной кнопке. Можно ответить самостоятельно без записи. Аудио и заметки пробы остаются временными; сохранение и история публичного тренажёра не заменяются. Это проверка черновой темы, без публикации, AI-оценки или band.</p><a href={href} target="_blank" rel="noopener noreferrer nofollow">Открыть Speaking-пробу в новой вкладке ↗</a></section>;
}
