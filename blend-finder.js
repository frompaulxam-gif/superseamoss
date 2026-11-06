import { blends, ingredients } from './blend-preview-data.mjs?v=ingredient-capitals1';
import { priceOrder, money } from './order-pricing.mjs?v=taster1';

// Health interests only select guidance. Product matches come from flavour choices.
const flavourMatches = {
  simple: ['ocean-gold'],
  citrus: ['manuka-glow', 'lychee-citrus-glow', 'immunity-booster'],
  fruity: ['sublime-strawberry', 'wonder-woman', 'immunity-booster'],
  warming: ['gut-health-booster', 'rich-clarification', 'cellular-reset'],
  botanical: ['onyx-purity', 'emerald-cleanse', 'ocean-vitality'],
  discovery: ['ocean-gold', 'manuka-glow', 'lychee-citrus-glow']
};
const root = document.querySelector('#blend-finder');
const form = root?.querySelector('form');
if (form) {
  const steps = [...form.querySelectorAll('[data-finder-step]')];
  const result = root.querySelector('[data-finder-result]');
  const progress = root.querySelector('[data-finder-progress]');
  const ageStop = root.querySelector('[data-finder-age-stop]');
  const error = root.querySelector('[data-finder-error]');
  const back = root.querySelector('[data-finder-back]');
  const next = root.querySelector('[data-finder-next]');
  let step = 0;
  function value(name) { return form.querySelector(`input[name="${name}"]:checked`)?.value; }
  function showStep(index, focus = true) {
    step = index;
    result.hidden = true;
    ageStop.hidden = true;
    form.hidden = false;
    steps.forEach((panel, i) => { panel.hidden = i !== index; });
    back.hidden = index === 0;
    next.textContent = index === steps.length - 1 ? 'See my suggestions' : 'Continue';
    progress.textContent = `Step ${index + 1} of ${steps.length}`;
    error.textContent = '';
    if (focus) steps[index].querySelector('h3').focus();
  }
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function showResult() {
    const flavour = value('finder-flavour');
    const people = value('finder-people');
    const routine = value('finder-routine');
    const ids = flavourMatches[flavour];
    const quantity = routine === 'explore' ? (people === 'family' ? 4 : 3)
      : routine === 'try' ? 1 : people === 'me' ? 1 : people === 'partner' ? 2 : 3;
    const chosen = Array.from({length: quantity}, (_, i) => ids[i % ids.length]);
    const quote = priceOrder('330ml', quantity, false, 'shipping', chosen);
    const title = result.querySelector('h3');
    title.textContent = flavour === 'simple' ? 'Start with the original.' : 'A few flavours to make yours.';
    result.querySelector('[data-finder-reason]').textContent = flavour === 'simple'
      ? 'You chose simple sea moss. Ocean Gold Seamoss is our plain sea moss gel. There’s no need to add botanicals if you prefer to keep it simple.'
      : 'Chosen for the flavours and ingredients you selected. Compare these blends and choose the one you enjoy.';
    const cards = result.querySelector('[data-finder-cards]');
    cards.replaceChildren(...ids.map((id, i) => {
      const blend = blends.find(item => item.id === id);
      const card = el('article', '', 'finder-match');
      const image = el('img');
      image.src = `assets/preview/jars-fit/${id}.webp?v=edges-clean1`;
      image.alt = `${blend.name} jar`;
      image.width = 160; image.height = 160; image.loading = 'lazy';
      card.append(image, el('p', i ? 'ALSO EXPLORE' : 'YOUR FLAVOUR PICK', 'tiny-label'), el('h4', blend.name));
      const names = blend.ingredients.map(key => ingredients.find(item => item.id === key)?.name).filter(Boolean);
      card.append(el('p', (id === 'ocean-gold' ? names : ['Seamoss', ...names]).join(' · ')));
      const link = el('a', 'View this blend', 'finder-text-link');
      link.href = `#blend-${id}`;
      card.append(link);
      return card;
    }));
    result.querySelector('[data-finder-offer]').textContent = `${quantity} × 330ml ${quantity === 1 ? 'jar' : 'jars'} · ${money(quote.total)} total`;
    result.querySelector('[data-finder-delivery]').textContent = `One-off order. Jars ${money(quote.jarSubtotal)} + ${quote.delivery ? money(quote.delivery) + ' chilled UK mainland delivery' : 'free chilled UK mainland delivery'}. You can change your choices before paying.`;
    const buy = result.querySelector('[data-order-bundle]');
    buy.href = '#order-choices';
    buy.dataset.orderBundle = String(quantity);
    buy.dataset.orderBlends = chosen.join(',');
    buy.textContent = quantity === 1 ? 'Choose this jar' : `Build my ${quantity}-jar bundle`;
    const monthly = result.querySelector('[data-finder-monthly]');
    monthly.hidden = routine !== 'monthly';
    if (!monthly.hidden) {
      const monthlyQuote = priceOrder('330ml', quantity, true, 'shipping', chosen);
      monthly.textContent = `Prefer a monthly routine? The monthly option for ${quantity} × 330ml ${quantity === 1 ? 'jar is' : 'jars is'} ${money(monthlyQuote.total)} per month, with free delivery. Select Subscribe & Save in the order builder only if you want recurring payments. Nothing is subscribed automatically.`;
    }
    result.querySelector('[data-finder-family]').hidden = people !== 'family';
    const health = result.querySelector('[data-finder-health]');
    health.replaceChildren();
    if (value('finder-interest') === 'libido') {
      health.append(el('p', 'Low libido can have many causes. If it worries you, speak with a GP. These flavour suggestions are not treatments for low libido.'));
      const link = el('a', 'Read the NHS advice on low libido', 'finder-text-link');
      link.href = 'https://www.nhs.uk/symptoms/loss-of-libido/';
      link.target = '_blank'; link.rel = 'noopener'; health.append(link);
    } else {
      health.append(el('p', 'These are flavour suggestions, not treatments for symptoms or medical conditions. If you have an ongoing health concern, speak with a healthcare professional.'));
    }
    form.hidden = true;
    result.hidden = false;
    progress.textContent = 'Your suggestions';
    title.focus();
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (step === 0 && value('finder-age') === 'under18') {
      // Stop before health questions or product matching. Clear earlier adult results.
      result.querySelector('[data-finder-cards]').replaceChildren();
      const buy = result.querySelector('[data-order-bundle]');
      buy.removeAttribute('data-order-blends');
      buy.removeAttribute('href');
      buy.textContent = '';
      result.hidden = true;
      form.hidden = true;
      ageStop.hidden = false;
      progress.textContent = 'Before you continue';
      ageStop.querySelector('h3').focus();
      return;
    }
    const missing = [...steps[step].querySelectorAll('fieldset')].find(fieldset => !fieldset.querySelector('input:checked'));
    if (missing) {
      error.textContent = 'Choose an option for each question to continue.';
      missing.querySelector('input').focus();
      return;
    }
    if (step < steps.length - 1) showStep(step + 1);
    else showResult();
  });
  form.addEventListener('change', () => {
    error.textContent = '';
    root.querySelector('[data-finder-libido]').hidden = value('finder-interest') !== 'libido';
  });
  root.querySelector('[data-finder-age-change]').addEventListener('click', () => showStep(0));
  back.addEventListener('click', () => showStep(step - 1));
  result.querySelector('[data-finder-change]').addEventListener('click', () => showStep(0));
  result.querySelector('[data-finder-restart]').addEventListener('click', () => {
    form.reset();
    root.querySelector('[data-finder-libido]').hidden = true;
    result.querySelector('[data-finder-cards]').replaceChildren();
    showStep(0);
  });
  showStep(0, false);
  root.querySelector('[data-finder-ui]').hidden = false;
  root.querySelector('[data-finder-fallback]').hidden = true;
}
