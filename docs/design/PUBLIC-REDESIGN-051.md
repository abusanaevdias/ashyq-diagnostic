# Native approved presentation — PUBLIC-REDESIGN-051

## Brief and approved concept

Port the owner-approved animated preview into the existing Next.js application.
Russian-speaking secondary-school learners need to find free practice, understand
the result of an attempt, and discover IELTS/SAT/admissions services.

Idea: an open workbook turns a first attempt into a clear next step.
Metaphor: paper, proof, correction. Motion settles like paper.
Signature: the live HTML learning scene, animated service posters and a desktop
service rail when the viewport can show a complete card. Phone layouts remain
vertical and use native scrolling. No loader or forced smooth-scrolling engine.

Keep ASHYQ's cream, ink and red palette, actual logo, literal cohort figures,
central offer data and real calls to action. Onest 400/700 is an opt-in public
font token; independently owned blog and private routes keep their fonts.
Public fonts preload early and use optional display to prevent late layout
shifts. Slow first visits may keep the system fallback for that page view.

## Native implementation

- Root presentation is opt-in by public pathname; no iframe or preview router.
- New home composition preserves literal H1, saved-run continuation and real
  IELTS/SAT callbacks. Home exercise has its own isolated local storage key.
- Courses, course detail, mentoring and package pages use the same semantic
  HTML/SVG service art. Actual forms, prices, route destinations and copy remain.
- Diagnostic intro has actual exam choices; the diagnostic state machine is unchanged.
- Trainer/library catalogs receive public hierarchy and typography.
- Eleven trainer interfaces receive explicit feedback summaries and stage routes.
  Answer/evidence/model/numerical checks remain independent. Free writing,
  confidence and speech are not assigned invented grades.
- Checkpoint controls can be folded. They start open so saving is discoverable;
  restore/import/error/exit messages open them again.
  Existing opt-in consent, record format, storage scope and all write guards remain.

SAT uses a permanent SVG curve and a separate moving marker. Globe uses projected
SVG circles, not a bitmap/canvas: right crop leaves 65% of its width visible.
GSAP timelines pause outside the viewport, in hidden documents, on manual pause
and with reduced motion. Controllers unmount with home/diagnostic screens and
remount with course filters. All new animation listeners have cleanup.

## Asset provenance

- Onest: existing approved preview font files, SIL Open Font License in
  `public/design/OFL-Onest.txt`; upstream https://github.com/simpals/onest.
- IconPark TwoTone: the owner's third selected icon direction, via pinned
  Iconify icon sets commit `d18201500d74a8bb6d5089e844e60e694b770018`,
  https://github.com/iconify/icon-sets; Apache-2.0 license retained. SVG IDs are
  isolated with React useId, mask colors use ASHYQ palette variables.
- GSAP + ScrollTrigger 3.15.0: approved preview distributions, self-hosted under
  `public/design/`. Original upstream license headers remain; an ESLint
  vendor-file directive and trailing-whitespace normalization are the only edits. https://gsap.com/standard-license.
- Globe: pinned Natural Earth public-domain land, recorded in
  `public/design/GLOBE-SOURCE.md`. Point extraction used d3-geo 3.1.1 (ISC;
  `public/design/D3-LICENSE`); production has no d3 runtime dependency.

No npm package, provider flag, API, database schema, role or RLS change.

## Evidence and release boundary

Source review by an independent critic found and corrected a paragraph-leading
collision, motion mount lifecycle, checkpoint off-state copy, duplicated lesson
step numbers and manual feedback-animation pause. Browser review found and
corrected inherited diagnostic grid spans and narrow-card artwork sizing.
The screenshot critic then caught the service poster's four-skills caption on
the two-skill diagnostic. Its local caption now explicitly says Reading +
Listening. Wrong-evidence feedback includes the selected source quote and the
task's own explanation. Supporting phone copy is larger. Public first-entry
links remain before the decorative scene and match their DOM/focus order.

Local checks: webpack production build (157 generated routes), TypeScript,
ESLint and diff whitespace. Manual native browser acceptance includes real home
diagnostic launch/return, course filters, mentoring, Reading's correct-answer /
wrong-evidence mixed result, opt-in save/reload/resume, and catalog navigation.
Screenshots and the final check ledger are recorded alongside this file.

The first screenshot pass scored visual design 6.8/10, clarity 6.2, creativity
6.5 and content 6.5. These are a limited critic's scores, not award acceptance;
animation feel, performance, full accessibility and private flows were not
scored from stills. The concrete caption and readability findings were addressed.
The fresh final critic found no accidental horizontal crop or feedback ambiguity;
it flagged Reading's return control under the sticky header. A targeted scroll
fix passed the final build and independent source review. Browser inventory was
empty before the final repeat, so this remaining visual check is explicitly open.

This is not a full-site completion claim. Many secondary pages receive a shared
shell rather than a new composition. Diagnostic question/result interiors and
authenticated student/teacher workspaces remain a separate reconciled slice.
Blog composition remains under BLOG-REDESIGN-001. AI/provider quality, teacher
source approvals, real Supabase isolation and physical-device acceptance are
not established by this visual port.

Implementation is reviewable on its feature branch. Do not merge/deploy it on
the basis of this document: the owner's no-deploy preview boundary remains.
