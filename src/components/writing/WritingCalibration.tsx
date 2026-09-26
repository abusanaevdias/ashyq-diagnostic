'use client';

import { useState } from 'react';
import { writingCases, type Criterion } from '@/lib/writing-trainer/cases';
import {
  calibrationCriteria,
  createWorksheet,
  direction,
  essayParagraphs,
  excerptMatches,
  judgmentComplete,
  wordCount,
  worksheetHasWork,
  type CalibrationBand,
  type CalibrationVersion,
  type TeacherJudgment,
} from '@/lib/writing-trainer/calibration';
import styles from './WritingCalibration.module.css';

const versions: CalibrationVersion[] = ['A', 'B'];
const bandOptions = Array.from({ length: 19 }, (_, index) => (index / 2).toFixed(1));

function directionLabel(value: ReturnType<typeof direction>): string {
  return { up: 'выше', same: 'без изменения', down: 'ниже', unknown: 'недостаточно данных' }[value];
}

export default function WritingCalibration() {
  const [caseId, setCaseId] = useState(writingCases[0].id);
  const [version, setVersion] = useState<CalibrationVersion>('A');
  const [worksheet, setWorksheet] = useState(createWorksheet);
  const [revealed, setRevealed] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const essay = writingCases.find((item) => item.id === caseId) ?? writingCases[0];
  const paragraphs = { A: essayParagraphs(essay, 'A'), B: essayParagraphs(essay, 'B') };
  const completeCount = versions.reduce((total, item) => total + calibrationCriteria.filter(({ id }) => judgmentComplete(paragraphs[item], worksheet[item][id])).length, 0);
  const exportJson = JSON.stringify({
    format: 'ashyq-writing-calibration-v1',
    caseId: essay.id,
    versionKey: { A: 'original', B: 'fully-authored-revision' },
    teacher: worksheet,
    authoredPracticeEstimates: { original: essay.baseline, revised: essay.ceiling },
    limitation: 'Synthetic case review only; not an official IELTS score or calibrated assessment.',
  }, null, 2);

  function updateJudgment<K extends keyof TeacherJudgment>(criterion: Criterion, field: K, value: TeacherJudgment[K]) {
    setWorksheet((current) => ({
      ...current,
      [version]: {
        ...current[version],
        [criterion]: { ...current[version][criterion], [field]: value },
      },
    }));
    setRevealed(false);
    setCopyStatus('');
  }

  function selectCase(nextId: string) {
    if (nextId === caseId) return;
    if (worksheetHasWork(worksheet) && !window.confirm('Черновик разметки хранится только на этой странице. Перейти к другому кейсу и удалить его?')) return;
    setCaseId(nextId);
    setVersion('A');
    setWorksheet(createWorksheet());
    setRevealed(false);
    setCopyStatus('');
  }

  function clearWorksheet() {
    if (worksheetHasWork(worksheet) && !window.confirm('Удалить текущую разметку этого кейса?')) return;
    setWorksheet(createWorksheet());
    setRevealed(false);
    setCopyStatus('');
    setVersion('A');
  }

  function downloadWorksheet() {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ashyq-writing-calibration-${essay.id}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyWorksheet() {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopyStatus('JSON скопирован. Сохрани его в файл на своём устройстве.');
    } catch {
      setCopyStatus('Браузер не разрешил копирование. Открой JSON ниже и скопируй его вручную.');
    }
  }

  return <main className={styles.page}>
    <div className={styles.topline}><span>ASHYQ / WRITING LAB</span><span>ЛИСТ ДЛЯ ПРЕПОДАВАТЕЛЯ</span></div>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>СИНТЕТИЧЕСКИЙ ПИЛОТ · IELTS ACADEMIC TASK 2</p>
      <h1>Проверь учебные ориентиры.</h1>
      <p>Оцени два полных варианта вымышленного эссе по четырём критериям. Сначала запиши собственное суждение и фрагменты текста; ориентиры тренажёра откроются после разметки.</p>
      <a href="/writing/trainer" className={styles.backLink}>← К тренажёру ученика</a>
    </header>

    <div className={styles.notice}>
      <strong>Граница пилота</strong>
      <p>Здесь нет ответов учеников, AI, отправки текста или сохранения на сервере. Не вставляй реальные работы. Разметка исчезнет после закрытия страницы; готовый лист можно скачать. Один отзыв учителя помогает найти спорные примеры, но не подтверждает точность IELTS band.</p>
    </div>

    <section className={styles.protocol} aria-label="Порядок проверки">
      <div><b>01</b><span>Прочитай полное эссе A и B.</span></div>
      <div><b>02</b><span>Для каждого критерия запиши суждение, цитату и обоснование.</span></div>
      <div><b>03</b><span>Сравни направление изменений с учебным ориентиром кейса.</span></div>
    </section>

    <section className={styles.setup} aria-label="Выбор кейса">
      <div><span className={styles.overline}>КЕЙС ДЛЯ РАЗМЕТКИ</span><p>Оба текста написаны специально для пилота.</p></div>
      <div className={styles.caseChoices}>{writingCases.map((item) => <button key={item.id} type="button" className={`${styles.caseButton} ${essay.id === item.id ? styles.caseActive : ''}`} aria-pressed={essay.id === item.id} onClick={() => selectCase(item.id)}><small>{item.label}</small><strong>{item.topic}</strong></button>)}</div>
    </section>

    <section className={styles.questionCard} aria-labelledby="question-title">
      <span className={styles.overline}>ЗАДАНИЕ</span>
      <h2 id="question-title">IELTS Writing Task 2</h2>
      <p lang="en">{essay.question}</p>
    </section>

    <div className={styles.versionBar}>
      <div><span className={styles.overline}>ВЕРСИЯ ЭССЕ</span><p>Ориентиры скрыты до завершения восьми суждений.</p></div>
      <div className={styles.versionChoices} role="group" aria-label="Версия эссе">{versions.map((item) => <button key={item} type="button" className={`${styles.versionButton} ${version === item ? styles.versionActive : ''}`} aria-pressed={version === item} onClick={() => setVersion(item)}>Версия {item}{revealed ? <small>{item === 'A' ? 'исходная' : 'редакция'}</small> : null}</button>)}</div>
    </div>

    <div className={styles.layout}>
      <section className={styles.essayCard} aria-labelledby="essay-title">
        <div className={styles.cardTop}><span className={styles.overline}>ПОЛНЫЙ ТЕКСТ · ВЕРСИЯ {version}</span><span>{wordCount(paragraphs[version])} слов</span></div>
        <h2 id="essay-title">Прочитай всё эссе</h2>
        <p className={styles.hint}>Выдели и скопируй точный фрагмент для поля «Цитата». Он подтверждает наблюдение, но решение должно учитывать весь ответ.</p>
        <div className={styles.essayText} lang="en">{paragraphs[version].map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </section>

      <section className={styles.judgments} aria-labelledby="judgments-title">
        <div className={styles.judgmentHeader}><div><span className={styles.overline}>РАЗМЕТКА ВЕРСИИ {version}</span><h2 id="judgments-title">Четыре критерия</h2></div><span className={styles.progress} role="status">{completeCount} / 8 готово</span></div>
        <p className={styles.hint}>Ориентируйся на <a href="https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf" target="_blank" rel="noopener noreferrer">официальные дескрипторы Task 2</a>. Число ниже — предварительная рабочая пометка учителя, не результат экзамена.</p>
        {calibrationCriteria.map(({ id, label, cue }) => {
          const judgment = worksheet[version][id];
          const excerptInvalid = Boolean(judgment.excerpt.trim()) && !excerptMatches(paragraphs[version], judgment.excerpt);
          const complete = judgmentComplete(paragraphs[version], judgment);
          const prefix = `${version}-${id}`;
          return <article key={id} className={styles.criterionCard}>
            <div className={styles.criterionTitle}><div><span className={styles.overline}>КРИТЕРИЙ</span><h3>{label}</h3></div><span className={complete ? styles.completeTag : styles.pendingTag}>{complete ? 'Заполнено' : 'Нужна разметка'}</span></div>
            <p className={styles.cue}>{cue}</p>
            <label htmlFor={`${prefix}-band`}>Предварительная оценка полного ответа</label>
            <select id={`${prefix}-band`} value={judgment.band} onChange={(event) => updateJudgment(id, 'band', event.target.value as CalibrationBand)}>
              <option value="">Выбери оценку</option>
              {bandOptions.map((band) => <option key={band} value={band}>{band}</option>)}
              <option value="insufficient">Недостаточно данных</option>
            </select>
            <label htmlFor={`${prefix}-excerpt`}>Цитата из версии {version}{judgment.band === 'insufficient' ? ' (необязательно)' : ''}</label>
            <textarea id={`${prefix}-excerpt`} lang="en" rows={3} value={judgment.excerpt} aria-describedby={`${prefix}-excerpt-note`} onChange={(event) => updateJudgment(id, 'excerpt', event.target.value)} placeholder="Скопируй точный фрагмент из эссе" />
            <p id={`${prefix}-excerpt-note`} className={excerptInvalid ? styles.fieldError : styles.fieldHint}>{excerptInvalid ? 'Этот фрагмент не найден в выбранной версии. Проверь цитату и пробелы.' : 'Цитата служит опорой для суждения о полном тексте.'}</p>
            <label htmlFor={`${prefix}-rationale`}>Почему ты так оценил всё эссе?</label>
            <textarea id={`${prefix}-rationale`} rows={3} value={judgment.rationale} onChange={(event) => updateJudgment(id, 'rationale', event.target.value)} placeholder="Отметь сильные и слабые стороны по всему ответу" />
          </article>;
        })}
      </section>
    </div>

    <section className={styles.finish} aria-labelledby="finish-title">
      <span className={styles.overline}>ПОСЛЕ РАЗМЕТКИ</span>
      <h2 id="finish-title">Сравни с ориентиром кейса</h2>
      <p>Сначала закончи все четыре критерия для обеих версий. Оценка «Недостаточно данных» допустима, если ты объяснил причину.</p>
      {!revealed ? <button type="button" className={styles.primaryButton} disabled={completeCount !== 8} onClick={() => setRevealed(true)}>Показать сравнение {completeCount} / 8</button> : <>
        <p className={styles.revealNote}>Версия A — исходное вымышленное эссе; версия B — полностью подготовленная редакция. Сравнение показывает только направление, не устанавливает правильный IELTS band.</p>
        <div className={styles.comparisonGrid}>{calibrationCriteria.map(({ id, label }) => {
          const teacherDirection = direction(worksheet.A[id].band, worksheet.B[id].band);
          const authoredDirection = direction(String(essay.baseline[id]) as CalibrationBand, String(essay.ceiling[id]) as CalibrationBand);
          const signal = teacherDirection === 'unknown' ? 'Нет вывода' : teacherDirection === authoredDirection ? 'Направление совпало' : 'Пересмотреть кейс';
          return <div key={id} className={styles.comparisonCard}><h3>{label}</h3><p><span>Учитель</span><strong>{worksheet.A[id].band === 'insufficient' ? '—' : worksheet.A[id].band} → {worksheet.B[id].band === 'insufficient' ? '—' : worksheet.B[id].band}</strong><small>{directionLabel(teacherDirection)}</small></p><p><span>Ориентир кейса</span><strong>{essay.baseline[id].toFixed(1)} → {essay.ceiling[id].toFixed(1)}</strong><small>{directionLabel(authoredDirection)}</small></p><div className={teacherDirection === 'unknown' ? styles.neutralSignal : teacherDirection === authoredDirection ? styles.matchSignal : styles.reviewSignal}>{signal}</div></div>;
        })}</div>
        <div className={styles.actionRow}><button type="button" className={styles.primaryButton} onClick={downloadWorksheet}>Скачать разметку JSON</button><button type="button" className={styles.secondaryButton} onClick={copyWorksheet}>Скопировать JSON</button><span>Файл и копия создаются на твоём устройстве без отправки.</span></div>
        {copyStatus && <p className={styles.copyStatus} role="status">{copyStatus}</p>}
        <details className={styles.jsonDetails}><summary>Показать JSON для ручного сохранения</summary><label htmlFor="calibration-json">Разметка этого вымышленного кейса</label><textarea id="calibration-json" readOnly rows={10} value={exportJson} onFocus={(event) => event.currentTarget.select()} /></details>
      </>}
      <button type="button" className={styles.clearButton} onClick={clearWorksheet}>Очистить разметку кейса</button>
    </section>
  </main>;
}
