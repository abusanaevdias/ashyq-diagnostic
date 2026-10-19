# Site motion — 19 October 2026

User request: research smooth animation references, apply apple-design, implement the suitable patterns. The three cohort visual concepts remain unselected; their layout is unchanged.

## References and selection

- Apple, Designing Fluid Interfaces, WWDC18: https://developer.apple.com/videos/play/wwdc2018/803/ — immediate input feedback, redirectable motion, consistent origin. Applied to the full-site menu with a critically damped spring. A repeated tap retargets its existing position and velocity; no artificial input delay.
- Motion stagger: https://motion.dev/docs/stagger — short sequential entrances. Applied to batches of public cards, 55ms intervals capped at165ms.
- Motion scroll-triggered example: https://examples.motion.dev/js/scroll-triggered — understated viewport entrances. Applied only to explicit public-section/card hooks; opacity0.4→1 and14px translation over520ms. Already visible content is skipped on initialization/restored scroll.
- Web Animations API: https://developer.mozilla.org/en-US/docs/Web/API/Element/animate and Intersection Observer: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API — native implementation, no added runtime package.

## Applied patterns

1. Full menu: symmetric12px movement and0.985→1 scale, spring stiffness380 with critical damping; Escape/outside/close/focus behavior preserved. Links are inert as soon as closing starts, summary remains available for reversal. Route change/background tab settles immediately.
2. Public sections: opt-in Reveal wrapper; no pending opacity0 styles or dependency on JS to expose content.
3. Course/trainer/offer/result cards: viewport appearance; no motion in editable exercises or source text.
4. Hover-capable fine pointers:4px card lift, small shadow change; touch devices keep ordinary scrolling.
5. Images inside opted-in cards:1.025 scale on hover,650ms easing.
6. Shared CTA/home start buttons: immediate0.97 press feedback, smooth release; no click/navigation delay.

Existing FluidSegments spring remains unchanged. All factual prices, cohort counts, source identities, roles, auth, storage, analytics and metadata stay unchanged. Root layout changes only mount the isolated presentation controller.

## Boundaries

Reduced-motion mode skips JS entrances, settles menu motion and disables added hover/press movement. Changing the preference during an animation cancels active viewport animations. Keyboard focus cancels a card entrance. Background tabs and printing cancel viewport animations. No animation hides content before hydration, changes displayed counts, hijacks scrolling or requires completion before navigation.

Existing menu E2E expectations now wait up to2s for the physical close to finish. No tests added or manually run for this request. TypeScript, focused ESLint and production compilation are tracked in the task ledger. Browser provider inventory is empty; physical-phone/visual motion acceptance is not claimed.
