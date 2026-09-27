# Writing trainer landing — adversarial review

Scope: public IELTS course card, `/writing/trainer` introduction, and the unchanged synthetic exercise at `/writing/trainer/practice`.

| Challenge | Evidence and decision |
| --- | --- |
| A visitor assumes they can upload their own essay after seeing “try the trainer.” | The IELTS course card, landing hero, and start panel say the current mode has two prepared essays and no own-essay upload. The start button leads only to the existing synthetic exercise. |
| A visitor mistakes the prepared 5.5/6.0 values for an AI assessment or official IELTS score. | The landing start panel identifies the numbers as practice anchors for the examples. The exercise keeps its existing score disclaimer. |
| Screenshots become unreadable on a phone. | Each of the three real interface captures has a separately labelled link to open the original image for zooming. Captions explain the action without requiring the image text. |
| A forced headline break joins words on narrow screens. | The first 320px pass exposed “сам.Потом”; the heading now uses natural wrapping with a real space. |
| Adding a writing card changes the SAT offer or breaks the existing lesson count. | The new card and four-column layout are conditional on the IELTS course slug; the locked card still counts only locked lessons. |
| Moving the exercise breaks existing `/writing/trainer` links. | That URL remains valid as the introduction, and its CTA reaches `/writing/trainer/practice`; the exercise links back to the introduction. |
| A public demo leaks learner work or provider credentials. | The practice content is still the two synthetic cases, with page-local state and no writing API or AI request. No real class submissions or Jev key are involved. |

Remaining gate: an own-essay mode for enrolled ASHYQ students requires a separate data, consent, AI provider, rate-limit, and teacher calibration design. [TypeSafe describes Jev as a typed decision model without string generation](https://typesafe.ai/blog/introducing-system-one-models-and-jev), so it cannot generate free-text corrections alone.
