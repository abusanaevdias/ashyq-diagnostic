// «Искра vs IELTS» — episode data. Single source of truth for the template
// (episode.html), the renderer (render.mjs) and the soundtrack (audio.py).
// audio.py parses the object literal below as JSON, so keep it pure JSON.
window.EPISODES = {
  "timeline": {
    "fps": 30,
    "duration": 14,
    "act": 1.3,
    "typing": [1.6, 4.1],
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
      "title": { "lines": ["Два слова,"], "acc": "Искра!" },
      "fail": { "lines": ["Три слова —"], "acc": "ответ неверный" },
      "rule": { "lines": ["Лимит слов строгий.", "Артикль — тоже"], "acc": "слово" },
      "bubble": { "done": "Готово! 😎", "fail": "Что?!" },
      "card": {
        "chip": "Listening · Part 1",
        "instruction": "Write NO MORE THAN TWO WORDS",
        "prompt": "Delivery item:",
        "heard": "…we'll deliver the wooden table on Friday.",
        "wrong": ["the", "wooden", "table"],
        "limit": 2
      }
    },
    "6": {
      "series": "Искра vs IELTS",
      "kind": "writing",
      "panel": "#e8efe2",
      "title": { "lines": ["190 слов —"], "acc": "и так сойдёт" },
      "fail": { "lines": ["Меньше 250 —"], "acc": "минус баллы" },
      "rule": { "lines": ["Task 2 — минимум", "250 слов. Планируй"], "acc": "с запасом" },
      "bubble": { "done": "Сдаю! 😎", "fail": "Как это?!" },
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
      "title": { "lines": ["Пропущу —"], "acc": "меньше штраф" },
      "fail": { "lines": ["Пустой ответ —"], "acc": "ноль баллов" },
      "rule": { "lines": ["Штрафа за ошибку нет.", "Отвечай на каждый"], "acc": "вопрос" },
      "bubble": { "done": "Умно! 😎", "fail": "Ой…" },
      "card": {
        "chip": "Digital SAT · Math · модуль 2",
        "from": 15,
        "answers": ["B", "D", null, "A", null, "C", null, "B"],
        "guesses": ["C", "A", "D"]
      }
    }
  }
};
