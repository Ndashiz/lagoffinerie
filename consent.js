/* =========================================================
   LA GOFFINERIE — consent.js (site v2.40)
   The cookie choice and Google Analytics 4, loaded by every page.
     · GA_ID below is the GA4 measurement id (G-…). Empty → this
       file does nothing: no banner, no link, nothing sent to Google
       (cookies.html then says that Google Analytics is not on).
     · Nothing reaches Google before the visitor clicks « Accept »:
       gtag.js is not even loaded until then (Consent Mode « basic »).
       Refusing, or a Do Not Track / Global Privacy Control signal,
       keeps Google out entirely; the site works the same.
     · The banner asks once. The choice is kept in localStorage
       lg_consent for 6 months, then asked again (or when VERSION
       changes: bump it when the policy adds a tool). It can be changed
       at any time from « Cookie settings », added by this file to
       every footer next to « Cookies », or from any [data-consent-open]
       element (the button of cookies.html).
     · Withdrawing stops Google on the spot (ga-disable + consent
       update) and deletes the _ga / _ga_* cookies.
     · Simon's devices (localhost, lg_crew) send with traffic_type
       « internal » and debug_mode: GA's data filters keep them out of
       the reports, DebugView still shows them.
     · Events: page_view (automatic), cta_click {cta_id} for any
       [data-track], contact_click {method} for tel:, mailto:, wa.me and
       LinkedIn links, and what the pages hand to window.lgGa(name,
       params): generate_lead {lead_source} (contact form sent, estimate
       e-mailed), estimator_open / estimator_result_shown /
       estimator_to_booking {detail}. Before consent lgGa drops them.
   The storage key and the GA cookies are listed on cookies.html; the
   setup on Google's side is in docs/google-analytics.md.
   ========================================================= */
(function(){
  'use strict';
  var GA_ID='';                                         // the GA4 measurement id, e.g. 'G-AB12CD34EF'
  var KEY='lg_consent', VERSION=1, KEEP=183*864e5;      // the choice, asked again after about six months
  var COOKIE_LIFE=390*86400;                            // _ga and _ga_* live 13 months, not Google's default 2 years
  var root=document.documentElement;
  var T={
    en:{ kick:'Cookies', title:'Cookies? Only if you agree.',
         text:'With your agreement, I use <strong>Google Analytics</strong> to see which pages are read and which buttons are useful. It sets cookies and sends your visit to Google. Refusing changes nothing on the site. <a href="/cookies.html">Cookie policy</a>',
         no:'Refuse', yes:'Accept', custom:'Customize',
         p_title:'Cookie settings',
         p_intro:'Choose what this site may store on your device. You can change your mind at any time with « Cookie settings », at the bottom of every page.',
         c1_h:'Strictly necessary', c1_on:'Always on',
         c1_p:'Your language, this choice, the estimator\'s answers for the tab. Kept in your browser, never sent to anyone, and no cookie.',
         c2_h:'Audience measurement · Google Analytics',
         c2_p:'Pages viewed, buttons clicked, the site that sent you, your device and an approximate location (from your IP address, which Google does not keep). Cookies <code>_ga</code> and <code>_ga_…</code>, 13 months. Processed by Google Ireland, possibly in the United States (EU-US Data Privacy Framework). Never used for advertising.',
         p_no:'Refuse all', p_yes:'Accept all', p_save:'Save my choices', p_close:'Close',
         p_pol:'Everything in detail: <a href="/cookies.html">cookie policy</a>.',
         link:'Cookie settings',
         st_off:'Google Analytics is not switched on on this site at the moment: there is nothing to accept or refuse.',
         st_none:'You have not chosen yet: Google Analytics stays off until you accept.',
         st_signal:'Your browser sends a privacy signal (Do Not Track or Global Privacy Control): Google Analytics stays off unless you switch it on yourself.',
         st_yes:'Your choice: Google Analytics <strong>accepted</strong> on {d}.',
         st_no:'Your choice: Google Analytics <strong>refused</strong> on {d}.' },
    fr:{ kick:'Cookies', title:'Des cookies ? Seulement si vous êtes d\'accord.',
         text:'Avec votre accord, j\'utilise <strong>Google Analytics</strong> pour savoir quelles pages sont lues et quels boutons servent. Il dépose des cookies et transmet votre visite à Google. Refuser ne change rien au site. <a href="/fr/cookies.html">Politique cookies</a>',
         no:'Refuser', yes:'Accepter', custom:'Personnaliser',
         p_title:'Gérer les cookies',
         p_intro:'Choisissez ce que ce site peut enregistrer sur votre appareil. Vous pouvez changer d\'avis à tout moment avec « Gérer les cookies », en bas de chaque page.',
         c1_h:'Strictement nécessaires', c1_on:'Toujours actifs',
         c1_p:'Votre langue, ce choix-ci, les réponses de l\'outil d\'estimation pour l\'onglet. Gardés dans votre navigateur, jamais envoyés à personne, et sans cookie.',
         c2_h:'Mesure d\'audience · Google Analytics',
         c2_p:'Pages vues, boutons cliqués, le site qui vous a envoyé ici, votre appareil et une localisation approximative (déduite de votre adresse IP, que Google ne conserve pas). Cookies <code>_ga</code> et <code>_ga_…</code>, 13 mois. Traité par Google Ireland, éventuellement aux États-Unis (cadre de protection des données UE-États-Unis). Jamais utilisé pour la publicité.',
         p_no:'Tout refuser', p_yes:'Tout accepter', p_save:'Enregistrer mes choix', p_close:'Fermer',
         p_pol:'Tout le détail : <a href="/fr/cookies.html">politique relative aux cookies</a>.',
         link:'Gérer les cookies',
         st_off:'Google Analytics n\'est pas activé sur ce site pour le moment : il n\'y a rien à accepter ni à refuser.',
         st_none:'Vous n\'avez pas encore choisi : Google Analytics reste éteint tant que vous n\'acceptez pas.',
         st_signal:'Votre navigateur envoie un signal de confidentialité (Do Not Track ou Global Privacy Control) : Google Analytics reste éteint, sauf si vous l\'activez vous-même.',
         st_yes:'Votre choix : Google Analytics <strong>accepté</strong> le {d}.',
         st_no:'Votre choix : Google Analytics <strong>refusé</strong> le {d}.' }
  };
  function L(){ return root.lang==='fr' ? 'fr' : 'en'; }
  function t(k){ return T[L()][k]; }

  var ON=/^G-[A-Z0-9]{4,}$/.test(GA_ID);
  var started=false;
  /* the pages call it without waiting for this file: a no-op until Google Analytics runs */
  window.lgGa=function(name, params){
    if(!started || window['ga-disable-'+GA_ID]) return;
    try{ window.gtag('event', name, params||{}); }catch(e){}
  };

  if(!ON || !document.body){
    /* nothing to choose: cookies.html says so, and its button has no reason to be there */
    var paintOff=function(){
      [].forEach.call(document.querySelectorAll('[data-consent-status]'), function(el){ el.innerHTML=t('st_off'); });
      [].forEach.call(document.querySelectorAll('[data-consent-open]'), function(el){ el.hidden=true; });
    };
    paintOff();
    if(window.MutationObserver) new MutationObserver(paintOff).observe(root, {attributes:true, attributeFilter:['lang']});
    return;
  }

  var SIGNAL=navigator.doNotTrack==='1' || navigator.globalPrivacyControl===true;
  var MEM=null;                                         // the choice of this page, when storage is blocked
  function read(){
    try{
      var c=JSON.parse(localStorage.getItem(KEY)||'null');
      if(c && c.v===VERSION && typeof c.a==='boolean' && typeof c.t==='number' && Date.now()-c.t < KEEP) return c;
    }catch(e){}
    return MEM;
  }
  function crew(){
    if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return true;
    try{ return localStorage.getItem('lg_crew')==='1'; }catch(e){ return false; }
  }

  /* ---------- Google Analytics: loaded on « Accept », never before ---------- */
  function startGa(){
    window['ga-disable-'+GA_ID]=false;
    if(started){ window.gtag('consent', 'update', {analytics_storage:'granted'}); return; }
    started=true;
    window.dataLayer=window.dataLayer || [];
    window.gtag=window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    window.gtag('js', new Date());
    var cfg={ allow_google_signals:false, allow_ad_personalization_signals:false,
              cookie_expires:COOKIE_LIFE, cookie_flags:'SameSite=Lax'+(location.protocol==='https:' ? ';Secure' : '') };
    if(crew()){ cfg.traffic_type='internal'; cfg.debug_mode=true; }
    window.gtag('config', GA_ID, cfg);
    var s=document.createElement('script');
    s.async=true; s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }
  function stopGa(){
    window['ga-disable-'+GA_ID]=true;
    if(started) window.gtag('consent', 'update', {analytics_storage:'denied'});
    /* GA writes on the registrable domain (.lagoffinerie.be): try the host and each of its parents */
    var names=document.cookie.split(';').map(function(c){ return c.split('=')[0].trim(); })
      .filter(function(n){ return n==='_ga' || n.indexOf('_ga_')===0; });
    if(!names.length) return;
    var parts=location.hostname.split('.'), domains=[''];
    for(var i=0;i<parts.length-1;i++) domains.push('.'+parts.slice(i).join('.'));
    names.forEach(function(n){ domains.forEach(function(d){ document.cookie=n+'=; Max-Age=0; path=/'+(d ? '; domain='+d : ''); }); });
  }

  function choose(a){
    var c={v:VERSION, a:!!a, t:Date.now()};
    MEM=c;
    try{ localStorage.setItem(KEY, JSON.stringify(c)); }catch(e){}
    hideBanner(); closePanel();
    if(c.a) startGa(); else stopGa();
    paint();
  }

  /* ---------- the look: the site's card, its blue buttons, refuse and accept alike ---------- */
  var CSS=''
    +'.lg-cc,.lg-cc *,.lg-ccp,.lg-ccp *{box-sizing:border-box;}'
    +'.lg-cc{position:fixed;left:24px;bottom:24px;z-index:140;width:410px;max-width:calc(100vw - 48px);background:#fff;color:#151515;border:2px solid #151515;border-radius:18px;box-shadow:6px 6px 0 #EDAF2F;padding:20px 22px 14px;font-family:"Instrument Sans",system-ui,sans-serif;line-height:1.5;text-align:left;animation:lgCcIn .35s cubic-bezier(.2,.8,.2,1) both;}'
    +'.lg-cc-kick{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#3d4046;}'
    +'.lg-cc-kick::before{content:"";width:22px;height:2px;background:#E2452C;}'
    +'.lg-cc h2,.lg-ccp h2{margin:0 0 8px;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:18px;line-height:1.25;letter-spacing:-.01em;color:#151515;}'
    +'.lg-cc p{margin:0;font-size:14.5px;color:#3d4046;}'
    +'.lg-cc a,.lg-ccp a{color:#151515;font-weight:600;text-decoration:underline;text-decoration-color:#2823EE;text-decoration-thickness:2px;text-underline-offset:3px;}'
    +'.lg-cc-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;}'
    +'.lg-cc-btn{font-family:"Sora",system-ui,sans-serif;font-weight:600;font-size:15px;line-height:1.2;border-radius:10px;padding:13px 14px;border:1px solid #2823EE;background:#2823EE;color:#fff;cursor:pointer;box-shadow:0 1px 2px rgba(21,21,21,.2),0 10px 24px -10px rgba(40,35,238,.65);transition:transform .15s ease,background-color .2s ease,border-color .2s ease;}'
    +'.lg-cc-btn:hover{transform:translateY(-1px);background:#1d19d8;border-color:#1d19d8;}'
    +'.lg-cc-btn:active{transform:none;}'
    +'.lg-cc-more{display:block;margin:10px auto 0;padding:4px 8px;background:none;border:0;font-family:"Sora",system-ui,sans-serif;font-weight:600;font-size:13.5px;color:#3d4046;text-decoration:underline;text-underline-offset:3px;cursor:pointer;}'
    +'.lg-cc-more:hover{color:#151515;}'
    +'.lg-cc button:focus-visible,.lg-ccp button:focus-visible,.lg-cc a:focus-visible,.lg-ccp a:focus-visible{outline:3px solid #EDAF2F;outline-offset:2px;}'
    +'@keyframes lgCcIn{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}'
    +'html.lg-ccp-on{overflow:hidden;}'
    +'.lg-ccp{position:fixed;inset:0;z-index:230;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;overscroll-behavior:contain;background:rgba(21,21,21,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);font-family:"Instrument Sans",system-ui,sans-serif;color:#151515;line-height:1.5;text-align:left;}'
    +'.lg-ccp[hidden]{display:none;}'
    +'.lg-ccp-card{position:relative;width:100%;max-width:560px;margin:auto;background:#faf8f2;border:2px solid #151515;border-radius:20px;box-shadow:8px 8px 0 #2823EE;padding:26px 26px 20px;animation:lgCcIn .3s cubic-bezier(.2,.8,.2,1) both;}'
    +'.lg-ccp h2{font-size:24px;padding-right:44px;}'
    +'.lg-ccp-intro{margin:0 0 14px;font-size:15px;color:#3d4046;}'
    +'.lg-ccp-cat{margin-top:10px;padding:14px 16px;background:#fff;border:1.5px solid rgba(21,21,21,.16);border-radius:14px;}'
    +'.lg-ccp-head{display:flex;align-items:center;justify-content:space-between;gap:14px;}'
    +'.lg-ccp h3{margin:0;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:15.5px;line-height:1.3;}'
    +'.lg-ccp-cat p{margin:6px 0 0;font-size:13.5px;color:#3d4046;}'
    +'.lg-ccp code{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;background:#f3f0e6;border-radius:5px;padding:1px 5px;color:#151515;}'
    +'.lg-ccp-always{flex:none;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#2823EE;white-space:nowrap;}'
    +'.lg-sw{position:relative;flex:none;width:48px;height:28px;}'
    +'.lg-sw input{position:absolute;inset:0;z-index:1;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;}'
    +'.lg-sw span{position:absolute;inset:0;border-radius:999px;background:#d9d5c8;border:1.5px solid #151515;transition:background-color .2s ease;}'
    +'.lg-sw span::after{content:"";position:absolute;top:1.5px;left:1.5px;width:22px;height:22px;border-radius:50%;background:#fff;border:1.5px solid #151515;transition:transform .2s ease;}'
    +'.lg-sw input:checked + span{background:#2823EE;}'
    +'.lg-sw input:checked + span::after{transform:translateX(20px);}'
    +'.lg-sw input:focus-visible + span{outline:3px solid #EDAF2F;outline-offset:2px;}'
    +'.lg-ccp-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;}'
    +'.lg-ccp-save{display:block;width:100%;margin-top:10px;padding:12px 14px;border-radius:10px;border:2px solid #2823EE;background:#fff;color:#2823EE;font-family:"Sora",system-ui,sans-serif;font-weight:600;font-size:15px;line-height:1.2;cursor:pointer;transition:background-color .2s ease;}'
    +'.lg-ccp-save:hover{background:#eeedfd;}'
    +'.lg-ccp-x{position:absolute;top:16px;right:16px;width:36px;height:36px;padding:0;border-radius:50%;border:1.5px solid #151515;background:#fff;color:#151515;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:18px;line-height:1;cursor:pointer;}'
    +'.lg-ccp-pol{margin:14px 0 0;font-size:13px;color:#3d4046;text-align:center;}'
    +'@media(max-width:560px){'
    +  '.lg-cc{left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));width:auto;max-width:none;padding:18px 18px 12px;box-shadow:4px 4px 0 #EDAF2F;}'
    +  '.lg-cc p{font-size:14px;}'
    +  '.lg-ccp{padding:12px;align-items:flex-end;}'
    +  '.lg-ccp-card{padding:22px 18px 16px;border-radius:18px;box-shadow:5px 5px 0 #2823EE;}'
    +  '.lg-ccp h2{font-size:21px;}'
    +'}'
    +'@media(prefers-reduced-motion:reduce){.lg-cc,.lg-ccp-card{animation:none;}.lg-cc-btn,.lg-sw span,.lg-sw span::after{transition:none;}}'
    +'@media print{.lg-cc,.lg-ccp{display:none!important;}}';
  var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);

  /* every text carries data-cct="key" and is (re)written in the page's language by paint() */
  function el(tag, cls, key, attrs){
    var e=document.createElement(tag);
    if(cls) e.className=cls;
    if(key) e.setAttribute('data-cct', key);
    for(var a in (attrs||{})) e.setAttribute(a, attrs[a]);
    return e;
  }

  /* ---------- the banner: asks once, never blocks the page ---------- */
  var banner=null;
  function showBanner(){
    if(banner){ banner.hidden=false; return; }
    banner=el('section', 'lg-cc', null, {'aria-labelledby':'lg-cc-t'});
    banner.appendChild(el('div', 'lg-cc-kick', 'kick'));
    banner.appendChild(el('h2', '', 'title', {id:'lg-cc-t'}));
    banner.appendChild(el('p', '', 'text'));
    var row=el('div', 'lg-cc-row');
    row.appendChild(el('button', 'lg-cc-btn', 'no', {type:'button', 'data-cc':'no', 'data-track':'consent_refuse'}));
    row.appendChild(el('button', 'lg-cc-btn', 'yes', {type:'button', 'data-cc':'yes', 'data-track':'consent_accept'}));
    banner.appendChild(row);
    banner.appendChild(el('button', 'lg-cc-more', 'custom', {type:'button', 'data-cc':'custom', 'data-track':'consent_custom'}));
    banner.addEventListener('click', function(e){
      var b=e.target.closest('[data-cc]'); if(!b) return;
      var k=b.getAttribute('data-cc');
      if(k==='custom') openPanel(b); else choose(k==='yes');
    });
    document.body.insertBefore(banner, document.body.firstChild);   // first in the tab order
    paint();
  }
  function hideBanner(){ if(banner) banner.hidden=true; }

  /* ---------- the panel: the two categories, the switch, refuse / accept / save ---------- */
  var panel=null, sw=null, lastFocus=null;
  function buildPanel(){
    panel=el('div', 'lg-ccp', null, {role:'dialog', 'aria-modal':'true', 'aria-labelledby':'lg-ccp-t'});
    panel.hidden=true;
    var card=el('div', 'lg-ccp-card');
    var x=el('button', 'lg-ccp-x', null, {type:'button', 'data-cc':'close'}); x.textContent='×'; x.setAttribute('data-cct-label', 'p_close');
    card.appendChild(x);
    card.appendChild(el('div', 'lg-cc-kick', 'kick'));
    card.appendChild(el('h2', '', 'p_title', {id:'lg-ccp-t'}));
    card.appendChild(el('p', 'lg-ccp-intro', 'p_intro'));
    var c1=el('div', 'lg-ccp-cat'), h1=el('div', 'lg-ccp-head');
    h1.appendChild(el('h3', '', 'c1_h')); h1.appendChild(el('span', 'lg-ccp-always', 'c1_on'));
    c1.appendChild(h1); c1.appendChild(el('p', '', 'c1_p'));
    var c2=el('div', 'lg-ccp-cat'), h2=el('div', 'lg-ccp-head'), lab=el('label', 'lg-sw');
    h2.appendChild(el('h3', '', 'c2_h', {id:'lg-ccp-ga'}));
    sw=el('input', '', null, {type:'checkbox', role:'switch', 'aria-labelledby':'lg-ccp-ga'});
    lab.appendChild(sw); lab.appendChild(el('span'));
    h2.appendChild(lab);
    c2.appendChild(h2); c2.appendChild(el('p', '', 'c2_p'));
    card.appendChild(c1); card.appendChild(c2);
    var row=el('div', 'lg-ccp-row');
    row.appendChild(el('button', 'lg-cc-btn', 'p_no', {type:'button', 'data-cc':'no', 'data-track':'consent_refuse'}));
    row.appendChild(el('button', 'lg-cc-btn', 'p_yes', {type:'button', 'data-cc':'yes', 'data-track':'consent_accept'}));
    card.appendChild(row);
    card.appendChild(el('button', 'lg-ccp-save', 'p_save', {type:'button', 'data-cc':'save', 'data-track':'consent_save'}));
    card.appendChild(el('p', 'lg-ccp-pol', 'p_pol'));
    panel.appendChild(card);
    panel.addEventListener('click', function(e){
      if(e.target===panel){ closePanel(); return; }
      var b=e.target.closest('[data-cc]'); if(!b) return;
      var k=b.getAttribute('data-cc');
      if(k==='close') closePanel();
      else if(k==='save') choose(sw.checked);
      else choose(k==='yes');
    });
    panel.addEventListener('keydown', function(e){
      if(e.key==='Escape'){ e.preventDefault(); closePanel(); return; }
      if(e.key!=='Tab') return;
      var f=[].filter.call(panel.querySelectorAll('button,input,a[href]'), function(n){ return n.offsetParent!==null; });
      if(!f.length) return;
      var first=f[0], last=f[f.length-1];
      if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
    });
    document.body.appendChild(panel);
    paint();
  }
  function openPanel(from){
    if(!panel) buildPanel();
    var c=read();
    sw.checked=!!(c && c.a);
    lastFocus=from || document.activeElement;
    hideBanner();
    panel.hidden=false; root.classList.add('lg-ccp-on');
    try{ sw.focus({preventScroll:true}); }catch(e){}
  }
  function closePanel(){
    if(!panel || panel.hidden) return;
    panel.hidden=true; root.classList.remove('lg-ccp-on');
    if(!read() && !SIGNAL) showBanner();                // closed without choosing: the question stays
    if(lastFocus && lastFocus.isConnected && !lastFocus.closest('.lg-cc')) try{ lastFocus.focus({preventScroll:true}); }catch(e){}
    lastFocus=null;
  }

  /* ---------- « Cookie settings » next to « Cookies » in every footer ---------- */
  [].forEach.call(document.querySelectorAll('footer a[href$="cookies.html"]'), function(a){
    var n=a.nextElementSibling;
    if(n && n.hasAttribute('data-consent-open')) return;
    var l=el('a', '', 'link', {href:a.getAttribute('href')+'#choices', 'data-consent-open':'', 'data-track':'foot_consent'});
    a.parentNode.insertBefore(l, a.nextSibling);
  });
  document.addEventListener('click', function(e){
    var o=e.target.closest && e.target.closest('[data-consent-open]');
    if(o){ e.preventDefault(); openPanel(o); }
  });

  /* ---------- what Google Analytics hears, once accepted ---------- */
  document.addEventListener('click', function(e){
    if(!started || !e.target.closest) return;
    var tr=e.target.closest('[data-track]');
    if(tr) window.lgGa('cta_click', {cta_id:tr.getAttribute('data-track')});
    var a=e.target.closest('a[href]'); if(!a) return;
    var h=a.getAttribute('href')||'';
    var m=/^tel:/i.test(h) ? 'phone' : /^mailto:/i.test(h) ? 'email' : /\/\/(api\.)?wa\.me\//i.test(h) ? 'whatsapp' : /\/\/([a-z]+\.)?linkedin\.com\//i.test(h) ? 'linkedin' : '';
    if(m) window.lgGa('contact_click', {method:m});
  }, true);

  /* ---------- texts, in the page's language, and the status line of cookies.html ---------- */
  function paint(){
    [].forEach.call(document.querySelectorAll('[data-cct]'), function(n){ n.innerHTML=t(n.getAttribute('data-cct')); });
    [].forEach.call(document.querySelectorAll('[data-cct-label]'), function(n){ n.setAttribute('aria-label', t(n.getAttribute('data-cct-label'))); });
    var c=read(), s;
    if(c){
      var d=new Date(c.t).toLocaleDateString(L()==='fr' ? 'fr-BE' : 'en-GB', {day:'numeric', month:'long', year:'numeric'});
      s=t(c.a ? 'st_yes' : 'st_no').replace('{d}', d);
    } else s=t(SIGNAL ? 'st_signal' : 'st_none');
    [].forEach.call(document.querySelectorAll('[data-consent-status]'), function(n){ n.innerHTML=s; });
  }

  /* ---------- start ---------- */
  var c0=read();
  if(c0 && c0.a) startGa();
  else if(!c0 && !SIGNAL) showBanner();               // a privacy signal counts as a refusal: no question asked
  paint();
  if(window.MutationObserver) new MutationObserver(paint).observe(root, {attributes:true, attributeFilter:['lang']});
  /* a choice made in another tab applies here too */
  addEventListener('storage', function(e){
    if(e.key!==KEY) return;
    var c=read(); if(!c) return;
    hideBanner(); closePanel();
    if(c.a) startGa(); else stopGa();
    paint();
  });
})();
