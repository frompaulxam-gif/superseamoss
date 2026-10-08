(() => {
  const products = [
  {
    "id": "manuka-glow",
    "name": "Manuka Glow",
    "short": "Manuka Honey, Lemon, Maca & Ginseng.",
    "description": "Created with glow & radiance in mind. A Seamoss blend with the sweetness of manuka honey, fresh lemon juice, maca root and ginseng.",
    "ingredients": [
      "Manuka Honey",
      "Fresh Lemon Juice",
      "Maca Root",
      "Ginseng"
    ],
    "note": "Contains honey. This blend is not vegan.",
    "post": "DSY2OQHCKgN",
    "purpose": "Glow & Radiance"
  },
  {
    "id": "king-strength",
    "name": "King Strength",
    "short": "Mango, Shilajit, Reishi & Tongkat Ali.",
    "description": "Created with energy & stamina in mind. Seamoss and mango meet shilajit, reishi and tongkat ali in King Strength.",
    "ingredients": [
      "Seamoss",
      "Shilajit",
      "Reishi",
      "Tongkat Ali",
      "Mango"
    ],
    "note": "",
    "post": "DSY0qLLiOgy",
    "purpose": "Energy & Stamina"
  },
  {
    "id": "power-up",
    "name": "Power Up",
    "short": "Goji Berry, Beetroot, Ginseng & Lion’s Mane.",
    "description": "Created with energy & focus in mind. A Seamoss blend bringing together goji berry, ginseng, beetroot, cinnamon and lion’s mane.",
    "ingredients": [
      "Seamoss",
      "Goji Berry",
      "Ginseng",
      "Beetroot",
      "Cinnamon",
      "Lion’s Mane"
    ],
    "note": "",
    "post": "DSYzpXpiCdF",
    "purpose": "Energy & Focus"
  },
  {
    "id": "rich-clarification",
    "name": "Rich Clarification",
    "short": "Dates, Cinnamon, Lion’s Mane & Black Maca.",
    "description": "Created with focus & clarity in mind. Dates and cinnamon sit alongside lion’s mane and black maca in this Seamoss blend.",
    "ingredients": [
      "Dates",
      "Cinnamon",
      "Lion’s Mane",
      "Black Maca"
    ],
    "note": "The brand advises against consuming this blend during pregnancy.",
    "post": "DSTnyoviFSv",
    "purpose": "Focus & Clarity"
  },
  {
    "id": "all-night-long",
    "name": "All Night Long",
    "short": "Mondia, Damiana, Ginseng & Vanilla.",
    "description": "Created with desire & balance in mind. A Seamoss blend of mondia, damiana, ginseng and vanilla.",
    "ingredients": [
      "Mondia",
      "Damiana",
      "Ginseng",
      "Vanilla"
    ],
    "note": "The brand advises against consuming this blend during pregnancy or if you have heart problems.",
    "post": "DSTjdDvCIza",
    "purpose": "Desire & Balance"
  },
  {
    "id": "gut-health-booster",
    "name": "Golden Ginger",
    "short": "Ginger Stem, Black Ginger, Black Maca & Turmeric.",
    "description": "Golden Ginger brings together ginger stem, black maca, black ginger and turmeric in a Seamoss blend.",
    "ingredients": [
      "Ginger Stem",
      "Black Maca",
      "Black Ginger",
      "Turmeric"
    ],
    "note": "",
    "post": "DSTfE02iL22",
    "purpose": "Ginger & Turmeric"
  }
];
  const body = document.body;
  const menuButton = document.querySelector('.menu-button');
  const navigation = document.querySelector('#main-navigation');
  const productDialog = document.querySelector('.product-dialog');
  const closeMenu=()=> { navigation.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation'); };
  menuButton.addEventListener('click',()=> { const open=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation'); });
  navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=> { if(event.key==='Escape'&&navigation.classList.contains('open')){closeMenu();menuButton.focus();} });
  document.querySelectorAll('[data-product]').forEach(button=>button.addEventListener('click',()=> {
    const product=products.find(item=>item.id===button.dataset.product);
    const image=document.querySelector('#product-dialog-image');const version='?v=wet1';image.src='assets/blends/'+product.id+'-wet.webp'+version;image.srcset='assets/blends/'+product.id+'-wet-768.webp'+version+' 768w, assets/blends/'+product.id+'-wet.webp'+version+' 1536w';image.sizes='(max-width: 700px) calc(100vw - 24px), 46vw';image.alt='Creative ingredient still life for Super Seamoss '+product.name;
    document.querySelector('#product-dialog-title').textContent=product.name;
    document.querySelector('#product-dialog-description').textContent=product.description;
    document.querySelector('#product-dialog-ingredients').replaceChildren(...product.ingredients.map(ingredient=> { const item=document.createElement('li');item.textContent=ingredient;return item; }));
    const note=document.querySelector('#product-dialog-note');note.textContent=product.note;note.hidden=!product.note;
    document.querySelector('#product-dialog-source').href='https://www.instagram.com/super.seamoss/p/'+product.post+'/';
    document.querySelector('#product-dialog-recipes').hidden = product.id !== 'manuka-glow';
    productDialog.showModal();body.classList.add('dialog-open');productDialog.scrollTop=0;
  }));
  productDialog.querySelector('[data-order-blend]').addEventListener('click',()=>productDialog.close());
  productDialog.querySelector('.close-button').addEventListener('click',()=>productDialog.close());
  productDialog.addEventListener('click',event=> { if(event.target!==productDialog)return;const rect=productDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)productDialog.close(); });
  productDialog.addEventListener('close',()=>body.classList.remove('dialog-open'));
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('js-motion');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}}),{threshold:.08});
    document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));
  }
})();

(() => {
  const sourcing = document.querySelector('.hero-sourcing');
  if (!sourcing) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const settle = () => sourcing.classList.remove('is-stamping');
  const beginWhenVisible = () => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (reducedMotion.matches || document.body.classList.contains('paused')) return;
      sourcing.classList.add('is-stamping');
    }, { threshold: .8 });
    observer.observe(sourcing);
  };
  sourcing.addEventListener('animationend', event => {
    if (event.animationName === 'sourcing-impression' && event.target === sourcing.lastElementChild) settle();
  });
  document.addEventListener('seamoss:motion', event => { if (event.detail.paused) settle(); });
  reducedMotion.addEventListener('change', event => { if (event.matches) settle(); });
  if (document.documentElement.classList.contains('page-loading')) {
    document.addEventListener('seamoss:ready', beginWhenVisible, { once: true });
  } else {
    beginWhenVisible();
  }
})();
