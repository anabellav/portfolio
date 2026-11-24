(() => {
  const property = document.querySelector('#property-price');
  const ltv = document.querySelector('#ltv');
  const output = document.querySelector('#deposit-output');
  const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
  function update() {
    const price = Math.max(0, Number(property.value) || 0);
    output.value = money.format(Math.round(price * (1 - Number(ltv.value) / 100)));
    ltv.setAttribute('aria-valuetext', `${ltv.value}% loan to value`);
  }
  property.addEventListener('input', update);
  ltv.addEventListener('input', update);
  update();
})();
