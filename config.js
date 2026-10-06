/* La Goffinerie — site configuration, read by index.html, pricing.html and estimator.js.
   Every price on the site lives here, in euros excluding VAT; nothing in the HTML repeats a number.
   [TBC] marks the defaults Simon still has to confirm before going live.

   estimator   : the project estimator (pop-up), and the source of the prices shown on the pages:
                 · base       — one per kind of build: [low, high] gives a range; { quote:true, from }
                                gives « on quote, from … ». The « from » price of the « Site vitrine » and
                                « Site connecté » tiers is the low end of their range.
                 · modifiers  — added to the base when the visitor picks the option ([low, high], may be
                                negative); { partner:true } is listed as « quoted separately », no amount.
                 · monthly    — after the launch: hosting & monitoring (« with maintenance »), and the full
                                maintenance plan ([low, high], or { quote:true } for « on quote »).
                 · floor      — no range ever starts below it.
                 The range shown = base + modifiers, rounded to the nearest 50 €, never below the floor.
   rates       : work outside the maintenance plan, and the yearly cost of a domain name.
   BOOKING_URL : a booking page (cal.com, Google Calendar appointments…) → shows the
                 « choose a slot now » buttons on the home page. */
window.LG_CONFIG = {
  estimator: {
    base: {
      website_presentation: [1950, 2500],               // [TBC] « Site vitrine »
      website_connected:    [3900, 5500],               // [TBC] « Site connecté »
      website_automation:   { quote: true, from: 5500 },// [TBC]
      application:          { quote: true, from: 5000 },// [TBC]
      custom_tool:          { quote: true, from: 3000 } // [TBC]
    },
    modifiers: {
      branding_refresh:   [150, 300],                   // [TBC]
      branding_scratch:   { partner: true },            // shown as « chiffré séparément »
      existing_rebuild:   [0, 0],
      existing_improve:   [-300, 0],                    // [TBC] may stay 0
      pro_email:          [50, 100],                    // [TBC]
      seo_google:         [400, 800]                    // [TBC] also the « Visibilité » add-on on pricing.html
    },
    monthly: {
      self_managed:       0,
      hosting_monitoring: 29,                           // [TBC]
      full_maintenance:   { quote: true }               // the full plan is quoted per site; unused hours do not roll over [TBC]
    },
    floor: 1500
  },
  rates: {
    hourly:          85,                                // [TBC] change requests, off-plan work
    pack_hours:      5,                                 // [TBC]
    pack_price:      375,                               // [TBC]
    domain_per_year: 10                                 // about, for a .be
  },
  BOOKING_URL: ''
};
