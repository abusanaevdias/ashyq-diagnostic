# ASHYQ Design System v3 — «Clean Premium EdTech»

Источник стиля: макет `uploads/image-1.png` (6 экранов: Главная, Курсы,
Диагностика, О нас, Блог, Контакты). Цвета семплированы из макета
(`design/tokens.json`, `design/tokens.css`). Этот документ заменяет v2
(плакатный стиль кампаний, `docs/DESIGN.md`) для продуктового сайта;
из v2 сохраняются только: оригинальный wordmark, рукописный акцент,
искра как микро-деталь и честность формулировок.

## 1. Суть стиля (5 принципов)

1. **Свет и воздух.** Тёплый off-white фон `#F8F7F3`, крупные поля,
   один смысловой блок на экранную высоту. Плотность низкая.
2. **Один акцент — красный `#DE0B1B`.** Кнопки, иконки, цифры, графики,
   ссылки. Всё остальное нейтрально: ink / gray / hairline.
3. **Реальные тёплые фото** как главные визуальные якоря (студенты,
   кампусы, интерьеры, ноутбуки). Без ч/б, без плакатной обработки.
4. **Мягкая геометрия:** радиусы 12–24px, пилюли кнопок и чипсов,
   тени-дымка, hairline-бордеры. Никаких острых плакатных углов.
5. **Спокойная типографика:** Manrope ExtraBold для заголовков (плотный
   трекинг), Inter для текста, Caveat только для рукописных акцентов
   (1–2 на страницу, красный).

## 2. Палитра (роли)

| Токен | Hex | Роль |
| --- | --- | --- |
| bg | `#F8F7F3` | фон страниц |
| surface | `#FDFDFD` | карточки, инпуты, футер |
| blush | `#F9E0DB` | розовые CTA-полосы, icon-chip, бейджи |
| blush-soft | `#FCF3F0` | ховер лёгких красных элементов |
| red | `#DE0B1B` | акцент №1 |
| red-deep | `#B60916` | hover/pressed |
| ink | `#161311` | заголовки, текст, чёрные кнопки/полосы |
| ink-soft | `#6E6D6B` | вторичный текст |
| ink-muted | `#8C8B8A` | мета, подписи, плейсхолдеры |
| hairline | `#EFEEEA` | бордеры, разделители |
| dark / dark-warm | `#1B1512` / `#241D16` | тёмные полосы и карточки-цитаты |

Правило: красный ≤ 15% площади экрана; blush-полоса — не чаще 1 на экран.

## 3. Типографика

- **Manrope 700/800** — заголовки всех уровней; letter-spacing −0.02em;
  переносы по смыслу, `text-wrap: balance`.
- **Inter 400/500/600** — текст, кнопки, чипсы, микро-лейблы (600,
  uppercase, ls 0.14em, цвет ink-muted).
- **Caveat 600** — рукописные акценты: короткие фразы («Education for a
  brighter tomorrow», «начни здесь»), красный, поворот −2…3°, никогда
  в кнопках/формах/длинных текстах.
- Scale: display-xl clamp(2.6rem,6vw,4.6rem) → micro 0.6875rem;
  цифры-статы = t-stat; мета карточек = small 0.8125rem ink-muted.
- Кириллица обязательна во всех начертаниях; self-host woff2.

## 4. Сетка и ритм

- Контейнер 1200px, pad 24px; 12 колонок desktop, gap 24px.
- Секции: py 96 desktop / 56 mobile; между блоками 48/32.
- Hero: 2 колонки (текст 7 / визуал 5) desktop; мобильный порядок:
  микро-лейбл → заголовок → текст → кнопки → статы → фото.
- Карточки: pad 28/20; радиус lg 20 (карточки), xl 24 (полосы), md 16 (фото).

## 5. Компоненты (спека)

- **NavBar**: bg = bg страницы, hairline снизу при скролле; wordmark red;
  ссылки Inter 500 0.875rem ink-soft, hover ink; иконка поиска; red pill CTA.
- **Кнопки**: pill 48px; red (тень pill), black, outline(hairline),
  ghost-light (на тёмном/розовом); стрелка → внутри, hover: −1px lift,
  стрелка +2px. Никаких квадратных кнопок.
- **MicroLabel**: uppercase 0.6875/600/0.14em ink-muted над заголовком.
- **StatsRow**: t-stat ink + small ink-muted под ним; разделитель — воздух
  или hairline; 3–4 метрики.
- **DirectionCard** (IELTS/SAT/Диагностика): surface, hairline, r-lg,
  pad 20; заголовок h3, текст small, circle-arrow справа внизу.
- **StepRow 01–04**: номер micro red + заголовок h3 + small; соединительные
  hairline-стрелки на desktop.
- **ProgressCard**: surface r-lg hairline; внутри: t-stat процент,
  дельта-чип red «↗ +12% за 4 месяца», линейный график red 2px с точками,
  skill-бары: track hairline, fill red, подпись small; мини bar-chart red.
- **CourseCard**: фото md-16 сверху (16:10), бейдж «Популярный» blush pill
  поверх фото; заголовок h3, small-описание; мета-строка small ink-muted
  (модули · формат · ★рейтинг); circle-arrow справа.
- **FilterChips**: pill 36px; активный = ink bg + on-dark; hover hairline→ink.
- **IconChip**: 40x40 r-xs; light = blush bg + red line-глиф; solid = red bg
  + white глиф (контакты, чек-листы). Line-иконки stroke 1.6, round caps.
- **Checklist**: row = IconChip light + body-текст; gap 12.
- **TestimonialCard**: фото-квадрат r-md слева, цитата body, имя small
  ink-muted; рядом t-stat red + avatar-stack (4 фото 32px + «+»).
- **BandBlush**: r-xl blush, pad 40; заголовок h2 ink + текст + black pill +
  фото-декор справа (книги/конверт), hand-note допустима.
- **BandDark**: r-xl dark + radial red-glow справа; заголовок h2 on-dark +
  red pill + micro-строка; используетcя 1 раз на страницу максимум.
- **BlogCard**: featured = фото 16:9 r-md + бейдж категории blush + h3 +
  мета (время · просмотры) + «Читать →»; side-list: thumb 72px r-sm +
  заголовок small + мета.
- **SubscribeBand**: blush r-xl; заголовок h3 + email field pill + red pill
  «Подписаться»; фото-декор.
- **ContactRow**: IconChip solid + заголовок small 600 + тело small ink-soft.
- **Form**: field r-sm surface hairline; focus red outline; submit black pill;
  под формой small ink-muted «отвечаем в течение 24 часов».
- **MapCard**: r-lg, светлая карта-заглушка + red pin + surface-карточка
  «Приходите в гости» + outline pill.
- **Footer**: bg surface, hairline сверху; wordmark + tagline small;
  3 колонки ссылок small ink-soft; соц-иконки line; копирайт micro.
- **Badge**: blush pill small 600 red text («Популярный», категории блога).

## 6. Блюпринты страниц (порядок блоков)

1. **Главная**: Nav → Hero (micro «Образование открывает двери», display-xl
   «Больше, чем подготовка.» + red «Реальные возможности.», body-l, red+outline
   кнопки, StatsRow 12 000+/4.8/90%, справа фото студента + вертикальный
   micro-текст + surface-карточка «Запишись сегодня…») → «Выберите свой
   следующий шаг» (3 DirectionCard) → «Как это работает» (StepRow 01–04) →
   «Ваш рост в цифрах» (ProgressCard + текст) → BandDark CTA → Footer.
2. **Курсы**: Nav → заголовок display-l + intro + фото-коллаж справа →
   FilterChips → 2×2 CourseCard → BandBlush «Не знаете, с чего начать?» →
   Footer.
3. **Диагностика**: Nav → заголовок + surface-карточка справа «Точнее план…
   » → Checklist «Что вы получите?» (5 IconChip light) + фото ноутбука +
   red pill → «Как проходит диагностика?» StepRow 01–03 → TestimonialCard +
   90% + avatar-stack → Footer. (Здесь живёт наша воронка: CTA ведёт в quiz.)
4. **О нас**: Nav → micro «Наша миссия» + display-l + body + t-script +
   фото кампуса → StatsRow 4 метрики → «Наши ценности» 4× IconChip light +
   текст → dark-warm карточка-цитата с фото «Мы создаём больше, чем курсы…» →
   Footer.
5. **Блог**: Nav → заголовок + intro + фото-thumb справа → FilterChips +
   поиск → BlogCard featured + side-list 3 → SubscribeBand → Footer.
6. **Контакты**: Nav → micro «Мы всегда рядом» + display-l → 3 ContactRow +
   соцсети | Form + black pill → MapCard + side-фото «LET'S MAKE IT HAPPEN
   TOGETHER» → Footer.

## 7. Моушен и a11y

- Enter-анимации: fade + translateY(10px), 260ms, по скроллу (Intersection
  Observer), только 1 раз; hover: lift −1px / тень / стрелка +2px (150ms).
- `prefers-reduced-motion` отключает всё. Фокус-ring red 2px offset 3.
- Контрасты: ink на bg ≥ 12:1; red на bg ≥ 5:1; on-dark ≥ 12:1; ink-muted
  только для meta ≥ 0.6875rem при контрасте ≥ 4.5:1 (проверить #8C8B8A на
  bg — для body-текста не использовать).
- Mobile 375–430: одна колонка, кнопки full-width в формах/CTA, tap ≥ 44px,
  без горизонтального скролла.

## 8. Do / Don't

Do: воздух, одна красная доминанта на блок, фото с тёплым светом, hairline
вместо тяжёлых бордеров, числа как дизайн-элемент, blush для вторичных CTA.
Don't: градиенты кроме radial-glow в BandDark, стекло, неон, ч/б-фото,
плакатные рваные края и марquee из v2, Lucide-иконки «из коробки» толще 1.6,
тени темнее 10% alpha, более 2 рукописных акцентов на страницу, эмодзи.

## 9. Связка с брендом ASHYQ

- Wordmark: оригинальный `public/brand/wordmark-red.png` (никогда не
  перерисовывать); в nav высота 20–22px.
- Искра из логотипа — допустима как микро-деталь (буллет, favicon), не везде.
- Рукописный Caveat наследуем из v2 — это мостик между стилями.
- Тон текстов: короткий, уверенный, без клише; «мы не X, мы Y» запрещено.

