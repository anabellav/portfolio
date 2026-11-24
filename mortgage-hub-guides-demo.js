(() => {
  const carousel = document.querySelector('.guides-carousel');
  // Figma exposes the off-screen categories; the recording supplies a gentle browse.
  // Live demo stays user-controlled, with native touch scrolling and arrow keys.
  carousel.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    carousel.scrollBy({ left: event.key === 'ArrowRight' ? 316 : -316,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
})();
