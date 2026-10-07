(() => {
  const section = document.querySelector('.reviews-section');
  if (!section) return;
  const group = section.querySelector('.reviews-group');
  const track = section.querySelector('.reviews-track');
  if (!group || !track) return;
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
  track.append(clone);
  section.dataset.reviewsReady = 'true';
  const observer = new IntersectionObserver(entries => {
    section.dataset.reviewsVisible = String(entries[0].isIntersecting);
  });
  observer.observe(section);
})();
