# Trussle Mortgage Hub case study

Page: `trussle-mortgage-hub.html`.

Source: [Figma frame 346:19851](https://www.figma.com/design/UycHJSZDRbeKbIfL2ynruU/Portfolio?node-id=346-19851), 1440 × 6888px. The supplied case-study copy is HTML, with a 980px main container and 692px reading width. The shared portfolio header, minimal footer, local Lato fonts, Open Sans stylesheet, section classes, metadata and sticky-navigation script are reused. The minimal footer follows the Figma content; the frame itself ends with whitespace.

| Local asset under `assets/mortgage-hub-case-study/` | Figma source | Use |
| --- | --- | --- |
| `hero-export.png` | `348:20216` | Exact 980 × 756px hero crop, including its subtle border and rounded corners |
| `hero-source.png` | Image fill of `348:20216` | Original 1440 × 2602px product screenshot, retained for future asset changes |
| `hypothesis-workshop.png` | `357:6714` | 2810 × 1442px workshop and hypothesis map |
| `direction-guidance.png` | `359:6971` | Guidance example |
| `direction-tools.png` | `359:6875` | Deposit calculator example |
| `direction-progression.png` | `359:7024` | Next steps and adviser support example |
| `design-mip.png` | `359:7032` | Desktop/mobile MIP composition |
| `design-routing.png` | `359:7039` | Desktop start page and mobile buying-stage composition, as shown in the case-study frame |
| `thumbnail.png` | `328:16643` (`mh-tn`, Playground page) | Exact composition matching the attached homepage thumbnail, exported at the node’s configured 2× scale |
| `thumbnail-sharp.svg` | `328:16643`, with editable screen originals `328:16908` and `328:17138` | Current homepage thumbnail. Preserves the composition's background, masks and shadow, replacing its embedded screenshots with outlined vector UI exports. The original pig illustration remains embedded at its native resolution. |

All artwork is local, with no temporary Figma URLs at runtime. The full case-study screenshot is used only for comparison and is not included in the page. Product UI text inside the original visual assets remains part of those assets; page headings, body copy, research findings and metadata remain selectable HTML.

The homepage retains its existing title-on-hover card treatment. The supporting description is the third card link’s accessible description, without introducing a new visible card layout. The first, second and fourth project cards are unchanged.

Verified in Chromium at 1440, 1024, 768, 390 and 320px widths: image loading and proportions, section links and heading offsets, active-section tracking, mobile navigation scrolling and absence of horizontal overflow or console errors. Homepage checks covered equal thumbnail dimensions, hover/focus states, the new card destination and the back-to-work link. Hash comparisons confirmed that the existing case studies and shared styles/scripts were unchanged.
