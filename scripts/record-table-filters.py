#!/usr/bin/env python3
"""Record the real demo with Playwright recordVideo, then export without resizing.

Run from any directory: .venv-recording/bin/python scripts/record-table-filters.py
Setup instructions: table-filters-demo-recording.md
"""
import argparse
import functools
import json
from pathlib import Path
import subprocess
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import imageio_ffmpeg
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/videos"
SCALE = 2  # Render the UI at 2x in the browser, never upscale video pixels.
SETUP_SECONDS = 1  # Remove only browser/font initialisation, not any UI edges.
SEARCH = "September"
FROM = "2026-09-01"
TO = "2026-09-30"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def ffmpeg(*args):
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner",
                    "-loglevel", "error", "-y", *map(str, args)], check=True)


def verify_video(path, size):
    """Decode actual pixels: check dimensions, white edges and visible table text."""
    frames = imageio_ffmpeg.read_frames(str(path), pix_fmt="rgb24")
    try:
        metadata = next(frames)
        assert tuple(metadata["size"]) == tuple(size), metadata
        pixels = next(frames)
        width, height = size
        # These are intentionally empty white gutters in the designed UI.
        # A default iframe stroke or recorder padding fails this check.
        for y in (0, 1, height - 2, height - 1):
            for x in range(width):
                rgb = pixels[(y * width + x) * 3:(y * width + x) * 3 + 3]
                assert min(rgb) >= 240, f"Outer stroke/padding at {x},{y}: {list(rgb)}"
        for x in (0, 1, width - 2, width - 1):
            for y in range(height):
                rgb = pixels[(y * width + x) * 3:(y * width + x) * 3 + 3]
                assert min(rgb) >= 240, f"Outer stroke/padding at {x},{y}: {list(rgb)}"
        dark = sum(pixels[(y * width + x) * 3] < 150
                   for y in range(90, 190, 4) for x in range(90, width - 90, 4))
        assert dark > 50, "The first exported frame must show the table, not a blank page."
        return {"size": metadata["size"], "fps": metadata["fps"],
                "duration": metadata["duration"], "outer_edges": "clean",
                "initial_table": "visible"}
    finally:
        frames.close()


def interact_old(page):
    page.get_by_role("button", name="Filter Updated", exact=True).click()
    page.wait_for_timeout(500)
    page.get_by_role("searchbox", name="Search updated dates").press_sequentially(SEARCH, delay=95)
    enter_dates(page)
    page.get_by_role("button", name="OK", exact=True).click()
    expect(page.locator("#result-status")).to_have_text("2 datasets shown")
    page.wait_for_timeout(2500)
    # Keep the date criteria applied, then search a dataset outside that range.
    page.get_by_role("button", name="Filter Dataset", exact=True).click()
    page.wait_for_timeout(400)
    page.get_by_role("searchbox", name="Search datasets").press_sequentially("Workforce", delay=95)
    page.wait_for_timeout(450)
    page.get_by_role("button", name="OK", exact=True).click()
    expect(page.locator("#result-status")).to_have_text("0 datasets shown")
    expect(page.locator(".empty-row")).to_have_text("No results found")
    assert page.locator(".empty-row img").count() == 0
    page.screenshot(path=str(OUTPUT / "old-filters-demo-empty-state.png"))
    page.wait_for_timeout(2500)
    # Clear the Dataset query while preserving the September range.
    page.get_by_role("button", name="Filter Dataset", exact=True).click()
    page.wait_for_timeout(400)
    page.get_by_role("button", name="Reset", exact=True).click()
    expect(page.locator("#result-status")).to_have_text("2 datasets shown")
    page.keyboard.press("Escape")
    page.wait_for_timeout(1400)
    return {"search": SEARCH, "from": FROM, "to": TO, "results": 2,
            "empty_state": {"dataset_search": "Workforce", "dates_applied": True,
                            "results": 0, "message": "No results found", "illustration": False},
            "recovered_results": 2}


def enter_dates(page):
    page.wait_for_timeout(450)
    for selector, value in [("#filter-from", FROM), ("#filter-to", TO)]:
        page.locator(selector).click()
        page.locator(selector).press_sequentially(value, delay=85)
        page.keyboard.press("Escape")  # Close the calendar without discarding the draft.
        page.wait_for_timeout(450)
    page.wait_for_timeout(250)


def interact_new(page):
    search = page.get_by_role("searchbox", name="Search datasets")
    search.press_sequentially("Functional", delay=95)
    expect(page.locator("#result-status")).to_have_text("2 datasets shown")
    page.wait_for_timeout(900)
    search.press("Escape")
    expect(page.locator("#result-status")).to_have_text("8 datasets shown")
    page.wait_for_timeout(500)
    page.get_by_role("button", name="Filters", exact=True).click()
    enter_dates(page)
    page.get_by_role("button", name="Apply filters", exact=True).click()
    expect(page.locator("#result-status")).to_have_text("2 datasets shown")
    expect(page.locator("#filter-label")).to_have_text("Filters (1)")
    page.wait_for_timeout(2500)
    # This record exists outside September: search AND active dates yield no results.
    search.press_sequentially("Workforce", delay=95)
    expect(page.locator("#result-status")).to_have_text("0 datasets shown")
    expect(page.locator(".empty-state")).to_be_visible()
    expect(page.locator("#filter-label")).to_have_text("Filters (1)")
    expect(page.locator(".empty-state img")).to_have_js_property("complete", True)
    page.screenshot(path=str(OUTPUT / "new-filters-demo-empty-state.png"))
    page.wait_for_timeout(2500)
    search.press("Escape")
    expect(page.locator("#result-status")).to_have_text("2 datasets shown")
    page.wait_for_timeout(650)
    page.get_by_role("button", name="Clear all applied filters", exact=True).click()
    expect(page.locator("#result-status")).to_have_text("8 datasets shown")
    expect(page.locator("#filter-label")).to_have_text("Filters")
    page.wait_for_timeout(1400)
    return {"search": "Functional", "search_cleared": True, "from": FROM,
            "to": TO, "results": 2, "filter_count": 1,
            "empty_state": {"search": "Workforce", "dates_applied": True, "results": 0},
            "cleared_results": 8}


def main(demo="old"):
    filename = "table-filters-after-demo.html" if demo == "new" else "table-filters-demo.html"
    card_selector = ".after-card" if demo == "new" else ".demo-card"
    stem = f"{demo}-filters-demo"
    OUTPUT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{server.server_port}/{filename}"
    errors = []
    try:
        with sync_playwright() as playwright, tempfile.TemporaryDirectory(prefix="filters-") as temp:
            temp = Path(temp)
            # Use Playwright's matching headless shell: installed desktop Chrome can
            # clip Page.startScreencast to its virtual display despite a larger viewport.
            browser = playwright.chromium.launch(headless=True)
            preflight = browser.new_page(viewport={"width": 960, "height": 640})
            preflight.goto(url)
            preflight.evaluate("document.fonts.ready")
            box = preflight.locator(card_selector).bounding_box()
            width, height = round(box["width"]), round(box["height"])
            assert (width, height) == (880, 558), "Demo geometry changed: review the recording frame."
            preflight.close()
            size = {"width": width * SCALE, "height": height * SCALE}
            # deviceScaleFactor alone does not increase Playwright video resolution.
            # Instead render at exact integer browser zoom with a matching viewport
            # AND recordVideo.size. This preserves all UI proportions without padding.
            context = browser.new_context(viewport=size, device_scale_factor=1,
                                          record_video_dir=str(temp), record_video_size=size)
            page = context.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))
            styles = f"""
                html {{ zoom: {SCALE}; width: {width}px; height: {height}px; }}
                html, body {{ margin: 0 !important; padding: 0 !important;
                    overflow: hidden !important; border: 0 !important;
                    outline: 0 !important; box-shadow: none !important; background: #fff; }}
                body {{ width: {width}px; height: {height}px; min-height: 0; display: block; }}
                {card_selector} {{ width: {width}px; height: {height}px; min-height: {height}px;
                    border: 0; outline: 0; box-shadow: none; border-radius: 0; }}
                iframe {{ border: 0; display: block; }}
                * {{ cursor: none !important; }}
            """
            # Inject before the first paint; leave the normal interactive page unchanged.
            html = (ROOT / filename).read_text()
            html = html.replace("</head>", f"<style>{styles}</style></head>")
            page.route(f"**/{filename}", lambda route: route.fulfill(
                status=200, content_type="text/html", body=html))
            page.goto(url, wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            actual = page.locator(card_selector).bounding_box()
            assert actual == {"x": 0, "y": 0, **size}, actual
            assert page.locator("iframe").count() == 0
            assert page.evaluate("document.documentElement.scrollWidth === innerWidth")
            page.screenshot(path=str(OUTPUT / f"{stem}-poster.png"))
            page.wait_for_timeout(1600)

            interaction = interact_new(page) if demo == "new" else interact_old(page)
            assert not errors, errors
            video = page.video
            context.close()  # Playwright flushes recordVideo on context closure.
            raw = temp / "playwright.webm"
            video.save_as(str(raw))
            browser.close()

            webm = OUTPUT / f"{stem}.webm"
            mp4 = OUTPUT / f"{stem}.mp4"
            # Only trim the initial setup time. No scale, crop, pad or overlay filters.
            ffmpeg("-ss", SETUP_SECONDS, "-i", raw, "-an", "-c:v", "libvpx-vp9",
                   "-crf", 18, "-b:v", 0, "-deadline", "good", "-cpu-used", 2, webm)
            ffmpeg("-i", webm, "-an", "-c:v", "libx264", "-crf", 18,
                   "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4)
            report = {"canvas_css": [width, height], "render_scale": SCALE,
                      "viewport": size, "recording": "Playwright recordVideo",
                      "interaction": interaction,
                      "webm": verify_video(webm, (size["width"], size["height"])),
                      "mp4": verify_video(mp4, (size["width"], size["height"]))}
            # Keep a decoded interaction frame for visual review, not as a page asset.
            ffmpeg("-ss", 4, "-i", mp4, "-frames:v", 1, temp / "frame.png")
            review = OUTPUT / f"{stem}-review.png"
            review.write_bytes((temp / "frame.png").read_bytes())
            (OUTPUT / f"{stem}-verification.json").write_text(json.dumps(report, indent=2) + "\n")
            print(json.dumps(report, indent=2))
            print(f"Saved assets/videos/{stem}.webm and {stem}.mp4")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--demo", choices=["old", "new"], default="old")
    main(parser.parse_args().demo)
