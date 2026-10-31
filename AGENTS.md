<!-- BEGIN:ashyq-collaboration-rules -->

# ASHYQ multi-agent coordination

Before inspecting or changing product code, read `HANDOFF.md` completely.

1. Run `git fetch --all --prune`, inspect `git status`, `git worktree list`,
   `git branch -avv`, and recent commits.
2. Do not start a task marked `IN_PROGRESS` unless its owner explicitly splits
   out a non-overlapping subtask.
3. Claim a free task in the `HANDOFF.md` task ledger with owner, branch,
   worktree and start date. Commit and push that claim to `origin/main` before
   implementation so another AI can see it.
4. Use a dedicated branch and Git worktree for concurrent implementation.
5. On completion, update the ledger with status, commit, changed areas, checks,
   remaining risks and the next safe task. Merge only verified work.
6. Never erase another agent's uncommitted changes or rewrite shared history.

If `HANDOFF.md`, GitHub, and the local worktrees disagree, stop implementation
and reconcile ownership first.

<!-- END:ashyq-collaboration-rules -->

## ASHYQ execution harness

Read [docs/harness/README.md](docs/harness/README.md) and the applicable domain map
in [docs/harness/architecture.md](docs/harness/architecture.md). Keep the ownership
protocol above. Before editing, add or update `harness/tasks/<TASK-ID>.json` with
the claimed owner, bounded scope, acceptance criteria and concrete counterexamples.
Run `node scripts/harness.mjs plan --base origin/main` and `check` before submission.
Every changed non-ledger file must belong to a task plan changed in the same PR.

Use the allowlisted runner to collect checks and verify its source-bound report.
Neither a plan nor a claimed review is evidence that a check passed. Keep actual
visual/source/privacy review evidence and the exact-head full CI result. Never
weaken a gate to make a change pass. Deployment must be verified on the live URL;
publication, indexing, AI citation and recommendation are separate outcomes.

For content, follow [docs/harness/content.md](docs/harness/content.md). Hypothetical
examples stay labelled; proposed student cases are drafts until the owner corrects
and confirms the facts. Source checking and real outcome evidence cannot be
replaced by a mechanical linter or a model's confident wording.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
