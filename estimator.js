/* =========================================================
   LA GOFFINERIE — estimator.js (site v2.25)
   « Estimer mon projet » : a pop-up that asks a handful of plain
   questions, shows an indicative price range at once, then offers
   to e-mail the detail and to book the free call. Loaded by the
   home and pricing pages; opened by any [data-open-estimator].
     · every amount comes from config.js (LG_CONFIG.ESTIMATOR,
       PRICES, MONTHLY, ADDONS) — nothing is hard-coded here;
     · the result = base + modifiers, rounded to 50 €, never under
       the floor; an application, a tool or heavy automation is
       « sur devis, à partir de » instead of a range;
     · answers survive a close/reopen in the tab (sessionStorage
       lg_estimate, listed on cookies.html);
     · the request goes to Jarvis (POST /api/gf/estimate, text/plain
       like the booking form), FormSubmit carries the mail if Jarvis
       cannot, and the range stays on screen whatever happens;
     · one modal at a time: « Réserver mon appel gratuit » hands
       name, e-mail and a summary to the booking pop-up.
   ========================================================= */
(function(){
  'use strict';
  var CFG=window.LG_CONFIG||{}, EST=CFG.ESTIMATOR||null;
  if(!EST || !document.body) return;
  var JARVIS='https://jarvis.ndashiz.be', ESTIMATE_URL=JARVIS+'/api/gf/estimate', EVENTS_URL=JARVIS+'/api/gf/events';
  var KEY='lg_estimate', DNT=(navigator.doNotTrack==='1'||window.doNotTrack==='1'||navigator.globalPrivacyControl===true);
  var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root=document.documentElement;
  var L=function(){ return String(root.lang||'en').toLowerCase().indexOf('fr')===0 ? 'fr' : 'en'; };

  /* ---------- copy ---------- */
  var T={
    fr:{
      title:'Estimer mon projet', step:function(n,of){ return 'Étape '+n+' sur '+of; }, back:'Retour', next:'Continuer', skip:'Passer', close:'Fermer',
      q1:'Que voulez-vous construire ?', q1o:{site:'Un site web',app:'Une application',tool:'Un outil sur mesure'},
      q2:'Votre identité visuelle', q2o:{full:"J'ai déjà un logo et une charte",refresh:"J'ai un logo, à rafraîchir",scratch:'Je pars de zéro'}, q2n:{scratch:'via un partenaire graphiste'},
      q3:'Avez-vous déjà un site ?', q3o:{none:'Non, pas encore',rebuild:'Oui, à refaire entièrement',improve:'Oui, à améliorer'},
      q3url:'Lien de votre site', q3ph:'www.votresite.be', q3help:"Pas sûr de l'adresse ? Laissez vide.",
      q4:'Que doit faire votre site pour vous ?', q4o:{presentation:'Présenter mon activité',connected:'Travailler avec mes outils',automation:'Automatiser mon administratif'},
      q4s:{presentation:'pages, photos, coordonnées, formulaire',connected:'agenda, facturation, CRM comme Odoo, demandes qui arrivent toutes seules',automation:'rapports, relances, digest de ma boîte mail, sur mesure'},
      q5:'Quelques options', q5sub:'Tout est facultatif.',
      e1:'Une adresse e-mail à votre nom', e1s:'ex. info@votreentreprise.be', e1o:{yes:'Oui',no:'Non',have:"J'en ai déjà une"},
      e2:'Être trouvé sur Google', e2s:'SEO de base + fiche Google Business', e2o:{yes:'Oui',no:'Non'},
      e3:'Après la mise en ligne', e3o:{self:'Je le gère moi-même',hosting:'Hébergement et surveillance',full:'Formule entretien complète',unknown:'Je ne sais pas encore'},
      e4:'Nom de domaine', e4o:{have:"J'en ai déjà un",reserve:'Réservez-le pour moi'},
      result:'Votre estimation', once:'Création (une fois)', monthly:'Mensuel (optionnel)', between:function(a,b){ return 'entre '+a+' et '+b+' € HTVA'; }, quote:function(a){ return 'Sur devis, à partir de '+a+' € HTVA'; },
      zero:'0 € si vous le gérez vous-même', permonth:function(a){ return a+' €/mois'; }, permonth2:function(a,b){ return a+' à '+b+' €/mois'; }, tbd:'à définir ensemble',
      driven:"Ce qui compose l'estimation", disclaimer:'Estimation indicative. Le prix final est fixé par écrit après notre appel gratuit, sur mesure pour votre projet.',
      capture:"Recevez le détail par e-mail et réservez votre appel gratuit.", name:'Votre nom', email:'Votre e-mail', phone:'Téléphone (optionnel)',
      consent:"J'accepte que mes réponses et mes coordonnées servent à m'envoyer cette estimation et à me recontacter.", consentLink:'Protection des données',
      send:'Recevoir mon estimation', sending:'Envoi…', sent:'Estimation envoyée. Vérifiez votre boîte mail (et vos indésirables).', failed:"L'envoi a échoué. Réessayez, ou réservez directement l'appel.",
      book:'Réserver mon appel gratuit', needName:'Votre nom et votre e-mail suffisent.', needConsent:'Cochez la case pour que je puisse vous écrire.',
      summary:function(items){ return 'Estimation en ligne : '+items.join(' · '); },
      items:{ site_presentation:'Site web qui présente votre activité', site_connected:'Site web relié à vos outils', site_automation:'Site web avec automatisations sur mesure', app:'Application', tool:'Outil sur mesure',
        branding_refresh:'Rafraîchissement du logo', branding_scratch:'Logo et identité visuelle : via un partenaire graphiste, chiffré séparément', existing_improve:'Site existant à améliorer', existing_rebuild:'Site existant à refaire',
        pro_email:'Adresse e-mail à votre nom', seo_google:'SEO de base + fiche Google Business', domain_reserve:'Nom de domaine réservé pour vous (environ 10 € par an)',
        m_self:'Vous gérez le site vous-même', m_hosting:'Hébergement et surveillance', m_full:'Formule entretien complète', m_unknown:'Entretien : à décider ensemble' },
      tips:{ site:'Les pages que vos clients consultent pour vous découvrir et vous contacter.', app:'Un outil que vos clients ou votre équipe utilisent pour faire quelque chose : réserver, commander, suivre.', tool:'Un petit programme fait pour votre façon de travailler, par exemple un suivi de chantiers.',
        charte:'Vos couleurs, vos polices et la façon d\'utiliser votre logo, pour être reconnu partout.', crm:'Le carnet où vous suivez vos clients et vos demandes. Odoo en est un exemple.', integration:'Votre site parle à un outil que vous utilisez déjà, sans copier-coller.',
        automation:'Une tâche répétitive que le site fait à votre place, comme envoyer une relance.', seo:'Ce qui aide Google à montrer votre site à ceux qui cherchent votre métier.', gbp:'Votre fiche sur Google Maps, avec vos horaires, votre adresse et vos avis.',
        domain:"L'adresse de votre site, comme votreentreprise.be. Environ 10 € par an.", hosting:"L'espace qui garde votre site en ligne, comme le loyer de votre boutique.", monitoring:"Je vérifie que votre site fonctionne et je suis alerté s'il tombe." },
      tip:'Explication'
    },
    en:{
      title:'Estimate my project', step:function(n,of){ return 'Step '+n+' of '+of; }, back:'Back', next:'Continue', skip:'Skip', close:'Close',
      q1:'What do you want to build?', q1o:{site:'A website',app:'An application',tool:'A custom tool'},
      q2:'Your visual identity', q2o:{full:'I already have a logo and brand guidelines',refresh:'I have a logo, to refresh',scratch:'I start from scratch'}, q2n:{scratch:'through a partner designer'},
      q3:'Do you already have a website?', q3o:{none:'No, not yet',rebuild:'Yes, to rebuild entirely',improve:'Yes, to improve'},
      q3url:'Link to your site', q3ph:'www.yoursite.be', q3help:'Not sure of the address? Leave it empty.',
      q4:'What should your site do for you?', q4o:{presentation:'Present my business',connected:'Work with my tools',automation:'Automate my paperwork'},
      q4s:{presentation:'pages, photos, contact details, form',connected:'calendar, invoicing, a CRM like Odoo, requests that arrive on their own',automation:'reports, reminders, a digest of my inbox, tailor-made'},
      q5:'A few options', q5sub:'Everything is optional.',
      e1:'An e-mail address in your name', e1s:'e.g. info@yourbusiness.be', e1o:{yes:'Yes',no:'No',have:'I already have one'},
      e2:'Being found on Google', e2s:'basic SEO + Google Business profile', e2o:{yes:'Yes',no:'No'},
      e3:'After going live', e3o:{self:'I manage it myself',hosting:'Hosting and monitoring',full:'Full maintenance plan',unknown:"I don't know yet"},
      e4:'Domain name', e4o:{have:'I already have one',reserve:'Reserve it for me'},
      result:'Your estimate', once:'Build (one-off)', monthly:'Monthly (optional)', between:function(a,b){ return 'between €'+a+' and €'+b+' excl. VAT'; }, quote:function(a){ return 'On quote, from €'+a+' excl. VAT'; },
      zero:'€0 if you manage it yourself', permonth:function(a){ return '€'+a+'/month'; }, permonth2:function(a,b){ return '€'+a+' to €'+b+'/month'; }, tbd:'to decide together',
      driven:'What makes up the estimate', disclaimer:'Indicative estimate. The final price is set in writing after our free call, tailored to your project.',
      capture:'Get the detail by e-mail and book your free call.', name:'Your name', email:'Your e-mail', phone:'Phone (optional)',
      consent:'I agree that my answers and contact details are used to send me this estimate and to get back to me.', consentLink:'Privacy',
      send:'Send me my estimate', sending:'Sending…', sent:'Estimate sent. Check your inbox (and your spam folder).', failed:'Sending failed. Try again, or book the call directly.',
      book:'Book my free call', needName:'Your name and e-mail are enough.', needConsent:'Tick the box so I may write to you.',
      summary:function(items){ return 'Online estimate: '+items.join(' · '); },
      items:{ site_presentation:'Website that presents your business', site_connected:'Website connected to your tools', site_automation:'Website with tailor-made automations', app:'Application', tool:'Custom tool',
        branding_refresh:'Logo refresh', branding_scratch:'Logo and visual identity: through a partner designer, quoted separately', existing_improve:'Existing site to improve', existing_rebuild:'Existing site to rebuild',
        pro_email:'E-mail address in your name', seo_google:'Basic SEO + Google Business profile', domain_reserve:'Domain name reserved for you (about €10 a year)',
        m_self:'You manage the site yourself', m_hosting:'Hosting and monitoring', m_full:'Full maintenance plan', m_unknown:'Maintenance: to decide together' },
      tips:{ site:'The pages your customers visit to discover and contact you.', app:'A tool your customers or your team use to do something: book, order, track.', tool:'A small program made for the way you work, for example a job-site tracker.',
        charte:'Your colours, your fonts and how your logo is used, so you are recognised everywhere.', crm:'The book where you follow your customers and requests. Odoo is one example.', integration:'Your site talks to a tool you already use, without copy-paste.',
        automation:'A repetitive task the site does for you, like sending a reminder.', seo:'What helps Google show your site to people looking for your trade.', gbp:'Your card on Google Maps, with your hours, address and reviews.',
        domain:'The address of your site, like yourbusiness.be. About €10 a year.', hosting:'The space that keeps your site online, like the rent of your shop.', monitoring:'I check that your site works and I am alerted if it goes down.' },
      tip:'Explanation'
    }
  };

  /* ---------- state ---------- */
  var S={ step:1, a:{}, url:'', shown:false, sent:false }; var STEPS=5;
  try{ var saved=JSON.parse(sessionStorage.getItem(KEY)||'null'); if(saved && saved.a){ S.a=saved.a; S.url=saved.url||''; S.step=Math.min(Math.max(1,saved.step|0||1),STEPS+1); } }catch(e){}
  function save(){ try{ sessionStorage.setItem(KEY, JSON.stringify({a:S.a,url:S.url,step:S.step})); }catch(e){} }

  /* ---------- analytics (same channel as the page: text/plain beacons, nothing when DNT) ---------- */
  function emit(tag){
    if(DNT) return;
    if(typeof window.track==='function'){ try{ window.track('click', tag); }catch(e){} return; }
    var body=JSON.stringify({e:'click', i:tag, l:L()});
    try{ if(navigator.sendBeacon){ navigator.sendBeacon(EVENTS_URL, new Blob([body],{type:'text/plain'})); return; } }catch(e){}
    try{ fetch(EVENTS_URL,{method:'POST',mode:'cors',credentials:'omit',keepalive:true,headers:{'Content-Type':'text/plain'},body:body}).catch(function(){}); }catch(e){}
  }

  /* ---------- money ---------- */
  function fmt(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function round50(n){ return Math.round(n/50)*50; }
  function compute(){
    var a=S.a, t=T[L()], items=[], lo=0, hi=0, quote=null, partner=false;
    var base=EST.base||{}, mod=EST.modifiers||{}, mon=EST.monthly||{}, floor=EST.floor||0;
    if(a.q1==='app'){ quote=base.application; items.push('app'); }
    else if(a.q1==='tool'){ quote=base.custom_tool; items.push('tool'); }
    else {
      var p=a.q4||'presentation';
      if(p==='automation'){ quote=base.website_automation; items.push('site_automation'); }
      else { var r=p==='connected'?base.website_connected:base.website_presentation; r=r||[0,0]; lo+=r[0]; hi+=r[1]; items.push(p==='connected'?'site_connected':'site_presentation'); }
    }
    function add(key,label){ var m=mod[key]; if(!m) return; if(m.partner){ partner=true; items.push(label); return; } lo+=m[0]; hi+=m[1]; items.push(label); }
    if(a.q2==='refresh') add('branding_refresh','branding_refresh');
    if(a.q2==='scratch') add('branding_scratch','branding_scratch');
    if(a.q3==='improve') add('existing_improve','existing_improve');
    if(a.q3==='rebuild') add('existing_rebuild','existing_rebuild');
    if(a.e1==='yes') add('pro_email','pro_email');
    if(a.e2==='yes') add('seo_google','seo_google');
    if(a.e3 && a.e3!=='self' && a.e4==='reserve') items.push('domain_reserve');
    var monthly=null, mkey='m_unknown';
    if(a.e3==='self'){ monthly={zero:true}; mkey='m_self'; }
    else if(a.e3==='hosting'){ monthly={one:mon.hosting_monitoring}; mkey='m_hosting'; }
    else if(a.e3==='full'){ monthly={two:mon.full_maintenance}; mkey='m_full'; }
    items.push(mkey);
    var out={items:items, partner:partner, monthly:monthly};
    if(quote && quote.quote){ out.quote=true; out.from=Math.max(floor, round50((quote.from||0)+lo)); }
    else { out.range=[Math.max(floor, round50(lo)), Math.max(floor, round50(hi))]; if(out.range[1]<out.range[0]) out.range[1]=out.range[0]; }
    return out;
  }
  function monthlyLabel(m,t){ if(!m) return t.tbd; if(m.zero) return t.zero; if(m.one!=null) return t.permonth(fmt(m.one)); if(m.two) return t.permonth2(fmt(m.two[0]),fmt(m.two[1])); return t.tbd; }
  function onceLabel(r,t){ return r.quote ? t.quote(fmt(r.from)) : t.between(fmt(r.range[0]),fmt(r.range[1])); }

  /* ---------- DOM ---------- */
  var CSS=''
    +'.lge-bg{position:fixed;inset:0;z-index:210;background:rgba(21,21,21,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:lgeBg .25s ease both;}'
    +'.lge-bg[hidden]{display:none;}.lge-bg.closing{animation:lgeBgOut .2s ease both;}'
    +'.lge{position:relative;width:min(640px,100%);max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px);overflow:auto;background:#fff;border:2px solid #151515;border-radius:22px;padding:30px 32px 26px;box-shadow:10px 10px 0 #EDAF2F;font-family:"Instrument Sans",system-ui,sans-serif;color:#151515;animation:lgeIn .5s cubic-bezier(.22,1.4,.36,1) both;}'
    +'.lge-bg.closing .lge{animation:lgeOut .2s ease both;}'
    +'.lge-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:2px solid #151515;background:#fff;cursor:pointer;font-size:22px;line-height:1;color:#151515;font-family:"Sora",system-ui,sans-serif;display:flex;align-items:center;justify-content:center;}'
    +'.lge-head{display:flex;align-items:center;gap:12px;padding-right:48px;}'
    +'.lge-kick{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#3d4046;}'
    +'.lge-prog{display:flex;gap:5px;margin:14px 0 22px;}.lge-prog i{flex:1;height:4px;border-radius:2px;background:#15151518;}.lge-prog i.on{background:#2823EE;}'
    +'.lge h3{margin:0;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:clamp(21px,2.6vw,27px);line-height:1.15;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}'
    +'.lge-sub{margin:8px 0 0;font-size:15px;color:#3d4046;}'
    +'.lge-opts{display:grid;gap:10px;margin-top:20px;}'
    +'.lge-opt{display:flex;align-items:center;gap:14px;text-align:left;width:100%;border:2px solid #151515;border-radius:14px;background:#fff;padding:14px 16px;font:inherit;font-size:16px;color:#151515;cursor:pointer;transition:transform .15s,box-shadow .15s;}'
    +'.lge-opt:hover{transform:translate(-2px,-2px);box-shadow:4px 4px 0 #151515;}.lge-opt[aria-checked="true"]{background:#2823EE;border-color:#2823EE;color:#fff;}'
    +'.lge-opt b{font-family:"Sora",system-ui,sans-serif;font-weight:700;display:block;}.lge-opt small{display:block;font-size:13px;opacity:.8;margin-top:2px;}'
    +'.lge-opt .lge-radio{flex:none;width:20px;height:20px;border-radius:50%;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;}.lge-opt[aria-checked="true"] .lge-radio::after{content:"";width:10px;height:10px;border-radius:50%;background:#fff;}'
    +'.lge-opt .lge-txt{flex-grow:1;}'
    +'.lge-tip{flex:none;width:24px;height:24px;border-radius:50%;border:1.5px solid currentColor;background:transparent;color:inherit;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:13px;line-height:1;cursor:help;display:inline-flex;align-items:center;justify-content:center;position:relative;opacity:.8;}'
    +'.lge-tip[aria-expanded="true"]{opacity:1;}'
    +'.lge-tipbox{position:absolute;z-index:5;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%);width:min(300px,80vw);background:#151515;color:#fff;font-family:"Instrument Sans",system-ui,sans-serif;font-size:13.5px;font-weight:400;line-height:1.5;text-align:left;padding:10px 12px;border-radius:10px;box-shadow:0 10px 24px -12px rgba(0,0,0,.5);}'
    +'.lge-tipbox::after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);border:7px solid transparent;border-top-color:#151515;}'
    +'.lge-field{margin-top:16px;display:flex;flex-direction:column;gap:6px;}.lge-field label{font-family:"Sora",system-ui,sans-serif;font-weight:600;font-size:13.5px;}.lge-field input{height:48px;border:2px solid #151515;border-radius:12px;padding:0 14px;font:inherit;font-size:16px;background:#fff;color:#151515;width:100%;}'
    +'.lge-field small{font-size:12.5px;color:#3d4046;}'
    +'.lge-group{margin-top:18px;padding-top:16px;border-top:1.5px dashed #15151533;}.lge-group:first-of-type{border-top:0;padding-top:0;}.lge-group h4{margin:0;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}.lge-group .lge-sub{margin-top:2px;font-size:13.5px;}'
    +'.lge-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}.lge-chip{border:2px solid #151515;border-radius:999px;background:#fff;padding:9px 14px;font:inherit;font-size:14px;font-weight:600;color:#151515;cursor:pointer;}.lge-chip[aria-checked="true"]{background:#151515;color:#fff;}'
    +'.lge-nav{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px;flex-wrap:wrap;}'
    +'.lge-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:15px;border-radius:12px;padding:13px 22px;border:2px solid #151515;background:#fff;color:#151515;cursor:pointer;text-decoration:none;box-shadow:5px 5px 0 #15151522;transition:transform .15s,box-shadow .15s;}'
    +'.lge-btn.primary{background:#2823EE;border-color:#2823EE;color:#fff;box-shadow:5px 5px 0 #151515;}.lge-btn:hover{transform:translate(-2px,-2px);}.lge-btn:disabled{opacity:.55;cursor:default;transform:none;}'
    +'.lge-link{background:none;border:0;padding:0;font:inherit;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:14px;color:#151515;cursor:pointer;border-bottom:2px solid #2823EE;}'
    +'.lge-res{margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:12px;}'
    +'.lge-card{border:2px solid #151515;border-radius:16px;padding:16px 18px;background:#faf8f2;}.lge-card .k{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#3d4046;}.lge-card .v{margin-top:8px;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:clamp(17px,2.2vw,22px);line-height:1.2;color:#2823EE;}'
    +'.lge-items{margin:16px 0 0;padding:0;list-style:none;display:grid;gap:7px;font-size:14.5px;color:#3d4046;}.lge-items li{display:flex;gap:10px;align-items:flex-start;}.lge-items li::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:#2823EE;margin-top:7px;}'
    +'.lge-disc{margin-top:16px;padding:12px 14px;border-radius:12px;background:#EDAF2F33;border:1.5px solid #EDAF2F;font-size:13.5px;color:#151515;line-height:1.5;}'
    +'.lge-cap{margin-top:22px;padding-top:20px;border-top:2px solid #151515;}.lge-cap h4{margin:0;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:18px;}'
    +'.lge-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}.lge-row .lge-field{margin-top:12px;}'
    +'.lge-consent{display:flex;gap:10px;align-items:flex-start;margin-top:14px;font-size:13.5px;color:#3d4046;line-height:1.45;}.lge-consent input{margin-top:3px;width:18px;height:18px;flex:none;}.lge-consent a{color:#151515;font-weight:600;}'
    +'.lge-msg{margin-top:12px;font-size:14px;font-weight:600;}.lge-msg.ok{color:#1a7f3c;}.lge-msg.err{color:#E2452C;}'
    +'.lge-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;}'
    +'@keyframes lgeBg{from{opacity:0}to{opacity:1}}@keyframes lgeBgOut{from{opacity:1}to{opacity:0}}@keyframes lgeIn{from{opacity:0;transform:translateY(40px) scale(.92)}to{opacity:1;transform:none}}@keyframes lgeOut{from{opacity:1}to{opacity:0;transform:translateY(16px) scale(.97)}}'
    +'.lge-step{animation:lgeStep .32s ease both;}@keyframes lgeStep{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}'
    +'@media(max-width:640px){.lge{padding:24px 18px 20px;border-radius:18px;}.lge-bg{padding:12px;}.lge-res,.lge-row{grid-template-columns:1fr;}.lge-nav .lge-btn{flex:1 1 100%;}}'
    +'@media (prefers-reduced-motion: reduce){.lge,.lge-bg,.lge-step{animation:none!important;}}'
    +'body.lge-open{overflow:hidden;}';
  var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);

  var bg=document.createElement('div'); bg.className='lge-bg'; bg.hidden=true; bg.innerHTML='<div class="lge" role="dialog" aria-modal="true" aria-labelledby="lge-title" tabindex="-1"></div>'; document.body.appendChild(bg);
  var box=bg.querySelector('.lge'), lastFocus=null, source='';
  function esc(s){ return String(s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  /* tooltips: an « i » that opens one plain sentence on tap, hover or focus */
  function tipBtn(key){ var t=T[L()]; return key && t.tips[key] ? '<button type="button" class="lge-tip" data-tip="'+esc(key)+'" aria-label="'+esc(t.tip)+'" aria-expanded="false">i</button>' : ''; }
  function closeTips(){ box.querySelectorAll('.lge-tipbox').forEach(function(x){ x.remove(); }); box.querySelectorAll('.lge-tip[aria-expanded="true"]').forEach(function(b){ b.setAttribute('aria-expanded','false'); }); }
  function openTip(b){ closeTips(); var t=T[L()], d=document.createElement('span'); d.className='lge-tipbox'; d.setAttribute('role','tooltip'); d.textContent=t.tips[b.getAttribute('data-tip')]||''; b.appendChild(d); b.setAttribute('aria-expanded','true'); }
  box.addEventListener('click', function(e){ var b=e.target.closest('.lge-tip'); if(b){ e.preventDefault(); e.stopPropagation(); if(b.getAttribute('aria-expanded')==='true') closeTips(); else openTip(b); return; } if(!e.target.closest('.lge-tipbox')) closeTips(); });
  box.addEventListener('mouseover', function(e){ var b=e.target.closest('.lge-tip'); if(b && b.getAttribute('aria-expanded')!=='true') openTip(b); });
  box.addEventListener('mouseout', function(e){ var b=e.target.closest('.lge-tip'); if(b && !b.matches(':focus')) closeTips(); });
  box.addEventListener('focusin', function(e){ var b=e.target.closest('.lge-tip'); if(b) openTip(b); });

  function opt(group,key,label,sub,tip){ var on=S.a[group]===key; return '<button type="button" class="lge-opt" role="radio" aria-checked="'+on+'" data-g="'+group+'" data-k="'+key+'"><span class="lge-radio" aria-hidden="true"></span><span class="lge-txt"><b>'+esc(label)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+tipBtn(tip)+'</button>'; }
  function chip(group,key,label){ var on=S.a[group]===key; return '<button type="button" class="lge-chip" role="radio" aria-checked="'+on+'" data-g="'+group+'" data-k="'+key+'">'+esc(label)+'</button>'; }
  function head(n){ var t=T[L()]; var dots=''; for(var i=1;i<=STEPS;i++) dots+='<i class="'+(i<=n?'on':'')+'"></i>'; return '<div class="lge-head"><span class="lge-kick">'+esc(t.title)+' · '+esc(t.step(Math.min(n,STEPS),STEPS))+'</span></div><div class="lge-prog" aria-hidden="true">'+dots+'</div>'; }
  function navRow(opts){ var t=T[L()]; return '<div class="lge-nav">'+(opts.back?'<button type="button" class="lge-btn" data-act="back">← '+esc(t.back)+'</button>':'<span></span>')+(opts.next?'<button type="button" class="lge-btn primary" data-act="next"'+(opts.disabled?' disabled':'')+'>'+esc(opts.nextLabel||t.next)+' →</button>':'')+'</div>'; }

  function render(){
    var t=T[L()], n=S.step, h='<button type="button" class="lge-close" aria-label="'+esc(t.close)+'">×</button>';
    if(n===1){ h+=head(1)+'<h3 id="lge-title">'+esc(t.q1)+'</h3><div class="lge-opts" role="radiogroup">'+opt('q1','site',t.q1o.site,'','site')+opt('q1','app',t.q1o.app,'','app')+opt('q1','tool',t.q1o.tool,'','tool')+'</div>'+navRow({next:true,disabled:!S.a.q1}); }
    else if(n===2){ h+=head(2)+'<h3 id="lge-title">'+esc(t.q2)+' '+tipBtn('charte')+'</h3><div class="lge-opts" role="radiogroup">'+opt('q2','full',t.q2o.full)+opt('q2','refresh',t.q2o.refresh)+opt('q2','scratch',t.q2o.scratch,t.q2n.scratch)+'</div>'+navRow({back:true,next:true,nextLabel:S.a.q2?t.next:t.skip}); }
    else if(n===3){ h+=head(3)+'<h3 id="lge-title">'+esc(t.q3)+'</h3><div class="lge-opts" role="radiogroup">'+opt('q3','none',t.q3o.none)+opt('q3','rebuild',t.q3o.rebuild)+opt('q3','improve',t.q3o.improve)+'</div>'
      +((S.a.q3==='rebuild'||S.a.q3==='improve')?'<div class="lge-field"><label for="lge-url">'+esc(t.q3url)+'</label><input id="lge-url" type="url" inputmode="url" autocomplete="url" placeholder="'+esc(t.q3ph)+'" value="'+esc(S.url)+'"><small>'+esc(t.q3help)+'</small></div>':'')
      +navRow({back:true,next:true,nextLabel:S.a.q3?t.next:t.skip}); }
    else if(n===4){ h+=head(4)+'<h3 id="lge-title">'+esc(t.q4)+'</h3><div class="lge-opts" role="radiogroup">'+opt('q4','presentation',t.q4o.presentation,t.q4s.presentation,'site')+opt('q4','connected',t.q4o.connected,t.q4s.connected,'integration')+opt('q4','automation',t.q4o.automation,t.q4s.automation,'automation')+'</div>'+navRow({back:true,next:true,disabled:!S.a.q4}); }
    else if(n===5){ h+=head(5)+'<h3 id="lge-title">'+esc(t.q5)+'</h3><p class="lge-sub">'+esc(t.q5sub)+'</p>'
      +'<div class="lge-group"><h4>'+esc(t.e1)+'</h4><p class="lge-sub">'+esc(t.e1s)+'</p><div class="lge-chips" role="radiogroup">'+chip('e1','yes',t.e1o.yes)+chip('e1','no',t.e1o.no)+chip('e1','have',t.e1o.have)+'</div></div>'
      +'<div class="lge-group"><h4>'+esc(t.e2)+' '+tipBtn('seo')+tipBtn('gbp')+'</h4><p class="lge-sub">'+esc(t.e2s)+'</p><div class="lge-chips" role="radiogroup">'+chip('e2','yes',t.e2o.yes)+chip('e2','no',t.e2o.no)+'</div></div>'
      +'<div class="lge-group"><h4>'+esc(t.e3)+' '+tipBtn('hosting')+tipBtn('monitoring')+'</h4><div class="lge-chips" role="radiogroup">'+chip('e3','self',t.e3o.self)+chip('e3','hosting',t.e3o.hosting)+chip('e3','full',t.e3o.full)+chip('e3','unknown',t.e3o.unknown)+'</div>'
      +((S.a.e3&&S.a.e3!=='self')?'<div class="lge-group"><h4>'+esc(t.e4)+' '+tipBtn('domain')+'</h4><div class="lge-chips" role="radiogroup">'+chip('e4','have',t.e4o.have)+chip('e4','reserve',t.e4o.reserve)+'</div></div>':'')+'</div>'
      +navRow({back:true,next:true,nextLabel:t.result+' →'}); }
    else { h+=renderResult(); }
    box.innerHTML='<div class="lge-step">'+h+'</div>';
    var ttl=box.querySelector('#lge-title'); if(ttl && !RM){ try{ ttl.setAttribute('tabindex','-1'); ttl.focus({preventScroll:true}); }catch(e){} }
  }
  function renderResult(){
    var t=T[L()], r=compute(), items=r.items.map(function(k){ return '<li>'+esc(t.items[k]||k)+'</li>'; }).join('');
    S.shown=true; var h=head(STEPS)+'<h3 id="lge-title">'+esc(t.result)+'</h3>'
      +'<div class="lge-res"><div class="lge-card"><div class="k">'+esc(t.once)+'</div><div class="v">'+esc(onceLabel(r,t))+'</div></div><div class="lge-card"><div class="k">'+esc(t.monthly)+'</div><div class="v">'+esc(monthlyLabel(r.monthly,t))+'</div></div></div>'
      +'<div class="lge-kick" style="margin-top:18px">'+esc(t.driven)+'</div><ul class="lge-items">'+items+'</ul>'
      +'<div class="lge-disc">'+esc(t.disclaimer)+'</div>'
      +'<div class="lge-cap"><h4>'+esc(t.capture)+'</h4><form id="lge-form" novalidate><div class="lge-row"><div class="lge-field"><label for="lge-name">'+esc(t.name)+'</label><input id="lge-name" name="name" type="text" autocomplete="name" required></div><div class="lge-field"><label for="lge-email">'+esc(t.email)+'</label><input id="lge-email" name="email" type="email" autocomplete="email" inputmode="email" required></div></div>'
      +'<div class="lge-field"><label for="lge-phone">'+esc(t.phone)+'</label><input id="lge-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel"></div>'
      +'<label class="lge-consent"><input type="checkbox" id="lge-consent"><span>'+esc(t.consent)+' <a href="/donnees-personnelles.html" target="_blank" rel="noopener">'+esc(t.consentLink)+'</a></span></label>'
      +'<div class="lge-msg" aria-live="polite" id="lge-msg"></div>'
      +'<div class="lge-actions"><button type="submit" class="lge-btn primary" id="lge-send">'+esc(t.send)+'</button><button type="button" class="lge-btn" data-act="book">'+esc(t.book)+'</button></div></form></div>'
      +'<div class="lge-nav"><button type="button" class="lge-btn" data-act="back">← '+esc(t.back)+'</button><span></span></div>';
    return h;
  }

  /* ---------- flow ---------- */
  function nextStep(){
    var n=S.step;
    if(n===1 && (S.a.q1==='app'||S.a.q1==='tool')){ S.step=5; }
    else if(n===5){ S.step=STEPS+1; }
    else S.step=n+1;
    if(S.step>=2 && S.step<=5) emit('estimator_step_'+S.step);
    if(S.step===STEPS+1) emit('estimator_result_shown');
    save(); render();
  }
  function prevStep(){
    var n=S.step;
    if(n===STEPS+1) S.step=5;
    else if(n===5 && (S.a.q1==='app'||S.a.q1==='tool')) S.step=1;
    else S.step=Math.max(1,n-1);
    save(); render();
  }
  box.addEventListener('click', function(e){
    var o=e.target.closest('.lge-opt,.lge-chip');
    if(o){ var g=o.getAttribute('data-g'), k=o.getAttribute('data-k'); S.a[g]=(S.a[g]===k && o.classList.contains('lge-chip'))?undefined:k; if(g==='e3' && k==='self') delete S.a.e4; save(); if(o.classList.contains('lge-opt') && S.step<=4 && g!=='q3'){ nextStep(); } else render(); return; }
    var act=e.target.closest('[data-act]'); if(!act) return;
    var a=act.getAttribute('data-act');
    if(a==='next') nextStep(); else if(a==='back') prevStep(); else if(a==='book') toBooking();
  });
  box.addEventListener('input', function(e){ if(e.target.id==='lge-url'){ S.url=e.target.value.trim(); save(); } });
  box.addEventListener('submit', function(e){ if(e.target.id==='lge-form'){ e.preventDefault(); submit(e.target); } });
  box.addEventListener('click', function(e){ if(e.target.closest('.lge-close')) close(); });
  bg.addEventListener('click', function(e){ if(e.target===bg) close(); });
  addEventListener('keydown', function(e){
    if(bg.hidden) return;
    if(e.key==='Escape'){ close(); return; }
    if(e.key==='Tab'){ var f=box.querySelectorAll('button:not([disabled]),input,a[href],[tabindex]:not([tabindex="-1"])'); if(!f.length) return; var first=f[0], last=f[f.length-1]; if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } }
  });
  new MutationObserver(function(){ if(!bg.hidden) render(); }).observe(root,{attributes:true,attributeFilter:['lang']});

  function open(src){
    source=src||'other'; lastFocus=document.activeElement;
    /* one modal at a time: the booking pop-up gives way */
    var other=document.getElementById('leadmodal'); if(other && !other.hidden && typeof window.closeLead==='function'){ try{ window.closeLead(); }catch(e){} }
    if(S.step>STEPS && !S.a.q1) S.step=1;
    bg.hidden=false; bg.classList.remove('closing'); document.body.classList.add('lge-open');
    render(); emit('estimator_open');
    setTimeout(function(){ box.focus({preventScroll:true}); }, 50);
  }
  function close(){
    if(bg.hidden) return;
    if(!S.shown && S.step>=1) emit('estimator_abandon_step_'+Math.min(S.step,STEPS));
    var done=function(){ bg.hidden=true; bg.classList.remove('closing'); document.body.classList.remove('lge-open'); closeTips(); if(lastFocus && lastFocus.focus) try{ lastFocus.focus(); }catch(e){} };
    if(RM){ done(); return; } bg.classList.add('closing'); setTimeout(done, 190);
  }

  /* ---------- sending ---------- */
  function siteUrl(){ var u=S.url.trim(); if(!u) return ''; if(!/^https?:\/\//i.test(u)) u='https://'+u; try{ var p=new URL(u); return /^https?:$/.test(p.protocol) ? p.href.slice(0,200) : ''; }catch(e){ return ''; } }
  function payload(name,email,phone){
    var t=T[L()], r=compute(), lang=L();
    var answers={}; ['q1','q2','q3','q4','e1','e2','e3','e4'].forEach(function(k){ if(S.a[k]) answers[k]=S.a[k]; });
    var labels=r.items.map(function(k){ return t.items[k]||k; });
    var once=onceLabel(r,t), monthly=monthlyLabel(r.monthly,t);
    return {
      s:(typeof window.SESSION==='string'?window.SESSION:undefined), l:lang, via:'estimator',
      name:name, email:email, phone:phone||null,
      subject: (lang==='fr'?'Estimation en ligne : ':'Online estimate: ')+once,
      message: (lang==='fr'?'Création : ':'Build: ')+once+'\n'+(lang==='fr'?'Mensuel : ':'Monthly: ')+monthly+'\n'+labels.join('\n')+(siteUrl()?'\n'+(lang==='fr'?'Site actuel : ':'Current site: ')+siteUrl():''),
      estimate:{ answers:answers, range:r.range||null, from:r.quote?r.from:null, monthly:monthly, once:once, items:labels, siteUrl:siteUrl()||null }
    };
  }
  function postJarvis(body, ms){
    var ctrl=('AbortController' in window)?new AbortController():null; var tm=setTimeout(function(){ if(ctrl) ctrl.abort(); }, ms);
    return fetch(ESTIMATE_URL,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body),signal:ctrl?ctrl.signal:undefined})
      .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }).then(function(j){ clearTimeout(tm); return j; });
  }
  function submit(f){
    var t=T[L()], msg=f.querySelector('#lge-msg'), btn=f.querySelector('#lge-send');
    var name=(f.elements.name.value||'').trim(), email=(f.elements.email.value||'').trim(), phone=(f.elements.phone.value||'').trim();
    if(!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ msg.className='lge-msg err'; msg.textContent=t.needName; return; }
    if(!f.querySelector('#lge-consent').checked){ msg.className='lge-msg err'; msg.textContent=t.needConsent; return; }
    if(f.dataset.busy) return; f.dataset.busy='1'; btn.disabled=true; var label=btn.textContent; btn.textContent=t.sending; msg.className='lge-msg'; msg.textContent='';
    var body=payload(name,email,phone);
    postJarvis(body, 8000).then(function(r){
      var ok=!!(r && r.ok && r.mailed && r.mailed.owner);
      if(ok) return true;
      /* Jarvis down or not mailing: FormSubmit carries the mail, as the booking form does. */
      var fs=(typeof FORMSUBMIT_AJAX!=='undefined')?FORMSUBMIT_AJAX:(CFG.FORMSUBMIT||'');
      if(!fs) return !!(r && r.ok);
      return fetch(fs,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name:name,email:email,phone:phone,estimate:body.estimate.once,monthly:body.estimate.monthly,details:body.message,language:L(),_subject:'Online estimate — lagoffinerie',_template:'table',_captcha:'false'})})
        .then(function(res){ return res.json().then(function(d){ return res.ok && String(d.success)!=='false'; }); }).catch(function(){ return false; });
    }).then(function(ok){
      delete f.dataset.busy; btn.disabled=false; btn.textContent=label;
      if(ok){ S.sent=true; msg.className='lge-msg ok'; msg.textContent=t.sent; emit('estimator_email_sent'); }
      else { msg.className='lge-msg err'; msg.textContent=t.failed; }
    });
  }
  function toBooking(){
    var t=T[L()], f=box.querySelector('#lge-form'), r=compute();
    var name=f?(f.elements.name.value||'').trim():'', email=f?(f.elements.email.value||'').trim():'';
    var subject=t.summary([onceLabel(r,t)].concat(r.items.slice(0,2).map(function(k){ return t.items[k]||k; }))).slice(0,160);
    var pre={name:name,email:email,subject:subject};
    emit('estimator_to_booking');
    if(typeof window.openLead==='function'){ window.LG_PREFILL=pre; close(); setTimeout(function(){ window.openLead('book','estimator'); }, RM?0:220); return; }
    try{ sessionStorage.setItem('lg_prefill', JSON.stringify(pre)); }catch(e){}
    location.href='/?book=1#contact';
  }

  document.addEventListener('click', function(e){ var b=e.target.closest('[data-open-estimator]'); if(b){ e.preventDefault(); open(b.getAttribute('data-open-estimator')||b.getAttribute('data-track')||'button'); } });
  window.LG_ESTIMATOR={ open:open, close:close, compute:compute };
})();
