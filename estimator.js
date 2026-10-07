/* =========================================================
   LA GOFFINERIE — estimator.js (site v2.28)
   The project estimator: a pop-up of short questions that ends on
   an indicative price range, then offers to send the detail by
   e-mail and to book the free call. The first question ticks one
   or more of the three services (sites & apps, SEO & GEO, AI
   automation); the next ones depend on them (three to six steps
   in all, each asked once). Loaded by the home page and the
   pricing page right after config.js; any element carrying
   data-estimator opens it (the value says from where, for the
   statistics), and data-estimator-service="sites|seo|auto" on it
   pre-ticks that service when the visitor starts fresh. It never
   opens by itself, never moves on by itself, and never opens over
   the booking window. The owner can switch it off from Jarvis
   (site-state.js puts lg-est-off on <html>, which hides every
   data-estimator element): it then never opens at all.
     · Prices: every number comes from config.js (LG_CONFIG.estimator
       and .rates). fill() also writes the prices into the page,
       wherever an element carries data-price="…"; the pages call it
       after each language switch.
     · Answers: kept for the tab in sessionStorage (lg_estimate,
       { v:2, step, a }; an older shape is dropped), answers only. The name, e-mail and phone stay in memory, except
       for the hop from the pricing page to the booking form of the
       home page, where they are read and removed at once.
     · Sending: POST /api/gf/estimates on Jarvis (text/plain, like the
       leads) stores the prospect and sends both e-mails. If Jarvis does
       not confirm Simon's copy, FormSubmit carries it, with the
       visitor's auto-reply. The range stays on screen either way.
     · Statistics: anonymous events, through the page's track() when it
       has one (home), else the same small sender: estimator_open,
       estimator_step (i = the step number on screen, 1…6),
       estimator_result_shown, estimator_email_sent,
       estimator_to_booking, estimator_abandon (i = the step number on
       screen, or "result"). Nothing under Do Not Track / GPC.
   The Jarvis side of the contract: docs/estimator-jarvis.md.
   ========================================================= */
(function(){
  'use strict';
  if(!document.body || !window.fetch || !window.Promise) return;
  var root=document.documentElement;
  var CFG=window.LG_CONFIG||{}, E=CFG.estimator||{}, R=CFG.rates||{};
  var KEY='lg_estimate', JARVIS='https://jarvis.ndashiz.be', EST_PATH='/api/gf/estimates', EV_PATH='/api/gf/events';
  var FORMSUBMIT='https://formsubmit.co/ajax/info@lagoffinerie.be', SITE='https://lagoffinerie.be/';
  var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TXT={
    fr:{ title:'Estimer mon projet', close:'Fermer', back:'← Précédent', next:'Suivant →', skip:'Passer →', see:'Voir mon estimation →',
         step:'Étape {n} sur {t}', step1:'Étape {n}', result:'Votre estimation', optional:'Facultatif', req:'Choisissez une réponse pour continuer.',
         req_svc:'Choisissez au moins un service pour continuer.', req_svc_more:"Pas sûr ? Cochez ce qui s'en rapproche le plus, on affinera pendant l'appel.",
         what:"C'est quoi ?", tip:'Explication : ', ex:'Exemple',
         q1:'De quoi avez-vous besoin ?', h1:'Plusieurs choix possibles.',
         services_sites:'Sites web & applications', services_sites_s:'Un site, une application ou un outil sur mesure',
         services_seo:'Stratégie digitale (SEO & GEO)', services_seo_s:'Être trouvé sur Google et cité par les IA',
         services_auto:'Automatisation IA', services_auto_s:'Agenda, factures et CRM qui tournent tout seuls',
         q2:'Quel projet ?', h2:"Choisissez ce qui s'en rapproche le plus.",
         type_website:'Un site web', type_app:'Une application', type_tool:'Un outil sur mesure',
         q3:'Votre identité visuelle', h3:'Logo, couleurs, polices : où en êtes-vous ?',
         brand_have:"J'ai déjà un logo et une charte", brand_refresh:"J'ai un logo, à rafraîchir", brand_scratch:'Je pars de zéro', brand_scratch_s:'Avec un partenaire graphiste',
         q4:'Avez-vous déjà un site ?', h4:'Je peux partir de ce qui existe déjà.',
         existing_none:'Non, pas encore', existing_rebuild:'Oui, à refaire entièrement', existing_improve:'Oui, à améliorer',
         url_l:'Lien de votre site', url_ph:'www.votresite.be', url_help:"Pas sûr de l'adresse ? Laissez vide.",
         url_err:'Cette adresse semble incomplète, par exemple www.votresite.be. Pas sûr ? Laissez vide.',
         q5:'Que doit faire votre site pour vous ?', q5_auto:'Que voulez-vous automatiser ?', h5:'Plusieurs choix possibles.',
         needs_presentation:'Présenter mon activité', needs_presentation_s:'Pages, photos, coordonnées, formulaire',
         needs_connected:'Travailler avec mes outils', needs_connected_s:'Agenda, facturation, CRM comme Odoo, demandes qui arrivent toutes seules',
         needs_automation:'Automatiser mon administratif', needs_automation_s:'Rapports, relances, digest de ma boîte mail, sur mesure',
         needs_other:'Autre', other_l:'Précisez votre besoin', other_ph:'Dites-le en quelques mots',
         q6:'Quelques options', h6:'Tout est facultatif.',
         email_l:'Une adresse e-mail à votre nom', email_s:'ex. info@votreentreprise.be', email_yes:'Oui', email_no:'Non', email_have:"J'en ai déjà une",
         seo_l:'Être trouvé sur Google', seo_s:'SEO de base + fiche Google Business', seo_yes:'Oui', seo_no:'Non',
         after_l:'Après la mise en ligne', after_self:'Je le gère moi-même', after_hosting:'Hébergement et surveillance', after_full:'Formule entretien complète', after_unsure:'Je ne sais pas encore',
         domain_l:'Nom de domaine', domain_have:"J'en ai déjà un", domain_reserve:'Réservez-le pour moi',
         r_h:'Voici une première idée du prix.', r_build:'Création (une fois)', r_month:'Mensuel (optionnel)', r_items:"Ce qui compose l'estimation",
         r_range:'entre {a} et {b} HTVA', r_about:'environ {a} HTVA', r_quote:'Sur devis, à partir de {a} HTVA',
         r_self:'{a} si vous le gérez vous-même', r_pm:'{a}/mois', r_hosting_u:"{a}/mois pour l'hébergement et la surveillance", r_full_u:'{a}/mois pour la formule entretien complète',
         on_quote:'sur devis', r_quote_m:'Sur devis', r_full_q:'Formule entretien complète sur devis',
         disc:'Estimation indicative. Le prix final est fixé par écrit après notre appel gratuit, sur mesure pour votre projet.',
         cap_h:'Recevez le détail par e-mail et réservez votre appel gratuit.',
         f_name:"Votre nom ou nom d'entreprise", name_ph:'Jean Dupont ou Dupont SRL', f_email:'Votre e-mail', f_phone:'Téléphone (optionnel)',
         consent:"J'accepte que La Goffinerie utilise mes réponses et mes coordonnées pour m'envoyer cette estimation et me recontacter à son sujet. <a href=\"donnees-personnelles.html\" target=\"_blank\" rel=\"noopener\">Protection des données</a>",
         send:'Recevoir mon estimation', book:'Réserver mon appel gratuit', sending:'Envoi…',
         sent_h:"C'est envoyé{n} !", sent_p:"Le détail arrive dans votre boîte mail ; pensez à jeter un œil aux indésirables. Il ne reste qu'à réserver votre appel gratuit.",
         err:"L'envoi n'a pas abouti. Réessayez dans un instant, ou réservez directement votre appel.", restart:'Recommencer',
         i_website_presentation:'Site vitrine : présenter votre activité', i_website_connected:'Site connecté à vos outils',
         i_website_automation:'Site qui automatise votre administratif', i_application:'Application', i_custom_tool:'Outil sur mesure',
         i_branding_refresh:'Rafraîchir votre logo et votre charte graphique', i_branding_scratch:'Logo et identité visuelle via un partenaire graphiste',
         i_existing_rebuild:'Refaire entièrement votre site actuel', i_existing_improve:'Partir de votre site actuel',
         i_pro_email:'Une adresse e-mail à votre nom', i_seo_google:'Être trouvé sur Google : SEO de base et fiche Google Business',
         i_domain_reserve:'Nom de domaine réservé pour vous', i_ai_automation:'Automatisation IA', i_seo_follow:'Accompagnement suivi (contenus, GEO)',
         i_needs_other:'Autre : {x}', i_needs_other0:'Autre besoin',
         m_included:'compris', m_partner:'chiffré séparément', m_quote:'sur devis, dès {a}', m_domain:'environ {a} par an', m_call:"à voir à l'appel",
         l_services:'Services', l_type:'Projet', l_brand:'Identité visuelle', l_existing:'Site actuel', l_url:'Lien du site', l_needs:'Le site doit', l_auto:'À automatiser',
         sum:'Estimation en ligne : ', sep:' : ', list:' ; ',
         mail:"Bonjour{n},\n\nMerci pour votre demande d'estimation à La Goffinerie. En voici le détail.\n\nVos réponses\n{p}\n\nCréation (une fois) : {b}\nMensuel (optionnel) : {m}\n\nCe qui compose l'estimation\n{i}\n\nEstimation indicative. Le prix final est fixé par écrit après notre appel gratuit, sur mesure pour votre projet.\n\nRéservez votre appel gratuit ici : {u}\n\nÀ très vite,\nSimon Goffin, La Goffinerie\n+32 479 48 76 08" },
    en:{ title:'Estimate my project', close:'Close', back:'← Previous', next:'Next →', skip:'Skip →', see:'See my estimate →',
         step:'Step {n} of {t}', step1:'Step {n}', result:'Your estimate', optional:'Optional', req:'Pick an answer to continue.',
         req_svc:'Pick at least one service to continue.', req_svc_more:"Not sure? Tick the closest match, we'll fine-tune it during the call.",
         what:'What is it?', tip:'Explanation: ', ex:'Example',
         q1:'What do you need?', h1:'You can pick more than one.',
         services_sites:'Websites & apps', services_sites_s:'A website, an app or a tailor-made tool',
         services_seo:'Digital strategy (SEO & GEO)', services_seo_s:'Get found on Google and cited by AI assistants',
         services_auto:'AI automation', services_auto_s:'Calendar, invoices and CRM that run on their own',
         q2:'Which project?', h2:'Pick the closest match.',
         type_website:'A website', type_app:'An application', type_tool:'A tailor-made tool',
         q3:'Your visual identity', h3:'Logo, colours, fonts: where do you stand?',
         brand_have:'I already have a logo and brand guidelines', brand_refresh:'I have a logo, to refresh', brand_scratch:'I am starting from scratch', brand_scratch_s:'With a partner graphic designer',
         q4:'Do you already have a website?', h4:'I can start from what already exists.',
         existing_none:'No, not yet', existing_rebuild:'Yes, to rebuild entirely', existing_improve:'Yes, to improve',
         url_l:'Link to your site', url_ph:'www.yoursite.be', url_help:'Not sure of the address? Leave it empty.',
         url_err:'This address looks incomplete, for example www.yoursite.be. Not sure? Leave it empty.',
         q5:'What should your site do for you?', q5_auto:'What do you want to automate?', h5:'You can pick more than one.',
         needs_presentation:'Present my business', needs_presentation_s:'Pages, photos, contact details, form',
         needs_connected:'Work with my tools', needs_connected_s:'Calendar, invoicing, a CRM such as Odoo, requests that arrive on their own',
         needs_automation:'Automate my admin', needs_automation_s:'Reports, reminders, a digest of my inbox, tailor-made',
         needs_other:'Other', other_l:'Tell me what you need', other_ph:'In a few words',
         q6:'A few options', h6:'Everything is optional.',
         email_l:'An e-mail address in your name', email_s:'e.g. info@yourcompany.be', email_yes:'Yes', email_no:'No', email_have:'I already have one',
         seo_l:'Getting found on Google', seo_s:'Basic SEO + Google Business profile', seo_yes:'Yes', seo_no:'No',
         after_l:'After the launch', after_self:'I run it myself', after_hosting:'Hosting and monitoring', after_full:'Full maintenance plan', after_unsure:"I don't know yet",
         domain_l:'Domain name', domain_have:'I already have one', domain_reserve:'Reserve it for me',
         r_h:"Here's a first idea of the price.", r_build:'Build (one-off)', r_month:'Monthly (optional)', r_items:'What makes up the estimate',
         r_range:'between {a} and {b} excl. VAT', r_about:'about {a} excl. VAT', r_quote:'On quote, from {a} excl. VAT',
         r_self:'{a} if you run it yourself', r_pm:'{a}/month', r_hosting_u:'{a}/month for hosting and monitoring', r_full_u:'{a}/month for the full maintenance plan',
         on_quote:'on quote', r_quote_m:'On quote', r_full_q:'Full maintenance plan on quote',
         disc:'Indicative estimate. The final price is set in writing after our free call, tailored to your project.',
         cap_h:'Get the detail by e-mail and book your free call.',
         f_name:'Your name or company name', name_ph:'Jean Dupont or Dupont SRL', f_email:'Your e-mail', f_phone:'Phone (optional)',
         consent:'I agree that La Goffinerie uses my answers and contact details to send me this estimate and to get back to me about it. <a href="donnees-personnelles.html" target="_blank" rel="noopener">Data protection</a>',
         send:'Send me my estimate', book:'Book my free call', sending:'Sending…',
         sent_h:"It's on its way{n}!", sent_p:'The detail is arriving in your inbox; have a look in the spam folder too. All that is left is to book your free call.',
         err:"The estimate could not be sent. Try again in a moment, or book your call directly.", restart:'Start again',
         i_website_presentation:'Showcase site: presenting your business', i_website_connected:'Site connected to your tools',
         i_website_automation:'Site that automates your admin', i_application:'Application', i_custom_tool:'Tailor-made tool',
         i_branding_refresh:'Refreshing your logo and brand guidelines', i_branding_scratch:'Logo and visual identity through a partner graphic designer',
         i_existing_rebuild:'Rebuilding your current site entirely', i_existing_improve:'Starting from your current site',
         i_pro_email:'An e-mail address in your name', i_seo_google:'Getting found on Google: basic SEO and a Google Business profile',
         i_domain_reserve:'Domain name reserved for you', i_ai_automation:'AI automation', i_seo_follow:'Ongoing support (content, GEO)',
         i_needs_other:'Other: {x}', i_needs_other0:'Another need',
         m_included:'included', m_partner:'quoted separately', m_quote:'on quote, from {a}', m_domain:'about {a} a year', m_call:'to discuss on the call',
         l_services:'Services', l_type:'Project', l_brand:'Visual identity', l_existing:'Current site', l_url:'Site link', l_needs:'The site should', l_auto:'To automate',
         sum:'Online estimate: ', sep:': ', list:'; ',
         mail:"Hello{n},\n\nThank you for your estimate request to La Goffinerie. Here is the detail.\n\nYour answers\n{p}\n\nBuild (one-off): {b}\nMonthly (optional): {m}\n\nWhat makes up the estimate\n{i}\n\nIndicative estimate. The final price is set in writing after our free call, tailored to your project.\n\nBook your free call here: {u}\n\nSpeak soon,\nSimon Goffin, La Goffinerie\n+32 479 48 76 08" }
  };
  /* One plain sentence per technical term, and an example where the sentence has none. */
  var TIP={
    fr:{ site:{t:'Site web', d:'Les pages que vos clients consultent pour vous découvrir et vous contacter.', ex:'Par exemple : accueil, services, réalisations, contact.'},
         app:{t:'Application', d:'Un outil que vos clients ou votre équipe utilisent pour faire quelque chose : réserver, commander, suivre.'},
         tool:{t:'Outil sur mesure', d:'Un petit programme fait pour votre façon de travailler, par exemple un suivi de chantiers.'},
         charte:{t:'Charte graphique', d:'Vos couleurs, vos polices et la façon d\'utiliser votre logo, pour être reconnu partout.', ex:'Par exemple : le même bleu sur votre camionnette, vos factures et votre site.'},
         crm:{t:'CRM', d:'Le carnet où vous suivez vos clients et vos demandes. Odoo en est un exemple.'},
         integration:{t:'Intégration', d:'Votre site parle à un outil que vous utilisez déjà, sans copier-coller.', ex:'Par exemple : une demande faite sur le site arrive directement dans votre agenda.'},
         automation:{t:'Automatisation', d:'Une tâche répétitive que le site fait à votre place, comme envoyer une relance.'},
         seo:{t:'SEO', d:'Ce qui aide Google à montrer votre site à ceux qui cherchent votre métier.', ex:'Par exemple : quelqu\'un tape « électricien Liège ».'},
         gbp:{t:'Fiche Google Business', d:'Votre fiche sur Google Maps, avec vos horaires, votre adresse et vos avis.'},
         domain:{t:'Nom de domaine', d:'L\'adresse de votre site, comme votreentreprise.be. Environ {domain} par an.'},
         hosting:{t:'Hébergement', d:'L\'espace qui garde votre site en ligne, comme le loyer de votre boutique.'},
         monitoring:{t:'Surveillance', d:'Je vérifie que votre site fonctionne et je suis alerté s\'il tombe.', ex:'Par exemple : un message m\'arrive dès que la page ne répond plus.'},
         seo_geo:{t:'SEO et GEO', d:'Le SEO vous fait remonter dans Google. Le GEO vous fait citer par les assistants IA, comme ChatGPT ou Gemini.', ex:'Quelqu\'un cherche « électricien à Huy » : votre entreprise ressort.'},
         ai:{t:'Automatisation IA', d:'Votre site parle à vos outils et fait l\'administratif à votre place.', ex:'Chaque demande du formulaire crée un contact dans votre CRM.'} },
    en:{ site:{t:'Website', d:'The pages your clients visit to discover you and get in touch.', ex:'For example: home, services, work, contact.'},
         app:{t:'Application', d:'A tool your clients or your team use to get something done: book, order, track.'},
         tool:{t:'Tailor-made tool', d:'A small program made for the way you work, for example a job-site tracker.'},
         charte:{t:'Brand guidelines', d:'Your colours, your fonts and how to use your logo, so people recognise you everywhere.', ex:'For example: the same blue on your van, your invoices and your site.'},
         crm:{t:'CRM', d:'The address book where you follow your clients and their requests. Odoo is one example.'},
         integration:{t:'Integration', d:'Your site talks to a tool you already use, with no copy-paste.', ex:'For example: a request made on the site lands straight in your calendar.'},
         automation:{t:'Automation', d:'A repetitive task the site does for you, like sending a reminder.'},
         seo:{t:'SEO', d:'What helps Google show your site to people searching for your trade.', ex:'For example: someone types “electrician Liège”.'},
         gbp:{t:'Google Business profile', d:'Your listing on Google Maps, with your opening hours, your address and your reviews.'},
         domain:{t:'Domain name', d:'Your site\'s address, like yourcompany.be. About {domain} a year.'},
         hosting:{t:'Hosting', d:'The space that keeps your site online, like the rent for your shop.'},
         monitoring:{t:'Monitoring', d:'I check that your site works and I get an alert if it goes down.', ex:'For example: a message reaches me as soon as the page stops answering.'},
         seo_geo:{t:'SEO and GEO', d:'SEO moves you up in Google. GEO gets you cited by AI assistants, like ChatGPT or Gemini.', ex:'Someone searches for “electrician in Huy”: your business comes up.'},
         ai:{t:'AI automation', d:'Your site talks to your tools and does the admin for you.', ex:'Every request sent through the form creates a contact in your CRM.'} }
  };
  /* The questions, by step id (always the same id, whatever its number on screen):
     1 the services (several), 2 the project (only with « sites »), 3 the visual identity, 4 the current site,
     5 the needs (several, with « Autre »), 6 the options. Which answer each step holds, its options, the terms
     that get an explanation, and the logo shape of each service. */
  var Q={'1':'services','2':'type','3':'brand','4':'existing','5':'needs'};
  var OPTS={
    '1':[{v:'sites',tips:['site'],shape:'sq'},{v:'seo',tips:['seo_geo'],shape:'tri'},{v:'auto',tips:['ai'],shape:'ci'}],
    '2':[{v:'website',tips:['site']},{v:'app',tips:['app']},{v:'tool',tips:['tool']}],
    '3':[{v:'have',tips:['charte']},{v:'refresh'},{v:'scratch'}],
    '4':[{v:'none'},{v:'rebuild'},{v:'improve'}],
    '5':[{v:'presentation'},{v:'connected',tips:['integration','crm']},{v:'automation',tips:['automation']},{v:'other'}]
  };
  var REQUIRED={'1':1,'2':1}, OPTIONAL={'3':1,'4':1,'5':1}, ORDER=['1','2','3','4','5','6'];
  var SHAPE={ sq:'<rect x="2" y="2" width="20" height="20" rx="5" fill="#2823EE"/>', tri:'<path d="M12 2 L23 21 L1 21 Z" fill="#EDAF2F"/>',
              ci:'<circle cx="12" cy="12" r="10" fill="#E2452C"/>' };
  var CHECK='<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var EXTRAS=[
    {q:'email', v:['yes','no','have']},
    {q:'seo', v:['yes','no'], tips:['seo','gbp']},
    {q:'after', v:['self','hosting','full','unsure'], tips:['hosting','monitoring']},
    {q:'domain', v:['have','reserve'], tips:['domain']}
  ];
  var VALID={type:['website','app','tool'], brand:['have','refresh','scratch'], existing:['none','rebuild','improve'],
             email:['yes','no','have'], seo:['yes','no'], after:['self','hosting','full','unsure'], domain:['have','reserve']};
  /* The answers that take several values, kept as arrays in this order. */
  var LISTS={services:['sites','seo','auto'], needs:['presentation','connected','automation','other']};

  function lang(){ return String(root.lang||'en').toLowerCase().indexOf('fr')===0 ? 'fr' : 'en'; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmt(s, o){ return String(s).replace(/\{(\w+)\}/g, function(m,k){ return o[k]!==undefined ? o[k] : m; }); }
  function each(list, fn){ Array.prototype.forEach.call(list, fn); }
  function $(id){ return document.getElementById(id); }

  /* ---------- prices: « 1 950 € » in French, « €1,950 » in English ---------- */
  function num(n, L){
    var v=Math.abs(+n||0), s;
    try{ s=v.toLocaleString(L==='fr'?'fr-BE':'en-GB',{maximumFractionDigits:0}); }catch(e){ s=String(v); }
    return (n<0?'−':'')+s.replace(/\s/g,' ');
  }
  function money(n, L){ return L==='fr' ? num(n,L)+' €' : (n<0?'−':'')+'€'+num(Math.abs(n),L); }
  function isQuote(v){ return !!(v && typeof v==='object' && !Array.isArray(v) && v.quote); }
  function span(v, L){
    if(isQuote(v)) return TXT[L].on_quote;
    if(!Array.isArray(v)) return money(v, L);
    if(+v[0]===+v[1]) return money(v[0], L);
    return L==='fr' ? num(v[0],L)+' à '+money(v[1],L) : money(v[0],L)+' to '+money(v[1],L);
  }
  function at(path){ return path.split('.').reduce(function(o,k){ return o==null ? undefined : o[k]; }, CFG); }
  var PRICE={ vitrine:'estimator.base.website_presentation.0', connecte:'estimator.base.website_connected.0',
              self:'estimator.monthly.self_managed', hosting:'estimator.monthly.hosting_monitoring', plan:'estimator.monthly.full_maintenance',
              seo:'estimator.modifiers.seo_google', hourly:'rates.hourly', pack:'rates.pack_price', pack_hours:'rates.pack_hours',
              domain:'rates.domain_per_year' };
  function price(key, L){
    var v=PRICE[key] && at(PRICE[key]); if(v==null) return null;
    return key==='pack_hours' ? num(v, L||lang()) : span(v, L||lang());
  }
  function fill(scope){
    var L=lang();
    each((scope||document).querySelectorAll('[data-price]'), function(el){ var s=price(el.getAttribute('data-price'), L); if(s!=null) el.textContent=s; });
  }

  /* ---------- the answers, kept for the tab ---------- */
  var A={}, STEP='1', SENT=false, CAP={name:'',email:'',phone:'',consent:false};
  function clean(a){
    var out={};
    if(!a || typeof a!=='object') return out;
    for(var k in VALID){ if(VALID[k].indexOf(a[k])>=0) out[k]=a[k]; }
    for(var l in LISTS){ if(Array.isArray(a[l])) out[l]=LISTS[l].filter(function(v){ return a[l].indexOf(v)>=0; }); }
    if(typeof a.url==='string') out.url=a.url.slice(0,200);
    if(typeof a.needs_other==='string') out.needs_other=a.needs_other.slice(0,200);
    return out;
  }
  function readStore(){ try{ var s=JSON.parse(sessionStorage.getItem(KEY)||'null'); return s && typeof s==='object' ? s : {}; }catch(e){ return {}; } }
  function writeStore(s){ try{ sessionStorage.setItem(KEY, JSON.stringify(s)); }catch(e){} }
  function save(){ writeStore({v:2, step:STEP, a:A}); }
  (function(){
    var s=readStore();
    if(s.v===2){ A=clean(s.a); if(/^([1-6]|r)$/.test(s.step||'')) STEP=s.step; return; }
    /* An older shape (v1: one project type, five steps) is dropped; only a pending hop to the booking form survives. */
    if(s.v!==undefined || s.a){ if(s.book) writeStore({book:s.book}); else try{ sessionStorage.removeItem(KEY); }catch(e){} }
  })();

  function svc(k){ return !!A.services && A.services.indexOf(k)>=0; }
  function isSite(){ return svc('sites') && A.type==='website'; }               // a website build: identity, current site and needs count
  function has(list, v){ return !!list && list.indexOf(v)>=0; }
  /* The steps for the services ticked: the union of each service's own path, every step once, in ORDER.
       sites + a website   1 → 2 → 3 → 4 → 5 → 6
       sites + app or tool 1 → 2 → 6
       seo                 1 → 4 → 6
       auto                1 → 4 → 5 → 6                                                                          */
  function path(){
    var on={'1':1,'6':1};
    if(svc('sites')){ on['2']=1; if(A.type==='website'){ on['3']=on['4']=on['5']=1; } }
    if(svc('seo')) on['4']=1;
    if(svc('auto')){ on['4']=on['5']=1; }
    return ORDER.filter(function(s){ return on[s]; });
  }
  function asks(s){ return path().indexOf(s)>=0; }
  function stepNo(){ return path().indexOf(STEP)+1; }                          // the number on screen, also the one in the statistics
  function answered(s){ var q=Q[s], v=q && A[q]; return LISTS[q] ? !!(v && v.length) : !!v; }
  function hasSite(){ return A.existing==='rebuild' || A.existing==='improve'; }
  function siteUrl(){ return (asks('4') && hasSite() && A.url) ? A.url : ''; }
  function otherText(){ return (asks('5') && has(A.needs,'other') && A.needs_other) ? A.needs_other : ''; }
  function urlOk(v){ return !v || /^(https?:\/\/)?([a-z0-9¡-￿-]+\.)+[a-z¡-￿]{2,}(:\d+)?(\/\S*)?$/i.test(v); }

  /* ---------- the estimate: base + modifiers, to the nearest 50 €, never below the floor ----------
     · sites + a website: the base follows the most complete need ticked (automation > connected > presentation).
       « Autre » never sets the base: it gets its own line, « à voir à l'appel », and with « Autre » alone (or no need
       at all) the base is the showcase site, the least any website costs. With « auto » ticked too, the base is at
       least the connected site (or the automation one, when that need is ticked).
     · sites + an app or a tool: on quote, from the config base, as before.
     · auto without a website: an « Automatisation IA » line, on quote, from the low end of the connected site.
     · seo: the « seo_google » range (an add-on to a build, or the build estimate itself when nothing is built,
       then without the floor) and a « suivi » line on quote; the SEO option of the last step is then hidden.
     · the monthly part does not change: it comes from the last step. */
  function needLevel(){ var n=A.needs||[]; return has(n,'automation') ? 'automation' : has(n,'connected') ? 'connected' : has(n,'presentation') ? 'presentation' : ''; }
  function compute(){
    var base=E.base||{}, mod=E.modifiers||{}, mo=E.monthly||{}, items=[], lo=0, hi=0, quote=false, from=0, bk=null, build=false;
    function take(key, v, isMod){
      if(Array.isArray(v)){ var a=+v[0]||0, b=+v[1]||0; lo+=a; hi+=b; items.push({k:key, r:[a,b], mod:isMod}); }
      else if(v && v.quote){ quote=true; from=Math.max(from, +v.from||0); items.push({k:key, from:+v.from||0}); }
      else if(v && v.partner){ items.push({k:key, partner:true}); }
    }
    var site=isSite(), seo=svc('seo'), auto=svc('auto');
    if(svc('sites') && A.type){
      if(A.type==='app') bk='application';
      else if(A.type==='tool') bk='custom_tool';
      else { var lv=needLevel()||'presentation'; if(auto && lv==='presentation') lv='connected'; bk='website_'+lv; }
      take(bk, base[bk]); build=true;
    }
    if(site){
      if(A.brand==='refresh') take('branding_refresh', mod.branding_refresh, true);
      if(A.brand==='scratch') take('branding_scratch', mod.branding_scratch, true);
      if(A.existing==='rebuild') take('existing_rebuild', mod.existing_rebuild, true);
      if(A.existing==='improve') take('existing_improve', mod.existing_improve, true);
    }
    if(auto && !site){
      var wc=base.website_connected, low=Array.isArray(wc) ? +wc[0]||0 : (wc && +wc.from)||0;
      take('ai_automation', {quote:true, from:low}); if(!bk) bk='ai_automation'; build=true;
    }
    if(A.email==='yes') take('pro_email', mod.pro_email, true);
    if(seo){ take('seo_google', mod.seo_google, build); items.push({k:'seo_follow', onquote:true}); if(!bk) bk='seo_google'; }
    else if(A.seo==='yes') take('seo_google', mod.seo_google, true);
    if(asks('5') && has(A.needs,'other')) items.push({k:'needs_other', call:true, x:otherText()});
    if(A.after && A.after!=='self' && A.domain==='reserve' && R.domain_per_year!=null) items.push({k:'domain_reserve', yearly:+R.domain_per_year});
    var floor=build ? +E.floor||0 : 0, r50=function(x){ return Math.round(x/50)*50; };   // SEO alone: its own range, no floor
    lo=Math.max(floor, r50(lo)); hi=Math.max(lo, r50(hi)); from=Math.max(floor, r50(from));
    var m = A.after==='self' ? {k:'self', v:+mo.self_managed||0}
          : A.after==='hosting' ? {k:'hosting', v:mo.hosting_monitoring}
          : A.after==='full' ? {k:'full', v:mo.full_maintenance} : {k:'unsure'};
    return {base:bk, quote:quote, lo:lo, hi:hi, from:from, items:items, monthly:m};
  }
  function buildText(c, L){
    var t=TXT[L];
    if(c.quote) return fmt(t.r_quote, {a:money(c.from,L)});
    if(c.lo===c.hi) return fmt(t.r_about, {a:money(c.lo,L)});
    return fmt(t.r_range, {a: L==='fr' ? num(c.lo,L) : money(c.lo,L), b:money(c.hi,L)});
  }
  function monthLines(c, L){
    var t=TXT[L], mo=E.monthly||{}, k=c.monthly.k;
    if(k==='self') return [fmt(t.r_self, {a:money(c.monthly.v,L)})];
    if(k==='hosting' || k==='full') return [isQuote(c.monthly.v) ? t.r_quote_m : fmt(t.r_pm, {a:span(c.monthly.v,L)})];
    return [fmt(t.r_self, {a:money(+mo.self_managed||0,L)}), fmt(t.r_hosting_u, {a:span(mo.hosting_monitoring,L)}),
            isQuote(mo.full_maintenance) ? t.r_full_q : fmt(t.r_full_u, {a:span(mo.full_maintenance,L)})];
  }
  function monthText(c, L){
    var lines=monthLines(c, L), k=c.monthly.k, t=TXT[L];
    return (k==='hosting' || k==='full') ? lines[0]+' ('+t['after_'+k]+')' : lines.join(t.list);
  }
  function itemLabel(it, L){
    var t=TXT[L];
    if(it.k==='needs_other') return it.x ? fmt(t.i_needs_other, {x:it.x}) : t.i_needs_other0;
    return t['i_'+it.k];
  }
  function amount(it, L){
    var t=TXT[L];
    if(it.call) return t.m_call;
    if(it.onquote) return t.on_quote;
    if(it.partner) return t.m_partner;
    if(it.from!==undefined) return fmt(t.m_quote, {a:money(it.from,L)});
    if(it.yearly!==undefined) return fmt(t.m_domain, {a:money(it.yearly,L)});
    if(it.r[0]===0 && it.r[1]===0) return t.m_included;
    var s=span(it.r, L); return (it.mod && it.r[0]>=0) ? '+ '+s : s;
  }
  function servicesText(L){ return (A.services||[]).map(function(s){ return TXT[L]['services_'+s]; }).join(', '); }
  function needsText(L){
    var t=TXT[L], x=otherText();
    return (A.needs||[]).map(function(n){ return n==='other' ? (x ? fmt(t.i_needs_other, {x:x}) : t.needs_other) : t['needs_'+n]; }).join(', ');
  }
  function answerRows(L){
    var t=TXT[L], rows=[];
    function add(q, label){ if(A[q]) rows.push([label, t[q+'_'+A[q]]]); }
    if(A.services && A.services.length) rows.push([t.l_services, servicesText(L)]);
    if(svc('sites')) add('type', t.l_type);
    if(asks('3')) add('brand', t.l_brand);
    if(asks('4')){ add('existing', t.l_existing); if(siteUrl()) rows.push([t.l_url, siteUrl()]); }
    if(asks('5') && A.needs && A.needs.length) rows.push([isSite() ? t.l_needs : t.l_auto, needsText(L)]);
    add('email', t.email_l); if(!svc('seo')) add('seo', t.seo_l); add('after', t.after_l);
    if(A.after && A.after!=='self') add('domain', t.domain_l);
    return rows;
  }
  function itemsText(c, L){ return c.items.map(function(it){ return itemLabel(it,L)+' ('+amount(it,L)+')'; }).join(TXT[L].list); }
  function shortSummary(c, L){
    var t=TXT[L], lv=needLevel();
    var parts=[(A.services||[]).map(function(s){ return s==='sites' && A.type ? t['type_'+A.type] : t['services_'+s]; }).join(' + ')];
    if(isSite() && lv) parts.push(t['needs_'+lv]);
    parts.push(buildText(c,L));
    if(c.monthly.k!=='unsure') parts.push(t['after_'+c.monthly.k]+(c.monthly.k==='self' ? '' : ' '+(isQuote(c.monthly.v) ? t.on_quote : monthLines(c,L)[0])));
    return t.sum+parts.join(', ');
  }
  function bookUrl(L){ return SITE+'?book=1&lang='+L+'#contact'; }
  function mailText(c, L){
    var t=TXT[L], first=String(CAP.name||'').trim().split(/\s+/)[0];
    return fmt(t.mail, { n:first?' '+first:'', p:answerRows(L).map(function(r){ return '• '+r[0]+t.sep+r[1]; }).join('\n'),
      b:buildText(c,L), m:monthText(c,L), i:c.items.map(function(it){ return '• '+itemLabel(it,L)+t.sep+amount(it,L); }).join('\n'), u:bookUrl(L) });
  }

  /* ---------- statistics: anonymous, through the page's own track() when it has one ---------- */
  var DNT=navigator.doNotTrack==='1' || navigator.globalPrivacyControl===true;
  var OWN_SID=(function(){ var a='abcdefghijklmnopqrstuvwxyz0123456789', s=''; for(var i=0;i<12;i++) s+=a[Math.floor(Math.random()*36)]; return s; })();
  function sid(){ try{ if(typeof SESSION==='string') return SESSION; }catch(e){} return OWN_SID; }
  function crew(){ if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return true; try{ return localStorage.getItem('lg_crew')==='1'; }catch(e){ return false; } }
  function post(path, obj, beacon){
    var body=JSON.stringify(obj);
    try{
      if(beacon && navigator.sendBeacon){ navigator.sendBeacon(JARVIS+path, new Blob([body],{type:'text/plain'})); return; }
      fetch(JARVIS+path,{method:'POST',keepalive:true,mode:'cors',credentials:'omit',headers:{'Content-Type':'text/plain'},body:body}).catch(function(){});
    }catch(e){}
  }
  var seen={};
  function ev(e, i, beacon){
    if(typeof window.track==='function'){ try{ window.track(e, i, undefined, beacon); }catch(x){} return; }
    if(DNT) return;
    var p={e:e, s:sid(), l:lang()}; if(i!=null) p.i=String(i); if(crew()) p.k=1;
    post(EV_PATH, p, beacon);
  }
  function evOnce(e, i){ var k=e+':'+i; if(seen[k]) return; seen[k]=1; ev(e, i); }

  /* ---------- the window ---------- */
  var ov=null, card, body, prog, bar, btnBack, btnNext, btnX, OPEN=false, USED=false, lastFocus=null, lockY=0;
  var CSS=''
    +'.lg-est{position:fixed;inset:0;z-index:200;background:rgba(21,21,21,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:"Instrument Sans",system-ui,sans-serif;color:#151515;line-height:1.5;animation:lgEstBg .25s ease both;}'
    +'.lg-est[hidden],.lg-est [hidden]{display:none!important;}'
    +'.lg-est *{box-sizing:border-box;}'
    +'.lg-est.out{animation:lgEstBgOut .16s ease both;}'
    /* One height for every step: the buttons stay put, and an explanation opening never shifts the window under the mouse. */
    +'.lg-est-card{position:relative;width:min(620px,100%);height:min(700px,calc(100vh - 40px));height:min(700px,calc(100dvh - 40px));display:flex;flex-direction:column;background:#fff;border:2px solid #151515;border-radius:22px;box-shadow:10px 10px 0 #EDAF2F;overflow:hidden;animation:lgEstIn .5s cubic-bezier(.22,1.4,.36,1) both;outline:none;}'
    +'.lg-est-head{flex:none;position:relative;padding:18px 66px 14px 26px;border-bottom:2px solid #151515;}'
    +'.lg-est-kick{display:flex;align-items:center;gap:10px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#3d4046;}'
    +'.lg-est-kick::before{content:"";width:26px;height:2px;background:#E2452C;}'
    +'.lg-est-prog{display:block;margin-top:5px;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:14.5px;}'
    +'.lg-est-bar{position:absolute;left:0;right:0;bottom:-2px;height:4px;}'
    +'.lg-est-bar i{display:block;height:100%;width:0;background:#2823EE;transition:width .35s ease;}'
    +'.lg-est-x{position:absolute;top:14px;right:14px;width:42px;height:42px;border-radius:50%;border:2px solid #151515;background:#fff;color:#151515;cursor:pointer;font-family:"Sora",system-ui,sans-serif;font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;transition:transform .15s,box-shadow .15s;}'
    +'@media(hover:hover){.lg-est-x:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 #151515;}}'
    +'.lg-est-body{flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;overflow-anchor:none;padding:24px 26px 28px;}'
    +'.lg-est-foot{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 26px;border-top:2px solid #151515;background:#faf8f2;}'
    +'.lg-est-step{animation:lgEstStep .35s ease both;}.lg-est-step.back{animation-name:lgEstStepBack;}'
    +'.lg-est-tag{display:inline-block;margin-bottom:10px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;background:#EDAF2F2b;color:#8a6206;border-radius:6px;padding:3px 8px;}'
    +'.lg-est .lg-est-q{margin:0;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:clamp(21px,3vw,26px);line-height:1.2;letter-spacing:-.015em;outline:none;}'
    +'.lg-est-hint{margin:8px 0 0;font-size:15px;color:#3d4046;}'
    +'.lg-est-opts{display:grid;gap:12px;margin-top:20px;}'
    +'.lg-est-opt{position:relative;border:2px solid #151515;border-radius:14px;background:#fff;transition:box-shadow .15s ease,background .15s ease,border-color .15s ease;}'
    +'@media(hover:hover){.lg-est-opt:hover{box-shadow:4px 4px 0 #151515;}}'   /* no movement: the explanation chips must stay still under the mouse */
    +'.lg-est .lg-est-opt.on{border-color:#2823EE;background:#2823EE0d;box-shadow:4px 4px 0 #2823EE;}'
    +'.lg-est label.lg-est-optl{display:flex;align-items:flex-start;gap:14px;min-height:60px;margin:0;padding:17px 16px;cursor:pointer;font-family:inherit;font-weight:400;font-size:inherit;}'
    +'.lg-est input[type=radio]{position:absolute;opacity:0;width:1px;height:1px;margin:0;padding:0;border:0;pointer-events:none;}'
    +'.lg-est-dot{flex:none;width:22px;height:22px;margin-top:1px;border-radius:50%;border:2px solid #151515;background:#fff;}'
    +'.lg-est-opt.on .lg-est-dot{border-color:#2823EE;background:radial-gradient(circle,#2823EE 0 5px,#fff 5.5px);}'
    +'.lg-est input[type=radio]:focus-visible ~ .lg-est-dot{outline:3px solid #2823EE;outline-offset:3px;}'
    /* Several answers: a square box instead of the dot (the services, the needs). */
    +'.lg-est .lg-est-opt input[type=checkbox]{position:absolute;opacity:0;width:1px;height:1px;margin:0;padding:0;border:0;pointer-events:none;}'
    +'.lg-est-box{flex:none;width:22px;height:22px;margin-top:1px;border-radius:6px;border:2px solid #151515;background:#fff;display:inline-flex;align-items:center;justify-content:center;}'
    +'.lg-est-box svg{width:14px;height:14px;opacity:0;}'
    +'.lg-est-opt.on .lg-est-box{border-color:#2823EE;background:#2823EE;}.lg-est-opt.on .lg-est-box svg{opacity:1;}'
    +'.lg-est .lg-est-opt input[type=checkbox]:focus-visible ~ .lg-est-box{outline:3px solid #2823EE;outline-offset:3px;}'
    /* The services: the logo shape, and a « ? » that opens the explanation as a bubble. */
    +'.lg-est-svc{display:flex;align-items:center;gap:10px;padding-right:14px;}'
    +'.lg-est .lg-est-svc label.lg-est-optl{flex:1 1 auto;min-width:0;align-items:center;min-height:72px;padding:14px 0 14px 16px;}'
    +'.lg-est-svc .lg-est-box{margin-top:0;}'
    +'.lg-est-shape{flex:none;width:20px;height:20px;}'
    +'.lg-est-svc .lg-est-ot small{margin-top:2px;font-size:13.5px;line-height:1.4;}'
    +'.lg-est .lg-est-tip.lg-est-qm{flex:none;width:28px;height:28px;min-height:0;padding:0;justify-content:center;border:1.5px solid #151515;border-radius:50%;background:#fff;color:#151515;font-weight:700;font-size:13px;line-height:1;}'
    +'.lg-est .lg-est-tip.lg-est-qm[aria-expanded="true"]{border-color:#2823EE;background:#2823EE;color:#fff;}'
    +'.lg-est-qm:focus-visible{outline:3px solid #2823EE;outline-offset:2px;}'
    +'.lg-est .lg-est-pop{position:absolute;right:2px;top:calc(50% + 24px);z-index:5;width:min(320px,calc(100% - 4px));margin:0;padding:14px 16px;background:#fff;color:#151515;border:2px solid #151515;border-radius:12px;box-shadow:4px 4px 0 #2823EE;font-size:14px;line-height:1.5;}'
    +'.lg-est .lg-est-pop:empty{width:0;height:0;padding:0;border:0;box-shadow:none;overflow:hidden;}'
    +'.lg-est .lg-est-pop b{display:block;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:14.5px;color:#151515;}'
    +'.lg-est .lg-est-pop p{margin:4px 0 0;color:#3d4046;}'
    +'.lg-est .lg-est-pop .lg-est-ex{margin-top:10px;padding:8px 10px;border-radius:8px;background:#EDAF2F24;font-size:13.5px;line-height:1.45;color:#151515;}'
    +'.lg-est .lg-est-pop .lg-est-ex b{margin-bottom:2px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#8a6206;}'
    +'.lg-est-arrow{position:absolute;right:19px;top:-9px;width:14px;height:14px;background:#fff;border-left:2px solid #151515;border-top:2px solid #151515;transform:rotate(45deg);}'
    /* « Autre »: the free text, under its box. */
    +'.lg-est-other{padding:0 16px 14px 52px;}'
    +'.lg-est .lg-est-other input[type=text]{height:44px;background:#fff;font-size:15px;}'
    /* Next without the required answer: the options turn red, the message stays under them. */
    +'.lg-est .lg-est-opts.invalid .lg-est-opt{border-color:#E2452C;}'
    +'.lg-est-alert{display:flex;align-items:flex-start;gap:12px;margin-top:18px;padding:13px 16px;border-left:4px solid #E2452C;border-radius:0 12px 12px 0;background:#E2452C14;font-size:15px;line-height:1.5;color:#151515;}'
    +'.lg-est-alert b{font-family:"Sora",system-ui,sans-serif;font-weight:700;}'
    +'.lg-est-bang{flex:none;width:24px;height:24px;border-radius:50%;background:#E2452C;color:#fff;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:14px;line-height:24px;text-align:center;}'
    +'.lg-est-ot b{display:block;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:16.5px;line-height:1.3;}'
    +'.lg-est-ot small{display:block;margin-top:3px;font-size:14px;line-height:1.45;color:#3d4046;}'
    +'.lg-est-tips{display:flex;flex-wrap:wrap;gap:8px;margin-top:-6px;padding:0 16px 14px 52px;}'
    +'.lg-est-x5 .lg-est-tips{margin-top:10px;padding:0;}'
    +'.lg-est-tip{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:4px 12px 4px 5px;border:1.5px solid #15151559;border-radius:999px;background:#faf8f2;color:#151515;cursor:pointer;font-family:"Sora",system-ui,sans-serif;font-weight:600;font-size:12.5px;line-height:1.2;}'
    +'.lg-est-tip i{flex:none;width:20px;height:20px;border-radius:50%;background:#151515;color:#fff;font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:12px;display:inline-flex;align-items:center;justify-content:center;}'
    +'@media(hover:hover){.lg-est-tip:hover{border-color:#151515;}}'
    +'.lg-est-tip[aria-expanded="true"]{border-color:#2823EE;background:#2823EE14;}.lg-est-tip[aria-expanded="true"] i{background:#2823EE;}'
    +'.lg-est-tipbox{margin:0 16px 14px 52px;padding:12px 14px;border-radius:10px;background:#151515;color:#f3f0e6;font-size:14px;line-height:1.5;}'
    +'.lg-est-x5 .lg-est-tipbox{margin:10px 0 0;}'
    +'.lg-est-tipbox:empty{height:0;margin:0!important;padding:0;overflow:hidden;}'
    +'.lg-est-tipbox b{font-family:"Sora",system-ui,sans-serif;color:#EDAF2F;}'
    +'.lg-est-tipbox em{display:block;margin-top:4px;font-style:normal;color:#c9c7bd;}'
    +'.lg-est-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}'
    +'.lg-est-err{margin:12px 0 0;font-size:14px;font-weight:600;color:#b8321c;}'
    +'.lg-est-url{margin-top:20px;}'
    +'.lg-est label.lg-est-l,.lg-est .lg-est-f label{display:block;margin:0 0 6px;font-family:"Sora",system-ui,sans-serif;font-weight:600;font-size:13.5px;}'
    +'.lg-est input[type=text],.lg-est input[type=email],.lg-est input[type=tel]{display:block;width:100%;min-width:0;height:50px;margin:0;padding:0 14px;font-family:"Instrument Sans",system-ui,sans-serif;font-size:15.5px;color:#151515;background:#faf8f2;border:1.5px solid #15151544;border-radius:10px;-webkit-appearance:none;appearance:none;}'
    +'.lg-est input[type=text]:focus,.lg-est input[type=email]:focus,.lg-est input[type=tel]:focus{outline:2px solid #2823EE;outline-offset:1px;border-color:transparent;}'
    +'.lg-est input::placeholder{color:#8a8d96;opacity:1;}'
    +'.lg-est-help{margin:7px 0 0;font-size:13.5px;color:#3d4046;}'
    +'.lg-est-x5{margin-top:22px;padding-top:20px;border-top:1.5px dashed #15151533;}.lg-est-x5:first-of-type{margin-top:20px;padding-top:0;border-top:0;}'
    +'.lg-est-xh{font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:16.5px;line-height:1.3;}'
    +'.lg-est-xh small{display:block;margin-top:2px;font-family:"Instrument Sans",system-ui,sans-serif;font-weight:500;font-size:13.5px;color:#3d4046;}'
    +'.lg-est-pills{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;}'
    +'.lg-est label.lg-est-pill{position:relative;display:inline-flex;align-items:center;min-height:48px;margin:0;padding:0 18px;border:2px solid #151515;border-radius:999px;background:#fff;cursor:pointer;font-family:"Sora",system-ui,sans-serif;font-weight:600;font-size:14.5px;line-height:1.2;transition:background .15s,color .15s,border-color .15s;}'
    +'.lg-est label.lg-est-pill.on{background:#2823EE;border-color:#2823EE;color:#fff;}'
    +'.lg-est-pill input:focus-visible + span{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px;}'
    +'.lg-est-pill:has(input:focus-visible){outline:3px solid #2823EE;outline-offset:3px;}'
    +'.lg-est-sub{margin-top:16px;padding:14px 16px;border-left:3px solid #2823EE;background:#faf8f2;border-radius:0 12px 12px 0;}'
    +'.lg-est-sub .lg-est-xh{font-size:15px;}'
    +'.lg-est-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 22px;border:2px solid #151515;border-radius:12px;background:#fff;color:#151515;cursor:pointer;font-family:"Sora",system-ui,sans-serif;font-weight:700;font-size:15px;line-height:1.2;text-align:center;box-shadow:4px 4px 0 #15151526;transition:transform .15s ease,box-shadow .15s ease;}'
    +'@media(hover:hover){.lg-est-btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #151515;}}'
    +'.lg-est-btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #151515;}'
    +'.lg-est-btn.pri{background:#2823EE;border-color:#2823EE;color:#fff;box-shadow:4px 4px 0 #151515;}'
    +'.lg-est-btn[disabled]{opacity:.6;cursor:progress;transform:none!important;}'
    +'.lg-est-btn.lg-est-back[disabled]{opacity:.4;cursor:not-allowed;box-shadow:none;}'
    +'.lg-est-figs{display:grid;grid-template-columns:1.15fr 1fr;gap:12px;margin-top:20px;}'
    +'.lg-est-fig{padding:15px 16px;border:2px solid #151515;border-radius:14px;background:#faf8f2;}'
    +'.lg-est-fig.main{background:#2823EE;border-color:#2823EE;color:#fff;box-shadow:5px 5px 0 #151515;}'
    +'.lg-est-fl{display:block;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;opacity:.82;}'
    +'.lg-est-fv{display:block;margin-top:6px;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:20px;line-height:1.25;}'
    +'.lg-est-fig small{display:block;margin-top:4px;font-size:13.5px;opacity:.85;}'
    +'.lg-est-ml{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:5px;font-size:14px;line-height:1.4;}'
    +'.lg-est-ml li b{font-family:"Sora",system-ui,sans-serif;}'
    +'.lg-est-disc{margin:14px 0 0;padding:12px 14px;border-left:4px solid #EDAF2F;border-radius:0 10px 10px 0;background:#EDAF2F24;font-size:14px;line-height:1.5;}'
    +'.lg-est-items{margin-top:20px;}.lg-est-items .lg-est-fl{color:#3d4046;}'
    +'.lg-est-items ul{list-style:none;margin:8px 0 0;padding:0;}'
    +'.lg-est-items li{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:9px 0;border-top:1.5px dashed #15151533;font-size:14.5px;}'
    +'.lg-est-items li b{flex:none;max-width:48%;text-align:right;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:13px;font-weight:600;}'
    +'.lg-est-cap{margin-top:22px;padding:20px;border:2px solid #151515;border-radius:16px;box-shadow:6px 6px 0 #2823EE;}'
    +'.lg-est-cap h4{margin:0;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:17.5px;line-height:1.3;outline:none;}'
    +'.lg-est form{display:grid;gap:14px;margin:16px 0 0;padding:0;border:0;border-radius:0;background:none;box-shadow:none;}'
    +'.lg-est-frow{display:grid;grid-template-columns:1fr 1fr;gap:14px;}'
    +'.lg-est label.lg-est-consent{display:flex;align-items:flex-start;gap:11px;margin:0;font-family:inherit;font-weight:400;font-size:13.5px;line-height:1.45;color:#3d4046;cursor:pointer;}'
    +'.lg-est input[type=checkbox]{flex:none;display:inline-block;width:22px;height:22px;margin:0;-webkit-appearance:auto;appearance:auto;accent-color:#2823EE;cursor:pointer;}'
    +'.lg-est-consent a{color:#151515;font-weight:600;}'
    +'.lg-est-acts{display:flex;flex-wrap:wrap;gap:12px;margin-top:4px;}'
    +'.lg-est-honey{position:absolute!important;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;}'
    +'.lg-est-ok{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px;}'
    +'.lg-est-tick{flex:none;width:46px;height:46px;border-radius:50%;background:#EDAF2F;border:2px solid #151515;display:flex;align-items:center;justify-content:center;font-family:"Sora",system-ui,sans-serif;font-weight:800;font-size:21px;}'
    +'.lg-est-ok p{margin:6px 0 0;font-size:14.5px;color:#3d4046;}'
    +'.lg-est-again{margin:18px 0 0;text-align:center;}'
    +'.lg-est-link{border:0;background:none;padding:6px;cursor:pointer;font-family:"Sora",system-ui,sans-serif;font-weight:600;font-size:13.5px;color:#3d4046;text-decoration:underline;text-underline-offset:3px;}'
    +'html.lg-est-lock body{position:fixed;left:0;right:0;width:100%;overflow:hidden;}'
    +'@keyframes lgEstBg{from{opacity:0}to{opacity:1}}@keyframes lgEstBgOut{to{opacity:0}}'
    +'@keyframes lgEstIn{from{opacity:0;transform:translateY(40px) scale(.94)}to{opacity:1;transform:none}}'
    +'@keyframes lgEstUp{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}'
    +'@keyframes lgEstStep{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}'
    +'@keyframes lgEstStepBack{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}'
    +'@media(max-width:640px){'
    +  '.lg-est{padding:0;align-items:stretch;}'
    +  '.lg-est-card{width:100%;height:100%;max-height:none;border:0;border-radius:0;box-shadow:none;animation-name:lgEstUp;animation-duration:.3s;}'
    +  '.lg-est-head{padding:calc(14px + env(safe-area-inset-top)) 64px 12px 18px;}'
    +  '.lg-est-x{top:calc(10px + env(safe-area-inset-top));right:12px;width:44px;height:44px;}'
    +  '.lg-est-body{padding:20px 18px 26px;}'
    +  '.lg-est-foot{padding:12px 18px calc(12px + env(safe-area-inset-bottom));}'
    +  '.lg-est-next{flex:1;}.lg-est-back{padding:0 16px;}'
    +  '.lg-est-tips,.lg-est-tipbox{padding-left:16px;margin-left:0;}.lg-est-tipbox{margin-left:16px;}'
    +  '.lg-est-other{padding-left:16px;}'
    +  '.lg-est-figs,.lg-est-frow{grid-template-columns:1fr;}'
    +  '.lg-est-cap{padding:16px;box-shadow:5px 5px 0 #2823EE;}'
    +  '.lg-est-acts .lg-est-btn{width:100%;}'
    +  '.lg-est input[type=text],.lg-est input[type=email],.lg-est input[type=tel]{font-size:16px;}'
    +'}'
    +'@media (prefers-reduced-motion: reduce){.lg-est,.lg-est.out,.lg-est-card,.lg-est-step{animation:none!important;}.lg-est-opt,.lg-est-btn,.lg-est-bar i,.lg-est-x{transition:none!important;}}';

  function tipsHTML(keys, boxId, title, L){
    var h='<div class="lg-est-tips">';
    keys.forEach(function(k){
      var tp=TIP[L][k], same=!!title && title.toLowerCase().indexOf(tp.t.toLowerCase())>=0;   // the term is the option itself: « C'est quoi ? »
      h+='<button type="button" class="lg-est-tip" data-tip="'+k+'" aria-expanded="false" aria-controls="'+boxId+'"><i aria-hidden="true">i</i>'
        +(same ? esc(TXT[L].what)+'<span class="lg-est-vh"> '+esc(tp.t)+'</span>' : '<span class="lg-est-vh">'+esc(TXT[L].tip)+'</span>'+esc(tp.t))+'</button>';
    });
    return h+'</div><div class="lg-est-tipbox" id="'+boxId+'" aria-live="polite"></div>';
  }
  /* A service's explanation: a round « ? » beside it, the same toggle as the chips, shown as a bubble. */
  function qmHTML(k, boxId, title, L){
    return '<button type="button" class="lg-est-tip lg-est-qm" data-tip="'+k+'" aria-expanded="false" aria-controls="'+boxId+'" aria-label="'+esc(TXT[L].tip+title)+'">?</button>'
      +'<div class="lg-est-tipbox lg-est-pop" id="'+boxId+'" aria-live="polite"></div>';
  }
  function optionHTML(q, o, L){
    var t=TXT[L], multi=!!LISTS[q], on=multi ? has(A[q], o.v) : A[q]===o.v, id='lg-est-'+q+'-'+o.v,
        title=t[q+'_'+o.v], sub=t[q+'_'+o.v+'_s'], svcRow=q==='services';
    var h='<div class="lg-est-opt'+(svcRow?' lg-est-svc':'')+(on?' on':'')+'">'
      +'<label class="lg-est-optl" for="'+id+'"><input type="'+(multi?'checkbox':'radio')+'" id="'+id+'" name="lg-est-'+q+'" value="'+o.v+'"'+(on?' checked':'')+'>'
      +(multi ? '<span class="lg-est-box" aria-hidden="true">'+CHECK+'</span>' : '<span class="lg-est-dot" aria-hidden="true"></span>')
      +(o.shape ? '<svg class="lg-est-shape" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+SHAPE[o.shape]+'</svg>' : '')
      +'<span class="lg-est-ot"><b>'+esc(title)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</span></label>';
    if(o.tips) h+= svcRow ? qmHTML(o.tips[0], id+'-tip', title, L) : tipsHTML(o.tips, id+'-tip', title, L);
    if(q==='needs' && o.v==='other')
      h+='<div class="lg-est-other" id="lg-est-otherbox"'+(on?'':' hidden')+'>'
        +'<label class="lg-est-vh" for="lg-est-needs-text">'+esc(t.other_l)+'</label>'
        +'<input id="lg-est-needs-text" type="text" maxlength="200" autocomplete="off" placeholder="'+esc(t.other_ph)+'" value="'+esc(A.needs_other||'')+'"></div>';
    return h+'</div>';
  }
  function extraHTML(x, L){
    var t=TXT[L], gid='lg-est-x-'+x.q, sub=x.q==='domain';
    var h='<div class="'+(sub?'lg-est-sub':'lg-est-x5')+'" id="'+gid+'-box"'+(sub && !(A.after && A.after!=='self') ? ' hidden' : '')+'>'
      +'<div class="lg-est-xh" id="'+gid+'">'+esc(t[x.q+'_l'])+(t[x.q+'_s']?'<small>'+esc(t[x.q+'_s'])+'</small>':'')+'</div>';
    if(x.tips) h+=tipsHTML(x.tips, gid+'-tip', '', L);
    h+='<div class="lg-est-pills" role="radiogroup" aria-labelledby="'+gid+'">';
    x.v.forEach(function(v){
      var id=gid+'-'+v, on=A[x.q]===v;
      h+='<label class="lg-est-pill'+(on?' on':'')+'" for="'+id+'"><input type="radio" id="'+id+'" name="lg-est-'+x.q+'" value="'+v+'"'+(on?' checked':'')+'><span>'+esc(t[x.q+'_'+v])+'</span></label>';
    });
    h+='</div>';
    if(x.q==='after') h+=extraHTML(EXTRAS[3], L);       // the domain name: only asked when someone else than you runs the site
    return h+'</div>';
  }
  function stepHTML(s, L){
    var t=TXT[L], h='<div class="lg-est-step" data-step="'+s+'">', q=Q[s], multi=!!LISTS[q];
    if(OPTIONAL[s]) h+='<span class="lg-est-tag">'+esc(t.optional)+'</span>';
    h+='<h3 class="lg-est-q" id="lg-est-q" tabindex="-1">'+esc(s==='5' && !isSite() ? t.q5_auto : t['q'+s])+'</h3>';
    if(t['h'+s]) h+='<p class="lg-est-hint" id="lg-est-hint">'+esc(t['h'+s])+'</p>';
    if(s==='6'){                                                              // the SEO option goes when the SEO service is ticked
      h+=extraHTML(EXTRAS[0],L)+(svc('seo') ? '' : extraHTML(EXTRAS[1],L))+extraHTML(EXTRAS[2],L); return h+'</div>';
    }
    h+='<div class="lg-est-opts" id="lg-est-grp" role="'+(multi?'group':'radiogroup')+'" aria-labelledby="lg-est-q" aria-describedby="lg-est-hint">'
      +OPTS[s].map(function(o){ return optionHTML(q, o, L); }).join('')+'</div>';
    if(REQUIRED[s]) h+='<div class="lg-est-alert" id="lg-est-req" role="alert" hidden></div>';
    if(s==='4') h+='<div class="lg-est-url" id="lg-est-urlbox"'+(hasSite()?'':' hidden')+'>'
      +'<label class="lg-est-l" for="lg-est-url">'+esc(t.url_l)+'</label>'
      +'<input id="lg-est-url" type="text" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" maxlength="200" placeholder="'+esc(t.url_ph)+'" value="'+esc(A.url||'')+'" aria-describedby="lg-est-url-help">'
      +'<p class="lg-est-help" id="lg-est-url-help">'+esc(t.url_help)+'</p>'
      +'<p class="lg-est-err" id="lg-est-urlerr" role="alert" hidden>'+esc(t.url_err)+'</p></div>';
    return h+'</div>';
  }
  function capHTML(L){
    var t=TXT[L];
    if(SENT){
      var first=String(CAP.name||'').trim().split(/\s+/)[0];
      return '<div class="lg-est-ok" role="status"><span class="lg-est-tick" aria-hidden="true">✓</span><div><h4 tabindex="-1">'+esc(fmt(t.sent_h,{n:first?(L==='fr'?', ':', ')+first:''}))+'</h4><p>'+esc(t.sent_p)+'</p></div></div>'
        +'<div class="lg-est-acts"><button type="button" class="lg-est-btn pri" data-est-book>'+esc(t.book)+'</button></div>';
    }
    return '<h4 tabindex="-1">'+esc(t.cap_h)+'</h4>'
      +'<form id="lg-est-form">'
      +'<input class="lg-est-honey" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">'
      +'<div class="lg-est-frow">'
      +'<div class="lg-est-f"><label for="lg-est-name">'+esc(t.f_name)+'</label><input id="lg-est-name" name="name" type="text" placeholder="'+esc(t.name_ph)+'" autocomplete="name" autocapitalize="words" maxlength="120" required value="'+esc(CAP.name)+'"></div>'
      +'<div class="lg-est-f"><label for="lg-est-email">'+esc(t.f_email)+'</label><input id="lg-est-email" name="email" type="email" placeholder="vous@entreprise.be" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="160" required value="'+esc(CAP.email)+'"></div>'
      +'</div>'
      +'<div class="lg-est-f"><label for="lg-est-phone">'+esc(t.f_phone)+'</label><input id="lg-est-phone" name="phone" type="tel" placeholder="+32 ..." autocomplete="tel" inputmode="tel" maxlength="40" value="'+esc(CAP.phone)+'"></div>'
      +'<label class="lg-est-consent"><input type="checkbox" name="consent" required'+(CAP.consent?' checked':'')+'><span>'+t.consent+'</span></label>'
      +'<p class="lg-est-err" id="lg-est-ferr" role="alert" hidden></p>'
      +'<div class="lg-est-acts"><button type="submit" class="lg-est-btn pri">'+esc(t.send)+'</button><button type="button" class="lg-est-btn" data-est-book>'+esc(t.book)+'</button></div>'
      +'</form>';
  }
  function resultHTML(L){
    var t=TXT[L], c=compute(), k=c.monthly.k, lines=monthLines(c,L);
    var month = k==='unsure' ? '<ul class="lg-est-ml">'+lines.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('')+'</ul>'
              : '<b class="lg-est-fv">'+esc(lines[0])+'</b>'+(k==='self' ? '' : '<small>'+esc(t['after_'+k])+'</small>');
    return '<div class="lg-est-step lg-est-res" data-step="r">'
      +'<h3 class="lg-est-q" id="lg-est-q" tabindex="-1">'+esc(t.r_h)+'</h3>'
      +'<div class="lg-est-figs"><div class="lg-est-fig main"><span class="lg-est-fl">'+esc(t.r_build)+'</span><b class="lg-est-fv">'+esc(buildText(c,L))+'</b></div>'
      +'<div class="lg-est-fig"><span class="lg-est-fl">'+esc(t.r_month)+'</span>'+month+'</div></div>'
      +'<p class="lg-est-disc">'+esc(t.disc)+'</p>'
      +'<div class="lg-est-items"><span class="lg-est-fl">'+esc(t.r_items)+'</span><ul>'
      +c.items.map(function(it){ return '<li><span>'+esc(itemLabel(it,L))+'</span><b>'+esc(amount(it,L))+'</b></li>'; }).join('')+'</ul></div>'
      +'<div class="lg-est-cap" id="lg-est-cap">'+capHTML(L)+'</div>'
      +'<p class="lg-est-again"><button type="button" class="lg-est-link" data-est-restart>'+esc(t.restart)+'</button></p>'
      +'</div>';
  }

  /* A step that the answers no longer lead to, or one past an unanswered required question, falls back. */
  function fixStep(){
    var p=path(), need = !answered('1') ? '1' : (svc('sites') && !A.type) ? '2' : null;
    if(STEP!=='r' && p.indexOf(STEP)<0) STEP=p[0];
    if(need && (STEP==='r' || p.indexOf(STEP)>p.indexOf(need))) STEP=need;
  }
  function render(dir, noFocus){
    var L=lang(), t=TXT[L];
    fixStep();
    $('lg-est-title').textContent=t.title;
    btnX.setAttribute('aria-label', t.close);
    paintProg();
    closeTips();
    body.innerHTML = STEP==='r' ? resultHTML(L) : stepHTML(STEP, L);
    body.scrollTop=0;
    var st=body.firstChild; if(dir==='back' && st) st.classList.add('back'); if(!dir && st) st.style.animation='none';
    btnBack.textContent=t.back; btnBack.disabled = STEP==='1';
    btnNext.hidden = STEP==='r'; paintNext();
    each(body.querySelectorAll('.lg-est-tip'), bindTip);
    if(!noFocus){ var q=$('lg-est-q'); if(q) try{ q.focus({preventScroll:true}); }catch(e){} }
    if(STEP==='r') evOnce('estimator_result_shown', compute().quote ? 'quote' : 'range'); else evOnce('estimator_step', stepNo());
  }
  /* « Étape 1 » alone: how many steps follow depends on the services ticked there. */
  function paintProg(){
    var t=TXT[lang()], p=path(), i=p.indexOf(STEP);
    prog.textContent = STEP==='r' ? t.result : STEP==='1' ? fmt(t.step1, {n:1}) : fmt(t.step, {n:i+1, t:p.length});
    bar.style.width = (STEP==='r' ? 100 : STEP==='1' ? 100/ORDER.length : (i+1)/p.length*100)+'%';
  }
  function paintNext(){
    var t=TXT[lang()];
    btnNext.textContent = STEP==='6' ? t.see : (REQUIRED[STEP] || answered(STEP)) ? t.next : t.skip;
  }
  /* The required answer is missing: the message under the options (re-written, so that it is read out again). */
  function setReq(show){
    var e=$('lg-est-req'), g=$('lg-est-grp'), t=TXT[lang()]; if(!e) return;
    if(show){
      e.innerHTML='<span class="lg-est-bang" aria-hidden="true">!</span><span><b>'+esc(STEP==='1' ? t.req_svc : t.req)+'</b>'+(STEP==='1' ? ' '+esc(t.req_svc_more) : '')+'</span>';
      e.hidden=false;
      try{ e.scrollIntoView({block:'nearest'}); }catch(x){}
    } else { e.hidden=true; e.innerHTML=''; }
    if(g){ g.classList.toggle('invalid', show); if(show) g.setAttribute('aria-invalid','true'); else g.removeAttribute('aria-invalid');
           g.setAttribute('aria-describedby', show ? 'lg-est-hint lg-est-req' : 'lg-est-hint'); }
  }
  function go(s, dir){ STEP=s; save(); render(dir); }
  function next(){
    if(REQUIRED[STEP] && !answered(STEP)){ setReq(true); return; }
    if(STEP==='4'){ var u=$('lg-est-url'); if(u && hasSite() && !urlOk(u.value.trim())){ $('lg-est-urlerr').hidden=false; u.focus(); return; } }
    var p=path(), i=p.indexOf(STEP);
    go(i+1<p.length ? p[i+1] : 'r', 'fwd');
  }
  function back(){
    var p=path();
    if(STEP==='r'){ go(p[p.length-1], 'back'); return; }
    var i=p.indexOf(STEP); if(i>0) go(p[i-1], 'back');
  }

  /* ---------- explanations: a tap pins one open, a mouse hover shows it ---------- */
  function closeTips(except){
    if(!body) return;
    each(body.querySelectorAll('.lg-est-tip[aria-expanded="true"]'), function(b){
      if(b===except) return;
      b.setAttribute('aria-expanded','false'); b.removeAttribute('data-pinned');
      var box=$(b.getAttribute('aria-controls')); if(box) box.innerHTML='';
    });
  }
  function showTip(b, pinned){
    closeTips(b);
    var L=lang(), tp=TIP[L][b.getAttribute('data-tip')], box=$(b.getAttribute('aria-controls'));
    if(!tp || !box) return;
    var d=fmt(tp.d, {domain: price('domain', L)||''});
    if(box.classList.contains('lg-est-pop')){                               // the bubble: the example under its own « Exemple » label
      var ex=String(tp.ex||'').replace(/^(Par exemple|For example)\s*:\s*/, ''); ex=ex.charAt(0).toUpperCase()+ex.slice(1);
      box.innerHTML='<b>'+esc(tp.t)+'</b><p>'+esc(d)+'</p>'+(ex ? '<p class="lg-est-ex"><b>'+esc(TXT[L].ex)+'</b>'+esc(ex)+'</p>' : '')
        +'<span class="lg-est-arrow" aria-hidden="true"></span>';
    }
    else box.innerHTML='<b>'+esc(tp.t)+'.</b> '+esc(d)+(tp.ex ? '<em>'+esc(tp.ex)+'</em>' : '');
    b.setAttribute('aria-expanded','true');
    if(pinned) b.setAttribute('data-pinned',''); else b.removeAttribute('data-pinned');
  }
  function bindTip(b){
    b.addEventListener('click', function(e){ e.preventDefault(); if(b.hasAttribute('data-pinned')) closeTips(); else showTip(b, true); });
    b.addEventListener('pointerenter', function(e){ if(e.pointerType==='mouse' && b.getAttribute('aria-expanded')!=='true') showTip(b, false); });
    b.addEventListener('pointerleave', function(e){ if(e.pointerType==='mouse' && !b.hasAttribute('data-pinned')) closeTips(); });
  }

  /* ---------- sending ---------- */
  function readCap(f){
    CAP.name=(f.elements.name.value||'').trim(); CAP.email=(f.elements.email.value||'').trim();
    CAP.phone=(f.elements.phone.value||'').trim(); CAP.consent=!!f.elements.consent.checked;
  }
  /* Contract v2 (docs/estimator-jarvis.md): answers.services, answers.needs as a list, answers.needs_other. */
  function payload(c){
    var L=lang(), mo=c.monthly, v=mo.v;
    return {
      v:2, s:sid(), l:L, ts:new Date().toISOString(), k: crew() ? 1 : undefined,
      name:CAP.name, email:CAP.email, phone:CAP.phone||null,
      answers:{ services:(A.services||[]).slice(), type: svc('sites') ? A.type||null : null,
                branding: asks('3') ? A.brand||null : null, existing: asks('4') ? A.existing||null : null, url: siteUrl()||null,
                needs: asks('5') ? (A.needs||[]).slice() : [], needs_other: otherText()||null,
                pro_email:A.email||null, seo: svc('seo') ? 'yes' : A.seo||null, after:A.after||null,
                domain: (A.after && A.after!=='self') ? A.domain||null : null },
      estimate:{ base:c.base, quote:c.quote, min: c.quote ? null : c.lo, max: c.quote ? null : c.hi, from: c.quote ? c.from : null, currency:'EUR', vat:'excl' },
      monthly:{ option:mo.k, quote:isQuote(v), min: (v==null || isQuote(v)) ? null : (Array.isArray(v) ? +v[0] : +v), max: (v==null || isQuote(v)) ? null : (Array.isArray(v) ? +v[1] : +v) },
      items: c.items.map(function(it){ return { key:it.k, label:itemLabel(it,L), amount:amount(it,L),
        min: it.r ? it.r[0] : (it.from!==undefined ? it.from : null), max: it.r ? it.r[1] : null, partner: !!it.partner,
        quote: it.from!==undefined || !!it.onquote, call: !!it.call, yearly: it.yearly!==undefined ? it.yearly : null }; }),
      text:{ build:buildText(c,L), monthly:monthText(c,L), answers:answerRows(L), summary:shortSummary(c,L), disclaimer:TXT[L].disc, mail:mailText(c,L) },
      bookUrl: bookUrl(L)
    };
  }
  function postEstimate(obj, ms){
    var ctrl=('AbortController' in window) ? new AbortController() : null, tm=setTimeout(function(){ if(ctrl) ctrl.abort(); }, ms||8000);
    return fetch(JARVIS+EST_PATH,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'text/plain'},body:JSON.stringify(obj),signal:ctrl?ctrl.signal:undefined})
      .then(function(r){ return r.json(); }).catch(function(){ return null; })
      .then(function(x){ clearTimeout(tm); return x; });
  }
  /* Jarvis could not confirm: FormSubmit e-mails Simon (in French), and auto-replies to the visitor unless Jarvis already did. */
  function formSubmit(c, withReply){
    var L=lang(), fr=TXT.fr;
    var o={ name:CAP.name, email:CAP.email, phone:CAP.phone||'', language:L, _subject:'Nouvelle estimation en ligne, lagoffinerie', _template:'table', _captcha:'false' };
    o[fr.r_build]=buildText(c,'fr'); o[fr.r_month]=monthText(c,'fr');
    answerRows('fr').forEach(function(r){ o[r[0]]=r[1]; });
    o[fr.r_items]=itemsText(c,'fr');
    if(withReply) o._autoresponse=mailText(c, L);
    return fetch(FORMSUBMIT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(o)})
      .then(function(res){ return res.json().catch(function(){ return {}; }).then(function(d){ return res.ok && String(d.success)!=='false'; }); })
      .catch(function(){ return false; });
  }
  function paintCap(){
    var cap=$('lg-est-cap'); if(!cap) return;
    cap.innerHTML=capHTML(lang());
    var h=cap.querySelector('h4'); if(h) try{ h.focus({preventScroll:true}); }catch(e){}
  }
  function send(f){
    readCap(f);
    if(f.elements._honey.value){ SENT=true; paintCap(); return; }          // a bot filled the hidden field
    var t=TXT[lang()], btn=f.querySelector('[type=submit]'), label=btn.textContent, err=$('lg-est-ferr');
    if(err) err.hidden=true;
    btn.disabled=true; btn.textContent=t.sending; f.setAttribute('aria-busy','true');
    var c=compute(), p=payload(c);
    postEstimate(p, 8000).then(function(r){
      if(r && r.ok && r.mailed && r.mailed.owner) return 'jarvis';
      if(!(r && r.ok)) post(EST_PATH, p);                                   // keepalive retry of the copy, in case the wait was the problem
      return formSubmit(c, !(r && r.mailed && r.mailed.prospect)).then(function(ok){ return ok ? 'formsubmit' : null; });
    }).then(function(via){
      if(via){ SENT=true; ev('estimator_email_sent', via); paintCap(); return; }
      btn.disabled=false; btn.textContent=label; f.removeAttribute('aria-busy');
      if(err){ err.textContent=t.err; err.hidden=false; }
    });
  }
  /* To the booking window, pre-filled: right here on the home page, through the home page from anywhere else. */
  function toBooking(){
    var f=$('lg-est-form'); if(f) readCap(f);
    var pre={ name:CAP.name, email:CAP.email, phone:CAP.phone, subject:shortSummary(compute(), lang()) };
    ev('estimator_to_booking');
    if(typeof window.lgOpenBooking==='function'){ close('booking'); window.lgOpenBooking(pre); return; }
    var s=readStore(); s.v=2; s.a=A; s.step=STEP; s.book=pre; writeStore(s);
    close('booking');
    location.href='./?book=1#contact';
  }
  function takeHandoff(){
    var s=readStore(); if(!s.book) return null;
    var b=s.book; delete s.book; writeStore(s);
    return { name:String(b.name||''), email:String(b.email||''), phone:String(b.phone||''), subject:String(b.subject||'') };
  }

  /* ---------- open / close ---------- */
  function lock(){ lockY=window.scrollY||0; document.body.style.top=(-lockY)+'px'; root.classList.add('lg-est-lock'); }
  function unlock(){ root.classList.remove('lg-est-lock'); document.body.style.top=''; window.scrollTo({top:lockY, behavior:'instant'}); }
  function build(){
    if(ov) return;
    var st=document.createElement('style'); st.textContent=CSS; document.head.appendChild(st);
    ov=document.createElement('div'); ov.className='lg-est'; ov.hidden=true;
    ov.innerHTML='<div class="lg-est-card" role="dialog" aria-modal="true" aria-labelledby="lg-est-title" tabindex="-1">'
      +'<div class="lg-est-head"><div class="lg-est-kick" id="lg-est-title"></div><span class="lg-est-prog" id="lg-est-prog"></span>'
      +'<button type="button" class="lg-est-x" id="lg-est-x">×</button><div class="lg-est-bar" aria-hidden="true"><i></i></div></div>'
      +'<div class="lg-est-body" id="lg-est-body"></div>'
      +'<div class="lg-est-foot"><button type="button" class="lg-est-btn lg-est-back" id="lg-est-back"></button><button type="button" class="lg-est-btn pri lg-est-next" id="lg-est-next"></button></div>'
      +'</div>';
    document.body.appendChild(ov);
    card=ov.firstChild; body=$('lg-est-body'); prog=$('lg-est-prog'); bar=ov.querySelector('.lg-est-bar i');
    btnBack=$('lg-est-back'); btnNext=$('lg-est-next'); btnX=$('lg-est-x');
    btnX.addEventListener('click', function(){ close('x'); });
    btnNext.addEventListener('click', next);
    btnBack.addEventListener('click', back);
    ov.addEventListener('click', function(e){ if(e.target===ov) close('bg'); });
    /* Choosing an answer never moves on by itself: Next (or Skip) does. */
    body.addEventListener('change', function(e){
      var el=e.target; if((el.type!=='radio' && el.type!=='checkbox') || !el.name || el.name.indexOf('lg-est-')!==0) return;
      var q=el.name.slice(7), group=body.querySelectorAll('input[name="'+el.name+'"]');
      if(LISTS[q]){ var list=[]; each(group, function(c){ if(c.checked) list.push(c.value); }); A[q]=list; }
      else A[q]=el.value;
      save();
      each(group, function(r){ var box=r.closest('.lg-est-opt,.lg-est-pill'); if(box) box.classList.toggle('on', r.checked); });
      if(REQUIRED[STEP] && Q[STEP]===q){ if(answered(STEP)) setReq(false); paintProg(); }   // the services and the project set how many steps follow
      if(q==='needs'){
        var ob=$('lg-est-otherbox'), oi=$('lg-est-needs-text'), on=has(A.needs,'other');
        if(ob) ob.hidden=!on;
        if(on && el.value==='other' && el.checked && oi) try{ oi.focus({preventScroll:true}); oi.scrollIntoView({block:'nearest'}); }catch(x){}
      }
      if(q==='existing'){ var ub=$('lg-est-urlbox'); if(ub) ub.hidden=!hasSite(); }
      if(q==='after'){ var db=$('lg-est-x-domain-box'); if(db) db.hidden=!(A.after && A.after!=='self'); }
      paintNext();
    });
    body.addEventListener('input', function(e){
      if(e.target.id==='lg-est-url'){ A.url=e.target.value.trim().slice(0,200); save(); $('lg-est-urlerr').hidden=true; }
      if(e.target.id==='lg-est-needs-text'){ A.needs_other=e.target.value.trim().slice(0,200); save(); }
      var f=e.target.form; if(f && f.id==='lg-est-form') readCap(f);
    });
    body.addEventListener('click', function(e){
      var t=e.target.closest ? e.target : null; if(!t) return;
      if(t.closest('[data-est-book]')){ e.preventDefault(); toBooking(); }
      else if(t.closest('[data-est-restart]')){ A={}; SENT=false; go('1', 'back'); }
    });
    body.addEventListener('submit', function(e){ if(e.target.id==='lg-est-form'){ e.preventDefault(); send(e.target); } });
    /* Escape closes (an open explanation first); Tab stays inside the window. */
    document.addEventListener('keydown', function(e){
      if(!OPEN) return;
      if(e.key==='Escape'){ e.stopPropagation(); if(body.querySelector('.lg-est-tip[aria-expanded="true"]')) closeTips(); else close('esc'); return; }
      if(e.key!=='Tab') return;
      var f=[].filter.call(ov.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'), function(el){
        return !el.disabled && el.offsetParent!==null && !el.classList.contains('lg-est-honey') && getComputedStyle(el).visibility!=='hidden'
          && !(el.type==='radio' && !el.checked && ov.querySelector('input[name="'+el.name+'"]:checked'));
      });
      if(!f.length) return;
      var first=f[0], last=f[f.length-1], a=document.activeElement;
      if(!ov.contains(a)){ e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if(e.shiftKey && (a===first || a===card || a.id==='lg-est-q')){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && a===last){ e.preventDefault(); first.focus(); }
    });
    new MutationObserver(function(){ if(OPEN) render(null, true); }).observe(root, {attributes:true, attributeFilter:['lang']});
    addEventListener('pagehide', function(){ if(OPEN && !SENT) ev('estimator_abandon', STEP==='r' ? 'result' : stepNo(), true); });
  }
  /* service: « sites », « seo » or « auto » (data-estimator-service on a service page's button), ticked only on a fresh start. */
  function open(source, service){
    if(OPEN) return;
    if(root.classList.contains('lg-est-off')) return;                     // switched off in Jarvis (site-state.js)
    if(document.querySelector('.modal-bg:not([hidden])')) return;          // one window at a time: never over the booking form
    build();
    if(LISTS.services.indexOf(service)>=0 && !answered('1')){ A.services=[service]; STEP='1'; save(); }
    OPEN=true; USED=true; lastFocus=document.activeElement;
    ov.classList.remove('out'); ov.hidden=false; lock();
    ev('estimator_open', source || 'other');
    render('fwd');
  }
  function close(how){
    if(!OPEN) return;
    if(how!=='booking' && !SENT) ev('estimator_abandon', STEP==='r' ? 'result' : stepNo());
    OPEN=false; closeTips();
    var done=function(){ ov.hidden=true; ov.classList.remove('out'); unlock(); if(how!=='booking' && lastFocus && lastFocus.focus) try{ lastFocus.focus({preventScroll:true}); }catch(e){} };
    if(RM || how==='booking') done(); else { ov.classList.add('out'); setTimeout(done, 160); }
  }

  document.addEventListener('click', function(e){
    var el=e.target.closest && e.target.closest('[data-estimator]'); if(!el) return;
    e.preventDefault(); open(el.getAttribute('data-estimator'), el.getAttribute('data-estimator-service'));
  });
  window.LGEstimator={ open:open, close:close, isOpen:function(){ return OPEN; }, used:function(){ return USED; },
                       fill:fill, price:price, takeHandoff:takeHandoff };
  fill();
})();
