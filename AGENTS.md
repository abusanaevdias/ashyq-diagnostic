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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
