#!/usr/bin/env python3
"""Record the existing deposit calculation at the Figma mobile size, at 2x.
Run: .venv-recording/bin/python scripts/record-mortgage-deposit-calculator.py
"""
import functools
import json
from pathlib import Path
import runpy
import tempfile
import threading
import time
from http.server import ThreadingHTTPServer

import imageio_ffmpeg
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
common = runpy.run_path(str(ROOT / 'scripts/record-mortgage-hub-loading.py'))
ffmpeg = common['ffmpeg']
OUTPUT = ROOT / 'assets/videos'
SIZE = {'width': 750, 'height': 2316}
STEM = 'mortgage-hub-deposit-calculator-mobile'
PAGE = 'mortgage-deposit-calculator-demo.html'
INTERACTION = '£350,000 property; 80%, 85%, 90%, 95% LTV; reset to initial state'


def interact(page):
    start = time.monotonic()
    field = page.locator('#property-price')
    slider = page.locator('#ltv')
    page.wait_for_timeout(900)
    field.press_sequentially('350000', delay=100)
    field.evaluate('(n)=>n.blur()')
    expect(page.locator('#deposit-output')).to_have_text('£70,000')
    page.wait_for_timeout(1100)
    slider.focus()
    for expected in ['£52,500', '£35,000', '£17,500']:
        slider.press('ArrowRight')
        expect(page.locator('#deposit-output')).to_have_text(expected)
        page.wait_for_timeout(850)
    slider.evaluate('(n)=>n.blur()')
    page.wait_for_timeout(1000)
    for _ in range(3):
        slider.press('ArrowLeft')
        page.wait_for_timeout(350)
    slider.evaluate('(n)=>n.blur()')
    expect(page.locator('#deposit-output')).to_have_text('£70,000')
    page.wait_for_timeout(800)
    field.fill('')
    field.evaluate('(n)=>n.blur()')
    expect(page.locator('#deposit-output')).to_have_text('£0')
    page.wait_for_timeout(900)
    return time.monotonic() - start


def main():
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(common['QuietHandler'], directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    errors = []
    try:
        with sync_playwright() as p, tempfile.TemporaryDirectory(prefix='deposit-recording-') as temporary:
            temp = Path(temporary)
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport=SIZE, record_video_size=SIZE, record_video_dir=str(temp))
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/{PAGE}', wait_until='networkidle')
            page.add_style_tag(content=f'''
                html {{ zoom: 2; width: {SIZE['width'] / 2}px; height: {SIZE['height'] / 2}px; }}
                html, body {{ margin: 0; padding: 0; overflow: hidden; border: 0; outline: 0; }}
                * {{ cursor: none !important; }}
                .deposit-demo input[type=range]:focus {{ outline: none; }}
            ''')
            page.evaluate('document.fonts.ready')
            page.wait_for_function('Array.from(document.images).every(i=>i.complete && i.naturalWidth>0)')
            assert page.evaluate('document.documentElement.scrollHeight<=innerHeight')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.screenshot(path=str(OUTPUT / f'{STEM}-poster.png'))
            interact(page)
            duration = interact(page)
            video = page.video
            context.close()
            raw = temp / 'capture.webm'
            video.save_as(str(raw))
            browser.close()
            assert not errors, errors
            reader = imageio_ffmpeg.read_frames(str(raw))
            metadata = next(reader)
            reader.close()
            target = OUTPUT / f'{STEM}.mp4'
            ffmpeg('-ss', max(0, metadata['duration'] - duration), '-i', raw, '-t', duration,
                   '-an', '-c:v', 'libx264', '-crf', 18, '-preset', 'slow',
                   '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target)
            for label, seconds in [('initial', .2), ('calculation', 2), ('slider', 5)]:
                ffmpeg('-ss', seconds, '-i', target, '-frames:v', 1, f'/tmp/{STEM}-{label}.png')
            reader = imageio_ffmpeg.read_frames(str(target))
            report = next(reader)
            reader.close()
            assert tuple(report['size']) == (SIZE['width'], SIZE['height']), report
            report.update(bytes=target.stat().st_size, console_errors=errors,
                          recording='Playwright recordVideo, no resizing or cropping',
                          interaction=INTERACTION)
            (OUTPUT / f'{STEM}-verification.json').write_text(json.dumps(report, indent=2) + '\n')
            print(json.dumps(report, indent=2))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
