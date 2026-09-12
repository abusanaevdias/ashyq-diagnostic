# SPEC: ASHYQ Platform Extension — «не только диагностика»

Статус: **implemented and merged** · Владелец: team lead · Ревью: бренд-команда Ashyq
Источник требований: brand-постеры FAQ/Program series (`uploads/IMG_1639–1641`):
«Как отслеживается прогресс», «Рост и рейтинг», «Чемпионат».

## 1. Проблема

Сейчас сайт = lead-gen воронка диагностики. Но ученику мы продаём **систему**:
прогресс-трекинг, Match Days, рейтинг команд, сезон и чемпионат с призами.
На сайте об этом ничего нет → разрыв между обещанием в Instagram и продуктом.

## 2. Цель среза (this iteration)

Показать и дать потрогать обещанную систему без бэкенда:
1. `/program` — витрина программы (progress tracking, Match Day, leaderboard
   points, сезон → чемпионат, призы) в бренд-стиле постеров.
2. `/progress` — **личный прогресс ученика**: история завершённых диагностик
   (localStorage), динамика точки А графиком, skill scores «было → стало»,
   дельты. Это мини-версия обещанного Student Progress Report.
3. Сквозная навигация: landing ⇄ program ⇄ progress, deep-link `/?start=sat|ielts`.

## 3. Out of scope (в бэклог, не делать сейчас)

- Серверный leaderboard, аккаунты, роли тренера/родителя.
- Родительские отчёты PDF, push-напоминания, оплата призов.
- Команды/Match Day как интерактив: на сайте только витрина + демо-таблица.
- Auth и PII: прогресс живёт локально в браузре, без имени/телефона (политика №1).

## 4. IA и маршруты

| Route      | Тип    | Содержание                                            |
| ---------- | ------ | ----------------------------------------------------- |
| `/`        | client | лендинг + воронка диагностики (без изменений логики)  |
| `/program` | client | витрина программы: 01 Progress, 02 Growth & Rating, 03 Championship, CTA |
| `/progress`| client | личный прогресс: экзамен-табы, график точки А, skill scores «было→стало», попытки, CTA |
| `/?start=sat\|ielts` | — | deep-link: сразу выбор экзамена (для CTA с других страниц) |

## 5. Модель данных

`localStorage ashyq:v1:history:{exam}` → `ProgressSnapshot[]` (cap 12):

```ts
interface ProgressSnapshot {
  runId: string;          // дедупликация при remount
  ts: number;
  bandLabel: string;      // "1290–1390"
  bandLow: number;        // ScoreBand.low  → численная ось графика
  bandHigh: number;
  overallPercent: number;
  totalCorrect: number;
  totalQuestions: number;
  elapsedMs: number;
  target: string | null;
  sections: Array<{ section: SectionId; label: string; percent: number; correct: number; total: number }>;
}
```

Запись: один раз на `runId` в effect'е `result_viewed` (не в `finish`, т.к.
result ещё не посчитан). Дедуп по runId идемпотентна к refresh/remount.
Старые ключи (`run`, `active`, `utm`, `leads`) не трогаем — совместимость.

## 6. Контракт UI (бренд-правила из docs/DESIGN.md обязательны)

- `/program`: editorial-секции 01/02/03 как в постерах: номер + линия +
  display-заголовок; иконки — свои filled-глифы в бумажных кругах (не Lucide);
  демо-данные помечены `sample`; призы с ₸; серифный closing statement.
- `/progress`: карточка-отчёт в духе_poster_а: SKILL SCORES «серый было /
  красный стало / ↑ дельта»; график — тонкие линии ink + красная линия точек;
  пустое состояние честное: «Пока пусто» + CTA в диагностику.
- Тон: короткий, уверенный, без клише и «мы не X, мы Y».
- Mobil-first 375–430, без горизонтального скролла; a11y: семантические
  кнопки/ссылки, aria-pressed на табах, SR-подписи графика.

## 7. Acceptance criteria

1. e2e: базовые проверки зелёные + новые: program рендерится и без
   horiz-scroll; progress empty-state → CTA ведёт в onboarding через `?start=`;
   progress с сидированной историей показывает дельту и график; nav-ссылки есть.
2. `validate:bank`, `e2e:audio`, `next build`, typecheck — зелёные.
3. История пишется ровно один раз на runId (refresh на result не дублирует).
4. Никаких PII в history; приватный режим не роняет страницы (try/catch).
5. Скриншоты mobile+desktop обеих страниц визуально в бренд-системе.

## 8. План работ (порядок коммитов)

1. spec (этот файл) → 2. types/config/storage (history API) →
3. useDiagnostic: snapshot на result_viewed → 4. `/program` → 5. `/progress` →
6. nav + `?start=` → 7. analytics events → 8. e2e → 9. прогон всего + скриншоты →
10. объединение с серверной воронкой лидов.

## 9. Риски

- Дубли wordmark/ассетов на новых страницах — переиспользовать `ui/Brand`.
- График на 1 точке: честное состояние «нужно минимум две точки», не рисовать
   фейковый рост.
- `?start=` не должен угонять активную сессию: срабатывает только при
   `activeExam === null`.
