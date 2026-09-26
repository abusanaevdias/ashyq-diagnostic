# Adversarial review: synthetic Writing calibration worksheet

## Method

Reviewed the teacher flow against the promise that a whole-essay judgment can challenge authored practice estimates without turning one opinion into an official IELTS score. Used the two synthetic cases and the official [Task 2 descriptors](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf) as the source for criterion scope. No real student answer was entered.

| Failure hypothesis | Observation and resolution |
| --- | --- |
| Seeing the authored 5.5 → 6.0 estimate first anchors the teacher. | The initial page calls the essays A and B and hides authored values. The comparison button stayed disabled until all eight judgments were complete. |
| A fabricated quote can make a judgment look evidence-based. | A browser pass entered a sentence absent from version A. It displayed a mismatch warning and left progress at 0/8. A copied excerpt from the essay then counted as evidence. |
| The teacher reviews only one corrected paragraph. | The page shows every paragraph for each version, asks for a whole-response rationale for every criterion, and says the quoted excerpt is an anchor rather than the entire basis for judgment. |
| "Insufficient evidence" is interpreted as agreement with the authored score. | A browser pass recorded an insufficient Lexical Resource judgment. The comparison displayed "Нет вывода" rather than a match or disagreement. |
| A divergent teacher judgment is shown as a teacher error. | Task Response staying flat and grammar declining were labelled "Пересмотреть кейс"; the teacher's values remained visible and unchanged. |
| A pilot teacher loses their notes because there is no persistence. | The page warns about page-only state and confirms before clearing or switching cases. It offers local JSON download, clipboard copy, and a read-only JSON field for manual copy. Clipboard and manual display were verified in the in-app browser; the browser did not surface a download event, so download behavior remains unverified there. |
| A narrow phone view clips the long criterion names or JSON. | At 320 px, the page and revealed summary had `documentElement.scrollWidth` 305 px, within the viewport. Criterion cards and the JSON field remained readable. |

## Limits before real essays

- The worksheet evaluates only two authored synthetic cases and keeps data in the open tab. One teacher's provisional values are an early content review, not calibration or inter-rater agreement.
- The comparison checks direction only. A matching direction does not prove the numerical practice estimate is valid.
- JSON export can contain whatever the teacher types; the UI explicitly asks them not to paste real learner work. Real student data needs a separate authorization, privacy, retention, and access design.
