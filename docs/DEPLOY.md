# Деплой ASHYQ (DEPLOY-PREP-001)

Хостинг ещё не выбран. Всё ниже работает на любом VPS или платформе с Docker
либо Node.js 24. Значения с пометкой **ЗАМЕНИТЬ** — плейсхолдеры: их нужно
заполнить настоящими данными перед запуском.

## 1. Что нужно решить до деплоя

| Вопрос | Сейчас | Что сделать |
|---|---|---|
| Домен | нет | **ЗАМЕНИТЬ**: `https://ЗАМЕНИТЬ-ДОМЕН` → `NEXT_PUBLIC_SITE_URL` |
| Хостинг | нет | VPS с Docker (рекомендуется: диск для заявок) или Node-платформа |
| Куда приходят заявки | только файл и `/crm` | Telegram-бот и/или https-webhook (раздел 3) |
| Ключ CRM | локальный | новый длинный ключ только для прода |
| Бэкапы заявок | нет | копия тома `/data` по расписанию (раздел 5) |

## 2. Демо-контент, который заменить перед публичным запуском

- **Блог** `/blog` — демо-статьи с плашкой «демо», noindex. Нужны настоящие статьи.
- **Курсы** — длительность, расписание, стоимость, преподаватели помечены
  «предварительно/уточняется» (`docs/COURSE_CONTENT_TODO.md` после
  COURSE-DETAILS-001).
- **Чемпионат** `/season` — демо-сезон «Season 03» на фикстурах в браузере
  (`src/lib/season/seed.ts`). Сервера сезонов и авторизации пока нет
  (SEASON-AUTH-001, SEASON-BACKEND-001).
- **LMS** `/login`, кабинеты — LocalDemo в `localStorage`, демо-аккаунты.
- **Контакты** — подтверждены; почты и адреса офиса нет.
- **Аналитика** — не подключена.

## 3. Переменные окружения

Полный список с пояснениями — в [`.env.example`](../.env.example).

| Переменная | Когда задаётся | Прод-значение |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **при сборке** | `https://ЗАМЕНИТЬ-ДОМЕН` |
| `NEXT_PUBLIC_ASHYQ_WHATSAPP` | **при сборке** | `77067080181` (подтверждён) |
| `ASHYQ_ADMIN_KEY` | при запуске | `openssl rand -hex 32`, не короче 32 символов |
| `ASHYQ_TELEGRAM_BOT_TOKEN` + `ASHYQ_TELEGRAM_CHAT_ID` | при запуске | **ЗАМЕНИТЬ**: бот от @BotFather + chat id менеджеров |
| `ASHYQ_TELEGRAM_APP_URL` | при запуске | необязательно; ссылка Mini App `https://t.me/<бот>/crm` из @BotFather `/newapp` (Web App URL — `https://<домен>/crm`): CRM в Telegram для участников группы заявок и кнопка «Открыть в CRM» под заявкой |
| `ASHYQ_TELEGRAM_WEBHOOK_SECRET` | при запуске | необязательно; `openssl rand -hex 32`: кнопки этапов под заявкой и команды бота. После деплоя один раз `curl -X PUT https://<домен>/api/telegram -H "x-ashyq-admin-key: <ключ>"` (webhook + меню команд); бот — админ группы |
| `CRON_SECRET` | при запуске | необязательно; `openssl rand -hex 32`: утренняя сводка и напоминания бота, расписание — ниже, «Расписание бота» |
| `ASHYQ_LEAD_WEBHOOK_URL` | при запуске | необязательно; только `https://` |
| `ASHYQ_LEADS_DIR` | при запуске | постоянный диск; в Docker уже `/data` |
| `ASHYQ_NOTIFY_ALL` | при запуске | пусто (или `1` — уведомлять и о результатах без контакта) |
| `ASHYQ_LEADS_PROVIDER` | при запуске | пусто — файлы в `ASHYQ_LEADS_DIR`; `supabase` — заявки в Supabase |
| `ASHYQ_SUPABASE_URL` + `ASHYQ_SUPABASE_SERVICE_ROLE_KEY` | при запуске | **ЗАМЕНИТЬ**, если выбран Supabase: `https://ПРОЕКТ.supabase.co` + service role key (только на сервере) |

`NEXT_PUBLIC_*` вшиваются в JS при `next build`. После смены домена образ
нужно пересобрать, одной переменной при запуске недостаточно.

При старте прод-сервер сам проверяет окружение и пишет в лог
`[ashyq env] …`. Предупреждения там означают, что сайт работает, но не как в
проде. Строки `ОШИБКА` означают, что заявки теряются или не доставляются; в
этом случае `/api/health` отвечает 503.

### Расписание бота: сводка в 9:00 и напоминания

`/api/telegram/cron?job=digest|remind` вызывается по расписанию с заголовком
`Authorization: Bearer <CRON_SECRET>`. Расписание живёт в Supabase
(`pg_cron` + `pg_net`): бесплатно и хоть каждые 5 минут. Vercel Hobby
запускает cron раз в сутки, а GitHub Actions в приватном репозитории съел бы
лимит минут. Один раз в Supabase → SQL Editor, подставив домен и секрет:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 04:00 UTC = 09:00 в Алматы
select cron.schedule('ashyq-digest', '0 4 * * *', $$
  select net.http_get(
    url := 'https://<домен>/api/telegram/cron?job=digest',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  )
$$);

select cron.schedule('ashyq-remind', '*/5 * * * *', $$
  select net.http_get(
    url := 'https://<домен>/api/telegram/cron?job=remind',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  )
$$);
```

Повторный `cron.schedule` с тем же именем обновляет задачу — так меняют домен
или секрет. Проверка: `select status_code, content from net._http_response
order by created desc limit 5;` — ожидается `200` и `{"ok":true,"sent":…}`.
Напоминание приходит один раз, если «Новый» с телефоном 15 минут никто не
взял; заявки старше суток не напоминаются — они попадают в утреннюю сводку.

## 4. Запуск

### Docker (рекомендуется)

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://ЗАМЕНИТЬ-ДОМЕН -t ashyq .
docker volume create ashyq-data
docker run -d --name ashyq --restart unless-stopped -p 3000:3000 \
  --env-file .env.production -v ashyq-data:/data ashyq
```

- Образ — standalone-сборка Next.js на `node:24-alpine`, процесс работает от
  пользователя `node`.
- Заявки и журнал доставки лежат в томе `/data` и переживают пересборку.
- `HEALTHCHECK` опрашивает `/api/health`.
- `.env.production` — файл на сервере с переменными из раздела 3, в git не
  попадает.

### Node.js без Docker

```bash
npm ci
NEXT_PUBLIC_SITE_URL=https://ЗАМЕНИТЬ-ДОМЕН npm run build
ASHYQ_LEADS_DIR=/var/lib/ashyq ASHYQ_ADMIN_KEY=… npm run start   # порт 3000
```

### HTTPS и прокси

Сайт отдаёт заголовок `Strict-Transport-Security`, поэтому его нужно
открывать только по HTTPS. Перед контейнером ставится прокси с сертификатом:
Caddy (сертификат выпускает сам), nginx + certbot или HTTPS от платформы.
Прокси проксирует всё на `127.0.0.1:3000`.

С файловым хранилищем нужен один экземпляр: заявки пишутся в локальный файл.
С `ASHYQ_LEADS_PROVIDER=supabase` заявки, журнал доставки и события CRM
живут в Supabase (схема и RLS — [`SUPABASE_FOUNDATION.md`](SUPABASE_FOUNDATION.md)),
поэтому постоянный диск для них не нужен и проверка папки заявок
отключается.

### Персональный вход в CRM (CRM-PROD-001)

С `NEXT_PUBLIC_AUTH_PROVIDER=supabase` на экране `/crm` есть кнопка «Войти
аккаунтом ASHYQ»: сотрудник входит на `/login` своей почтой и паролем, сервер
проверяет сессию в Supabase и пускает роли `admin` и `manager`. Новых
переменных не нужно — сервер берёт адрес и service role key заявок
(`ASHYQ_SUPABASE_*` или переменные интеграции Vercel). Ключ админа и вход из
Telegram работают как раньше.

Роль выдаёт владелец в SQL Editor Supabase (один раз применить миграцию
`supabase/migrations/20260915000200_crm_staff.sql`). Сотрудник сначала
регистрируется на `/login`, затем:

```sql
update public.profiles set role = 'manager'
where id = (select id from auth.users where email = 'ПОЧТА-СОТРУДНИКА');
```

Снять доступ — `role = 'student'`; уже открытая CRM работает ещё до 5 минут
(кэш проверки). В учебном разделе у `manager` учебных прав нет.

## 5. Чек-лист запуска

- [ ] Домен и DNS указывают на сервер, HTTPS работает.
- [ ] Образ собран с настоящим `NEXT_PUBLIC_SITE_URL`.
- [ ] `.env.production` заполнен: новый `ASHYQ_ADMIN_KEY`, Telegram или webhook.
- [ ] В логе старта нет `[ashyq env] ОШИБКА`.
- [ ] `curl https://ЗАМЕНИТЬ-ДОМЕН/api/health` → `{"status":"ok"}`.
- [ ] Vercel и другие хостинги с read-only диском: заявки только в Supabase, иначе файлы в `/tmp` теряются.
      На Vercel с официальной интеграцией Supabase ↔ Vercel ничего добавлять не нужно: сайт сам берёт её
      `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Без интеграции — `ASHYQ_LEADS_PROVIDER=supabase` +
      `ASHYQ_SUPABASE_URL` + `ASHYQ_SUPABASE_SERVICE_ROLE_KEY`. `/api/health` отвечает
      `{"status":"ok","storage":"supabase","auth":"supabase"}`, когда заявки сохраняются, а вход настоящий
      (`auth:"demo"` — сборка не увидела `NEXT_PUBLIC_AUTH_PROVIDER=supabase` ровно строчными, без кавычек); 503 — причина в логе `[ashyq env]`
      (на Vercel в файловом режиме — всегда 503).
- [ ] Тестовая заявка с `/contacts` пришла в Telegram и видна в `/crm`.
- [ ] `/crm` без ключа отвечает 404.
- [ ] `robots.txt` и `sitemap.xml` содержат прод-домен, а не localhost.
- [ ] Бэкап тома `/data` по расписанию, например ежедневно:
      `docker run --rm -v ashyq-data:/data -v "$PWD":/backup alpine tar czf /backup/ashyq-data-$(date +%F).tgz -C /data .`
- [ ] Демо-контент из раздела 2 заменён или осознанно оставлен с пометками.

## 6. Проверки перед релизом

Тот же набор, что гоняет CI (`docs/CI.md`), плюс самопроверка окружения:

```bash
npx tsx scripts/env-check.ts
```
