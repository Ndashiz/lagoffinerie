# Project estimator: the Jarvis side

The site part is live in `estimator.js` (site v2.25). This is what Jarvis has to add so that every estimate becomes a
prospect on the « La Goffinerie » page. Until it does, the site already works: Jarvis answers 404, and FormSubmit
carries Simon's copy and the visitor's auto-reply (see *Fallback* below).

Same rules as the leads (`docs/17-goffinerie-tracking.md`): public route, CORS **simple request** (the body is JSON
sent as `Content-Type: text/plain`, never a preflight), no cookie, origin `https://lagoffinerie.be`.

## 1. `POST /api/gf/estimates`

Sent when the visitor clicks **Recevoir mon estimation / Send me my estimate** (name, e-mail and the consent box
are required by the form). Body:

| Field | Type | Notes |
|---|---|---|
| `v` | `1` | contract version |
| `s` | string | the tab's random session id (same as the events), never stored with an IP |
| `l` | `"fr"` \| `"en"` | the site language: the prospect e-mail goes out in it |
| `ts` | ISO string | browser time |
| `k` | `1` or absent | Simon's own devices (`?crew=goffinerie`, localhost): mark as test |
| `name`, `email` | string | required (≤ 120 / 160 chars) |
| `phone` | string \| null | optional |
| `answers.type` | `website` \| `app` \| `tool` | always set |
| `answers.branding` | `have` \| `refresh` \| `scratch` \| null | website only |
| `answers.existing` | `none` \| `rebuild` \| `improve` \| null | website only |
| `answers.url` | string \| null | the current site, as typed (`www.x.be`), only with `rebuild` / `improve` |
| `answers.needs` | `presentation` \| `connected` \| `automation` \| null | website only |
| `answers.pro_email` | `yes` \| `no` \| `have` \| null | |
| `answers.seo` | `yes` \| `no` \| null | |
| `answers.after` | `self` \| `hosting` \| `full` \| `unsure` \| null | |
| `answers.domain` | `have` \| `reserve` \| null | only when `after` is not `self` |
| `estimate` | `{ base, quote, min, max, from, currency:"EUR", vat:"excl" }` | `quote:true` → `from` is set, `min`/`max` null |
| `monthly` | `{ option, min, max }` | `option` = `after` (`unsure` when not answered); `min`/`max` null for `unsure` |
| `items[]` | `{ key, label, amount, min, max, partner, quote, yearly }` | the line items shown on screen, already labelled in `l` |
| `text` | `{ build, monthly, answers:[[label,value]…], summary, disclaimer, mail }` | ready-made copy in `l` (see §3) |
| `bookUrl` | string | `https://lagoffinerie.be/?book=1&lang=xx#contact`: opens the booking window |

The amounts come from `config.js` on the site; Jarvis must **store what it received**, not recompute it.
Validate like the leads: lengths, e-mail shape, enums above, honeypot already handled by the page, rate limit per IP.

**Answer** (JSON), the same shape as the leads:

```json
{ "ok": true, "id": "…", "mailed": { "owner": true, "prospect": true } }
```

`mailed.owner === true` is what the page waits for (8 s). Anything else → the fallback. If `mailed.prospect` is true
the fallback does not send the auto-reply again.

## 2. Storage and the « La Goffinerie » page

- A prospect with status **`estimate`**: name, e-mail, phone, language, date, the answers (readable labels:
  `text.answers`), the range (`text.build`), the monthly option (`text.monthly`), the existing site URL (clickable),
  the line items.
- A **« Convertir en appel »** action: when a booking lead later arrives with the same e-mail (the booking window
  is pre-filled from the estimator, its subject starts with « Estimation en ligne : » / « Online estimate: »),
  link the two and move the prospect to the booked-call status; also allow doing it by hand.
- Retention: the same as the booking requests (24 months after the last exchange; see `donnees-personnelles.html` §4).

## 3. The two e-mails (Resend)

**To the prospect**, in `l`. No dashes in the copy. `text.mail` is the plain-text version the site uses for the
FormSubmit fallback and can be sent as is:

- subject: « Votre estimation indicative, La Goffinerie » / « Your indicative estimate, La Goffinerie »;
- summary of the answers, the build range, the monthly option, the line items;
- the disclaimer, always: « Estimation indicative. Le prix final est fixé par écrit après notre appel gratuit, sur
  mesure pour votre projet. »;
- a **« Réserver mon appel gratuit »** button → `bookUrl`.

**To Simon**: the same content plus the contact details (name, e-mail, phone, language) and the existing site URL.

**Optional PDF [TBC]** attached to the prospect e-mail: titled **« Estimation indicative »**, never « Facture » and
never « Devis » (an accepted devis can bind in Belgium; the formal devis comes only after the call). The estimator
never generates an invoice.

## 4. Fallback (already on the site)

If the route is missing, slow (> 8 s) or `mailed.owner` is not true, the page re-posts the same body once with
`keepalive` and sends a FormSubmit AJAX request to `info@lagoffinerie.be`: subject « Nouvelle estimation en ligne,
lagoffinerie », a table with the answers in French, and `_autoresponse` = `text.mail` for the prospect. The range
stays on screen either way.

## 5. Statistics: `POST /api/gf/events`

Anonymous, through the existing route and payload (`{ e, i, s, l, k }`; nothing under Do Not Track / GPC):

| `e` | `i` | When |
|---|---|---|
| `estimator_open` | where from: `pricing`, `home`, `faq` | the window opens |
| `estimator_step` | `1` … `5` | a step is shown (once per page view) — the brief's `estimator_step_n` |
| `estimator_result_shown` | `range` \| `quote` | the result is shown (once per page view) |
| `estimator_email_sent` | `jarvis` \| `formsubmit` | the estimate was sent |
| `estimator_to_booking` | — | « Réserver mon appel gratuit » from the estimator |
| `estimator_abandon` | `1` … `5` \| `result` | closed (or tab left) before sending — the brief's `estimator_abandon_step_n` |

Accept these names in the events whitelist and show the funnel on the « La Goffinerie » page:
opened → step 1 … step 5 → result shown → e-mail sent / to booking, with the abandons per step.
The home page also counts clicks on `data-track="cta_estimate"` and `faq_estimate`.
