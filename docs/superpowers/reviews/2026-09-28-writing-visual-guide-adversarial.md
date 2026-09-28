# Writing trainer visual guide: adversarial review

Date: 2026-09-28. Scope: public synthetic IELTS Task 2 practice and its landing page.

| Challenge | Failure if ignored | Resolution / evidence |
|---|---|---|
| Can the landing illustration reveal a case answer before the learner tries? | The old screenshot and first draft of the illustration showed `believes → believe` from case 01. | The illustration now uses a separate `The bus go → goes` example and states that its phrase is not taken from either exercise essay. The real practice still hides error marks until checking. |
| Does stronger highlighting wrongly declare an unrecognized learner rewrite incorrect? | A draft outside the exact authored answer could be labeled “missed” despite being valid English. | `review` now reads “Нужен учитель” beside the sentence, retaining the existing teacher-review explanation. Only untouched annotated issues read “Пропущено”; exact accepted answers read “Найдено”. |
| Could color alone carry the result? | Red/green meaning would be inaccessible and ambiguous on mobile. | Revealed sentences have explicit text badges; marked words are underlined, and feedback cards repeat the label and explanation. The badge is in the accessible button name. |
| Do stylized diagrams claim to be real screenshots or interactive controls? | A visitor may expect the exact displayed layout or try to click the illustration. | The section calls them enlarged simplified schemes. Illustration internals are `aria-hidden`, while the adjacent step copy explains the real actions and the actual CTA opens the exercise. |
| Does the mobile layout require sideways scrolling or hide the mistake? | The previous screenshot forced horizontal scrolling and reduced the target text. | The diagrams stack at narrow widths with no fixed image minimum. Browser review at 390px showed the selected mistake word and “ПРОПУЩЕНО” badge at normal reading size. |
| Does feedback become an official IELTS assessment? | Strong red framing could be mistaken for calibrated scoring of a free essay. | This change affects only authored synthetic practice. Existing provisional-score disclaimer and teacher-review boundary remain. No new scoring or AI call was added. |
| Can the learner see the new highlighting immediately after pressing the button below a long essay? | Strong color is ineffective if the view stays at the bottom of the page. | On first reveal, focus and scroll move to the first missed issue, then to another marked issue if nothing was missed. This happens only on the transition into the checked state. |

The grammar highlight identifies exact authored substrings in four synthetic sentences. It is not a general grammar detector, and an alternative rewrite still requires teacher judgment.
