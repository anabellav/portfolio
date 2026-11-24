// Shared by all portfolio case studies. Native anchors work without JavaScript.
const menu = document.querySelector('.case-nav');
const menuTrack = menu.querySelector('.case-nav-inner');
const header = document.querySelector('.site-header');
const links = [...menu.querySelectorAll('a')];
const headings = links.map(link => document.querySelector(link.hash)).filter(Boolean)
  .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const overview = document.querySelector('.overview-section');
// Track the midpoint of the actual Overview section at every viewport size.
const overviewContentEnd = overview.querySelector(':scope > .case-meta') || overview.lastElementChild;
const overviewTrigger = document.createElement('span');
overviewTrigger.className = 'case-nav-trigger';
overviewTrigger.setAttribute('aria-hidden', 'true');
overview.append(overviewTrigger);
let stickyObserver;
let observedOffset = null;
let scheduled = false;
let navigationTarget = null;

function syncStickyState(offset) {
  const bounds = overview.getBoundingClientRect();
  const pastOverview = bounds.top + bounds.height / 2 <= offset;
  menu.classList.toggle('is-stuck', pastOverview);
  menu.inert = !pastOverview;
  menu.setAttribute('aria-hidden', String(!pastOverview));
}

function observeStickyThreshold(offset) {
  if (offset === observedOffset) return;
  observedOffset = offset;
  stickyObserver?.disconnect();
  const sync = () => syncStickyState(offset);
  // Observe the midpoint sentinel, accounting for any fixed site header.
  stickyObserver = new IntersectionObserver(sync, {
    rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0
  });
  stickyObserver.observe(overviewTrigger);
  sync();
}

function update() {
  scheduled = false;
  document.documentElement.style.setProperty('--case-viewport-width', `${document.documentElement.clientWidth}px`);
  // The current header scrolls away. Also support a sticky/fixed header later.
  const position = getComputedStyle(header).position;
  const offset = ['sticky', 'fixed'].includes(position) ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  document.documentElement.style.setProperty('--case-header-offset', `${offset}px`);
  overviewTrigger.style.top = `${overview.getBoundingClientRect().height / 2}px`;
  observeStickyThreshold(offset);
  // Also reconcile during existing scroll/layout updates (including restored scroll).
  syncStickyState(offset);
  document.documentElement.style.setProperty('--case-nav-height', `${menuTrack.offsetHeight}px`);
  const readingLine = offset + menuTrack.offsetHeight + 90;
  let current = headings[0];
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= readingLine) current = heading;
  }
  if (Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) current = headings.at(-1);
  // A short final section may prevent an anchor from reaching the top.
  // Keep the clicked destination selected until the reader scrolls manually.
  if (navigationTarget) current = navigationTarget;
  for (const link of links) {
    const active = link.hash === `#${current.id}`;
    if (active && !link.hasAttribute('aria-current')) {
      // Reveal the active mobile tab without moving the page vertically.
      const tab = link.getBoundingClientRect();
      const bounds = menuTrack.getBoundingClientRect();
      if (tab.left < bounds.left || tab.right > bounds.right) {
        menuTrack.scrollTo({ left: link.offsetLeft - menuTrack.clientWidth / 2 + link.offsetWidth / 2, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      }
    }
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function scheduleUpdate() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
}

for (const link of links) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const heading = document.querySelector(link.hash);
    navigationTarget = heading;
    update();
    history.pushState(null, '', link.hash);
    heading.focus({ preventScroll: true });
    const target = heading.closest('.process-heading') || heading;
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    let destination = target.getBoundingClientRect().top + scrollY - margin - padding;
    // The first post-Overview heading can be close to the boundary. Its anchor
    // must not scroll back into Overview and hide the navigation just selected.
    if (!overview.contains(heading)) {
      destination = Math.max(destination, Math.ceil(overviewContentEnd.getBoundingClientRect().bottom + scrollY));
    }
    scrollTo({ top: Math.max(0, destination), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    scheduleUpdate();
  });
}
addEventListener('scroll', scheduleUpdate, { passive: true });
addEventListener('resize', scheduleUpdate);
addEventListener('hashchange', scheduleUpdate);
function resumeScrollTracking() { navigationTarget = null; scheduleUpdate(); }
addEventListener('wheel', resumeScrollTracking, { passive: true });
addEventListener('touchstart', resumeScrollTracking, { passive: true });
addEventListener('pointerdown', resumeScrollTracking, { passive: true });
addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) resumeScrollTracking();
});
const layoutObserver = new ResizeObserver(scheduleUpdate);
for (const element of [menuTrack, overview, overviewContentEnd, header, overview.parentElement]) {
  layoutObserver.observe(element);
}
addEventListener('load', scheduleUpdate);
addEventListener('pageshow', scheduleUpdate);
document.fonts.ready.then(scheduleUpdate);
update();

// Prefer manual playback when reduced motion is requested.
for (const video of document.querySelectorAll('.filter-demo-video')) {
  const syncPlayback = () => {
    video.controls = reducedMotion.matches;
    video.autoplay = !reducedMotion.matches;
    if (reducedMotion.matches) video.pause();
    else video.play().catch(() => { video.controls = true; });
  };
  reducedMotion.addEventListener('change', syncPlayback);
  syncPlayback();
}

