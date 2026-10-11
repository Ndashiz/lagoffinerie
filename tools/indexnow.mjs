#!/usr/bin/env node
/* =========================================================
   LA GOFFINERIE — tools/indexnow.mjs
   Tells Bing (and the other IndexNow engines: Yandex, Seznam, Naver, Yep) that pages of the site
   are new or have changed, so they come and read them within days instead of weeks. Bing's index
   also feeds ChatGPT search, Copilot and DuckDuckGo. Google does not use IndexNow: for Google, the
   sitemap and Search Console do the job.

     node tools/indexnow.mjs                     every page of sitemap.xml (English and French)
     node tools/indexnow.mjs fr/ websites.html   only these pages (paths from the root, or full URLs)
     node tools/indexnow.mjs --dry-run           show what would be sent, send nothing

   Run it AFTER the push is live on lagoffinerie.be (GitHub Pages takes a minute or two), and only
   for pages that really changed: the engines lower the trust of a site that pings for nothing.
   Exit codes: 0 accepted (200, or 202: the key is still being checked, nothing to do);
   1 refused (the engine's answer is printed); 2 nothing sent (no key, key not live, bad page).

   The key: the one file at the root named <key>.txt whose content is the key itself (hex, 8 to
   128 characters). The engines fetch it from the site to check that the ping comes from its owner,
   so it must stay published; never rename or delete it without making a new one.
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'lagoffinerie.be';
const SITE = `https://${HOST}/`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const wanted = args.filter((a) => !a.startsWith('--'));

function fail(msg) { console.error('indexnow: ' + msg); process.exit(2); }

/* ---------- the key ---------- */
const keys = fs.readdirSync(ROOT).filter((f) => {
  const m = f.match(/^([0-9a-f]{8,128})\.txt$/);
  return m && fs.readFileSync(path.join(ROOT, f), 'utf8').trim() === m[1];
});
if (keys.length !== 1) fail(`expected exactly one <key>.txt at the root holding its own name, found ${keys.length}`);
const KEY = keys[0].slice(0, -4);
const KEY_URL = SITE + keys[0];

/* ---------- the pages ---------- */
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const all = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
let urls = all;
if (wanted.length) {
  urls = wanted.map((w) => (/^https?:\/\//.test(w) ? w : SITE + w.replace(/^\/+/, '')));
  const unknown = urls.filter((u) => !all.includes(u));
  if (unknown.length) fail(`not in sitemap.xml: ${unknown.join(', ')}`);
}
if (!urls.length) fail('no page to send');

const body = { host: HOST, key: KEY, keyLocation: KEY_URL, urlList: urls };
console.log(`${urls.length} page(s) for ${HOST}:\n  ` + urls.join('\n  '));
if (DRY) { console.log('\n--dry-run: nothing sent.\n' + JSON.stringify(body, null, 1)); process.exit(0); }

/* ---------- the key must be live, or the engines refuse the ping ---------- */
try {
  const r = await fetch(KEY_URL, { cache: 'no-store' });
  const t = r.ok ? (await r.text()).trim() : '';
  if (t !== KEY) fail(`${KEY_URL} does not answer the key yet (HTTP ${r.status}): push first, wait for GitHub Pages, then run this again`);
} catch (e) { fail(`cannot read ${KEY_URL} (${e.message})`); }

/* ---------- send ---------- */
const MEANING = {
  200: 'accepted', 202: 'accepted, the key is still being checked',
  400: 'bad request', 403: 'key refused (not found on the site, or does not match)',
  422: 'a page does not belong to the host, or the key does not match the host', 429: 'too many requests, try again later',
};
const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
const text = (await res.text()).trim();
console.log(`\n${ENDPOINT}: HTTP ${res.status} — ${MEANING[res.status] || 'unexpected answer'}${text ? '\n' + text : ''}`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
