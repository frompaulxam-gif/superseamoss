import { copyText, selectCopyText, manualCopyHint } from './copy-text.mjs?v=1';
import { priceOrder, money } from './order-pricing.mjs?v=taster1';

// Existing item links are used for one-off orders; monthly payments use dedicated links.
export const squareOffers = Object.freeze({
  '141ml:3': Object.freeze({ url: 'https://square.link/u/WVVd1UhD', jarPrice: 3600, ready: true }),
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
  if (size === '141ml' && (quantity !== 3 || subscription || blends.slice(0, 3).length !== 3 || new Set(blends.slice(0, 3)).size !== 3)) return null;
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
  const reminder = document.createElement('p');
  reminder.className = 'order-copy-required';
  reminder.id = 'square-copy-required';
  reminder.setAttribute('aria-live', 'polite');
  reminder.setAttribute('aria-atomic', 'true');
  const reminderText = document.createElement('strong');
  const requiredCopyText = 'You must copy the blend choices in the box below before proceeding to Square.';
  reminderText.textContent = requiredCopyText;
  reminder.append(reminderText);
  const choices = document.createElement('textarea');
  choices.readOnly = true;
  choices.rows = 2;
  choices.setAttribute('aria-describedby', reminder.id);
  choices.setAttribute('aria-label', 'Blend choices for Square checkout');
  const actions = document.createElement('div');
  actions.className = 'order-actions';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'button';
  copy.textContent = 'Copy blend choices';
  const select = document.createElement('button');
  select.type = 'button';
  select.className = 'button';
  select.textContent = 'Select text to copy';
  select.hidden = true;
  select.addEventListener('click', () => {
    selectCopyText(choices);
    showSelectedReminder();
    status.textContent = manualCopyHint + ' Then continue to Square and paste into the blend-choice field.';
  });
  const link = document.createElement('button');
  link.type = 'button';
  link.className = 'button button-dark';
  link.disabled = true;
  link.setAttribute('aria-describedby', reminder.id);
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
  let checkoutUrl = '';
  let copiedValue = null;
  let revision = 0;
  let copying = false;
  function setReminder(text, active = false) {
    reminderText.textContent = text;
    reminder.dataset.active = String(active);
  }
  function showSelectedReminder() {
    if (copiedValue === choices.value) return;
    setReminder('Text selected. Copy all the blend choices before proceeding to Square.', true);
  }
  function resetCopy() {
    setReminder(requiredCopyText);
    revision += 1;
    copiedValue = null;
    leaving = false;
    link.disabled = true;
    link.textContent = 'Continue to Square';
    copy.textContent = 'Copy blend choices';
    copy.disabled = copying;
    toast.hidden = true;
    status.textContent = '';
    delete status.dataset.result;
  }
  function confirmCopy() {
    setReminder('Copied ✓ You can now continue to Square. Paste your blend choices into the required field.', true);
    copiedValue = choices.value;
    link.disabled = !checkoutUrl;
    select.hidden = true;
    copy.textContent = 'Copied ✓';
    feedback('Copied to clipboard', 'Now continue to Square and paste into the required blend-choice field.', true);
  }
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
  actions.append(copy, select, link);
  panel.append(heading, note, reminder, choices, actions, status);
  panel.hidden = true;
  form.querySelector('.order-enquiry-fallback').before(panel);
  choices.addEventListener('click', () => {
    selectCopyText(choices);
    showSelectedReminder();
    if (copiedValue !== choices.value) status.textContent = manualCopyHint;
  });
  choices.addEventListener('copy', event => {
    // A click or text selection is not proof of copying. Only handle a real
    // browser copy event with the complete current choices selected.
    if (copying || !event.isTrusted || event.defaultPrevented || !event.clipboardData || !checkoutUrl) return;
    if (choices.selectionStart !== 0 || choices.selectionEnd !== choices.value.length) return;
    event.clipboardData.setData('text/plain', choices.value);
    event.preventDefault();
    confirmCopy();
  });
  async function copyChoices() {
    if (copying) return;
    const attempt = revision;
    setReminder('Copying your blend choices…', true);
    copying = true;
    copy.disabled = true;
    link.disabled = true;
    const copied = await copyText(choices);
    copying = false;
    // An earlier async write must never unlock a changed order.
    copy.disabled = false;
    if (attempt !== revision) return;
    select.hidden = copied;
    if (copied) {
      confirmCopy();
      return;
    }
    copiedValue = null;
    setReminder('Copying was blocked. Copy all the text in the box below before proceeding to Square.');
    copy.textContent = 'Try copying again';
    feedback('Automatic copying is unavailable in this browser', manualCopyHint + ' Copy all the text to enable Continue to Square.', false);
  }
  copy.addEventListener('click', copyChoices);
  link.addEventListener('click', () => {
    if (leaving || !checkoutUrl || copiedValue !== choices.value) return;
    leaving = true;
    window.location.assign(checkoutUrl);
  });
  addEventListener('pageshow', event => {
    if (event.persisted) resetCopy();
  });
  return (size, quantity, subscription, blends, blendIds) => {
    const checkout = checkoutFor(size, quantity, subscription, undefined, blendIds);
    panel.hidden = !checkout;
    resetCopy();
    select.hidden = true;
    checkoutUrl = checkout?.url || '';
    const previewNote = form.querySelector('#order-preview-note');
    previewNote.textContent = checkout ? 'Copy your blend choices first, then continue to Square and paste them into the required blend-choice field.' : size === '141ml' ? 'Choose three different blends above to unlock your taster checkout.' : 'Checkout is unavailable for this selection. Please contact the team below.';
    if (!checkout) {
      choices.value = '';
      return;
    }
    choices.value = blendChoices(blends);
    const oceanSingle = size === '330ml' && quantity === 1 && !subscription && ['ocean-gold', 'ocean-vitality'].includes(blendIds?.[0]);
    note.textContent = size === '141ml'
      ? 'Copy your three blend choices below, then click Continue to Square. Keep the quantity at 1 for one taster trio: 3 × 141ml jars. Paste your choices into the required field. Your total including chilled delivery is ' + money(checkout.total) + '.'
      : oceanSingle
      ? 'Copy your blend choice below, then click Continue to Square. Keep the quantity at 1. Click Checkout and paste your blend into the required field. Your expected total including chilled delivery is ' + money(checkout.total) + '.'
      : subscription
      ? 'Copy your blend choices below, then click Continue to Square for your monthly checkout. Paste your blends and enter your full UK mainland delivery name, address and postcode in the required fields. Your total is ' + money(checkout.total) + ' each month, including free delivery. Cancel anytime.'
      : 'Copy your blend choices below, then click Continue to Square. Select One-time purchase. Keep the bundle quantity at 1. Click Checkout and paste your blends into the required field. Your expected total including chilled delivery is ' + money(checkout.total) + '. For a monthly subscription with free delivery, select Subscribe & Save on this website first.';
  };
}
