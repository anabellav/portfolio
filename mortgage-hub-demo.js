/* A small, dependency-free prototype. All state is local and refresh resets it. */
(() => {
  'use strict';
  const assets = 'assets/mortgage-hub/';
  const content = document.querySelector('#hub-content');
  const guides = document.querySelector('#guides');
  const guideGroups = document.querySelector('#guide-groups');
  const dialog = document.querySelector('#hub-dialog');
  const dialogContent = document.querySelector('#dialog-content');
  const accountToggle = document.querySelector('#account-toggle');
  const accountPanel = document.querySelector('#account-panel');
  const status = document.querySelector('#hub-status');
  const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state;
  let returnFocus;
  function initialState() { return { screen: 'complete', viewing: null, accepted: false, completed: true, property: 0, ltv: 70, borrowing: 400000, deposit: 50000, loan: 400000, term: 25, period: 2, rateType: 'Fixed' }; }
  state = initialState();
  const image = (name, className = '', alt = '') => `<img src="${assets}${name}" alt="${alt}"${className ? ` class="${className}"` : ''}>`;
  const action = (label, name, kind = 'primary-button') => `<button class="${kind}" type="button" data-action="${name}">${label}</button>`;
  function announce(text) { status.textContent = ''; requestAnimationFrame(() => { status.textContent = text; }); }
  function setAccount(open) { accountPanel.hidden = !open; accountToggle.setAttribute('aria-expanded', String(open)); }
  function openDialog(html) {
    returnFocus = document.activeElement;
    dialogContent.innerHTML = html;
    dialog.showModal();
  }
  function closeDialog() { dialog.close(); }
  dialog.addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); });
  document.querySelector('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();
  });
  accountToggle.addEventListener('click', () => setAccount(accountPanel.hidden));
  document.addEventListener('click', event => { if (!event.target.closest('.account')) setAccount(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !accountPanel.hidden) { setAccount(false); accountToggle.focus(); } });

  function mipCard() {
    return `<section class="mip-card" aria-labelledby="mip-heading">
      <span class="issued-date">Issued on 10/05/2021</span>
      <h1 id="mip-heading">Your Mortgage in Principle</h1>
      <p class="mip-explanation">Based on what you’ve told us about your income and spending, you could borrow up to:</p>
      <p class="mip-value">${money(state.borrowing)}</p>
      <p class="mip-details">This means you could afford a property worth ${money(state.borrowing + state.deposit)} with your deposit of ${money(state.deposit)}</p>
      <div class="mip-actions">${action('Download MIP', 'download')}${action('Get a new MIP', 'incomplete', 'secondary-button')}</div>
    </section>`;
  }
  function timeline(includeDeposit = false, incomplete = false) {
    const labels = [
      ...(includeDeposit ? [['Save your deposit', 'deposit', false]] : []),
      ...(!incomplete ? [['See what you could borrow with a MIP', state.completed ? 'complete' : 'incomplete', state.completed]] : []),
      ['Get an offer accepted on a home', 'offer', state.accepted],
      ['Tell us about your situation', 'apply', false],
      ['Get a mortgage recommendation', 'apply', false],
      ['Sit back while we apply for your mortgage', 'apply', false]
    ];
    return `<ol class="journey-list" aria-label="Steps to get a mortgage">${labels.map(([label, name, reached]) => `<li${reached ? ' class="step-completed"' : ''}>${image(reached ? 'step-complete.svg' : 'step-incomplete.svg', 'step-icon')}<button type="button" data-action="${name}">${label}<span class="sr-only">${reached ? ', complete' : ''}</span></button></li>`).join('')}</ol>`;
  }
  function viewingQuestion() {
    return `<fieldset class="viewing-question"><legend>Have you started viewing homes?</legend><div class="radio-row">${['Yes', 'No'].map(label => `<label class="radio-choice"><input type="radio" name="viewing" value="${label.toLowerCase()}"${state.viewing === label.toLowerCase() ? ' checked' : ''}>${label}</label>`).join('')}</div></fieldset><div id="viewing-response" class="viewing-response" aria-live="polite">${viewingResponse()}</div>`;
  }
  function viewingResponse() {
    if (state.viewing === 'yes') return `<p>Get an offer accepted on a home.</p>${action('Had an offer accepted?', 'offer', 'text-link')}`;
    if (state.viewing === 'no') return `<p>You’re likely to need a MIP to put in an offer on a home.</p>${action('Explore buying guides', 'guides', 'text-link')}`;
    return '';
  }
  function offerBanner(planning = false) {
    return planning
      ? `<div class="offer-banner"><p><strong>Have you reached your deposit goal?</strong> See how much you can borrow</p>${action('Get a Mortgage in Principle', 'incomplete')}</div>`
      : `<div class="offer-banner"><p><strong>Had an offer accepted?</strong> We can help find you the right deal</p>${action('Apply for a mortgage', 'offer')}</div>`;
  }
  function costCard() {
    return `<article class="resource"><h2>Cost of a mortgage</h2><div class="resource-card"><div class="cost-illustration">${image('mortgage-costs.png')}</div><p class="illustrated-copy">When buying a home it’s important to think about all the different costs.</p><p class="illustrated-copy">These could include stamp duty, legal fees and product fees.</p><p>Trussle is fee free but some brokers may charge you.</p><button class="card-link" data-action="costs">Learn more about the costs of buying a home${image('arrow-24.svg')}</button></div></article>`;
  }
  function calculatorCard() {
    return `<article class="resource"><h2>Mortgage calculator</h2><div class="resource-card calculator-teaser"><p>You can find out how much you could borrow and what your mortgage payments might be using our <button class="text-link" data-action="calculator">mortgage calculator</button></p>${image('search.png')}</div></article>`;
  }
  function completeScreen() {
    return `<div class="dashboard hub-width">${mipCard()}
      <section class="next-section" aria-labelledby="next-heading"><h2 id="next-heading" class="section-title">What’s next</h2><div class="next-card"><div class="journey-column"><div class="journey-art">${image('journey.png')}</div>${timeline()}</div><div class="next-copy"><p>You’re likely to need a MIP to put in an offer on a home.</p><p>If you’ve started viewing homes, we’ll give you personalised information to help you along.</p>${viewingQuestion()}</div></div></section>
      <div class="resource-pair">${costCard()}${calculatorCard()}</div>${offerBanner()}
    </div>`;
  }
  function incompleteScreen(support = false) {
    return `<div class="dashboard hub-width"><header class="state-intro">${image('house-for-sale.png')}
      <h1>${support ? 'Thanks Lily,<br>we’ve referred this to one of our advisers' : 'Finish your Mortgage in Principle'}</h1>
      ${support ? '<div class="support-copy"><p>It’s important to us that you know for sure how much you could borrow, so we want to get one of our friendly advisers to double check the numbers for you.</p><p>We’ll be in touch within 48 hours with your Mortgage in Principle</p><p class="guide-preview-note">Demo only. No request has been sent.</p></div>' : `<p>It will take you less than 10 minutes</p>${action('Complete your MIP', 'complete-mip')}`}
      </header><div class="incomplete-grid"><article class="resource"><h2>How a MIP can help you</h2><div class="resource-card"><p>You’ll probably need a MIP when you put in an offer on a property.</p><p><strong>A MIP will also give you:</strong></p><ul><li>a good idea of how much you can borrow</li><li>the confidence to start looking at properties</li></ul></div></article><article class="resource"><h2>Once you have your MIP</h2><div class="resource-card">${timeline(false, true)}${viewingQuestion()}</div></article></div>${offerBanner()}</div>`;
  }
  function depositScreen() {
    return `<div class="dashboard hub-width"><header class="state-intro">${image('piggybank.png')}<h1>Lily, start sorting out your finances</h1><p>Learn how to make the most out of your income and reach your deposit goal</p></header>
      <section aria-labelledby="deposit-heading"><h2 id="deposit-heading" class="section-title">Mortgage deposit calculator</h2><div class="planning-calculator"><div class="deposit-fields"><label class="field" for="property-price"><span>What is the property price?</span><span class="input-with-prefix"><span aria-hidden="true">£</span><input id="property-price" type="number" inputmode="numeric" min="0" max="10000000" step="1000" value="${state.property || ''}"></span></label><div class="range-field"><label for="ltv">Use the slider below to change the LTV.</label><div class="range-labels" aria-hidden="true">${[65,70,75,80,85,90,95].map(n=>`<span>${n}%</span>`).join('')}</div><input type="range" id="ltv" min="65" max="95" step="5" value="${state.ltv}" aria-valuetext="${state.ltv}% loan to value"><div class="range-ends"><span>Low</span><span>High</span></div></div><div class="ltv-help"><strong>LTV Bands</strong><p>LTV (loan to value) is the percentage of the property price you pay for with a mortgage. So if you put down a 5% deposit you’ll need a 95% LTV mortgage.</p></div></div><aside class="deposit-result" aria-labelledby="deposit-result-title"><h3 id="deposit-result-title">Deposit amount</h3><output id="deposit-output" for="property-price ltv" aria-live="polite">${money(state.property * (1 - state.ltv / 100))}</output><p>Your home may be repossessed if you do not keep up repayments on your mortgage. Our mortgage deposit calculation is for guidance only.</p></aside></div></section>
      <section class="saving-tips" aria-labelledby="tips-heading"><h2 id="tips-heading">Tips to save a deposit</h2><div class="tips-grid">
        <article class="tip"><span class="tip-number">01</span><div><h3>Consider using a government scheme</h3><p>They are mostly aimed at those who might be struggling to afford a deposit that comes with buying a new home.</p><button class="text-link" data-guide="Government schemes">Check which scheme is right for you</button></div></article>
        <article class="tip"><span class="tip-number">02</span><div><h3>Set a monthly saving goal</h3><button class="text-link" data-action="savings">Download savings planner template</button></div></article>
        <article class="tip"><span class="tip-number">03</span><div><h3>Consider using a money saving app</h3><p>Consider using a money saving app such as our partner Emma</p><button class="text-link" data-guide="Emma">Learn more about Emma</button></div></article>
        <article class="tip"><span class="tip-number">04</span><div><h3>Save on bills</h3><p>When possible it’s good to review how much you spend on bills.</p><button class="text-link" data-guide="Uswitch">Visit Uswitch website</button></div></article>
      </div>${image('coin.png','saving-coin')}</section><div class="resource-pair">${costCard()}<article class="resource"><h2>Steps to get a mortgage</h2><div class="resource-card">${timeline(true)}<button class="card-link" data-action="checklist">Download checklist${image('arrow-24.svg')}</button></div></article></div>${offerBanner(true)}</div>`;
  }
  function stageScreen() {
    return `<div class="routing hub-width"><header class="state-intro">${image('viewing-homes.png')}<h1>What stage are you at?</h1></header><form id="stage-form" class="routing-options"><label class="radio-choice"><input type="radio" name="stage" value="deposit" required>I need to sort out my finances</label><label class="radio-choice"><input type="radio" name="stage" value="incomplete" required>I’m ready to view homes</label><button type="submit" class="primary-button" disabled>Continue</button></form></div>`;
  }
  function startScreen() {
    return `<div class="routing hub-width"><header class="state-intro">${image('unlock.png')}<h1>What would you like to do?</h1></header><div class="start-routes"><button class="start-route" data-action="offer"><span><strong>Apply for a mortgage to buy a property</strong>If you’ve had an offer accepted on a property, apply now and we’ll find the right deal for you.</span>${image('arrow-24.svg')}</button><button class="start-route" data-action="stage"><span><strong>Get a mortgage in principle (MIP)</strong>Find out how much you could borrow.</span>${image('arrow-24.svg')}</button><button class="start-route" data-action="explore"><span><strong>I’m looking for information</strong>Check our mortgage calculator and learn how to get your first mortgage.</span>${image('arrow-24.svg')}</button></div></div>`;
  }
  function exploreScreen() {
    return `<div class="routing hub-width"><header class="state-intro">${image('unlock.png')}<h1>Here’s some useful information</h1></header><div class="start-routes"><button class="start-route" data-action="calculator"><strong>Check our mortgage calculator</strong>${image('arrow-24.svg')}</button><button class="start-route" data-action="deposit"><strong>Plan your deposit</strong>${image('arrow-24.svg')}</button><button class="start-route" data-guide="First time buyer guide"><strong>Learn how to get your first mortgage</strong>${image('arrow-24.svg')}</button></div></div>`;
  }
  function calculatorScreen() {
    return `<div class="dashboard hub-width">${mipCard()}<section class="repayment-panel" aria-labelledby="repayment-heading"><div class="repayment-fields"><label class="field" for="loan"><span>I want to borrow</span><span class="input-with-prefix"><span aria-hidden="true">£</span><input id="loan" type="number" inputmode="numeric" min="0" max="10000000" step="1000" value="${state.loan}"></span></label><label class="field" for="term"><span>Pay back mortgage over</span><select id="term">${[10,15,20,25,30,35,40].map(n=>`<option value="${n}"${state.term===n?' selected':''}>${n} Years</option>`).join('')}</select></label><label class="field" for="period"><span>Initial period</span><select id="period">${[2,3,5].map(n=>`<option value="${n}"${state.period===n?' selected':''}>${n} Years</option>`).join('')}</select></label><label class="field" for="rate-type"><span>Rate type</span><select id="rate-type">${['Fixed','Variable'].map(n=>`<option${state.rateType===n?' selected':''}>${n}</option>`).join('')}</select></label></div><div class="repayment-result"><h2 id="repayment-heading">How much will you pay?</h2><p id="repayment-assumption"></p><div class="repayment-value"><output id="monthly-payment" for="loan term period rate-type" aria-live="polite"></output><small id="repayment-period"></small></div></div></section><p class="repayment-note">This is an estimate of your monthly repayments. Talk to a mortgage broker or lender to get an exact figure.</p>${action('Back to Mortgage Hub', 'home', 'text-link back-to-hub')}</div>`;
  }

  function renderGuides() {
    const groups = [
      {title:'Buying a home',art:'buying-home.png',links:['First time buyer guide','Mortgage guide','Moving home guide','Buying a home guide']},
      {title:'Calculators and tools',art:'gifting.png',links:['Mortgage calculator','Mortgage deposit calculator','Mortgage comparison']},
      ...(['deposit','incomplete','support'].includes(state.screen) ? [{title:'Affording a home',art:'affording-home.png',links:['Improve your credit score','Bad credit','Government schemes']}] : [])
    ];
    guideGroups.classList.toggle('three-groups', groups.length===3);
    guideGroups.innerHTML=groups.map(group=>`<article class="guide-group"><h3>${group.title}</h3><div class="guide-art">${image(group.art)}</div>${group.links.map(label=>`<button class="guide-link" ${label==='Mortgage calculator'?'data-action="calculator"':label==='Mortgage deposit calculator'?'data-action="deposit"':`data-guide="${label}"`}>${label}${image('arrow-16.svg')}</button>`).join('')}</article>`).join('');
  }
  function render(screen, focus = true) {
    setAccount(false);
    state.screen = screen;
    const screens = {complete:completeScreen,incomplete:()=>incompleteScreen(),support:()=>incompleteScreen(true),deposit:depositScreen,stage:stageScreen,start:startScreen,explore:exploreScreen,calculator:calculatorScreen};
    content.innerHTML = screens[screen]();
    guides.hidden = ['stage','start','explore','calculator'].includes(screen);
    document.querySelector('.product-footer').hidden = ['stage','start','explore'].includes(screen);
    if (!guides.hidden) renderGuides();
    if (screen==='calculator') updateRepayment();
    if (focus) { window.scrollTo({top:0,behavior:'instant'}); content.focus({preventScroll:true}); }
  }
  function updateDeposit() {
    state.property=Math.max(0,Math.min(10000000,Number(document.querySelector('#property-price').value)||0));
    state.ltv=Number(document.querySelector('#ltv').value);
    document.querySelector('#ltv').setAttribute('aria-valuetext', `${state.ltv}% loan to value`);
    document.querySelector('#deposit-output').textContent=money(Math.round(state.property*(1-state.ltv/100)));
  }
  function updateRepayment() {
    const loan=Math.max(0,Math.min(10000000,Number(document.querySelector('#loan').value)||0));
    state.loan=loan;
    state.term=Number(document.querySelector('#term').value);
    state.period=Number(document.querySelector('#period').value);
    state.rateType=document.querySelector('#rate-type').value;
    // Source assumption: 2.99%. Selection changes the introductory period/type,
    // not the assumed rate; there is no product/rate dataset in this prototype.
    const monthlyRate=.0299/12;
    const months=state.term*12;
    const payment=loan===0?0:loan*monthlyRate/(1-Math.pow(1+monthlyRate,-months));
    document.querySelector('#repayment-assumption').textContent=`This assumes a ${money(loan)} mortgage and a rate of 2.99% for the initial ${state.period} years.`;
    document.querySelector('#monthly-payment').textContent=money(payment);
    document.querySelector('#repayment-period').textContent=`Per month over the first ${state.period} years`;
  }
  function downloadFile(filename, text, mime='text/plain') {
    const url=URL.createObjectURL(new Blob([text],{type:mime}));
    const link=document.createElement('a');link.href=url;link.download=filename;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function guidePreview(title) {
    let text;
    if (['First time buyer guide','Mortgage guide','Moving home guide','Buying a home guide'].includes(title)) {
      text='<p>You’ll probably need a MIP when you put in an offer on a property.</p><p>A MIP will also give you a good idea of how much you can borrow and the confidence to start looking at properties.</p>';
    } else text='<p>This resource appears in the original Mortgage Hub. Its full content is not included in this demo.</p>';
    openDialog(`<h2 id="dialog-title">${escape(title)}</h2>${text}<p class="guide-preview-note">Guide preview. Full articles and external partner services are outside this prototype.</p><div class="dialog-actions">${action('Plan your deposit','deposit')}${action('Back to the hub','close','secondary-button')}</div>`);
  }
  function handleAction(name) {
    if (name!=='close' && dialog.open) closeDialog();
    switch(name) {
      case 'home': render(state.completed?'complete':'incomplete'); break;
      case 'reset': state=initialState();render('complete');announce('Demo reset to the original Mortgage in Principle result.');break;
      case 'complete': render('complete');break;
      case 'incomplete': render('incomplete');break;
      case 'deposit': case 'stage': case 'start': case 'explore': case 'calculator': case 'support': render(name);break;
      case 'guides': guides.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});break;
      case 'complete-mip':
        openDialog(`${image('house-for-sale.png','dialog-illustration')}<h2 id="dialog-title">See what you could borrow with a MIP</h2><p>This prototype uses an example result of £400,000, with a £50,000 deposit. It does not assess eligibility or issue a real Mortgage in Principle.</p><div class="dialog-actions">${action('View example MIP','confirm-mip')}${action('Back','close','secondary-button')}</div>`);break;
      case 'confirm-mip': state.completed=true;state.accepted=false;render('complete');announce('Your example Mortgage in Principle is ready.');break;
      case 'offer':
        openDialog(`<h2 id="dialog-title">Have you had an offer accepted on a property?</h2><p>If you’ve had an offer accepted, we can help find you the right deal.</p><div class="dialog-actions">${action('Yes, I have','accepted')}${action('Not yet','not-yet','secondary-button')}</div>`);break;
      case 'not-yet': state.viewing='yes';render(state.completed?'complete':'incomplete');announce('Your next step is to get an offer accepted on a home.');break;
      case 'accepted':
        state.accepted=true;state.viewing='yes';render(state.completed?'complete':'incomplete');
        openDialog(`<h2 id="dialog-title">Tell us about your situation</h2><p>Your next step is to apply for a mortgage so we can find you the right deal.</p><p class="guide-preview-note">This is the hand-off to the application journey. No application is submitted in this portfolio demo.</p><div class="dialog-actions">${action('Back to Mortgage Hub','close')}${action('Adviser support','support','secondary-button')}</div>`);break;
      case 'apply': state.accepted?handleAction('accepted'):handleAction('offer');break;
      case 'costs':
        openDialog(`<h2 id="dialog-title">How much a mortgage costs</h2><p>When you buy a house you’ll have to pay:</p><ul><li>solicitor or conveyancing fees</li><li>mortgage broker fees (Free with Trussle)</li><li>mortgage fees</li></ul><p>These could include stamp duty, legal fees and product fees.</p><div class="dialog-actions">${action('Mortgage calculator','calculator')}${action('Back','close','secondary-button')}</div>`);break;
      case 'download':
        openDialog(`<h2 id="dialog-title">Your Mortgage in Principle</h2><p>You could borrow up to <strong>${money(state.borrowing)}</strong>, with a deposit of <strong>${money(state.deposit)}</strong>.</p><p class="guide-preview-note">An illustrative portfolio summary, not a valid MIP or lending decision.</p><div class="dialog-actions">${action('Download example summary','download-summary')}${action('Back','close','secondary-button')}</div>`);break;
      case 'download-summary': downloadFile('example-mip-summary.txt',`TRUSSLE MORTGAGE HUB — PORTFOLIO DEMO\n\nIllustrative example only. Not a Mortgage in Principle or lending decision.\nExample borrowing: ${money(state.borrowing)}\nExample deposit: ${money(state.deposit)}\nExample property value: ${money(state.borrowing+state.deposit)}\n`);announce('Example summary downloaded.');break;
      case 'savings': downloadFile('savings-planner.csv','Month,Opening savings,Planned savings,Actual savings,Closing savings\n'+Array.from({length:12},(_,i)=>`${i+1},,,,`).join('\n'),'text/csv');announce('Blank savings planner downloaded.');break;
      case 'checklist': downloadFile('mortgage-checklist.txt','Steps to get a mortgage\n\n1. Save your deposit\n2. See what you could borrow with a MIP\n3. Get an offer accepted on a home\n4. Tell us about your situation\n5. Get a mortgage recommendation\n6. Sit back while we apply for your mortgage\n');announce('Mortgage checklist downloaded.');break;
      case 'privacy': openDialog('<h2 id="dialog-title">About this prototype</h2><p>This portfolio demo runs locally in your browser. It does not submit the information you enter or save it between visits.</p><p>The original product’s legal footer is retained as part of the historical design.</p>');break;
      case 'close': closeDialog();break;
    }
  }
  document.addEventListener('click', event => {
    const button=event.target.closest('[data-action], [data-guide]');
    if (!button) return;
    if (button.dataset.guide) guidePreview(button.dataset.guide);
    else handleAction(button.dataset.action);
  });
  content.addEventListener('change', event => {
    if (event.target.name==='stage') document.querySelector('#stage-form button').disabled=false;
    if (event.target.name==='viewing') {
      state.viewing=event.target.value;
      document.querySelector('#viewing-response').innerHTML=viewingResponse();
    }
  });
  content.addEventListener('input', event => {
    if (['property-price','ltv'].includes(event.target.id)) updateDeposit();
    if (['loan','term','period','rate-type'].includes(event.target.id)) updateRepayment();
  });
  content.addEventListener('submit', event => {
    if (event.target.id!=='stage-form') return;
    event.preventDefault();
    const selected=new FormData(event.target).get('stage');
    if (selected) { state.completed=false;state.accepted=false;state.viewing=null;render(selected); }
  });
  render('complete', false);
})();
