/* =========================================================
   LA GOFFINERIE — nav.js (v2.28)
   The top bar, on every page: Services · Work · Pricing · FAQ, the language switch, and
   « Get a quote » on the right.
     · « Services » opens a menu with the three service pages:
       on hover with a mouse, on focus with the keyboard, on a first tap on a touch screen;
       Escape or a click elsewhere closes it;
     · « Get a quote » (data-estimator="nav") opens the project estimator, the site's quote funnel.
       Pages that load estimator.js (home, pricing, the service pages) open it through its own click
       handler. The others (work, about, the 404) load config.js then estimator.js on the first click,
       once, and open it; if loading fails, the button follows its link to the pricing page;
     · once the page has moved 80 px, the bar comes off the top and floats as a dark,
       slightly transparent rounded bar, the page passing behind it; back at the top it docks again.
   The menu speaks the page's language: it follows <html lang>, which every page's setLang() sets.
   Pages without a fixed bar (the 404) keep the menu and skip the floating. The 404 is served at any
   address, so its links start with « / », and so do the scripts loaded here for it.
   ========================================================= */
(function(){
  var SVC=[
    {href:'websites.html', shape:'<rect x="2" y="2" width="20" height="20" rx="5" fill="#2823EE"/>',
     en:['Websites & apps','Sites, tailor-made tools, hosting and visual identity.'],
     fr:['Sites web & applications','Sites, outils sur mesure, hébergement et identité visuelle.']},
    {href:'digital-strategy.html', shape:'<path d="M12 2 L23 21 L1 21 Z" fill="#EDAF2F"/>',
     en:['Digital strategy (SEO & GEO)','Get found on Google, and cited by AI assistants.'],
     fr:['Stratégie digitale (SEO & GEO)','Être trouvé sur Google, et cité par les assistants IA.']},
    {href:'ai-automation.html', shape:'<circle cx="12" cy="12" r="10" fill="#E2452C"/>',
     en:['AI automation','Your site talks to your tools and does the admin.'],
     fr:['Automatisation IA',"Votre site parle à vos outils et fait l'administratif."]}
  ];
  var ALL={en:'All services →', fr:'Tous les services →'};

  var CSS=''
  /* the menu */
  +'.ndrop{position:relative;display:flex;align-items:center;}'
  +'.ndrop .nsvc{white-space:nowrap;}'
  +'.nsvc .nchev{display:inline-block;width:10px;height:10px;margin-left:6px;transition:transform .2s ease;}'
  +'.nsvc .nchev svg{display:block;width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}'
  +'.ndrop.open .nchev{transform:rotate(180deg);}'
  +'.nmenu{position:absolute;top:calc(100% + 12px);left:-8px;width:400px;max-width:calc(100vw - 32px);padding:10px;border-radius:18px;background:#fff;border:2px solid #151515;box-shadow:6px 6px 0 rgba(21,21,21,.13);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .18s ease,transform .18s ease,visibility 0s linear .18s;z-index:90;text-align:left;}'
  +'.nmenu::before{content:"";position:absolute;left:0;right:0;top:-16px;height:16px;}'
  +'.ndrop.open .nmenu{opacity:1;visibility:visible;transform:none;transition:opacity .18s ease,transform .18s ease;}'
  +'.topnav .nmenu a.ni{display:flex;align-items:flex-start;gap:14px;padding:12px 14px;border-radius:12px;text-decoration:none;color:#151515;}'
  +'.topnav .nmenu a::after{display:none!important;}'
  +'.topnav .nmenu a.ni:hover,.topnav .nmenu a.ni:focus-visible{background:#f3f0e6;}'
  +'.nmenu .ni svg{width:22px;height:22px;flex:none;margin-top:2px;}'
  +'.nmenu .ni b{display:block;font-family:"Sora",sans-serif;font-weight:700;font-size:15px;line-height:1.3;}'
  +'.nmenu .ni small{display:block;margin-top:2px;font-family:"Instrument Sans",sans-serif;font-size:13.5px;line-height:1.45;font-weight:400;color:#3d4046;}'
  +'.nmenu .nall{display:block;margin:6px 4px 2px;padding:12px 10px 4px;border-top:1px solid rgba(21,21,21,.12);}'
  +'.topnav .nmenu .nall a{padding:0;font-family:"Sora",sans-serif;font-weight:700;font-size:14px;color:#151515;text-decoration:none;border-bottom:2px solid #2823EE;}'
  /* the floating bar */
  +'.topnav{transition:top .3s ease,left .3s ease,right .3s ease,max-width .3s ease,border-radius .3s ease,background-color .3s ease,box-shadow .3s ease,border-color .3s ease;}'
  +'.topnav .nwrap{transition:height .3s ease,padding .3s ease;}'
  +'html.floated .topnav{top:14px;left:24px;right:24px;max-width:1180px;margin:0 auto;border-radius:18px;border:0;background:rgba(21,21,21,.86);box-shadow:0 18px 40px rgba(21,21,21,.28),0 2px 6px rgba(21,21,21,.18);}'
  +'html.floated .topnav .nwrap{height:62px;padding:0 12px 0 18px;}'
  +'html.floated .topnav .logo,html.floated .topnav .logo-txt{color:#faf8f2;}'
  +'html.floated .topnav .mark *{mix-blend-mode:normal!important;}'
  +'html.floated .nlinks > a,html.floated .nlinks .nsvc{color:rgba(250,248,242,.78);}'
  +'html.floated .nlinks > a:hover,html.floated .nlinks > a[aria-current],html.floated .nlinks .nsvc:hover,html.floated .ndrop.open .nsvc{color:#fff;}'
  +'html.floated .nlinks a::after{background:#EDAF2F;}'
  +'html.floated .topnav .langsw{background:transparent;border-color:rgba(250,248,242,.35);}'
  +'html.floated .topnav .langsw button{color:rgba(250,248,242,.72);}'
  +'html.floated .topnav .langsw button.active{background:#faf8f2;color:#151515;}'
  +'html.floated .topnav .btn.primary{box-shadow:0 1px 2px rgba(0,0,0,.3),0 8px 18px -8px rgba(40,35,238,.8);}'
  +'html.floated .nmenu{background:rgba(21,21,21,.94);border-color:transparent;box-shadow:0 22px 48px rgba(21,21,21,.32);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);}'
  +'html.floated .topnav .nmenu a.ni{color:#fff;} html.floated .nmenu .ni small{color:rgba(250,248,242,.7);}'
  +'html.floated .topnav .nmenu a.ni:hover,html.floated .topnav .nmenu a.ni:focus-visible{background:rgba(250,248,242,.08);}'
  +'html.floated .nmenu .nall{border-color:rgba(250,248,242,.14);} html.floated .topnav .nmenu .nall a{color:#fff;border-color:#EDAF2F;}'
  /* just above 900 px the floating bar is 30 px narrower than the docked one: tighter gaps keep the four links and « Demander un devis » on one line */
  +'@media(min-width:901px) and (max-width:1000px){html.floated .topnav .nwrap{gap:18px;}}'
  +'@media(max-width:900px){html.floated .topnav{top:10px;left:10px;right:10px;border-radius:16px;} html.floated .topnav .nwrap{height:56px;padding:0 8px 0 12px;}}'
  +'@media (prefers-reduced-motion: reduce){.topnav,.topnav .nwrap,.nmenu,.nchev{transition:none!important;}}';
  var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);

  var nav=document.querySelector('.topnav'); if(!nav) return;
  var trig=nav.querySelector('.nsvc');
  /* « / » on the 404 (its links are absolute), the page's own folder everywhere else. */
  var base=(trig && /^\//.test(trig.getAttribute('href')||'')) ? '/' : '';

  /* ---------- the quote button: the estimator, loaded on the first click where the page lacks it ---------- */
  var loading=false;
  var loadScript=function(src){
    return new Promise(function(ok, ko){
      var s=document.createElement('script'); s.src=src; s.async=false;
      s.onload=ok; s.onerror=ko; document.head.appendChild(s);
    });
  };
  document.addEventListener('click', function(e){
    if(window.LGEstimator) return;                     // estimator.js is on the page: its own click handler opens it
    var el=e.target.closest && e.target.closest('[data-estimator]'); if(!el) return;
    e.preventDefault();
    if(loading) return;                                // already on its way: one load, one pop-up
    loading=true;
    var href=el.getAttribute('href'), from=el.getAttribute('data-estimator')||'nav', svc=el.getAttribute('data-estimator-service');
    (window.LG_CONFIG ? Promise.resolve() : loadScript(base+'config.js'))
      .then(function(){ return window.LGEstimator ? null : loadScript(base+'estimator.js'); })
      .then(function(){ if(!window.LGEstimator) throw new Error('estimator'); window.LGEstimator.open(from, svc); })
      .catch(function(){ loading=false; if(href) location.href=href; });
  });

  /* ---------- the services menu ---------- */
  if(trig){
    var wrap=document.createElement('div'); wrap.className='ndrop';
    trig.parentNode.insertBefore(wrap, trig); wrap.appendChild(trig);
    var chev=document.createElement('span'); chev.className='nchev'; chev.setAttribute('aria-hidden','true');
    chev.innerHTML='<svg viewBox="0 0 12 12"><path d="M2 4.5l4 4 4-4"/></svg>';
    trig.appendChild(chev);
    trig.setAttribute('aria-haspopup','true'); trig.setAttribute('aria-expanded','false'); trig.setAttribute('aria-controls','nmenu');
    var menu=document.createElement('div'); menu.className='nmenu'; menu.id='nmenu';
    wrap.appendChild(menu);
    var esc=function(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;'); };
    var render=function(){
      var L=document.documentElement.lang==='fr'?'fr':'en';
      menu.setAttribute('aria-label', 'Services');
      menu.innerHTML=SVC.map(function(s){
        return '<a class="ni" href="'+base+s.href+'" data-track="nav_service"><svg viewBox="0 0 24 24" aria-hidden="true">'+s.shape+'</svg><span><b>'+esc(s[L][0])+'</b><small>'+esc(s[L][1])+'</small></span></a>';
      }).join('')+'<span class="nall"><a href="'+trig.getAttribute('href')+'">'+ALL[L]+'</a></span>';
    };
    render();
    new MutationObserver(render).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
    var timer=null;
    var setOpen=function(o){ clearTimeout(timer); wrap.classList.toggle('open', o); trig.setAttribute('aria-expanded', String(o)); };
    var fine=matchMedia('(hover: hover) and (pointer: fine)');
    wrap.addEventListener('mouseenter', function(){ if(fine.matches) setOpen(true); });
    wrap.addEventListener('mouseleave', function(){ if(fine.matches){ clearTimeout(timer); timer=setTimeout(function(){ setOpen(false); }, 160); } });
    wrap.addEventListener('focusin', function(){ setOpen(true); });
    wrap.addEventListener('focusout', function(e){ if(!wrap.contains(e.relatedTarget)) setOpen(false); });
    /* On a touch screen, the first tap opens the menu; a second tap follows the link. */
    trig.addEventListener('click', function(e){ if(!fine.matches && !wrap.classList.contains('open')){ e.preventDefault(); setOpen(true); } });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && wrap.classList.contains('open')){ setOpen(false); trig.focus(); } });
    document.addEventListener('click', function(e){ if(!wrap.contains(e.target)) setOpen(false); });
  }

  /* ---------- the floating bar ---------- */
  if(getComputedStyle(nav).position==='fixed'){
    var root=document.documentElement;
    var onScroll=function(){ root.classList.toggle('floated', (window.scrollY||0)>80); };
    addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }
})();
