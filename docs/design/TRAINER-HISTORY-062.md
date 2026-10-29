# ASHYQ My Lessons concept, 2026-10-27

Visual proposal only, product not edited. Live /trainers/history inspected.
Current available state is empty: no saved lessons for this browser. It includes
IELTS/SAT filters, only-local-records switch, account/guest browser-scope storage,
no automatic sync and no stored audio. Filled mock records are invented and
explicitly labelled, not actual client data.

Territories considered:
A. Process bookmark: exact paused stage anchors one next action.4/5/5/3.
B. Formal chronological receipt index: very scan-friendly but secondary action
hierarchy too flat for unfinished work.3/4/5/4.
C. Educational notebook spread with before/after answers: expressive but risks
showing private text before the user chooses to open a saved record.4/3/4/3.
Pick A; keep B's restrained history rows below.

Concept: continue from the exact remembered place, without pretending completion
means mastery. Signature: selected checkpoint marker carries continuously into
the existing restore area, with no auto-load or overwritten work. Stage rail is
location, never skill percentage. Motion verb: return. Idle accent only on the
current bookmark, no changing stage labels, no fake result animation.

Normal-width Onest/system type, warm offwhite/ink/scarlet,28px card, quiet history
rows and one dominant resume action. Same real header/logo at implementation.
Mockup logo lettering is approximate. Phone first; desktop shows resume beside
history while preserving readable order.

Respect current explicit restore contract: link to saved-work, then user presses
Continue Saved; do not claim one tap auto-restores. Disclose same-browser retention
up front; advanced export/import below. No automatic device/account migration,
cloud sync, provider call, score, diagnostic/profile057 or source schema changes.
No reveal of saved free text on the history landing without a user action.

Empty state: title My lessons, simple explanation that saving is opt-in in the
trainer; primary Choose a trainer, no demo records shown as real history, no zero
mastery percent and no invented recommended weakness. Loading/error/corrupt and
no matching filter results remain distinct.

Need user concept approval before product claim/edits. If approved, reconcile
HANDOFF/Git/worktree owners first. Current-history semantics require fresh source
inspection before implementing record sorting, outcomes or import/export UI.
This static proposal does not verify motion/accessibility/FPS or award level.

## Approved implementation062

User approved the concept and implementation on2026-10-27. The text above
records the proposal; this section supersedes its preview-only boundary.

Implemented scoped history entrance, actual latest unfinished checkpoint card,
real saved-stage rail (neutral dots, no mastery percentage), explicit first-answer
label, compact timestamped history, validated outcome labels and original full
outcome details. Native trainer links/export/manual restore and storage schemas
remain unchanged. Unknown stages get a truthful bookmark caption instead of a
fabricated rail. Final motion is a quiet current-marker pulse, not a cross-page
morph. Desktop retains one readable column rather than the proposed split.

Loading, true empty, filtered empty, valid empty record, corrupt raw record and
storage-unavailable states remain distinct. There are no seeded demo records or
new provider/cloud/account behavior in production.

## Verification before PR

- Existing local lint and production build passed (157 routes); git diff --check
  passed. No tests added or manually executed.
- Actual CUA UI: clean-origin empty history; save opt-in; synthetic Reading first
  answer FALSE with evidence and medium confidence; phase review saved; native
  history link shows actual answer/stage; SAT hides IELTS and explains filtered
  empty; return All; native saved-work link focuses existing restore button;
  explicit Continue Saved restores the review and original answer/evidence.
- Actual320/390/1280 viewport geometry: no positive horizontal overflow.
  Manual pause and returned history observed; browser warning/error log empty.
- Independent source review history062_source_review: no actionable findings;
  validated snapshots, account/guest boundaries, history-only export, native
  restoration, honest statuses and motion lifecycle reviewed without edits/tests.
- Independent actual-PNG visual review history062_visual_review: no blockers;
  FALSE is an answer rather than a verdict, stage and restore copy clear, no
  clipping. Primary resume CTA is below initial viewport on390px and reachable
  by normal scroll.
- Local evidence .data/history062/{empty-mobile,filled-mobile,
  filled-action-mobile,narrow,desktop}.png and lint/build logs.

Limits: browser viewport emulation is not physical-iPhone/FPS proof. Runtime
system reduced-motion, corrupt/unavailable storage and every imported variant
were not manually forced. Their source handling was reviewed. Trainer033 and
Diagnostic/Profile057 gates remain unchanged. Existing exact-head CI and live
production verification still required before claiming publication.
# Additional acceptance062

Actual local UI acceptance after feature commit (product source unchanged):
- Completed Reading via correct initial/repair and intentionally incorrect new-text answer.
- History removes unfinished resume, shows repeat queue and red repeat-review status.
- Expanded preserved PracticeOutcomeView shows5 matching checks and1 new-text-answer mismatch, original advice and limitations.
- All-records toggle lists11 native trainer articles; SAT5, IELTS6.
- Tab navigation gives visible solid outline on storage disclosure.
- Additional independent visual review of320/1280/completed390 screenshots: no blockers; completed status is truthful and narrow rail contained. Detailed result rows were inspected in DOM, not certified visually by critic.

No new code, tests or test-suite runs. Existing exact-head CI pending.

## Release2026-10-27

PR184 feature f756cb9d82ff5aafdd8d60ffd7e05e03fc48a99b passed existing CI
40400725939 SUCCESS:164/164 basic checks, full LMS/season/token gates,
72 responsive accessibility audits and36 Lighthouse routes. No new/manual tests.
Merged b8390021287da49f671dd037e9463da3f4c693fe; product source diff against
reviewed feature is empty. Vercel Production7343834400 SUCCESS.

Canonical https://ashyq-diagnostic.vercel.app/trainers/history returned HTTP200
and new entrance copy. Actual public browser reached honest empty state after
loading,390px no positive horizontal overflow, all-records SAT filter5 articles.
Production screenshot: .data/history062/production-mobile.png in dedicated worktree.
Filled-state screenshot uses only synthetic local UI answers, not production data.

Next safe task: user feedback or separately approved next-section concept.
No new launch-readiness claim for trainer033/provider/real-account/RLS gates,
and no changes to diagnostic/profile057 ownership.
