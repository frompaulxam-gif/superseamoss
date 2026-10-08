import { createIngredientGuide } from './ingredient-guide.mjs?v=1';
import { blends, ingredients } from './blend-preview-data.mjs?v=ingredient-capitals1';
import { selectedBlend } from './blend-recipes.mjs?v=ingredient-capitals1';

export function createBlendPreview(form, selects) {
  const root = document.querySelector('.blend-preview');
  if (!root) return;
  const stage = root.querySelector('.blend-preview-stage');
  const layer = root.querySelector('.blend-preview-ingredients');
  const jar = root.querySelector('.blend-preview-jar');
  const name = root.querySelector('.blend-preview-name');
  const details = root.querySelector('.blend-preview-details');
  const tabs = root.querySelector('.blend-preview-tabs');
  const guide = createIngredientGuide(ingredients, blends);
  const hint = root.querySelector('.blend-preview-hint');
  hint.addEventListener('click', () => {
    const blend = selectedBlend(selects[active]);
    if (blend) guide.open('sea-moss', blend);
  });
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const home = document.createComment('Product preview on desktop');
  root.before(home);
  const place = () => mobile.matches ? form.querySelector('.order-blend-fields').before(root) : home.after(root);
  mobile.addEventListener('change', place);
  place();

  let active = 0;
  let current = null;
  let revision = 0;
  let keyboard = false;
  let artworkReady = false;
  let loading = null;
  const animations = new Set();
  const ingredientById = new Map(ingredients.map((ingredient, cell) => [ingredient.id, { ...ingredient, cell }]));
  const cancel = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
  const motionOff = () => media.matches || document.body.classList.contains('paused') || keyboard;
  const animate = (node, frames, options) => {
    const animation = node.animate(frames, { fill: 'both', ...options });
    animations.add(animation);
    return animation.finished.catch(() => {});
  };
  const closeNames = () => layer.querySelectorAll('.is-named').forEach(button => button.classList.remove('is-named'));
  const positions = {
    1: [[24, 24]],
    2: [[20, 27], [81, 66]],
    3: [[24, 21], [82, 37], [28, 77]],
    4: [[24, 22], [79, 23], [80, 75], [24, 75]],
    5: [[26, 19], [77, 23], [88, 58], [60, 83], [16, 68]],
    6: [[26, 19], [75, 19], [87, 49], [74, 79], [26, 79], [13, 49]]
  };

  function renderArtwork(blend) {
    const focusedIngredient = layer.contains(document.activeElement);
    layer.replaceChildren();
    stage.dataset.blend = blend.id;
    jar.style.setProperty('--jar-image', `url("${new URL(`./assets/preview/jars-fit/${blend.id}.webp?v=edges-clean1`, import.meta.url).href}")`);
    jar.setAttribute('aria-label', `${blend.name} Seamoss jar`);
    stage.style.setProperty('--blend-accent', blend.accent);
    name.textContent = blend.name;
    details.textContent = blend.description || blend.ingredients.map(id => ingredientById.get(id).name).join(' · ');
    blend.ingredients.forEach((id, index) => {
      const ingredient = ingredientById.get(id);
      const [x, y] = positions[blend.ingredients.length][index];
      const anchor = document.createElement('div');
      anchor.className = 'blend-ingredient-anchor';
      anchor.style.left = `${x}%`;
      anchor.style.top = `${y}%`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'blend-ingredient';
      button.dataset.ingredient = id;
      button.setAttribute('aria-label', 'Learn about ' + ingredient.name);
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-describedby', 'blend-preview-hint');
      const photo = document.createElement('span');
      photo.className = 'blend-ingredient-photo';
      photo.setAttribute('aria-hidden', 'true');
      // Individual contain-sized cutouts avoid cropping or neighbouring sprite fragments.
      photo.style.setProperty('--ingredient-image', `url("${new URL(`./assets/preview/ingredients-fit/${id}.webp?v=fit3`, import.meta.url).href}")`);
      const label = document.createElement('span');
      label.className = 'blend-ingredient-name';
      label.textContent = ingredient.name;
      label.setAttribute('aria-hidden', 'true');
      const show = () => { closeNames(); button.classList.add('is-named'); };
      button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(); });
      button.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') button.classList.remove('is-named'); });
      button.addEventListener('focus', show);
      button.addEventListener('blur', () => button.classList.remove('is-named'));
      button.addEventListener('click', () => {
        if (root.classList.contains('is-switching')) return;
        closeNames();
        guide.open(id, blend);
      });
      button.append(photo, label);
      anchor.append(button);
      layer.append(anchor);
    });
    // A paused-motion change can replace a focused ingredient. Keep keyboard focus in the preview.
    if (focusedIngredient) layer.querySelector('.blend-ingredient')?.focus({ preventScroll: true });
    current = blend.key || blend.id;
  }

  const travelFrames = (node, entering) => {
    const box = stage.getBoundingClientRect();
    const x = box.width * (50 - parseFloat(node.style.left)) / 100;
    const y = box.height * (50 - parseFloat(node.style.top)) / 100;
    const centre = `translate(${x}px, ${y}px) scale(.88)`;
    const outside = 'translate(0px, 0px) scale(1)';
    return entering
      ? [{ transform: centre, opacity: 0 }, { transform: centre, opacity: 1, offset: .12 }, { transform: outside, opacity: 1 }]
      : [{ transform: outside, opacity: 1 }, { transform: centre, opacity: 1, offset: .8 }, { transform: centre, opacity: 0 }];
  };

  async function show(blend) {
    const key = blend?.key || blend?.id;
    if (!blend || (current === key && !root.classList.contains('is-switching'))) return;
    guide.close();
    const ticket = ++revision;
    cancel();
    root.classList.remove('is-switching');
    if (!current || !artworkReady || motionOff() || (current === key)) {
      renderArtwork(blend);
      return;
    }
    closeNames();
    root.classList.add('is-switching');
    // Ingredients always sit beneath the foreground jar, making the inward movement disappear behind it.
    await Promise.all([...layer.children].map((node, index) => animate(node, travelFrames(node, false), {
      duration: 230, delay: index * 18, easing: 'cubic-bezier(.4,0,.2,1)'
    })));
    if (ticket !== revision) return;
    await animate(jar, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 90, easing: 'ease-out' });
    if (ticket !== revision) return;
    cancel();
    renderArtwork(blend);
    const entering = [...layer.children].map((node, index) => animate(node, travelFrames(node, true), {
      duration: 420, delay: 90 + index * 30, easing: 'cubic-bezier(.16,1,.3,1)'
    }));
    await Promise.all([animate(jar, [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 180, easing: 'cubic-bezier(.16,1,.3,1)' }), ...entering]);
    if (ticket !== revision) return;
    cancel();
    root.classList.remove('is-switching');
  }

  function updateTabs() {
    const count = Number(new FormData(form).get('jar-count'));
    if (active >= count) active = count - 1;
    // Preserve button focus while a customer navigates a multi-jar preview.
    for (let i = 0; i < 4; i++) {
      let button = tabs.children[i];
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.textContent = `Jar ${i + 1}`;
        button.addEventListener('click', () => { active = i; refresh(); });
        tabs.append(button);
      }
      button.hidden = i >= count;
      button.setAttribute('aria-pressed', String(i === active));
      button.setAttribute('aria-label', `Preview jar ${i + 1}: ${selectedBlend(selects[i])?.name || ''}`);
    }
    tabs.classList.toggle('is-single', count === 1);
    tabs.parentElement.hidden = count === 1;
    root.querySelector('.blend-preview-kicker').textContent = count > 1 ? `YOUR BLEND · JAR ${active + 1} OF ${count}` : 'YOUR BLEND, UP CLOSE';
  }

  function refresh() {
    updateTabs();
    show(selectedBlend(selects[active]));
  }
  // Register after the existing pricing renderer so a 720ml quantity clamp is reflected in the preview.
  form.addEventListener('change', event => {
    const index = selects.indexOf(event.target);
    if (index !== -1) active = index;
    refresh();
  });
  selects.forEach((select, index) => select.addEventListener('focus', () => { if (!select.disabled) { active = index; refresh(); } }));
  document.addEventListener('pointerdown', event => { keyboard = false; if (!event.target.closest('.blend-ingredient')) closeNames(); });
  document.addEventListener('keydown', event => { keyboard = true; if (event.key === 'Escape') closeNames(); }, { capture: true });
  const finishWithoutMotion = () => {
    if (media.matches || document.body.classList.contains('paused')) {
      ++revision;
      cancel();
      renderArtwork(selectedBlend(selects[active]));
      root.classList.remove('is-switching');
    }
  };
  media.addEventListener('change', finishWithoutMotion);
  new MutationObserver(finishWithoutMotion).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  function loadArtwork() {
    if (loading) return loading;
    loading = Promise.all([...blends.map(item => `jars-fit/${item.id}.webp?v=edges-clean1`), ...ingredients.map(item => `ingredients-fit/${item.id}.webp?v=fit3`)].map(async asset => {
      const image = new Image();
      image.src = new URL(`./assets/preview/${asset}`, import.meta.url).href;
      await image.decode();
    })).then(() => {
      artworkReady = true;
      root.classList.add('artwork-ready');
    }).catch(() => { root.classList.add('artwork-unavailable'); });
    return loading;
  }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { loadArtwork(); observer.disconnect(); }
  }, { rootMargin: '900px' });
  observer.observe(root);
  form.addEventListener('focusin', loadArtwork, { once: true });
  root.hidden = false;
  refresh();
}
