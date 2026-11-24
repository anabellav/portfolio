(() => {
  const demo = document.querySelector('.next-demo');
  const offer = document.querySelector('#offer-step');
  const application = document.querySelector('#application-step');
  const question = document.querySelector('.viewing-question');
  const advice = document.querySelector('#next-advice');
  const guidance = document.querySelector('#next-guidance');
  const apply = document.querySelector('#apply-button');
  function reset() {
    demo.dataset.stage = 'initial';
    offer.removeAttribute('aria-current');
    application.removeAttribute('aria-current');
    delete offer.dataset.complete;
    offer.querySelector('img').src = 'assets/mortgage-hub-next-steps/incomplete.svg';
    offer.querySelector('img').alt = 'Not complete';
    advice.textContent = 'You’re likely to need a MIP to put in an offer on a home.';
    guidance.textContent = 'If you’ve started viewing homes, we’ll give you personalised information to help you along.';
    question.hidden = false;
    document.querySelectorAll('[name=viewing]').forEach(input => { input.checked = false; });
  }
  document.querySelectorAll('[name=viewing]').forEach(input => input.addEventListener('change', () => {
    demo.dataset.stage = input.value === 'yes' ? 'ready' : 'initial';
    if (input.value === 'yes') offer.setAttribute('aria-current', 'step');
    else offer.removeAttribute('aria-current');
  }));
  apply.addEventListener('click', () => {
    // The original CTA hands off to applying. Stop at that boundary in the demo.
    demo.dataset.stage = 'application';
    offer.removeAttribute('aria-current');
    offer.dataset.complete = 'true';
    offer.querySelector('img').src = 'assets/mortgage-hub-next-steps/complete.svg';
    offer.querySelector('img').alt = 'Complete';
    application.setAttribute('aria-current', 'step');
    advice.textContent = 'Tell us about your situation';
    guidance.textContent = 'Your next step is to apply for a mortgage so we can find you the right deal.';
    question.hidden = true;
    apply.blur();
  });
  window.mortgageHubNextSteps = { reset };
  reset();
})();
