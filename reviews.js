(() => {
  const section = document.querySelector('.reviews-section');
  if (!section) return;
  const group = section.querySelector('.reviews-group');
  const track = section.querySelector('.reviews-track');
  if (!group || !track) return;
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('a, button').forEach(link => { link.tabIndex = -1; });
  track.append(clone);
  const dialog = document.querySelector('.review-dialog');
  if (dialog) {
    section.addEventListener('click', event => {
      const button = event.target.closest('[data-review-full]');
      const content = button?.closest('.review-card')?.querySelector('.review-full-text');
      if (!content) return;
      dialog.querySelector('#review-dialog-title').textContent = button.closest('.review-card').querySelector('.review-byline').textContent.trim();
      dialog.querySelector('.review-dialog-text').replaceChildren(content.content.cloneNode(true));
      section.dataset.reviewOpen = 'true';
      document.body.classList.add('review-open');
      dialog.showModal();
      dialog.scrollTop = 0;
    });
    dialog.querySelectorAll('[data-review-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      delete section.dataset.reviewOpen;
      document.body.classList.remove('review-open');
    });
  }

  section.dataset.reviewsReady = 'true';
  const observer = new IntersectionObserver(entries => {
    section.dataset.reviewsVisible = String(entries[0].isIntersecting);
  });
  observer.observe(section);
})();
