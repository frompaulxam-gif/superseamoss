// Enhancement only: CSS completes the welcome even if this script cannot load.
(() => {
  const page = document.body;
  const arrival = document.querySelector('.thanks-arrival');
  if (!arrival) return;
  const dismiss = () => page.classList.add('arrival-dismissed');
  page.classList.add('arrival-interactive');
  arrival.addEventListener('pointerdown', dismiss, { once: true });
  addEventListener('wheel', dismiss, { once: true, passive: true });
  addEventListener('touchmove', dismiss, { once: true, passive: true });
  addEventListener('keydown', dismiss, { once: true });
  addEventListener('pageshow', event => { if (event.persisted) dismiss(); });
})();
