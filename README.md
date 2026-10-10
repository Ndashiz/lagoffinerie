# La Goffinerie — lagoffinerie.be

Marketing site of La Goffinerie (websites and dedicated solutions for Belgian small businesses).
Static pages, vanilla HTML/CSS/JS, bilingual: English at the root (`/x.html`), French under `fr/` (`/fr/x.html`),
generated from the English pages (see « French pages » below).

- **Prod**: <https://lagoffinerie.be/> — GitHub Pages from `main`, custom domain in `CNAME`.
  A push to `main` deploys in 1–2 minutes.
- **Files**: `index.html` (home: hero, the work as a carousel, one project at a time, each in the colour of its main service with a chip per service, the scroll-driven method, the three packages in `#pricing`,
  FAQ, contact and its form), `work.html` (all the work, one case per project), `pricing.html` (retired: a tiny
  `noindex` page that sends old links to `./#pricing`, by meta refresh and `location.replace`, out of the
  sitemap; the former full page is in the git history), `about.html`, the legal pages
  (`mentions-legales.html`, `cgu.html`, `donnees-personnelles.html`, `cookies.html` — keep it true),
  `404.html`, `robots.txt`, `sitemap.xml`; `fr/` holds the French copy of every page above (except `pricing.html`
  and the 404), **generated, never edited by hand**.
- **French pages**: `fr/*.html` are written by `node tools/build-fr.mjs` from the English page and the `FR`
  dictionary it carries (the one `setLang()` uses): every `data-i18n` text, alt, placeholder and aria-label in
  French, `<html lang="fr">`, the French title, description and Open Graph tags (`FR.title`, `FR.desc`,
  `FR.og_title`, `FR.og_desc`; a `{key}` in a description is a price), the JSON-LD in French (FAQ from
  `FR.qN`/`FR.aN`, `Service` from `FR.ld_name`/`ld_type`/`ld_desc`, `ProfilePage` from `FR.ld_job`), a
  self-canonical, hreflang en ↔ fr ↔ x-default on both versions, and the shared files reached with `../`
  (links between pages stay in `fr/`). It also writes those hreflang links into the English pages and both
  versions of every page into `sitemap.xml`. **Run it after any change of text, English or French, or of
  markup** (`--check` changes nothing and exits 1 if a file is out of date), and after `prerender-prices.mjs`
  when prices change: the order is `node tools/prerender-prices.mjs && node tools/build-fr.mjs`.
  In the browser each page reads its `<html lang>` (`PAGE_LANG`): `/fr/` pages always start in French, the
  EN/FR switch goes to the same page in the other language (keeping the `#section`) and saves the choice
  (`lg_lang`); the English pages still show French in place to a visitor whose saved choice or browser
  language is French. Old `?lang=fr` / `?lang=en` links are sent to the right page by a small script in each
  `<head>` (other parameters and the hash kept; `/?book=1&lang=fr#contact` from older estimate e-mails
  included). The 404 speaks French under `/fr/` and then links to the French pages.
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
  JSON-LD. **After any price change in `config.js`, run `node tools/prerender-prices.mjs`, then
  `node tools/build-fr.mjs`** (`--check` changes nothing and exits 1 if a page is out of date; it checks the
  French pages too, in French format). `estimator.js` writes the same amounts at run time, in the language's format.
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
- **SEO**: each language is its own indexable page: `/x.html` in English, `/fr/x.html` in French, with the French
  text in the HTML itself (search engines, AI crawlers and link previews read it without JavaScript), each with a
  self-canonical and hreflang en / fr / x-default (English), both listed in `sitemap.xml` with their alternates; never
  link `?lang=` URLs again. Every `<img>` carries an alt that says what the picture shows and for whom (« an electrician… »,
  « a volunteer syndic… »), in English in the HTML and in French under `data-i18n-alt="key"` in the page's `FR`
  dictionary; the phone screenshots too (their frame is `aria-hidden`, so screen readers skip them, but image
  search reads them). Titles lead with the service and Belgium, the brand comes last. Structured data: the home
  page has `ProfessionalService` (`@id` `#org`, the one `prerender-prices.mjs` keeps in step) and `WebSite` (the
  site name Google shows), each service page a `Service`, `about.html` a `ProfilePage`. `sitemap.xml` lists the
  images of each page: add a new screenshot to the English entry, with the same `?v=` as in the page (`build-fr.mjs`
  copies it to the French one).

- **Cookies & Google Analytics**: `consent.js`, loaded by every page, asks before Google Analytics 4 runs: a banner
  (Refuse and Accept alike, Customize opens a settings panel), `gtag.js` only loaded after « Accept », the choice in
  `lg_consent` for six months, « Cookie settings » added to every footer and a button on `cookies.html#choices`.
  `GA_ID` at the top of the file is the measurement id: empty, the whole thing is dormant. Pages send their own
  events through `window.lgGa()` (`generate_lead` from the contact form and the estimator). The events and the
  setup on Google's side are in `docs/google-analytics.md`.

Whatever changes in what the page measures must first be reflected in `cookies.html`.
