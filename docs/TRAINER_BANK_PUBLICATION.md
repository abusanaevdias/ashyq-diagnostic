# Publication of reviewed trainer materials

The100 source modules remain DRAFT. No human approvals were supplied or generated. `src/data/trainer-publications/release.json` currently contains an empty release list.

## Source-bound approval

Publication uses a separate repository receipt with the exact batch, version, content hash and unit ID. Original draft files and saved source identities stay unchanged. A browser review recommendation does not modify this receipt and cannot publish material.

Each receipt records the reviewer, ISO timestamp, a reference to the actual human approval evidence, and five explicit reviewed checks: instructions, answers, acceptable alternatives, own repair and a different transfer task. Parser validation checks the shape and source integrity. It cannot establish whether a claimed human review happened; the deployment operator must inspect its evidence. Do not generate an approval on behalf of Dias.

Short-Writing sources reuse other source modules as a second task. The entire reachable companion chain must have its own approval receipts. One approved source must not expose an unapproved companion. Changes to a batch content hash invalidate all receipts tied to its old hash; decisions are not silently migrated.

## Commands

```powershell
npx tsx scripts/trainer-bank-publication.ts audit
npx tsx scripts/trainer-bank-publication.ts validate C:\path\supplied-human-approvals.json
npx tsx scripts/trainer-bank-publication.ts prepare C:\path\supplied-human-approvals.json
```

`audit` reads bundled sources and lists exact sources awaiting approval. `validate` changes no files. `prepare` validates a separately supplied receipt and writes only the repository release input. It does not deploy, grant account roles, publish learner work or certify difficulty. Review the prepared diff and verify the human evidence before releasing it through the existing CI/merge/deployment protocol.

Unknown/stale sources, duplicate receipts, missing checks, wrong formats and incomplete companion chains fail closed. A corrupt bundled publication manifest releases no sources. LocalStorage values, query flags and role metadata are not publication inputs.

## Delivery acceptance still required

This first slice supplies the source-bound publication registry and preparation tool. Student/public directory and practice delivery must next consume this registry, preserve the draft staff gates and expose only released sources in next-task navigation. Until those UI paths are implemented and tested, the registry is not a completed student publication feature. Real methodological approval, calibrated difficulty and authenticated classroom acceptance remain separate launch requirements.
