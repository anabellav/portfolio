# Mortgage Hub portfolio demo

Open `mortgage-hub-demo.html`. It is a separate, dependency-free HTML/CSS/JavaScript route and does not import or change the portfolio's global styles or case studies.

## Explore the demo

The initial view matches the completed-MIP dashboard. Use the **Lily** menu to change buying stage, return to the hub, open the start page, preview adviser support or reset the demo. Refreshing also restores the original state. There is no saved user data or service submission.

Suggested walkthrough:

1. Open **Lily → Change buying stage**. Choose **I need to sort out my finances** and continue.
2. Enter **450000** as the property price, then change LTV to **90%**. The deposit becomes **£45,000**. Explore the savings guidance and buying guides.
3. Choose **Get a Mortgage in Principle → Complete your MIP → View example MIP**. This is explicitly an example result, not a real eligibility assessment.
4. Select **Yes** under **Have you started viewing homes?**. Open the mortgage calculator; change the borrowing amount or term to see repayments update.
5. Return to the hub, choose **Apply for a mortgage**, and confirm that an offer has been accepted. The journey marks that step complete and previews the application hand-off.
6. Use **Lily → Reset demo** to return to the original dashboard.

Recommended comparison/recording viewport: **1440 × 1000**, browser zoom **100%**. The completed dashboard is approximately the original frame's 1919px document height. Mobile layouts stack content rather than preserving the source's horizontally clipped carousels.

## Figma source map

File: [MH - MVP](https://www.figma.com/design/6BYAp8HE5RgYyVr7Et1uPu/MH---MVP?node-id=773-116).

The wider file was reviewed before implementation, including Start, MH Home screen, MH AJ, Repayment calculator, REMO/NTB/BTL/Researcher, Specs and Explorations pages. The demo focuses on the buying journey; remortgage, buy-to-let and exception states are outside its scope.

| Source node | Use |
| --- | --- |
| `773:116` | Initial completed MIP, What's next, cost guidance, guides, navigation and footer |
| `1615:204` | Mobile MIP hierarchy and stacked progression |
| `397:351` | Buying-stage routing choices |
| `1186:506`, `2250:380` | Start/routing composition and information choices |
| `3408:2343` | Deposit calculator, savings tips, journey steps and affordability guides |
| `916:685` | Unfinished MIP and subsequent journey |
| `3736:1117` | Repayment calculator layout and input assumptions |
| `1591:399`, `2550:470` | Adviser referral and support state |

The original navy, pink, sage, blush, white and lavender-white colours are local CSS tokens. Open Sans is the main product font; Noto Sans is used for relevant buttons and estimate notes. The original illustrations and SVG icons/logos are downloaded under `assets/mortgage-hub/`. No full-screen screenshots are used as UI.

## Source gaps and deliberate demo connections

- The inspected frames do not contain usable complete prototype destinations or defined motion. The state connections, account dropdown, guide previews and confirmation dialogs are lightweight demo implementations. No full application or MIP questionnaire is recreated.
- Full guide articles, partner pages and comparison tools are not included in this demo. Their previews say so. Buying-guide previews reuse the source's MIP guidance rather than inventing article content. The duplicated Stamp duty link in the original guide list is replaced by working Mortgage/deposit calculator routes.
- The source's monthly saving-goal paragraph is Lorem ipsum. It is omitted pending approved copy. The savings-planner CSV is a blank sample template, and the checklist reuses the source's journey steps; neither is an original downloadable file.
- The source repayment example says £2,216 for a £400,000 loan over 25 years at 2.99%. These inputs instead calculate approximately **£1,895/month**. The demo uses standard repayment amortisation, rounded to pounds. The rate is an illustrative constant from Figma, including when the rate-type selector changes; no live product or rate feed is used. The period selection changes the introductory-period wording, not the assumed rate.
- A calculator change does not alter the MIP borrowing limit. The MIP remains a sample result of £400,000 with a £50,000 deposit. Its download is clearly labelled as an illustrative text summary, not a valid certificate.
- Adviser support and application screens send nothing. The original historical footer is preserved, with a prototype-specific privacy explanation instead of an external legal link.
- The Google Fonts stylesheet is the only external runtime resource; all product imagery is local. Fonts fall back to Arial if unavailable.

## Checks

Verified in Chromium at 1440, 834, 390, 375 and 320px widths: initial dashboard, stage routing, deposit calculation, example MIP completion, viewing state, offer acceptance, repayment updates, reset and refresh. Final checks also covered keyboard focus, Escape-to-close, narrow-screen dialogs, sample downloads, reduced-motion mode and image loading. No horizontal overflow or JavaScript console errors were found. At 1440px, the initial MIP is 632 × 346px at x404/y92; the next-step panel is 960 × 233px at x240/y515, matching the source frame's geometry.
