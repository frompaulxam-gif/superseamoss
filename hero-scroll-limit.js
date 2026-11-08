(() => {
  const track = document.querySelector('.seamoss-hero-track');
  const stage = track?.querySelector('.seamoss-hero');
  if (!stage) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const traverseMs = 2200;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  let frame = 0, run = null, touch = null, queued = 0;
  let idleTimer = 0, idleDue = false, idleConsumed = false;

  function geometry() {
    const start = scrollY + track.getBoundingClientRect().top;
    const distance = Math.max(0, track.offsetHeight - stage.clientHeight);
    const banner = document.querySelector('.promise-strip');
    const end = start + distance;
    return { start, end, distance,
      finish: end + (banner ? banner.offsetHeight + Math.min(96, stage.clientHeight * .12) : 0) };
  }
  function nearHero() {
    const { start, end, distance } = geometry();
    // The entire sticky reveal can resume. A collapsed loading/fallback hero
    // may expand only while the visitor is still looking at that first screen.
    return scrollY >= start - 2 && scrollY <= (distance ? end : start + stage.clientHeight * .45);
  }
  function enabled() {
    return !reduced.matches && !document.hidden &&
      track.querySelector('canvas')?.dataset.ready === 'true' &&
      track.dataset.fallback !== 'true' &&
      !document.documentElement.classList.contains('page-loading') &&
      !document.body.classList.contains('dialog-open') &&
      !document.querySelector('.site-menu[open]');
  }
  function remember(direction) {
    queued = direction > 0 ? 1 : 0;
    track.dataset.queuedSwipe = String(queued);
  }
  function cancelIdle() {
    clearTimeout(idleTimer); idleTimer = 0; idleDue = false; idleConsumed = true;
  }
  function stop(state = 'idle') {
    cancelAnimationFrame(frame); frame = 0; run = null;
    track.dataset.playback = state;
  }
  function reset() { stop(); touch = null; remember(0); }
  function leave() { cancelIdle(); reset(); }
  function nativeTarget(node) {
    if (!(node instanceof Element)) return true;
    if (node.closest('input,textarea,select,button,a,[contenteditable],dialog,nav,summary')) return true;
    for (let el = node; el && el !== document.body; el = el.parentElement) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) return true;
    }
    return false;
  }
  function expand() {
    if (track.dataset.pending !== 'true') return true;
    if (!nearHero()) return false;
    delete track.dataset.pending;
    document.dispatchEvent(new Event('seamoss:stage-ready'));
    return true;
  }
  function advance(now) {
    frame = 0;
    if (!run) return;
    if (document.hidden) { run.pausedAt = now; return; }
    if (!enabled()) { stop(); return; }
    const { start, finish } = geometry();
    // Navigation or a native flick all the way past the hero must stay native.
    if (scrollY > finish + 2 || scrollY < start - 2) { stop(); return; }
    const end = run.direction > 0 ? finish : start;
    const elapsed = clamp((now - run.started) / run.duration, 0, 1);
    // Use wall-clock time, not a capped per-frame increment: slow devices still
    // complete on time. This gentle ease-out gives the caption a soft landing.
    const eased = 1 - Math.pow(1 - elapsed, 1.5);
    const planned = run.from + (end - run.from) * eased;
    // Native momentum and Safari toolbar corrections can advance the page.
    // Accept that progress instead of cancelling or pulling it backwards.
    const next = run.direction > 0 ? Math.max(scrollY, planned) : Math.min(scrollY, planned);
    window.scrollTo({ top: clamp(next, start, finish), behavior: 'instant' });
    if (elapsed >= 1 || Math.abs(end - scrollY) < 1) { stop('complete'); return; }
    frame = requestAnimationFrame(advance);
  }
  function play(direction) {
    if (!enabled() || !nearHero() && !run || !expand()) return false;
    const { start, end, distance, finish } = geometry();
    if (!distance || (direction > 0 ? scrollY >= end && !run : scrollY <= start)) return false;
    cancelIdle(); remember(0);
    // More swipes in the same direction never restart the playback clock.
    if (run?.direction === direction) return true;
    const target = direction > 0 ? finish : start;
    run = { direction, from: scrollY, started: performance.now(), pausedAt: null,
      duration: Math.max(450, traverseMs * Math.abs(target - scrollY) / (finish - start)) };
    track.dataset.playback = 'playing';
    if (!frame) frame = requestAnimationFrame(advance);
    return true;
  }
  function activateReadyHero() {
    if (!enabled() || !nearHero()) return false;
    if (queued) return play(1);
    // Keep the initial stage ready, but never expand underneath product browsing.
    if (Math.abs(scrollY - geometry().start) <= 2) expand();
    return false;
  }
  function playIdle() {
    if (!idleDue || idleConsumed) return;
    if (reduced.matches || !nearHero()) { cancelIdle(); return; }
    if (!enabled() || touch) return;
    if (play(1)) track.dataset.autoplay = 'started';
  }
  function armIdle() {
    if (idleTimer || idleDue || idleConsumed) return;
    if (reduced.matches || scrollY > geometry().start + 2 || location.hash && location.hash !== '#top') { cancelIdle(); return; }
    if (document.hidden || document.documentElement.classList.contains('page-loading')) return;
    idleTimer = setTimeout(() => { idleTimer = 0; idleDue = true; playIdle(); }, 1000);
  }
  function queue(delta, event) {
    if (!delta || reduced.matches || document.hidden) return false;
    if (nativeTarget(event.target)) { leave(); return false; }
    const direction = Math.sign(delta);
    if (!nearHero() && !run) return false;
    cancelIdle();
    // Safari can mark a gesture noncancelable after committing native scrolling.
    // Its intent is still valid; readiness and touchcancel must not erase it.
    remember(direction);
    if (!play(direction)) return false;
    if (event.cancelable) event.preventDefault();
    return true;
  }
  addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    queue(event.deltaY, event);
  }, { passive: false });
  addEventListener('touchstart', event => {
    touch = null;
    if (event.touches.length !== 1 || reduced.matches || document.hidden) return;
    if (nativeTarget(event.target)) { leave(); return; }
    const p = event.touches[0];
    touch = { id: p.identifier, x: p.clientX, y: p.clientY, startX: p.clientX, startY: p.clientY,
      extremeY: p.clientY, direction: 0, controlled: false, vertical: false };
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (!touch) return;
    if (event.touches.length !== 1 || event.touches[0].identifier !== touch.id) { touch = null; return; }
    const p = event.touches[0];
    const totalY = touch.startY - p.clientY, totalX = touch.startX - p.clientX;
    if (!touch.vertical) {
      if (Math.max(Math.abs(totalX), Math.abs(totalY)) < 6) return;
      if (Math.abs(totalX) > Math.abs(totalY)) { touch = null; return; }
      touch.vertical = true;
    }
    let delta = touch.y - p.clientY;
    if (touch.direction && Math.sign(delta) !== touch.direction) {
      // Finger recoil at release is not a deliberate reverse swipe.
      if (Math.abs(p.clientY - touch.extremeY) < 12) {
        if (touch.controlled && event.cancelable) event.preventDefault();
        touch.y = p.clientY; return;
      }
      delta = -touch.direction * 12;
    }
    const handled = queue(delta, event);
    const direction = Math.sign(delta);
    if (direction) {
      touch.extremeY = direction !== touch.direction ? p.clientY
        : direction > 0 ? Math.min(touch.extremeY, p.clientY) : Math.max(touch.extremeY, p.clientY);
      touch.direction = direction;
    }
    touch.x = p.clientX; touch.y = p.clientY; touch.controlled ||= handled;
  }, { passive: false });
  function finishTouch(event) {
    const gesture = touch; touch = null;
    if (gesture && !event.touches.length && !gesture.controlled) {
      // A quick flick may have no intermediate touchmove.
      const p = [...event.changedTouches].find(point => point.identifier === gesture.id);
      if (p) {
        const delta = gesture.startY - p.clientY, dx = gesture.startX - p.clientX;
        if (Math.abs(delta) >= 8 && Math.abs(delta) > Math.abs(dx)) queue(delta, event);
      }
    }
    activateReadyHero(); playIdle();
  }
  addEventListener('touchend', finishTouch, { passive: false });
  // Safari may cancel before the first touchmove. Its final coordinates still
  // identify a swipe; browser takeover ends contact, not the requested reveal.
  addEventListener('touchcancel', finishTouch, { passive: false });
  addEventListener('pointerdown', event => { if (nativeTarget(event.target)) leave(); }, { passive: true });
  addEventListener('keydown', leave, { passive: true });
  addEventListener('click', event => { if (nativeTarget(event.target)) leave(); }, { passive: true });
  addEventListener('hashchange', leave, { passive: true });
  addEventListener('scroll', () => {
    if (!run && scrollY > geometry().start + 2) cancelIdle();
    if (!nearHero()) remember(0);
    if (track.dataset.pending === 'true') activateReadyHero();
  }, { passive: true });
  document.addEventListener('seamoss:navigation', leave);
  document.addEventListener('seamoss:hero-ready', () => { activateReadyHero(); playIdle(); });
  document.addEventListener('seamoss:ready', () => { activateReadyHero(); armIdle(); playIdle(); });
  // Geometry is read during playback, so toolbar resizing and rotation cannot
  // cancel the reveal or leave a stale destination outside the new hero.
  addEventListener('resize', () => { if (!run) activateReadyHero(); }, { passive: true });
  function resume() {
    if (run && run.pausedAt !== null) {
      if (!enabled() || !nearHero() && scrollY > geometry().finish) { leave(); return; }
      run.started += performance.now() - run.pausedAt; run.pausedAt = null;
      if (!frame) frame = requestAnimationFrame(advance);
    }
    activateReadyHero(); armIdle(); playIdle();
  }
  function pause() {
    if (run && run.pausedAt === null) run.pausedAt = performance.now();
    cancelAnimationFrame(frame); frame = 0;
    clearTimeout(idleTimer); idleTimer = 0; touch = null;
  }
  addEventListener('pagehide', pause, { passive: true });
  addEventListener('pageshow', resume, { passive: true });
  reduced.addEventListener('change', leave);
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
  activateReadyHero(); armIdle();
})();
