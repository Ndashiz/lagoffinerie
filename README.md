# La Goffinerie — lagoffinerie.be

Marketing site of La Goffinerie (websites and dedicated solutions for Belgian small businesses).
Static pages, vanilla HTML/CSS/JS, bilingual EN/FR (auto-detected, manual toggle).

- **Prod**: <https://lagoffinerie.be/> — GitHub Pages from `main`, custom domain in `CNAME`.
  A push to `main` deploys in 1–2 minutes.
- **Files**: `index.html` (home: hero, the work as a carousel, one project at a time, each in the colour of its main service with a chip per service, the scroll-driven method, the three packages in `#pricing`,
  FAQ, contact and its form), `work.html` (all the work, one case per project), `pricing.html` (retired: a tiny
  `noindex` page that sends old links to `./#pricing`, by meta refresh and `location.replace`, out of the
  sitemap; the former full page is in the git history), `about.html`, the legal pages
  (`mentions-legales.html`, `cgu.html`, `donnees-personnelles.html`, `cookies.html` — keep it true),
  `404.html`, `robots.txt`, `sitemap.xml`.
- **Site state**: `site-state.js`, loaded by every page — reads the public `GET /api/gf/config` of Jarvis
  (the call the home page already makes for its logo intro) and renders what the owner switched on there:
  a full-screen maintenance screen (fresh answers only, re-checked every 60 s, fail-open) and an announcement
  banner above the top bar (three tones, optional link, period, × for the visit). Keys `lg_site_cfg` and
  `lg_banner` are listed on `cookies.html`. `404.html` is the GitHub Pages not-found page, in the site's style.
- **Config**: `config.js` holds **every price** of the site (euros excl. VAT, `[TBC]` marks the defaults
  still to confirm): `packages` (the three packages shown on the home page: Essentiel and Pro, a build
  price and an indicative monthly fee each; Sur mesure on quote), `addons` (SEO basics, visual identity,
  professional e-mail), `rates` (hourly rate, 5-hour pack, domain name) and
  `BOOKING_URL` (shows the « choose a slot now » buttons). The amounts are **pre-rendered** in the HTML, so
  they are in the page source (search engines, link previews, « view source »): every element carrying
  `data-price="…"`, the French dictionaries, the `<meta data-price-tpl="… {key} …">` descriptions and the
  JSON-LD. **After any price change in `config.js`, run `node tools/prerender-prices.mjs`**
  (`--check` changes nothing and exits 1 if a page is out of date). `estimator.js` writes the same amounts
  at run time, in the language's format.
  `assets/work/*.jpg` are the project screenshots of the home page's work section (in a browser window) and of the cases;
  `assets/work/*-mobile.jpg` are the real phone pages shown in the phone frame (390×830 at 2x, JPEG; each project run
  locally with its fictional demo data, Bravo Reno taken from bravoreno.be itself, cookie banner refused).
- **Estimator**: `estimator.js`, loaded by the home and service pages right after `config.js` (on the other
  pages, `nav.js` loads both on the first click of « Get a quote » in the top bar) — a pop-up
  that starts from the three services (several can be ticked) and asks only the questions they need, up to six
  (any `data-estimator` element opens it, never by itself; `data-estimator-service`
  pre-ticks a service)
  that recommends one of the three packages (Sur mesure as soon as the project needs tools, automation or an
  app) with its price and the ticked add-ons, then sends the detail by e-mail (`POST /api/gf/estimates` on
  Jarvis, FormSubmit as fallback) or hands over to the contact form of the home page, pre-filled and scrolled
  into view (`/?book=1` from the other pages and from the estimate e-mail). Answers are kept for the tab in
  `lg_estimate`. The Jarvis side is specified in `docs/estimator-jarvis.md`.
- **Services**: one page per service, `websites.html`, `digital-strategy.html` and `ai-automation.html`, each with
  its own editorial FAQ (six questions at most) and FAQPage JSON-LD. `nav.js`, loaded on every page, runs the
  top bar (Services · Work · Pricing · FAQ, then « Get a quote » / « Demander un devis », which opens the estimator;
  « Pricing » leads to `./#pricing` on the home page, `/#pricing` from the 404):
  it turns « Services » into a menu of the three pages, loads the estimator where the page lacks it, and floats
  the bar once the page has moved. On a phone (900 px and below) the bar keeps the logo and its name, a short
  « Quote » / « Devis » pill and a menu button; the menu is a full-screen sheet built by `nav.js` (the three
  services, Work, Pricing, FAQ, the language switch, « Get a quote » and « Book my free call »), and each page's
  bottom bar (`.bottombar`) becomes a floating dark dock whose entry lights up for the page (Work) or, on the
  home page, for the section in view (#work, #pricing, #contact). The buttons are flat with a soft shadow; the offset
  block shadows stay on cards, panels and illustrations.
- **Contact form**: always in the page (`#contact`, no pop-up): every « Book my free call » button scrolls to it
  (the packages pre-fill « What can I help with? »), the day and time of the call are optional, and a sent request
  folds into a paper plane before the thanks show in the card. FormSubmit (AJAX with a plain-POST fallback
  returning to `/?sent=1#contact`) plus a copy posted to Jarvis.
- **Audience & leads**: posted from the visitor's browser to Jarvis (`jarvis.ndashiz.be/api/gf/*`)
  as CORS *simple requests* (`Content-Type: text/plain`, never JSON — Jarvis's global CORS refuses
  every preflight). The owner console is Jarvis → « La Goffinerie »; the contract is documented in
  the Jarvis repo, `docs/17-goffinerie-tracking.md`.
- **Own devices**: open `https://lagoffinerie.be/?crew=goffinerie` once per device to keep your
  visits out of the statistics (`?crew=off` to disarm). `localhost` is always excluded.

Whatever changes in what the page measures must first be reflected in `cookies.html`.
