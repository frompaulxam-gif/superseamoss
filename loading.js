(() => {
  const root = document.documentElement;
  const loader = document.querySelector('.page-loader');
  window.seamossLoading = {
    progress(loaded,total) { root.style.setProperty('--load-progress',String(total ? loaded/total : 1)); },
    ready() { document.dispatchEvent(new Event('seamoss:hero-ready')); }
  };
  if (!loader || !root.classList.contains('page-loading')) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const started = performance.now();
  let complete = false, exiting = false;
  function finish() {
    if (complete) return;
    complete = true;
    root.classList.remove('page-loading');
    loader.setAttribute('aria-hidden', 'true');
    document.dispatchEvent(new Event('seamoss:ready'));
  }
  function leave() {
    if (complete || exiting) return;
    exiting = true;
    const lockup = loader.querySelector('.loader-lockup');
    const brand = document.querySelector('.site-header .brand');
    if (reduced.matches || document.hidden || !lockup?.animate || !brand) { finish(); return; }
    const from = lockup.getBoundingClientRect(), to = brand.getBoundingClientRect();
    const scale = Math.min(to.width / from.width, to.height / from.height);
    const x = to.left + to.width / 2 - (from.left + from.width / 2);
    const y = to.top + to.height / 2 - (from.top + from.height / 2);
    lockup.animate([{transform:'none'},{transform:`translate3d(${x}px,${y}px,0) scale(${scale})`}],
      {duration:480,easing:'cubic-bezier(.76,0,.2,1)',fill:'forwards'}).finished.then(finish,finish);
    loader.animate([{backgroundColor:'#f3efe5'},{backgroundColor:'transparent'}],{duration:480,fill:'forwards'});
  }
  // The brand introduction is brief. Network readiness must never trap visitors here.
  const mark = loader.querySelector('img');
  Promise.race([mark.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,250))]).then(()=>{
    root.classList.add('brand-intro-running');
    setTimeout(leave, reduced.matches ? 0 : Math.max(0, 1400 - (performance.now() - started)));
  });
  document.addEventListener('seamoss:load-timeout',finish,{once:true});
  addEventListener('pageshow',event=>{if(event.persisted)finish();});
  addEventListener('keydown',event=>{if(['Tab','Escape'].includes(event.key))finish();});
  reduced.addEventListener('change',()=>{if(reduced.matches)finish();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finish();});
  setTimeout(finish,2500);
})();
