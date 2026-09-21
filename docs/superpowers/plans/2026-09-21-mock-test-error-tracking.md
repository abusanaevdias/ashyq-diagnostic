# Mock Test Error Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Build the approved ASHYQ Cambridge IELTS Academic mock-test workflow from teacher assignment through timed student attempt, secure review, published feedback, and progress tracking.

**Architecture:** Keep mock tests in a separate src/lib/mocks domain linked one-to-one to the existing Assignment entity. Supabase RPCs and RLS are the production authority for timing, answer keys, scoring, state transitions, and visibility; a LocalDemo adapter mirrors the same interface for current demo E2E. Interactive screens stay in focused client components behind small Next.js 16 route shells.

**Tech Stack:** Next.js 16.3 App Router, React 19.3, TypeScript 5.7, CSS Modules with design/tokens.css, Supabase/Postgres 17, pgTAP, Playwright 1.63, axe-core.

## Global Constraints

- Re-fetch origin/main and re-read HANDOFF.md before every task claim or push.
- Use a dedicated branch/worktree and publish the task claim to origin/main before product code.
- Read relevant node_modules/next/dist/docs guidance before creating Next.js files; params are asynchronous in Next.js 16 and current LMS dynamic screens use client useParams under Suspense.
- Do not modify THREADS-BOT-001 owned src/lib/threads*, src/app/api/threads/**, its migration, scripts/threads-check.ts, .env.example, or docs/DEPLOY.md.
- Never commit Cambridge passages, scans, audio, answer keys, or unverified Band mappings.
- Seed only 48 safe identities: Academic volumes 16–21 × Tests 1–4 × Reading/Listening. They stay draft until 40 keys and a methodist-approved scale are imported.
- Raw score N/40 is primary. Band is hidden without an active verified scale and otherwise labeled «Ориентировочный Band».
- The student does not receive correct answers, auto-evaluation, teacher drafts, or score before atomic review publication.
- The server clock is authoritative. Browser closure does not pause a test.
- After an offline deadline, only the last server-confirmed answer set is authoritative; a teacher may reopen an unpublished attempt.
- A published attempt never reopens for answer edits. A correction creates a new review version.
- New UI uses only existing v3 tokens, 44 px minimum tap targets, visible focus, no horizontal overflow at 390 px, and reduced-motion support.
- Keep Quick Diagnostic, its localStorage keys, ordinary Assignment/Submission, CRM, season, and active agent areas backward compatible.
- Use TDD: failing test, observed failure, minimal implementation, passing test, then commit.
- Run npm run lint, npm run typecheck, npm run check:units, npm run build, and task-specific tests before each task is marked complete.

---

## File Structure

### Domain and adapters

- Create src/lib/mocks/types.ts — all public domain types and DTOs.
- Create src/lib/mocks/domain.ts — pure normalization, scoring, transition, and progress rules.
- Create src/lib/mocks/catalog.ts — 48 metadata-only Cambridge identities and taxonomy labels.
- Create src/lib/mocks/repos.ts — MockRepo interface and lazy demo/Supabase provider switch.
- Create src/lib/mocks/local-repo.ts — LocalDemo parity using ashyq:v2:mock-* collections.
- Create src/lib/mocks/supabase-repo.ts — public reads and RPC-backed mutations.
- Create src/lib/mocks/draft-store.ts — exact ashyq:v1:mock-attempt:<attemptId> offline draft storage.
- Create src/lib/mocks/useMockAttempt.ts — interactive answer state, timer, autosave queue, and conflict recovery.

### Database

- Create supabase/migrations/20260921000100_mock_tests.sql — schema, RLS, grants, RPCs, catalog seed.
- Create supabase/tests/mock_tests.test.sql — pgTAP role, key secrecy, state, revision, and publication tests.
- Create scripts/mock-schema-check.ts — static migration contract.
- Create scripts/supabase-mock-check.ts — live local-Supabase role and RPC flow.
- Create scripts/import-mock-template.ts — validated service-role import from a local, untracked JSON file.
- Create scripts/mock-unit-check.ts — pure-domain and LocalDemo contract.

### Shared UI

- Create src/components/lms/mock/shared/MockAssignmentCard.tsx.
- Create src/components/lms/mock/shared/MockStatusChip.tsx.
- Create src/components/lms/mock/shared/MockMetricBar.tsx.
- Create src/components/lms/mock/shared/MockEmptyState.tsx.
- Create src/components/lms/mock/shared/MockShared.module.css.

### Student UI

- Create src/components/lms/mock/student/MockAssignmentView.tsx.
- Create src/components/lms/mock/student/MockAttemptView.tsx.
- Create src/components/lms/mock/student/MockAnswerNavigator.tsx.
- Create src/components/lms/mock/student/MockAnswerField.tsx.
- Create src/components/lms/mock/student/MockSubmitReview.tsx.
- Create src/components/lms/mock/student/MockResultView.tsx.
- Create src/components/lms/mock/student/MockProgressView.tsx.
- Create src/components/lms/mock/student/MockStudent.module.css.

### Teacher UI

- Create src/components/lms/mock/teacher/TeacherMockCreateView.tsx.
- Create src/components/lms/mock/teacher/TeacherMockAssignmentView.tsx.
- Create src/components/lms/mock/teacher/TeacherMockReviewView.tsx.
- Create src/components/lms/mock/teacher/MockErrorFields.tsx.
- Create src/components/lms/mock/teacher/MockBulkReviewBar.tsx.
- Create src/components/lms/mock/teacher/TeacherMockAnalyticsView.tsx.
- Create src/components/lms/mock/teacher/MockTeacher.module.css.

### Routes

- Create src/app/mock-tests/[assignmentId]/page.tsx.
- Create src/app/mock-tests/[assignmentId]/attempts/[attemptId]/page.tsx.
- Create src/app/mock-tests/[assignmentId]/attempts/[attemptId]/result/page.tsx.
- Create src/app/me/progress/mocks/page.tsx.
- Create src/app/teacher/classes/[classId]/mock-tests/new/page.tsx.
- Create src/app/teacher/mock-tests/[assignmentId]/page.tsx.
- Create src/app/teacher/mock-attempts/[attemptId]/page.tsx.
- Create src/app/teacher/classes/[classId]/mock-analytics/page.tsx.

### Existing integration points

- Modify src/lib/lms/permissions.ts — explicit mock.attempt and mock.review actions.
- Modify src/components/lms/ClassView.tsx — separate student mock block and no duplicate ordinary assignment.
- Modify src/components/lms/TeacherViews.tsx — create CTA, mock queue, and no duplicate ordinary assignment.
- Modify src/components/lms/AssignmentView.tsx — crafted generic mock URL redirects to mock flow.
- Modify src/components/lms/TeacherForms.tsx — mock assignments cannot use the generic editor.
- Modify src/components/lms/MeView.tsx — student progress entry.
- Modify package.json — mock scripts without overwriting concurrent check:units additions.
- Modify .github/workflows/ci.yml — database gate plus mock E2E.
- Modify docs/CI.md and docs/SUPABASE_FOUNDATION.md — exact verification and rollout.
- Modify scripts/lms-e2e.ts and scripts/token-audit.ts only in the final integration task.

---

### Task 1: Pure mock domain and repository contract

**Files:**
- Create: src/lib/mocks/types.ts
- Create: src/lib/mocks/domain.ts
- Create: src/lib/mocks/catalog.ts
- Create: src/lib/mocks/repos.ts
- Create: src/lib/mocks/local-repo.ts
- Create: scripts/mock-unit-check.ts
- Modify: src/lib/lms/permissions.ts
- Modify: package.json

**Interfaces:**
- Consumes: lmsProvider(), lmsBus, readJson(), writeJson(), newId(), existing Assignment IDs.
- Produces: MockRepo, getMockRepo(), normalizeMockAnswer(), evaluateMockAnswer(), calculateSkillStatus(), MOCK_TEMPLATE_IDENTITIES.

- [ ] **Step 1: Add failing unit coverage for normalization, transitions, templates, permissions, and progress**

  Create scripts/mock-unit-check.ts with assertions equivalent to:

      import assert from 'node:assert/strict';
      import {
        calculateSkillStatus,
        evaluateMockAnswer,
        normalizeMockAnswer,
        transitionAllowed,
      } from '../src/lib/mocks/domain';
      import { MOCK_TEMPLATE_IDENTITIES } from '../src/lib/mocks/catalog';
      import { can } from '../src/lib/lms/permissions';

      assert.equal(normalizeMockAnswer('  New   York  '), 'new york');
      assert.equal(normalizeMockAnswer('O’Connor'), "o'connor");
      assert.equal(evaluateMockAnswer('Colour', ['colour', 'color'], 1).correct, true);
      assert.equal(evaluateMockAnswer('colur', ['colour'], 1).correct, false);
      assert.equal(evaluateMockAnswer('two words here', ['two words here'], 2).wordLimitExceeded, true);
      assert.equal(MOCK_TEMPLATE_IDENTITIES.length, 48);
      assert.equal(new Set(MOCK_TEMPLATE_IDENTITIES.map((item) => item.code)).size, 48);
      assert.equal(transitionAllowed('in_progress', 'submitted'), true);
      assert.equal(transitionAllowed('published', 'reopened'), false);
      assert.equal(can('student', 'mock.attempt'), true);
      assert.equal(can('teacher', 'mock.review'), true);
      assert.deepEqual(
        calculateSkillStatus({ questions: 8, errors: 1, attempts: 2, currentAccuracy: 87.5, previousAccuracy: 75, repeatedCause: false }),
        { status: 'consolidating', sampleSize: 8 },
      );
      console.log('PASS mock unit: normalization, exact grading, catalog, transitions, permissions, progress');

- [ ] **Step 2: Run the unit script and verify it fails**

  Run: npx tsx scripts/mock-unit-check.ts

  Expected: FAIL because src/lib/mocks files and mock permissions do not exist.

- [ ] **Step 3: Define the domain types**

  In src/lib/mocks/types.ts define these exact unions and interfaces:

      export type MockModule = 'reading' | 'listening';
      export type MockAssignmentStatus = 'draft' | 'scheduled' | 'active' | 'closed';
      export type MockAttemptStatus = 'in_progress' | 'submitted' | 'in_review' | 'published' | 'reopened';
      export type MockSkillStatus = 'insufficient' | 'attention' | 'improving' | 'consolidating';
      export type MockSaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict' | 'error';

      export interface MockTemplateIdentity {
        id: string;
        code: string;
        exam: 'ielts_academic';
        series: 'Cambridge IELTS Academic';
        volume: 16 | 17 | 18 | 19 | 20 | 21;
        testNumber: 1 | 2 | 3 | 4;
        module: MockModule;
      }

      export interface MockTemplateVersion {
        id: string;
        templateId: string;
        versionNumber: number;
        durationMinutes: number;
        questionCount: 40;
        status: 'draft' | 'published' | 'archived';
        hasVerifiedKey: boolean;
        hasVerifiedBandScale: boolean;
      }

      export interface MockQuestion {
        id: string;
        templateVersionId: string;
        questionNumber: number;
        sectionNumber: number;
        questionTypeCode: string;
        skillCode: string;
        wordLimit: number | null;
      }

      export interface MockAssignment {
        assignmentId: string;
        templateVersionId: string;
        availableAt: string;
        attemptLimit: number;
        status: MockAssignmentStatus;
        publishedAt?: string;
      }

      export interface MockAttempt {
        id: string;
        assignmentId: string;
        studentId: string;
        attemptNumber: number;
        status: MockAttemptStatus;
        startedAt: string;
        expiresAt: string;
        submittedAt?: string;
        publishedAt?: string;
        rawScore?: number;
        estimatedBand?: number;
        serverRevision: number;
        reopenCount: number;
      }

      export interface MockAnswerDraft {
        questionId: string;
        questionNumber: number;
        answerText: string;
        flaggedForReview: boolean;
        revision: number;
      }

      export interface SaveAnswersResult {
        serverRevision: number;
        savedAt: string;
        attemptStatus: MockAttemptStatus;
      }

      export interface MockErrorReviewInput {
        answerId: string;
        questionTypeCode: string;
        skillCode: string;
        primaryCauseCode: string;
        secondaryCauseCode?: string;
        teacherNote?: string;
        actionText?: string;
      }

      export interface MockPublishedAnswer {
        questionNumber: number;
        answerText: string;
        acceptedAnswers: string[];
        correct: boolean;
        review?: MockErrorReviewInput;
      }

      export interface MockPublishedResult {
        attempt: MockAttempt;
        summaryText: string;
        reviewVersion: number;
        answers: MockPublishedAnswer[];
        actions: MockActionItem[];
      }

      export interface MockActionItem {
        id: string;
        title: string;
        status: 'open' | 'done';
        completedAt?: string;
      }

- [ ] **Step 4: Implement exact grading and state/progress rules**

  In src/lib/mocks/domain.ts implement exported pure functions:

      export function normalizeMockAnswer(value: string): string {
        return value
          .trim()
          .replace(/[‘’]/g, "'")
          .replace(/\s+/g, ' ')
          .toLocaleLowerCase('en');
      }

      export function evaluateMockAnswer(value: string, accepted: string[], wordLimit: number | null) {
        const normalized = normalizeMockAnswer(value);
        const wordCount = normalized ? normalized.split(' ').length : 0;
        const wordLimitExceeded = wordLimit !== null && wordCount > wordLimit;
        return {
          normalized,
          wordCount,
          wordLimitExceeded,
          correct: !wordLimitExceeded && accepted.some((item) => normalizeMockAnswer(item) === normalized),
        };
      }

      const TRANSITIONS: Record<MockAttemptStatus, readonly MockAttemptStatus[]> = {
        in_progress: ['submitted'],
        submitted: ['in_review', 'reopened'],
        in_review: ['published', 'reopened'],
        reopened: ['submitted'],
        published: [],
      };

      export function transitionAllowed(from: MockAttemptStatus, to: MockAttemptStatus): boolean {
        return TRANSITIONS[from].includes(to);
      }

  Implement calculateSkillStatus with this precedence: consolidating, improving, attention, insufficient. It must return sampleSize and apply the exact thresholds in the approved spec.

- [ ] **Step 5: Generate the metadata-only catalog**

  In src/lib/mocks/catalog.ts generate 48 identities with deterministic codes such as cambridge-16-test-1-reading. Do not include key values, Band values, passages, PDF URLs, or audio URLs. Export taxonomy arrays for question types, skills, and causes using the stable codes from the spec.

- [ ] **Step 6: Define MockRepo without expanding the generic LMS Repos**

  src/lib/mocks/repos.ts must export one interface with methods grouped by workflow:

      export interface MockRepo {
        listTemplates(): Promise<MockTemplateIdentity[]>;
        listTemplateVersions(templateId: string): Promise<MockTemplateVersion[]>;
        listAssignmentsByClass(classId: string): Promise<MockAssignment[]>;
        getAssignment(assignmentId: string): Promise<MockAssignment | null>;
        createAssignment(input: CreateMockAssignmentInput): Promise<MockAssignment>;
        publishAssignment(assignmentId: string): Promise<MockAssignment>;
        setAccommodation(input: SetAccommodationInput): Promise<void>;
        listAttemptsByAssignment(assignmentId: string): Promise<MockAttempt[]>;
        listAttemptsByStudent(studentId: string): Promise<MockAttempt[]>;
        getAttempt(attemptId: string): Promise<MockAttempt | null>;
        startAttempt(assignmentId: string): Promise<MockAttempt>;
        saveAnswers(attemptId: string, expectedRevision: number, answers: MockAnswerDraft[]): Promise<SaveAnswersResult>;
        submitAttempt(attemptId: string, expectedRevision: number, automatic?: boolean): Promise<MockAttempt>;
        beginReview(attemptId: string): Promise<{ reviewId: string; version: number }>;
        saveErrorReviews(reviewId: string, reviews: MockErrorReviewInput[]): Promise<void>;
        overrideAnswer(input: OverrideAnswerInput): Promise<MockAttempt>;
        publishReview(input: PublishReviewInput): Promise<MockPublishedResult>;
        reopenAttempt(attemptId: string, extraMinutes?: number): Promise<MockAttempt>;
        getPublishedResult(attemptId: string): Promise<MockPublishedResult | null>;
        completeAction(actionId: string): Promise<MockActionItem>;
      }

  The provider switch must mirror lms repos: dynamic-import Supabase only when NEXT_PUBLIC_AUTH_PROVIDER=supabase; otherwise return one LocalDemo instance.

- [ ] **Step 7: Implement LocalDemo parity**

  Store collections under ashyq:v2:mock-templates, mock-template-versions, mock-assignments, mock-attempts, mock-answers, mock-reviews, mock-actions, and mock-audit. Use domain.ts for validation. Keep accepted answers inside the LocalDemo repository record, never in UI props before publication. Reject stale revisions, illegal transitions, missing keys, and attempts over the configured limit with the same Russian messages planned for Supabase. Browser tests generate demo-answer-1 through demo-answer-40 at runtime and seed them through a test helper; they are visibly synthetic and are never represented as a Cambridge answer key.

- [ ] **Step 8: Add explicit permissions**

  Extend Action and PERMISSIONS:

      | 'mock.attempt'
      | 'mock.review'

      'mock.attempt': ['student'],
      'mock.review': ['teacher'],

  Add mockAttempt and mockReview route-role aliases derived from PERMISSIONS.

- [ ] **Step 9: Add the unit script to package commands without clobbering concurrent edits**

  Append && tsx scripts/mock-unit-check.ts to check:units. Add check:mocks:schema and check:mocks:supabase as separate scripts.

- [ ] **Step 10: Run fast gates and commit**

  Run:

      npx tsx scripts/mock-unit-check.ts
      npm run lint
      npm run typecheck
      npm run check:units

  Expected: mock unit PASS, existing unit suites PASS, lint/typecheck exit 0.

  Commit: feat(mocks): add isolated mock test domain

---

### Task 2: Supabase schema, private keys, RLS, and atomic RPCs

**Files:**
- Create: supabase/migrations/20260921000100_mock_tests.sql
- Create: supabase/tests/mock_tests.test.sql
- Create: scripts/mock-schema-check.ts
- Modify: docs/SUPABASE_FOUNDATION.md

**Interfaces:**
- Consumes: public.assignments, public.classes, public.class_members, private.current_role(), private.can_manage_class(), auth.uid().
- Produces: mock tables and RPC names consumed by src/lib/mocks/supabase-repo.ts.

- [ ] **Step 1: Write failing static and pgTAP contracts**

  scripts/mock-schema-check.ts must load the exact migration file and assert:

      const requiredTables = [
        'mock_templates',
        'mock_template_versions',
        'mock_template_questions',
        'mock_band_scales',
        'mock_band_scale_entries',
        'mock_question_types',
        'mock_skills',
        'mock_causes',
        'mock_action_templates',
        'mock_assignments',
        'mock_accommodations',
        'mock_attempts',
        'mock_answers',
        'mock_review_versions',
        'mock_error_reviews',
        'mock_action_items',
        'mock_audit_events',
      ];
      const requiredRpcs = [
        'create_mock_assignment',
        'publish_mock_assignment',
        'set_mock_accommodation',
        'start_mock_attempt',
        'save_mock_answers',
        'submit_mock_attempt',
        'begin_mock_review',
        'upsert_mock_error_reviews',
        'override_mock_answer',
        'publish_mock_review',
        'reopen_mock_attempt',
        'get_mock_result',
        'complete_mock_action',
        'finalize_expired_mock_attempts',
        'admin_import_mock_template',
      ];

  It must also assert private.mock_answer_keys and private.mock_answer_evaluations, RLS on every public table, search_path on security-definer functions, and explicit revoke/grant statements.

  pgTAP must create teacher A, teacher B, class member, outsider, two classes, one synthetic test-only template version with 40 questions/keys, and assert every security/state rule in the spec.

- [ ] **Step 2: Verify both tests fail before the migration exists**

  Run:

      npx tsx scripts/mock-schema-check.ts
      npx --yes supabase@2.117.0 test db --local

  Expected: static checker fails on missing migration; pgTAP fails on missing mock tables/functions.

- [ ] **Step 3: Create catalog and taxonomy tables**

  Migration must create public catalog tables with checks and uniqueness:

      create table public.mock_templates (
        id uuid primary key default gen_random_uuid(),
        exam text not null check (exam = 'ielts_academic'),
        series text not null check (series = 'Cambridge IELTS Academic'),
        volume smallint not null check (volume between 16 and 21),
        test_number smallint not null check (test_number between 1 and 4),
        module text not null check (module in ('reading','listening')),
        archived_at timestamptz,
        created_at timestamptz not null default now(),
        unique (exam, volume, test_number, module)
      );

  Create the remaining catalog/version/question/Band/taxonomy tables exactly as named in File Structure. Published template versions are immutable via a trigger; publishing requires exactly 40 numbered questions and 40 private key rows.

- [ ] **Step 4: Create private key and evaluation tables**

  Use private.mock_answer_keys(question_id primary key, accepted_answers text[]) and private.mock_answer_evaluations(answer_id primary key, normalized_answer, auto_is_correct, is_correct, override_reason/by/at). Revoke all table privileges from public, anon, and authenticated. Never add private to Supabase exposed schemas.

- [ ] **Step 5: Create assignment, attempt, answer, review, action, and audit tables**

  Enforce:

  - mock_assignments.assignment_id is the PK and FK to assignments.
  - question_count is 40.
  - unique assignment/student/attempt_number.
  - unique attempt/question answer rows.
  - unique attempt/review version.
  - published_review_id references a review version.
  - audit is append-only.
  - indexes follow the design spec.

- [ ] **Step 6: Implement RLS and defend generic Assignment/Submission**

  Enable RLS on every public table. Students read only their class assignment, own attempts, and published review selected by published_review_id. Teachers read/manage only their classes. No direct attempt/answer mutations are granted.

  Replace submissions_create with the existing conditions plus:

      and not exists (
        select 1 from public.mock_assignments ma
        where ma.assignment_id = submissions.assignment_id
      )

  Replace the generic assignments update/delete policies so linked mock rows
  cannot be changed through the ordinary Assignment repository. Dedicated
  SECURITY DEFINER mock RPCs remain able to update their base due_at/title
  fields after validating class ownership and mock state.

  Restrict member assignment reads so linked draft mocks are invisible while the class owner still sees them. Add an insert trigger as defense in depth against generic submissions for mock assignment IDs.

- [ ] **Step 7: Implement all RPC signatures and state checks**

  Each SECURITY DEFINER function uses set search_path='' and schema-qualified names, revokes execute from public/anon/authenticated, then grants only authenticated or service_role as required.

  Required behavior:

  - create_mock_assignment atomically creates Assignment max_points=40 plus linked draft.
  - publish_mock_assignment validates 40 questions/keys and transitions draft to scheduled/active.
  - start_mock_attempt row-locks assignment/student attempts, returns existing editable attempt idempotently, enforces window/limit, and computes min(due_at, now + duration + accommodation).
  - save_mock_answers validates expected revision and returns the new revision; stale writes never overwrite.
  - submit_mock_attempt materializes blank answers, grades inside private schema, calculates raw score and optional Band, and is idempotent.
  - begin/save/override/publish operate only for the class owner; override requires a nonblank reason.
  - publish rejects incomplete incorrect-answer reviews and blank summary, creates actions, sets published_review_id, and exposes everything atomically.
  - reopen accepts only submitted/in_review, never published.
  - get_mock_result conditionally joins accepted answers and published review only for owner or class teacher.
  - finalize_expired_mock_attempts submits last server-confirmed state and is executable only by service_role.
  - admin_import_mock_template accepts validated JSON, creates a new immutable
    version, 40 question rows and 40 private key rows in one transaction, and
    is executable only by service_role. It never returns accepted answers.

- [ ] **Step 8: Seed only safe metadata**

  Insert 48 mock_templates and taxonomy rows with stable codes. Do not seed answer keys or Band entries. Production template versions stay draft until a legal copy is entered and methodist verifies it. pgTAP uses transaction-local synthetic key data that rolls back.

- [ ] **Step 9: Run database gates**

  Run:

      npx --yes supabase@2.117.0 start
      npx --yes supabase@2.117.0 db reset --local
      npx --yes supabase@2.117.0 db lint --local
      npx --yes supabase@2.117.0 test db --local
      npx tsx scripts/mock-schema-check.ts

  Expected: reset succeeds, db lint reports no schema errors, all pgTAP assertions pass, schema checker PASS.

- [ ] **Step 10: Document import and finalizer commands, then commit**

  docs/SUPABASE_FOUNDATION.md must state that templates are metadata-only, production publishing requires methodist/legal verification, private schema is not exposed, and finalize_expired_mock_attempts needs a server scheduler or lazy invocation.

  Commit: feat(mocks): secure mock tests in Supabase

---

### Task 3: Supabase adapter and live role verification

**Files:**
- Create: src/lib/mocks/supabase-repo.ts
- Create: scripts/supabase-mock-check.ts
- Create: scripts/import-mock-template.ts
- Modify: src/lib/mocks/repos.ts
- Modify: src/lib/mocks/types.ts
- Modify: package.json

**Interfaces:**
- Consumes: Task 2 tables/RPCs and supabaseBrowser().
- Produces: Supabase MockRepo parity and a live local-database gate.

- [ ] **Step 1: Write a failing live client flow**

  scripts/supabase-mock-check.ts must create teacher A/member/outsider/teacher B through local Supabase admin APIs, set roles, create classes, import a synthetic 40-question version with service role, and assert:

  - teacher A creates/publishes;
  - teacher B and outsider cannot read or mutate;
  - member starts/saves/submits;
  - stale revision is rejected;
  - member cannot obtain result/key before publish;
  - teacher overrides with reason and publishes;
  - member receives result afterwards;
  - published attempt cannot reopen;
  - second attempt preserves the first.

- [ ] **Step 2: Run and observe failure**

  Run: npx tsx scripts/supabase-mock-check.ts

  Expected: FAIL because Supabase MockRepo does not exist.

- [ ] **Step 3: Map rows and humanize RPC errors**

  In supabase-repo.ts define private Row types, mapper functions, and one rpc helper. Map known messages for expired attempt, stale revision, attempt limit, incomplete key, incomplete review, and permission failure. Unknown PostgREST bodies must not cause TypeError; mirror existing LMS humanize behavior.

- [ ] **Step 4: Implement direct reads and RPC-only mutations**

  Catalog/assignment/list queries may use public tables under RLS. All attempt, answer, review, override, publish, reopen, action, and result mutations call the Task 2 RPCs. Never select private schema or accepted_answers directly.

- [ ] **Step 5: Add a rights-confirmed import CLI**

  scripts/import-mock-template.ts accepts an absolute or repository-relative
  JSON path plus --confirm-rights. It validates one catalog identity, duration,
  exactly 40 unique question numbers, nonempty acceptedAnswers arrays, stable
  taxonomy codes, and optional verified Band entries before calling
  admin_import_mock_template with service role credentials. Without
  --confirm-rights it exits nonzero. It never logs answer values and never
  writes the imported JSON into the repository.

  Add package command:

      "import:mocks": "tsx scripts/import-mock-template.ts"

- [ ] **Step 6: Run parity gates and commit**

  Run:

      npx tsx scripts/supabase-mock-check.ts
      npm run check:units
      npm run lint
      npm run typecheck

  Expected: live role flow PASS and all fast gates green.

  Commit: feat(mocks): connect mock repository to Supabase

---

### Task 4: Teacher template selection and assignment dashboard

**Files:**
- Create: src/components/lms/mock/shared/MockAssignmentCard.tsx
- Create: src/components/lms/mock/shared/MockStatusChip.tsx
- Create: src/components/lms/mock/shared/MockEmptyState.tsx
- Create: src/components/lms/mock/shared/MockShared.module.css
- Create: src/components/lms/mock/teacher/TeacherMockCreateView.tsx
- Create: src/components/lms/mock/teacher/TeacherMockAssignmentView.tsx
- Create: src/components/lms/mock/teacher/MockTeacher.module.css
- Create: src/app/teacher/classes/[classId]/mock-tests/new/page.tsx
- Create: src/app/teacher/mock-tests/[assignmentId]/page.tsx
- Modify: src/components/lms/TeacherViews.tsx
- Modify: src/components/lms/TeacherForms.tsx
- Modify: src/components/lms/ClassView.tsx
- Modify: src/components/lms/AssignmentView.tsx

**Interfaces:**
- Consumes: published template versions, createAssignment(), publishAssignment(), class members and assignments.
- Produces: teacher creation flow, linked mock discovery, and generic-form guards.

- [ ] **Step 1: Add failing teacher-flow assertions to scripts/lms-e2e.ts**

  Add a scenario where the test setup generates demo-answer-1 through demo-answer-40 at runtime for the Cambridge IELTS Academic 16 / Test 1 / Reading metadata identity. The demo teacher opens a class, sees «Назначить mock-тест», selects that verified synthetic fixture, configures availability/deadline/attempt limit, publishes, and sees a dedicated mock card. The visible DemoBanner and fixture setup must call the key synthetic; no committed value is presented as the real Cambridge key. Assert the same assignment does not appear in ordinary assignment cards.

- [ ] **Step 2: Run LMS E2E and observe failure**

  Run a production server and BASE_URL=http://127.0.0.1:3021 npm run e2e:lms.

  Expected: FAIL at missing «Назначить mock-тест».

- [ ] **Step 3: Create Next.js 16 route shells**

  Each page exports noindex metadata, renders LmsShell, wraps its interactive client view in Suspense, and does not synchronously read params. Client views use useParams as current LMS pages do.

- [ ] **Step 4: Build the three-step teacher wizard**

  Use fieldset/legend for:

  1. Template: volume, test, module; only published/verified versions selectable.
  2. Schedule: availableAt, dueAt, attemptLimit 1–10, per-student extra minutes.
  3. Confirmation: source, module, 40 questions, separate-material notice, schedule, attempts.

  Submit one createAssignment command followed by publishAssignment only after explicit confirmation. Draft failures remain visible and retryable; never create a generic submission.

- [ ] **Step 5: Add teacher dashboard and queue summary**

  TeacherMockAssignmentView shows status, completion, counts by attempt state, students, remaining attempts, and links to review and analytics. No correct answers appear in list payloads.

- [ ] **Step 6: Integrate class pages without duplication**

  ClassView loads mock summaries and own attempts, renders a separate «Mock-тесты» section, and filters linked IDs out of ordinary assignments.

  TeacherViews adds the CTA and mock queue, filters linked IDs out of ordinary assignments/submissions, and counts pending mock reviews separately.

  AssignmentView and TeacherForms detect a linked mock and replace generic forms with a link/redirect to its dedicated route. Database policy remains the real enforcement.

- [ ] **Step 7: Verify responsive/a11y basics and commit**

  Assert at 1440 and 390: no overflow, fieldsets named, buttons at least 44 px, focus visible, no Cambridge files/URLs.

  Run lint, typecheck, check:units, build, and e2e:lms.

  Commit: feat(mocks): let teachers assign mock tests

---

### Task 5: Timed student attempt, autosave, offline queue, and submission

**Files:**
- Create: src/lib/mocks/draft-store.ts
- Create: src/lib/mocks/useMockAttempt.ts
- Create: src/components/lms/mock/student/MockAssignmentView.tsx
- Create: src/components/lms/mock/student/MockAttemptView.tsx
- Create: src/components/lms/mock/student/MockAnswerNavigator.tsx
- Create: src/components/lms/mock/student/MockAnswerField.tsx
- Create: src/components/lms/mock/student/MockSubmitReview.tsx
- Create: src/components/lms/mock/student/MockStudent.module.css
- Create: src/app/mock-tests/[assignmentId]/page.tsx
- Create: src/app/mock-tests/[assignmentId]/attempts/[attemptId]/page.tsx
- Modify: src/lib/lms/auth.ts
- Modify: src/lib/lms/supabase-auth.ts
- Modify: scripts/lms-e2e.ts

**Interfaces:**
- Consumes: startAttempt(), getAttempt(), saveAnswers(), submitAttempt(), questions and serverRevision.
- Produces: durable in-progress answers and submitted status with no prepublication leak.

- [ ] **Step 1: Add failing draft-store and attempt-hook tests**

  Unit assertions must prove:

  - exact key is ashyq:v1:mock-attempt:<attemptId>;
  - per-keystroke local save;
  - clear on confirmed submit and sign-out;
  - dirty answers survive a stale-revision conflict;
  - server-confirmed answers win only when local answer is not dirty;
  - timer derives from expiresAt and an explicit server offset.

- [ ] **Step 2: Implement dedicated draft storage**

  draft-store.ts accesses window.localStorage directly, validates parsed shape, namespaces by userId and attemptId inside the stored value, and exports readMockDraft, writeMockDraft, removeMockDraft, and clearMockDraftsForUser. It must not use lms/store because that adds ashyq:v2:.

- [ ] **Step 3: Implement useMockAttempt**

  The hook owns:

      answers: Map<string, MockAnswerDraft>
      activeQuestion: number
      dirtyQuestionIds: Set<string>
      saveStatus: MockSaveStatus
      serverRevision: number
      serverOffsetMs: number
      remainingMs: number

  Write local storage immediately. Debounce server batches. Flush on question change, blur, visibilitychange, and manual submit. Do not rely on asynchronous beforeunload. On offline failure retain the queue and status. On revision conflict show a blocking recovery action and never overwrite dirty local answers. At zero call idempotent submit; the server remains authoritative.

- [ ] **Step 4: Build preflight and attempt screens**

  MockAssignmentView shows source, module, duration, deadline, attempts, and «Материалы используются отдельно». State CTA is Start, Continue, На проверке, Open result, or Closed.

  Attempt desktop layout is 7/5 with timer/save strip, 40-number navigator, and one answer field. Mobile is one column with a grid using minmax(44px,1fr). Navigator buttons expose answered/unanswered/flagged in aria-label, aria-current for active, and aria-pressed for flagged.

  aria-live announces save-status transitions and timer thresholds at 10 minutes, 5 minutes, 1 minute, and expiry only.

- [ ] **Step 5: Build accessible submit review**

  Use an in-page review step, not a custom modal. List unanswered numbers as buttons, move focus to the heading/first unanswered, provide «Вернуться к ответам» and one final «Отправить тест» confirmation. After submit, render «На проверке» with no raw score, correct answer, Band, or auto-correct flag.

- [ ] **Step 6: Clear drafts on both auth sign-out implementations**

  LocalDemoAuth and SupabaseAuth call clearMockDraftsForUser before clearing the session. Keep existing auth semantics unchanged.

- [ ] **Step 7: Exercise refresh, offline, conflict, and auto-submit**

  Extend LMS E2E with refresh retention, browser offline status, edit while offline, restore/sync, unanswered review, and no prepublication leak. Use a short synthetic demo duration or Playwright Clock for auto-submit; never sleep for a real exam duration.

- [ ] **Step 8: Run gates and commit**

  Run mock unit, LMS E2E at 1440/390, lint, typecheck, check:units, build.

  Commit: feat(mocks): add reliable timed student attempts

---

### Task 6: Teacher review, bulk taxonomy, override, and atomic publication

**Files:**
- Create: src/components/lms/mock/teacher/TeacherMockReviewView.tsx
- Create: src/components/lms/mock/teacher/MockErrorFields.tsx
- Create: src/components/lms/mock/teacher/MockBulkReviewBar.tsx
- Create: src/app/teacher/mock-attempts/[attemptId]/page.tsx
- Modify: src/components/lms/mock/teacher/TeacherMockAssignmentView.tsx
- Modify: src/components/lms/mock/teacher/MockTeacher.module.css
- Modify: scripts/lms-e2e.ts

**Interfaces:**
- Consumes: beginReview(), saveErrorReviews(), overrideAnswer(), publishReview(), reopenAttempt().
- Produces: one complete published review snapshot and action items.

- [ ] **Step 1: Add failing review-flow assertions**

  E2E must submit a synthetic attempt, open the teacher queue, select multiple incorrect answers, bulk-apply skill/cause, override one auto result with a required reason, add summary/action, and publish. Assert blank override reason fails and incomplete incorrect-answer review lists exact missing question numbers.

- [ ] **Step 2: Build review route and state**

  Page shell follows LmsShell/Suspense/noindex. TeacherMockReviewView loads the attempt, questions, evaluations, current draft review, and student. Unauthorized class ownership renders Unavailable.

- [ ] **Step 3: Build per-answer and bulk review controls**

  Each answer card shows question number, student response, accepted answer, auto result, and current manual result. Correct answer data exists only in the teacher-authorized review payload.

  MockErrorFields uses labelled selects for question type, skill, primary cause, optional secondary cause, teacher note, and action. Other requires note.

  Bulk bar applies only explicitly selected fields to selected answers and does not erase existing notes unless the user checks «Заменить комментарий».

- [ ] **Step 4: Enforce override and publish gates in UI**

  Override UI requires a reason before calling RPC. Publish shows summary input, action items, and a final confirmation. Server error listing missing question numbers is rendered as linked buttons that focus the corresponding cards.

- [ ] **Step 5: Verify atomic visibility**

  While review is draft, the student screen remains «На проверке». After successful publish, one refresh exposes raw score, correct answers, feedback, summary, and actions together. A simulated publish failure exposes none of them.

- [ ] **Step 6: Run gates and commit**

  Run Supabase mock check, LMS E2E, lint, typecheck, check:units, build.

  Commit: feat(mocks): review and publish mock feedback

---

### Task 7: Published result, immutable history, progress, and class analytics

**Files:**
- Create: src/components/lms/mock/shared/MockMetricBar.tsx
- Create: src/components/lms/mock/student/MockResultView.tsx
- Create: src/components/lms/mock/student/MockProgressView.tsx
- Create: src/components/lms/mock/teacher/TeacherMockAnalyticsView.tsx
- Create: src/app/mock-tests/[assignmentId]/attempts/[attemptId]/result/page.tsx
- Create: src/app/me/progress/mocks/page.tsx
- Create: src/app/teacher/classes/[classId]/mock-analytics/page.tsx
- Modify: src/components/lms/MeView.tsx
- Modify: src/lib/mocks/domain.ts
- Modify: scripts/lms-e2e.ts

**Interfaces:**
- Consumes: published result snapshots and published attempts only.
- Produces: student trend/status/actions and teacher completion/median/range/error analytics.

- [ ] **Step 1: Add failing analytics unit and E2E assertions**

  Unit tests cover sample size, status precedence, median for odd/even groups, empty data, module split, and no Band when scale is missing. E2E creates a second attempt, publishes it, verifies the first remains and comparison uses both.

- [ ] **Step 2: Build result screen**

  Show raw N/40 first, optional «Ориентировочный Band», teacher summary, attempt history, per-answer review, and actions. Do not display a Band placeholder when no active scale exists.

- [ ] **Step 3: Build student progress**

  /me/progress/mocks shows Reading/Listening trend as accessible lists plus CSS bars, skill status and sample size, cause counts, and open/done actions. Color is never the only signal. completeAction updates only the owner action.

- [ ] **Step 4: Build teacher analytics**

  Show completion, median/range raw score, frequent skills/causes, and students with repeated problems. No public ranking and no data from other classes.

- [ ] **Step 5: Add cabinet entry and verify immutable history**

  Add «Прогресс mock-тестов» for students. Published attempts do not expose edit/reopen controls. A correction publishes review v2 while v1 remains in audit/history and student sees v2 as current.

- [ ] **Step 6: Run gates and commit**

  Run mock unit, Supabase mock check, LMS E2E, lint, typecheck, check:units, build.

  Commit: feat(mocks): show mock progress and class analytics

---

### Task 8: Security, responsive/a11y, CI database gate, and rollout

**Files:**
- Create: scripts/mock-e2e.ts
- Modify: scripts/token-audit.ts
- Modify: scripts/a11y-perf-check.ts only if authenticated-route support belongs there; otherwise keep all private checks in mock-e2e.ts
- Modify: package.json
- Modify: .github/workflows/ci.yml
- Modify: docs/CI.md
- Modify: docs/SUPABASE_FOUNDATION.md
- Modify: HANDOFF.md

**Interfaces:**
- Consumes: complete module.
- Produces: enforced database and UI release gates.

- [ ] **Step 1: Create focused mock E2E**

  scripts/mock-e2e.ts runs the full teacher/student flow at 1440 and 390. It must check:

  - 40 labelled answer controls;
  - refresh and offline queue;
  - unanswered review;
  - timer/auto-submit with controlled clock;
  - no score/key before publication;
  - bulk review, required override reason, atomic publication;
  - second-attempt comparison and immutable first attempt;
  - axe violations 0;
  - horizontal overflow 0;
  - tap targets at least 44 px;
  - visible focus path;
  - reduced-motion transition/animation duration 0;
  - console errors 0.

  Save screenshots under SHOT_DIR when provided; do not commit generated screenshots.

- [ ] **Step 2: Extend token and authenticated route coverage**

  Add mock component/style paths to static hardcoded-color scanning. Walk the attempt, review, result, and analytics routes under authenticated fixtures. Do not loosen existing token rules to make new code pass.

- [ ] **Step 3: Add package scripts**

  Add:

      "check:mocks:schema": "tsx scripts/mock-schema-check.ts",
      "check:mocks:supabase": "tsx scripts/supabase-mock-check.ts",
      "e2e:mocks": "tsx scripts/mock-e2e.ts"

  Keep check:units additions from concurrent tasks and include mock-unit-check exactly once.

- [ ] **Step 4: Add an enforced CI database job**

  Add database before checks:

      database:
        runs-on: ubuntu-latest
        timeout-minutes: 20
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with:
              node-version: 24
              cache: npm
          - run: npm ci
          - run: npx --yes supabase@2.117.0 start
          - run: npx --yes supabase@2.117.0 db reset --local
          - run: npx --yes supabase@2.117.0 db lint --local
          - run: npx --yes supabase@2.117.0 test db --local
          - run: npm run check:mocks:schema
          - run: npm run check:mocks:supabase
          - if: always()
            run: npx --yes supabase@2.117.0 stop --project-id ashyq-diagnostic

  Make the existing checks job depend on database. Run e2e:mocks after e2e:lms against the same production server.

- [ ] **Step 5: Document rollout**

  Exact order:

  1. backup staging/production Supabase;
  2. apply migration and run schema/pgTAP/live checks;
  3. import metadata-only catalog;
  4. methodist enters and verifies one Reading key and one Band scale;
  5. pilot one class;
  6. monitor audit/revision conflicts and expiry finalizer;
  7. expand templates;
  8. add Listening only after its timing/keys are verified.

  A migration existing is not authorization to publish a Cambridge template.

- [ ] **Step 6: Run the complete release matrix**

  Run:

      npm run lint
      npm run typecheck
      npm run validate:bank
      npm run check:units
      npm run check:mocks:schema
      npm run build
      npm run e2e
      npm run e2e:lms
      npm run e2e:mocks
      npm run check:tokens
      npm run check:a11y-perf
      npx --yes supabase@2.117.0 db reset --local
      npx --yes supabase@2.117.0 db lint --local
      npx --yes supabase@2.117.0 test db --local
      npm run check:mocks:supabase

  Expected: every command exits 0; no axe, overflow, tap, focus, motion, key-leak, RLS, or console failure.

- [ ] **Step 7: Update HANDOFF and commit**

  Record exact commits, files, test counts, migration status, legal/methodist blockers, production rollout state, and next safe task. Never mark the feature production-ready while real keys/Band scales remain unverified.

  Commit: test(mocks): enforce mock test release gates

---

## Dependency and Parallelism Map

- Task 1 is the contract and must finish first.
- Task 2 may begin after Task 1 types/function names are frozen.
- Task 3 depends on Task 2 RPC names.
- Task 4 depends on Task 1 and may run in parallel with Task 3 only in new UI files; existing integration files stay owned by one agent.
- Task 5 depends on Task 3 save/start/submit contract.
- Task 6 depends on Task 3 review/publish contract and may not edit student files.
- Task 7 depends on Tasks 5 and 6.
- Task 8 is integration-only and starts after all feature tasks are merged.

Recommended agent ownership:

- Backend agent: Tasks 1–3.
- Teacher UI agent: Tasks 4 and 6.
- Student UI agent: Task 5.
- Primary/integration agent: Task 7, Task 8, shared existing files, reviews, rebases, and pushes.

Because all collaboration agents share one filesystem in this environment, agents may run analysis and tests in parallel but must not concurrently edit shared files. Use fresh sequential implementation agents or separate git worktrees/branches per claimed task, then review and integrate.

## Spec Coverage Self-Review

| Approved spec area | Implemented by |
|---|---|
| Separate mock domain linked to Assignment | Tasks 1–4 |
| Cambridge metadata only; no protected media/keys in git | Tasks 1–3, 8 |
| Student/teacher/admin boundaries | Tasks 2–7 |
| Assignment, attempt, review, reopen, publication flows | Tasks 2–7 |
| Eight student/teacher routes and v3 UI | Tasks 4–7 |
| Assignment and attempt state machines | Tasks 1–3 |
| Versioned templates, private keys, attempts, answers, reviews, actions, audit | Task 2 |
| Atomic RPCs and conditional result access | Tasks 2–3 |
| Exact answer normalization, alternatives, spelling, word limit, no fuzzy match | Tasks 1–3 |
| Error taxonomy and bulk teacher marking | Tasks 1, 6 |
| Raw score, optional estimated Band, skill status and sample size | Tasks 1, 7 |
| Timer, autosave, offline queue, revision conflict, auto-submit | Tasks 2, 5 |
| RLS, key secrecy, generic Submission/Assignment defense | Tasks 2–3 |
| Explicit Russian errors and incomplete-review feedback | Tasks 2–6 |
| Unit, pgTAP, live Supabase, E2E, a11y, token and responsive gates | Tasks 1–8 |
| Production rollout and methodist/legal hold | Tasks 3, 8 |

Self-review result: all 20 specification sections map to at least one task;
there are no implementation placeholders. The only external production inputs
are legally obtained answer keys and a methodist-approved Band scale, and the
plan explicitly keeps templates unpublishable until those inputs exist.
