# IELTS Academic Task 2 Writing Trainer Implementation Plan

> For agentic workers: implement this plan task by task in the claimed worktree. Keep the synthetic-only boundary and review each completed UI state before continuing.

**Goal:** Deliver a working browser prototype where a learner revises two invented IELTS Task 2 essays by criterion and sees an honest comparison of authored practice estimates.

**Architecture:** Curated case data and pure session helpers drive a client component. The route contains no server endpoint and no persistence. The UI reveals authored explanations only after an independent attempt.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS modules, ASHYQ v3 design tokens.

## Global constraints

- No real learner data, external AI call, LMS write, or official IELTS score claim.
- Keep progress counts separate from authored criterion estimates.
- Alternative free text must never be falsely marked wrong or automatically awarded a score.
- Use project design tokens and accessible labelled controls.

## Tasks

### 1. Curated cases and session engine

- Create `src/lib/writing-trainer/cases.ts` with two original prompts, essays, authored grammar issues, and three criterion revisions per case.
- Create `src/lib/writing-trainer/engine.ts` with stage order, immutable session state, sentence edits, reveal status, applied examples, and score derivation.
- Review all examples for internally consistent English and non-overlapping replacement spans.

### 2. Learner interface

- Create `src/components/writing/WritingTrainer.tsx` and CSS module.
- Build case picker, score card, grammar sentence selection and edit form, post-attempt feedback, criterion revision rounds, and final diff/report.
- Keep the original essay immutable and the working essay explicit. Make all state transitions and limitations visible.

### 3. Route and handoff

- Add noindex route `src/app/writing/trainer/page.tsx`.
- Document the direct local URL and what the prototype does in its UI and PR.
- Run typecheck, targeted lint, `21st review`, and browser review of desktop/mobile and stage transitions. Do not add an automated test suite for this task unless the owner asks for testing.
