#!/usr/bin/env python3
"""Record Mortgage Hub product loops, without browser chrome or rescaling.

Run: .venv-recording/bin/python scripts/record-mortgage-hub-loading.py --mobile
     .venv-recording/bin/python scripts/record-mortgage-hub-loading.py --guides
The product keeps its Figma 1440px layout, with extra page height matching the
existing 980:756 hero. Native recording pixels are 1960:1512 (2x the hero).
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
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets/videos'
SIZE = {'width': 1960, 'height': 1512}


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def ffmpeg(*args):
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel',
                    'error', '-y', *map(str, args)], check=True)


def main(mobile=False, guides=False):
    mobile = mobile or guides
    duration = 9.6 if guides else 6.4
    size = {'width': 750, 'height': 1716 if guides else 1334} if mobile else SIZE
    stem = 'mortgage-hub-guides-mobile' if guides else 'mortgage-hub-loading-mobile' if mobile else 'mortgage-hub-loading'
    zoom = 2 if mobile else 1960 / 1440
    css_width = size['width'] / zoom
    css_height = size['height'] / zoom
    OUTPUT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    filename = 'mortgage-hub-guides-demo.html' if guides else 'mortgage-hub-loading-demo.html'
    url = f'http://127.0.0.1:{server.server_port}/{filename}'
    errors = []
    try:
        with sync_playwright() as p, tempfile.TemporaryDirectory(prefix='mh-loading-') as temporary:
            temp = Path(temporary)
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport=size, device_scale_factor=1,
                                          record_video_dir=str(temp), record_video_size=size)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url, wait_until='networkidle')
            page.add_style_tag(content=f'''
                html {{ zoom: {zoom}; width: {css_width}px; height: {css_height}px; }}
                html, body {{ margin: 0; padding: 0; overflow: hidden; border: 0; outline: 0; }}
                * {{ cursor: none !important; }}
            ''')
            page.evaluate('document.fonts.ready')
            page.wait_for_function('Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            if guides:
                page.evaluate("""() => {
                  const carousel = document.querySelector('.guides-carousel');
                  const start = performance.now();
                  const end = carousel.scrollWidth - carousel.clientWidth;
                  const ease = t => t * t * (3 - 2 * t);
                  function animate(now) {
                    const t = (now - start) % 9600;
                    let x = 0;
                    if (t < 1200) x = 0;
                    else if (t < 2600) x = 316 * ease((t - 1200) / 1400);
                    else if (t < 3800) x = 316;
                    else if (t < 5200) x = 316 + (end - 316) * ease((t - 3800) / 1400);
                    else if (t < 6800) x = end;
                    else if (t < 8600) x = end * (1 - ease((t - 6800) / 1800));
                    carousel.scrollLeft = x;
                    requestAnimationFrame(animate);
                  }
                  requestAnimationFrame(animate);
                }""")
            else:
                page.evaluate('window.mortgageHubLoading.reset()')
            # Two whole loops ensure all browser/font setup is outside the final export.
            page.wait_for_timeout(duration * 2000)
            video = page.video
            context.close()
            raw = temp / 'capture.webm'
            video.save_as(str(raw))
            assert not errors, errors
            browser.close()
            frames = imageio_ffmpeg.read_frames(str(raw))
            metadata = next(frames)
            frames.close()
            start = max(0, metadata['duration'] - duration)
            target = OUTPUT / f'{stem}.mp4'
            ffmpeg('-ss', start, '-i', raw, '-t', duration, '-an', '-c:v', 'libx264',
                   '-crf', 18, '-preset', 'slow', '-pix_fmt', 'yuv420p',
                   '-movflags', '+faststart', target)
            ffmpeg('-ss', .8, '-i', target, '-frames:v', 1,
                   OUTPUT / f'{stem}-poster.png')
            for name, time in [('start', .3), ('middle', 3.4), ('complete', 5.2), ('end', 6.3)]:
                ffmpeg('-ss', time, '-i', target, '-frames:v', 1, f'/tmp/{stem}-{name}.png')
            decoded = imageio_ffmpeg.read_frames(str(target), pix_fmt='rgb24')
            report = next(decoded)
            assert tuple(report['size']) == (size['width'], size['height']), report
            count = 0
            for pixels in decoded:
                count += 1
                # Full-width white product header and pale page, without an outer stroke.
                for x, y in [(0, 0), (size['width'] - 1, 0), (0, size['height'] - 1), (size['width'] - 1, size['height'] - 1)]:
                    pixel = pixels[(y * size['width'] + x) * 3:(y * size['width'] + x) * 3 + 3]
                    assert min(pixel) >= 245, (x, y, list(pixel))
            report.update(frames=count, bytes=target.stat().st_size,
                          recording='Playwright recordVideo; no resizing, cropping or overlays',
                          console_errors=errors, hero_aspect_ratio='375:858' if guides else '375:667' if mobile else '980:756', outer_edges='clean')
            (OUTPUT / f'{stem}-verification.json').write_text(json.dumps(report, indent=2) + '\n')
            print(json.dumps(report, indent=2))
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mobile', action='store_true', help='Record the responsive 375 × 667 mobile layout at 2x.')
    parser.add_argument('--guides', action='store_true', help='Record the guides carousel at 375 × 858, 2x.')
    args = parser.parse_args()
    main(args.mobile, args.guides)
