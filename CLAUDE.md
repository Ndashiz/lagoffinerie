# CLAUDE.md

Working notes for agent sessions on La Goffinerie (<https://lagoffinerie.be>). Read [`README.md`](README.md)
for the tour; this file is the checklist. Like every `.md` here, it is published as is by GitHub Pages:
never put a secret in it.

## A push to `main` is production

`main` is served by GitHub Pages at lagoffinerie.be a minute or two after the push. **Never push without
Simon's explicit yes**, after listing what ships. Several sessions often work at once in worktrees under
`~/Documents/lagoffinerie-wt/` (the clone `~/Documents/lagoffinerie` is stale): fetch before you start and
again before you push, and take the next free version number only at push time (a line at the top of the
comment in `index.html`'s `<style>`, and « (v2.xx) » at the end of the commit message).

## After any change to a page, in this order

1. `node tools/prerender-prices.mjs`: the prices of `config.js` into the pages, and into `llms.txt`.
2. `node tools/build-fr.mjs`: writes `fr/*.html`, the hreflang links and `sitemap.xml`. Never edit `fr/` by hand.
3. **Bring `tools/llms.txt.tpl` up to date** (next section).
4. Both tools with `--check` must pass before the commit.
5. Once the push is live: `node tools/indexnow.mjs <the pages that changed>` (Bing).

## `llms.txt` must follow the site

`llms.txt` (<https://lagoffinerie.be/llms.txt>) is the summary of the site that AI assistants read: who
La Goffinerie is, the packages and their prices, the services, the work, the contact details. It is
**written** by `prerender-prices.mjs` from `tools/llms.txt.tpl`: edit the template, never `llms.txt`.

Any change that makes one of its sentences false updates the template **in the same commit**:

- a package: its name, what it includes, what the monthly fee covers (the amounts follow `config.js` by
  themselves; a new amount needs its `{key}`, one of `PRICE` in `estimator.js`);
- a service or a service page: added, removed, renamed, what it covers;
- a case: added, removed, renamed, what it shows, its anchor in `work.html`;
- the contact details, the hours, the area served, the languages, the lead time, the payment terms;
- the about page (Simon's role and status) and the topics of the home page FAQ;
- the address of any page it links to.

When in doubt, read the template through: if a sentence is no longer true, fix it. A wrong `llms.txt` is
worse than none, because the assistants repeat it as fact.

## Other traps

- Every price lives in `config.js`; never type an amount in the HTML.
- Every `<img>` has an English `alt` and a French one under `data-i18n-alt` in the page's `FR` dictionary.
- The IndexNow key file at the root (`<key>.txt`) stays published; deleting it breaks every ping.
- Anything that changes what the site measures or stores goes into `cookies.html` first.
