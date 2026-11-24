#!/usr/bin/env python3
"""Record the Mortgage Hub's mobile journey progression.
Run: .venv-recording/bin/python scripts/record-mortgage-hub-next-steps.py
"""
from pathlib import Path
import runpy
import time
from playwright.sync_api import expect


def interact(page):
    start = time.monotonic()
    page.wait_for_timeout(1100)
    page.get_by_label('Yes', exact=True).check()
    page.locator('[name=viewing]:checked').evaluate('(n)=>n.blur()')
    expect(page.locator('.next-demo')).to_have_attribute('data-stage', 'ready')
    page.wait_for_timeout(1800)
    page.get_by_role('button', name='Apply for a mortgage', exact=True).click()
    expect(page.locator('#application-step')).to_have_attribute('aria-current', 'step')
    expect(page.locator('#offer-step')).to_have_attribute('data-complete', 'true')
    page.wait_for_timeout(2200)
    page.evaluate('mortgageHubNextSteps.reset()')
    page.wait_for_timeout(1000)
    return time.monotonic() - start


if __name__ == '__main__':
    base = runpy.run_path(str(Path(__file__).with_name('record-mortgage-deposit-calculator.py')))
    record = base['main']
    record.__globals__.update(
        SIZE={'width': 750, 'height': 1920},
        STEM='mortgage-hub-next-steps-mobile',
        PAGE='mortgage-hub-next-steps-demo.html',
        INTERACTION='Viewing homes: Yes; Apply for a mortgage; advance to Tell us about your situation; reset',
        interact=interact,
    )
    record()
