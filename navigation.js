(() => {
  const menu = document.querySelector('.site-menu');
  const header = document.querySelector('.site-header');
  const toggle = menu?.querySelector('summary');
  if (!menu || !header || !toggle) return;
  let locked = false;
  let savedY = 0;
  let previousBodyStyles = [];
  let background = [];
  const body = document.body;
  const sync = () => {
    toggle.setAttribute('aria-label', menu.open ? 'Close navigation' : 'Open navigation');
    if (menu.open === locked) return;
    locked = menu.open;
    document.dispatchEvent(new CustomEvent('seamoss:navigation', {detail:{open:locked}}));
    if (locked) {
      savedY = scrollY;
      previousBodyStyles = ['position','top','width'].map(name => [name,body.style.getPropertyValue(name)]);
      body.style.position = 'fixed';
      body.style.top = `-${savedY}px`;
      body.style.width = '100%';
      background = [...body.children].filter(element => element !== header && !['SCRIPT','STYLE'].includes(element.tagName)).map(element => [element,element.inert]);
      background.forEach(([element]) => { element.inert = true; });
      menu.querySelector('.menu-panel').scrollTop = 0;
    } else {
      previousBodyStyles.forEach(([name,value]) => { if (value) body.style.setProperty(name,value); else body.style.removeProperty(name); });
      background.forEach(([element,inert]) => { element.inert = inert; });
      background = [];
      window.scrollTo({top:savedY,behavior:'instant'});
    }
  };
  const close = (restoreFocus = false) => {
    menu.open = false;
    sync();
    if (restoreFocus) toggle.focus({preventScroll:true});
  };
  menu.addEventListener('toggle',sync);
  // Closing before a link's native navigation preserves section anchors.
  header.querySelectorAll('a').forEach(link => link.addEventListener('click',()=>close()));
  document.addEventListener('keydown',event => {
    if (!menu.open) return;
    if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
    if (event.key !== 'Tab') return;
    const targets = [...header.querySelectorAll('a[href],summary')].filter(element => element.getClientRects().length);
    const first = targets[0], last = targets[targets.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  // Do not restore a locked menu when returning through Safari's page cache.
  addEventListener('pagehide',()=>close());
  addEventListener('pageshow',event=>{if(event.persisted && (menu.open || locked))close();});
  sync();
})();
