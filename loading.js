(() => {
  const root = document.documentElement;
  const loader = document.querySelector('.page-loader');
  if (!root.classList.contains('page-loading')) return;

  const regions = [...document.querySelectorAll('.site-header, main, footer, .product-dialog')];
  regions.forEach(region => { region.inert = true; });
  let complete = false;
  let sequenceProgress = 0;
  let criticalProgress = 0;
  let sequenceReady;
  const sequence = new Promise(resolve => { sequenceReady = resolve; });
  const update = () => root.style.setProperty('--load-progress', String(sequenceProgress * .8 + criticalProgress * .2));

  const finish = () => {
    if (complete) return;
    complete = true;
    root.classList.remove('page-loading');
    loader.setAttribute('aria-hidden', 'true');
    regions.forEach(region => { region.inert = false; });
    document.dispatchEvent(new Event('seamoss:ready'));
  };
  document.addEventListener('seamoss:load-timeout', finish, { once: true });
  addEventListener('pageshow', event => { if (event.persisted) finish(); });

  window.seamossLoading = {
    progress(loaded, total) {
      sequenceProgress = total ? loaded / total : 1;
      update();
    },
    ready() {
      sequenceProgress = 1;
      update();
      sequenceReady();
    }
  };

  const images = [...document.querySelectorAll('.hero-backdrop img, .jar-poster, .loader-emblem img')];
  const critical = images.map(image => image.decode().catch(() => {}));
  critical.push(document.fonts.ready);
  let loaded = 0;
  const prepared = Promise.all(critical.map(task => Promise.resolve(task).catch(() => {}).then(() => {
    criticalProgress = ++loaded / critical.length;
    update();
  })));
  Promise.all([sequence, prepared]).then(finish);
})();
