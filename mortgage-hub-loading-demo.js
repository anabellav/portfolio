(() => {
  const duration = 6400;
  const steps = [...document.querySelectorAll('.loading-steps li')];
  const list = document.querySelector('.loading-steps');
  const illustration = document.querySelector('.loading-illustration > img');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let start = performance.now();
  let frame;

  function render(elapsed) {
    const phase = elapsed % duration;
    const completed = phase < 1500 ? 0 : phase < 3000 ? 1 : phase < 4500 ? 2 : 3;
    steps.forEach((step, index) => {
      step.dataset.state = index < completed ? 'complete' : index === completed ? 'active' : 'pending';
      if (index === completed) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    // A brief dissolve resets the sequence; the illustration never stops floating.
    const opacity = phase > 6050 ? (6400 - phase) / 350 : phase < 250 ? phase / 250 : 1;
    list.style.setProperty('--sequence-opacity', opacity);
  }
  function tick(now) {
    render(now - start);
    frame = requestAnimationFrame(tick);
  }
  function reset() {
    cancelAnimationFrame(frame);
    start = performance.now();
    for (const animation of illustration.getAnimations()) animation.currentTime = 0;
    if (reduced.matches) {
      render(5000);
      list.style.setProperty('--sequence-opacity', 1);
    } else frame = requestAnimationFrame(tick);
  }
  // Recording can restart at an exact loop boundary after fonts and assets load.
  window.mortgageHubLoading = { reset, duration, render };
  reduced.addEventListener('change', reset);
  reset();
})();
