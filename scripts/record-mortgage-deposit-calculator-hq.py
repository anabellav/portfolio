#!/usr/bin/env python3
"""Export crisp calculator video from lossless Playwright frames (no video upscaling).
Run: .venv-recording/bin/python scripts/record-mortgage-deposit-calculator-hq.py
The 375 × 1158 CSS screen is rendered natively at 1000 × 3088 (8/3 scale).
"""
import functools
import json
from pathlib import Path
import runpy
import tempfile
import threading
from http.server import ThreadingHTTPServer

import imageio_ffmpeg
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
common = runpy.run_path(str(ROOT / 'scripts/record-mortgage-hub-loading.py'))
OUTPUT = ROOT / 'assets/videos'
STEM = 'mortgage-hub-deposit-calculator-mobile-hq'
SIZE = {'width': 1000, 'height': 3088}
FPS = 30
COUNT = 270


def main():
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(common['QuietHandler'], directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    errors = []
    try:
        with sync_playwright() as p, tempfile.TemporaryDirectory(prefix='deposit-hq-') as temporary:
            frames = Path(temporary)
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport=SIZE, device_scale_factor=1)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(f'http://127.0.0.1:{server.server_port}/mortgage-deposit-calculator-demo.html', wait_until='networkidle')
            page.add_style_tag(content='''
                html { zoom: 2.666666666666667; width: 375px; height: 1158px; }
                html, body { margin: 0; padding: 0; overflow: hidden; border: 0; outline: 0; }
                * { cursor: none !important; caret-color: transparent !important; }
                .deposit-demo input[type=range]:focus { outline: none; }
            ''')
            page.evaluate('document.fonts.ready')
            page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
            assert page.locator('.deposit-result').evaluate('(n)=>getComputedStyle(n).boxShadow') == 'none'
            price = page.locator('#property-price')
            slider = page.locator('#ltv')
            expected = {45:'£70,000',78:'£52,500',105:'£35,000',132:'£17,500',200:'£70,000',234:'£0'}
            for frame in range(COUNT):
                if frame in range(27,45,3):
                    price.press_sequentially('350000'[(frame-27)//3])
                if frame == 45:
                    price.evaluate('(n)=>n.blur()')
                if frame in [78,105,132]:
                    slider.press('ArrowRight')
                    slider.evaluate('(n)=>n.blur()')
                if frame in [180,190,200]:
                    slider.press('ArrowLeft')
                    slider.evaluate('(n)=>n.blur()')
                if frame == 234:
                    price.fill('')
                    price.evaluate('(n)=>n.blur()')
                if frame in expected:
                    assert page.locator('#deposit-output').inner_text() == expected[frame]
                page.screenshot(path=str(frames / f'frame-{frame:04d}.png'))
                if frame % 60 == 0:
                    print(f'Rendered {frame}/{COUNT} lossless frames', flush=True)
            (OUTPUT / f'{STEM}-poster.png').write_bytes((frames / 'frame-0000.png').read_bytes())
            for frame in [45,132]:
                Path(f'/tmp/calculator-hq-frame-{frame}.png').write_bytes((frames / f'frame-{frame:04d}.png').read_bytes())
            browser.close()
            assert not errors, errors
            target = OUTPUT / f'{STEM}.mp4'
            common['ffmpeg']('-framerate',FPS,'-i',frames/'frame-%04d.png','-an','-c:v','libx264',
                             '-crf',14,'-preset','slow','-tune','animation','-pix_fmt','yuv420p',
                             '-movflags','+faststart',target)
            # Video playback uses a simpler downscaler than static images. Prepare
            # the desktop card at exactly 2x its 274px content width, using a
            # proper antialiasing filter on the lossless source frames first.
            desktop = OUTPUT / 'mortgage-hub-deposit-calculator-desktop-smooth.mp4'
            common['ffmpeg']('-framerate',FPS,'-i',frames/'frame-%04d.png',
                             '-vf','scale=548:1692:flags=lanczos','-an','-c:v','libx264',
                             '-crf',12,'-preset','slow','-tune','animation',
                             '-pix_fmt','yuv420p','-movflags','+faststart',desktop)
            desktop_frames = imageio_ffmpeg.read_frames(str(desktop))
            desktop_report = next(desktop_frames)
            desktop_frames.close()
            assert tuple(desktop_report['size']) == (548,1692), desktop_report
            reader = imageio_ffmpeg.read_frames(str(target))
            report = next(reader)
            reader.close()
            assert tuple(report['size']) == (1000,3088), report
            common['ffmpeg']('-ss',4.4,'-i',target,'-frames:v',1,'/tmp/calculator-hq-decoded.png')
            report.update(bytes=target.stat().st_size, console_errors=errors,
                          capture='Lossless Playwright PNG frames; one H.264 encoding pass',
                          crf=14, desktop_export={'size':[548,1692],'crf':12,'bytes':desktop.stat().st_size,'filter':'lanczos'},
                          css_size=[375,1158], render_scale=8/3,
                          aspect_ratio='125:386', interaction='Property £350,000; LTV 80–95%; reset')
            (OUTPUT / f'{STEM}-verification.json').write_text(json.dumps(report,indent=2)+'\n')
            print(json.dumps(report,indent=2),flush=True)
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
