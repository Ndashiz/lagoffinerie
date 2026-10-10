/* =========================================================
   LA GOFFINERIE — nav.js (v2.33)
   The top bar, on every page: Services · Work · Pricing · FAQ, the language switch, and
   « Get a quote » on the right. « Pricing » is the home page's #pricing section (./#pricing,
   /#pricing on the 404).
     · « Services » opens a menu with the three service pages:
       on hover with a mouse, on focus with the keyboard, on a first tap on a touch screen;
       Escape or a click elsewhere closes it;
     · « Get a quote » (data-estimator="nav") opens the project estimator, the site's quote funnel.
       Pages that load estimator.js (home, the service pages) open it through its own click
       handler. The others (work, about, the 404) load config.js then estimator.js on the first click,
       once, and open it; if loading fails, the button follows its link to the prices on the home
       page (#pricing), or goes there itself when it has no link;
     · once the page has moved 80 px, the bar comes off the top and floats as a dark,
       slightly transparent rounded bar, the page passing behind it; back at the top it docks again.
   On a phone (900 px wide and below), the bar shows the logo and its name, a short « Quote » / « Devis »
   pill (the same estimator button) and a round menu button; the links and the language switch move
   into the menu. Floating, it is a dark rounded bar 10 px from the edges.
     · The menu is a full-screen sheet built here, on every page with a top bar: the three services,
       Work, Pricing and FAQ (with the paths of the page's own top-bar links), the language switch
       (the page's setLang(), which goes to the same page in the other language), then « Get a quote »
       (the estimator) and « Book my free call » (the home page's #contact). It is a modal dialog: focus
       goes into it and stays there; ×, Escape or any link closes it and focus goes back to the menu
       button; the page behind it does not scroll.
     · The bottom bar (.bottombar, each page's own Call · Work · Pricing · Contact) becomes a floating
       dark dock. Its lit entry is the page's own (aria-current: Work on the work page) or, on the
       home page, the section in view (#work, #pricing, #contact), followed as the page scrolls.
   Everything here speaks the page's language: it follows <html lang>, which every page's setLang() sets.
   Pages without a fixed bar (the 404, the legal pages) keep the menus and skip the floating. The 404 is
   served at any address, so its links start with « / » (« /fr/ » when it speaks French), and so do the scripts
   loaded here for it. The French pages live in fr/: their links stay there, and the scripts loaded here come
   from the folder of nav.js itself (« ../ »).
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
  /* the phone bar and its menu */
  var T={
    en:{quote_s:'Quote', open:'Open the menu', close:'Close the menu', menu:'Menu', svc:'Services', work:'Work', pricing:'Pricing', faq:'FAQ',
        lang:'Language', quote:'Get a quote', book:'Book my free call'},
    fr:{quote_s:'Devis', open:'Ouvrir le menu', close:'Fermer le menu', menu:'Menu', svc:'Services', work:'Réalisations', pricing:'Tarifs', faq:'FAQ',
        lang:'Langue', quote:'Demander un devis', book:'Réserver mon appel gratuit'}
  };

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
  /* the floating bar */
  +'.topnav{transition:top .3s ease,left .3s ease,right .3s ease,max-width .3s ease,border-radius .3s ease,background-color .3s ease,box-shadow .3s ease,border-color .3s ease;}'
  +'.topnav .nwrap{transition:height .3s ease,padding .3s ease;}'
  +'html.floated .topnav{top:14px;left:24px;right:24px;max-width:1180px;margin:0 auto;border-radius:18px;border:0;background:rgba(21,21,21,.86);box-shadow:inset 0 0 0 1px rgba(250,248,242,.1),0 18px 40px rgba(21,21,21,.28),0 2px 6px rgba(21,21,21,.18);}'
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
  /* just above 900 px the floating bar is 30 px narrower than the docked one: tighter gaps keep the four links and « Demander un devis » on one line */
  +'@media(min-width:901px) and (max-width:1000px){html.floated .topnav .nwrap{gap:18px;}}'
  /* the phone bar: the menu button and the short label exist everywhere and show only on a phone */
  +'.nmb,.nq-s{display:none;}'
  +'.nmb{flex:none;width:40px;height:40px;padding:0;border-radius:50%;border:1px solid rgba(21,21,21,.14);background:#fff;color:#151515;align-items:center;justify-content:center;cursor:pointer;transition:background-color .3s ease,border-color .3s ease,color .3s ease;}'
  +'.nmb svg,.ns-x svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;}'
  +'@media(max-width:900px){'
  +  'html .topnav{background:rgba(250,248,242,.86);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);border-bottom:1px solid rgba(21,21,21,.08);}'
  +  'html .topnav .nrow,html .topnav.nrow{height:60px;padding:0 12px 0 16px;gap:10px;}'
  +  'html .topnav .logo{gap:8px;}'
  +  'html .topnav .logo > svg{width:28px;height:26px;flex:none;}'
  +  'html .topnav .logo-txt{display:inline;font-family:"Sora",sans-serif;font-weight:800;font-size:15px;line-height:1;letter-spacing:-.01em;white-space:nowrap;}'
  +  'html .topnav .langsw{display:none;}'
  +  'html .topnav .nright{gap:8px;}'
  +  'html .topnav .nquote{height:38px;padding:0 14px;border-radius:999px;gap:6px;font-size:13px;box-shadow:0 8px 18px -8px rgba(40,35,238,.7);}'
  +  'html .topnav .nquote .ndoc{display:block;width:14px;height:14px;}'
  +  'html .topnav .nquote > span:not(.nq-s){display:none;}'
  +  'html .topnav .nquote .nq-s{display:inline;}'
  +  'html .topnav .nmb{display:inline-flex;}'
  +  'html.floated .topnav{top:10px;left:10px;right:10px;border-radius:18px;background:rgba(21,21,21,.88);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);box-shadow:inset 0 0 0 1px rgba(250,248,242,.1),0 18px 40px -16px rgba(21,21,21,.5);}'
  +  'html.floated .topnav .nrow{height:56px;padding:0 8px 0 14px;}'
  +  'html.floated .topnav .nmb{background:transparent;border-color:rgba(250,248,242,.22);color:#faf8f2;}'
  /* the dock: the page's bottom bar, floating 12 px from the edges (above the home indicator where there is one) */
  +  'html .bottombar{left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));height:62px;gap:4px;padding:6px;border:0;border-radius:22px;background:rgba(21,21,21,.9);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);box-shadow:inset 0 0 0 1px rgba(250,248,242,.1),0 18px 36px -12px rgba(21,21,21,.5);}'
  +  'html .bottombar a{min-width:0;border-radius:16px;gap:3px;font-family:"Sora",sans-serif;font-weight:600;font-size:10.5px;line-height:1.2;white-space:nowrap;color:rgba(250,248,242,.66);transition:background-color .2s ease,color .2s ease;}'
  +  'html .bottombar a svg{width:20px;height:20px;flex:none;}'
  +  'html .bottombar a:hover,html .bottombar a:active{color:#fff;}'
  +  'html .bottombar a[aria-current]{color:#fff;background:rgba(250,248,242,.1);}'
  +  'html .bottombar a[aria-current] svg{stroke:#EDAF2F;}'
  +  'html .bottombar a:focus-visible{outline:2px solid #EDAF2F;outline-offset:-2px;border-radius:16px;}'
  +  'html.ndock body{padding-bottom:calc(max(12px,env(safe-area-inset-bottom)) + 74px);}'
  +'}'
  +'@media(max-width:330px){html .topnav .logo-txt{display:none;}}'
  /* the menu sheet */
  +'.nsheet{position:fixed;inset:0;z-index:150;display:flex;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:#faf8f2;color:#151515;font-family:"Instrument Sans",system-ui,sans-serif;line-height:1.4;text-align:left;visibility:hidden;opacity:0;transform:translateY(-10px);transition:opacity .24s ease,transform .24s cubic-bezier(.2,.8,.2,1),visibility 0s linear .24s;}'
  +'.nsheet.open{visibility:visible;opacity:1;transform:none;transition:opacity .24s ease,transform .24s cubic-bezier(.2,.8,.2,1);}'
  +'html.ns-lock{overflow:hidden;}'
  +'.ns-top{flex:none;position:sticky;top:0;z-index:1;display:flex;align-items:center;gap:10px;height:60px;padding:0 12px 0 16px;background:#faf8f2;border-bottom:1px solid rgba(21,21,21,.08);}'
  +'.ns-logo{display:flex;align-items:center;gap:8px;text-decoration:none;color:#151515;}'
  +'.ns-logo svg{width:28px;height:26px;flex:none;}'
  +'.ns-logo span{font-family:"Sora",sans-serif;font-weight:800;font-size:15px;line-height:1;letter-spacing:-.01em;white-space:nowrap;}'
  +'.ns-x{margin-left:auto;flex:none;width:40px;height:40px;padding:0;border-radius:50%;border:1px solid rgba(21,21,21,.14);background:#fff;color:#151515;display:flex;align-items:center;justify-content:center;cursor:pointer;}'
  +'.ns-body{flex:1 0 auto;display:flex;flex-direction:column;padding:18px 20px calc(24px + env(safe-area-inset-bottom));}'
  +'.ns-svc{padding:6px 0 12px;}'
  +'.ns-h{font-family:"Sora",sans-serif;font-weight:700;font-size:26px;line-height:1.2;letter-spacing:-.015em;padding:8px 0 6px;color:#151515;}'
  +'.ns-si{display:flex;align-items:center;gap:12px;padding:10px 0;text-decoration:none;color:#151515;font-size:16px;font-weight:500;line-height:1.35;}'
  +'.ns-si svg{width:18px;height:18px;flex:none;}'
  +'.ns-big{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 0;border-top:1px solid rgba(21,21,21,.08);text-decoration:none;color:#151515;font-family:"Sora",sans-serif;font-weight:700;font-size:26px;line-height:1.2;letter-spacing:-.015em;}'
  +'.ns-big svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}'
  +'.ns-si:hover,.ns-big:hover,.ns-si[aria-current],.ns-big[aria-current]{color:#2823EE;}'
  +'.ns-lang{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 0;border-top:1px solid rgba(21,21,21,.08);}'
  +'.ns-lab{font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#3d4046;}'
  +'.ns-sw{display:flex;border:1px solid rgba(21,21,21,.16);border-radius:999px;background:#fff;overflow:hidden;}'
  +'.nsheet .ns-sw button{font-family:"JetBrains Mono",monospace;font-size:12px;font-weight:600;letter-spacing:.06em;line-height:1;border:0;border-radius:0;background:transparent;color:#3d4046;padding:0 15px;min-height:34px;cursor:pointer;}'
  +'.nsheet .ns-sw button[aria-pressed="true"]{background:#151515;color:#faf8f2;}'
  +'.ns-ctas{margin-top:auto;padding-top:24px;display:grid;gap:10px;}'
  +'.ns-cta{display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:0 16px;border-radius:14px;font-family:"Sora",sans-serif;font-weight:600;font-size:15.5px;line-height:1.2;text-align:center;text-decoration:none;}'
  +'.ns-cta.pri{background:#2823EE;color:#fff;box-shadow:0 10px 24px -10px rgba(40,35,238,.65);}'
  +'.ns-cta.pri:hover{background:#1d19d8;}'
  +'.ns-cta.pri svg{width:16px;height:16px;flex:none;}'
  +'.ns-cta.sec{background:#fff;color:#151515;border:1px solid rgba(21,21,21,.16);}'
  +'.ns-cta.sec:hover{border-color:rgba(21,21,21,.32);}'
  +'.nsheet a:focus-visible,.nsheet button:focus-visible,.nmb:focus-visible{outline:3px solid #2823EE;outline-offset:2px;}'
  +'@media(min-width:901px){.nsheet{display:none;}}'
  +'@media (prefers-reduced-motion: reduce){.topnav,.topnav .nwrap,.nmenu,.nchev,.nmb,.nsheet,.nsheet.open,.bottombar a{transition:none!important;} .nsheet{transform:none;}}';
  var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);

  var nav=document.querySelector('.topnav'); if(!nav) return;
  var root=document.documentElement;
  var trig=nav.querySelector('.nsvc');
  var lang=function(){ return root.lang==='fr' ? 'fr' : 'en'; };
  /* The pages: « / » on the 404 (its links are absolute; « /fr/ » when it speaks French), the page's own folder
     everywhere else (the French pages are in fr/, so their links stay there). */
  var base=(trig && /^\//.test(trig.getAttribute('href')||'')) ? (lang()==='fr' ? '/fr/' : '/') : '';
  /* The shared files (config.js, estimator.js): next to this one, « ../ » from a French page, « / » from the 404. */
  var files=(function(){ var s=document.currentScript, src=(s && s.getAttribute('src'))||''; return src.slice(0, src.lastIndexOf('/')+1); })();
  var each=function(list, fn){ Array.prototype.forEach.call(list, fn); };
  var esc=function(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); };

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
    (window.LG_CONFIG ? Promise.resolve() : loadScript(files+'config.js'))
      .then(function(){ return window.LGEstimator ? null : loadScript(files+'estimator.js'); })
      .then(function(){ if(!window.LGEstimator) throw new Error('estimator'); window.LGEstimator.open(from, svc); })
      .catch(function(){ loading=false; location.href=href || ((base||'./')+'#pricing'); });
  });

  /* ---------- the services menu ---------- */
  var renders=[];
  if(trig){
    var wrap=document.createElement('div'); wrap.className='ndrop';
    trig.parentNode.insertBefore(wrap, trig); wrap.appendChild(trig);
    var chev=document.createElement('span'); chev.className='nchev'; chev.setAttribute('aria-hidden','true');
    chev.innerHTML='<svg viewBox="0 0 12 12"><path d="M2 4.5l4 4 4-4"/></svg>';
    trig.appendChild(chev);
    trig.setAttribute('aria-haspopup','true'); trig.setAttribute('aria-expanded','false'); trig.setAttribute('aria-controls','nmenu');
    var menu=document.createElement('div'); menu.className='nmenu'; menu.id='nmenu';
    wrap.appendChild(menu);
    renders.push(function(){
      var L=lang();
      menu.setAttribute('aria-label', 'Services');
      menu.innerHTML=SVC.map(function(s){
        return '<a class="ni" href="'+base+s.href+'" data-track="nav_service"><svg viewBox="0 0 24 24" aria-hidden="true">'+s.shape+'</svg><span><b>'+esc(s[L][0])+'</b><small>'+esc(s[L][1])+'</small></span></a>';
      }).join('');
    });
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

  /* ---------- the phone bar: « Devis », the menu button and the menu sheet ---------- */
  var home=base||'./';
  var row=nav.querySelector('.nwrap')||nav; row.classList.add('nrow');
  /* The paths of the page's own top-bar links, so every page keeps its own (#pricing on the home page, /#pricing on the 404). */
  var links=nav.querySelectorAll('.nlinks a[href], .links a[href]');
  var path=function(re, fallback){ for(var i=0;i<links.length;i++){ var h=links[i].getAttribute('href'); if(re.test(h)) return h; } return fallback; };
  var quote=nav.querySelector('.nquote'), logo=nav.querySelector('.logo');
  var onHome=!!document.getElementById('contact');     // the home page holds the contact section; elsewhere the button goes there
  var hrefs={
    logo: (logo && logo.getAttribute('href')) || home,
    work: path(/work\.html/, base+'work.html'),
    pricing: path(/#pricing$/, home+'#pricing'),
    faq: path(/#faq$/, home+'#faq'),
    quote: (quote && quote.getAttribute('href')) || home+'#pricing',
    book: onHome ? '#contact' : home+'#contact'
  };

  var short=null;
  if(quote){ short=document.createElement('span'); short.className='nq-s'; quote.appendChild(short); }
  var mb=document.createElement('button');
  mb.type='button'; mb.className='nmb';
  mb.setAttribute('aria-expanded','false'); mb.setAttribute('aria-controls','nsheet'); mb.setAttribute('aria-haspopup','dialog');
  mb.setAttribute('data-track','menu_open');
  mb.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 7h13M3.5 13h9"/></svg>';
  (nav.querySelector('.nright')||row).appendChild(mb);

  var MARK='<svg viewBox="0 0 120 112" style="isolation:isolate" aria-hidden="true"><path d="M62 6 L102 80 L22 80 Z" fill="#EDAF2F" style="mix-blend-mode:multiply"/><rect x="12" y="48" width="58" height="58" rx="15" fill="#2823EE" style="mix-blend-mode:multiply"/><circle cx="90" cy="78" r="27" fill="#E2452C" style="mix-blend-mode:multiply"/></svg>';
  var DOC='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.75h5.2L12.5 5v9.25H4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 1.75V5.2h3.4M6.3 8.4h3.9M6.3 11h3.9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var ARROW='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4"/></svg>';
  var big=function(k, track){ return '<a class="ns-big" href="'+esc(hrefs[k])+'" data-track="'+track+'"><span data-k="'+k+'"></span>'+ARROW+'</a>'; };
  var sheet=document.createElement('div');
  sheet.className='nsheet'; sheet.id='nsheet';
  sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-modal','true');
  sheet.innerHTML=''
    +'<div class="ns-top"><a class="ns-logo" href="'+esc(hrefs.logo)+'">'+MARK+'<span>La Goffinerie</span></a>'
    +'<button type="button" class="ns-x"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg></button></div>'
    +'<div class="ns-body">'
    +  '<div class="ns-svc" role="group" aria-labelledby="ns-svc-h"><div class="ns-h" id="ns-svc-h" data-k="svc"></div>'
    +    SVC.map(function(s, i){ return '<a class="ns-si" href="'+base+s.href+'" data-track="menu_service"><svg viewBox="0 0 24 24" aria-hidden="true">'+s.shape+'</svg><span data-s="'+i+'"></span></a>'; }).join('')
    +  '</div>'
    +  big('work','menu_work')+big('pricing','menu_pricing')+big('faq','menu_faq')
    +  '<div class="ns-lang"><span class="ns-lab" id="ns-lang-h" data-k="lang"></span>'
    +    '<div class="ns-sw" role="group" aria-labelledby="ns-lang-h"><button type="button" data-l="en" lang="en">EN</button><button type="button" data-l="fr" lang="fr">FR</button></div></div>'
    +  '<div class="ns-ctas">'
    +    '<a class="ns-cta pri" href="'+esc(hrefs.quote)+'" data-estimator="menu" data-track="menu_quote">'+DOC+'<span data-k="quote"></span></a>'
    +    '<a class="ns-cta sec" href="'+esc(hrefs.book)+'"'+(onHome ? ' data-open="menu"' : '')+' data-track="menu_book"><span data-k="book"></span></a>'
    +  '</div>'
    +'</div>';
  document.body.appendChild(sheet);
  var btnX=sheet.querySelector('.ns-x');
  /* the page the visitor is on (work, a service page) is marked in the menu */
  each(sheet.querySelectorAll('a.ns-si, a.ns-big'), function(a){ if(a.pathname===location.pathname && !a.hash) a.setAttribute('aria-current','page'); });

  renders.push(function(){
    var L=lang(), t=T[L];
    if(short) short.textContent=t.quote_s;
    mb.setAttribute('aria-label', t.open);
    sheet.setAttribute('aria-label', t.menu);
    btnX.setAttribute('aria-label', t.close);
    each(sheet.querySelectorAll('[data-k]'), function(el){ el.textContent=t[el.getAttribute('data-k')]; });
    each(sheet.querySelectorAll('[data-s]'), function(el){ el.textContent=SVC[+el.getAttribute('data-s')][L][0]; });
    each(sheet.querySelectorAll('.ns-sw button'), function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-l')===L)); });
  });

  var isOpen=false;
  var focusables=function(){ return sheet.querySelectorAll('a[href],button'); };
  var openSheet=function(){
    if(isOpen) return; isOpen=true;
    /* the page stays where it is behind the sheet; where the window has a scroll bar, its width is kept so nothing shifts */
    var sbw=window.innerWidth-root.clientWidth;
    if(sbw>0) document.body.style.paddingRight=sbw+'px';
    root.classList.add('ns-lock');
    sheet.scrollTop=0;
    sheet.classList.add('open');
    mb.setAttribute('aria-expanded','true');
    try{ btnX.focus({preventScroll:true}); }catch(e){ btnX.focus(); }
  };
  var closeSheet=function(refocus){
    if(!isOpen) return; isOpen=false;
    sheet.classList.remove('open');
    root.classList.remove('ns-lock'); document.body.style.paddingRight='';
    mb.setAttribute('aria-expanded','false');
    if(refocus!==false){ try{ mb.focus({preventScroll:true}); }catch(e){ mb.focus(); } }
  };
  mb.addEventListener('click', function(){ if(isOpen) closeSheet(); else openSheet(); });
  btnX.addEventListener('click', function(){ closeSheet(); });
  /* Any link closes the sheet first: the page's own handlers (the estimator, a #section) then take over. */
  sheet.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('a[href]')) closeSheet(); });
  sheet.querySelector('.ns-sw').addEventListener('click', function(e){
    var b=e.target.closest && e.target.closest('button[data-l]'); if(!b) return;
    var l=b.getAttribute('data-l'); if(l===lang()) return;
    if(typeof window.setLang==='function') window.setLang(l);
    else { root.lang=l; try{ localStorage.setItem('lg_lang', l); }catch(x){} }   // the 404: its texts follow <html lang>
  });
  document.addEventListener('keydown', function(e){
    if(!isOpen) return;
    if(e.key==='Escape'){ e.preventDefault(); closeSheet(); return; }
    if(e.key!=='Tab') return;
    var f=focusables(); if(!f.length) return;
    var first=f[0], last=f[f.length-1], a=document.activeElement;
    if(!sheet.contains(a)){ e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if(e.shiftKey && a===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && a===last){ e.preventDefault(); first.focus(); }
  });
  /* wider than a phone, the sheet does not exist: a window widened while it is open closes it */
  var phone=matchMedia('(max-width: 900px)');
  var onPhone=function(){ if(!phone.matches) closeSheet(false); };
  if(phone.addEventListener) phone.addEventListener('change', onPhone); else if(phone.addListener) phone.addListener(onPhone);

  var paint=function(){ renders.forEach(function(fn){ fn(); }); };
  paint();
  new MutationObserver(paint).observe(root, {attributes:true, attributeFilter:['lang']});

  /* ---------- the dock: the page's bottom bar; on the home page the section in view lights its entry ---------- */
  var dock=document.querySelector('.bottombar');
  if(dock){
    root.classList.add('ndock');
    /* an entry follows the section its #link points to, or the one named by data-section (Work on the home page, whose link leads to work.html) */
    var sid=function(a){ var h=a.getAttribute('href')||''; return a.getAttribute('data-section') || (h.charAt(0)==='#' ? h.slice(1) : ''); };
    var tabs=[].filter.call(dock.querySelectorAll('a'), function(a){ var id=sid(a); return id && document.getElementById(id); });
    if(tabs.length && 'IntersectionObserver' in window){
      var inView={};
      var light=function(){
        var cur=null;
        tabs.forEach(function(a){ if(inView[sid(a)]) cur=a; });
        tabs.forEach(function(a){ if(a===cur) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
      };
      /* a section is « in view » while it crosses a thin band just above the middle of the screen */
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(en){ inView[en.target.id]=en.isIntersecting; });
        light();
      }, {rootMargin:'-45% 0px -50% 0px'});
      tabs.forEach(function(a){ io.observe(document.getElementById(sid(a))); });
    }
  }

  /* ---------- the floating bar ---------- */
  if(getComputedStyle(nav).position==='fixed'){
    var onScroll=function(){ root.classList.toggle('floated', (window.scrollY||0)>80); };
    addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }
})();
