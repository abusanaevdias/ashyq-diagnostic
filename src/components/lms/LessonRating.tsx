'use client';

import { useState } from 'react';
import { getRepos } from '@/lib/lms/repos';
import type { LessonRating, LessonRatingLevel } from '@/lib/lms/types';
import styles from './Lms.module.css';

const LEVELS = [1, 2, 3, 4] as const;

export const RATING_LABELS: Record<LessonRatingLevel, string> = {
  1: 'Решу 100/100',
  2: 'Скорее всего не ошибусь',
  3: 'Скорее всего ошибусь',
  4: 'Не смогу решить',
};

/** Ученик: насколько понятна тема урока. Выбор сохраняется сразу, его можно поменять. */
export function LessonRatingPicker({ lessonId, studentId, rating }: { lessonId: string; studentId: string; rating?: LessonRating }) {
  const [level, setLevel] = useState(rating?.level);
  const [error, setError] = useState('');

  const rate = async (next: LessonRatingLevel) => {
    const previous = level;
    setLevel(next);
    setError('');
    try {
      await getRepos().lessonRatings.rate({ lessonId, studentId, level: next });
    } catch (err) {
      setLevel(previous);
      setError(err instanceof Error ? err.message : 'Оценка не сохранилась');
    }
  };

  return (
    <fieldset className={`${styles.fieldset} ${styles.rating}`}>
      <legend className={styles.legend}>Если эта тема попадётся в тесте:</legend>
      {LEVELS.map((value) => (
        <label key={value} className={styles.ratingOption}>
          <input type="radio" name={`rating-${lessonId}`} checked={level === value} onChange={() => rate(value)} />
          {RATING_LABELS[value]}
        </label>
      ))}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </fieldset>
  );
}

/** Учитель: сколько учеников выбрали каждый уровень. */
export function LessonRatingSummary({ ratings, students }: { ratings: LessonRating[]; students: number }) {
  return (
    <div className={styles.chipsRow} role="group" aria-label="Понятность урока">
      {LEVELS.map((value) => (
        <span key={value} className={styles.chip}>
          {RATING_LABELS[value]}: {ratings.filter((r) => r.level === value).length}
        </span>
      ))}
      <span className={styles.chip}>не оценили: {students - ratings.length}</span>
    </div>
  );
}
