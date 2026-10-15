# Publication of reviewed trainer materials

The108 source modules remain DRAFT. No human approvals were supplied or generated. `src/data/trainer-publications/release.json` currently contains an empty release list.

## Source-bound approval

Publication uses a separate repository receipt with the exact batch, version, content hash and unit ID. Original draft files and saved source identities stay unchanged. A browser review recommendation does not modify this receipt and cannot publish material.

The manifest records an immutable preparedAt ISO timestamp (null only for an empty list). Each receipt records the reviewer, ISO timestamp no later than preparedAt, a reference to the actual human approval evidence, and five explicit reviewed checks: instructions, answers, acceptable alternatives, own repair and a different transfer task. Parser validation checks the shape and source integrity. It cannot establish whether a claimed human review happened; the deployment operator must inspect its evidence. Do not generate an approval on behalf of Dias.

Short-Writing sources reuse other source modules as a second task. The entire reachable companion chain must have its own approval receipts. One approved source must not expose an unapproved companion. Changes to a batch content hash invalidate all receipts tied to its old hash; decisions are not silently migrated.

## Commands

```powershell
npx tsx scripts/trainer-bank-publication.ts audit
npx tsx scripts/trainer-bank-publication.ts validate C:\path\supplied-human-approvals.json
npx tsx scripts/trainer-bank-publication.ts prepare C:\path\supplied-human-approvals.json
```

`audit` reads bundled sources and lists exact sources awaiting approval. `validate` changes no files. `prepare` validates a separately supplied receipt and writes only the repository release input. It does not deploy, grant account roles, publish learner work or certify difficulty. Review the prepared diff and verify the human evidence before releasing it through the existing CI/merge/deployment protocol.

Unknown/stale sources, duplicate receipts, missing checks, wrong formats and incomplete companion chains fail closed. CLI validation rejects a preparedAt in the future; browser eligibility uses the fixed manifest date and does not depend on student device clocks. A corrupt bundled publication manifest releases no sources. LocalStorage values, query flags and role metadata are not publication inputs.

## Delivery and evidence boundary

Directory, direct practice entry, Speaking entry and next-task navigation now consume the compiled publication registry. Public/student practice uses only released exact sources; teacher/author rehearsal still uses the full source bank. Public catalog discovery appears only when there are published sources. Existing classroom/own-essay/AI authorization is unchanged. Publication receipts grant no LMS account roles.

Unavailable or withdrawn source versions can still offer an explicit opaque download of the current browser actor own exact local record. This reads one key only after the user clicks, does not reopen exercises or grade the content, and does not write or migrate stored work. Storage changes require a fresh check; damaged bytes are preserved in a text recovery file. Actor partitions remain browser conveniences, not authentication.

Tests use an isolated copy under artifacts/trainers-complete-033/publication-fixture-site with38 explicitly synthetic released sources and70 unreleased sources, including the four new Reading modes. The actual repository receipt remains empty. The fixture has no copied environment/credentials and must never be deployed or committed. Reproduce it with prepare-trainer-publication-fixture.ts and a localhost-only next dev server; set TRAINER_PUBLICATION_FIXTURE=1 only for the browser test script. This variable is not consumed by the application and cannot bypass publication.

Current tests prove receipt/route/filter/navigation/recovery behavior with synthetic approval and LocalDemo role fixtures. Actual human approval, publication activation, methodology and difficulty calibration, Supabase classroom acceptance and provider/device quality still need separate evidence.
