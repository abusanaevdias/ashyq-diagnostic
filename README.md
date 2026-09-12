# ASHYQ Quick Diagnostic

Быстрая диагностика IELTS / SAT — lead-generation продукт и первый этап воронки Ashyq.

Пользователь приходит из холодной WhatsApp-рассылки, за ~15 минут проходит
короткую диагностику, получает персональный отчёт («точка А», сильные стороны,
gap до цели) и одну главную кнопку — «Получить разбор» в WhatsApp.

Это **не** официальный пробный экзамен. Приложение нигде не обещает точный
SAT score или IELTS Band: используются формулировки «предварительная оценка»,
«примерный диапазон», «quick diagnostic».

---

## Быстрый старт

```bash
npm install
npm run dev          # http://localhost:3000
```

Продакшен:

```bash
npm run build
npm run start
```

Проверки:

```bash
npm run typecheck        # tsc --noEmit
npm run validate:bank    # валидация банка вопросов (ответы, дубли, покрытия, скоринг)
npm run e2e              # Playwright-прогон всех сценариев (нужен запущенный dev-сервер)
npm run e2e:audio        # отдельная проверка IELTS Listening
npx tsx scripts/dump-bank.ts  # перегенерировать docs/QUESTION_BANK.md
```

---

## Конфигурация (что править перед запуском рассылки)

| Что | Где |
|---|---|
| WhatsApp-номер Ashyq | `src/lib/config.ts` → `WHATSAPP_NUMBER` или env `NEXT_PUBLIC_ASHYQ_WHATSAPP` (формат `77011234567`) |
| Пороги диапазонов SAT / IELTS | `src/lib/scoring.ts` → `SAT_BANDS`, `IELTS_BANDS` |
| Веса сложности | `src/lib/scoring.ts` → `DIFFICULTY_WEIGHT` |
| Состав теста (кол-во вопросов, mix сложности, длительность) | `src/lib/config.ts` → `EXAMS[..].blueprint` |
| Цели и сроки в onboarding | `src/lib/config.ts` → `EXAMS[..].targets / whenOptions` |
| Брендовые цвета и типографика | `tailwind.config.ts`, `src/app/globals.css` |

Если номер WhatsApp не задан, на экране результата показывается аккуратная
плашка «Тестовый режим» — чтобы никто не ушёл в нерабочую ссылку незаметно.

Остальные настройки — в `.env.example`: скопируй файл в `.env.local` и заполни.

---

## Заявки: куда они попадают

Каждый дошедший до результата фиксируется на сервере, а контакт отправляется
только после явной отправки формы:

| Тип | Когда | Что содержит |
|---|---|---|
| `result` | ученик увидел результат | экзамен, диапазон, цель, слабые темы, UTM — без контакта |
| `contact` | заполнил форму записи | то же + имя, телефон, класс |
| `whatsapp` | нажал кнопку WhatsApp | то же + контакт, если он уже оставлен |

Каналы доставки задаются в `.env.local`: локальный файл
`.data/leads.jsonl`, Telegram и/или HTTPS-вебхук для CRM. На serverless-хостинге
с read-only диском обязательно настрой Telegram или вебхук. Телефон приводится
к международному формату автоматически.

---

## Маршруты

| Route        | Экран                                                        |
| ------------ | ------------------------------------------------------------ |
| `/`          | лендинг + воронка диагностики (landing → onboarding → quiz → result → review) |
| `/diagnostic`| точка входа для рассылок с UTM                                |
| `/program`   | витрина программы: progress tracking, Match Day, leaderboard, чемпионат и призы |
| `/progress`  | личный прогресс: история замеров, график точки А, skill scores «было → стало» |
| `/?start=sat\|ielts` | deep-link сразу в выбор экзамена (CTA с /program и /progress) |
| `/api/validate` | JSON-отчёт валидации банка (для CI / быстрой проверки) |
| `POST /api/lead` | приём и безопасная нормализация заявки с rate limit |
| `GET /api/leads` | защищённая выгрузка JSON/CSV; без `ASHYQ_ADMIN_KEY` возвращает 404 |

Всё состояние диагностики живёт в одном клиентском стейт-машине
(`src/lib/useDiagnostic.ts`): `landing → onboarding → quiz → result → review`.
Личный прогресс (`/progress`) читает историю `ashyq:v1:history:{exam}`
из localStorage — без PII. Серверная воронка лидов хранится отдельно и не
попадает в историю прогресса.

## Структура

```
src/
  app/
    layout.tsx              метаданные, viewport, подключение стилей
    page.tsx                / (лендинг-вход)
    diagnostic/page.tsx     /diagnostic (UTM-вход)
    program/page.tsx        /program (витрина программы)
    progress/page.tsx       /progress (личный прогресс)
    api/lead/route.ts       POST /api/lead
    api/leads/route.ts      защищённый GET /api/leads
    api/validate/route.ts   GET /api/validate
    globals.css             дизайн-токены ASHYQ + компонентные классы
  components/
    DiagnosticApp.tsx       роутер экранов + deep-link ?start=
    ProgramScreen.tsx       витрина программы (Match Day, leaderboard, чемпионат)
    ProgressScreen.tsx      личный прогресс: график точки А, skill scores
    Landing.tsx             экран 1: hook + выбор экзамена + continue-чипы
    Onboarding.tsx          экран 2: цель + срок (без имени/телефона)
    quiz/                   QuizRunner, QuestionCard, MaterialView, AudioPlayer
    result/                 ResultScreen, DiagnosticCard, ShareButtons, BookingForm
    review/                 ReviewScreen (разбор вопросов после Finish)
    ui/                     Brand, Primitives (Meter, ConfirmDialog)
  data/
    questions/              банк вопросов по секциям (SAT R&W, SAT Math, IELTS R, IELTS L)
    materials/              passages, таблицы, аудиоматериалы с транскриптами
    index.ts                единый банк + lookups
  lib/
    types.ts                доменные типы (Question, Material, RunState, DiagnosticResult)
    config.ts               бизнес-настройки: экзамены, blueprint, WhatsApp, ключи storage
    selector.ts             сборка теста из банка (mix сложности, группировка по материалам)
    scoring.ts              веса, диапазоны, уровни, gap
    engine.ts               скоринг + insight'ы (чистые функции)
    validate-bank.ts        валидация банка
    useDiagnostic.ts        стейт-машина, таймер, persistence, аналитика
    storage.ts              localStorage + UTM + история прогресса
    lead.ts                 клиентская отправка и нормализация телефона
    lead-server.ts          JSONL-хранилище, Telegram и webhook-доставка
    whatsapp.ts             сборка сообщения и ссылки wa.me
    card-image.ts           PNG-экспорт карточки результата (SVG → canvas, без библиотек)
    analytics.ts            события (dataLayer + console в dev)
scripts/
  validate-questions.ts     CLI-валидация банка
  e2e-check.ts              Playwright-прогон сценариев (mobile)
  dump-bank.ts              генерация docs/QUESTION_BANK.md
docs/
  DESIGN.md                 архитектура, data model, scoring model
  QUESTION_BANK.md          инвентарь вопросов + результат валидации
public/
  audio/ielts/              сюда кладутся студийные MP3 (см. ниже)
```

---

## Как добавить вопрос

1. Открой нужный файл в `src/data/questions/` (или создай новый и добавь его в `src/data/questions/index.ts`).
2. Добавь объект типа `Question`. Обязательные поля: `id, exam, section, domain, skill, difficulty, kind, prompt, correctAnswer, explanation, weight, skillLabel`.
3. Если вопросу нужен passage / таблица / аудио — добавь `Material` в `src/data/materials/` и сошлись через `materialId`. Несколько вопросов на один passage объединяй одинаковым `groupKey` — тогда текст показывается одним блоком.
4. `weight` должен совпадать с весом сложности (easy 1 / medium 1.5 / hard 2).
5. Прогони `npm run validate:bank`. Скрипт проверит: уникальный id, единственный корректный ответ, правдоподобные дистракторы (нет дословных дублей), ссылку на материал, покрытие blueprint'а, корректность сборки и скоринга.
6. Прогони `npm run e2e`, если менялась логика UI.

Правила контента (из брифа): вопрос решается автором до добавления; ответ ровно один;
для Math значения пересчитаны; для Reading ответ подтверждён текстом; без спорных фактов.

---

## Аудио для IELTS Listening

Приоритет загрузки в `src/components/quiz/AudioPlayer.tsx`:

1. **MP3 из `public/audio/ielts/listening-1.mp3` и `listening-2.mp3`** — production-путь.
2. Если файла нет (404) — временный режим: озвучка транскрипта через
   `SpeechSynthesis` (в UI помечено как временный режим). Это **не** production-решение.
3. Если и TTS недоступен — честное сообщение, что аудио не загружено.

Транскрипты лежат в `src/data/materials/ielts-materials.ts` (поле `audio.transcript`)
и используются для fallback и для контроля качества. Чтобы подключить студийные
записи, достаточно положить файлы по указанным путям — код менять не нужно.
Ограничение прослушиваний (`maxPlays: 2`) работает в обоих режимах.

В репозитории уже лежат демо-записи `listening-1.mp3` / `listening-2.mp3`
(сгенерированы для превью по тем же транскриптам). Перед боевым запуском
замените их студийными дублями с тем же именем файла.
Проверка плеера: `npm run e2e:audio`.

---

## Аналитика

События уходят в `window.dataLayer` (совместимо с GA4/GTM) и дублируются в консоль в dev.
Чтобы подключить Amplitude/Mixpanel/метрику — допиши провайдер в `track()`
(`src/lib/analytics.ts`), UI трогать не нужно.

Список событий: `diagnostic_landing_view`, `exam_selected`, `diagnostic_started`,
`onboarding_completed` (зарезервировано), `question_answered`, `question_skipped`,
`diagnostic_completed`, `result_viewed`, `review_opened`, `share_clicked`,
`whatsapp_cta_clicked`, `prep_cta_clicked`, `restart_clicked`, `lead_captured`.

Вместе с `result_viewed` сохраняются: `exam`, `target`, `readiness`, `band`,
`level`, `strongestDomain`, `weakestDomain`, `utm`. Персональные данные не
собираются; опциональные имя/класс хранятся локально и уходят только в текст
WhatsApp-сообщения, если пользователь сам их оставил.

---

## UTM и кампании

`utm_source / utm_medium / utm_campaign / utm_content / utm_term` читаются из URL
при первом заходе, сохраняются в localStorage и:

- прокидываются во все аналитические события;
- добавляются к WhatsApp-ссылке (`&utm_...`), чтобы менеджер видел контекст;
- попадают в текст сообщения (`Кампания: cold01.`), если задан `utm_campaign`.

Прогресс и результат не зависят от UTM: один и тот же человек с разными utm
видит свой сохранённый результат.

---

## Persistence (localStorage)

| Ключ | Содержимое |
|---|---|
| `ashyq:v1:run:sat` / `ashyq:v1:run:ielts` | этап, ответы, индекс, таймер, цель, seed сборки |
| `ashyq:v1:active` | какой экзамен открыт (для возврата после refresh) |
| `ashyq:v1:utm` | UTM-контекст |
| `ashyq:v1:leads` | локальный журнал лид-снапшотов (последние 50) |
| `ashyq:v1:history:sat` / `ashyq:v1:history:ielts` | последние 12 завершённых диагностик без PII |

Сброс версии схемы (`SCHEMA_VERSION` в `config.ts`) обнуляет старые состояния
без ошибок парсинга.

---

## Доступность и производительность

- Семантические кнопки, `role="radio"/"radiogroup"`, `aria-pressed`, `aria-checked`, `role="timer"`, `role="dialog"` + `aria-modal`.
- Клавиатура: Tab/Enter, стрелки ←/→ между вопросами, цифры 1–4 и буквы A–D для выбора варианта.
- Видимые focus-states, контраст проверен (ink на paper, red как акцент).
- First Load JS ≈ 146 kB, анимации 140–320 мс, без тяжёлых библиотек.
- Mobile-first: 375–430 px без горизонтального скролла (проверяется в e2e).

---

## Честность продукта

- Нигде нет формулировок «Ваш IELTS = 6.5» или «official SAT prediction».
- Результат всегда: «предварительный диапазон / readiness» + уровень
  (FOUNDATION / DEVELOPING / STRONG / ADVANCED).
- Под результатом — дисклеймеры: про College Board (SAT) и про то, что Writing
  и Speaking не оценивались (IELTS).
- Таймер не обрывает тест: после 15 минут появляется мягкое предупреждение.
- Finish и Reset всегда через подтверждение.
