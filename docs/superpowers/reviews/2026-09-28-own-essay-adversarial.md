# Own essay workspace — adversarial review

| Counterexample | Finding and resolution |
| --- | --- |
| A newly registered account has the `student` role but has not joined ASHYQ. | Role alone was insufficient. The editor also requires membership in an IELTS class; the browser check with all memberships removed showed the locked state. |
| Public or demo auth on a live site exposes a real-essay editor. | Production code refuses the editor unless the build uses Supabase auth. Public visitors keep the synthetic practice route. |
| The interface promises that it will find missing mistakes or calculate an IELTS band from uncalibrated free text. | The entry, exercise and report explicitly say that these capabilities are unavailable for the own-essay workspace. No numeric band is shown. |
| Moving backwards from Grammar silently replaces the learner's edited draft with the original. | The first step no longer has a Back button. Other steps retain the current working version. Starting over requires explicit deletion confirmation. |
| Refresh discards a long essay. | Prompt, original, working copy, notes and snapshots restore from sessionStorage for that user in the same tab. Export is available during the exercise. Failure to write tab storage is announced. |
| A shared browser exposes a previous student's draft to the next account. | Storage key includes the authenticated user ID; the editor only mounts after role and class checks. The UI offers explicit delete and warns about shared devices. Separate-account restoration was not exercised against hosted Supabase. |
| Text is accidentally sent to an AI provider. | The component has no `fetch` or provider call; local browser walkthrough recorded zero POST requests while completing all four steps. |
| Mobile writing editor overflows or hides the final action. | Browser walkthrough at 390px and 320px had no horizontal overflow. Four steps, report and download action were reachable. |

Remaining: provider permission and whole-essay teacher calibration are unresolved; the own-essay flow is a private self-revision workspace until those gates are resolved.
