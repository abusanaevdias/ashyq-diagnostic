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

Если вы готовитесь к SAT в Казахстане и хотите понять, с каких тем начать, пройдите [предварительную SAT-диагностику ASHYQ](/?start=sat). Она помогает выбрать направление подготовки, но не является официальным результатом SAT. Описание формата занятий есть на странице [подготовки к SAT в ASHYQ](/courses/sat). Перед выбором экзаменационной даты посмотрите также [актуальные даты SAT и дедлайны регистрации в Казахстане](/blog/sat-kazakhstan-dates-price). ASHYQ — образовательный бренд Казахстана с онлайн-подготовкой к IELTS и Digital SAT.`
  },
  {
    slug: 'sat-math-study-plan',
    language: 'ru',
    category: 'sat',
    title: 'SAT Math: как составить план практики после пробника',
    seoTitle: 'SAT Math: план подготовки после пробного теста Bluebook',
    metaDescription: 'Разберите результат SAT Math: выберите домен, определите причины ошибок, найдите задания в Student Question Bank и спланируйте практику по шагам.',
    excerpt: 'Пошаговая схема после Bluebook: как читать результат SAT Math, классифицировать ошибки, выбрать адресную практику и понять, когда проходить следующий полный тест.',
    photo: '/blog/sat-math-practice-cover.svg',
    coverAlt: 'Четыре шага подготовки SAT Math после пробника: выбрать домен, найти причину ошибки, подобрать практику и проверить объяснение.',
    publishedAt: '2026-09-25T07:38:00.000Z',
    updatedAt: '2026-09-25T07:38:00.000Z',
    body: `Если вы уже прошли пробный SAT Math, не спешите сразу решать ещё один полный тест. Сначала откройте результат в My Practice, посмотрите на домены, которые стоит повторить, и разберите соответствующие вопросы, чтобы определить конкретный навык и причину ошибки. Так каждое следующее занятие отвечает на конкретный вопрос: что я должен научиться делать лучше?

В [официальном формате Digital SAT от College Board](https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview) секция Math содержит 44 вопроса и длится 70 минут. Для плана подготовки важен не только общий балл: [College Board рекомендует использовать результаты пробника, чтобы выбрать области для повторения и целевые упражнения](https://satsuite.collegeboard.org/practice/build-your-study-plan).

![Четыре шага практики SAT Math после пробника: выбрать домен для разбора, определить навык и причину ошибки, подобрать целевые задания и проверить объяснение.](/blog/sat-math-study-cycle.svg)
Схема помогает пройти путь от результата Bluebook к следующему целевому упражнению.

# Что делать после пробного SAT Math

Полный тест в [Bluebook](https://satsuite.collegeboard.org/practice/practice-tests/bluebook) даёт отправную точку: после завершения можно открыть результат в My Practice, посмотреть ответы, проанализировать выполнение и перейти к целевой практике. Если пробник уже есть, используйте его как основу плана; если его ещё нет, сначала пройдите официальную тренировку в Bluebook.

1. **Выберите направление для разбора.** Посмотрите на отчёт по содержательным областям, затем изучите ответы на сами вопросы, чтобы определить конкретный навык для повторения.
2. **Запишите причину каждой ошибки.** Например: не вспомнил правило, неверно понял условие, ошибся в алгебраическом шаге или торопился.
3. **Выберите задания по нужному навыку.** Сначала проверьте, предлагает ли My Practice подборку Get Tailored Practice по результатам теста. Если хотите выбрать навык вручную, в [Student Question Bank](https://satsuite.collegeboard.org/practice/student-question-bank) можно отфильтровать официальные вопросы по тесту, домену, навыку и сложности.
4. **Решите новый набор и объясните ход решения.** Проверяйте не только ответ, но и то, можете ли повторить правильный способ без подсказки.
5. **Запланируйте повторную проверку.** Вернитесь к этим навыкам на новом задании, а следующий полный тест используйте для проверки плана целиком.

Эти шаги основаны на официальном цикле College Board: пробный тест, анализ результата, адресная практика и повторная проверка. Количество занятий и размер тематического набора ниже — практическая модель для планирования, а не обязательное правило экзамена.

# Как читать разделы SAT Math в отчёте

В SAT Math есть четыре домена. Запомните их английские названия: так легче найти нужный фильтр в официальном банке вопросов.

- **Algebra (алгебра):** линейные уравнения, неравенства, системы и функции.
- **Advanced Math (продвинутая математика):** нелинейные уравнения и функции, квадратичные выражения и преобразование выражений.
- **Problem-Solving and Data Analysis (решение задач и анализ данных):** отношения и пропорции, проценты, графики и таблицы, статистика и вероятность.
- **Geometry and Trigonometry (геометрия и тригонометрия):** площади и объёмы, треугольники, окружности и прямоугольная тригонометрия.

В секции 44 вопроса на 70 минут. College Board указывает ориентировочно 13–15 вопросов по Algebra, столько же по Advanced Math и по 5–7 по каждому из двух остальных доменов. Это описание состава секции, а не готовая формула приоритета: выбирайте тему для занятий по собственным ответам и цели, а не только по числу вопросов в таблице.

Если вы видите в отчёте название навыка, сначала найдите его описание на странице [официального Student Question Bank по Math](https://satsuite.collegeboard.org/practice/student-question-bank/math). Названия доменов и навыков помогут сформулировать, что именно повторить.

# Как понять, почему ответ оказался неверным

Отметка «ошибка» не объясняет, что учить. Для каждой задачи добавьте одну короткую причину — так вы не потратите время на повтор темы, которую уже знаете.

- **Пробел в знании темы.** Правило не вспоминается или математическая идея остаётся непонятной после перечитывания условия. Повторите правило и разберите один пример, затем решите несколько вопросов этого навыка без таймера.
- **Ошибка при переводе условия в модель.** Вы понимаете вычисления, но составили неправильное уравнение или выбрали не ту величину. Подчеркните, что дано и что нужно найти; назовите неизвестные и составьте модель до вычислений.
- **Ошибка в решении.** Уравнение выбрано верно, но потерян знак или допущена ошибка при преобразовании либо подстановке. Решите похожее задание аккуратно по шагам, затем проверьте результат подстановкой.
- **Пропуск или спешка.** Вы не заметили ограничение, единицы измерения, отрицательный знак или не ответили на поставленный вопрос. Перед выбором ответа проверьте условие, единицы и формат; в следующем наборе сначала работайте точно, потом добавляйте таймер.

## Пример: от ошибки к следующему упражнению

**Тренировочный пример, созданный для этой статьи; это не официальный вопрос SAT.** Сервис доставки берёт фиксированную плату 8 условных единиц и ещё 3 единицы за каждый километр. Если расстояние равно x километрам, а общая стоимость — y, модель будет y = 3x + 8. Для 7 километров стоимость равна 29 единицам.

Если вы записали y = 8x + 3, проблема не в умножении: вы поменяли местами фиксированную плату и цену за километр. В журнале ошибок отметьте неверную модель линейной функции и найдите в Student Question Bank соответствующий навык Linear functions in one variable. Перерешайте исходный пример позже, чтобы убедиться, что теперь можете объяснить, почему 3 умножается на x, а 8 прибавляется один раз.

# Как выбрать целевые задания в Student Question Bank

После пробного теста College Board позволяет перейти к целевой практике из My Practice. Для самостоятельного набора откройте Student Question Bank и укажите SAT, Math, нужный домен, навык и подходящую сложность. В банке собраны официальные вопросы; для доступа требуется войти в My Practice.

Удобный рабочий порядок:

1. Начните с одного навыка, который повторяется в нескольких ошибках или мешает решить задачи других типов.
2. Сначала решите небольшой набор без просмотра ответов и объяснений. Размер набора выберите так, чтобы осталось время спокойно разобрать ошибки.
3. Проверьте ответы и прочитайте объяснение к каждому вопросу, где сомневались, даже если угадали правильно.
4. Запишите, какое правило или шаг нужно повторить, и решите новый вопрос того же навыка.
5. Когда стало получаться без подсказки, добавьте смешанный набор из двух-трёх навыков.

Если задача решается быстрее вручную, калькулятор не обязателен. Если график, пересечение или корень проще увидеть визуально, потренируйтесь использовать встроенный в Bluebook Desmos и обязательно сверяйте, какую именно величину спрашивает условие. Подробный разбор есть в статье ASHYQ [как пользоваться Desmos на Digital SAT](/blog/desmos-sat-guide); правила использования калькулятора описывает [College Board](https://satsuite.collegeboard.org/in-school-assessments/calculator-policy).

Если после разбора вопроса осталось непонятное правило, можно дополнить практику уроками и видео из [Official SAT Prep на Khan Academy](https://www.khanacademy.org/digital-sat). College Board рекомендует использовать этот ресурс для повторения направлений, которые стоит усилить по результатам пробного теста; затем вернитесь к новым заданиям Student Question Bank и проверьте, можете ли решить их самостоятельно.

# Пример цикла подготовки между пробниками

Это пример, а не универсальное расписание. Уменьшите объём, если времени мало, или добавьте занятия, если до экзамена далеко.

- **После полного теста:** разберите вопросы Math и выберите один-два навыка; результатом будет короткий список тем с причинами ошибок.
- **Первая практика:** повторите правило и решите адресные задания без таймера; проверьте, что можете объяснить каждый шаг.
- **Следующая практика:** решите новые вопросы тех же навыков, затем добавьте смешанные; попробуйте самостоятельно выбрать метод и проверить ответ.
- **Следующий полный тест:** выполните тест в Bluebook с таймером и сравните отчёт с предыдущим. Если расписание позволяет, [College Board рекомендует](https://satsuite.collegeboard.org/practice/build-your-study-plan) оставлять между полными пробниками не менее двух недель.

Сравнивайте не только общий результат, но и причины ошибок: стали ли они повторяться реже и можете ли вы объяснить решение на новом задании.

# Частые вопросы

## Где бесплатно практиковать SAT Math?

Начните с официальных полноформатных тренировочных тестов в Bluebook и Student Question Bank от College Board. После теста можно изучить результат и подобрать упражнения по домену и навыку. Для повторения правил College Board также предлагает Official SAT Prep на Khan Academy. Вопросы Question Bank доступны через аккаунт My Practice.

## Что решать, если не знаю, с какой темы начать?

Пройдите полный тренировочный тест в Bluebook и используйте отчёт по содержательным областям вместе с разбором конкретных ошибок. Если тест уже пройден, не повторяйте его сразу: сначала выберите навык и потренируйте именно его.

## Нужно ли использовать Desmos в каждом задании SAT Math?

Нет. College Board разрешает калькулятор в секции Math, но отмечает, что некоторые задачи проще решить без него. Выбирайте инструмент после того, как поняли условие; Desmos полезен для графиков и проверки, если это действительно ускоряет решение.

# Источники и дальнейшее чтение

- [College Board: формат секции SAT Math](https://satsuite.collegeboard.org/sat/whats-on-the-test/math/overview)
- [College Board: полноформатные пробные тесты Bluebook](https://satsuite.collegeboard.org/practice/practice-tests/bluebook)
- [College Board: как пользоваться Student Question Bank](https://satsuite.collegeboard.org/practice/student-question-bank)
- [College Board: разбор результата в My Practice](https://satsuite.collegeboard.org/practice/my-practice-101)
- [College Board: план подготовки к SAT](https://satsuite.collegeboard.org/practice/build-your-study-plan)
- [College Board: политика калькуляторов](https://satsuite.collegeboard.org/in-school-assessments/calculator-policy)

Чтобы продолжить разбор, посмотрите [урок ASHYQ о распределении времени в SAT Math](/courses/sat/lessons/math-time) и [онлайн-курс Digital SAT](/courses/sat). Если вы ещё не проходили диагностику, [предварительная SAT-диагностика ASHYQ](/?start=sat) даст ориентир, с каких навыков начать; это не официальный балл SAT. А для планирования сдачи откройте [даты и дедлайны SAT в Казахстане](/blog/sat-kazakhstan-dates-price). ASHYQ — образовательный бренд Казахстана с онлайн-подготовкой к IELTS и Digital SAT.`
  },
  {
    slug: 'ielts-speaking-part-2-guide',
    language: 'en',
    category: 'ielts',
    title: 'IELTS Speaking Part 2: Plan a Clear 1–2 Minute Answer',
    seoTitle: 'IELTS Speaking Part 2: Plan a Clear 1–2 Minute Answer',
    metaDescription: 'Learn IELTS Speaking Part 2 timing, plan notes in one minute, and practise with an original Kazakhstan example linked to official IELTS criteria.',
    excerpt: 'A practical IELTS Speaking Part 2 method: understand the timing, make useful one-minute notes, develop a coherent answer and review it against official criteria.',
    photo: '/blog/ielts-speaking-part-2-plan.svg',
    coverAlt: 'IELTS Speaking Part 2 timing: one minute to prepare and up to two minutes to speak from short personal notes.',
    publishedAt: '2026-09-25T12:00:00.000Z',
    updatedAt: '2026-09-25T12:00:00.000Z',
    body: `In IELTS Speaking Part 2, you get one minute to prepare and then speak about a topic for up to two minutes. Use the cue card to choose a clear story or description, jot down short prompts in its order, and develop those prompts in your own words. You do not need to memorize a model answer or force yourself to speak for exactly two minutes. [IELTS's official Speaking format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking) explains the timing and task.

This guide focuses on IELTS Speaking Part 2. The examples below are original practice material, not official IELTS cards or ASHYQ student answers. The local example uses verified facts about the Mausoleum of Khoja Ahmed Yasawi in Turkistan, Kazakhstan.

# What happens in IELTS Speaking Part 2?

The examiner gives you a topic card, paper and pencil. You have one minute to prepare, then you speak for one to two minutes. The examiner stops you when the time is up and may ask one or two brief questions before Part 3. IELTS describes Part 2 as a three-to-four-minute section, including preparation.

You are assessed across the Speaking test, not given a separate official band for this one card. IELTS uses four equally weighted criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. The criteria describe qualities of your speaking; they are not a checklist of impressive words or accents to imitate. See the [official IELTS Speaking assessment criteria](https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf).

# Use the one-minute preparation time well

Do not try to write a script. A few words are easier to scan while speaking and leave you room to phrase the answer naturally. Practise this four-part routine; the seconds are a flexible practice aid, not an IELTS rule.

![IELTS Speaking Part 2 timing: one minute to prepare with short notes and up to two minutes to speak.](/blog/ielts-speaking-part-2-plan.svg)
This is one practice routine. Follow the task card in front of you and adjust the notes to its topic.

## 1. Choose one central idea

Read the whole card once. Choose one person, place, event, object or experience that you can describe with specific details. A familiar example is usually easier to develop than an ambitious topic you know very little about.

## 2. Note the cue-card points in order

Write one or two key words beside each point. If the card asks where and when, note a place and a time. If it asks what happened, add the main event. Keep the order visible: it gives you a simple route through the answer.

## 3. Add details that help you continue

Write a name, small observation, reason or reaction that you can explain. A useful note should trigger a sentence, not contain the sentence itself. For example, “turquoise dome — courtyard — family visit” is more practical than drafting a complete paragraph.

## 4. Decide how to close

Choose a final thought that answers the card's last prompt or explains why the topic matters to you. This gives the talk a natural ending and helps you avoid repeating the introduction when you run out of ideas.

# Practice card: a historic place in Kazakhstan

The following is an original practice prompt, not an official IELTS question:

**Describe a historic place in your country that you find interesting.**

- Where it is
- How you learned about it or visited it
- What a visitor might see there
- Explain why it interests you

For a concrete example, this guide uses the Mausoleum of Khoja Ahmed Yasawi in Turkistan. UNESCO identifies the mausoleum as being in southern Kazakhstan, associates it with the 12th-century Sufi master Yasawi, and records that construction was commissioned by Timur in 1389 and remained unfinished when work stopped in 1405. Check these details in the [UNESCO World Heritage record](https://whc.unesco.org/en/list/1103).

![Example IELTS Speaking Part 2 notes about a place in Kazakhstan: where it is, a visit, a detail to describe and why it matters.](/blog/ielts-speaking-part-2-notes.svg)
These are example prompts, not a script. Replace the visit and reaction with details you can describe honestly.

| Cue-card point | Brief note |
| --- | --- |
| Where it is | Turkistan, southern Kazakhstan |
| How I know it | A family visit |
| What I remember | The scale and decorated surfaces |
| Why it matters to me | A historic place in my country |

## Sample answer

This is an invented practice model, not a real student's story. Replace its visit, memories and opinions with your own experience.

“I’d like to describe the Mausoleum of Khoja Ahmed Yasawi, which is in Turkistan in southern Kazakhstan. I first heard about it at school, and later I visited it with my family. What I remember most is the scale of the building and the decorated surfaces around the courtyard. Walking through the complex made the history feel more tangible than it had in a textbook.

I was also interested in the story behind the construction. The UNESCO World Heritage record says that work began in 1389 on Timur's order and stopped in 1405, so the mausoleum was never completed. That detail surprised me because the building still feels like a complete place to visit, even though its history was interrupted.

It is memorable to me because it connects a historic figure and an architectural landmark with a city I can visit in my own country. I would like to return and learn more about the details I probably missed the first time.”

The response moves from location, to visit, to observations, to a historical detail, and finally to a personal reason. That sequence follows the practice card without sounding like four disconnected answers. Do not reuse the sample's first-person details if they are not yours.

# Review the answer using the four IELTS criteria

After practising, listen to a recording once for meaning and once for language. The four questions below translate the official assessment criteria into a learner's review. They cannot predict your band score.

| IELTS criterion | A useful review question |
| --- | --- |
| Fluency and Coherence | Did I keep a clear line of thought, connect details logically and recover when I paused? |
| Lexical Resource | Did I use words that fit the topic and explain ideas when I could not recall a word? |
| Grammatical Range and Accuracy | Did I vary sentence structures while keeping the meaning clear and accurate? |
| Pronunciation | Were my words understandable, with stress and intonation that helped the listener follow the meaning? |

The [official IELTS band descriptors](https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf) explain the criteria in detail. The examiner considers performance across the Speaking test. A single practice recording or a polished Part 2 answer cannot establish an official IELTS band.

# Common Part 2 mistakes to avoid

- **Writing full sentences during the minute.** There is too little time, and reading a script can make the talk sound less spontaneous. Keep short prompts.
- **Treating every cue as a separate mini-answer.** Connect the points into one account with a beginning, development and ending.
- **Using memorized sample answers word for word.** The card may ask about a different angle, and prepared wording can stop fitting the question. IELTS advises candidates to respond naturally and draw on their own experiences; see [IELTS guidance on memorized Speaking answers](https://ielts.org/news-and-insights/dont-overdo-it-how-to-ace-your-ielts-speaking-test).
- **Adding details you cannot explain.** A specific detail helps only when you can talk about it clearly and respond if the examiner asks a follow-up.
- **Chasing difficult vocabulary.** Clear, accurate language that expresses the point is more useful than a rare word used incorrectly.
- **Assuming that a pause ruins the answer.** A brief pause to think is normal. Practise extending a point with a reason, an example or a reaction instead of repeating the same sentence.

# A short practice routine

- **1. Choose:** an original cue-card topic and set a one-minute timer.
- **2. Note:** short prompts, following the card's order.
- **3. Record:** one answer and develop the topic naturally for one to two minutes.
- **4. Review:** listen back and note one strength and one change under the four criteria.
- **5. Repeat:** use different notes instead of memorizing the recording.

IELTS recommends practising with cue-card prompts and organizing notes in the order of the points. Its overview of the test also explains how the examiner uses follow-up questions. Read [IELTS's guide to the Speaking test](https://ielts.org/news-and-insights/demystifying-the-ielts-speaking-test) for further preparation advice.

# Questions candidates ask about Part 2

## Do I have to speak for exactly two minutes?

No. You speak for one to two minutes, and the examiner stops you when the time is up. Develop your answer clearly; do not add repetition just to reach the upper limit.

## Can I take notes during the preparation minute?

Yes. The examiner provides paper and a pencil for the one-minute preparation period. Use brief prompts that help you remember the order and details of your talk, rather than writing a script.

## Should I answer every point on the cue card?

Use the points to understand and organize the task. Build a connected answer around the topic and include relevant details for the prompts. If you are short on time, continue the central description instead of rushing through unrelated memorized lines.

## Can I use a personal story that is not true?

IELTS does not publish a separate truthfulness score for the story. The assessment concerns your spoken English, and the official guidance recommends natural answers based on your own experience. A familiar experience is easier to extend and discuss if the examiner asks a follow-up.

# Continue your IELTS preparation

ASHYQ is a Kazakhstan-based education brand offering online IELTS and Digital SAT preparation. Its IELTS course includes speaking practice and feedback. If you want to see how the wider preparation plan works, explore the [ASHYQ IELTS course format and next steps](/courses/ielts).

# Sources

- [IELTS Academic Speaking test format](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking)
- [IELTS Speaking key assessment criteria](https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf)
- [IELTS: Demystifying the Speaking test](https://ielts.org/news-and-insights/demystifying-the-ielts-speaking-test)
- [IELTS: Guidance on memorized Speaking answers](https://ielts.org/news-and-insights/dont-overdo-it-how-to-ace-your-ielts-speaking-test)
- [UNESCO World Heritage record: Mausoleum of Khoja Ahmed Yasawi](https://whc.unesco.org/en/list/1103)`
  },
  {
    slug: 'ielts-speaking-part-1-answers',
    language: 'ru',
    category: 'ielts',
    title: 'IELTS Speaking Part 1: как отвечать на вопросы',
    seoTitle: 'IELTS Speaking Part 1: как отвечать без заучивания',
    metaDescription: 'Формат IELTS Speaking Part 1, примеры ответов для школьников и абитуриентов Казахстана, техника короткого естественного ответа и советы по подготовке.',
    excerpt: 'Разбираем формат Part 1, показываем на примерах, как расширить короткий ответ одной уместной деталью, и объясняем, почему не стоит заучивать готовый текст.',
    photo: '/blog/ielts-speaking-part-1-cover.svg',
    coverAlt: 'IELTS Speaking Part 1: ответьте прямо, добавьте одну полезную деталь и закончите мысль.',
    publishedAt: '2026-09-25T18:00:00.000Z',
    updatedAt: '2026-09-25T18:00:00.000Z',
    body: `IELTS Speaking Part 1 длится 4–5 минут: экзаменатор задаёт вопросы о знакомых темах — например, об учёбе, доме, семье или интересах. На вопрос обычно удобно ответить прямо, а затем добавить одну конкретную причину или деталь. Это практика для связной речи, а не официальная формула IELTS. [Официальное описание Speaking test](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking) объясняет формат и критерии.

Ниже — примеры для школьников и абитуриентов в Казахстане: как не ограничиться одним словом, не уходить в длинную историю и не учить ответы как сценарий. Примеры придуманы для тренировки; это не ответы учеников ASHYQ и не список вопросов, которые гарантированно попадутся на экзамене.

# Что происходит в IELTS Speaking Part 1

В начале устной части экзаменатор представляется и проверяет вашу личность, затем задаёт вопросы на знакомые темы: дом, семья, работа, учёба или интересы. Part 1 занимает 4–5 минут. В этой части важно уметь говорить о повседневных темах, сообщать информацию и выражать мнение. Весь Speaking test длится 11–14 минут и состоит из трёх частей.

Speaking проводится одинаково в IELTS Academic и IELTS General Training. Отличаются другие секции теста, но не эта устная часть; это прямо указано в [официальных материалах IELTS для Academic и General Training](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test).

# Как отвечать: мысль, одна деталь, точка

Попробуйте такую опору для тренировки:

- **1. Ответьте на сам вопрос.** Сначала скажите, что именно думаете, выбираете или делаете.
- **2. Добавьте одну уместную деталь.** Коротко объясните причину, приведите пример или уточните, когда это происходит.
- **3. Остановитесь, если мысль закончена.** Не нужно растягивать ответ повтором или заготовленной историей.

![Как построить ответ в IELTS Speaking Part 1: сначала прямой ответ, затем одна уместная деталь и завершение мысли.](/blog/ielts-speaking-part-1-answer.svg)
Эта схема — удобный способ потренироваться. Официальные критерии IELTS не требуют такого числа предложений или именно этой последовательности.

В официальном описании формата указана длительность Part 1, но нет требования отвечать на каждый вопрос определённым числом предложений. Поэтому «мысль + деталь» — не таймер и не способ гарантировать высокий балл, а простая проверка: вы ответили по теме и дали слушателю достаточно информации, чтобы понять вашу мысль.

## Если вопрос предполагает «да» или «нет»

Скажите «да», «нет» или оговорку, затем коротко поясните.

**Вопрос:** “Do you enjoy studying in the morning?”

**Вариант для практики:** Usually, yes. I can focus better before the day gets busy, so I try to review difficult subjects then.

Ответ сразу раскрывает позицию, а продолжение объясняет причину. Это вымышленный пример: расскажите о своём режиме, а не повторяйте его как готовый скрипт.

## Если спрашивают «что», «где» или «почему»

Начните с нужной информации, затем добавьте конкретику.

**Вопрос:** “What are you studying at the moment?”

**Вариант для практики:** I’m in my final year at school, so I’m studying several subjects before applying to university. I enjoy biology most because practical tasks help me connect new ideas to real examples.

Если вы сейчас не подаёте документы в университет или не изучаете биологию, замените эти детали на свои. Важно не выдумать «идеальную» биографию, а спокойно говорить о знакомом опыте.

## Если нужно выбрать один вариант

Назовите выбор и объясните его. Дополнительное сравнение нужно только тогда, когда оно действительно помогает ответу.

**Вопрос:** “Do you prefer studying alone or with other people?”

**Вариант для практики:** I usually study alone when I need to concentrate. Before a test, though, I sometimes review topics with a friend because explaining an idea helps me notice what I have missed.

Такой ответ показывает предпочтение и добавляет понятную ситуацию. Не нужно перечислять все плюсы и минусы обоих вариантов, если экзаменатор об этом не спрашивал.

# Что звучит слишком коротко, а что — по делу

Если на вопрос “What do you do after school?” ответить только “Homework,” собеседник знает лишь одно слово. Можно дать завершённую мысль: “I usually do my homework first, then I take a short walk. It helps me clear my head after classes.” В этой вымышленной практике есть прямой ответ и одна деталь.

Дальше добавлять ещё несколько несвязанных занятий необязательно. Длиннее не означает лучше: если фраза повторяет уже сказанное или уводит от вопроса, вернитесь к его теме и завершите ответ.

Чтобы подготовиться к поступлению в Казахстане, потренируйте темы, которые относятся именно к вашей жизни: учёба, планы после школы, ежедневный маршрут или занятия в свободное время. Если говорите о своём городе, выберите один настоящий факт — например, место, куда вы сами часто ходите. Не заучивайте чужое описание Астаны, Алматы или другого города, если оно не соответствует вашему опыту.

# Как Part 1 влияет на оценку Speaking

Отдельный официальный балл только за Part 1 не выставляется. Экзаменатор оценивает Speaking test в целом по четырём критериям: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation. Все критерии имеют одинаковый вес; подробности есть в [официальном описании подсчёта баллов IELTS](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail) и [дескрипторах Speaking](https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf).

При самостоятельной практике прослушайте запись и задайте себе по одному вопросу:

- **Fluency and Coherence:** понятно ли, как связаны мои ответ и пояснение?
- **Lexical Resource:** употребил ли я точные слова; смог ли объяснить мысль, если забыл слово?
- **Grammatical Range and Accuracy:** есть ли в записи разные конструкции, и остаются ли они понятными?
- **Pronunciation:** легко ли понять мои слова и помогают ли ударение и интонация уловить смысл?

Это вопросы для самоанализа, а не способ самостоятельно определить свой балл. Speaking оценивают по всем четырём критериям и на протяжении всего теста.

# Заучивать готовые ответы или готовить идеи?

Готовьте темы и реальные детали о себе, но не учите целые ответы слово в слово. Официальные советы IELTS предостерегают от чрезмерной репетиции: заранее заготовленный текст может перестать подходить к вопросу и звучать неестественно. [Рекомендации IELTS по подготовке к Speaking](https://ielts.org/news-and-insights/dont-overdo-it-how-to-ace-your-ielts-speaking-test) советуют опираться на собственный опыт и говорить естественно.

Для каждой темы запишите несколько опорных слов: например, по теме studies — предмет, любимая часть урока и причина; по теме free time — занятие и когда вы им занимаетесь. Потом ответьте на вопрос разными словами. Так вы тренируете идею, а не пытаетесь вспомнить готовое предложение.

# Короткая самостоятельная практика

- **Шаг 1. Выберите** три тренировочных вопроса: “What are you studying?”, “What do you like about your hometown?”, “What do you usually do in your free time?”
- **Шаг 2. Ответьте** без чтения образца. Сначала сформулируйте прямой ответ, затем решите, нужна ли к нему одна деталь.
- **Шаг 3. Запишите** ответы на телефон и прослушайте один раз на смысл, второй — на речь.
- **Шаг 4. Отметьте** одну удачную деталь и одну вещь для улучшения по официальным критериям.
- **Шаг 5. Повторите** вопросы, меняя слова и примеры, а не воспроизводя один и тот же сценарий.

Это оригинальные вопросы для практики, а не реальные или гарантированные задания IELTS. Для длинного ответа с минутой подготовки посмотрите отдельный разбор [IELTS Speaking Part 2](/blog/ielts-speaking-part-2-guide).

Когда будете готовиться ко всем четырём секциям, посмотрите [сравнение пробных IELTS-тестов и их условий](/blog/ielts-mock-test-kazakhstan), чтобы выбрать формат под свою цель.

# Короткие ответы на частые вопросы

## Сколько длится IELTS Speaking Part 1?

Part 1 длится 4–5 минут. В этой части экзаменатор задаёт общие вопросы о знакомых темах; весь Speaking test занимает 11–14 минут.

## Нужно ли отвечать ровно двумя предложениями?

Нет официального требования к фиксированному числу предложений на каждый вопрос. В тренировке ответьте прямо и добавьте одну релевантную деталь, если она помогает раскрыть мысль.

## Будет ли отдельный балл за Part 1?

Нет. Speaking оценивают по четырём критериям на протяжении всего теста; отдельный официальный балл за Part 1 не предусмотрен.

## Эти примеры — вопросы, которые попадутся в Казахстане?

Нет. Это написанные для практики примеры, а не официальный список экзаменационных вопросов и не прогноз заданий.

## Можно ли подготовить готовый ответ о школе или родном городе?

Подготовьте идеи и точные слова для знакомых тем, но рассказывайте о собственном опыте и меняйте ответ под формулировку вопроса. Не учите целый сценарий.

# Где получить обратную связь по Speaking

Если вы готовитесь к IELTS для поступления, обратная связь помогает заметить привычки, которые сложно услышать самому: длинные паузы, повторения или неясные окончания. ASHYQ — образовательный бренд Казахстана с онлайн-подготовкой к IELTS и Digital SAT. Узнайте, как устроен [онлайн-курс IELTS ASHYQ и практика по четырём секциям](/courses/ielts).

# Источники

- [IELTS Academic: формат Speaking test](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking)
- [Официальные материалы IELTS General Training: Speaking одинаков для Academic и General Training](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test)
- [IELTS: подсчёт результатов и критерии Speaking](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
- [IELTS Speaking Band Descriptors](https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf)
- [IELTS: советы для подготовки к Speaking без чрезмерной репетиции](https://ielts.org/news-and-insights/dont-overdo-it-how-to-ace-your-ielts-speaking-test)`
  },
  {
    slug: 'ielts-listening-band-score',
    language: 'ru',
    category: 'ielts',
    title: 'IELTS Listening: сколько правильных ответов нужно для Band 7.0',
    seoTitle: 'IELTS Listening: сколько правильных ответов на 7.0',
    metaDescription: 'Сколько правильных ответов дают IELTS Listening 7.0? Официальные средние ориентиры IELTS, пример 30/40 и объяснение, почему таблицы конвертации различаются.',
    excerpt: 'Что означает 30/40 в IELTS Listening, какие баллы IELTS публикует как средние ориентиры и почему точная граница зависит от версии теста.',
    photo: '/blog/ielts-listening-score-anchors.svg',
    coverAlt: '30 правильных ответов из 40 — опубликованный IELTS средний ориентир для Listening Band 7.0; точный порог зависит от версии теста.',
    publishedAt: '2026-09-25T06:42:00.000Z',
    updatedAt: '2026-09-25T06:42:00.000Z',
    body: `Если в пробном IELTS Listening вы ответили правильно на 30 вопросов из 40, официальный IELTS приводит 30 как средний ориентир для Band 7.0. Это не гарантированный порог для каждого теста: IELTS предупреждает, что точное число ответов немного меняется от версии к версии. [Официальная шкала IELTS](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail) прямо указывает и средние баллы, и эту оговорку.

# Что означает результат 30/40

В Listening 40 вопросов, за каждый правильный ответ дают один балл. Сумма правильных ответов из 40 переводится в секционный band score; результат сообщается целым или половинным баллом. Поэтому 30/40 — это raw score, а не band score по шкале IELTS от 0 до 9 и не итоговый Overall. Его можно сопоставить со средним ориентиром секции.

![Как читать IELTS Listening score: тренировочный результат из 40 вопросов даёт ориентир для секции, а общий балл рассчитывается по четырём секциям.](/blog/ielts-listening-score-path.svg)
Схема показывает путь от результата одного пробного раздела к примерной оценке Overall. Точный Listening band зависит от версии теста.

# Официальные средние ориентиры IELTS Listening

IELTS публикует следующие средние результаты из 40 для отдельных целых band scores:

| Правильные ответы из 40 | Средний ориентир Listening |
| --- | --- |
| 16 | Band 5.0 |
| 23 | Band 6.0 |
| 30 | Band 7.0 |
| 35 | Band 8.0 |

Эти значения приведены на официальной странице IELTS. Она не называет их жёсткими порогами и отдельно предупреждает, что точное количество ответов для того же band может немного отличаться между вариантами теста. Поэтому не стоит достраивать пропущенные строки таблицы как точные границы для Band 5.5, 6.5 или 7.5.

## Почему онлайн-таблицы показывают разные границы

Многие сайты превращают ориентиры в полную таблицу диапазонов: например, указывают, что конкретное число ответов всегда соответствует Band 6.5 или 7.5. Такая таблица может быть полезна для быстрой оценки тренировочного теста, но её точность зависит от источника и версии шкалы, которую использовал автор. Официальное правило IELTS осторожнее: оно даёт средние опорные значения и говорит, что нужное число ответов меняется от версии к версии.

Чтобы оценить пробник, сначала сверьте ответы с ключом именно этого теста, затем сравните сумму правильных ответов с официальными средними ориентирами. Если результат находится между двумя строками, считайте это приблизительным диапазоном для планирования занятий, а не обещанием официального band score.

# Listening band и Overall IELTS — разные результаты

Listening — одна из четырёх секций IELTS. Overall считается как среднее секционных баллов Listening, Reading, Writing и Speaking, после чего округляется до ближайшей половины band. Формулу и примеры округления IELTS приводит на той же [официальной странице о баллах](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail).

Например, в условном пробнике оценки такие: Listening 7.0, Reading 6.5, Writing 5.5 и Speaking 6.0. Среднее равно 6.25, поэтому официальный результат округляется до 6.5. Это учебный пример, а не результат реального кандидата; если Listening оценён по сырому баллу, то и Overall остаётся примерным.

Сырой результат одного раздела и Overall отвечают на разные вопросы: первый оценивает Listening, второй объединяет четыре навыка.

Не переносите таблицу Listening на Reading. У Reading отдельные средние ориентиры, а Academic и General Training Reading различаются. [IELTS объясняет это отдельно в описании подсчёта результатов](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail).

# Как разобрать ошибки после пробного Listening

После проверки запишите не только число правильных ответов, но и причину каждого потерянного балла. Такая заметка поможет выбрать следующую тренировку точнее, чем повторное прохождение теста без разбора.

Если хотите проверить все четыре секции целиком, сначала сравните [форматы пробного IELTS в Казахстане](/blog/ielts-mock-test-kazakhstan): короткая практика, знакомство с компьютером и полный mock отвечают на разные вопросы.

- **Не заметили нужную деталь в аудио:** найдите вопрос и часть, где потеряли нить, затем повторите этот тип задания на новом аудио.
- **Услышали слово, но не узнали перефразирование:** сравните формулировки вопроса и записи; перед следующим прослушиванием подчеркните смысловые опоры.
- **Поняли ответ, но записали его неверно:** проверьте орфографию, окончание и ограничение по числу слов; затем сверьтесь с ключом.
- **Застряли на одном вопросе и пропустили следующий:** отметьте момент, когда переключили внимание на сомнение; на следующем пробнике возвращайтесь к текущему вопросу.

Это чек-лист для самостоятельного разбора, а не официальная шкала IELTS или статистика по ученикам ASHYQ. Для знакомства с форматом используйте [официальные пробные задания IELTS](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test) и проверяйте ответы по опубликованному ключу.

# Что важно абитуриентам в Казахстане

Если вы готовите IELTS для поступления, используйте таблицу только для анализа практики. Для заявки нужен официальный результат, а требуемый Overall или баллы отдельных секций проверяйте на актуальной странице выбранного университета и программы. Пробник и онлайн-калькулятор не заменяют Test Report Form.

Обратите внимание: Listening и Speaking одинаковы в Academic и General Training, а Reading и Writing в этих тестах различаются. Выбирайте формат IELTS и целевой балл по требованиям конкретной программы, а не только по совету из общей статьи. [IELTS описывает различия между типами теста](https://ielts.org/take-a-test/test-types).

# Короткие ответы

## 30 правильных ответов из 40 — это точно Band 7.0?

IELTS указывает 30/40 как средний ориентир для Listening Band 7.0, но точное число ответов для band меняется в зависимости от версии теста. В тренировке трактуйте результат как оценку, не как гарантированный экзаменационный балл.

## Одинаково ли оценивают Listening в Academic и General Training?

Да. Официальный IELTS сообщает, что секции Listening и Speaking одинаковы для Academic и General Training; различаются Reading и Writing.

## Как из Listening получается Overall?

Overall — среднее баллов Listening, Reading, Writing и Speaking с округлением до ближайшей половины band. Один сырой Listening score сам по себе не определяет общий результат.

## Есть ли официальная таблица для каждого результата от 0 до 40?

На официальной странице IELTS приведены средние ориентиры для Band 5, 6, 7 и 8. IELTS уточняет, что точные границы могут немного меняться между вариантами теста; полные фиксированные диапазоны на сторонних сайтах следует считать оценочными.

# Следующий шаг

Если Listening — не единственная секция, которую вы хотите подтянуть, посмотрите отдельные разборы [IELTS Writing Task 1](/blog/ielts-writing-task-1-guide), [IELTS Writing Task 2](/blog/ielts-writing-task-2) и [IELTS Speaking Part 2](/blog/ielts-speaking-part-2-guide).

Если хотите понять, с чего начать подготовку, пройдите [предварительную диагностику ASHYQ](/diagnostic): она даёт ориентир по Reading и Listening, но не является официальным результатом IELTS. ASHYQ — образовательный бренд Казахстана, который проводит онлайн-подготовку к IELTS; программа занятий описана на странице [курса IELTS](/courses/ielts).

# Источники

- [IELTS: подсчёт и интерпретация баллов](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
- [IELTS Academic: формат Listening](https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-listening)
- [IELTS: типы теста Academic и General Training](https://ielts.org/take-a-test/test-types)
- [Официальные пробные задания IELTS Academic](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test)`
  },
  {
    slug: 'ielts-mock-test-kazakhstan',
    language: 'ru',
    category: 'ielts',
    title: 'IELTS mock test в Казахстане: где пройти и что выбрать',
    seoTitle: 'IELTS mock test в Казахстане: где пройти и сколько стоит',
    metaDescription: 'Сравните бесплатные IELTS sample tests, ознакомительный тест British Council и полный mock от IDP в Казахстане. Условия, актуальные цены и выбор формата.',
    excerpt: 'Чем отличаются официальные sample tests, знакомство с компьютерным интерфейсом и полный IELTS mock в Казахстане: условия, цены и способ выбрать формат под свою цель.',
    photo: '/blog/ielts-mock-test-kazakhstan-cover.svg',
    coverAlt: 'Четыре варианта подготовки к IELTS: sample questions, знакомство с компьютерным интерфейсом, полный mock и короткая предварительная диагностика.',
    publishedAt: '2026-09-25T14:00:00.000Z',
    updatedAt: '2026-09-25T14:00:00.000Z',
    body: `Если вам нужен пробный IELTS в Казахстане, сначала уточните, что именно вы хотите проверить. Бесплатные sample questions помогают потренировать отдельные задания; ознакомительный тест показывает компьютерный интерфейс; полный mock проходит по всем четырём навыкам и может включать оценку с комментариями. Условия и цены ниже проверены 25 сентября 2026 года.

# Какой вариант выбрать

- **Потренировать типы заданий и проверить ответы** — бесплатные официальные IELTS sample questions.
- **Привыкнуть к экрану и навигации** — бесплатный ознакомительный тест British Council.
- **Пройти Listening, Reading, Writing и Speaking с таймингом** — полный Mock CD от IDP или предложение British Council, если вы подходите под условия кампании.
- **Получить короткий стартовый ориентир** — предварительная диагностика ASHYQ; это не mock и не официальный IELTS score.

Слово mock на странице провайдера само по себе не говорит, есть ли Speaking, проверка Writing, таймер или ориентировочный балл. Перед регистрацией проверьте эти четыре пункта и срок действия доступа.

![Схема выбора пробного IELTS: официальные задания, знакомство с компьютерным форматом, полный mock четырёх навыков или короткая предварительная диагностика.](/blog/ielts-mock-test-choice.svg)
Выбирайте тест по вопросу, на который хотите получить ответ: как устроены задания, удобно ли работать на компьютере или насколько ровно вы выполняете все четыре секции.

# Где пройти пробный IELTS в Казахстане

## Бесплатные задания на сайте IELTS

На [официальном сайте IELTS](https://ielts.org/take-a-test/preparation-resources/sample-test-questions) опубликованы бесплатные sample questions для Academic и General Training. IELTS указывает, что эти материалы помогают освоиться с форматом и типами заданий, проверить себя на время и сравнить ответы с образцами. Это удобный вариант, если нужно потренировать отдельный тип задания и самостоятельно разобрать ошибки.

Не путайте sample tasks с разделом Practice experience: последний показывает, как задания выглядят на компьютере, но не ограничен временем и не оценивается; ответы к нему не предоставляются. Поэтому такая практика помогает освоиться с экранным форматом, но не заменяет разбор ответов или полный mock. Перед тренировкой выберите правильный модуль: у Academic и General Training различаются Reading и Writing, а Listening и Speaking одинаковы. Сравнить типы можно на официальных страницах [IELTS Academic](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test) и [IELTS General Training](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test).

## British Council: знакомство с компьютером и отдельная кампания полного mock

У British Council в Казахстане есть два разных предложения. Бесплатный [ознакомительный компьютерный тест](https://kazakhstan.britishcouncil.org/ru/exam/ielts/prepare/computer-delivered-ielts-familiarisation-test) длится 2 часа 30 минут и охватывает Listening, Reading и Writing; доступны Academic и General Training. Он помогает увидеть компьютерный формат и не является полным тестом по четырём навыкам.

Отдельно British Council предлагает кампанию с бесплатным полным mock по Listening, Reading, Writing и Speaking. По условиям страницы, для участия нужно зарегистрироваться и оплатить IELTS в British Council на одну из доступных дат с 15 сентября по 20 октября 2026 года. После получения доступа тест нужно пройти в течение семи дней; каждый навык выполняется за один сеанс. British Council сообщает, что к mock прилагаются индивидуальные оценки и обратная связь, сформированная с помощью ИИ. Это условная акция к регистрации на официальный тест, а не бесплатный полный mock для любого посетителя. [Условия кампании British Council](https://kazakhstan.britishcouncil.org/ru/free-mock-test) проверьте ещё раз перед бронированием: сроки и доступность меняются.

## IDP IELTS Kazakhstan: полный онлайн Mock CD

На странице [IDP IELTS Kazakhstan](https://ielts.kz/ielts-mock-cd-registration/) описан онлайн Mock CD для Academic и General Training. В него входят Listening, Reading, Writing и Speaking; Speaking проходит отдельно по видеосвязи. Можно выбрать вариант только с баллами или вариант с экспертными комментариями.

На странице регистрации 25 сентября 2026 года были указаны такие цены: **45 000 ₸ без обратной связи и 50 000 ₸ с комментариями экспертов**. После покупки даётся 14 дней на прохождение, а время Speaking нужно согласовать отдельно. Перед оплатой проверьте текущую сумму, формат и правила переноса непосредственно у IDP: прайс и расписание могут измениться.

# Как понять результат пробного теста

**Балл mock-теста — ориентир для подготовки, а не официальный IELTS result.** Официальная шкала IELTS переводит количество правильных ответов в Listening и Reading в band, но точные границы могут немного отличаться между версиями теста. Поэтому фиксированную таблицу из стороннего сайта не стоит считать гарантированным преобразованием raw score в официальный балл. Подробнее — в [описании подсчёта результатов IELTS](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail).

Writing и Speaking нельзя надёжно оценить только количеством правильных ответов. IELTS описывает для Writing критерии выполнения задания, связности, словарного запаса и грамматики; для Speaking — беглость и связность речи, словарный запас, грамматику и произношение. Если mock выдаёт автоматический или общий балл, уточните, кто проверял письменную и устную части и что именно входит в обратную связь.

## Короткий разбор после mock

- Запишите Academic или General Training, формат теста, дату и баллы по каждой секции.
- Для Listening и Reading сначала сверьте ответы с ключом именно к этому тесту; только затем смотрите ориентир по band.
- Для каждой ошибки отметьте причину: не знали правило, не поняли формулировку, не успели, неверно записали ответ или потеряли внимание.
- Для Writing и Speaking используйте опубликованные критерии или комментарий проверяющего; один автоматический балл не объясняет, что исправлять.
- Сформулируйте следующий учебный шаг по самой слабой секции, а не проходите подряд много пробников без разбора.

Если вы отдельно разбираете Listening, посмотрите [как интерпретировать 30/40 и ориентиры Band 7.0](/blog/ielts-listening-band-score). Для Writing полезны разборы [IELTS Writing Task 2](/blog/ielts-writing-task-2) и [Academic Writing Task 1](/blog/ielts-writing-task-1-guide); для устной части — [пример ответа IELTS Speaking Part 1](/blog/ielts-speaking-part-1-answers).

# Короткие ответы

## Можно ли пройти mock IELTS бесплатно?

Да, но бесплатные варианты отличаются. IELTS публикует sample questions и компьютерную Practice experience; у British Council есть бесплатное знакомство с компьютерным форматом. Полный четырёхсекционный mock British Council на 25 сентября 2026 года доступен только участникам указанной кампании после регистрации и оплаты официального IELTS в заданный период.

## Сколько стоит IELTS mock test в Казахстане?

Страница IDP IELTS Kazakhstan на 25 сентября 2026 года указывала 45 000 ₸ за онлайн Mock CD без обратной связи и 50 000 ₸ с экспертными комментариями. Перед оплатой сверьте действующую цену и условия на [странице регистрации IDP](https://ielts.kz/ielts-mock-cd-registration/).

## Какой mock выбрать: Academic или General Training?

Выбирайте модуль под цель экзамена и требования организации, куда подаёте документы. У Academic и General Training отличаются Reading и Writing; Listening и Speaking общие. Если требования вуза важны для заявки, проверяйте их на официальной странице конкретной программы.

## Заменяет ли диагностика ASHYQ полный mock IELTS?

Нет. Диагностика ASHYQ занимает около 20 минут и даёт предварительный ориентир для выбора следующего шага; она не воспроизводит полный экзамен и не выдаёт официальный IELTS band score.

# Следующий шаг

Если вы ещё не знаете свою стартовую точку и не хотите сразу бронировать полный mock, пройдите [короткую предварительную диагностику IELTS](/diagnostic). Она поможет определить, с чего начать подготовку, но не заменяет полный тест или официальный результат IELTS. ASHYQ — образовательный бренд Казахстана с онлайн-подготовкой к IELTS и Digital SAT; подробнее о занятиях — на странице [курса IELTS](/courses/ielts).

# Источники

- [IELTS: официальные sample questions для Academic и General Training](https://ielts.org/take-a-test/preparation-resources/sample-test-questions)
- [IELTS: подсчёт баллов и критерии секций](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
- [British Council Kazakhstan: компьютерный ознакомительный тест](https://kazakhstan.britishcouncil.org/ru/exam/ielts/prepare/computer-delivered-ielts-familiarisation-test)
- [British Council Kazakhstan: условия кампании бесплатного mock](https://kazakhstan.britishcouncil.org/ru/free-mock-test)
- [IDP IELTS Kazakhstan: регистрация на Mock CD](https://ielts.kz/ielts-mock-cd-registration/)`
  },
  {
    slug: 'sat-kazakhstan-dates-price',
    language: 'ru',
    category: 'sat',
    title: 'SAT в Казахстане: сколько стоит и какие даты выбрать в 2026–2027',
    seoTitle: 'SAT в Казахстане: цена, даты и регистрация 2026–27',
    metaDescription: 'Цена SAT в Казахстане в 2026–2027 году: официальные сборы, даты и дедлайны регистрации, проверка тест-центра и мест на экзамен.',
    excerpt: 'Актуальная стоимость SAT в долларах, ближайшие даты 2026–2027, сроки регистрации и способ проверить доступный тест-центр в Казахстане по данным College Board.',
    photo: '/blog/sat-kazakhstan-dates-cover.svg',
    coverAlt: 'Регистрация SAT в Казахстане: международный сбор 111 долларов, дата 7 ноября 2026 года и дедлайн 23 октября.',
    publishedAt: '2026-09-25',
    updatedAt: '2026-09-25',
    body: `На 25 сентября 2026 года ближайшая дата SAT Weekend, до которой ещё не закрыт обычный срок регистрации, — 7 ноября. Стандартная регистрация доступна до 23 октября; поздняя — до 27 октября, если остаётся место. Базовая международная стоимость — $111: $68 регистрационный сбор и $43 международный сбор. Сам календарь не гарантирует свободное место в нужном центре, поэтому проверяйте доступность и окончательную сумму в аккаунте College Board перед оплатой. [Даты и дедлайны College Board](https://satsuite.collegeboard.org/sat/dates-deadlines) и [официальная таблица сборов](https://satsuite.collegeboard.org/sat/registration/international-testing/fees) — источники для окончательной проверки.

Информация о датах и тарифах ниже проверена 25 сентября 2026 года. У College Board сроки указаны по Eastern Time (ET), а дополнительные сборы могут обновляться; перед регистрацией откройте официальные страницы ещё раз.

# Сколько стоит регистрация на SAT из Казахстана

Базовая международная регистрация SAT стоит $111 до возможной платы выбранного тест-центра и дополнительных услуг. В неё входят $68 регистрационного сбора и $43 международного сбора. College Board публикует сумму в долларах США; фиксированный эквивалент в тенге заранее указывать некорректно — он зависит от конвертации и условий оплаты на дату списания.

| Сбор | Сумма по текущей таблице College Board |
| --- | --- |
| Регистрация на международный SAT | $68 + $43 = **$111** |
| Поздняя регистрация | +$38 |
| Смена тест-центра | $34 |
| Отмена до дедлайна изменений | $34 |
| Поздняя отмена | $44 |
| Дополнительный score report | $15 за отчёт |
| Плата тест-центра | $24 только в отдельных центрах |

Дополнительные тарифы в таблице College Board обозначены как действующие до декабря 2026 года. Для дат в 2027 году сверьте сборы повторно. Плата тест-центра применяется не везде: посмотрите актуальное пояснение и список на [странице международных тарифов College Board](https://satsuite.collegeboard.org/sat/registration/international-testing/fees), а окончательную сумму — в регистрации перед оплатой. Первые четыре отчёта о баллах бесплатны, если заказать их не позднее девяти дней после теста; далее каждый дополнительный отчёт стоит $15.

Смена даты — это не та же операция, что смена тест-центра: по правилам College Board нужно отменить текущую регистрацию и записаться заново. Перед таким решением откройте [официальные правила изменения регистрации](https://satsuite.collegeboard.org/sat/registration/change-cancel/changing-registration-info).

# Даты SAT и дедлайны регистрации на 2026–2027 год

По состоянию на 25 сентября 2026 года ближайшая дата SAT Weekend с ещё не наступившим стандартным дедлайном — 7 ноября. Возможность зарегистрироваться зависит от наличия мест в выбранном центре. Для международных участников College Board указывает тот же календарь; сроки заканчиваются в 23:59 по Eastern Time, США.

- **7 ноября 2026:** обычная регистрация до 23 октября; поздняя регистрация и изменения — до 27 октября.
- **5 декабря 2026:** обычная регистрация до 20 ноября; поздняя регистрация и изменения — до 24 ноября.
- **6 марта 2027:** обычная регистрация до 19 февраля; изменения и поздняя регистрация — до 23 февраля.
- **1 мая 2027:** обычная регистрация до 16 апреля; изменения и поздняя регистрация — до 20 апреля.
- **5 июня 2027:** обычная регистрация до 21 мая; изменения и поздняя регистрация — до 25 мая.

Регистрация на SAT 3 октября 2026 года уже закрыта: обычный срок прошёл 18 сентября, а поздний и срок изменений — 22 сентября. Не откладывайте до последнего дня: свободные места определяются при выборе тест-центра, и сам факт наличия даты в календаре не означает, что в нужном городе ещё есть места.

College Board рассчитывает дедлайны по времени США. Это не 23:59 по времени Казахстана: проверьте локальное время для конкретного срока, особенно около перехода США на зимнее или летнее время.

# Где проверить тест-центр и свободные места в Казахстане

Список центров в старых статьях и публикациях не подтверждает, что там есть место на нужную сессию. Начните регистрацию через свой аккаунт College Board, выберите дату и проверьте доступные центры и места в текущем интерфейсе. College Board отдельно предупреждает, что места доступны не во всех центрах; при необходимости рассмотрите другую дату или другой город, который отображается при регистрации. [Инструкция College Board по регистрации](https://satsuite.collegeboard.org/sat/registration/online-registration/registering) объясняет этот порядок.

![Три шага перед регистрацией на SAT из Казахстана: выберите дату и проверьте дедлайн, посмотрите доступность тест-центра в аккаунте College Board, затем сверьте итоговые сборы перед оплатой.](/blog/sat-kazakhstan-registration-steps.svg)

# Как зарегистрироваться на SAT из Казахстана

1. **Сверьте даты с дедлайнами вузов.** Выберите дату, чтобы успеть получить результат к сроку подачи документов; оставьте запас, если планируете пересдачу.
2. **Войдите в аккаунт College Board.** Подготовьте данные удостоверения личности и актуальное фото. Международные требования к документам могут различаться по месту сдачи, поэтому проверьте [правила College Board для международного тестирования](https://satsuite.collegeboard.org/sat/registration/international-testing/policies). Не ориентируйтесь только на старые списки документов из блогов.
3. **Выберите дату и проверьте доступные центры.** Не считайте адрес из сторонней статьи подтверждением текущего места: ориентируйтесь на варианты, которые показывает процесс регистрации.
4. **Проверьте полный платёж до подтверждения.** Сверьте $111, возможную плату выбранного центра и услуги, которые вы добавили. Для оплаты в тенге учитывайте конвертацию банка.
5. **После регистрации подготовьте устройство.** Установите Bluebook и выполните Exam Setup в сроки, указанные College Board. Если вам нужно одолжить устройство у College Board, запросите его минимум за 30 дней до даты SAT.

# Частые вопросы

## Сколько стоит SAT в Казахстане в 2026 году?

Стандартная международная регистрация стоит $111: $68 базовый сбор и $43 международный сбор. Отдельный центр может взимать дополнительный сбор, поэтому подтвердите окончательную сумму в процессе регистрации.

## Сколько это будет в тенге?

College Board указывает сборы в долларах США. Сумма списания в тенге зависит от курса и условий карты на дату оплаты; проверьте её в своём банке и на последнем шаге регистрации.

## Где именно сдавать SAT в Алматы или Астане?

Доступные тест-центры и места на выбранную дату проверяются в аккаунте College Board во время регистрации. Не полагайтесь на адрес из старого списка: расписание и доступность меняются.

## Какая следующая дата SAT и до какого числа регистрироваться?

На 25 сентября 2026 года ближайшая дата с ещё не наступившим стандартным дедлайном — 7 ноября 2026 года; стандартная регистрация открыта до 23 октября. Поздняя регистрация и изменения возможны до 27 октября, если остаются места.

## Что делать, если я пропустил обычный дедлайн?

Проверьте дату поздней регистрации в официальном календаре и наличие мест в аккаунте College Board. Поздняя регистрация доступна с дополнительным сбором, но не гарантирует место в выбранном городе.

# Следующий шаг

Если даты и документы понятны, а теперь нужно определить, какие темы подтянуть до SAT, начните с [предварительной диагностики ASHYQ](/?start=sat). Она даёт ориентир для планирования подготовки, но не является официальным баллом College Board. ASHYQ — образовательный бренд Казахстана с онлайн-подготовкой к Digital SAT; программу можно посмотреть на странице [онлайн-подготовки к SAT](/courses/sat).

# Официальные источники

- [College Board: даты SAT и дедлайны регистрации](https://satsuite.collegeboard.org/sat/dates-deadlines)
- [College Board: международные сборы и дополнительные тарифы](https://satsuite.collegeboard.org/sat/registration/international-testing/fees)
- [College Board: как пройти регистрацию и выбрать центр](https://satsuite.collegeboard.org/sat/registration/online-registration/registering)
- [College Board: правила международного тестирования и удостоверение личности](https://satsuite.collegeboard.org/sat/registration/international-testing/policies)`
  },
  {
    slug: 'sat-reading-writing-guide',
    language: 'ru',
    category: 'sat',
    title: 'SAT Reading & Writing: как готовиться по отчёту Bluebook',
    seoTitle: 'SAT Reading & Writing: подготовка по отчёту Bluebook',
    metaDescription: 'Как связать отчёт Bluebook с практикой SAT Reading & Writing: разберитесь в 4 доменах, уровнях сложности и Student Question Bank, составьте план занятий.',
    excerpt: 'Как прочитать отчёт Bluebook по Reading & Writing, выбрать домен и навык для практики и подобрать задания нужной сложности в Student Question Bank.',
    photo: '/blog/sat-reading-writing-domains.svg',
    coverAlt: 'Четыре домена SAT Reading & Writing и маршрут от отчёта Bluebook к целевой практике.',
    publishedAt: '2026-09-25T15:45:00.000Z',
    updatedAt: '2026-09-25T15:45:00.000Z',
    body: `Чтобы готовиться к SAT Reading & Writing прицельно, используйте отчёт Bluebook как карту: найдите домен с меньшей полосой, откройте разбор конкретных вопросов, запишите повторяющийся навык и отфильтруйте по нему задания в Student Question Bank. Полоса подсказывает ориентир по сложности, но не показывает процент правильных ответов и не гарантирует будущий балл.

В этом руководстве — четыре домена секции, чтение отчёта My Practice, выбор уровня упражнений и пример плана. Все тренировочные примеры ниже созданы для объяснения и не являются вопросами SAT.

# Что проверяет SAT Reading & Writing

Секция Reading and Writing состоит из 54 вопросов и занимает 64 минуты: два модуля по 32 минуты. В каждом модуле встречаются задания из всех четырёх доменов. Обычно вопрос связан с коротким текстом или парой текстов; College Board указывает длину отрывков примерно от 25 до 150 слов. Поэтому тренируйте не только скорость чтения, но и конкретный навык, который проверяется в задании. [Официальное описание секции](https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing) и [спецификации College Board](https://satsuite.collegeboard.org/k12-educators/about/alignment/reading) перечисляют домены и их примерную долю в секции.

| Домен в отчёте | Примерная доля вопросов | Что тренировать |
| --- | --- | --- |
| Information and Ideas | ≈26% | Главную мысль и детали, выводы, доказательства из текста и графиков |
| Craft and Structure | ≈28% | Слова в контексте, структуру и цель текста, связь двух текстов |
| Expression of Ideas | ≈20% | Выбор перехода и объединение заметок в предложение под заданную цель |
| Standard English Conventions | ≈26% | Границы предложений, грамматическую форму, структуру и пунктуацию |

Доли приблизительные: это распределение вопросов по спецификации, а не обещание точного числа заданий каждого домена в конкретном тесте. В отчёте сохраняйте английские названия — так их проще найти в интерфейсе Bluebook и Question Bank.

# Как перейти от результата Bluebook к упражнению

Сначала пройдите полный официальный тренировочный тест в Bluebook. Затем откройте My Practice: там можно посмотреть общий результат, детализацию вопросов, выбранные и правильные ответы, объяснения и практику, подобранную по результату. Если тест ещё не проходили, используйте эту последовательность как исходную точку, а не угадывайте слабый домен по впечатлению. [College Board описывает разбор My Practice здесь](https://satsuite.collegeboard.org/practice/my-practice-101).

- **1. Выберите один домен для разбора.** Начните с домена, где полоса отчёта ниже, но не делайте вывод только по ней: посмотрите и на конкретные вопросы.
- **2. Запишите ошибку и её причину.** Например: неверно понял главную мысль; выбрал слово без опоры на контекст; пропустил связь между текстами; не заметил, что в предложении нарушено согласование.
- **3. Найдите точное название навыка.** В My Practice прочитайте объяснение к вопросу. В Student Question Bank отфильтруйте SAT → Reading and Writing → нужный домен → навык → сложность. Банк также позволяет выбирать assessment и содержит официальные задания College Board. Для входа нужны школьный sign-in ticket или личный аккаунт College Board.
- **4. Решите небольшой набор и разберите объяснения.** Сначала добейтесь, чтобы могли объяснить ход решения без таймера; затем добавьте время. Отдельно отметьте вопросы, где ответ был верным только за счёт догадки.
- **5. Проверьте навык на новых заданиях.** После тематической практики используйте смешанный набор: он показывает, можете ли вы узнать навык без подсказки в названии домена.

Если интерфейс предлагает **Get Tailored Practice**, начните с этого варианта: My Practice формирует набор из Student Question Bank на основе результатов пробного теста. Если хотите сами собрать набор, используйте фильтры по домену, навыку и сложности. [Фильтры Question Bank](https://satsuite.collegeboard.org/practice/student-question-bank) помогают сузить практику до выбранной темы.

![Рабочий маршрут подготовки: отчёт Bluebook, выбор домена и навыка, тематическая практика и повторная проверка.](/blog/sat-reading-writing-workflow.svg)
Схема показывает учебный цикл, а не отдельное правило или прогноз балла.

# Как выбрать сложность по полосе отчёта

College Board предлагает использовать семь ячеек полосы прогресса как ориентир для выбора сложности в Student Question Bank. Это подсказка для практики, а не оценка в процентах: после задания проверяйте, можете ли объяснить правильный ответ и исправить свою ошибку.

| Положение полосы в домене | С чего начать в Question Bank | Что добавить после разбора |
| --- | --- | --- |
| Первые 3 ячейки | Easy | Попробуйте Medium, когда можете объяснить базовый навык |
| 4-я или 5-я ячейка | Medium | Добавьте Hard, когда стабильно разбираете Medium |
| 6-я или 7-я ячейка | Hard | Периодически решайте Easy и Medium для повторения базы |

Это рекомендации самого College Board: для первых трёх ячеек начните с Easy и попробуйте Medium; для четвёртой и пятой — Medium и затем Hard; для шестой и седьмой — Hard, периодически возвращаясь к более простым вопросам. Смотрите [дополнительные советы к Student Question Bank](https://satsuite.collegeboard.org/practice/student-question-bank/tips). Не трактуйте ячейки как число верных ответов или гарантированное количество баллов: официальный источник описывает их как прогресс в освоении навыков домена.

# Пример: превратить ошибку в конкретную тему

**Учебный пример, созданный для этой статьи; это не официальный вопрос SAT.**

**Neither the instructor nor the students ___ the schedule before class.** Возможные ответы: **has reviewed** / **have reviewed**.

Правильный вариант — **have reviewed**: в конструкции neither … nor глагол согласуется с ближайшим подлежащим students. Если вы выбрали has reviewed, отметьте не «ошибка в английском вообще», а конкретно subject-verb agreement. В Student Question Bank найдите этот навык в домене Standard English Conventions; затем разберите объяснения и проверьте правило на новом примере.

Такая запись помогает отличить пробел в знании от невнимательности. Если правило вы знали, но не заметили, что подлежащее стоит после длинной вставки, тренируйте поиск главного подлежащего и проверку предложения. Если не смогли сформулировать правило, сначала повторите его, а затем возвращайтесь к тестовым заданиям.

# Пример плана на четыре недели

Это один возможный порядок работы, а не официальный график College Board и не обещание определённого результата. Подстройте его под доступное время и результаты диагностики.

- **Неделя 1:** пройдите полный тест Bluebook, сохраните отчёт и выпишите 2–3 повторяющихся навыка вместе с причинами ошибок.
- **Неделя 2:** начните с домена и навыка, которые повторяются в разборе чаще всего. Решайте тематические задания в Question Bank; сверяйтесь с объяснением каждого сомнительного ответа.
- **Неделя 3:** продолжите работу над следующим навыком и добавьте смешанную практику без подсказки о домене.
- **Неделя 4:** выполните новый полный тренировочный тест и сравните доменные полосы и типы ошибок. Если ошибки по отрабатываемому навыку стали реже, продолжайте; если они повторились, вернитесь к объяснениям и целевым заданиям.

Для самостоятельной практики подойдут официальные [полноформатные тесты в Bluebook](https://satsuite.collegeboard.org/practice/practice-tests/bluebook), [Student Question Bank](https://satsuite.collegeboard.org/practice/student-question-bank) и [бесплатная подготовка Official SAT Prep на Khan Academy](https://www.khanacademy.org/digital-sat). Проверяйте текущий интерфейс и доступность ресурсов на сайтах College Board: названия разделов могут обновляться.

# Частые вопросы о SAT Reading & Writing

## Сколько вопросов и времени в секции Reading & Writing?

В секции 54 вопроса и 64 минуты — два модуля по 32 минуты. В каждом модуле представлены все четыре домена. Подтверждение есть в [структуре SAT от College Board](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure).

## Какие темы входят в SAT Reading & Writing?

Четыре домена: Information and Ideas, Craft and Structure, Expression of Ideas и Standard English Conventions. Они охватывают понимание текста и данных, слова и структуру, редактирование под цель, а также грамматику и пунктуацию.

## Где бесплатно тренировать SAT Reading & Writing?

Пройдите официальный пробный тест в Bluebook и разбирайте результат в My Practice. Для отдельных навыков используйте Student Question Bank; для объяснений и уроков доступен Official SAT Prep на Khan Academy. Доступ к Question Bank открывается через аккаунт College Board или школьный sign-in ticket.

## Как понять, задания какой сложности решать?

Используйте полосу домена как стартовый ориентир: первые три ячейки — Easy, четвёртая и пятая — Medium, шестая и седьмая — Hard. Затем переходите к соседнему уровню по мере освоения навыка. Это рекомендация по практике от College Board, а не перевод полосы в проценты или балл SAT.

# Как продолжить подготовку в Казахстане

Если вы уже разобрали отчёт, но не понимаете, какие навыки ставить в план и в каком порядке, пройдите [предварительную диагностику ASHYQ по SAT](/?start=sat). Она помогает выбрать следующий шаг, но не является официальным результатом College Board. ASHYQ — образовательный бренд Казахстана с онлайн-подготовкой к Digital SAT; условия и формат занятий описаны на странице [онлайн-подготовки к SAT](/courses/sat).

Для более полного маршрута по экзамену посмотрите также [план подготовки к SAT Math после пробного теста](/blog/sat-math-study-plan), [практику Desmos в SAT Math](/blog/desmos-sat-guide) и [информацию о датах и регистрации на SAT в Казахстане](/blog/sat-kazakhstan-dates-price).

# Официальные источники

- [College Board: Reading and Writing — формат и четыре домена](https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing)
- [College Board: спецификации Reading and Writing и распределение вопросов](https://satsuite.collegeboard.org/k12-educators/about/alignment/reading)
- [College Board: структура SAT и время секций](https://satsuite.collegeboard.org/sat/whats-on-the-test/structure)
- [College Board: результаты и разбор My Practice](https://satsuite.collegeboard.org/practice/my-practice-101)
- [College Board: Student Question Bank](https://satsuite.collegeboard.org/practice/student-question-bank)
- [College Board: рекомендации по выбору сложности](https://satsuite.collegeboard.org/practice/student-question-bank/tips)
- [College Board: полноформатные тренировочные тесты Bluebook](https://satsuite.collegeboard.org/practice/practice-tests/bluebook)
- [Khan Academy: Official SAT Prep](https://www.khanacademy.org/digital-sat)`,
  },
];
