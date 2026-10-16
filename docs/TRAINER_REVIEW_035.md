# Trainer review corrections 035

## Evidence and scope

Received `teacher-review-report.md`, dated 2026-10-15, SHA256 `1bea3ae160a50906079f3ef9b02669ab1bfb25d69e111f7c11e9e6b865e07981`. The document explicitly identifies its reviewer as ChatGPT/Codex, not a human teacher or examiner. Its108-row table contains49 recommendations for a teacher-mediated pilot,33 revise and26 defer. These are AI review observations, not authenticated human approvals and not public publication receipts. No decisions or attestations were imported.

The report identifies the exact previous export: HTML `c946b0509013dd114bdff185d60294e9ff2f7cbc4098cc663e99c7844c3243a5`, MD `d55576fb85fbf8e2719dbb6f1d7df3a193d780b23868084e8f6ddc9d35eb244b`. Both matched the actual supplied local files. The report inspected those exports, not the working interactive site. It does not establish regressions in the separately released42-chapter/322-question library.

## Root causes and corrections

| Finding | Authoritative evidence / action | Remaining acceptance |
|---|---|---|
| F01 incomplete Reading/Math/Task1 inputs | Export had serialized only hand-authored Markdown, dropping complete structured B inputs/options/diagrams. New export uses validated runtime exercise adapters and includes full A/B statements, options, numbers, ordered process stages and map positions. No source reconstructed from a key. | Independent resolution of the complete new packet; schematic text is not a physical-device chart-legibility check. |
| F02 B inside teacher key | Separate A/B task and key disclosures plus a distinct student-only HTML/MD with no keys/scripts/model answers. Math method working moved entirely after the attempt. Static packet explicitly has no input persistence; teacher mediates timing. | Interactive freezing/repair/B is checked separately; static HTML is not advertised as a self-paced trainer. |
| F03 D01-D24 skill transfer | New editions embed an explicit B and target in each of24 modules, covered by the same fingerprint. Ten B contexts newly authored;14 adapt existing own-bank contexts with prior source/version/hash in reviewer notes. A is preserved exactly. Each/number/advice/information/who/modal/article/comparative targets have rule-matched B; combine/argument targets state the intended reasoning relation. Frozen A reflection is shown before independent B; choices remain hidden until the first draft is frozen. | Local implementation and verification; exact release and actual human A+B wording/alternative/target acceptance remain required. A different context or completed attempt does not establish learning transfer or unseen exposure. |
| F04 D11 dangling modifier | Corrected the accepted alternative to an explicit passive subordinate clause and active engineer subject. Main already-correct key preserved. | Human wording/meaning review. |
| F05 missing raw Writing B | Exact original B text exists in structured rounds and is now exported before its key. Language-only version is explicitly still argument-weak. | New packet should be solved without key exposure. |
| F06 W03 overclaim | Removed the accidental universal-understanding guarantee from all three current editions of that essay; retained its separate deliberately weak target argument. Old edition archived unchanged. | Human review of revised model and intended weak target. |
| F07 W06 response to replace most | Introduction in all current essay stages now directly opposes replacement of most classroom teaching while supporting wider digital use; separate weak argument preserved. | Human task-response review of full new edition. |
| F08 optional edits and noun check | Explicit clarity-vs-error explanations; original what needs change / burden to wording accepted as alternatives; check as a count noun explained and a final check accepted. Runtime note prevents counting every target as an error. | Human alternative-answer policy review; no semantic scorer added. |
| F09 W02 dangling claim reference | Removed residual sentence from all current essay stages without changing its target argument. | Human cohesion review. |
| F10 RW04/RW08 capitalization | Four transition blanks now followed by lowercase words; exact evidence synchronized. Keys unchanged. | Human logic review. |
| F11 RW06 pronoun | Explanation distinguishes possessor Aron from noun project. Key unchanged. | Human wording review. |
| F12 M11 comparison direction | Explanation contrasts Tuesday decrease from Monday (base150,20%) with asked Monday excess over Tuesday (base120,25%). Numeric key unchanged. | Human independent solution. |
| F13 missing Listening assets |32 existing exact full/segment WAVs copied into portable export; scripts stay in keys, segment help after initial attempt.16 full recordings in student-only copy. SHA/bytes checked against actual audio manifests. | Actual teacher listening and physical output quality remain unverified; decoding/playback does not certify intelligibility. |
| F14 L06 answer in format example | Neutral7:40/17:05 examples replace answer-bearing9:15/14:30 examples. Real keys preserved. | Independent listen without script. |
| F15 table vs chart model label | Export explicitly presents numeric sources as tables and labels its table-noun model adaptation. Runtime charts and original numeric values unchanged. Map positions/process order provided from actual diagram data. | Human new-packet check; original site chart presentation remains separate. |

## Version and persistence boundaries

Changed batch editions:01 2.0→3,03 1→2,04 1→2,08 1→2,10 2.0→3,11 1→2,13 1→2. All seven preceding JSON files archived byte-for-byte and registered for source-bound review/work recovery. All changed active content fingerprints recomputed over `JSON.stringify(units)`. No old decision, answer record, recommendation or band migrated to new sources. Unchanged batches/media remain unchanged; total108 DRAFT modules, released0.

## Verification

`npx tsx scripts/prepare-trainer-approval-pack.ts` generates teacher and student HTML/MD, a source-identity/file-hash manifest and32 local audio assets. `APPROVAL_OUTPUT_DIR` optionally selects a separate output directory. The entire directory is needed for offline audio.

`npx tsx scripts/trainer-approval-pack-check.ts` inspects all108 normalized exercises for complete supplied A/B inputs, keys separated from student content, source-specific regressions, all active/archive hashes and all32 actual audio bytes/hashes; browser checks cover108 B disclosures,32 teacher/16 student audio controls, one actual file playback, key isolation, search,320/390/768/1440 overflow and axe. This is interface/source evidence, not human pedagogical approval.

Initial adversarial checks found that the new export lacked a main landmark and that Math method working would precede the independent attempt; both corrected before acceptance. The first browser harness used browser.newPage instead of explicit newContext, which axe rejects; corrected the harness. L06 B wording now explicitly says “Запиши” while retaining neutral-format guidance.

Focused existing content/state/publication/source checks and final lint/typecheck/build/browser/CI/release results must be recorded at their actual terminal state. Full original goal remains incomplete: F03 verified release, human review, real-provider evaluation, authorized classroom/RLS and physical device/human-speech acceptance remain separate. User subsequently approved Apple implementation under separate036 ownership.

## F03 implementation loop

01 v3→v4 and03 v2→v3 archived their exact preceding bytes. No learner state schema/key or attestation migration. Legacy drills without embedded B retain the old guarded companion behavior; malformed/nested/incomplete embedded B fails closed, never selecting an unrelated task. Current embedded pairs need one human receipt covering both rounds and the full transfer checklist; legacy cross-module pairs still require each separately approved source. The real publication manifest remains empty.

New D15-B deliberately retains correct `have to check` beside `must wear`; D16-B requires both `an hour` and `a European`; D18-B retains correct `more convenient` beside `shorter`. This checks against superficial removal/replacement rules. English production is explicit; reflection may be Russian. Correct free text can remain unchanged, and no exact-match semantic grade is added.

`trainer-writing-transfer-035-check.ts` checks all24 source-bound pairs, exact original A preservation, new targets/B identities, distinct contexts, English instructions, three correct-option positions, rule counterexamples, malformed nested B rejection, two-round export and zero publication. Existing Writing record and full UI gates cover frozen drafts, repair, prior exposure/help, checkpoint/history/reload and UTF8 limits. The new packet is generated separately under `artifacts/review-035/f03-teacher-packet`; do not replace the earlier supplied review edition silently.
