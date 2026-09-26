# La Goffinerie — lagoffinerie.be

Marketing site of La Goffinerie (websites and dedicated solutions for Belgian small businesses).
One static page, vanilla HTML/CSS/JS, bilingual EN/FR (auto-detected, manual toggle).

- **Prod**: <https://lagoffinerie.be/> — GitHub Pages from `main`, custom domain in `CNAME`.
  A push to `main` deploys in 1–2 minutes.
- **Files**: `index.html` (the site), `cookies.html` (cookies & privacy, keep it true), `404.html`,
  `assets/simon.jpg`, `robots.txt`, `sitemap.xml`.
- **Contact form**: FormSubmit (AJAX with a plain-POST fallback returning to `/?sent=1#contact`)
  plus a copy posted to Jarvis.
- **Audience & leads**: posted from the visitor's browser to Jarvis (`jarvis.ndashiz.be/api/gf/*`)
  as CORS *simple requests* (`Content-Type: text/plain`, never JSON — Jarvis's global CORS refuses
  every preflight). The owner console is Jarvis → « La Goffinerie »; the contract is documented in
  the Jarvis repo, `docs/17-goffinerie-tracking.md`.
- **Own devices**: open `https://lagoffinerie.be/?crew=goffinerie` once per device to keep your
  visits out of the statistics (`?crew=off` to disarm). `localhost` is always excluded.

Whatever changes in what the page measures must first be reflected in `cookies.html`.
