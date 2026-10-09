(() => {
  const track = document.querySelector('.seamoss-hero-track');
  const stage = track?.querySelector('.seamoss-hero');
  if (!stage) return;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  // A short vertical swipe plays the complete reveal, with a softer caption finish.
  const traverseMs = 2400;
  let viewportWidth = innerWidth;
  let earlySwipe = 0, earlyNative = false;
  let nativeUntil = 0, nativeQuietUntil = 0;
  let idleTimer=0, idleDue=false, idleConsumed=false;
  function cancelIdle() {
    clearTimeout(idleTimer); idleTimer=0; idleDue=false; idleConsumed=true;
  }
  function playIdle() {
    if(!idleDue || idleConsumed) return;
    if(reduced.matches || document.hidden || !nearHero()) { cancelIdle(); return; }
    if(!enabled() || touch) return;
    if(track.dataset.pending==='true') {
      delete track.dataset.pending;
      document.dispatchEvent(new Event('seamoss:stage-ready'));
    }
    idleConsumed=true; idleDue=false;
    track.dataset.autoplay='started';
    play(1);
  }
  function armIdle() {
    if(idleTimer || idleDue || idleConsumed) return;
    if(reduced.matches || document.hidden || scrollY>geometry().start+2 || location.hash&&location.hash!=='#top') { cancelIdle(); return; }
    if(document.documentElement.classList.contains('page-loading')) return;
    // One second of the visible hero is enough: no scroll gesture is required.
    idleTimer=setTimeout(()=>{idleTimer=0;idleDue=true;playIdle();},1000);
  }
  let destination = null, frame = 0, previous = 0, writtenY = null, touch = null, remainder = 0, settledY = null;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function finishResistance(progress) {
    const smooth = (a, b) => {
      const t = clamp((progress - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    };
    // Ease into the final caption, then release smoothly. Never stop or require a new gesture.
    return 1 - .45 * smooth(.82, .94) * (1 - smooth(1.01, 1.12));
  }
  function geometry() {
    const start = scrollY + track.getBoundingClientRect().top;
    const distance = Math.max(0, track.offsetHeight - stage.clientHeight);
    return { start, end: start + distance, distance };
  }
  function revealEnd() {
    const banner = document.querySelector('.promise-strip');
    return geometry().end + (banner ? banner.offsetHeight + Math.min(96, stage.clientHeight * .12) : 0);
  }
  function enabled() {
    return !reduced.matches && !document.hidden &&
      track.querySelector('canvas')?.dataset.ready === 'true' &&
      track.dataset.fallback !== 'true' &&
      !document.documentElement.classList.contains('page-loading') &&
      !document.body.classList.contains('dialog-open') &&
      !document.querySelector('.site-menu[open]');
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0; destination = null; writtenY = null; remainder = 0; settledY = null;
    nativeUntil = 0; nativeQuietUntil = 0;
  }
  function settle() {
    // Keep fractional input between events instead of rounding gentle gestures away.
    const rest = destination - scrollY;
    stop(); remainder = rest; settledY = scrollY;
  }
  function remember(delta, native = false) { earlySwipe = delta > 0 ? 1 : 0; earlyNative = !!earlySwipe && native; track.dataset.queuedSwipe = String(earlySwipe); }
  function reset() { stop(); touch = null; remember(0); }
  function nearHero() {
    const { start } = geometry();
    return scrollY >= start - 2 && scrollY <= start + stage.clientHeight * .45;
  }
  function activateReadyHero() {
    if (!enabled() || touch) return;
    const atTop = Math.abs(scrollY - geometry().start) <= 2;
    if (track.dataset.pending === 'true') {
      // Do not insert a tall scroll track beneath someone already browsing products.
      if (!atTop && !(earlySwipe && nearHero())) return;
      delete track.dataset.pending;
      document.dispatchEvent(new Event('seamoss:stage-ready'));
    }
    if (earlySwipe && nearHero()) { const native = earlyNative; remember(0); return play(1, native); }
    return false;
  }
  function nativeTarget(node) {
    if (!(node instanceof Element)) return true;
    if (node.closest('input,textarea,select,button,a,[contenteditable],dialog,nav')) return true;
    for (let el = node; el && el !== document.body; el = el.parentElement) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) return true;
    }
    return false;
  }
  function advance(now) {
    frame = 0;
    if (destination === null || !enabled()) { stop(); return; }
    // An uncaptured touch can keep scrolling after release. Allow only forward
    // movement near the hero, with 100ms of quiet and a total 1.2s handoff limit.
    if (nativeUntil && now >= nativeUntil) {
      if (now < nativeQuietUntil) { stop(); return; }
      nativeUntil = 0;
    }
    if (writtenY !== null && Math.abs(scrollY - writtenY) > 2) {
      if (nativeUntil && nearHero() && scrollY > writtenY) {
        writtenY = scrollY; nativeQuietUntil = now + 100;
      } else { stop(); return; }
    }
    if (nativeUntil && now < nativeQuietUntil) {
      previous = now; frame = requestAnimationFrame(advance); return;
    }
    const { start, end, distance } = geometry();
    const dt = Math.min(40, Math.max(0, now - previous)); previous = now;
    const gap = destination - scrollY;
    const direction = Math.sign(gap);
    const resistance = direction > 0 ? finishResistance((scrollY - start) / distance) : 1;
    const maxStep = distance * dt / traverseMs * resistance;
    let step = Math.min(Math.abs(gap), maxStep);
    // Only the portion through the sticky hero is capped; approach space is native speed.
    if (direction > 0 && scrollY < start) step += Math.min(start - scrollY, Math.abs(gap) - step);
    if (direction < 0 && scrollY > end) step += Math.min(scrollY - end, Math.abs(gap) - step);
    if (Math.abs(gap) < .001) { stop(); return; }
    window.scrollTo({ top: scrollY + direction * step, behavior: 'instant' });
    writtenY = scrollY;
    if (Math.abs(destination - scrollY) < 1) { settle(); return; }
    frame = requestAnimationFrame(advance);
  }
  function play(delta, native = false) {
    cancelIdle();
    const { start, end, distance } = geometry();
    if (!distance) return false;
    const y = scrollY;
    const intersects = delta > 0 ? y < end && y + delta >= start : y > start && y + delta <= end;
    if (destination === null && !intersects) return false;
    // A reversal replaces outstanding momentum immediately.
    if (destination === null) destination = y + (y === settledY ? remainder : 0);
    else if (Math.sign(destination - y) !== Math.sign(delta)) destination = y;
    remainder = 0; settledY = null;
    // Finish the reveal, then carry the banner fully into view beneath the jar.
    destination = delta > 0 ? revealEnd() : start;
    nativeUntil = native ? performance.now() + 1200 : 0;
    nativeQuietUntil = native ? performance.now() + 100 : 0;
    if (!frame) { previous = performance.now(); writtenY = y; frame = requestAnimationFrame(advance); }
    return true;
  }
  function queue(delta, event) {
    if (!delta || !event.cancelable) return false;
    if (nativeTarget(event.target)) { reset(); return false; }
    if (!enabled() || track.dataset.pending === 'true') {
      if (!reduced.matches && !document.hidden && track.dataset.fallback !== 'true' && nearHero()) remember(delta);
      if (activateReadyHero()) { event.preventDefault(); return true; }
      // While assets load, allow normal page scrolling and all navigation.
      return false;
    }
    if (!play(delta)) return false;
    event.preventDefault();
    return true;
  }
  addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) { reset(); return; }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1;
    queue(event.deltaY * unit, event);
  }, { passive: false });
  addEventListener('touchstart', event => {
    reset();
    if (event.touches.length !== 1 || reduced.matches || document.hidden || nativeTarget(event.target)) return;
    const p = event.touches[0];
    touch = { id: p.identifier, x: p.clientX, y: p.clientY, startX: p.clientX, startY: p.clientY, extremeY: p.clientY, direction: 0, controlled: false, vertical: false };
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (!touch || event.touches.length !== 1) { reset(); return; }
    const p = event.touches[0];
    if (p.identifier !== touch.id) { reset(); return; }
    const delta = touch.y - p.clientY, dx = touch.x - p.clientX;
    if (!touch.vertical) {
      if (Math.max(Math.abs(dx), Math.abs(delta)) < 6) return;
      if (Math.abs(dx) > Math.abs(delta)) { reset(); return; }
      touch.vertical = true;
    }
    // Ignore tiny finger recoil when lifting off. A deliberate 12px reversal still wins.
    let intent = delta;
    if (touch.controlled && Math.sign(delta) !== touch.direction) {
      if (Math.abs(p.clientY - touch.extremeY) < 12) {
        if (event.cancelable) event.preventDefault();
        touch.x = p.clientX; touch.y = p.clientY;
        return;
      }
      intent = touch.direction * -12;
    }
    const handled = queue(intent, event);
    if (handled) {
      const direction = Math.sign(intent);
      touch.extremeY = direction !== touch.direction ? p.clientY
        : direction > 0 ? Math.min(touch.extremeY, p.clientY) : Math.max(touch.extremeY, p.clientY);
      touch.direction = direction;
    }
    touch.x = p.clientX; touch.y = p.clientY;
    touch.controlled = touch.controlled || handled;
  }, { passive: false });
  addEventListener('touchend', event => {
    if (!touch) { playIdle(); return; }
    const gesture = touch; touch = null;
    if (event.touches.length) { reset(); return; }
    if (gesture.controlled) { activateReadyHero(); return; }
    // Very quick flicks can arrive at touchend without an intermediate touchmove.
    const p = [...event.changedTouches].find(point => point.identifier === gesture.id);
    if (!p) return;
    const delta = gesture.startY - p.clientY, dx = gesture.startX - p.clientX;
    if (Math.abs(delta) >= 8 && Math.abs(delta) > Math.abs(dx)) {
      const captured = queue(delta, event);
      // Safari may have already committed this gesture to native scrolling.
      // Honour the upward swipe after release without cancelling native movement.
      if (!captured && delta > 0 && nearHero() && !nativeTarget(event.target) &&
          !reduced.matches && !document.hidden && track.dataset.fallback !== 'true') remember(delta, true);
    }
    activateReadyHero();
    playIdle();
  }, { passive: false });
  addEventListener('touchcancel', ()=>{reset();playIdle();}, { passive: true });
  addEventListener('pointerdown', stop, { passive: true });
  addEventListener('keydown', ()=>{cancelIdle();reset();}, { passive: true });
  addEventListener('click', event => {
    if (event.target.closest?.('a,button,input,select,textarea')) { cancelIdle(); reset(); }
  }, { passive: true });
  addEventListener('hashchange', ()=>{cancelIdle();reset();}, { passive: true });
  addEventListener('scroll', () => {
    if(destination===null && scrollY>geometry().start+2) cancelIdle();
    if (!nearHero()) remember(0);
    if (track.dataset.pending === 'true' && !earlySwipe) activateReadyHero();
  }, { passive: true });
  document.addEventListener('seamoss:navigation',()=>{cancelIdle();reset();});
  document.addEventListener('seamoss:hero-ready', ()=>{activateReadyHero();playIdle();});
  document.addEventListener('seamoss:ready', ()=>{activateReadyHero();armIdle();playIdle();});
  addEventListener('resize', () => {
    // Safari's browser bars change height during a swipe. Preserve that reveal;
    // rotation or an actual width change still cancels it.
    if (innerWidth !== viewportWidth) { viewportWidth = innerWidth; reset(); return; }
    if (destination !== null) {
      destination = destination > scrollY ? revealEnd() : geometry().start;
      writtenY = scrollY;
    }
  }, { passive: true });
  addEventListener('pageshow', event => { if (event.persisted) {cancelIdle();reset();} }, { passive: true });
  reduced.addEventListener('change', ()=>{cancelIdle();reset();});
  document.addEventListener('visibilitychange', ()=>{cancelIdle();reset();});
  activateReadyHero();
  armIdle();
})();
