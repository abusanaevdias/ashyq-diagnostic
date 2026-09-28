export type LibraryCategory = 'Все' | 'Writing Lab' | 'Task 2' | 'Task 1' | 'Reading' | 'Listening' | 'Speaking' | 'Язык' | 'Маршрут';
export type LibraryChapter = { slug: string; code: string; title: string; description: string; category: LibraryCategory; source: 'library' | 'lab'; start: number; end: number };

const chapter = (slug: string, code: string, title: string, description: string, category: LibraryCategory, source: 'library' | 'lab', start: number, end: number): LibraryChapter => ({ slug, code, title, description, category, source, start, end });
export const LIBRARY_CHAPTERS: LibraryChapter[] = [
  chapter('start', 'START', 'Как работать с библиотекой', 'Критерии, порядок практики и границы учебных оценок.', 'Маршрут', 'library', 4, 6),
  chapter('u01-work-experience', 'U01', 'Стажировка: опыт ещё не значит обучение', 'Три полных эссе, разбор изменений и 12 заданий: от примера к аргументу.', 'Writing Lab', 'lab', 5, 18),
  chapter('u02-talent-practice', 'U02', 'Талант или практика?', 'Объясните обе стороны. Сравните ≈5.5, ≈7.0 и целевой высокий стандарт.', 'Writing Lab', 'lab', 19, 32),
  chapter('u03-subscriptions', 'U03', 'Подписки: удобство против цены', 'Сравните преимущества и недостатки по одному основанию, а не по количеству.', 'Writing Lab', 'lab', 33, 46),
  chapter('u04-hobbies', 'U04', 'Почему бросают хобби?', 'Свяжите каждую причину с адресным решением и проверьте границы вывода.', 'Writing Lab', 'lab', 47, 60),
  chapter('task-response', 'TR', 'Попадите точно в вопрос', 'Клиника Task Response: команды задания, позиция, обоснование. 10 упражнений.', 'Writing Lab', 'lab', 61, 65),
  chapter('coherence', 'CC', 'Читатель не должен достраивать мосты', 'Клиника Coherence & Cohesion: порядок мысли, связи и отсылки. 10 упражнений.', 'Writing Lab', 'lab', 66, 70),
  chapter('vocabulary', 'LR', 'Точность раньше редкости', 'Клиника Lexical Resource: смысл, сочетаемость и границы перефразирования.', 'Writing Lab', 'lab', 71, 75),
  chapter('grammar', 'GR', 'Конструкция обслуживает смысл', 'Клиника Grammar: согласование, условия и границы предложения.', 'Writing Lab', 'lab', 76, 80),
  chapter('new-writing-lab-topics', 'X01–X12', 'Новая тема — самостоятельная работа', '12 новых Task 2 вопросов и возможные планы после собственной попытки.', 'Writing Lab', 'lab', 81, 89),
  chapter('lab-method', 'LAB START', 'Как понимать ≈5.5 → ≈7 → target 9', 'Что сравнивают авторские модели и чего их числа не подтверждают.', 'Маршрут', 'lab', 3, 4),
  chapter('lab-route', 'LAB ROUTE', 'Маршрут Writing Lab', '16 примерных сессий, самопроверка и перенос на незнакомый вопрос.', 'Маршрут', 'lab', 90, 90),
  chapter('lab-sources', 'LAB SOURCES', 'Источники и границы Writing Lab', 'Официальные критерии отдельно от авторских примеров и учебных оценок.', 'Маршрут', 'lab', 91, 91),
  chapter('e01-online-learning', 'E01', 'Онлайн не значит вместо класса', 'Две полные версии Task 2, анализ четырёх критериев и 8 заданий.', 'Task 2', 'library', 7, 13),
  chapter('e02-individual-group', 'E02', 'Учиться одному или в группе?', 'Объясните механизм обеих позиций и сформулируйте собственную.', 'Task 2', 'library', 14, 20),
  chapter('e03-working-from-home', 'E03', 'Работа из дома: сравните значимость', 'От списка плюсов и минусов к итоговому сравнению.', 'Task 2', 'library', 21, 27),
  chapter('e04-concentration', 'E04', 'Почему сложно сосредоточиться?', 'Причины и решения должны отвечать друг другу.', 'Task 2', 'library', 28, 34),
  chapter('e05-repair', 'E05', 'Покупать новое или ремонтировать?', 'Две полные авторские версии и самостоятельная практика.', 'Task 2', 'library', 35, 41),
  chapter('e06-museums', 'E06', 'Музей: впечатление и понимание', 'Как развить аргумент, не расширяя вывод за пределы примера.', 'Task 2', 'library', 42, 48),
  chapter('argument-bridge', 'BR', 'Мост между слабым и сильным ответом', 'Три стадии аргумента и случаи, когда редкое слово мешает точности.', 'Task 2', 'library', 49, 50),
  chapter('task1-enrolments', 'T1A', 'Курсы: смена лидера', 'Две версии отчёта по авторскому графику: изменения, overview и точные числа.', 'Task 1', 'library', 51, 55),
  chapter('task1-budget', 'T1B', 'Бюджет: доля не равна сумме', 'Две версии отчёта по таблице и ловушки процентов / процентных пунктов.', 'Task 1', 'library', 56, 60),
  chapter('task1-process', 'T1C', 'Процесс: не потеряйте ветвление', 'Две версии отчёта: порядок действий, решение и исключённые догадки.', 'Task 1', 'library', 61, 65),
  chapter('reading-equipment', 'R01', 'The equipment library', 'Авторский Reading-текст, 10 вопросов и доказательства для ответов.', 'Reading', 'library', 66, 68),
  chapter('reading-room', 'R02', 'A room that changed its purpose', 'Смысл, а не знакомое слово: текст, вопросы и объяснения.', 'Reading', 'library', 69, 71),
  chapter('reading-participation', 'R03', 'What does participation tell us?', 'Тренируйте вывод и границы утверждения на коротком авторском тексте.', 'Reading', 'library', 72, 74),
  ...[1, 2, 3].map((n) => chapter(`grammar-block-${n}`, `G${n}`, `Грамматика · блок ${n}`, '12 точечных упражнений, ключ и объяснение выбора.', 'Язык', 'library', 73 + n * 2, 74 + n * 2)),
  ...[1, 2].map((n) => chapter(`collocations-${n}`, `C${n}`, `Сочетаемость · блок ${n}`, '12 упражнений на точное сочетание слов, а не на «слова для девятки».', 'Язык', 'library', 79 + n * 2, 80 + n * 2)),
  chapter('listening-workshop', 'L01', 'Workshop booking', '6 вопросов на окончательный смысл. Авторский скрипт и разбор ловушек.', 'Listening', 'library', 85, 86),
  chapter('listening-project', 'L02', 'Project briefing', '6 вопросов: различите исходный вариант и исправление.', 'Listening', 'library', 87, 88),
  chapter('listening-library', 'L03', 'Library orientation', '6 вопросов на ориентирование, уточнения и точность ответа.', 'Listening', 'library', 89, 90),
  chapter('listening-official', 'L-REAL', 'Переход к настоящему аудио', 'Официальная практика отдельно: синтетический голос не заменяет запись экзамена.', 'Listening', 'library', 91, 91),
  chapter('speaking-practice', 'S', 'Speaking: развейте собственный ответ', 'Сравнения ответов, 18 вопросов Part 1, 6 карточек Part 2 и 12 вопросов Part 3.', 'Speaking', 'library', 92, 99),
  ...[1, 2, 3, 4].map((n) => chapter(`task2-new-topics-${n}`, `NEW${n}`, `Новые Task 2 темы · раунд ${n}`, 'Одно полное эссе и два плана. Возможные решения открывайте после попытки.', 'Task 2', 'library', 98 + n * 2, 99 + n * 2)),
  chapter('study-route', 'PLAN', 'Маршрут на 21 день и журнал ошибок', 'Примерный план, повторная проверка на новой теме и запись конкретного улучшения.', 'Маршрут', 'library', 108, 110),
  chapter('sources', 'SOURCES', 'Источники и авторство', 'Ссылки на IELTS / IDP и ограничения собственных учебных материалов ASHYQ.', 'Маршрут', 'library', 111, 112),
];

export const LIBRARY_DOWNLOADS = [
  { label: 'Полная библиотека', text: 'Оба тома · 203 страницы', href: '/library/pdf/ashyq-ielts-free-library-v3.pdf' },
  { label: 'Writing Upgrade Lab', text: 'Новые кейсы и разборы · 91 страница', href: '/library/pdf/ashyq-writing-upgrade-lab-v3.pdf' },
  { label: 'Рабочая тетрадь', text: 'Попытка без ключей · 39 страниц', href: '/library/pdf/ashyq-writing-workbook-v3.pdf' },
];
export const LIBRARY_CATEGORIES: LibraryCategory[] = ['Все', 'Writing Lab', 'Task 2', 'Task 1', 'Reading', 'Listening', 'Speaking', 'Язык', 'Маршрут'];
