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
    }
  }
};
