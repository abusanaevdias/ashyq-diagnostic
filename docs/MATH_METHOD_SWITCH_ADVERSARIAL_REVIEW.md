# Method Switch pilot review

Original authored content: two linear systems and two quadratic/line intersections. No copied SAT items, external graph service, AI, score prediction, student data or persistence.

## Counterexamples and boundaries

- Correct numeric answer with nonsense working: report coordinate agreement only; free working and claimed method are not automatically graded.
- Negative intersection (-1,1) in quadratic items: valid system point but fails explicitly requested positive x. Feedback distinguishes this from calculation failure.
- Table includes both roots: table identifies candidates, does not prove no other roots. Exact substitution and algebra supply verification.
- Plot approximation: do not accept approximate guessed values as exact coordinates; explanations give exact solutions after commitment.
- Same method twice: initial review excludes the self-reported first method from recommended alternatives. Transfer permits honest reporting of the actual method used rather than forcing a false claim.
- Different problem durations: display elapsed open-attempt time including reading/pauses without claiming causal speed improvement.
- Empty fields, NaN, infinite or huge input: strict finite decimal parsing rejects them. Comma decimal supported.
- Transfer reset: coordinates, working, actual-method report and plan reset; selected alternative is named on the fresh problem, but prepared graphs/tables are withheld until commitment. Adversarial review found that displaying a ready table during transfer leaked the answer; removed before release.
- Graph accessibility: solid/dashed lines plus equations, large SVG text and exact table; meaning does not rely on colour alone.
- Long headings/mobile: adaptive minimum card widths, min-width zero and wrapping inherited from fixed trainer card rules.

## Required checks

Target lint, TypeScript, production build, design review, full branch CI, browser initial/transfer/final flow, mobile overflow and production route after merge. Local/CI checks do not substitute for production confirmation.

## Local evidence 2026-10-06

Target lint and TypeScript PASS. Build PASS before final transfer hint removal; final branch CI required. 21st review: zero findings. Token audit 9/9. Browser: empty guard, wrong negative intersection, graph review, comma coordinate parsing, independent fresh table transfer (zero table elements before commitment), correct linear pair, original attempts and plans retained. Mobile 390 px document width equals scroll width. Browser smooth-scroll automation clicked an unrelated footer link once; recovered with observed keyboard interaction rather than treating that attempt as success.
