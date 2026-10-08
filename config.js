/* La Goffinerie — site configuration, read by estimator.js (and nav.js, index.html for BOOKING_URL).
   Every price on the site lives here, in euros excluding VAT; nothing in the HTML repeats a number:
   the pages show them through data-price="key" (see PRICE in estimator.js), and
   tools/prerender-prices.mjs writes them into the HTML source.
   [TBC] marks the defaults Simon still has to confirm before going live.

   packages    : the three packages, shown on the pages and recommended by the estimator.
                 · essentiel — build: one-off price; monthly: « about », hosting and the domain name only.
                               Maintenance is included for the first 3 months; no monitoring, no changes
                               after the launch.
                 · pro       — build: one-off price; monthly: « about », hosting, domain, 24/7 monitoring,
                               the client's online services managed, unlimited technical maintenance and
                               one new feature per quarter.
                 · custom    — « Sur mesure » (shop, booking, member area, AI tools, CRM, chatbot, new
                               features on an existing site…): { quote:true }, no price is ever shown.
   addons      : added to the Essentiel or Pro build when the visitor picks them in the estimator
                 ([low, high]); { partner:true } is listed as « quoted separately », with no amount.
                 seo_google is also the « Bases du référencement et fiche Google » offer of the SEO page.
   rates       : work outside the packages, and the yearly cost of a domain name.
   BOOKING_URL : a booking page (cal.com, Google Calendar appointments…) → shows the
                 « choose a slot now » buttons on the home page.
   Jarvis (La Goffinerie → Technique) can set the amounts below: visitors see them at once, and the
   hourly GitHub Action « Sync prices from Jarvis » (tools/sync-prices.mjs) rewrites them here. While
   Jarvis drives the prices, change them there — or « Hand back to config.js » first. */
window.LG_CONFIG = {
  packages: {
    essentiel: { build: 700,  monthly: 20 },            // monthly is « about »; hosting + domain only; maintenance for the first 3 months
    pro:       { build: 1000, monthly: 50 },            // monthly is « about »; hosting, domain, 24/7 monitoring, unlimited technical maintenance, one new feature per quarter
    custom:    { quote: true }                          // « Sur mesure »: on quote, no price shown
  },
  addons: {
    seo_google:       [400, 800],                       // [TBC] « Bases du référencement et fiche Google »
    branding_refresh: [150, 300],                       // [TBC] refreshing an existing logo and brand guidelines
    branding_scratch: { partner: true },                // a partner graphic designer: « chiffré séparément »
    pro_email:        [50, 100]                         // [TBC] an e-mail address in the client's name
  },
  rates: {
    hourly:          85,                                // [TBC] change requests, off-package work
    pack_hours:      5,                                 // [TBC]
    pack_price:      375,                               // [TBC]
    domain_per_year: 10                                 // about, for a .be
  },
  BOOKING_URL: ''
};
