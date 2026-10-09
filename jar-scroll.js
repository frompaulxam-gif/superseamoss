(() => {
  const track = document.querySelector('.seamoss-hero-track');
  const stage = track?.querySelector('.seamoss-hero');
  const art = track?.querySelector('.seamoss-hero-art');
  const canvas = art?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  const intro = track?.querySelector('.seamoss-hero-intro');
  const source = track?.querySelector('.seamoss-hero-source');
  const place = track?.querySelector('.seamoss-hero-location');
  const loading = window.seamossLoading;
  if (!canvas || !stage || !intro || !source || !place) {
    if(track) { delete track.dataset.pending; track.dataset.fallback='true'; }
    loading?.ready(); return;
  }
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)},ease=n=>1-(1-clamp(n))**3,range=(p,a,b)=>clamp((p-a)/(b-a)),mix=(a,b,t)=>a+(b-a)*t;
  let assets={},ready=false,target=0,current=0,previous=performance.now(),floating=true,bob=0,visible=true,failed=false,request=0;
  // Composition and reveal curves are retained from the approved layered prototype.
// Precomputed crop bounds avoid seven large pixel scans on mobile startup.
const assetSpecs={"gel":{"full":{"file":"gel.webp","size":[1254,1254],"bounds":[23,27,1223,1172]},"mobile":{"file":"gel-mobile.webp","size":[640,640],"bounds":[11,13,625,599]}},"honey":{"full":{"file":"honey.webp","size":[1254,1254],"bounds":[94,273,1069,756]},"mobile":{"file":"honey-mobile.webp","size":[640,640],"bounds":[48,139,546,386]}},"lemon":{"full":{"file":"lemon.webp","size":[1254,1254],"bounds":[224,205,854,851]},"mobile":{"file":"lemon-mobile.webp","size":[640,640],"bounds":[114,104,436,435]}},"maca":{"full":{"file":"maca.webp","size":[1254,1254],"bounds":[167,143,966,961]},"mobile":{"file":"maca-mobile.webp","size":[640,640],"bounds":[85,73,494,491]}},"ginseng":{"full":{"file":"ginseng.webp","size":[1254,1254],"bounds":[176,81,962,1103]},"mobile":{"file":"ginseng-mobile.webp","size":[640,640],"bounds":[90,41,491,564]}},"jar":{"full":{"file":"jar.webp","size":[1122,1402],"bounds":[205,337,710,785]},"mobile":{"file":"jar-mobile.webp","size":[640,800],"bounds":[116,192,406,449]}},"lid":{"full":{"file":"lid-wet.webp","size":[768,768],"bounds":[53,28,661,231]},"mobile":{"file":"lid-wet-mobile.webp","size":[640,640],"bounds":[44,23,551,193]}}};
const variant=matchMedia("(max-width:768px)").matches?"mobile":"full";
function image(name,x,y,w,h,rotation=0,mirror=false){const a=assets[name];if(!a)return;ctx.save();ctx.translate(x,y);ctx.rotate(rotation*Math.PI/180);if(mirror)ctx.scale(-1,1);ctx.drawImage(a.image,...a.bounds,-w/2,-h/2,w,h);ctx.restore()}
function fit(name,width){const b=assetSpecs[name][variant].bounds;return width*b[3]/b[2]}
function copy(el,opacity){el.style.opacity=opacity;el.setAttribute('aria-hidden',String(opacity<.01))}
function draw(p,now){if(!ready)return;const reveal=ease(range(p,.23,.76)),lid=ease(range(p,.06,.43)),floatAmount=reduced.matches||!floating?0:smooth(range(p,.73,.84));bob=reduced.matches?0:bob+(floatAmount-bob)*.07;const clock=now/1000;
ctx.clearRect(0,0,900,900);
const jarY=560+Math.sin(clock*.85)*3*bob;
// The ring begins inside the jar silhouette and unfolds behind it. No border masks or colour key.
image('gel',450,mix(570,495,reveal)+Math.sin(clock*.7+.5)*3*bob,mix(85,700,reveal),mix(90,735,reveal),Math.sin(clock*.5)*.45*bob);
const ingredients=[['honey',370,250,290,.30,.70,-2,0],['lemon',155,365,155,.34,.73,-5,1],['maca',740,365,165,.38,.75,5,2],['ginseng',165,695,170,.40,.77,-5,3],['ginseng',735,695,170,.43,.78,5,4]];
for(const [name,x,y,w,start,end,rot,i]of ingredients){const t=ease(range(p,start,end)),width=w*mix(.52,1,t),sway=bob*Math.sin(clock*(.72+i*.05)+i*1.6);image(name,mix(450,x,t)+sway*4,mix(570,y,t)+Math.sin(clock*(.85+i*.04)+i)*7*bob,width,fit(name,width),rot*t+sway*.9,i===4)}
// Jar sits in front of the ingredients, matching the Pick your blends reveal.
image('jar',450,jarY,390,fit('jar',390));
const arc=Math.sin(lid*Math.PI);image('lid',mix(450,220,lid),mix(380,145,lid)-arc*24+Math.sin(clock*.8+2)*3*bob,mix(390,285,lid),fit('lid',mix(390,285,lid)),-18*lid+2*Math.sin(range(p,.06,.20)*Math.PI));
const index=Math.round(clamp(p/.78)*80);canvas.dataset.frame=index;canvas.dataset.progress=p.toFixed(4);canvas.dataset.float=bob.toFixed(4);
copy(intro,reduced.matches?0:1-smooth(range(p,.10,.31)));copy(source,reduced.matches?1:smooth(range(p,.79,.85)));copy(place,reduced.matches?1:smooth(range(p,.85,.90)));track.dataset.progress=p.toFixed(4);
}

  function measure() {
    target=reduced.matches?1:track.dataset.pending==='true'?0:clamp(-track.getBoundingClientRect().top/Math.max(1,track.offsetHeight-stage.clientHeight));
    if (reduced.matches) { current=target; bob=0; }
    wake();
  }
  function tick(now) {
    request=0;
    if (!ready || failed || !visible || document.hidden) return;
    const dt=Math.max(0,Math.min(64,now-previous)); previous=now;
    current+=(target-current)*(1-Math.exp(-dt/75));
    if(Math.abs(target-current)<.0001) current=target;
    draw(current,now);
    const moving=Math.abs(target-current)>.0001;
    const floatActive=!reduced.matches && floating && current>.73;
    if(moving || floatActive || bob>.0001) request=requestAnimationFrame(tick);
  }
  function wake() {
    if (!request && ready && !failed && visible && !document.hidden) {
      previous=performance.now(); request=requestAnimationFrame(tick);
    }
  }
  function fallback() {
    if (failed) return;
    failed=true; track.dataset.fallback='true';
    canvas.hidden=true;
    // Keep the already requested poster if an asset fails; never block the page.
    delete track.dataset.pending;
    copy(intro,reduced.matches?0:1); copy(source,reduced.matches?1:0); copy(place,reduced.matches?1:0);
    loading?.ready();
  }
  // Semantic visibility must not depend on successful image downloads.
  copy(intro,reduced.matches?0:1); copy(source,reduced.matches?1:0); copy(place,reduced.matches?1:0);
  if (!ctx) { fallback(); return; }
  addEventListener('scroll',measure,{passive:true});
  addEventListener('resize',measure);
  document.addEventListener('seamoss:ready',measure);
  document.addEventListener('seamoss:stage-ready',measure);
  reduced.addEventListener('change',()=>{
    if(!ready) { copy(intro,reduced.matches?0:1); copy(source,reduced.matches?1:0); copy(place,reduced.matches?1:0); }
    measure();
  });
  document.addEventListener('visibilitychange',wake);
  document.addEventListener('seamoss:motion',event=>{floating=!event.detail.paused;wake();});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake();}).observe(track);
  }
  const assetDeadline = setTimeout(()=>{if(!ready)fallback();}, 30000);
  const attempts={}, pending=new Set(), retries=new Map();
  const retryDelays=[1000,3000,8000];
  let loaded=0;
  function enable() {
    if(ready || !assets.jar || !assets.lid) return;
    clearTimeout(assetDeadline);
    if(failed) { failed=false; delete track.dataset.fallback; track.dataset.pending='true'; canvas.hidden=false; }
    ready=true; current=reduced.matches?1:target;
    draw(current,performance.now());
    art.dataset.frameReady='true'; canvas.dataset.ready='true';
    loading?.ready(); measure();
  }
  async function load(name) {
    if(assets[name] || pending.has(name)) return;
    pending.add(name);
    const spec=assetSpecs[name][variant], essential=name==='jar'||name==='lid';
    const img=new Image(); img.decoding='async'; img.fetchPriority=essential?'high':'low';
    // The mobile jar is embedded in the document, so a lost image request
    // cannot remove both the animation and its static fallback.
    const embedded=essential&&variant==='mobile' ? art.querySelector('[data-hero-asset="'+name+'"]')?.getAttribute('href') : null;
    img.src=embedded || 'assets/hero-layered/'+spec.file;
    attempts[name]=(attempts[name]||0)+1;
    try {
      await img.decode();
      assets[name]={image:img,bounds:spec.bounds};
      loading?.progress(++loaded,7);
      track.dataset.assetsLoaded=String(loaded);
      enable(); wake();
    } catch {
      if(essential&&!ready)fallback();
      const delay=retryDelays[attempts[name]-1];
      if(delay!==undefined) retries.set(name,setTimeout(()=>{retries.delete(name);load(name);},delay));
    } finally { pending.delete(name); }
  }
  function recover() {
    for(const name of Object.keys(assetSpecs)) {
      if(assets[name]||pending.has(name))continue;
      clearTimeout(retries.get(name));retries.delete(name);attempts[name]=0;load(name);
    }
  }
  addEventListener('online',recover,{passive:true});
  // Also recover the decorative backdrop without gating the usable page.
  const backdrop=track.querySelector('.seamoss-hero-backdrop img');
  if(backdrop) {
    let tries=0,timer,inFlight=false;
    const retryBackdrop=()=>{
      if(inFlight || backdrop.complete&&backdrop.naturalWidth)return;
      clearTimeout(timer);
      inFlight=true;
      const probe=new Image();probe.decoding='async';probe.src=backdrop.getAttribute('src');
      probe.decode().then(()=>{backdrop.src=probe.src;},()=>{if(tries<retryDelays.length)timer=setTimeout(retryBackdrop,retryDelays[tries++]);}).finally(()=>{inFlight=false;});
    };
    backdrop.addEventListener('error',retryBackdrop);
    if(backdrop.complete&&!backdrop.naturalWidth)retryBackdrop();
    addEventListener('online',()=>{tries=0;retryBackdrop();},{passive:true});
  }
  Object.keys(assetSpecs).forEach(load);
  measure();
})();
