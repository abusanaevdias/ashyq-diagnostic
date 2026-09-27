# Adversarial review: writing pilot entry from teacher classes

The entry point is the existing `/teacher` dashboard. It links to the synthetic writing trainer and teacher calibration worksheet with static paths. It does not pass a class ID, submission ID, answer text, or score.

| Failure hypothesis | Browser observation and guard |
| --- | --- |
| A teacher cannot discover the pilot without a URL. | After demo teacher sign-in, the `Пилот райтинга` section appears below class cards with distinct `Путь ученика` and `Лист преподавателя` links. The calibration link opened `/writing/calibration`. |
| A student sees teacher pilot navigation in the class dashboard. | After demo student sign-in, `/teacher` showed `Недостаточно прав` and no pilot cards. Restored demo teacher sign-in afterward. |
| The teacher mistakes the pilot for grading actual class submissions. | The section states that both essays are invented and no learner answers or class scores are transferred. The links contain no class context. |
| The teacher cannot return to classes after opening calibration. | The calibration header now has `← К классам`; browser navigation returned to `/teacher` with both pilot cards still visible. |
| Two large cards overflow a narrow display. | At 320 px, document width was 305 px, with both cards inside the viewport. |

The destination routes remain synthetic and noindex, but they are directly reachable by URL; the teacher role guard applies to the dashboard entry point only. Do not treat these links as privacy protection or use the pages for real learner answers. The browser pass used local demo accounts, not a production Supabase teacher session.
