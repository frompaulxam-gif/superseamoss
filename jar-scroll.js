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
  if (!canvas || !stage || !intro || !source || !place) { loading?.ready(); return; }
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)},ease=n=>1-(1-clamp(n))**3,range=(p,a,b)=>clamp((p-a)/(b-a)),mix=(a,b,t)=>a+(b-a)*t;
  let assets={},ready=false,target=0,current=0,previous=performance.now(),floating=true,bob=0,visible=true,failed=false,request=0;
  // Composition and reveal curves are retained from the approved layered prototype.
// Read alpha bounds so each whole generated object fits its intended box, including root tips.
function bounds(image){const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0);const rgba=x.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let q=0;q<c.width;q++){if(rgba[(y*c.width+q)*4+3]>10){x0=Math.min(x0,q);x1=Math.max(x1,q);y0=Math.min(y0,y);y1=Math.max(y1,y)}}return[x0,y0,x1-x0+1,y1-y0+1]}
function image(name,x,y,w,h,rotation=0,mirror=false){const a=assets[name];ctx.save();ctx.translate(x,y);ctx.rotate(rotation*Math.PI/180);if(mirror)ctx.scale(-1,1);ctx.drawImage(a.image,...a.bounds,-w/2,-h/2,w,h);ctx.restore()}
function fit(name,width){const b=assets[name].bounds;return width*b[3]/b[2]}
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
    target=reduced.matches?1:clamp(-track.getBoundingClientRect().top/Math.max(1,track.offsetHeight-stage.clientHeight));
    if (reduced.matches) { current=target; bob=0; }
    wake();
  }
  function tick(now) {
    request=0;
    if (!ready || failed || !visible || document.hidden) return;
    const dt=Math.min(64,now-previous); previous=now;
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
    art.querySelector('.jar-poster').src='assets/hero-layered/open.png';
    copy(intro,0); copy(source,1); copy(place,1);
    loading?.ready();
  }
  if (!ctx) { fallback(); return; }
  addEventListener('scroll',measure,{passive:true});
  addEventListener('resize',measure);
  document.addEventListener('seamoss:ready',measure);
  reduced.addEventListener('change',measure);
  document.addEventListener('visibilitychange',wake);
  document.addEventListener('seamoss:motion',event=>{floating=!event.detail.paused;wake();});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake();}).observe(track);
  }
  let loaded=0;
  Promise.all(['gel','honey','lemon','maca','ginseng','jar','lid'].map(async name=>{
    const img=new Image(); img.decoding='async';
    img.src='assets/hero-layered/'+(name==='lid'?'lid-wet.webp':name+'.png');
    await img.decode();
    assets[name]={image:img,bounds:bounds(img)};
    loading?.progress(++loaded,7);
  })).then(()=>{
    ready=true; current=reduced.matches?1:target;
    draw(current,performance.now());
    art.dataset.frameReady='true'; canvas.dataset.ready='true';
    loading?.ready(); measure();
  }).catch(fallback);
  measure();
})();
