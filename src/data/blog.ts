/**
 * Публикуемые материалы блога. Формат body — markdown-lite:
 * пустая строка разделяет блоки, `# ` создаёт h2, `## ` — h3,
 * `- ` — список, ссылки записываются как [текст](https://... или /путь).
 */

export type BlogCategory = 'ielts' | 'sat' | 'season';

export const BLOG_CATEGORIES: Record<BlogCategory, string> = {
  ielts: 'IELTS',
  sat: 'SAT',
  season: 'Сезон',
};

export type BlogPost = {
  slug: string;
  language?: 'en' | 'ru';
  category: BlogCategory;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  photo: string;
  coverAlt: string;
  body: string;
  publishedAt: string;
  updatedAt: string;
};

export const BLOG_IS_DEMO = false;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ielts-writing-task-2',
    language: 'ru',
    category: 'ielts',
    title: 'IELTS Writing Task 2: план эссе и проверка по четырём критериям',
    seoTitle: 'IELTS Writing Task 2: план эссе и критерии оценки',
    metaDescription: 'Как разобрать вопрос IELTS Writing Task 2, составить план эссе и проверить ответ по четырём критериям. Пример, тайминг на 40 минут и частые ошибки.',
    excerpt: 'Пошаговый план IELTS Writing Task 2: как понять все части вопроса, выбрать позицию, развить аргументы и проверить эссе по критериям IELTS.',
    photo: '/brand/hero-students.jpg',
    coverAlt: 'Онлайн-занятие и учебные материалы ASHYQ.',
    publishedAt: '2026-09-24T12:00:00.000Z',
    updatedAt: '2026-09-24T12:00:00.000Z',
    body: `Чтобы подготовить сильное эссе для IELTS Writing Task 2, сначала точно ответьте на вопрос задания, затем разверните позицию в логичные аргументы и проверьте текст по четырём критериям IELTS. Практический порядок: разобрать формулировку, набросать план, написать связное эссе и оставить время на проверку.

# Что требуется в IELTS Writing Task 2

В Task 2 нужно написать эссе в ответ на точку зрения, аргумент или проблему. По официальному формату IELTS Academic, указанному на странице на момент обновления этой статьи в 2026 году, требуется минимум 250 слов и около 40 минут на задание. Task 2 весит вдвое больше Task 1 при расчёте балла за Writing, поэтому распределять время между заданиями важно заранее. [Официальное описание IELTS Academic Writing](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing) содержит требования к формату.

Минимум 250 слов — это нижняя граница, а не готовый план эссе. Дополнительный объём сам по себе не гарантирует более высокий балл: каждый абзац должен отвечать на вопрос и развивать мысль. Пишите цельным текстом, а не заметками или маркированным списком.

# Рабочий план на 40 минут

Ниже — вариант распределения времени для тренировки, а не отдельное правило IELTS. После нескольких пробных эссе подстройте его под свой темп, сохранив время на план и проверку.

- 4 минуты — прочитать задание, отметить тему и все части вопроса
- 5 минут — сформулировать позицию и выбрать по одной основной идее для каждого абзаца
- 26 минут — написать черновик связным текстом
- 5 минут — проверить ответ на вопрос, логику, слова и грамматику

## Пример: разобрать задание до начала письма

Тренировочная формулировка: “Some people think secondary school students should spend more time learning practical skills, while others believe academic subjects should be the main priority. Discuss both views and give your opinion.” Это пример для демонстрации плана, а не официальный вопрос IELTS.

- **Тема:** чему уделять время в средней школе — практическим навыкам или академическим предметам.
- **Что нужно сделать:** объяснить обе точки зрения и дать собственное мнение.
- **Позиция:** академические предметы дают основу для дальнейшего обучения, но практические навыки тоже нужно включать в школьную программу.
- **Абзац 1:** почему академические предметы важны; привести понятный пример того, как базовые знания помогают разобраться в сложной теме.
- **Абзац 2:** зачем нужны практические задания; например, проект по планированию бюджета показывает, как применять математические навыки в жизни.

Такой разбор помогает не уйти в общее рассуждение «образование важно» и не забыть вторую часть задания. В официальных материалах IELTS советуют внимательно читать вопросительные слова и отвечать именно на поставленный вопрос. [Разбор формулировок Task 2 на IELTS.org](https://ielts.org/news-and-insights/ielts-writing-task-2-how-to-understand-ielts-question-prompts).

# Проверка по четырём критериям

Task 2 оценивают по четырём критериям. IELTS указывает, что внутри Task 2 они имеют равный вес; их описания опубликованы в [официальных критериях оценки Writing](https://ielts.org/take-a-test/preparation-resources/writing-test-resources) и [дескрипторах Writing Band](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf).

## Task Response — ответ на задание

Проверьте, что вы закрыли каждую часть формулировки, заняли понятную позицию и поддержали основные идеи объяснениями или примерами. Если вопрос просит обсудить обе стороны, одного абзаца с вашей любимой стороной недостаточно.

**Вопрос для самопроверки:** если убрать тему задания, читателю всё равно ясно, на какой вопрос отвечает мой тезис?

## Coherence and Cohesion — связность и логика

Абзацы должны идти в понятном порядке, а каждый из них — развивать одну основную мысль. Связки помогают показать отношение между идеями, но не заменяют логическое объяснение. Повторять “Moreover” в начале каждого предложения не нужно.

**Вопрос для самопроверки:** можно ли объяснить, зачем нужен каждый абзац и как он поддерживает мою позицию?

## Lexical Resource — словарный запас

Оцениваются уместность, точность и диапазон слов. Не подменяйте знакомое точное слово редким синонимом, если не уверены в значении и сочетаемости. Повтор ключевого термина по теме обычно яснее, чем несколько неточных замен.

**Вопрос для самопроверки:** использую ли я слова точно и естественно, а не только чтобы показать «сложный английский»?

## Grammatical Range and Accuracy — грамматика и точность

Покажите, что можете строить предложения разного типа, но оставляйте только те конструкции, которыми управляете. Длинное сложное предложение с несколькими ошибками не становится сильнее просто из-за длины.

**Вопрос для самопроверки:** есть ли у меня разнообразие конструкций и остаётся ли смысл каждого предложения понятным?

# Как подстроить план под тип вопроса

- **Agree or disagree / To what extent:** ответьте, насколько вы согласны, и поддерживайте одну последовательную позицию. Допустим нюанс, если он сформулирован ясно.
- **Discuss both views and give your opinion:** объясните обе позиции и отдельно обозначьте собственную.
- **Advantages and disadvantages:** разберите обе стороны; если спрашивают, перевешивают ли преимущества недостатки, дайте прямой вывод.
- **Problem and solution:** назовите конкретную проблему и предложите решение, которое связано с её причиной.
- **Два вопроса в задании:** отметьте оба вопросительных предложения и ответьте на каждое, а не только на первое.

Перед письмом подчеркните глаголы вроде “discuss”, “explain”, “compare”, “agree” или “suggest”. Они подсказывают, какую работу должен выполнить ответ. [Официальный формат Writing IELTS Academic](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing) также напоминает писать по теме, развивать мысли и приводить относящиеся к ним примеры.

# Частые ошибки и быстрая проверка

- **Начать писать до разбора вопроса.** Потратьте несколько минут на то, чтобы отметить тему, команды задания и число частей, на которые надо ответить.
- **Спрятать своё мнение.** Если вопрос просит мнение, читатель должен увидеть его прямо и понять, сохраняется ли оно по ходу эссе.
- **Оставить аргумент без развития.** После основной идеи добавьте объяснение и подходящий пример; не переходите сразу к следующей мысли.
- **Перегрузить текст связками.** Связь между предложениями должна быть понятна по смыслу, а не только по словам-переходам.
- **Выучить эссе целиком и подставлять тему.** Готовый текст может не отвечать на конкретное задание. Используйте гибкую структуру, но подбирайте тезис и аргументы под формулировку.
- **Проверить только орфографию.** Сначала убедитесь, что ответили на весь вопрос; затем смотрите на логику, словоупотребление и грамматику.

Перед сдачей перечитайте эссе и отметьте про себя: «ответил на все части», «позиция ясна», «у каждого абзаца одна функция», «пример поддерживает мысль», «проверил окончания, артикли и согласование». Если какой-то пункт не выполняется, исправьте его прежде, чем заменять слова на более сложные.

# Частые вопросы

## Сколько слов нужно написать в IELTS Writing Task 2?

Для IELTS Academic требуется не менее 250 слов. Официальная страница формата предупреждает, что слишком короткому ответу может не хватить материала для оценки языковых навыков. Большой объём тоже не цель сам по себе: оставьте время на проверку и не добавляйте мысли, которые не отвечают на вопрос.

## Сколько времени дают на Task 2?

Ориентир официального формата IELTS Academic — около 40 минут; Task 2 не должен занять больше этого времени. Потренируйтесь писать с таймером и оставляйте несколько минут на финальную проверку.

## Обязательно ли писать ровно четыре абзаца?

Официальные требования говорят о связном, ясном и логично организованном тексте, а не о фиксированном числе абзацев. Вариант «введение, два основных абзаца, заключение» помогает спланировать эссе, но меняйте его, если этого требует задание.

## Как оценивают IELTS Writing Task 2?

По Task Response, Coherence and Cohesion, Lexical Resource и Grammatical Range and Accuracy. Эти четыре критерия имеют равный вес внутри Task 2, а сам Task 2 влияет на итоговый Writing score сильнее Task 1.

# Что делать дальше

ASHYQ — образовательный бренд Казахстана с онлайн-подготовкой к IELTS и Digital SAT. Если вы хотите выстроить системную подготовку по четырём критериям, посмотрите, как устроен [онлайн-курс IELTS в ASHYQ](/courses/ielts).

Для первого ориентира по общему уровню можно [пройти бесплатную предварительную диагностику ASHYQ](/diagnostic). Она не выставляет официальный Writing band и не заменяет проверку конкретного эссе преподавателем.

# Официальные источники

- [Формат IELTS Academic Writing](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing)
- [Критерии и ресурсы по оцениванию Writing](https://ielts.org/take-a-test/preparation-resources/writing-test-resources)
- [Публичные дескрипторы IELTS Writing Band](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf)
- [Как читать формулировки Writing Task 2](https://ielts.org/news-and-insights/ielts-writing-task-2-how-to-understand-ielts-question-prompts)`,
  },
  {
    slug: 'ielts-writing-task-1-guide',
    language: 'en',
    category: 'ielts',
    title: 'IELTS Academic Writing Task 1: A Step-by-Step Report Guide',
    seoTitle: 'IELTS Writing Task 1: Structure and Example Report',
    metaDescription: 'Learn the IELTS Academic Writing Task 1 structure, choose key features, write a clear overview and check your report using official IELTS criteria and examples.',
    excerpt: 'A practical method for analysing an Academic Task 1 visual, selecting the main features, writing an overview and checking your report against official IELTS guidance.',
    photo: '/blog/ielts-task-1-workflow.svg',
    coverAlt: 'Five-step IELTS Academic Writing Task 1 report workflow, from reading the visual to checking accuracy.',
    publishedAt: '2026-09-24T18:19:00.000Z',
    updatedAt: '2026-09-24T18:19:00.000Z',
    body: `For IELTS Academic Writing Task 1, describe the main features of the visual, give a clear overview, and support it with a few accurate details. You have about 20 minutes and must write at least 150 words. A four-paragraph layout can help, but IELTS does not require an exact number of paragraphs or a fixed place for the overview. [IELTS's official Academic Writing format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing) sets the task requirements.

# First, check which Task 1 you have

This guide covers **IELTS Academic Writing Task 1**: you may need to report information from a graph, chart, table, map, process or object. The General Training test has a different Task 1: a letter. Check the test type you are taking before you practise.

Task 1 is part of a 60-minute Writing test. IELTS recommends spending no more than 20 minutes on it, writing at least 150 words, and using connected prose rather than notes or bullet points. Task 2 carries twice the weight of Task 1 in the Writing score, so protect enough time for the essay as well. These are official test requirements, not a promise that a particular word count or template will earn a particular band.

![Five steps for an IELTS Academic Writing Task 1 report: read the prompt, identify patterns, write an overview, support it with selected details, and check accuracy.](/blog/ielts-task-1-workflow.svg)
Use this sequence as a practice routine. It is a planning aid, not an official IELTS template.

# A reliable method for any Academic Task 1 visual

## 1. Read the task and inspect the visual

Before writing, identify what is shown, who or what is being compared, the units, and the time period. Read the instruction line too: it may ask you to describe a process or explain how something works rather than compare values.

Ask yourself:

- What is being measured or illustrated?
- Which categories, stages, places or dates appear?
- Are values shown as percentages, totals, years, or another unit?
- Is the data about the past, the present, or a future estimate?

Use only information supported by the visual. IELTS describes Task 1 as a factual information-transfer task; the official assessment guidance advises candidates to select key features and compare or contrast relevant information. Do not add a cause, opinion or prediction that the task does not provide. See the [IELTS Writing key assessment criteria](https://ielts.org/cdn/ielts-guides/ielts-writing-key-assessment-criteria.pdf).

## 2. Select the main features

Do not try to report every point. Look for the features that help a reader understand the whole visual: an overall rise or fall, a high or low point, a major contrast, a stable period, a change in stages, or a clear similarity.

For a chart with several series, compare groups that share a meaningful pattern. For a process, identify its start and end and group related stages. For a map, note the largest changes in layout or land use. The right selection depends on the visual; there is no single list of features that fits every task.

## 3. Write the overview before the detail

The overview gives the reader the main pattern without listing all the figures. It is usually one or two sentences. Make it specific enough to distinguish this visual from another one: mention the dominant trend, the strongest contrast, the main stages or the broad direction of change.

The official IELTS band descriptors for Academic Task 1 refer to a clear overview and appropriately selected, grouped key features at Band 7. That is why an overview should do more than say “there were several changes.” Read the [official Writing band descriptors](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf) for the wording across bands.

An official IELTS sample task shows radio and television audiences across the day in 1992. In its examiner commentary, the Band 6 response is described as needing a fuller overview; the commentary points to the contrast between radio's morning peak and television's evening peak. A concise paraphrase of that pattern could be: “Overall, radio listening was strongest earlier in the day, while television viewing peaked in the evening.” This paraphrase summarizes the examiner's explanation; it is not a quotation or a new score claim. The sample scripts and comments are in the [official IELTS Academic Writing sample tasks PDF](https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf).

Do not treat the example sentence as a template to reuse. Your overview must come from the visual in front of you.

![The overview states the main relationship; the detail section supports it with selected information from the visual.](/blog/ielts-task-1-overview-vs-evidence.svg)
The overview helps the reader see the pattern first; selected details then show where that pattern comes from.

## 4. Support the overview with accurate details

After the overview, choose a small number of details that demonstrate the pattern. Include precise values when they help, and keep units and categories clear. Comparisons are often more useful than a list: explain how two groups differ, how a figure changes over time, or which stages happen before and after another.

Check each number against the visual as you write. A correctly described trend with one inaccurate figure can confuse the reader. If the chart has many data points, select the most useful ones rather than copying the entire chart into prose.

## 5. Check language against the visual

Use tense that matches the dates and use comparative language only where a comparison is visible. For a process diagram, sequence words can clarify stages. For a map, use location language carefully. Do not describe a projected value as a confirmed future result: report it as a forecast or estimate if the visual labels it that way.

Useful language comes from the task itself. Identify the exact nouns, units and labels first, then choose verbs and comparisons that describe them accurately. A plain, correct description is more useful than a memorised phrase that changes the meaning.

# A practical 20-minute practice plan

IELTS gives about 20 minutes for Task 1. This split is a practice suggestion, not an official timing rule; adjust it to your pace while keeping time for both tasks in the full test.

| Practice time | What to do |
| --- | --- |
| 2–3 minutes | Read the prompt, labels, units and dates. |
| 3–4 minutes | Choose the main features and write a one-sentence overview plan. |
| 10–12 minutes | Draft the report, grouping related details. |
| 2–3 minutes | Check coverage, comparisons, numbers, units and grammar. |

The target is a complete, readable report. Do not spend most of the time searching for “advanced” vocabulary while the overview is still missing.

# Common Task 1 problems to fix

- **Listing every value:** group data around meaningful comparisons and trends.
- **Leaving out the overview:** give the reader the main pattern before the supporting detail.
- **Writing an overview that says almost nothing:** name the specific contrast, trend or process visible in the task.
- **Adding a reason that the chart does not show:** describe the information; do not invent a cause.
- **Mixing up units or dates:** check labels while drafting, especially when the visual contains several series.
- **Using a memorised report:** adapt your structure and language to the task in front of you.
- **Spending too long on Task 1:** practise with a timer so Task 2 still has enough space in the 60-minute test.

# Final check before you move to Task 2

- Did I describe the right visual and cover its main features?
- Is the overview clear and consistent with the information shown?
- Did I choose details that support the overview?
- Are comparisons, units, dates and numbers accurate?
- Did I avoid unsupported explanations or opinions?
- Is the report at least 150 words and written in connected prose?
- Have I kept enough of the 60-minute Writing test for Task 2?

# Frequently asked questions

## How many words do I need for IELTS Academic Writing Task 1?

Write at least 150 words. The official format page states this minimum; it does not say that writing far beyond the minimum automatically improves a score. Use your time to select and explain relevant features clearly.

## How much time should I spend on Task 1?

IELTS advises spending about 20 minutes, and Task 1 should take no more than that. Task 2 is worth twice as much in the Writing score, so practise completing Task 1 efficiently within the full 60-minute test.

## Does Task 1 have to be exactly four paragraphs?

No official rule sets an exact paragraph count. A useful practice structure is an introduction, an overview and one or two detail paragraphs, but organize the report to suit the visual and keep the main features easy to follow.

## Where should I put the overview?

Put it where the reader can find the main pattern easily; many candidates place it after the introduction. IELTS assesses whether the overview is clear and the key features are selected and grouped, rather than requiring one fixed position.

## Can I explain why a trend happened?

Only if the visual or task provides that explanation. Task 1 asks you to report the information shown, so adding an unsupported cause or personal opinion may take the response away from the task.

# Continue your IELTS preparation

ASHYQ is a Kazakhstan-based education brand offering online IELTS and Digital SAT preparation. If you are working on Academic Writing, you can explore the [online IELTS course in Kazakhstan](/courses/ielts) and its preparation format. For a broader level check, use the [ASHYQ diagnostic](/diagnostic); it is an initial orientation and does not assign an official IELTS Writing band or assess this specific Task 1 report.

If you are also preparing for the essay, read our [Russian-language guide to IELTS Writing Task 2 planning and assessment](/blog/ielts-writing-task-2).

# Official IELTS sources

- [IELTS Academic Writing format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-writing)
- [IELTS Writing key assessment criteria](https://ielts.org/cdn/ielts-guides/ielts-writing-key-assessment-criteria.pdf)
- [IELTS Writing band descriptors](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf)
- [IELTS Academic Writing sample tasks and examiner comments](https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf)
- [IELTS Writing preparation resources](https://ielts.org/take-a-test/preparation-resources/writing-test-resources)`
  },
  {
    slug: 'desmos-sat-guide',
    language: 'ru',
    category: 'sat',
    title: 'Как пользоваться Desmos на Digital SAT: 5 примеров и алгоритм',
    seoTitle: 'Desmos на SAT: 5 примеров для Math и частые ошибки',
    metaDescription: 'Пять примеров для SAT Math: уравнения, системы, корни и вершина параболы. Что вводить в Desmos, какую координату читать и как тренироваться в Bluebook.',
    excerpt: 'Разбираем пять типичных математических задач: что ввести в Desmos, где найти ответ и когда быстрее решить вручную. С официальными правилами College Board.',
    photo: '/blog/desmos-sat-workflow.svg',
    coverAlt: 'Алгоритм работы с Desmos на SAT: понять, что ищет задача, построить нужные графики и проверить координату.',
    publishedAt: '2026-09-25T12:00:00.000Z',
    updatedAt: '2026-09-25T12:00:00.000Z',
    body: `На Digital SAT Desmos встроен в Bluebook и доступен в секции Math. Он особенно помогает, когда ответ можно прочитать по пересечению графиков, корню или вершине параболы. Но калькулятор не нужен для каждого задания: сначала решите, что именно спрашивают и какую величину надо найти.

# Что важно знать о Desmos на SAT

College Board предоставляет встроенный Desmos в секции Math; в Bluebook можно переключаться между графическим и научным режимами. Калькулятор не обязателен, а некоторые задачи быстрее решить без него. В Reading and Writing калькулятор использовать нельзя. Это действующие правила SAT Suite на дату обновления статьи; перед экзаменом проверьте актуальную [политику College Board по калькуляторам](https://satsuite.collegeboard.org/in-school-assessments/calculator-policy).

Для абитуриента из Казахстана полезно заранее потренироваться именно в Bluebook: внешний сайт Desmos помогает освоить графики, но на экзамене вы будете работать со встроенной версией и интерфейсом теста. College Board советует открыть [test preview или пробный тест Bluebook](https://bluebook.collegeboard.org/students/tools), чтобы познакомиться с инструментами до дня экзамена.

# Алгоритм: от вопроса к координате

![Схема выбора действия в Desmos: определить искомое, ввести графики, прочитать нужную координату и проверить её по вопросу.](/blog/desmos-sat-workflow.svg)
Сначала назовите искомую величину: значение x, значение y, точку пересечения, корень уравнения или минимум/максимум. Затем введите только нужные графики, найдите отмеченную точку и сверьте её координаты с вопросом. Прежде чем выбрать ответ, проверьте знак, единицы и формат.

| Тип задачи | Что ввести | Что считать ответом |
| --- | --- | --- |
| Уравнение с одной переменной | Каждую часть как отдельную функцию | Координату x точки пересечения |
| Система уравнений | Обе прямые или кривые | Нужную координату точки пересечения |
| Корни квадратного уравнения | Функцию и y=0 | Значения x в точках пересечения с осью x |
| Минимум или максимум | Функцию | Координату x, координату y или обе — как просит вопрос |
| Значение функции | Объявить функцию и подставить число | Полученное значение функции |

# Пять примеров для SAT Math

Это оригинальные учебные примеры для объяснения приёма, не официальные вопросы College Board. В строках Desmos ниже используйте латинские x и y, а результат прочитайте по графику или по значению выражения.

## 1. Решить уравнение: найти x

Пусть дано **2x + 5 = 17**. В Desmos введите на отдельных строках **y = 2x + 5** и **y = 17**. Графики пересекутся в точке **(6, 17)**. Если задача спрашивает значение x, ответ — **6**.

Ловушка здесь не в вычислении: у точки есть две координаты. Число 17 показывает значение y на пересечении, но решением исходного уравнения является x.

## 2. Решить систему и выбрать нужную координату

Рассмотрим систему **y = 2x + 1** и **y = −x + 7**. Введите обе прямые отдельными строками. Точка пересечения — **(2, 5)**. Если в вопросе нужно найти y, ответ — 5; если x — ответ 2.

Для проверки подставьте координаты: при x = 2 обе формулы дают y = 5. Если графики не пересекаются в видимой области или вы не можете уверенно прочитать точку, проверьте ввод и масштаб, а не угадывайте ответ по рисунку.

## 3. Найти корни квадратного уравнения

Для **x² − 5x + 6 = 0** задайте **f(x) = x² − 5x + 6** и **y = 0**. Корни — места, где график пересекает ось x: **x = 2** и **x = 3**.

![График функции x² − 5x + 6: парабола пересекает ось x в точках с координатами 2 и 3.](/blog/desmos-sat-roots.svg)
Ось x — это линия y = 0. Поэтому в этом примере нужно прочитать x координаты точек пересечения, а не значения y на кривой. Проверка разложением: **(x − 2)(x − 3) = 0**.

## 4. Найти вершину параболы

Пусть **f(x) = x² − 6x + 5**. Постройте функцию и выберите отмеченную Desmos вершину: **(3, −4)**. Если спрашивают координату x точки минимума — это 3; если минимальное значение функции — −4.

Результат можно проверить преобразованием: **x² − 6x + 5 = (x − 3)² − 4**. Так видно, почему вершина находится при x = 3, а минимальное y равно −4. На тесте слова “minimum value” и “x-coordinate of the minimum” требуют разных ответов.

## 5. Вычислить значение функции

Для **f(x) = 3x − 4** нужно найти **f(5)**. Введите **f(x) = 3x − 4**, затем на новой строке **f(5)**. Desmos покажет 11.

Здесь прямой подсчёт **3 × 5 − 4 = 11** тоже занимает всего один шаг. Если вы сразу уверены в подстановке, считать вручную может быть проще: график полезен тогда, когда он уменьшает риск ошибки или помогает увидеть зависимость.

# Когда выбрать график, а когда решить вручную

Используйте Desmos, если изображение или координата проясняют структуру задачи: например, сравнить две функции, найти точки пересечения или увидеть, где парабола достигает минимума. Решайте вручную, если вычисление короткое, график добавит лишний ввод или вопрос требует точного символического ответа, которого нельзя надёжно считать с графика.

| Быстрый вопрос к себе | Что делать |
| --- | --- |
| Сколько действий нужно для устного или ручного решения? | Если мало и путь понятен — решите напрямую. |
| Ответ связан с пересечением, корнем или вершиной? | Постройте только нужные функции и прочитайте координату. |
| В условии просят точную форму выражения? | Не заменяйте точную алгебру приблизительным значением с графика. |
| Я знаю, что именно нужно прочитать? | Если нет, перечитайте вопрос до ввода выражений. |

# Частые ошибки при работе с Desmos

- **Взять не ту координату.** У точки (x, y) проверьте, спрашивает ли задание x, y или обе величины.
- **Пропустить знак минус или скобки.** Сверьте запись в калькуляторе с исходным уравнением, особенно если минус относится ко всему выражению.
- **Считать значение на глаз.** Нажмите или наведите указатель на точку интереса, чтобы увидеть её координаты. Для чтения точек интереса в графическом калькуляторе см. [официальное руководство Desmos](https://help.desmos.com/hc/en-us/articles/4406040715149-Getting-Started-Desmos-Graphing-Calculator).
- **Не заметить масштаб окна.** Если нужный график или пересечение вне видимой области, отрегулируйте масштаб и проверьте оси.
- **Строить лишнее.** Ввод каждой части условия требует времени. Сначала определите, решает ли график конкретную задачу.
- **Использовать калькулятор вне разрешённой секции.** На SAT калькулятор доступен в Math, но не в Reading and Writing; следуйте экранным правилам Bluebook и указаниям проктора.

Если к сдаче вы готовите собственный калькулятор, отдельно проверьте актуальные ограничения College Board: графические и научные модели допускаются при соблюдении правил, а устройства с CAS-функциями для SAT запрещены. Встроенного Desmos достаточно, поэтому приносить отдельный калькулятор необязательно.

# Как потренироваться до экзамена

- Откройте Math section в Bluebook test preview или полном пробном тесте.
- На каждой задаче сначала отметьте, что требуется найти: x, y, значение функции, пересечение или экстремум.
- После решения коротко сравните графический и ручной способы: какой из них дал проверяемый ответ с меньшим количеством лишних действий?

Цель тренировки — не применять Desmos чаще, а научиться быстро распознавать задачи, где график полезен. В описании [изменений Bluebook для осени 2026 года](https://bluebook.collegeboard.org/test-admin/new-updated-features) College Board также указывает возможность менять размер встроенного калькулятора. Интерфейс может зависеть от версии приложения и устройства, поэтому проверьте его в своём test preview перед экзаменом.

# Частые вопросы

## Можно ли пользоваться Desmos на SAT?

Да. Встроенный Desmos доступен в Bluebook во время секции Math. Reading and Writing выполняется без калькулятора; актуальные детали и допустимые модели указаны в [политике College Board](https://satsuite.collegeboard.org/in-school-assessments/calculator-policy).

## Обязательно ли решать SAT Math через Desmos?

Нет. College Board разрешает калькулятор, но не требует использовать его, и отмечает, что некоторые задачи быстрее решать без калькулятора. Выбирайте метод по условию и собственной точности.

## Что вводить в Desmos, чтобы найти корни уравнения?

Постройте левую часть как функцию и сравните её с **y = 0**. Значения x в точках пересечения функции с осью x являются корнями. Перед ответом проверьте, что вопрос просит все корни, а не только положительный или отрицательный.

## Нужно ли тренироваться в Bluebook, если я уже умею пользоваться сайтом Desmos?

Да, полезно попробовать тестовый интерфейс Bluebook: там встроенный калькулятор работает рядом с вопросом и другими инструментами теста. College Board рекомендует test preview или пробный тест для знакомства с интерфейсом.

# Официальные источники

- [Политика College Board по калькуляторам SAT Suite](https://satsuite.collegeboard.org/in-school-assessments/calculator-policy)
- [Инструменты Bluebook для теста](https://bluebook.collegeboard.org/students/tools)
- [Как открыть инструменты и материалы в Bluebook](https://bluebook.collegeboard.org/students/accommodations-assistive-technology/accessing-bluebook-features-content)
- [Изменения Bluebook для осени 2026 года](https://bluebook.collegeboard.org/test-admin/new-updated-features)
- [Основы графического калькулятора Desmos](https://help.desmos.com/hc/en-us/articles/4406040715149-Getting-Started-Desmos-Graphing-Calculator)

# Следующий шаг в подготовке

Если вы готовитесь к SAT в Казахстане и хотите понять, с каких тем начать, пройдите [предварительную SAT-диагностику ASHYQ](/?start=sat). Она помогает выбрать направление подготовки, но не является официальным результатом SAT. Описание формата занятий есть на странице [подготовки к SAT в ASHYQ](/courses/sat). ASHYQ — образовательный бренд Казахстана с онлайн-подготовкой к IELTS и Digital SAT.`
  },
];
