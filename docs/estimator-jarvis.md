# Project estimator: the Jarvis side

The site part is live in `estimator.js` (body **contract v3**: the result is one of the three packages, Essentiel,
Pro or Sur mesure, see *Changes from v2* below). This is what Jarvis has to add so that every estimate becomes a
prospect on the « La Goffinerie » page. Until it does, the site already works: Jarvis answers 404, and FormSubmit
carries Simon's copy and the visitor's auto-reply (see *Fallback* below).

**Switching it off** (Jarvis v1.91.0, site v2.34): Jarvis → La Goffinerie → Technique → « Project estimator ».
`GET /api/gf/config` then answers `estimator: { on: false }`: `site-state.js` hides the estimator buttons and the
`data-estimator-block` parts, the « Get a quote » links simply go to `#pricing`, and neither `estimator.js` nor
`nav.js` opens the pop-up, so no estimate reaches this route or FormSubmit. The prices it shows can be set on the
same tab (`pricing`, a patch over `config.js`).

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
| 6 | Quelques options (the SEO row is hidden when `seo` is ticked; « Après la mise en ligne », and the domain name with it, is hidden for the SEO offer alone, see below) | always, optional | `pro_email`, `seo`, `after`, `domain` |

Paths: `sites` + website 1 → 2 → 3 → 4 → 5 → 6; `sites` + app or tool 1 → 2 → 6; `seo` 1 → 4 → 6;
`auto` 1 → 4 → 5 → 6. With several services, the steps add up, each asked once, in id order.

Same rules as the leads (`docs/17-goffinerie-tracking.md`): public route, CORS **simple request** (the body is JSON
sent as `Content-Type: text/plain`, never a preflight), no cookie, origin `https://lagoffinerie.be`.

## 1. `POST /api/gf/estimates`

Sent when the visitor clicks **Recevoir mon estimation / Send me my estimate** (name, e-mail and the consent box
are required by the form). Body:

| Field | Type | Notes |
|---|---|---|
| `v` | `3` | contract version (see *Changes from v2*) |
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
| `answers.after` | `hosting` \| `full` \| `unsure` \| null | « Juste l'hébergement et le nom de domaine » (→ Essentiel), « Surveillance et maintenance » (→ Pro), « Je ne sais pas encore »; null when not answered or not asked (the SEO offer alone) |
| `answers.domain` | `have` \| `reserve` \| null | only when `after` is answered |
| `estimate` | `{ base, quote, min, max, from, currency:"EUR", vat:"excl" }` | `base`: the package, `essentiel` \| `pro` \| `custom` (« Sur mesure »), or `seo` for the SEO offer alone (see below). `quote` is true for `custom` only: `min`/`max` are then null, never an amount. Otherwise `min`/`max` = the package build + the add-ons (equal when no add-on is a range). `from` is always null (kept for compatibility) |
| `monthly` | `{ option, quote, min, max }` | `option` = `after` (`unsure` when not answered, `none` when not asked); `quote` true for `custom`; `min` = `max` = the package's monthly price, which the site shows as « environ » / « about » (Essentiel: hosting and domain name only; Pro: plus monitoring and maintenance); both null for `custom` and `seo` |
| `items[]` | `{ key, label, amount, min, max, partner, quote, call, yearly }` | the line items shown on screen, already labelled in `l`, the package first; `quote` true for « sur devis » and « dans le devis » lines, `call` true for « à voir à l'appel » (the « Autre » need) |
| `text` | `{ package, build, monthly, note, answers:[[label,value]…], summary, disclaimer, mail }` | ready-made copy in `l` (see §3); `package` is the package name (« Essentiel », « Pro », « Sur mesure » / « Custom », or the SEO offer's name); `note` is the word on Pro shown with Essentiel when `after` is `unsure` or not answered, else null; `answers` starts with the services |
| `bookUrl` | string | `https://lagoffinerie.be/?book=1&lang=xx#contact`: leads to the contact form of the home page |

Item keys:

- the package: `pkg_essentiel`, `pkg_pro` (`min` = `max` = its build price), `pkg_custom` (`quote`, « sur devis »);
- with `pkg_custom`, the reasons for it, each `quote` with the amount « dans le devis » / « in the quote »:
  `ai_automation`, `application`, `custom_tool`, `website_connected`, `website_automation`, `existing_improve`
  (new features on the current site), and `needs_other` (« Autre : … », `call`, « à voir à l'appel »);
- the add-ons: `branding_refresh`, `branding_scratch` (`partner`, « chiffré séparément »), `seo_google` (« Bases du
  référencement et fiche Google », the SEO option or the `seo` service; for `base: "seo"` it is the offer itself),
  `seo_follow` (« Accompagnement suivi (contenus, GEO) », on quote, `seo` service only), `pro_email`;
- `domain_reserve`: informational, `yearly` = the domain's yearly cost, amount « compris dans le mensuel » / « included
  in the monthly fee » with a package, « environ … par an » with `custom`.

How the site picks the package (for reading the figures, not to recompute them):

- **`custom`** (« Sur mesure », on quote, no price shown) when any of these is true: `services` includes `auto`;
  `type` is `app` or `tool`; for a website, `needs` includes `connected`, `automation` or `other`, or `existing` is
  `improve` (« Oui, à améliorer »: features added to an existing site).
- **`essentiel`** or **`pro`** otherwise, for a website to present the business (optionally with SEO): `pro` when
  `after` is `full`, else `essentiel` (`hosting`, `unsure` or not answered; with `unsure` or no answer, the result adds
  the word on Pro, `text.note`). `seo` alone also gets a package when `existing` is `none` or `rebuild`.
- **`seo`**: `seo` alone (no `sites`, no `auto`) on a current site (`existing` is `improve` or not answered): the
  `seo_google` range on its own, no package, no monthly part; `after` and `domain` are not asked.
- build = the package build + the add-ons ticked (SEO, brand refresh, pro e-mail; the partner designer is quoted
  separately); with the `seo` service ticked, `seo_follow` on quote is added.

The amounts come from `config.js` on the site; Jarvis must **store what it received**, not recompute it.
Validate like the leads: lengths, e-mail shape, enums above (each array entry too, `services` not empty),
honeypot already handled by the page, rate limit per IP. Accept `v: 2` bodies too for a while (a tab opened before
the update can still send one).

### Changes from v2

- `v` is `3`.
- `estimate.base` is now the package: `essentiel` \| `pro` \| `custom`, or `seo` for the SEO offer alone. The v2 bases
  (`website_presentation`, `website_connected`, `website_automation`, `application`, `custom_tool`, `ai_automation`,
  `seo_google`) are gone; the reasons for `custom` are item keys instead.
- `estimate.quote` is true for `custom` only, and `estimate.from` is always null: « Sur mesure » never shows a price.
- `answers.after` loses `self`; `hosting` now means « Juste l'hébergement et le nom de domaine » (Essentiel) and `full`
  « Surveillance et maintenance » (Pro). `after` and `domain` are null for the SEO offer alone (not asked), and
  `domain` is asked as soon as `after` is answered.
- `monthly`: `option` can be `none` (not asked); `min` = `max` = the package's « about » monthly price; `quote` true
  for `custom`. No more `self` or full-plan quote.
- Items: new `pkg_essentiel`, `pkg_pro`, `pkg_custom`; the custom reasons (`ai_automation`, `application`,
  `custom_tool`, `website_connected`, `website_automation`, `existing_improve`, `needs_other`); `existing_rebuild`
  and `website_presentation` are gone; `seo_google` is labelled « Bases du référencement et fiche Google ».
  The item `min` is no longer set for quote lines.
- `text.package` and `text.note` are new; the disclaimer now ends « …après notre appel gratuit, selon votre projet. »
- The site no longer rounds to 50 € nor applies a floor: the packages and add-ons are round already.

### Changes from v1 (to v2)

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
  handy as a filter), the package (`estimate.base`, also a good filter, and `text.package`), the answers (readable
  labels: `text.answers`), the build price (`text.build`), the monthly part (`text.monthly`), the existing site URL
  (clickable), the « Autre » need (`answers.needs_other`), the line items.
- A **« Convertir en appel »** action: when a booking lead later arrives with the same e-mail (the contact form
  is pre-filled from the estimator, its subject starts with « Estimation en ligne : » / « Online estimate: »),
  link the two and move the prospect to the booked-call status; also allow doing it by hand.
- Retention: the same as the booking requests (24 months after the last exchange; see `donnees-personnelles.html` §4).

## 3. The two e-mails (Resend)

**To the prospect**, in `l`. No dashes in the copy. `text.mail` is the plain-text version the site uses for the
FormSubmit fallback and can be sent as is:

- subject: « Votre estimation indicative, La Goffinerie » / « Your indicative estimate, La Goffinerie »;
- summary of the answers (the services first), the recommended package (and `text.note` when set), the build price
  (« Sur devis » for « Sur mesure », with « Le prix est fixé par écrit après notre appel gratuit. »), the monthly part,
  the line items;
- the disclaimer, always: « Estimation indicative. Le prix final est fixé par écrit après notre appel gratuit, selon
  votre projet. »;
- a **« Réserver mon appel gratuit »** button → `bookUrl`.

**To Simon**: the same content plus the contact details (name, e-mail, phone, language) and the existing site URL.

**Optional PDF [TBC]** attached to the prospect e-mail: titled **« Estimation indicative »**, never « Facture » and
never « Devis » (an accepted devis can bind in Belgium; the formal devis comes only after the call). The estimator
never generates an invoice.

## 4. Fallback (already on the site)

If the route is missing, slow (> 8 s) or `mailed.owner` is not true, the page re-posts the same body once with
`keepalive` and sends a FormSubmit AJAX request to `info@lagoffinerie.be`: subject « Nouvelle estimation en ligne,
lagoffinerie », a table with the package and the answers in French, and `_autoresponse` = `text.mail` for the
prospect. The estimate stays on screen either way.

## 5. Statistics: `POST /api/gf/events`

Anonymous, through the existing route and payload (`{ e, i, s, l, k }`; nothing under Do Not Track / GPC):

| `e` | `i` | When |
|---|---|---|
| `estimator_open` | where from: `home`, `faq`, a service page's own value (`pricing` from the retired pricing page) | the window opens |
| `estimator_step` | `1` … `6` | a step is shown (once per page view), numbered as on screen — the brief's `estimator_step_n` |
| `estimator_result_shown` | `range` \| `quote` | the result is shown (once per page view): `quote` for « Sur mesure », `range` for Essentiel, Pro or the SEO offer alone |
| `estimator_email_sent` | `jarvis` \| `formsubmit` | the estimate was sent |
| `estimator_to_booking` | — | « Réserver mon appel gratuit » from the estimator |
| `estimator_abandon` | `1` … `6` \| `result` | closed (or tab left) before sending, numbered as on screen — the brief's `estimator_abandon_step_n` |

The step number is the one the visitor sees (« Étape 2 sur 3 »), not the question id: step 2 is « Quel projet ? » for
`sites` but « Avez-vous déjà un site ? » for `seo` alone. Step 1 is always the services question.

Accept these names in the events whitelist and show the funnel on the « La Goffinerie » page:
opened → step 1 … step 6 → result shown → e-mail sent / to booking, with the abandons per step.
The home page also counts clicks on `data-track="cta_estimate"` and `faq_estimate`.
