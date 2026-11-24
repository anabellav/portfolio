# Automated table-filters video export

The repeatable export uses **Playwright recordVideo**, not a manual screen recording.

## Run again

From the Portfolio directory:

```sh
python3 -m venv .venv-recording
.venv-recording/bin/python -m pip install -r scripts/requirements-recording.txt
.venv-recording/bin/python -m playwright install chromium-headless-shell ffmpeg
.venv-recording/bin/python scripts/record-table-filters.py
```

Setup is already installed locally. Subsequent exports need only the last command.
Requires Python 3.9 or newer. Dependencies are isolated in `.venv-recording`.

## Outputs

- `assets/videos/old-filters-demo.webm`
- `assets/videos/old-filters-demo.mp4`
- `assets/videos/old-filters-demo-poster.png`: source-page screenshot
- `assets/videos/old-filters-demo-review.png`: decoded interaction frame for visual review
- `assets/videos/old-filters-demo-verification.json`: dimensions, playback duration and checks

The case study uses the MP4. Refreshing the normal demo still resets it, and the separate after demo is unchanged. Existing recordings are retained; these specifically named export files are replaced when the script runs again.

## Framing and quality

The script inspects the natural **880 × 558 CSS pixel** demo canvas before recording. It opens a local server on an automatically selected loopback port, and closes it when finished. No existing preview server or current browser window is required.

The recording context has an explicit **1760 × 1116 viewport** and matching **recordVideo size**. The UI is rendered at uniform 2× browser zoom with device scale factor 1. This retains the natural aspect ratio while producing 2× text and graphics directly in the browser. Device scale factor alone does not reliably increase Playwright video dimensions.

Recording-only CSS sets html/body margin and padding to zero, hides overflow, removes outer borders/outlines/shadows and makes the demo canvas fill the frame. Its outer corner radius becomes zero for edge-to-edge capture; normal demo styling and internal table/control borders remain unchanged. No iframe, browser chrome, pointer decoration, overlays, cropping or video resizing are used.

The matching Playwright headless Chromium is used deliberately. Installed desktop Chrome produced clipped screencast frames despite reporting the correct viewport. The recorder tests the exported pixel edges to catch that failure rather than concealing it.

The first second of browser/font setup is trimmed in time only. The WebM uses VP9 CRF 18; MP4 uses H.264 CRF 18, slow preset, yuv420p and faststart. Neither conversion contains scale, crop, pad or overlay filters. The MP4 and WebM retain exactly 1760 × 1116 pixels.

## Automated interaction

1. Pause on the eight initial datasets.
2. Open Updated.
3. Type `September` in the search input.
4. Enter From `2026-09-01`.
5. Enter To `2026-09-30`.
6. Apply with OK.
7. Verify two matching datasets and hold the final state for 2.5 seconds.
8. Open the Dataset column filter, search for `Workforce`, and apply while the date range remains active.
9. Hold the text-only “No results found” state for 2.5 seconds. It uses the old demo's existing font and muted text treatment, without an illustration.
10. Reset the Dataset query to restore the two September records, then close the popover.

`assets/videos/old-filters-demo-empty-state.png` captures this state directly from the browser. Both the empty-state transition and recovery are checked by the recorder.

Input values and short typing delays are easy to edit near the top of `scripts/record-table-filters.py`. Calendar dismissal uses Escape without discarding the form draft.

## Verification

The script verifies the root canvas exactly fills the recording viewport, there are no iframes or horizontal overflow, the interaction returns two records, and there are no page errors. It decodes both exported formats to confirm the pixel dimensions, a visible initial table and clean white outer edges. Review the decoded PNG for typography, popup placement and intentional internal UI borders.

## Normal interactive preview

Open `table-filters-demo.html` directly, or use the local preview server. `table-filters-demo-record.html` is a separate borderless iframe wrapper for interactive preview; the automated recorder opens the demo directly and does not use it.

Reload or call `window.resetTableFiltersDemo()` to reset. Shift + R also resets when focus is outside a text input.

Source interface: [Figma old filters, 189:4577](https://www.figma.com/design/UycHJSZDRbeKbIfL2ynruU/Portfolio?node-id=189-4577). The working date filtering uses sample data, inclusive dates and a calendar anchored to September 2026. It is a demonstration, with no customer data or saved state.

