# La Goffinerie — lagoffinerie.be

Marketing site of La Goffinerie (websites and dedicated solutions for Belgian small businesses).
Static pages, vanilla HTML/CSS/JS, bilingual EN/FR (auto-detected, manual toggle).

- **Prod**: <https://lagoffinerie.be/> — GitHub Pages from `main`, custom domain in `CNAME`.
  A push to `main` deploys in 1–2 minutes.
- **Files**: `index.html` (home: offer, work carousel, four-step method, FAQ, contact),
  `work.html` (all the work, one case per project), `pricing.html` (the three build tiers, the three
  after-delivery offers: one-off, with maintenance, full plan on quote, the hourly rate outside the plan,
  the maintenance scope and the add-ons, the six-step method, the guarantees),
  `about.html`, the legal pages (`mentions-legales.html`, `cgu.html`,
  `donnees-personnelles.html`, `cookies.html` — keep it true), `404.html`, `robots.txt`, `sitemap.xml`.
- **Site state**: `site-state.js`, loaded by every page — reads the public `GET /api/gf/config` of Jarvis
  (the call the home page already makes for its logo intro) and renders what the owner switched on there:
  a full-screen maintenance screen (fresh answers only, re-checked every 60 s, fail-open) and an announcement
  banner above the top bar (three tones, optional link, period, × for the visit). Keys `lg_site_cfg` and
  `lg_banner` are listed on `cookies.html`. `404.html` is the GitHub Pages not-found page, in the site's style.
- **Config**: `config.js` holds **every price** of the site (euros excl. VAT, `[TBC]` marks the defaults
  still to confirm): `estimator` (the build ranges, the options, the monthly plans, the floor — the « from »
  price of each tier is the low end of its range), `rates` (hourly rate, 5-hour pack, domain name) and
  `BOOKING_URL` (shows the « choose a slot now » buttons). The amounts are **pre-rendered** in the HTML, so
  they are in the page source (search engines, link previews, « view source »): every element carrying
  `data-price="…"`, the French dictionaries, the `<meta data-price-tpl="… {key} …">` descriptions and the
  JSON-LD. **After any price change in `config.js`, run `node tools/prerender-prices.mjs`**
  (`--check` changes nothing and exits 1 if a page is out of date). `estimator.js` writes the same amounts
  at run time, in the language's format.
  `assets/work/*.jpg` are the project illustrations of the carousel and cases.
- **Estimator**: `estimator.js`, loaded by the home, pricing and service pages right after `config.js` — a pop-up
  that starts from the three services (several can be ticked) and asks only the questions they need, up to six
  (any `data-estimator` element opens it, never by itself, never over the booking window; `data-estimator-service`
  pre-ticks a service)
  that shows an indicative range on screen, then sends the detail by e-mail (`POST /api/gf/estimates` on
  Jarvis, FormSubmit as fallback) or hands over to the booking window pre-filled (`/?book=1` on the home
  page, which also opens the booking window from the estimate e-mail). Answers are kept for the tab in
  `lg_estimate`. The Jarvis side is specified in `docs/estimator-jarvis.md`.
- **Services**: one page per service, `websites.html`, `digital-strategy.html` and `ai-automation.html`, each with
  its own editorial FAQ (six questions at most) and FAQPage JSON-LD. `nav.js`, loaded on every page, turns
  « Our services » in the top bar into a menu of the three pages and floats the bar once the page has moved.
- **Contact form**: FormSubmit (AJAX with a plain-POST fallback returning to `/?sent=1#contact`)
  plus a copy posted to Jarvis.
- **Audience & leads**: posted from the visitor's browser to Jarvis (`jarvis.ndashiz.be/api/gf/*`)
  as CORS *simple requests* (`Content-Type: text/plain`, never JSON — Jarvis's global CORS refuses
  every preflight). The owner console is Jarvis → « La Goffinerie »; the contract is documented in
  the Jarvis repo, `docs/17-goffinerie-tracking.md`.
- **Own devices**: open `https://lagoffinerie.be/?crew=goffinerie` once per device to keep your
  visits out of the statistics (`?crew=off` to disarm). `localhost` is always excluded.

Whatever changes in what the page measures must first be reflected in `cookies.html`.
