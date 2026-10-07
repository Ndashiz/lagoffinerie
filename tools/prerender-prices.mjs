#!/usr/bin/env node
/* =========================================================
   LA GOFFINERIE — tools/prerender-prices.mjs
   Writes the prices of config.js into the HTML, so the amounts are in
   the page source (search engines, link previews, « view source »,
   visitors without JavaScript). estimator.js still fills them at run
   time from the same config.js, so the page never shows anything else.

     node tools/prerender-prices.mjs          rewrite every page that shows prices
     node tools/prerender-prices.mjs --check  change nothing; exit 1 if a file is out of date

   Run it after every price change in config.js.

   What it writes, in each page:
     · every element carrying data-price="key": its text becomes the amount in English
       format (the HTML is the English page: « €1,950 »);
     · inside the French dictionary (const FR = { … };): data-price=\"key\">…< gets the
       French format (« 1 950 € »);
     · <meta data-price-tpl="… {key} …" content="…">: content becomes the template with the
       amounts, in English;
     · JSON-LD: the ProfessionalService description repeats the page's meta description,
       and every FAQ answer that shows a price is copied from the visible answer.

   The formats below copy num(), money() and span() of estimator.js: keep them in step.
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['index.html', 'pricing.html', 'websites.html', 'digital-strategy.html', 'ai-automation.html'];
const CHECK = process.argv.includes('--check');

/* ---------- config.js, read the way the browser reads it ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8'), sandbox, { filename: 'config.js' });
const CFG = sandbox.window.LG_CONFIG;
if (!CFG) fail('config.js does not define window.LG_CONFIG');

/* ---------- formats, as in estimator.js ---------- */
const ON_QUOTE = { fr: 'sur devis', en: 'on quote' };
function num(n, L) {
  const v = Math.abs(+n || 0);
  const s = v.toLocaleString(L === 'fr' ? 'fr-BE' : 'en-GB', { maximumFractionDigits: 0 });
  return (n < 0 ? '−' : '') + s.replace(/\s/g, '\u00a0');
}
function money(n, L) { return L === 'fr' ? num(n, L) + '\u00a0€' : (n < 0 ? '−' : '') + '€' + num(Math.abs(n), L); }
function isQuote(v) { return !!(v && typeof v === 'object' && !Array.isArray(v) && v.quote); }
function span(v, L) {
  if (isQuote(v)) return ON_QUOTE[L];
  if (!Array.isArray(v)) return money(v, L);
  if (+v[0] === +v[1]) return money(v[0], L);
  return L === 'fr' ? num(v[0], L) + ' à ' + money(v[1], L) : money(v[0], L) + ' to ' + money(v[1], L);
}
/* The same keys as PRICE in estimator.js. */
const PRICE = {
  vitrine: 'estimator.base.website_presentation.0', connecte: 'estimator.base.website_connected.0',
  self: 'estimator.monthly.self_managed', hosting: 'estimator.monthly.hosting_monitoring', plan: 'estimator.monthly.full_maintenance',
  seo: 'estimator.modifiers.seo_google', hourly: 'rates.hourly', pack: 'rates.pack_price', pack_hours: 'rates.pack_hours',
  domain: 'rates.domain_per_year'
};
function price(key, L, where) {
  if (!PRICE[key]) fail(`${where}: unknown price key « ${key} » (not in PRICE)`);
  const v = PRICE[key].split('.').reduce((o, k) => (o == null ? undefined : o[k]), CFG);
  if (v == null) fail(`${where}: config.js has no value for « ${key} » (${PRICE[key]})`);
  return key === 'pack_hours' ? num(v, L) : span(v, L);
}

/* ---------- small helpers ---------- */
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function decode(s) {
  return s.replace(/&nbsp;/g, '\u00a0').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
}
function plainText(html) {
  return decode(html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '').replace(/<[^>]+>/g, ''))
    .replace(/[ \t\r\n]+/g, ' ').trim();
}
function fail(msg) { console.error('prerender-prices: ' + msg); process.exit(2); }

/* ---------- one page ---------- */
function render(file, src) {
  let out = src, count = 0;

  // 1. The French dictionary: cut it out, fill it in French, put it back.
  const frStart = out.indexOf('const FR = {');
  let frEnd = -1;
  if (frStart >= 0) {
    frEnd = out.indexOf('\n};', frStart);
    if (frEnd < 0) fail(`${file}: the French dictionary has no closing « }; »`);
    const fr = out.slice(frStart, frEnd).replace(/(data-price=\\"(\w+)\\">)([^<]*)(<)/g, (m, open, key, _old, close) => {
      count++; return open + escText(price(key, 'fr', file)) + close;
    });
    out = out.slice(0, frStart) + fr + out.slice(frEnd);
    frEnd = frStart + fr.length;
  }

  // 2. Elements outside the dictionary: English amounts.
  const fillEn = (part) => part.replace(/(<[a-zA-Z][^<>]*\sdata-price="(\w+)"[^<>]*>)([^<]*)(<\/)/g, (m, open, key, _old, close) => {
    count++; return open + escText(price(key, 'en', file)) + close;
  });
  out = frStart >= 0 ? fillEn(out.slice(0, frStart)) + out.slice(frStart, frEnd) + fillEn(out.slice(frEnd)) : fillEn(out);

  // 3. Meta tags with a template.
  let description = null;
  out = out.replace(/<meta\b[^>]*\bdata-price-tpl="([^"]*)"[^>]*>/g, (tag, tpl) => {
    const text = decode(tpl).replace(/\{(\w+)\}/g, (m, key) => price(key, 'en', file));
    if (!/\scontent="[^"]*"/.test(tag)) fail(`${file}: a meta with data-price-tpl has no content attribute`);
    if (/\bname="description"/.test(tag)) description = text;
    count++; return tag.replace(/\scontent="[^"]*"/, ` content="${escAttr(text)}"`);
  });

  // 4. JSON-LD.
  const answers = {};
  // A question is the span data-i18n="qN" (the editorial FAQ also has a number and an icon around it);
  // its answer is the next <p data-i18n="aN">.
  for (const m of out.matchAll(/data-i18n="q(\d+)">([^<]*)<\/span>(?:(?!data-i18n="q\d)[\s\S])*?<p data-i18n="a\1">([\s\S]*?)<\/p>/g)) {
    if (m[3].includes('data-price=')) answers[decode(m[2]).trim()] = plainText(m[3]);
  }
  out = out.replace(/(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/g, (whole, open, json, close) => {
    let data;
    try { data = JSON.parse(json); } catch (e) { fail(`${file}: unreadable JSON-LD (${e.message})`); }
    if (data['@type'] === 'ProfessionalService' && description) {
      count++;
      return open + json.replace(/("description": )"(?:[^"\\]|\\.)*"/, (m, key) => key + JSON.stringify(description)) + close;
    }
    if (data['@type'] === 'FAQPage' && Object.keys(answers).length) {
      for (const q of data.mainEntity || []) {
        if (answers[q.name] !== undefined) { q.acceptedAnswer.text = answers[q.name]; count++; }
      }
      return open + JSON.stringify(data, null, 1) + close;
    }
    return whole;
  });

  if (/data-price="\w+"[^<>]*>—</.test(out) || /data-price=\\"\w+\\">—</.test(out)) fail(`${file}: a price slot is still empty`);
  return { out, count };
}

/* ---------- all pages ---------- */
let stale = 0;
for (const file of FILES) {
  const full = path.join(ROOT, file);
  const src = fs.readFileSync(full, 'utf8');
  const { out, count } = render(file, src);
  if (out === src) { console.log(`${file}: up to date (${count} prices)`); continue; }
  stale++;
  if (CHECK) { console.log(`${file}: OUT OF DATE, run node tools/prerender-prices.mjs`); continue; }
  fs.writeFileSync(full, out);
  console.log(`${file}: written (${count} prices)`);
}
if (CHECK && stale) process.exit(1);
