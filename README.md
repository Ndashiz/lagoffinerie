# La Goffinerie — lagoffinerie.be

Marketing site of La Goffinerie (websites and dedicated solutions for Belgian small businesses).
Static pages, vanilla HTML/CSS/JS, bilingual EN/FR (auto-detected, manual toggle).

- **Prod**: <https://lagoffinerie.be/> — GitHub Pages from `main`, custom domain in `CNAME`.
  A push to `main` deploys in 1–2 minutes.
- **Files**: `index.html` (home: offer, work carousel, four-step method, FAQ, contact),
  `work.html` (all the work, one case per project), `pricing.html` (the three plans, the six-step
  method, the guarantees), `about.html`, the legal pages (`mentions-legales.html`, `cgu.html`,
  `donnees-personnelles.html`, `cookies.html` — keep it true), `404.html`, `robots.txt`, `sitemap.xml`.
- **Config**: `config.js` holds the two switches read by the home and pricing pages: `PRICES`
  (the « from » prices, shown on `pricing.html` once set) and `BOOKING_URL` (shows the « choose a
  slot now » buttons). `assets/work/*.jpg` are the project illustrations of the carousel and cases.
- **Contact form**: FormSubmit (AJAX with a plain-POST fallback returning to `/?sent=1#contact`)
  plus a copy posted to Jarvis.
- **Audience & leads**: posted from the visitor's browser to Jarvis (`jarvis.ndashiz.be/api/gf/*`)
  as CORS *simple requests* (`Content-Type: text/plain`, never JSON — Jarvis's global CORS refuses
  every preflight). The owner console is Jarvis → « La Goffinerie »; the contract is documented in
  the Jarvis repo, `docs/17-goffinerie-tracking.md`.
- **Own devices**: open `https://lagoffinerie.be/?crew=goffinerie` once per device to keep your
  visits out of the statistics (`?crew=off` to disarm). `localhost` is always excluded.

Whatever changes in what the page measures must first be reflected in `cookies.html`.
