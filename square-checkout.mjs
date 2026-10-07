import { priceOrder, money } from './order-pricing.mjs?v=ocean-prices1';

// Existing item links are used for one-off orders; monthly payments use dedicated links.
export const squareOffers = Object.freeze({
  '330ml:1:ocean-gold': Object.freeze({ url: 'https://square.link/u/cR0qz4Bq', jarPrice: 1500, ready: true }),
  '330ml:1:ocean-vitality': Object.freeze({ url: 'https://square.link/u/O11nvokX', jarPrice: 2000, ready: true }),
  '330ml:1': Object.freeze({ url: 'https://square.link/u/oDJVR7Js', jarPrice: 2500, ready: true }),
  '330ml:2': Object.freeze({ url: 'https://square.link/u/6cntVLqw', jarPrice: 5000, ready: true }),
  '330ml:3': Object.freeze({ url: 'https://square.link/u/SdV64YjC', jarPrice: 6800, ready: true }),
  '330ml:4': Object.freeze({ url: 'https://square.link/u/v1caEEpX', jarPrice: 8800, ready: true }),
  '720ml:1': Object.freeze({ url: 'https://square.link/u/8vdThijg', jarPrice: 4500, ready: true }),
  '720ml:2': Object.freeze({ url: 'https://square.link/u/FDJfIpBI', jarPrice: 8500, ready: true }),
  '720ml:3': Object.freeze({ url: 'https://square.link/u/QTxaHfMn', jarPrice: 12000, ready: true })
});

export const subscriptionOffers = Object.freeze({
  '330ml:1': Object.freeze({ url: 'https://square.link/u/UnZbxsNz', jarPrice: 2250, ready: true }),
  '330ml:2': Object.freeze({ url: 'https://square.link/u/gYcrouf4', jarPrice: 4500, ready: true }),
  '330ml:3': Object.freeze({ url: 'https://square.link/u/QrE70l4D', jarPrice: 6120, ready: true }),
  '330ml:4': Object.freeze({ url: 'https://square.link/u/z1Oo4sp7', jarPrice: 7920, ready: true }),
  '720ml:1': Object.freeze({ url: 'https://square.link/u/RX7YHyHm', jarPrice: 4050, ready: true }),
  '720ml:2': Object.freeze({ url: 'https://square.link/u/lLYNjALa', jarPrice: 7650, ready: true }),
  '720ml:3': Object.freeze({ url: 'https://square.link/u/yGvfrrbp', jarPrice: 10800, ready: true })
});

export function checkoutFor(size, quantity, subscription = false, catalogue = subscription ? subscriptionOffers : squareOffers, blends = []) {
  const quote = priceOrder(size, quantity, subscription, 'shipping', blends);
  const special = size === '330ml' && quantity === 1 && !subscription && ['ocean-gold', 'ocean-vitality'].includes(blends[0]);
  const offer = catalogue[size + ':' + quantity + (special ? ':' + blends[0] : '')];
  if (!offer || !offer.ready || offer.jarPrice !== quote.jarSubtotal) return null;
  if (!/^https:\/\/square\.link\/u\/[A-Za-z0-9]+$/.test(offer.url)) return null;
  return Object.freeze({ url: offer.url, total: quote.total });
}

export function blendChoices(blends) {
  return blends.map((blend, index) => 'Jar ' + (index + 1) + ': ' + blend).join('; ');
}

export function createSquareCheckout(form) {
  const panel = document.createElement('div');
  panel.className = 'order-square';
  const heading = document.createElement('h3');
  heading.textContent = 'Pay securely with Square';
  const note = document.createElement('p');
  note.className = 'order-shipping-note';
  const choices = document.createElement('textarea');
  choices.readOnly = true;
  choices.rows = 2;
  choices.setAttribute('aria-label', 'Blend choices for Square checkout');
  const actions = document.createElement('div');
  actions.className = 'order-actions';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'button';
  copy.textContent = 'Copy blend choices';
  const link = document.createElement('a');
  link.className = 'button button-dark';
  link.rel = 'noopener';
  const status = document.createElement('p');
  status.className = 'order-copy-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  const toast = document.createElement('div');
  toast.className = 'order-square-toast';
  toast.hidden = true;
  toast.setAttribute('aria-hidden', 'true');
  const toastTitle = document.createElement('strong');
  const toastDetail = document.createElement('span');
  toast.append(toastTitle, toastDetail);
  document.body.append(toast);
  let toastTimer;
  let leaving = false;
  function feedback(title, detail, success) {
    status.textContent = title + '. ' + detail;
    status.dataset.result = success ? 'success' : 'error';
    toastTitle.textContent = title;
    toastDetail.textContent = detail;
    toast.dataset.result = status.dataset.result;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
  }
  actions.append(copy, link);
  panel.append(heading, note, choices, actions, status);
  panel.hidden = true;
  form.querySelector('.order-enquiry-fallback').before(panel);
  async function copyChoices() {
    try {
      await navigator.clipboard.writeText(choices.value);
      feedback('Copied to clipboard', 'Paste into Square’s required blend-choice field.', true);
      copy.textContent = 'Copied ✓';
      return true;
    } catch {
      choices.focus();
      choices.select();
      feedback('Copying was blocked', 'Copy the selected blend choices above, then continue to Square and paste them.', false);
      return false;
    }
  }
  copy.addEventListener('click', copyChoices);
  // Finish the clipboard write while this page has focus. Show the result
  // before same-tab navigation so the confirmation is visible on handsets too.
  link.addEventListener('click', async event => {
    if (!link.hasAttribute('href') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (leaving) return;
    if (link.dataset.copyBlocked === 'true') {
      window.location.assign(link.href);
      return;
    }
    leaving = true;
    link.setAttribute('aria-busy', 'true');
    const url = link.href;
    const copied = await copyChoices();
    if (!copied) {
      leaving = false;
      link.removeAttribute('aria-busy');
      link.dataset.copyBlocked = 'true';
      link.textContent = 'Continue to Square';
      return;
    }
    link.textContent = 'Copied ✓ · Opening Square';
    setTimeout(() => window.location.assign(url), 1500);
  });
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    leaving = false;
    link.removeAttribute('aria-busy');
    link.textContent = link.dataset.copyBlocked === 'true' ? 'Continue to Square' : 'Checkout on Square';
    toast.hidden = true;
  });
  return (size, quantity, subscription, blends, blendIds) => {
    const checkout = checkoutFor(size, quantity, subscription, undefined, blendIds);
    panel.hidden = !checkout;
    status.textContent = '';
    delete status.dataset.result;
    delete link.dataset.copyBlocked;
    toast.hidden = true;
    copy.textContent = 'Copy blend choices';
    const previewNote = form.querySelector('#order-preview-note');
    previewNote.textContent = checkout ? 'Checkout on Square copies your blend choices. Paste them into the required blend-choice field in Square.' : 'Checkout is unavailable for this selection. Please contact the team below.';
    if (!checkout) {
      link.removeAttribute('href');
      choices.value = '';
      return;
    }
    choices.value = blendChoices(blends);
    const oceanSingle = size === '330ml' && quantity === 1 && !subscription && ['ocean-gold', 'ocean-vitality'].includes(blendIds?.[0]);
    note.textContent = oceanSingle
      ? 'Click Checkout on Square to copy your blend choice and open Square. Keep the quantity at 1. Click Checkout and paste your blend into the required field. Your expected total including chilled delivery is ' + money(checkout.total) + '.'
      : subscription
      ? 'Click Checkout on Square to copy your blend choices and open your monthly checkout. Paste your blends and enter your full UK mainland delivery name, address and postcode in the required fields. Your total is ' + money(checkout.total) + ' each month, including free delivery. Cancel anytime.'
      : 'Click Checkout on Square to copy your blend choices and open Square. Select One-time purchase. Keep the bundle quantity at 1. Click Checkout and paste your blends into the required field. Your expected total including chilled delivery is ' + money(checkout.total) + '. For a monthly subscription with free delivery, select Subscribe & Save on this website first.';
    link.href = checkout.url;
    link.textContent = 'Checkout on Square';
  };
}
