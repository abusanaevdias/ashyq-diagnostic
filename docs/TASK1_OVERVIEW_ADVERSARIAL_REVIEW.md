# Task 1 Overview Lab: adversarial review

## Scope

Two original, synthetic line charts. A learner selects three main features,
writes an overview, links selected authored claims to data, repairs an inaccurate
paragraph, writes and revises a full response, then repeats on a fresh chart.
No external AI, student data, automatic free-text grade, band, or saved account
progress. Refreshing the page clears the work; this is disclosed before starting.

## Counterexamples and fixes

- A true data point is not necessarily a main feature. Browser replay deliberately
  selected the valid 2018 bus value with two main claims: feedback showed 2/3 main
  features and 3/3 correct evidence links, separately.
- Clearing a select must not turn an empty value into answer zero. `updateChoice`
  deletes the record entry. Browser replay selected a value, cleared it and
  confirmed the missing-evidence guard remained in place.
- Free text cannot be graded by matching selected claims. The overview, repaired
  paragraph and full answer explicitly require learner comparison; authored
  selection results are reported separately.
- A second draft may be unchanged. An explicit acknowledgement is required;
  browser replay confirmed the unchanged-text guard and the final report saying
  that the text was preserved, rather than claiming improvement.
- Identical option positions could reward memorisation. Main-claim order and
  inaccuracy-category order differ on the transfer chart. Its state starts empty.
- Connecting observed points does not establish causes or an exact crossover
  date. Chart notes and feedback explicitly reject these inferences.
- An overview sample is only one valid formulation. Samples are described as
  examples, not sole acceptable answers or scored exam scripts.
- Small chart labels become unreadable on phones. SVG labels use a larger font;
  the 390 px viewport showed readable axes and legend without horizontal overflow.
  Exact data are also available in a table. Series differ by dash pattern and
  colour, not colour alone.
- The transfer review initially called the learner's text a first overview.
  Renamed it to the overview before review to avoid confusing chart identity.

## Evidence

Manual browser replay covered both charts through the final comparison, an empty
selection guard, select clearing, incorrect main-feature choice with valid data,
unchanged revision, transfer reset and stage-heading focus. The final report
preserved both learner texts and did not assign a band. The full model answer is
hidden until after revision and transfer.

Targeted lint, TypeScript, production build and 21st review passed locally.
CI and production verification are recorded in HANDOFF after publication.

## Limits

Only two line charts; no bar, table, process or map tasks yet. Closed selection
checks can establish agreement with authored labels, not the quality of a free
response or stable transfer. The approximate word counter is not an official
IELTS counter. Short practice drafts are accepted and explicitly unscored.
