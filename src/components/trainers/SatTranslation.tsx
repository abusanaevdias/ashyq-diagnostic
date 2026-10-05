'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { equation, forms, modelMatches, modelSolution, near, parseAmount, translationCases, type Model, type TranslationItem } from '@/lib/sat-translation/cases';
import styles from './SatTranslation.module.css';

type Phase = 'choose' | 'model' | 'calculate' | 'review' | 'result';
type Attempt = { model: Model; answer: number; working: string; repair: string };

function Feedback({ attempt, item }: { attempt: Attempt; item: TranslationItem }) {
  const correctModel = modelMatches(attempt.model, item);
  const correctAnswer = attempt.answer === item.answer;
  const definedVariable = attempt.model.variable === item.variable;
  const ownArithmetic = definedVariable && near(attempt.answer, modelSolution(attempt.model));
  return <div className={styles.feedback}>
    <h3>{correctModel ? correctAnswer ? 'Модель и итоговое число совпали' : 'Модель совпала. Проверь расчёт' : 'Сначала пересмотри модель'}</h3>
    <p>{correctModel ? 'Величины, смысл x и структура уравнения совпали с условием.' : 'Один или несколько элементов модели не совпали с условием. Правильное итоговое число само по себе это не исправляет.'}</p>
    <dl><div><dt>Смысл x</dt><dd>{definedVariable ? 'Совпал с вопросом' : 'Не совпал с вопросом'}</dd></div><div><dt>Разовый платёж</dt><dd>{attempt.model.setup} → {item.setup}</dd></div><div><dt>Ставка за единицу</dt><dd>{attempt.model.rate} → {item.rate}</dd></div><div><dt>Общая сумма</dt><dd>{attempt.model.total} → {item.total}</dd></div><div><dt>Структура</dt><dd>{attempt.model.form === 'once' ? 'Разовый платёж прибавлен один раз' : attempt.model.form === 'repeated' ? 'Разовый платёж ошибочно повторяется' : 'Разовый платёж пропущен'}</dd></div></dl>
    <p className={styles.saved}>Твоя модель: {equation(attempt.model)}<br/>Твоё число: {attempt.answer}</p>
    <p>{definedVariable ? ownArithmetic ? 'Число соответствует расчёту по выбранной тобой модели (с точностью 0,01). Если модель неверна, задача всё ещё не решена по условию.' : 'Число не соответствует расчёту по выбранной модели (с точностью 0,01). Проверь действия или объясни свой другой способ.' : 'При другом смысле x этот расчёт нельзя надёжно сопоставить с количеством из вопроса. Сначала уточни переменную.'}</p>
    <p>Ответ по условию: <strong>{item.answer} {item.unit}</strong>. {correctAnswer ? 'Твоё итоговое число совпало.' : 'Твоё итоговое число отличается.'}</p>
    <p lang="en">{item.explanation}</p>
    <p className={styles.note}>Проверяются поля модели и итоговое число. Твои записи действий не оценивались автоматически; совпадение числа не доказывает правильность всех промежуточных действий.</p>
  </div>;
}

export default function SatTranslation() {
  const [phase, setPhase] = useState<Phase>('choose');
  const [caseIndex, setCaseIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [variable, setVariable] = useState('');
  const [setup, setSetup] = useState('');
  const [rate, setRate] = useState('');
  const [total, setTotal] = useState('');
  const [form, setForm] = useState('');
  const [model, setModel] = useState<Model | null>(null);
  const [answer, setAnswer] = useState('');
  const [working, setWorking] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [repair, setRepair] = useState('');
  const [error, setError] = useState('');
  const item = translationCases[caseIndex].items[round];
  useEffect(() => { if (phase !== 'choose') { const heading = document.getElementById('translation-stage-title'); heading?.scrollIntoView({ block: 'start' }); heading?.focus({ preventScroll: true }); } }, [phase, round]);
  function advance(next: Phase) { setError(''); setPhase(next); }
  function clearItem() { setVariable(''); setSetup(''); setRate(''); setTotal(''); setForm(''); setModel(null); setAnswer(''); setWorking(''); setRepair(''); }
  function begin(index: number) { setCaseIndex(index); setRound(0); setAttempts([]); clearItem(); advance('model'); }
  function commitModel() {
    const amounts = [setup, rate, total].map(parseAmount);
    if (!variable || !form || amounts.some(value => value === null)) { setError('Выбери смысл x и структуру, заполни все три суммы числами.'); return; }
    const [a, b, c] = amounts as number[];
    if (a < 0 || b <= 0 || c < 0) { setError('Для этих задач разовый платёж и общая сумма неотрицательны, ставка больше нуля.'); return; }
    setModel({ variable, setup: a, rate: b, total: c, form }); advance('calculate');
  }
  function commitAnswer() {
    const parsed = parseAmount(answer);
    if (parsed === null || !working.trim()) { setError('Введи итоговое число и запиши хотя бы один шаг расчёта. Можно использовать десятичную дробь.'); return; }
    if (!model) return;
    setAttempts(previous => [...previous, { model: { ...model }, answer: parsed, working, repair: '' }]); advance('review');
  }
  return <main className={styles.page}>
    <div className={styles.topline}><Link href="/trainers">← Все тренажёры</Link><span>ASHYQ · TRANSLATION LAB</span></div>
    <header className={styles.hero}><p className={styles.eyebrow}>SAT MATH · ОТ ТЕКСТА К УРАВНЕНИЮ</p><h1>Сначала модель. Потом расчёт.</h1><p>Найди, за что платят один раз, а за что — каждый месяц или за каждую единицу. Зафиксируй уравнение до вычисления ответа.</p><p className={styles.note}>Четыре авторские задачи в двух парах. Нет официального SAT score, AI или сохранения работы после обновления страницы.</p></header>
    {phase === 'choose' ? <section><h2>Выбери задачу</h2><div className={styles.caseGrid}>{translationCases.map((entry, index) => <article key={entry.title} className={styles.card}><span>CONTEXTUAL MATH</span><h3>{entry.title}</h3><p>Собери модель, сравни разбор и попробуй новую задачу.</p><button className={styles.primary} type="button" onClick={() => begin(index)}>Начать →</button></article>)}</div></section> : <section className={styles.lesson} aria-labelledby="translation-stage-title">
      <div className={styles.lessonTop}><button type="button" onClick={() => { setPhase('choose'); window.scrollTo({ top: 0 }); }}>← К выбору задачи</button><span>{round === 0 ? 'Первая попытка' : 'Новая задача'}</span></div>
      <h2 id="translation-stage-title" tabIndex={-1}>{phase === 'model' ? '1. Собери математическую модель' : phase === 'calculate' ? '2. Посчитай по своей модели' : phase === 'review' ? '3. Сравни модель и расчёт' : 'Что получилось на двух задачах'}</h2>
      {phase !== 'result' && <p className={styles.problem} lang="en">{item.prompt}</p>}
      {phase === 'model' && <div className={styles.panel}>
        <label htmlFor="model-variable">Что обозначает x?</label><select id="model-variable" value={variable} onChange={event => setVariable(event.target.value)}><option value="">Выбери смысл переменной</option><option value="total">Общая сумма в долларах</option><option value={item.variable}>Количество {item.variable === 'months' ? 'месяцев' : 'постеров'}</option><option value="rate">Ставка в долларах за единицу</option></select>
        <div className={styles.amounts}><div><label htmlFor="model-setup">Разовый платёж, $</label><input id="model-setup" inputMode="decimal" value={setup} maxLength={15} onChange={event => setSetup(event.target.value)}/></div><div><label htmlFor="model-rate">Ставка за {item.variable === 'months' ? 'месяц' : 'постер'}, $</label><input id="model-rate" inputMode="decimal" value={rate} maxLength={15} onChange={event => setRate(event.target.value)}/></div><div><label htmlFor="model-total">Общая сумма, $</label><input id="model-total" inputMode="decimal" value={total} maxLength={15} onChange={event => setTotal(event.target.value)}/></div></div>
        <fieldset><legend>Как связаны суммы?</legend>{(round === 0 ? [forms[1], forms[2], forms[0]] : [forms[0], forms[2], forms[1]]).map(entry => <label className={styles.choice} key={entry.id}><input type="radio" name="equation-form" value={entry.id} checked={form === entry.id} onChange={() => setForm(entry.id)}/><span>{entry.label}</span></label>)}</fieldset>
        <p className={styles.note}>Пока не считай. Сначала реши, какая сумма повторяется, и проверь единицы: доллары за единицу × число единиц = доллары.</p>
        <button type="button" className={styles.primary} onClick={commitModel}>Зафиксировать модель →</button>
      </div>}
      {phase === 'calculate' && model && <div className={styles.panel}>
        <p className={styles.saved}>Твоя модель: <strong>{equation(model)}</strong><br/>x: {model.variable === item.variable ? item.variable === 'months' ? 'количество месяцев' : 'количество постеров' : model.variable === 'total' ? 'общая сумма в долларах' : 'ставка в долларах за единицу'}</p>
        <p>Посчитай по зафиксированной модели. Разбор откроется после ответа.</p><label htmlFor="calculation-working">Твои действия</label><textarea id="calculation-working" value={working} maxLength={2000} onChange={event => setWorking(event.target.value)}/><label htmlFor="calculation-answer">Полученное значение x</label><input id="calculation-answer" inputMode="decimal" value={answer} maxLength={15} onChange={event => setAnswer(event.target.value)}/><p className={styles.note}>Если получилось нецелое число, округли до двух знаков. Можно вводить точку или запятую.</p><button type="button" className={styles.primary} onClick={commitAnswer}>Открыть разбор →</button>
      </div>}
      {phase === 'review' && attempts[round] && <div className={styles.panel}><Feedback attempt={attempts[round]} item={item}/><details><summary>Мои записанные действия</summary><p className={styles.saved}>{attempts[round].working}</p></details><label htmlFor="model-repair">Что исправишь в модели или расчёте? Если всё совпало — объясни, почему разовый платёж не повторяется.</label><textarea id="model-repair" value={repair} maxLength={2000} onChange={event => setRepair(event.target.value)}/><p className={styles.note}>Это твой план проверки. Его формулировка не оценивается автоматически.</p><button type="button" className={styles.primary} onClick={() => { if (!repair.trim()) { setError('Запиши, что проверишь, перед следующей задачей.'); return; } setAttempts(previous => previous.map((attempt, index) => index === round ? { ...attempt, repair } : attempt)); if (round === 0) { setRound(1); clearItem(); advance('model'); } else advance('result'); }}>{round === 0 ? 'Проверить на новой задаче →' : 'Сравнить две попытки →'}</button></div>}
      {phase === 'result' && <><div className={styles.caseGrid}>{attempts.map((attempt, index) => <section key={index} className={styles.panel}><h3>{index === 0 ? 'Первая задача' : 'Новая задача'}</h3><Feedback attempt={attempt} item={translationCases[caseIndex].items[index]}/><details><summary>Мои действия и план проверки</summary><p className={styles.saved}>{attempt.working}</p><p className={styles.saved}>{attempt.repair}</p></details></section>)}</div><p className={styles.note}>Две попытки показывают работу с этими условиями, а не устойчивый навык или рост SAT score. Модели ограничены разовым платежом и линейной ставкой.</p><button type="button" className={styles.primary} onClick={() => begin(caseIndex)}>Начать пару заново →</button></>}
      {error && <p className={styles.warning} role="alert">{error}</p>}
    </section>}
  </main>;
}
