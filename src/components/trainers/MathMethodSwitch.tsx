"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cases,
  coordinate,
  firstValue,
  secondValue,
  methods,
  type Item,
  type Method,
} from "@/lib/math-method-switch/cases";
import styles from "./MathMethodSwitch.module.css";
type Attempt = {
  x: number;
  y: number;
  working: string;
  method: Method;
  seconds: number;
  plan: string;
};
function Representation({ item, method }: { item: Item; method: Method }) {
  const xs = Array.from({ length: 9 }, (_, i) => i - 2);
  if (method === "algebra")
    return (
      <p>
        Приравняй правые части двух уравнений. Реши полученное уравнение для x,
        затем подставь найденное значение и проверь условие вопроса.
      </p>
    );
  if (method === "table")
    return (
      <>
        <p>
          Сравни значения при одинаковом x. Совпадение даёт кандидата; таблица с
          отдельными значениями не доказывает отсутствие других пересечений.
        </p>
        <table>
          <caption>Значения двух функций</caption>
          <thead>
            <tr>
              <th>x</th>
              <th>{item.first}</th>
              <th>{item.second}</th>
            </tr>
          </thead>
          <tbody>
            {xs.map((x) => (
              <tr key={x}>
                <th scope="row">{x}</th>
                <td>{firstValue(item, x)}</td>
                <td>{secondValue(item, x)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  const px = (x: number) => 65 + (x + 2) * 50,
    py = (y: number) => 360 - (y + 4) * 8;
  const path = (fn: (x: number) => number) =>
    Array.from({ length: 81 }, (_, i) => {
      const x = -2 + i / 10;
      return `${i ? "L" : "M"}${px(x)},${py(fn(x))}`;
    }).join(" ");
  return (
    <>
      <p>
        Сплошная линия: {item.first}. Пунктир: {item.second}. График помогает
        найти пересечение приблизительно. Для точного ответа проверь координаты
        подстановкой.
      </p>
      <svg
        className={styles.graph}
        viewBox="0 0 530 410"
        role="img"
        aria-label={`Графики ${item.first} и ${item.second}; точные значения в таблице ниже`}
      >
        <defs>
          <clipPath id="method-plot">
            <rect x="65" y="40" width="400" height="320" />
          </clipPath>
        </defs>
        {xs.map((x) => (
          <g key={x}>
            <line
              x1={px(x)}
              x2={px(x)}
              y1="40"
              y2="360"
              className={styles.grid}
            />
            <text x={px(x)} y="393" textAnchor="middle">
              {x}
            </text>
          </g>
        ))}
        {[0, 10, 20, 30].map((y) => (
          <g key={y}>
            <line
              x1="65"
              x2="465"
              y1={py(y)}
              y2={py(y)}
              className={styles.grid}
            />
            <text x="50" y={py(y) + 7} textAnchor="end">
              {y}
            </text>
          </g>
        ))}
        <g clipPath="url(#method-plot)">
          <path d={path((x) => firstValue(item, x))} className={styles.first} />
          <path
            d={path((x) => secondValue(item, x))}
            className={styles.second}
          />
        </g>
        <text x="495" y="393">
          x
        </text>
        <text x="20" y="30">
          y
        </text>
      </svg>
      <details>
        <summary>Точные значения в таблице</summary>
        <Representation item={item} method="table" />
      </details>
    </>
  );
}
function Feedback({ item, attempt }: { item: Item; attempt: Attempt }) {
  const match = attempt.x === item.x && attempt.y === item.y;
  const otherRoot = item.quadratic && attempt.x === -1 && attempt.y === 1;
  return (
    <>
      <h3>
        {match
          ? "Координаты совпали"
          : otherRoot
            ? "Пересечение найдено, но условие пропущено"
            : "Проверь координаты"}
      </h3>
      <p>
        Твой ответ: ({attempt.x}, {attempt.y}). По условию:{" "}
        <strong>
          ({item.x}, {item.y})
        </strong>
        .
      </p>
      <p>{item.explanation}</p>
      <p className={styles.note}>
        Проверены только координаты. Записанные действия и выбор метода не
        оценивались автоматически.
      </p>
    </>
  );
}
export default function MathMethodSwitch() {
  const [phase, setPhase] = useState<"choose" | "solve" | "review" | "result">(
    "choose",
  );
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [working, setWorking] = useState("");
  const [method, setMethod] = useState<Method | " ">(" ");
  const [alternative, setAlternative] = useState<Method | " ">(" ");
  const [plan, setPlan] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(0);
  const item = cases[index].items[round];
  useEffect(() => {
    if (phase !== "choose") {
      const heading = document.getElementById("method-stage");
      heading?.scrollIntoView({ block: "start" });
      heading?.focus({ preventScroll: true });
    }
  }, [phase, round]);
  function resetAttempt(now: number) {
    setX("");
    setY("");
    setWorking("");
    setMethod(" ");
    setPlan("");
    setError("");
    setStarted(now);
  }
  function handleBegin(i: number, now: number) {
    setIndex(i);
    setRound(0);
    setAttempts([]);
    setAlternative(" ");
    resetAttempt(now);
    setPhase("solve");
  }
  function handleSubmit(now: number) {
    const a = coordinate(x),
      b = coordinate(y);
    if (a === null || b === null || !working.trim() || method === " ") {
      setError(
        "Введи обе координаты, запиши действия и выбери использованный способ.",
      );
      return;
    }
    setAttempts((old) => [
      ...old,
      {
        x: a,
        y: b,
        working,
        method,
        seconds: Math.round((now - started) / 1000),
        plan: "",
      },
    ]);
    setError("");
    setAlternative(" ");
    setPhase("review");
  }
  return (
    <main className={styles.page}>
      <div className={styles.topline}>
        <Link href="/trainers">← Все тренажёры</Link>
        <span>ASHYQ · METHOD SWITCH</span>
      </div>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>SAT MATH · ВЫБОР СПОСОБА</p>
        <h1>Одна задача. Несколько путей.</h1>
        <p>
          Сначала реши сам. Затем сравни алгебру, график и таблицу и попробуй
          другой способ на новой задаче.
        </p>
        <p className={styles.note}>
          Четыре авторские задачи. Без AI, официального SAT score и сохранения
          после обновления страницы.
        </p>
      </header>
      {phase === "choose" ? (
        <section>
          <h2>Выбери пару задач</h2>
          <div className={styles.caseGrid}>
            {cases.map((entry, i) => (
              <article className={styles.card} key={entry.title}>
                <h3>{entry.title}</h3>
                <p>Первая попытка → другой способ → новая задача.</p>
                <button
                  className={styles.primary}
                  onClick={(e) => handleBegin(i, e.timeStamp)}
                >
                  Начать →
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.lesson}>
          <div className={styles.lessonTop}>
            <button
              onClick={() => {
                setPhase("choose");
                window.scrollTo({ top: 0 });
              }}
            >
              ← К выбору
            </button>
            <span>{round ? "Новая задача" : "Первая попытка"}</span>
          </div>
          <h2 id="method-stage" tabIndex={-1}>
            {phase === "solve"
              ? "Найди координаты пересечения"
              : phase === "review"
                ? "Сравни ответ и способ"
                : "Две попытки рядом"}
          </h2>
          {phase !== "result" && (
            <div className={styles.problem}>
              <p>
                {item.first}
                <br />
                {item.second}
              </p>
              <p>
                {item.quadratic
                  ? "Найди точку пересечения с положительным x (x > 0)."
                  : "Найди точку пересечения двух прямых."}
              </p>
            </div>
          )}
          {phase === "solve" && (
            <div className={styles.panel}>
              {round === 1 && alternative !== " " && (
                <>
                  <p className={styles.saved}>
                    Выбранный для новой задачи способ: {methods[alternative]}.
                    Ты можешь сменить его; ниже отметь, чем воспользовался на
                    самом деле.
                  </p>
                  <p className={styles.note}>Новая задача решается самостоятельно. Готовый график и таблица откроются после ответа.</p>
                </>
              )}
              <label htmlFor="method-working">Твои действия</label>
              <textarea
                id="method-working"
                value={working}
                maxLength={2000}
                onChange={(e) => setWorking(e.target.value)}
              />
              <div className={styles.amounts}>
                <div>
                  <label htmlFor="method-x">Координата x</label>
                  <input
                    id="method-x"
                    value={x}
                    maxLength={15}
                    inputMode="decimal"
                    onChange={(e) => setX(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="method-y">Координата y</label>
                  <input
                    id="method-y"
                    value={y}
                    maxLength={15}
                    inputMode="decimal"
                    onChange={(e) => setY(e.target.value)}
                  />
                </div>
              </div>
              <label htmlFor="used-method">Какой способ ты использовал?</label>
              <select
                id="used-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as Method)}
              >
                <option value=" ">Выбери способ</option>
                {Object.entries(methods).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                className={styles.primary}
                onClick={(e) => handleSubmit(e.timeStamp)}
              >
                Зафиксировать и открыть разбор →
              </button>
            </div>
          )}
          {phase === "review" && attempts[round] && (
            <div className={styles.panel}>
              <Feedback item={item} attempt={attempts[round]} />
              {round === 1 && attempts[round].method !== 'other' && <Representation item={item} method={attempts[round].method} />}
              <details>
                <summary>Мои записанные действия</summary>
                <p className={styles.saved}>{attempts[round].working}</p>
              </details>
              {round === 0 && (
                <>
                  <label htmlFor="alternative-method">
                    Выбери другой способ для новой задачи
                  </label>
                  <select
                    id="alternative-method"
                    value={alternative}
                    onChange={(e) => setAlternative(e.target.value as Method)}
                  >
                    <option value=" ">Выбери способ</option>
                    {(["algebra", "graph", "table"] as Method[])
                      .filter((key) => key !== attempts[0].method)
                      .map((key) => (
                        <option key={key} value={key}>
                          {methods[key]}
                        </option>
                      ))}
                  </select>
                  {alternative !== " " && (
                    <Representation item={item} method={alternative} />
                  )}
                </>
              )}
              <label htmlFor="method-plan">
                Что проверишь в следующий раз?
              </label>
              <textarea
                id="method-plan"
                value={plan}
                maxLength={2000}
                onChange={(e) => setPlan(e.target.value)}
              />
              <p className={styles.note}>
                Например: смысл пересечения, ограничение x или точную
                подстановку. План не оценивается автоматически.
              </p>
              <button
                className={styles.primary}
                onClick={(e) => {
                  const now = e.timeStamp;
                  if (!plan.trim() || (round === 0 && alternative === " ")) {
                    setError(
                      "Запиши план и выбери другой способ для новой задачи.",
                    );
                    return;
                  }
                  setAttempts((old) =>
                    old.map((a, i) => (i === round ? { ...a, plan } : a)),
                  );
                  if (round === 0) {
                    setRound(1);
                    resetAttempt(now);
                    setPhase("solve");
                  } else {
                    setError("");
                    setPhase("result");
                  }
                }}
              >
                {round === 0
                  ? "Попробовать на новой задаче →"
                  : "Сравнить попытки →"}
              </button>
            </div>
          )}
          {phase === "result" && (
            <>
              <div className={styles.caseGrid}>
                {attempts.map((a, i) => (
                  <article className={styles.panel} key={i}>
                    <h3>{i ? "Новая задача" : "Первая задача"}</h3>
                    <p>
                      Отмеченный тобой способ: {methods[a.method]}
                      <br />
                      Время открытой попытки: {a.seconds} сек.
                    </p>
                    <Feedback item={cases[index].items[i]} attempt={a} />
                    <details>
                      <summary>Мои действия и план</summary>
                      <p className={styles.saved}>{a.working}</p>
                      <p className={styles.saved}>{a.plan}</p>
                    </details>
                  </article>
                ))}
              </div>
              <p className={styles.note}>
                Время включает чтение и паузы. Задачи различаются, поэтому эти
                две попытки не доказывают, что один метод быстрее или навык уже
                освоен.
              </p>
              <button
                className={styles.primary}
                onClick={(e) => handleBegin(index, e.timeStamp)}
              >
                Начать заново →
              </button>
            </>
          )}
          {error && (
            <p className={styles.warning} role="alert">
              {error}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
