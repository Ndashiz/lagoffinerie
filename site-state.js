/* =========================================================
   LA GOFFINERIE — site-state.js (site v2.24)
   Two switches the owner flips from Jarvis, read by every page
   on load through the public GET /api/gf/config (the same call
   the home page makes for its logo intro):
     · maintenance — a full-screen « back very soon » screen laid
       over the page, re-checked every 60 s, gone as soon as the
       switch is off again. Never shown from a cached answer: only
       a fresh « on » closes the site, so a dead Jarvis never does.
     · banner — an announcement bar above the top bar, in one of
       three tones, with an optional link, a period, and a × that
       hides it for the visit. Painted from the last good answer
       first (localStorage lg_site_cfg), then refreshed.
   Fail-open everywhere: no answer, a slow one or an old server
   → the page shows as usual. Storage keys: lg_site_cfg (last good
   answer), lg_banner (the banner the visitor closed) — both
   listed on cookies.html.
   ========================================================= */
(function(){
  'use strict';
  if(!window.fetch || !document.body || !window.MutationObserver) return;
  var CFG_URL='https://jarvis.ndashiz.be/api/gf/config', CFG_KEY='lg_site_cfg', HIDE_KEY='lg_banner', WAIT=2500, EVERY=60000;
  var root=document.documentElement;
  var T={
    fr:{ kick:'Maintenance', tag:'Maintenance en cours', title:'Le site revient très vite.',
         msg:'Je fais une mise à jour, et je ne ferme jamais longtemps. En attendant, vous pouvez <strong>me joindre directement</strong>.',
         art:"Un ouvrier casqué frappe au marteau sur une barrière de chantier, des étincelles jaillissent",
         call:'Appeler', wa:'WhatsApp', wam:"M'écrire un message", mail:'E-mail',
         note:"La page se rafraîchit toute seule toutes les 60\u00a0s\u00a0: dès que le site est de retour, elle s'efface.", sign:'EN COURS',
         foot:'© 2026 La Goffinerie · Basée en Belgique.', close:'Fermer la bannière', region:'Annonce',
         waText:"Bonjour Simon, je voudrais parler d'un site web pour mon entreprise." },
    en:{ kick:'Maintenance', tag:'Maintenance in progress', title:'Back very soon.',
         msg:"I'm running an update, and I never close for long. Meanwhile, you can <strong>reach me directly</strong>.",
         art:'A worker in a hard hat hammering a work barrier, sparks flying',
         call:'Call', wa:'WhatsApp', wam:'Send me a message', mail:'E-mail',
         note:'This page refreshes on its own every 60 s: as soon as the site is back, it goes away.', sign:'AT WORK',
         foot:'© 2026 La Goffinerie · Belgium-based.', close:'Close the banner', region:'Announcement',
         waText:"Hello Simon, I'd like to talk about a website for my business." }
  };
  var LOGO='<svg viewBox="0 0 120 112" style="isolation:isolate" aria-hidden="true"><path d="M62 6 L102 80 L22 80 Z" fill="#EDAF2F" style="mix-blend-mode:multiply"/><rect x="12" y="48" width="58" height="58" rx="15" fill="#2823EE" style="mix-blend-mode:multiply"/><circle cx="90" cy="78" r="27" fill="#E2452C" style="mix-blend-mode:multiply"/></svg>';
  /* The worker at the barrier — same drawing as the mock-up. A 0.8 s loop: the arm and hammer swing from the
     shoulder, the torso follows slightly, sparks burst at the impact and the sign shakes. */
  var WORKER=function(sign, label){ return '<svg viewBox="0 0 440 360" fill="none" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="'+esc(label)+'">'
    +'<rect x="60" y="300" width="320" height="14" rx="7" fill="#151515"/>'
    +'<path d="M120 300 L150 150 L290 150 L320 300" fill="#f3f0e6" stroke="#151515" stroke-width="3"/>'
    +'<g class="lg-w-sign"><rect x="96" y="104" width="248" height="76" rx="12" fill="#EDAF2F" stroke="#151515" stroke-width="3"/>'
    +'<path d="M112 180 L144 104 M168 180 L200 104 M224 180 L256 104 M280 180 L312 104" stroke="#151515" stroke-width="10"/>'
    +'<rect x="96" y="104" width="248" height="76" rx="12" stroke="#151515" stroke-width="3"/></g>'
    +'<path d="M150 150 L140 300 M290 150 L300 300" stroke="#151515" stroke-width="3"/>'
    +'<rect x="176" y="196" width="88" height="56" rx="8" fill="#fff" stroke="#151515" stroke-width="3"/>'
    +'<text x="220" y="230" text-anchor="middle" fill="#151515" style="font-family:\'JetBrains Mono\',monospace;font-size:12.5px;font-weight:600;letter-spacing:.14em">'+sign+'</text>'
    +'<circle cx="352" cy="70" r="36" fill="#2823EE"/><path d="M338 84 L366 56" stroke="#fff" stroke-width="7"/><path d="M366 56 a12 12 0 1 0 6 -12 l-6 6 z" fill="#fff"/><path d="M342 88 l-6 6" stroke="#fff" stroke-width="9"/>'
    +'<path d="M40 60 L74 60 M57 43 L57 77" stroke="#E2452C" stroke-width="4"/>'
    +'<path d="M30 250 l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" fill="#EDAF2F"/>'
    +'<path d="M86 222 L86 300 M110 222 L110 300" stroke="#151515" stroke-width="13"/>'
    +'<rect x="76" y="292" width="24" height="10" rx="4" fill="#151515"/><rect x="102" y="292" width="24" height="10" rx="4" fill="#151515"/>'
    +'<g class="lg-w-body"><rect x="82" y="164" width="34" height="62" rx="10" fill="#2823EE" stroke="#151515" stroke-width="3"/>'
    +'<rect x="90" y="176" width="18" height="16" rx="3" fill="#faf8f2" stroke="#151515" stroke-width="2"/>'
    +'<path d="M84 180 L70 212" stroke="#151515" stroke-width="9"/>'
    +'<circle cx="99" cy="146" r="17" fill="#faf8f2" stroke="#151515" stroke-width="3"/>'
    +'<path d="M80 143 a19 19 0 0 1 38 0 z" fill="#EDAF2F" stroke="#151515" stroke-width="3"/><rect x="74" y="140" width="50" height="7" rx="3.5" fill="#EDAF2F" stroke="#151515" stroke-width="3"/>'
    +'<circle cx="106" cy="148" r="2" fill="#151515"/>'
    +'<g class="lg-w-arm"><path d="M116 178 L156 150" stroke="#151515" stroke-width="9"/><path d="M156 150 L186 124" stroke="#151515" stroke-width="6"/><rect x="176" y="106" width="30" height="22" rx="5" fill="#151515" transform="rotate(-40 191 117)"/></g></g>'
    +'<g class="lg-w-sparks"><path d="M206 170 l2.2 6 6 2.2-6 2.2-2.2 6-2.2-6-6-2.2 6-2.2z" fill="#EDAF2F"/><path d="M224 156 l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#E2452C"/><path d="M214 186 l6 -3 M226 178 l6 1" stroke="#E2452C" stroke-width="2.4"/></g>'
    +'</svg>'; };
  var CSS=''
    +'.lg-banner{position:fixed;top:0;left:0;right:0;z-index:81;min-height:46px;display:flex;align-items:center;justify-content:center;gap:14px;padding:9px 56px 9px 24px;font-family:"Instrument Sans",system-ui,sans-serif;font-size:15px;font-weight:500;line-height:1.4;color:#fff;background:#2823EE;}'
    +'.lg-banner--warn{background:#EDAF2F;color:#151515;}.lg-banner--urgent{background:#E2452C;}'
    +'.lg-banner-dot{flex:none;width:8px;height:8px;border-radius:50%;background:#EDAF2F;}.lg-banner--warn .lg-banner-dot{background:#151515;}.lg-banner--urgent .lg-banner-dot{background:#fff;}'
    +'.lg-banner b{font-family:"Sora",system-ui,sans-serif;font-weight:700;}'
    +'.lg-banner-link{color:inherit;font-family:"Sora",system-ui,sans-serif;font-weight:700;text-decoration:none;border-bottom:2px solid #EDAF2F;white-space:nowrap;}.lg-banner--warn .lg-banner-link{border-bottom-color:#151515;}.lg-banner--urgent .lg-banner-link{border-bottom-color:#fff;}'
    +'.lg-banner-x{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(255,255,255,.55);background:transparent;color:inherit;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:16px;line-height:1;cursor:pointer;padding:0;}.lg-banner--warn .lg-banner-x{border-color:rgba(21,21,21,.45);}'
    +'html.lg-has-banner .topnav{top:var(--lg-bh)!important;}html.lg-has-banner body{padding-top:calc(var(--lg-body-pad,0px) + var(--lg-bh))!important;}'
    +'@media(max-width:640px){.lg-banner{font-size:14px;gap:10px;padding:9px 48px 9px 16px;flex-wrap:wrap;}}'
    +'html.lg-maint-on{overflow:hidden;}'
    +'.lg-maint{position:fixed;inset:0;z-index:900;background:#faf8f2;color:#151515;font-family:"Instrument Sans",system-ui,sans-serif;display:flex;flex-direction:column;overflow:auto;}'
    +'.lg-maint-bar{flex:none;height:66px;border-bottom:2px solid #151515;display:flex;align-items:center;gap:10px;padding:0 24px;}'
    +'.lg-maint-bar svg{width:32px;height:30px;}.lg-maint-bar .lg-name{font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:17px;letter-spacing:-.01em;}'
    +'.lg-maint-tag{margin-left:auto;display:inline-flex;align-items:center;gap:8px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;background:#151515;color:#EDAF2F;border-radius:7px;padding:6px 11px;}.lg-maint-tag i{width:8px;height:8px;border-radius:50%;background:#EDAF2F;}'
    +'.lg-maint-main{flex-grow:1;display:flex;align-items:center;position:relative;overflow:hidden;}'
    +'.lg-maint-geo{position:absolute;right:-40px;top:40px;width:300px;height:280px;transform:rotate(8deg);opacity:.5;pointer-events:none;}'
    +'.lg-maint-wrap{position:relative;z-index:1;max-width:1060px;width:100%;margin:0 auto;padding:40px 28px;display:grid;grid-template-columns:1.2fr 1fr;gap:48px;align-items:center;}'
    +'.lg-kick{display:flex;align-items:center;gap:10px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#3d4046;}.lg-kick::before{content:"";width:26px;height:2px;background:#E2452C;}'
    +'.lg-maint h1:focus{outline:none;}.lg-maint p strong{color:#151515;font-weight:600;}'
    +'.lg-maint h1{margin:16px 0 0;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.1;letter-spacing:-.015em;}'
    +'.lg-maint p{margin:18px 0 0;font-size:18px;line-height:1.6;color:#3d4046;max-width:50ch;}'
    +'.lg-maint-card{margin-top:26px;background:#fff;border:2px solid #151515;border-radius:16px;padding:6px 18px;box-shadow:6px 6px 0 #EDAF2F;max-width:520px;}'
    +'.lg-maint-card a{display:flex;align-items:center;gap:14px;padding:13px 2px;text-decoration:none;color:#151515;}.lg-maint-card a + a{border-top:1.5px dashed #15151533;}'
    +'.lg-maint-card .lg-ic{flex:none;width:40px;height:40px;border-radius:11px;border:2px solid #151515;background:#faf8f2;display:flex;align-items:center;justify-content:center;}.lg-maint-card .lg-ic svg{width:19px;height:19px;fill:none;stroke:#151515;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}'
    +'.lg-maint-card .lg-ic.wa{border-color:#25D366;background:#25D366;}.lg-maint-card .lg-ic.wa svg{fill:#fff;stroke:none;}'
    +'.lg-maint-card small{display:block;font-size:12px;color:#3d4046;font-weight:500;}.lg-maint-card b{font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:15px;}.lg-maint-card .lg-arrow{margin-left:auto;font-family:"Sora",system-ui,sans-serif;font-weight:800;color:#3d4046;}'
    +'.lg-maint-note{margin:26px 0 0!important;max-width:none!important;font-family:"JetBrains Mono",ui-monospace,monospace!important;font-size:12px!important;color:#3d4046;}'
    +'.lg-maint-art{display:flex;justify-content:center;}.lg-maint-art svg{display:block;width:100%;max-width:420px;height:auto;}'
    +'.lg-maint-foot{flex:none;border-top:2px solid #151515;padding:22px 0 28px;font-size:12.5px;color:#3d4046;}'
    +'.lg-maint-fwrap{max-width:1060px;margin:0 auto;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;}'
    +'.lg-maint-brand{display:flex;align-items:center;gap:9px;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:14px;color:#151515;}.lg-maint-brand svg{width:26px;height:24px;}'
    +'.lg-w-arm{transform-box:view-box;transform-origin:116px 178px;animation:lgArm .8s cubic-bezier(.5,0,.5,1) infinite;}'
    +'@keyframes lgArm{0%{transform:rotate(-40deg)}45%{transform:rotate(14deg)}55%{transform:rotate(12deg)}100%{transform:rotate(-40deg)}}'
    +'.lg-w-body{transform-box:view-box;transform-origin:98px 226px;animation:lgBody .8s cubic-bezier(.5,0,.5,1) infinite;}'
    +'@keyframes lgBody{0%{transform:rotate(-2.5deg)}45%{transform:rotate(1.5deg)}55%{transform:rotate(1.2deg)}100%{transform:rotate(-2.5deg)}}'
    +'.lg-w-sparks{opacity:0;transform-box:view-box;transform-origin:204px 176px;animation:lgSparks .8s linear infinite;}'
    +'@keyframes lgSparks{0%,42%{opacity:0;transform:scale(.5)}47%{opacity:1;transform:scale(1)}62%{opacity:1;transform:scale(1.12)}72%,100%{opacity:0;transform:scale(1.2)}}'
    +'.lg-w-sign{transform-box:fill-box;transform-origin:center;animation:lgSign .8s ease-in-out infinite;}@keyframes lgSign{0%,44%{transform:rotate(0)}50%{transform:rotate(-1.4deg)}56%{transform:rotate(1.1deg)}64%,100%{transform:rotate(0)}}'
    +'@media(max-width:900px){.lg-maint-wrap{grid-template-columns:1fr;gap:28px;padding:32px 20px;}.lg-maint-art{order:-1;}.lg-maint-art svg{max-width:300px;}.lg-maint p{font-size:16px;}.lg-maint-geo{width:150px;height:140px;right:-50px;top:-20px;opacity:.3;}.lg-maint-fwrap{padding:0 20px;}}'
    +'@media(max-width:600px){.lg-maint-bar{height:60px;padding:0 16px;}.lg-maint-bar .lg-name{display:none;}.lg-maint-tag{font-size:10px;padding:6px 9px;}}'
    +'@media (prefers-reduced-motion: reduce){.lg-w-arm,.lg-w-body,.lg-w-sparks,.lg-w-sign{animation:none;}.lg-w-arm{transform:rotate(-12deg);}.lg-w-sparks{opacity:0;}}';
  var style=document.createElement('style'); style.textContent=CSS; document.head.appendChild(style);

  /* The page's language (<html lang>: French under fr/, or as the page's setLang() chose); else English by default,
     French only when the visitor picked it on the site: ?lang=fr, or the lg_lang choice the pages save. */
  function lang(){
    if(root.lang==='fr' || root.lang==='en') return root.lang;
    var l=null; try{ l=new URLSearchParams(location.search).get('lang'); }catch(e){}
    if(l!=='en' && l!=='fr'){ try{ l=localStorage.getItem('lg_lang'); }catch(e){ l=null; } }
    return l==='fr' ? 'fr' : 'en';
  }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function loc(v){ if(!v) return {fr:'',en:''}; if(typeof v==='string') return {fr:v,en:v}; return {fr:String(v.fr||''), en:String(v.en||'')}; }
  function pick(t,L){ return (t[L]||t.fr||t.en||'').trim(); }
  function day(raw){ return (typeof raw==='string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) ? raw : null; }
  function safeUrl(u){ u=String(u||'').trim(); return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(u) ? u : ''; }
  function norm(c){
    if(!c || typeof c!=='object') return null;
    var out={};
    var m=c.maintenance; out.maintenance = (m && typeof m==='object') ? { on:!!m.on, title:loc(m.title), message:loc(m.message) } : null;
    var b=c.banner; out.banner = (b && typeof b==='object') ? { on:!!b.on, tone:(b.tone==='warn'||b.tone==='urgent')?b.tone:'info', text:loc(b.text), linkLabel:loc(b.linkLabel), linkUrl:safeUrl(b.linkUrl), from:day(b.from), to:day(b.to), dismissible:b.dismissible!==false } : null;
    return out;
  }
  function today(){ var d=new Date(), p=function(n){ return (n<10?'0':'')+n; }; return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
  function inPeriod(b){ var t=today(); return (!b.from || t>=b.from) && (!b.to || t<=b.to); }
  function sig(b){ return [b.tone, b.text.fr, b.text.en, b.from||'', b.to||''].join('|'); }
  function dismissed(b){ try{ return sessionStorage.getItem(HIDE_KEY)===sig(b); }catch(e){ return false; } }

  /* ---------- banner ---------- */
  var bar=null, onResize=null;
  function fmt(text, L){
    var i=text.indexOf(' — ');   /* older texts wrote « Head — rest »: the head stays in bold, the dash becomes a colon */
    if(i>0){ var head=text.slice(0,i); return '<b>'+esc(head)+(/[.!?:]$/.test(head)?'':(L==='fr'?'\u00a0:':':'))+'</b> '+esc(text.slice(i+3)); }
    var m=/^(.+?[.!?])\s+(\S[\s\S]*)$/.exec(text);
    return m ? '<b>'+esc(m[1])+'</b> '+esc(m[2]) : esc(text);
  }
  function layout(){
    if(!bar) return;
    root.classList.remove('lg-has-banner');
    var base=parseFloat(getComputedStyle(document.body).paddingTop)||0;
    root.style.setProperty('--lg-body-pad', base+'px');
    root.classList.add('lg-has-banner');
    root.style.setProperty('--lg-bh', bar.offsetHeight+'px');
  }
  function showBanner(b, L){
    var t=T[L], text=pick(b.text,L); if(!text){ hideBanner(); return; }
    if(!bar){ bar=document.createElement('div'); document.body.insertBefore(bar, document.body.firstChild); }
    bar.className='lg-banner lg-banner--'+b.tone; bar.setAttribute('role','region'); bar.setAttribute('aria-label', t.region);
    var label=pick(b.linkLabel,L), url=b.linkUrl;
    bar.innerHTML='<span class="lg-banner-dot" aria-hidden="true"></span><span class="lg-banner-txt">'+fmt(text, L)+'</span>'
      +((url && label) ? '<a class="lg-banner-link" href="'+esc(url)+'">'+esc(label)+' →</a>' : '')
      +(b.dismissible ? '<button type="button" class="lg-banner-x" aria-label="'+esc(t.close)+'">×</button>' : '');
    var x=bar.querySelector('.lg-banner-x');
    if(x) x.addEventListener('click', function(){ try{ sessionStorage.setItem(HIDE_KEY, sig(b)); }catch(e){} hideBanner(); });
    layout();
    if(!onResize){ var tm; onResize=function(){ clearTimeout(tm); tm=setTimeout(layout,120); }; addEventListener('resize', onResize); }
  }
  function hideBanner(){
    if(bar){ bar.remove(); bar=null; }
    root.classList.remove('lg-has-banner'); root.style.removeProperty('--lg-bh'); root.style.removeProperty('--lg-body-pad');
  }

  /* ---------- maintenance ---------- */
  var maint=null;
  function showMaint(m, L){
    var t=T[L], title=pick(m.title,L)||t.title, custom=pick(m.message,L);
    /* a message typed in Jarvis is escaped; « reach me directly » keeps its bold as on the default text */
    var msg=custom ? esc(custom).replace(/(reach me directly|me joindre directement)/i, '<strong>$1</strong>') : t.msg;
    if(!maint){ maint=document.createElement('div'); maint.className='lg-maint'; maint.setAttribute('role','dialog'); maint.setAttribute('aria-modal','true'); maint.setAttribute('aria-labelledby','lg-maint-h'); document.body.appendChild(maint); }
    var wa='https://wa.me/32479487608?text='+encodeURIComponent(t.waText);
    maint.innerHTML='<div class="lg-maint-bar">'+LOGO+'<span class="lg-name">La Goffinerie</span><span class="lg-maint-tag"><i></i>'+esc(t.tag)+'</span></div>'
      +'<div class="lg-maint-main">'+LOGO.replace('<svg ', '<svg class="lg-maint-geo" ')+'<div class="lg-maint-wrap"><div>'
      +'<div class="lg-kick">'+esc(t.kick)+'</div><h1 id="lg-maint-h" tabindex="-1">'+esc(title)+'</h1><p>'+msg+'</p>'
      +'<div class="lg-maint-card">'
      +'<a href="tel:+32479487608"><span class="lg-ic"><svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg></span><span><small>'+esc(t.call)+'</small><b>+32 479 48 76 08</b></span><span class="lg-arrow" aria-hidden="true">→</span></a>'
      +'<a href="'+wa+'" target="_blank" rel="noopener"><span class="lg-ic wa"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path d="M9.2 8.2c.2-.4.5-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2.1.4 0 .5l-.5.7c-.1.1-.2.3 0 .5a6 6 0 0 0 2.8 2.7c.2.1.4.1.5-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .4-.2 1.2-.7 1.5-.5.4-1.2.6-2 .4a9.6 9.6 0 0 1-5.4-4.4c-.7-1.2-.8-2.2-.6-2.9z" fill="#25D366"/></svg></span><span><small>'+esc(t.wa)+'</small><b>'+esc(t.wam)+'</b></span><span class="lg-arrow" aria-hidden="true">→</span></a>'
      +'<a href="mailto:info@lagoffinerie.be"><span class="lg-ic"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></span><span><small>'+esc(t.mail)+'</small><b>info@lagoffinerie.be</b></span><span class="lg-arrow" aria-hidden="true">→</span></a>'
      +'</div><p class="lg-maint-note">'+esc(t.note)+'</p></div>'
      +'<div class="lg-maint-art">'+WORKER(t.sign, t.art)+'</div></div></div>'
      +'<div class="lg-maint-foot"><div class="lg-maint-fwrap"><span class="lg-maint-brand">'+LOGO+'La Goffinerie</span><span>'+esc(t.foot)+'</span></div></div>';
    if(!root.classList.contains('lg-maint-on')){ root.classList.add('lg-maint-on'); var h=maint.querySelector('h1'); if(h) try{ h.focus({preventScroll:true}); }catch(e){} }
  }
  function hideMaint(){ if(maint){ maint.remove(); maint=null; } root.classList.remove('lg-maint-on'); }

  /* ---------- the configuration ---------- */
  var cur=null;
  function apply(c, fresh){
    var L=lang();
    var m=c && c.maintenance;
    if(fresh){ if(m && m.on) showMaint(m, L); else hideMaint(); }
    else if(maint && m && m.on) showMaint(m, L);
    var b=c && c.banner;
    if(b && b.on && inPeriod(b) && !dismissed(b)) showBanner(b, L); else hideBanner();
  }
  function load(){
    var ctrl=('AbortController' in window) ? new AbortController() : null;
    var tm=setTimeout(function(){ if(ctrl) ctrl.abort(); }, WAIT);
    return fetch(CFG_URL,{mode:'cors',credentials:'omit',cache:'no-store',signal:ctrl?ctrl.signal:undefined})
      .then(function(r){ return r.ok ? r.json() : null; }).then(norm).catch(function(){ return null; })
      .then(function(c){ clearTimeout(tm); if(c){ try{ localStorage.setItem(CFG_KEY, JSON.stringify(c)); }catch(e){} } return c; });
  }
  var cached=null; try{ cached=norm(JSON.parse(localStorage.getItem(CFG_KEY)||'null')); }catch(e){}
  if(cached){ cur=cached; apply(cur, false); }
  function refresh(){ load().then(function(c){ if(c){ cur=c; apply(cur, true); } }); }
  refresh();
  setInterval(function(){ if(!document.hidden) refresh(); }, EVERY);
  new MutationObserver(function(){ if(cur) apply(cur, !!maint); }).observe(root, {attributes:true, attributeFilter:['lang']});
})();
