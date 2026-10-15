# FREE-LIBRARY-UX-034

## Definition of done

- All 42 chapters have selectable stages and working direct links/back navigation.
- Original PDFs, 198 sections, all 322 questions and source keys remain intact.
- Device-local answers and checked states survive reload and chapter navigation; grades are recomputed from current source keys. Incorrect, correct and ungraded states differ in text and color.
- Invalid/stale storage is recoverable without silent overwrite; unavailable/full storage reports the limitation and preserves the editable draft for copying.
- Examples distinguish prompt from essay. Reviews use the same essay and only highlight sentences supported by literal source matches. Unmatched comments explicitly concern the whole text.
- Practice has relevant source material in-page; English writing production instructions explicitly require English. No automatic semantic/band scoring.
- Approval pack shows actual DRAFT student and teacher material without changing release status.
- Focused unit/browser/source checks, responsive/a11y review, lint/typecheck/build pass before release.

## Loop 1

Root causes: checked flag incorrectly rendered as correctness; React state had no durable backing; all source sections were open concurrently; essay and prompt shared undifferentiated paragraphs; criterion labels gave no actionable reading instructions.

21st search attempted for lesson navigation/annotated review: service returned HTTP401. Implement using inspected project tokens and existing library primitives; no hosted generation claimed.

Device storage is local to this browser/site, visible to other people using the same browser profile, and not a cloud backup. Concurrent tabs use a synchronous compare before write; this is not a transactional cross-device collaboration system.


## Loop 2: adversarial review

- All 42 chapters / 198 stages were opened in the actual browser: exactly one source stage is visible. Direct hashes, chooser, example → review and Back/Forward work.
- Source audit: all 198 sections preserve original PDF words; all three PDF hashes and page counts match. Source JSON/PDFs unchanged.
- All 322 questions still parse: 148 source-keyed automatic, 174 comparison. Open answers never contribute a correct/incorrect result. 154 English production prompts are explicit; remaining reflection questions allow Russian explanation and English quotations/edits.
- All 30 full examples distinguish task and essay. 27 separate reviews and three embedded Task 1 report reviews provide sequential comments. Sentence highlighting preserves the exact essay, with literal evidence or explicit whole-text scope.
- Browser tests: wrong ×, correct ✓, ungraded ○; edit invalidation; immediate reload and leave/return; corrupt data recovery; blocked/quota storage; two-tab conflict and explicit reload. Reset uses removal, so a full quota cannot falsely prevent deletion; failed deletion retains data and reports failure.
- Initial mobile review placed the note below the whole essay: product interaction defect, fixed by inserting the note immediately after its associated paragraph on narrow screens, with local previous/next controls and reduced-motion support.
- A test expected source capitalization via innerText despite the existing CSS uppercase transform: wrong assertion, corrected to textContent. Source wording stayed unchanged.
- Device writes are synchronous, bounded and compare the previously read record. Other-tab updates require explicit loading and cannot silently change the current question. This is not a cross-device backup or a transactional collaboration service.
- Corrupt or source-stale records stay intact and disable editing until explicit reset; raw data remains available for copying. The cache is browser-profile/site scoped, not an account-private store; the UI/privacy notice discloses shared-device visibility and deletion.
- No semantic/band grader, provider activation, credentials, schema/RLS, source publication or teacher approval was added.

## Reproduce

- `npx tsx scripts/prepare-trainer-approval-pack.ts` prepares local HTML and Markdown for all 108 DRAFT modules, without approving them.
- `npx tsx scripts/library-practice-unit-check.ts` includes the new source/presentation/storage suite.
- `BASE_URL=http://127.0.0.1:3050 npx tsx scripts/library-practice-e2e.ts` includes the 42-chapter browser audit, device persistence, failures, two tabs, 320/390/768/1440 overflow and axe checks. BASE_URL may point to the verified canonical release; browser storage uses isolated synthetic responses.
- `npx tsx scripts/free-library-check.ts` checks all chapter HTTP/SEO/SSR anchors and PDF digests.
- `python scripts/free-library-source-check.py` requires pdfplumber; bundled workspace Python has it. It checks original source words and all three PDFs.
- `npm run lint`, `npm run typecheck`, `npm run build`, and `21st review src/components/library src/app/library src/lib/library-presentation.ts src/lib/library-progress.ts`.

Screenshots and generated approval material are local artifacts under `artifacts/library-ux-034/`; they are not public bank releases. Mobile/desktop audits are browser emulation, not physical-phone acceptance. Existing TRAINERS-COMPLETE-033 external acceptance remains separately BLOCKED; this task does not imply its completion.

Production-build repeat passed all42/198 browser, storage and SEO/source gates. Source token audit detected its terminal border-radius parser convention; added the final semicolon without changing computed CSS. Token and final exact-head CI acceptance are tracked separately from the earlier local checks.

Late adversarial reproduction: a clean cache snapshot survived SPA navigation while another tab changed disk data; browser Back showed the old answer without a notice. Subscription now refreshes clean snapshots on remount while retaining unsaved/conflicting drafts. A permanent real-browser SPA-away / second-tab-edit / Back regression covers the root cause. Separate source comment fragments separated by commas now each match their cited sentences; maximum legal field sizes remain valid even with six-character JSON escapes.


CI38761826584 correctly blocked release on the new cross-page Back regression. Actual Next16.3.5 reproduction: native same-document fragments create `history.state=null`; after leaving via a Next link, Back changed the URL but left the library catalog rendered. Root fix preserves this route's previous opaque history state for same-route fragments, without depending on private Next field names or changing another route's entries. The stricter Back/Forward checks await actual route/stage rendering, not just a changed address. Fresh production-build hash-state/cross-page Back probe and full42/198 browser suite now pass, including the second-tab edit while the first lesson is unmounted. No failed head was merged. Apple concept and teacher brief are separate local visualization artifacts requested later by the user, not product design changes.

## Released 2026-10-15

PR154 merged verified feature d2a260f0a3c1ebd78f14725df198bd6112f34510 as 78cfc3927a1378a954284936cb918697360ca9b8. Full exact-feature CI38765357170 succeeded in13m18s; production deployment7098014746 succeeded. The merge tree matched the verified feature tree.

Canonical https://ashyq-diagnostic.vercel.app acceptance passed: all42 chapters,198 sections,322 exercise IDs,24 Task2/6 Task1 texts, source digests, HTTP/SEO/sitemap/downloads/404. Representative real-browser acceptance passed wrong cross/correct check/ungraded state, reload persistence, exclusive stages, keyboard Enter, English instruction, all three cited grammar sentence highlights, four viewport widths and no external answer POST; zero page errors. Privacy disclosure was confirmed live. Local all322-control and all198-stage browser audits supplement these canonical checks; synthetic interface checks do not establish learning gains or human content approval.

The separate Apple concept and teacher brief are local review artifacts; no Apple redesign was deployed. The108 DRAFT modules still require actual human review, and TRAINERS-COMPLETE-033 remains separately blocked. Documentation closeout changes no product source.
