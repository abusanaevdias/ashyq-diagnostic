# ALL-INCLUSIVE-049

Owner request: keep the prior presentation, add a fourth service combining IELTS,
SAT and mentoring, previous price 370,000 KZT and current price 250,000 KZT.

## Presentation and offer

- Restore the five home presentation files from 9f42b66 (pre-048). Keep approved
  047 shared Apple presentation, motion controls and existing learner state.
- Central offer prices and eight service descriptions live in club-offer.ts.
- Shared home/catalog offer card links to /all-inclusive. Catalog has four
  services when the All filter is active; exam filters retain their two programs.
- Package page is in native menu, site search and sitemap. Its inquiry fixes the
  selected package and asks for contact time, not an invented combined class.
- Prepared WhatsApp message repeats prices and asks to confirm actual scope.
  No message is sent automatically, no payment or seat reservation is created.

## Adversarial source review

1. “Everything” could imply tuition/visa/exam costs: external fees, translations,
   travel, accommodation and university tuition are explicitly separate.
2. Coaching could be read as a guaranteed offer/visa/score: no outcome promise.
3. Priority support could imply 24/7: explicitly in working hours, response
   procedure agreed before starting; no invented SLA or unlimited access.
4. Package could accidentally request an IELTS group only: separate program
   union and consultation branch preserve the all-inclusive selection and price.
5. “Until university” could imply unbounded multi-year scope: duration, meetings,
   application count and end of support are agreed before payment.
6. Price drift: cards, dedicated page and inquiry use one central offer object.
7. Reversion could erase earlier approved design: only five known 048 product
   files restored; historical screenshots/docs retained as evidence.

Local compilation/lint and static design review are recorded at release; existing
CI remains the release gate. No physical-device or animation-fluidity claim is
inferred from source review or emulated screenshots.

First CI39297813638 passed build/type/lint/units and 163/164 main E2E
assertions. Its sole failure was the previous exact two-card catalog expectation;
the owner now explicitly requests four services. Update that existing assertion
to four (retain all four free resources and the exam filter checks), without
removing or disguising service cards. Add package enrollment scroll offset so
the native CTA target clears the sticky navigation.
