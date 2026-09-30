// «Искра vs IELTS» — episode data. Single source of truth for the template
// (episode.html), the renderer (render.mjs) and the soundtrack (audio.py).
// audio.py parses the object literal below as JSON, so keep it pure JSON.
window.EPISODES = {
  "timeline": {
    "fps": 30,
    "duration": 14,
    "act": 1.3,
    "typing": [
      1.6,
      4.1
    ],
    "done": 4.3,
    "fail": 5.0,
    "rule": 8.0,
    "fix": 8.7,
    "end": 11.4
  },
  "episodes": {
    "1": {
      "series": "Искра vs IELTS",
      "kind": "listening",
      "panel": "#f9e0db",
      "title": {
        "lines": [
          "Два слова,"
        ],
        "acc": "Искра!"
      },
      "fail": {
        "lines": [
          "Три слова —"
        ],
        "acc": "ответ неверный"
      },
      "rule": {
        "lines": [
          "Лимит слов строгий.",
          "Артикль — тоже"
        ],
        "acc": "слово"
      },
      "bubble": {
        "done": "Готово! 😎",
        "fail": "Что?!"
      },
      "card": {
        "chip": "Listening · Part 1",
        "instruction": "Write NO MORE THAN TWO WORDS",
        "prompt": "Delivery item:",
        "heard": "…we'll deliver the wooden table on Friday.",
        "wrong": [
          "the",
          "wooden",
          "table"
        ],
        "limit": 2
      }
    },
    "2": {
      "series": "Искра vs IELTS",
      "kind": "spelling",
      "panel": "#f9e0db",
      "title": {
        "lines": [
          "Услышала верно,"
        ],
        "acc": "написала…"
      },
      "fail": {
        "lines": [
          "Одна буква —"
        ],
        "acc": "ноль баллов"
      },
      "rule": {
        "lines": [
          "Орфография считается.",
          "Ошибка в слове — 0."
        ],
        "acc": "Проверяй"
      },
      "bubble": {
        "done": "Легко! 😎",
        "fail": "За букву?!"
      },
      "card": {
        "chip": "Listening · Part 1",
        "instruction": "Write ONE WORD ONLY",
        "prompt": "Book early:",
        "heard": "…remember to book your accommodation early.",
        "wrong": "acommodation",
        "right": "accommodation",
        "mark": 2
      }
    },
    "3": {
      "series": "Искра vs IELTS",
      "kind": "number",
      "panel": "#f9e0db",
      "title": {
        "lines": [
          "Пятнадцать…"
        ],
        "acc": "то есть пятьдесят"
      },
      "fail": {
        "lines": [
          "Записала 15 —"
        ],
        "acc": "а сказали пятьдесят"
      },
      "rule": {
        "lines": [
          "Дослушай фразу до конца:",
          "в цифрах часто бывают"
        ],
        "acc": "поправки"
      },
      "bubble": {
        "done": "Записала! 😎",
        "fail": "Нечестно!"
      },
      "card": {
        "chip": "Listening · Part 1",
        "instruction": "Write ONE WORD AND/OR A NUMBER",
        "prompt": "Course fee: £",
        "heard": [
          "“The course fee is fifteen…",
          "…sorry, fifty pounds.”"
        ],
        "correctionAt": 3.4,
        "wrong": "15",
        "right": "50"
      }
    },
    "4": {
      "series": "Искра vs IELTS",
      "kind": "tfng",
      "panel": "#f8f7f3",
      "title": {
        "lines": [
          "Ну логично же —"
        ],
        "acc": "TRUE!"
      },
      "fail": {
        "lines": [
          "В тексте этого нет —"
        ],
        "acc": "ответ неверный"
      },
      "rule": {
        "lines": [
          "Только текст. Нет в тексте —"
        ],
        "acc": "NOT GIVEN"
      },
      "bubble": {
        "done": "Очевидно! 😎",
        "fail": "Но это же логично!"
      },
      "card": {
        "chip": "Reading · True / False / Not Given",
        "passage": "The library opened a new reading room in 2019.",
        "statement": "The reading room is popular with students.",
        "wrong": "TRUE",
        "right": "NOT GIVEN"
      }
    },
    "5": {
      "series": "Искра vs IELTS",
      "kind": "timing",
      "panel": "#f8f7f3",
      "title": {
        "lines": [
          "Полчаса на"
        ],
        "acc": "первый текст"
      },
      "fail": {
        "lines": [
          "На третий текст —"
        ],
        "acc": "5 минут"
      },
      "rule": {
        "lines": [
          "60 минут на 3 текста:",
          "примерно по 20. Сначала"
        ],
        "acc": "вопросы"
      },
      "bubble": {
        "done": "Всё понятно! 😎",
        "fail": "Где время?!"
      },
      "card": {
        "chip": "Reading · 60 минут · 3 текста",
        "wrong": [
          30,
          25,
          5
        ],
        "right": [
          20,
          20,
          20
        ],
        "questions": "~13 вопросов"
      }
    },
    "6": {
      "series": "Искра vs IELTS",
      "kind": "writing",
      "panel": "#e8efe2",
      "title": {
        "lines": [
          "190 слов —"
        ],
        "acc": "и так сойдёт"
      },
      "fail": {
        "lines": [
          "Меньше 250 —"
        ],
        "acc": "минус баллы"
      },
      "rule": {
        "lines": [
          "Task 2 — минимум",
          "250 слов. Планируй"
        ],
        "acc": "с запасом"
      },
      "bubble": {
        "done": "Сдаю! 😎",
        "fail": "Как это?!"
      },
      "card": {
        "chip": "Writing Task 2",
        "prompt": "Some people prefer online classes, others prefer the classroom. Discuss both views and give your opinion.",
        "wrong": 190,
        "right": 265,
        "minimum": 250
      }
    },
    "7": {
      "series": "Искра vs IELTS",
      "kind": "chart",
      "panel": "#e8efe2",
      "title": {
        "lines": [
          "Все цифры"
        ],
        "acc": "графика"
      },
      "fail": {
        "lines": [
          "Цифры есть —"
        ],
        "acc": "обзора нет"
      },
      "rule": {
        "lines": [
          "Task 1: сначала обзор —",
          "главный тренд, а не"
        ],
        "acc": "все цифры"
      },
      "bubble": {
        "done": "Ничего не упустила! 😎",
        "fail": "Какой обзор?"
      },
      "card": {
        "chip": "Writing Task 1 · график",
        "title": "Students using online courses, %",
        "labels": [
          "2016",
          "2018",
          "2020",
          "2022",
          "2024"
        ],
        "values": [
          12,
          18,
          25,
          34,
          47
        ],
        "wrong": [
          "In 2016 it was 12%.",
          "In 2018 it was 18%.",
          "In 2020 it was 25%…"
        ],
        "right": "Overall, the share rose steadily and almost quadrupled."
      }
    },
    "8": {
      "series": "Искра vs IELTS",
      "kind": "speaking",
      "panel": "#fcf3f0",
      "title": {
        "lines": [
          "Идеальная"
        ],
        "acc": "первая фраза"
      },
      "fail": {
        "lines": [
          "Минута прошла —"
        ],
        "acc": "а плана нет"
      },
      "rule": {
        "lines": [
          "План — 3–4 слова.",
          "Говори, пока не"
        ],
        "acc": "остановят"
      },
      "bubble": {
        "done": "Шедевр! 😎",
        "fail": "Э-э-э…"
      },
      "card": {
        "chip": "Speaking · Part 2",
        "cue": "Describe a place you like to visit.",
        "points": "where it is · when you go · what you do · why you like it",
        "wrong": "Well, the place that I would like to describe today is a truly remarkable",
        "right": [
          "Бурабай",
          "летом",
          "озеро, походы",
          "природа"
        ]
      }
    },
    "9": {
      "series": "Искра vs SAT",
      "kind": "sat",
      "panel": "#1b1512",
      "dark": true,
      "title": {
        "lines": [
          "Пропущу —"
        ],
        "acc": "меньше штраф"
      },
      "fail": {
        "lines": [
          "Пустой ответ —"
        ],
        "acc": "ноль баллов"
      },
      "rule": {
        "lines": [
          "Штрафа за ошибку нет.",
          "Отвечай на каждый"
        ],
        "acc": "вопрос"
      },
      "bubble": {
        "done": "Умно! 😎",
        "fail": "Ой…"
      },
      "card": {
        "chip": "Digital SAT · Math · модуль 2",
        "from": 15,
        "answers": [
          "B",
          "D",
          null,
          "A",
          null,
          "C",
          null,
          "B"
        ],
        "guesses": [
          "C",
          "A",
          "D"
        ]
      }
    },
    "10": {
      "series": "Искра vs SAT",
      "kind": "calc",
      "panel": "#1b1512",
      "dark": true,
      "title": {
        "lines": [
          "Калькулятор?"
        ],
        "acc": "Какой калькулятор?"
      },
      "fail": {
        "lines": [
          "5 минут на задачу —"
        ],
        "acc": "а в модуле их 22"
      },
      "rule": {
        "lines": [
          "Встроенный Desmos —",
          "во всей секции"
        ],
        "acc": "Math"
      },
      "bubble": {
        "done": "Почти посчитала! 😎",
        "fail": "Сколько времени?!"
      },
      "card": {
        "chip": "Digital SAT · Math",
        "question": "What is the positive solution of x² − 5x − 14 = 0?",
        "scratch": [
          "x² − 5x − 14 = 0",
          "D = 25 + 56 = 81",
          "x = (5 ± 9) / 2 …"
        ],
        "root": 7,
        "other": -2
      }
    },
    "11": {
      "series": "Искра vs IELTS",
      "kind": "band",
      "panel": "#f9e0db",
      "title": {
        "lines": [
          "6.25 —"
        ],
        "acc": "это провал?"
      },
      "fail": {
        "lines": [
          "Думаешь, вниз до 6.0?"
        ],
        "acc": "не спеши"
      },
      "rule": {
        "lines": [
          "Overall округляется:",
          "6.25 → 6.5, 6.75 → 7.0 —"
        ],
        "acc": "в твою пользу"
      },
      "bubble": {
        "done": "Всё, 6.0 😭",
        "fail": "Правда?!"
      },
      "card": {
        "chip": "IELTS · итоговый балл",
        "scores": [
          [
            "Listening",
            "6.5"
          ],
          [
            "Reading",
            "6.0"
          ],
          [
            "Writing",
            "6.0"
          ],
          [
            "Speaking",
            "6.5"
          ]
        ],
        "avg": "6.25",
        "wrong": "6.0",
        "right": "6.5"
      }
    }
  }
};
