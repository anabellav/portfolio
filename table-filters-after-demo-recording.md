# New table filters: recording guide

Preview: http://127.0.0.1:8765/table-filters-after-demo.html

This is a separate HTML/CSS/JavaScript demo. The earlier demo and portfolio pages are unchanged. All fonts, icons and sample data are local; no state is saved between reloads.

## Match the before recording

The automated recorder uses the same natural **880 × 558 CSS pixel** canvas and **1760 × 1116 video frame** as the before demo. It renders the UI at uniform 2× browser zoom, with an explicit matching viewport and Playwright recordVideo size. No manual screen recording, iframe, browser chrome, outer stroke, cropping or resizing is used. Intentional internal UI borders remain visible.

Run from the Portfolio directory:

```sh
.venv-recording/bin/python scripts/record-table-filters.py --demo new
```

The isolated Playwright/ffmpeg environment is already installed. For setup on another machine, see `table-filters-demo-recording.md`. The default command without `--demo new` still records the old demo.

Outputs in `assets/videos/`:

- `new-filters-demo.webm`
- `new-filters-demo.mp4`
- `new-filters-demo-poster.png` and `new-filters-demo-review.png`
- `new-filters-demo-verification.json`

The case study uses the MP4 under “What I considered”. Both export formats retain 1760 × 1116 pixels and are checked for clean outer edges and a visible initial interface. The recording demonstrates Functional search, clearing the query, applying a September date range and the Filters (1) state. It then searches for Workforce while the dates remain active, producing zero matching records. The no-results state is held for 2.5 seconds before clearing the search to restore two records and clearing the dates to restore all eight.

The empty state uses the approved binocular illustration from [Figma 725:186820](https://www.figma.com/design/5DY41Fc4WjOMjQvkEeNehX/ODS?node-id=725-186820), stored locally as `assets/table-filters-after-demo/no-results.svg`. Its “No results” heading and “Consider adjusting the filters.” message follow the supplied reference. The table headers, search query and active-filter count remain visible. `new-filters-demo-empty-state.png` is a native browser screenshot of this recorded state.

For interactive preview only, **960 × 640 CSS pixels** at browser zoom 100% remains supported, with the demo canvas centred inside the surrounding page.

The Figma after-state frame is 880 × 396px with four records. This demo keeps its 32px toolbar, 16px toolbar-to-table gap, 14px Inter typography, 52px rows and 792px table width at their designed scale, inside the taller recording canvas. It uses the same eight records as the before demo. Seven rows fit below the header; the eighth is available by scrolling within the table. The canvas does not resize while filtering or opening the calendar.

## Suggested take

1. Start with an empty search and no date filters.
2. Type **Functional** in the toolbar search. Two datasets remain. Select the text and delete it to show all eight again, or press Escape while the search has focus.
3. Click **Filters**. Open **From** and select **1 September 2026**. Open **To** and select **30 September 2026**.
4. Click **Apply filters**. Pause on the two September records and **Filters (1)**.
5. Click the small circled clear icon beside **Filters (1)**. All eight records return and the count disappears.

Alternative finish: reopen Filters, then click **Clear all** inside the popover. That clears the dates immediately and leaves the popover open.

## Reset

Refresh for a clean initial state. **Shift + R**, when not typing in a text field, also resets search, dates, draft values, table scroll and selected rows. For automation, call `window.resetTableFiltersAfterDemo()`.

Escape closes the calendar first, then the filter popover. Clicking outside dismisses uncommitted changes. Dates can also be entered as `YYYY-MM-DD`.

## Figma source and what is unspecified

Source: [new filters, 192:5332](https://www.figma.com/design/UycHJSZDRbeKbIfL2ynruU/Portfolio?node-id=192-5332).

Inspected default `192:5427`, hover `192:5428`, open `192:5536`, date picker `203:4686` and applied count `203:5227`, plus their referenced button and calendar components. There are **no prototype reactions or nearby behaviour notes** connecting these frames or in the referenced new calendar. These are the implementation choices where the design is silent:

- **Search:** updates the results live, case-insensitively, across dataset names and update dates. A purple border keeps an active query visible after blur. Search combines with the date range using AND; it is not included in the applied-filter count.
- **Date criteria:** From and To are inclusive boundaries of one Updated-date range, so the badge is **Filters (1)** even with both boundaries set. A single boundary also works. No additional criterion categories are invented.
- **Apply:** date edits remain drafts until Apply filters. The apply button is enabled only for valid, changed criteria. Invalid dates and reversed ranges show a short error. Empty results display a readable table message.
- **Clear:** both the inline clear icon and popover Clear all remove the date criteria immediately. They preserve toolbar search. Clear all leaves the popover open; the inline icon returns to the table.
- **Dates in the example:** Figma shows January 2024 while its sample rows use 2026. Like the before demo, an empty picker starts in **September 2026** for a short, consistent take. A populated field opens its selected month. The Today outline is pinned to **3 October 2026** for repeatable recordings. The new calendar has no Today button.
- **Calendar navigation:** single arrows move one month, double arrows move one year. No month/year-grid state was supplied for this new picker, so none is added. The To picker is repositioned when necessary to remain inside the recording canvas.
- **Motion:** no timing is specified in these frames. Popovers fade in over 100ms with ease-out, matching the restrained pace of the before demo. Reduced-motion preferences disable animation.
- **Settings:** the settings icon is present to match the interface, but no settings flow is supplied. It is intentionally inactive. Row checkboxes work, but selection does not affect the filter count.

These choices are demo behaviour, not claims about the shipped product. The extra four records are fictional demonstration data. Instructions remain outside the recorded interface.

## Local preview server

The existing server is bound to `127.0.0.1:8765` only. Nothing is published. The HTML also works directly from disk.

If the server is stopped, run this from the Portfolio folder:

```sh
ruby -rwebrick -e 'WEBrick::HTTPServer.new(Port: 8765, BindAddress: "127.0.0.1", DocumentRoot: Dir.pwd).start'
```
