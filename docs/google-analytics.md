# Google Analytics 4: the setup

The site part is done in `consent.js` (loaded by every page). It stays dormant until `GA_ID` holds a real
measurement id: no banner, no « Cookie settings » link, nothing sent to Google, and `cookies.html` says that
Google Analytics is not switched on. Once the id is in, it works like this:

- On the first visit a banner asks. **Refuse** and **Accept** look the same (two blue buttons); **Customize**
  opens the settings panel (strictly necessary: always on; audience measurement: a switch, off by default).
- Until « Accept », `gtag.js` is not even loaded (Consent Mode « basic »): no request to Google, no cookie.
  A Do Not Track / Global Privacy Control signal counts as a refusal and the banner is not shown.
- The choice lives in `localStorage.lg_consent` (`{v, a, t}`) for six months, then the banner asks again.
  Bump `VERSION` in `consent.js` when the cookie policy adds a tool, so everybody is asked again.
- « Cookie settings » / « Gérer les cookies » is added to every footer, next to « Cookies », and
  `cookies.html#choices` has a button and a status line. Withdrawing stops Google at once and deletes `_ga*`.
- Configuration sent with every hit: `allow_google_signals: false`, `allow_ad_personalization_signals: false`,
  ad storage / user data / personalization denied, cookies 13 months instead of 2 years.
- Simon's devices (localhost, or a device armed once with `https://lagoffinerie.be/?crew=goffinerie`) send
  `traffic_type: internal` and `debug_mode: true`.

## Events

| Event | Parameters | Sent when |
|---|---|---|
| `page_view` | (automatic) | every page, once accepted |
| `generate_lead` | `lead_source`: `contact_form` \| `estimator` | the contact form reached Simon (Jarvis or FormSubmit), or the estimate was e-mailed |
| `contact_click` | `method`: `phone` \| `whatsapp` \| `email` \| `linkedin` | a `tel:`, `wa.me`, `mailto:` or LinkedIn link is clicked |
| `cta_click` | `cta_id`: the element's `data-track` (`cta_pricing`, `bb_call`, `case_open`…) | anything tagged `data-track` is clicked |
| `estimator_open` | `detail`: the button that opened it | the estimator opens |
| `estimator_result_shown` | `detail`: `range` \| `quote` | the estimate is shown |
| `estimator_to_booking` | | « book the call » from the estimate |

Pages send their own events with `window.lgGa(name, params)`: it does nothing before consent.

## On Google's side (once, about 15 minutes)

1. **Property**: <https://analytics.google.com> → Admin → Create → Property. Name « La Goffinerie »,
   time zone Belgium, currency EUR. Business objective: « Generate leads ».
2. **Data stream**: Web, `https://lagoffinerie.be`, name `lagoffinerie.be`. In *Enhanced measurement* keep
   Page views, Scrolls, Outbound clicks and File downloads; open the settings of Page views and **turn off
   « Page changes based on browser history events »** (the pages rewrite their address with
   `history.replaceState`, which would count a page twice); turn off Site search, Form interactions (the
   site sends `generate_lead` itself) and Video engagement.
3. **Measurement id**: copy the `G-…` of the stream into `GA_ID` at the top of `consent.js`.
4. **Retention**: Admin → Data collection and modification → Data retention → Event data retention
   **14 months** (the policy pages say 14 months).
5. **Google signals**: Admin → Data collection → leave Google signals **off**.
6. **Data sharing** (account settings): untick Google products & services, Modeling contributions and
   Recommendations for your business; Technical support may stay. Accept the **Data Processing Terms**
   (Admin → Account settings) so that Google acts as a processor, as the policy says.
7. **Your own visits**: Admin → Data collection and modification → Data filters: switch the existing
   « Internal Traffic » filter (`traffic_type = internal`) from Testing to **Active**, and create a
   « Developer traffic » filter, **Active**. Your devices then stay out of the reports and still show in DebugView.
8. **Key events**: Admin → Key events → New key event: `generate_lead`, then `contact_click`.
9. **Custom dimensions** (Admin → Custom definitions, event scope): `cta_id` (CTA), `lead_source`
   (Lead source), `method` (Contact method), `detail` (Estimator detail).
10. *Optional*: Admin → Product links → Search Console, once lagoffinerie.be is verified there (TXT record at OVH).

## Checking it

- Locally (`npx serve`): the banner shows; after « Accept » the network tab shows `gtag/js?id=G-…` and
  `…/g/collect?…&tid=G-…` with `ep.traffic_type=internal`; before it, nothing to `google`.
- In prod: open the site in a private window, accept, and watch Reports → Realtime. On an armed device,
  Admin → DebugView instead.
- `localStorage.removeItem('lg_consent')` brings the banner back.

## Jarvis

Jarvis keeps its own anonymous, cookie-less measurement whatever the visitor chooses. The banner and panel
buttons carry `data-track` (`consent_accept`, `consent_refuse`, `consent_custom`, `consent_save`, and
`foot_consent` for the footer link), so the home page reports them to Jarvis; until `GF_CLICKS` in Jarvis's
`store.ts` knows them, they land in « other ».
