# Project estimator: the Jarvis side

The site part is live in `estimator.js` (body **contract v2**: the three services, see *Changes from v1* below). This
is what Jarvis has to add so that every estimate becomes a prospect on the « La Goffinerie » page. Until it does, the
site already works: Jarvis answers 404, and FormSubmit carries Simon's copy and the visitor's auto-reply (see
*Fallback* below).

## The questions (for reading the answers)

Question 1 ticks one or more services; the next questions depend on them. Each step has a fixed id, but its number
on screen is its rank in the visitor's path (the statistics use that number, see §5).

| Id | Question | Asked when | Answer |
|---|---|---|---|
| 1 | De quoi avez-vous besoin ? (several) | always, required | `services` |
| 2 | Quel projet ? | `sites` ticked, required | `type` |
| 3 | Votre identité visuelle | `sites` + `website`, optional | `branding` |
| 4 | Avez-vous déjà un site ? (+ its link) | `sites` + `website`, `seo` or `auto`; optional | `existing`, `url` |
| 5 | Que doit faire votre site pour vous ? / Que voulez-vous automatiser ? (several, with « Autre ») | `sites` + `website`, or `auto`; optional | `needs`, `needs_other` |
| 6 | Quelques options (the SEO row is hidden when `seo` is ticked) | always, optional | `pro_email`, `seo`, `after`, `domain` |

Paths: `sites` + website 1 → 2 → 3 → 4 → 5 → 6; `sites` + app or tool 1 → 2 → 6; `seo` 1 → 4 → 6;
`auto` 1 → 4 → 5 → 6. With several services, the steps add up, each asked once, in id order.

Same rules as the leads (`docs/17-goffinerie-tracking.md`): public route, CORS **simple request** (the body is JSON
sent as `Content-Type: text/plain`, never a preflight), no cookie, origin `https://lagoffinerie.be`.

## 1. `POST /api/gf/estimates`

Sent when the visitor clicks **Recevoir mon estimation / Send me my estimate** (name, e-mail and the consent box
are required by the form). Body:

| Field | Type | Notes |
|---|---|---|
| `v` | `2` | contract version (see *Changes from v1*) |
| `s` | string | the tab's random session id (same as the events), never stored with an IP |
| `l` | `"fr"` \| `"en"` | the site language: the prospect e-mail goes out in it |
| `ts` | ISO string | browser time |
| `k` | `1` or absent | Simon's own devices (`?crew=goffinerie`, localhost): mark as test |
| `name`, `email` | string | required (≤ 120 / 160 chars); `name` is « Votre nom ou nom d'entreprise », so it can be a company |
| `phone` | string \| null | optional |
| `answers.services` | array of `sites` \| `seo` \| `auto` | at least one, in this order, no duplicates |
| `answers.type` | `website` \| `app` \| `tool` \| null | the project type; set when `sites` is ticked, else null |
| `answers.branding` | `have` \| `refresh` \| `scratch` \| null | `sites` + `website` only |
| `answers.existing` | `none` \| `rebuild` \| `improve` \| null | when step 4 is asked (`sites` + `website`, `seo` or `auto`) |
| `answers.url` | string \| null | the current site, as typed (`www.x.be`), only with `rebuild` / `improve` (≤ 200 chars) |
| `answers.needs` | array of `presentation` \| `connected` \| `automation` \| `other` | when step 5 is asked (`sites` + `website`, or `auto`), else `[]`; may be empty (optional step) |
| `answers.needs_other` | string \| null | the free text of « Autre » (≤ 200 chars), only when `other` is in `needs` and the text is not empty |
| `answers.pro_email` | `yes` \| `no` \| `have` \| null | |
| `answers.seo` | `yes` \| `no` \| null | `yes` whenever the `seo` service is ticked (the option is then hidden) |
| `answers.after` | `self` \| `hosting` \| `full` \| `unsure` \| null | |
| `answers.domain` | `have` \| `reserve` \| null | only when `after` is not `self` |
| `estimate` | `{ base, quote, min, max, from, currency:"EUR", vat:"excl" }` | `quote:true` → `from` is set, `min`/`max` null. `base`: `website_presentation` \| `website_connected` \| `website_automation` \| `application` \| `custom_tool` for a `sites` build, else `ai_automation` (`auto` without a site), else `seo_google` (`seo` alone) |
| `monthly` | `{ option, quote, min, max }` | `option` = `after` (`unsure` when not answered); `quote` true when the option is priced on quote (the full plan); `min`/`max` null for `unsure` and for a quote |
| `items[]` | `{ key, label, amount, min, max, partner, quote, call, yearly }` | the line items shown on screen, already labelled in `l`; `quote` true for « sur devis » lines, `call` true for « à voir à l'appel » (the « Autre » need) |
| `text` | `{ build, monthly, answers:[[label,value]…], summary, disclaimer, mail }` | ready-made copy in `l` (see §3); `answers` starts with the services |
| `bookUrl` | string | `https://lagoffinerie.be/?book=1&lang=xx#contact`: opens the booking window |

Item keys: the bases above, `branding_refresh`, `branding_scratch`, `existing_rebuild`, `existing_improve`,
`pro_email`, `seo_google` (the SEO option, or the `seo` service), `seo_follow` (« Accompagnement suivi (contenus,
GEO) », on quote, `seo` service only), `needs_other` (« Autre : … », à voir à l'appel), `domain_reserve` (yearly).

How the site prices it (for reading the figures, not to recompute them):

- `sites` + website: the base follows the most complete need ticked (`automation` > `connected` > `presentation`);
  with `other` alone or no need, the showcase site. With `auto` also ticked, at least the connected site.
- `sites` + app or tool: on quote, from the config base.
- `auto` without a website: `ai_automation`, on quote, from the low end of the connected site.
- `seo`: the `seo_google` range (an add-on to a build, or the whole build estimate when nothing is built, then
  without the floor) and `seo_follow` on quote.

The amounts come from `config.js` on the site; Jarvis must **store what it received**, not recompute it.
Validate like the leads: lengths, e-mail shape, enums above (each array entry too, `services` not empty),
honeypot already handled by the page, rate limit per IP.

### Changes from v1

- `v` is `2`.
- New `answers.services` (array) and `answers.needs_other` (string or null).
- `answers.needs` is now an **array** (it was one value or null), with the new value `other`; it is also filled for
  `auto` without a website.
- `answers.type` can be null (no `sites` ticked); it was always set.
- `answers.existing` and `answers.url` are also set for `seo` and `auto` (step 4 is asked for them).
- `answers.seo` is `yes` when the `seo` service is ticked.
- New `estimate.base` values `ai_automation` and `seo_google`; new item keys `ai_automation`, `seo_follow`,
  `needs_other`; new item flag `call`.
- Statistics: `estimator_step` / `estimator_abandon` go up to `6` and follow the number on screen (§5).

**Answer** (JSON), the same shape as the leads:

```json
{ "ok": true, "id": "…", "mailed": { "owner": true, "prospect": true } }
```

`mailed.owner === true` is what the page waits for (8 s). Anything else → the fallback. If `mailed.prospect` is true
the fallback does not send the auto-reply again.

## 2. Storage and the « La Goffinerie » page

- A prospect with status **`estimate`**: name, e-mail, phone, language, date, the services (`answers.services`,
  handy as a filter), the answers (readable labels: `text.answers`), the range (`text.build`), the monthly option
  (`text.monthly`), the existing site URL (clickable), the « Autre » need (`answers.needs_other`), the line items.
- A **« Convertir en appel »** action: when a booking lead later arrives with the same e-mail (the booking window
  is pre-filled from the estimator, its subject starts with « Estimation en ligne : » / « Online estimate: »),
  link the two and move the prospect to the booked-call status; also allow doing it by hand.
- Retention: the same as the booking requests (24 months after the last exchange; see `donnees-personnelles.html` §4).

## 3. The two e-mails (Resend)

**To the prospect**, in `l`. No dashes in the copy. `text.mail` is the plain-text version the site uses for the
FormSubmit fallback and can be sent as is:

- subject: « Votre estimation indicative, La Goffinerie » / « Your indicative estimate, La Goffinerie »;
- summary of the answers (the services first), the build range, the monthly option, the line items;
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
| `estimator_open` | where from: `pricing`, `home`, `faq`, or a service page's own value | the window opens |
| `estimator_step` | `1` … `6` | a step is shown (once per page view), numbered as on screen — the brief's `estimator_step_n` |
| `estimator_result_shown` | `range` \| `quote` | the result is shown (once per page view) |
| `estimator_email_sent` | `jarvis` \| `formsubmit` | the estimate was sent |
| `estimator_to_booking` | — | « Réserver mon appel gratuit » from the estimator |
| `estimator_abandon` | `1` … `6` \| `result` | closed (or tab left) before sending, numbered as on screen — the brief's `estimator_abandon_step_n` |

The step number is the one the visitor sees (« Étape 2 sur 3 »), not the question id: step 2 is « Quel projet ? » for
`sites` but « Avez-vous déjà un site ? » for `seo` alone. Step 1 is always the services question.

Accept these names in the events whitelist and show the funnel on the « La Goffinerie » page:
opened → step 1 … step 6 → result shown → e-mail sent / to booking, with the abandons per step.
The home page also counts clicks on `data-track="cta_estimate"` and `faq_estimate`.
