# SAT Translation Lab: adversarial review

## Pilot

Four original word problems in two pairs: a one-time membership fee plus monthly
payments, and one setup fee plus a price per poster. A learner commits the meaning
of x, three amounts and an equation structure before calculation. The next item
starts without answers or a model carried over. No AI, score or persistence.

## Counterexamples

- Correct arithmetic does not rescue an incorrect model. Browser replay used
  `(40 + 24)x = 184` and `2.88`: feedback accepted numerical consistency with
  that model while explicitly rejecting its repeated joining fee.
- A correct model can have an incorrect numerical result. Replay used
  `25 + 18x = 151` with 6: model agreement and numerical disagreement were
  reported separately; the authored result is 7.
- A matching final number does not fix the wrong variable. Replay defined x as
  total dollars for the poster problem, then entered 24. The number matched the
  target, but feedback rejected the meaning of x and withheld interpretation of
  arithmetic as an answer to the quantity question.
- A fully correct new poster model `12 + 4x = 116` with 26 produced agreement
  with both the model and the target.
- Empty input is not zero. The strict decimal parser rejects empty, whitespace,
  coercion strings and non-finite values. Browser replay confirmed the empty
  model guard and the positive-rate guard; no division by zero proceeds.
- Rounding tolerance applies only to numerical consistency with the learner's
  model. Integer target quantities require exact numerical equality, so 6.01
  is not accepted as 6 months.
- Free working may be nonsense even when numbers match. It is retained for
  self-review and explicitly ungraded; feedback does not claim to verify each
  algebra step.
- All amounts could match while structure is wrong. A separate structure row
  makes a repeated or omitted one-time fee explicit.
- Main and transfer radio order differ, so reusing an option position is not a
  strategy. Both scenarios reset all fields on transfer.
- Narrow cards must not repeat the Math Forensics overflow bug. They use an
  adaptive minimum width and text wrapping. Amount fields stack below 700 px.
  The final review had no document overflow at a 390 px viewport.

## Verification and limits

Manual browser replay covered both contexts, wrong model/correct arithmetic,
correct model/wrong result, wrong variable/matching number, correct new problem,
guards, transfer reset and stage-heading focus. Local TypeScript, targeted ESLint,
production build and 21st component review passed. CI/production results belong
in HANDOFF after release.

Only linear one-time-plus-rate models are covered. This is a structured builder,
not a symbolic parser for arbitrary equivalent equations. Agreement with the
author's fields and two examples do not establish stable skill or SAT score gain.
