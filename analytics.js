(() => {
  const id = 'G-3H6RGGXJ5K';
  const key = 'seamoss-analytics-consent-v1';
  const banner = document.querySelector('.analytics-consent');
  const settings = document.querySelector('[data-analytics-settings]');
  if (!banner || !settings) return;
  let loaded = false;
  const read = () => { try { const v = JSON.parse(localStorage.getItem(key)); return v && Date.now() < v.expires ? v.choice : null; } catch { return null; } };
  function start() {
    if (loaded) return;
    loaded = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('consent', 'default', {analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    gtag('js', new Date());
    gtag('config', id, {allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin + location.pathname});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.append(script);
  }
  function choose(choice) {
    let saved = false;
    try { localStorage.setItem(key, JSON.stringify({choice,expires:Date.now()+180*86400000})); saved = true; } catch {}
    banner.hidden = true;
    settings.focus({preventScroll:true});
    if (choice === 'accepted') start();
    else {
      window['ga-disable-' + id] = true;
      // Remove first-party Analytics cookies when consent is withdrawn.
      for (const part of document.cookie.split(';')) {
        const name = part.split('=')[0].trim();
        if (!/^_ga(?:_|$)/.test(name)) continue;
        for (const domain of ['', location.hostname, '.superseamoss.co.uk'])
          document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
      }
      if (loaded && saved) location.reload();
    }
  }
  banner.querySelectorAll('[data-analytics-choice]').forEach(button => button.addEventListener('click', () => choose(button.dataset.analyticsChoice)));
  settings.addEventListener('click', () => { banner.hidden = false; banner.querySelector('button').focus({preventScroll:true}); });
  const consent = read();
  banner.hidden = consent !== null;
  if (consent === 'accepted') start();
})();
