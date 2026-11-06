(() => {
  const section = document.querySelector('.welcome-offer');
  if (!section) return;
  const button = section.querySelector('[data-welcome-spin]');
  const wheel = section.querySelector('.welcome-wheel-disc');
  const reward = section.querySelector('.welcome-reward');
  // The real code stays in the HTML if this script cannot load.
  button.hidden = false;
  reward.replaceChildren(Object.assign(document.createElement('p'), { textContent: 'A guaranteed 5% discount. Ready when you are.' }));
  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    const label = Object.assign(document.createElement('p'), { textContent: 'Your 5% code' });
    const code = Object.assign(document.createElement('strong'), { textContent: 'WELCOME5' });
    const help = Object.assign(document.createElement('p'), { textContent: 'Use it at checkout.' });
    reward.replaceChildren(label, code, help);
    button.textContent = 'Your code is ready';
  }
  button.addEventListener('click', (event) => {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Revealing your code…';
    if (event.detail === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !wheel.animate) {
      reveal();
      return;
    }
    // Only transforms animate; no video, image downloads, cookies or email data.
    const fallback = window.setTimeout(reveal, 2300);
    try {
      const animation = wheel.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(1125deg)' }], {
        duration: 2000, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards'
      });
      animation.finished.then(() => { clearTimeout(fallback); reveal(); }).catch(reveal);
    } catch { reveal(); }
  });
})();
