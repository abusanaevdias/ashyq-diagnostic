# ASHYQ: unified Apple presentation

## Direction

One visual language, three densities: a spacious public introduction, scannable
learning catalogs, and a focused work surface for student/teacher tasks.
The owner approved Apple design and the light editorial cohort composition;
the existing animation system remains part of that direction.

Use `apple-design`, `21st-ui-build`, and `21st-ui-review`. Exploration is not a
new approval gate: the visual direction is already selected. Theme publishing
(`21st-design-sync`) is unrelated to implementation and is not performed.
No paid generation or third-party component installation is necessary.

## References

- [Apple layout guidelines](https://developer.apple.com/design/human-interface-guidelines/layout): deliberate alignment and grouping.
- [Apple Education](https://www.apple.com/education/college-students/): restrained typography, strong content hierarchy, generous section spacing.
- [Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/): immediate feedback and interruptible interactions, applied by the existing menu/segment controllers.
- Local approved cohort composition and existing StudyDesign/FluidSegments/CleanUi primitives.

`21st search "minimal editorial education website spacious typography course cards" --context auto`
returned HTTP401. No external 21st reference was retrieved or used as evidence.
The installed deterministic `21st review` command works independently.

## Implemented coverage

| Surface | Presentation |
| --- | --- |
| Shared header/footer | Native primary links, exact section marker, the same mobile quick links across routes; full directory stays available. Existing menu event timing retained. Trainer link also in footer. |
| Home | Centered introduction; on desktop, live learning example and library form a complementary two-column section; mobile stacks naturally. Existing diagnostic actions and resumed runs stay available. |
| Courses and lessons | Opt-in system typography, calmer title weight, enlarged course headings, rounded surfaces, consistent action hierarchy. |
| Admissions | System typography, destination labels, consultation card and support cards. Actual cost/scope remain agreed at a meeting. |
| About, contacts, career and diagnostic entry | Opt-in shared type, readable controls, focus and anchor clearance; actual content and diagnostics state machine retained. |
| Program, progress, FAQ, documents, community | Legacy `.v3` compatibility layer adopts system type and heading hierarchy. Their existing information architecture remains. |
| Seasons and press | Their independent shells adopt the same typography. No score or press-source changes. |
| Trainer catalog and bank | Consistent card rhythm, quieter illustration surface, readable category metadata. No source/module publication changes. |
| Writing introduction and library | Softer surfaces, clearer library shortcuts and metadata; existing interactive walkthrough and chapter stages retained. |
| Exercise workspaces | Shared StudyDesign typography, form sizes, reading line height and fieldset overflow protection. Each trainer retains its existing task layout and state colors. |
| Student/teacher/account screens | Shared LMS shell adopts system typography and surfaces; field labels are ink and controls at least 16px. Actual authorization and classroom behavior unchanged. |
| Blog | Blog owner files/composition untouched. Only intentionally shared header/footer and any already-shared LMS primitives inherit changes. |

This is a system-wide presentation pass, not a bespoke reconstruction of every
individual screen. `SITE-DESIGN-047.svg` is an editable schematic of the design
language, **not a screenshot or proof of runtime layout**. The application source
and its real components remain authoritative.

## Adversarial source review

- A new font on `HomeV3.page` would also alter the active blog owner's composition.
  Resolved by adding an explicit `applePage` opt-in; BlogV3/BlogPostView excluded.
- Adding mobile quick links increases header height. Menu remains anchored to
  the actual header bottom; page controls use 160px scroll clearance. Actual
  narrow-screen and hash destination acceptance still needs a browser.
- A synchronous menu close can invalidate the link currently being activated.
  Existing delayed close/native link handling is untouched.
- Desktop bento must not retain the old library `span 5`. Its column is explicitly
  reset to `auto`; the heading spans both tracks. Both tracks use `minmax(0,...)`.
- A course/admissions form must not widen its grid with long content. Enrollment
  columns now have zero minimum tracks; controls retain max-width and 16px text.
- Redesign must not erase incorrect-answer crosses, saved work, role boundaries,
  or DRAFT locks. No storage, source, permission, provider, or grading code changed.
- The results scene must not invent intermediate scores. Existing literal89/112
  and 7.0+ remain; animations and pause/reduced-motion behavior are untouched.

## Acceptance boundary

CUA browser inventory returned `[]` during this task. No real browser, iPhone,
tap, visual layout, or animation acceptance is claimed. Compilation/static
checks are recorded in HANDOFF separately. Use a preview deployment for visual
acceptance before merging this broad presentation change into production.

Review routes: `/`, `/courses`, `/courses/ielts`, `/courses/sat`, `/mentoring`,
`/trainers`, `/writing/trainer`, `/library`, a library chapter, `/diagnostic`,
`/career`, `/program`, `/progress`, `/season`, `/press`, `/about`, `/contacts`,
`/faq`, `/search`, `/login`, and authorized `/me` + `/teacher` + class pages.
At320/390/768/1440px, inspect wrapping, menu activation, keyboard focus, source
answers after refresh, wrong/correct markers, pause/reduced motion, and zoom.

No trainer methodology/provider/RLS/physical-device launch gate is closed by
this visual change. No new tests are added or manually run for this request.

## Recorded local checks

### Expressive accents extension

The owner requested a more interesting design with accents and smooth animation.
Added a native server-rendered `LearningPathAccent` below the home example/library
pair: three method stages, simple line icons, a moving decorative ink segment and
staggered icon halos. It describes the training method; it does not display or
change the learner's current stage or completion. On narrow screens the stages
stack, and the horizontal connector is removed.

The cohort89 receives a red editorial oval with a soft fill and a one-time reveal.
The number itself remains literal89, alongside112 and7.0+. Catalog illustrations
use soft IELTS and dark SAT panels with a quiet moving circular detail; exam names
remain written out, so color is not the only distinction. One directions heading
reuses the existing animated underline.

New motion uses existing viewport attributes, CSS only, with no library, request,
timer, or input handler. Every new animated child has an explicit manual pause,
background-tab pause, reduced-motion and print rule. No text is hidden pending JS.

Adversarial source review: the path was moved below the usable example/library
pair to avoid increasing the wait before the first actual interaction. Connectors
are decorative and pointer-transparent, and disappear on mobile. New layering is
isolated inside each card/number; answer markers, stored responses, menu activation,
source IDs and permissions are untouched. Browser inventory is still empty; no
new runtime/phone animation acceptance is claimed. The repeat 21st reference search
again returned401. Focused review of all5 changed UI sources returned0 findings.
Final extension webpack build generated155 pages successfully, including TypeScript;
focused ESLint and diff checks passed. Tests were not added or manually run.
`ACCENTS-047.svg`/`.png` show an editable schematic of the new visual accents.

Next16.3.5 production build with webpack generated155 pages successfully;
TypeScript --noEmit and focused ESLint passed. 21st review inspected28 files
with0 errors/warnings/suggestions. git diff --check passed. These are compilation
and deterministic source checks, not real browser or physical-device acceptance.
Feature PR: https://github.com/abusanaevdias/ashyq-diagnostic/pull/168 .

## Public release after phone access feedback

Exact feature0b62fd57d5f554a3a1d6ba69a670c59d30f53a8f passed full automatic
CI39288583462. The saved CI mobile390px and desktop1440px home screenshots were
visually inspected: first-fold headings/actions/header fit. This does not prove
physical-phone input or animation fluidity. Pinned PR168 merged asdd9cbb9,
Vercel Production7179849197 succeeded. Canonical `/` and `/trainers` returned200
without Vercel login and contained the new learning-path/SAT catalog hooks.
The owner can now open https://ashyq-diagnostic.vercel.app/ on a phone.
No preview protection, application roles or private-data access was changed.
Earlier preview-only acceptance notes above describe the pre-release boundary;
physical-device feedback remains welcome and is not falsely certified.
