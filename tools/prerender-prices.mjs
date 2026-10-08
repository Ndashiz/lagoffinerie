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
   Exit codes: 0 all good; 1 (--check) a file is out of date; 2 a page uses a price key that PRICE
   does not know, or config.js has no value for one (each named with its file, key and lines; that
   file is left untouched, the other files are still processed).

   The keys: PRICE in estimator.js, read from that file (the same map fill() uses in the browser):
   ess, ess_m (Essentiel build and monthly), pro, pro_m (Pro build and monthly), seo (the SEO add-on
   range), hourly, pack, pack_hours, domain.

   What it writes, in each page:
     · every element carrying data-price="key": its text becomes the amount in English
       format (the HTML is the English page: « €1,000 »);
     · inside the French dictionary (const FR = { … };): data-price=\"key\">…< (or data-price="key">…<
       in a single-quoted string) gets the French format (« 1 000 € »);
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
const FILES = ['index.html', 'websites.html', 'digital-strategy.html', 'ai-automation.html'];
const CHECK = process.argv.includes('--check');

/* ---------- config.js, read the way the browser reads it ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8'), sandbox, { filename: 'config.js' });
const CFG = sandbox.window.LG_CONFIG;
if (!CFG) fail('config.js does not define window.LG_CONFIG');

/* ---------- the price keys: PRICE in estimator.js ---------- */
const PRICE = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'estimator.js'), 'utf8');
  const m = src.match(/\bvar PRICE\s*=\s*(\{[^{}]*\});/);
  if (!m) fail('estimator.js: no « var PRICE={ … }; » found');
  let map;
  try { map = vm.runInNewContext('(' + m[1] + ')', {}); } catch (e) { fail(`estimator.js: PRICE is not a plain object (${e.message})`); }
  for (const [k, v] of Object.entries(map)) if (typeof v !== 'string') fail(`estimator.js: PRICE.${k} is not a path string`);
  return map;
})();
const KNOWN = Object.keys(PRICE).join(', ');

/* ---------- formats, as in estimator.js ---------- */
const ON_QUOTE = { fr: 'sur devis', en: 'on quote' };
function num(n, L) {
  const v = Math.abs(+n || 0);
  const s = v.toLocaleString(L === 'fr' ? 'fr-BE' : 'en-GB', { maximumFractionDigits: 0 });
  return (n < 0 ? '−' : '') + s.replace(/\s/g, ' ');
}
function money(n, L) { return L === 'fr' ? num(n, L) + ' €' : (n < 0 ? '−' : '') + '€' + num(Math.abs(n), L); }
function isQuote(v) { return !!(v && typeof v === 'object' && !Array.isArray(v) && v.quote); }
function span(v, L) {
  if (isQuote(v)) return ON_QUOTE[L];
  if (!Array.isArray(v)) return money(v, L);
  if (+v[0] === +v[1]) return money(v[0], L);
  return L === 'fr' ? num(v[0], L) + ' à ' + money(v[1], L) : money(v[0], L) + ' to ' + money(v[1], L);
}

/* ---------- small helpers ---------- */
const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function decode(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
}
function plainText(html) {
  return decode(html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '').replace(/<[^>]+>/g, ''))
    .replace(/[ \t\r\n]+/g, ' ').trim();
}
const lineAt = (s, i) => s.slice(0, i).split('\n').length;   // replacements never add a line, so any state of the page will do
function fail(msg) { console.error('prerender-prices: ' + msg); process.exit(2); }

/* ---------- one page ---------- */
function render(file, src) {
  let out = src, count = 0;
  const problems = new Map();                                 // message → lines
  const problem = (msg, line) => { if (!problems.has(msg)) problems.set(msg, []); if (line) problems.get(msg).push(line); };
  /* The amount for a key, or null (and a problem noted) when the key is unknown or config.js has no value. */
  function price(key, L, line) {
    if (!Object.prototype.hasOwnProperty.call(PRICE, key)) { problem(`unknown price key « ${key} » (known: ${KNOWN})`, line); return null; }
    const v = PRICE[key].split('.').reduce((o, k) => (o == null ? undefined : o[k]), CFG);
    if (v == null) { problem(`config.js has no value for « ${key} » (${PRICE[key]})`, line); return null; }
    return key === 'pack_hours' ? num(v, L) : span(v, L);
  }

  // 1. The French dictionary: cut it out, fill it in French, put it back.
  const frStart = out.indexOf('const FR = {');
  let frEnd = -1;
  if (frStart >= 0) {
    frEnd = out.indexOf('\n};', frStart);
    if (frEnd < 0) { problem('the French dictionary has no closing « }; »'); return { out: src, count, problems }; }
    const fr = out.slice(frStart, frEnd).replace(/(data-price=(\\?)"(\w+)\2">)([^<]*)(<)/g, (m, open, _bs, key, old, close, off) => {
      const s = price(key, 'fr', lineAt(out, frStart + off));
      if (s == null) return m;
      count++; return open + escText(s) + close;
    });
    out = out.slice(0, frStart) + fr + out.slice(frEnd);
    frEnd = frStart + fr.length;
  }

  // 2. Elements outside the dictionary: English amounts.
  const fillEn = (part, base) => part.replace(/(<[a-zA-Z][^<>]*\sdata-price="(\w+)"[^<>]*>)([^<]*)(<\/)/g, (m, open, key, _old, close, off) => {
    const s = price(key, 'en', lineAt(out, base + off));
    if (s == null) return m;
    count++; return open + escText(s) + close;
  });
  out = frStart >= 0 ? fillEn(out.slice(0, frStart), 0) + out.slice(frStart, frEnd) + fillEn(out.slice(frEnd), frEnd) : fillEn(out, 0);

  // 3. Meta tags with a template.
  let description = null;
  out = out.replace(/<meta\b[^>]*\bdata-price-tpl="([^"]*)"[^>]*>/g, (tag, tpl, off) => {
    const line = lineAt(out, off);
    let missing = false;
    const text = decode(tpl).replace(/\{(\w+)\}/g, (m, key) => { const s = price(key, 'en', line); if (s == null) { missing = true; return m; } return s; });
    if (!/\scontent="[^"]*"/.test(tag)) { problem('a meta with data-price-tpl has no content attribute', line); return tag; }
    if (missing) return tag;
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
  out = out.replace(/(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/g, (whole, open, json, close, off) => {
    let data;
    try { data = JSON.parse(json); } catch (e) { problem(`unreadable JSON-LD (${e.message})`, lineAt(out, off)); return whole; }
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

  for (const m of out.matchAll(/data-price=(\\?)"\w+\1"[^<>]*>—</g)) problem('a price slot is still empty', lineAt(out, m.index));
  return { out, count, problems };
}

/* ---------- all pages ---------- */
let stale = 0, broken = 0;
for (const file of FILES) {
  const full = path.join(ROOT, file);
  const src = fs.readFileSync(full, 'utf8');
  const { out, count, problems } = render(file, src);
  if (problems.size) {
    broken++;
    for (const [msg, lines] of problems) console.error(`${file}${lines.length ? ':' + [...new Set(lines)].sort((a, b) => a - b).join(',') : ''}: ${msg}`);
    console.error(`${file}: ${CHECK ? 'NOT CHECKED' : 'NOT WRITTEN'}, fix the problems above`);
    continue;
  }
  if (out === src) { console.log(`${file}: up to date (${count} prices)`); continue; }
  stale++;
  if (CHECK) { console.log(`${file}: OUT OF DATE, run node tools/prerender-prices.mjs`); continue; }
  fs.writeFileSync(full, out);
  console.log(`${file}: written (${count} prices)`);
}
if (broken) process.exit(2);
if (CHECK && stale) process.exit(1);
