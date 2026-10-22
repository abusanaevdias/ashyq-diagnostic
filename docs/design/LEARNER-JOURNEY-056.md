# Learner journey 056

## Decisions

- Keep the approved ASHYQ cream/ink/red identity and Apple-style familiar controls.
- Reuse the existing scoped, validated, opt-in checkpoint store. No new persistence
  format, tracking store, automatic restoration or scoring is introduced.
- Home and trainer entry show a saved activity and its stage when a compatible
  checkpoint exists. Unfinished work takes precedence; timestamps order activities.
- The native need selector suggests an authored practice entry, with a reason and
  an explicit start action. It does not infer a learner's ability or diagnose them.
- Existing repeat candidates become visible at entry. One shared latest-completed
  selector orders imported history for both the queue and result cards.
- History result checks show distinct symbols and written statuses, including
  unknown/ungraded outcomes. Model matching is not a full-text grade or band.
- Saved-work links anchor to the existing explicit restore button. One-shot actor
  guard avoids focus/scroll changes on subsequent autosaves. Sticky-header offset
  preserves anchor context. Existing busy/CAS/dirty-work/exit guards remain.
- Newcomers do not see invented progress. Shared-device/local-storage limitations
  remain explicit. Audio remains excluded; device transfer uses the existing file.

## Review

Independent adversarial source review found two issues: imported history order
could disagree between the queue and history cards; saved-work anchor needed a
sticky-header offset. Both were corrected. Follow-up source review found no
remaining blocker. This is source evidence, not independent runtime acceptance.

Initial actual CUA390px path: guided Reading entry, explicit local save, wrong
TRUE/S3 response, review with separate answer/evidence statuses, home continuation
showing Review, native saved-work entry, explicit restore to the same TRUE/S3
review. The initial long choice list was replaced with a native select for mobile.
Final build, current native-select path and exact-head CI are recorded in the PR.
No tests added or manually run; existing automatic PR workflow remains unchanged.

## Separate launch gates

This release does not approve DRAFT material, activate an AI provider, calibrate
IELTS/SAT scores, or certify actual Supabase isolation. Teacher methodology review,
real teacher/student/RLS pilot and physical-phone audio acceptance remain the
separately recorded launch gates. Browser viewport emulation is not a physical
phone or a verified learning-outcome study.
