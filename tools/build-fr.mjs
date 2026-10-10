#!/usr/bin/env node
/* =========================================================
   LA GOFFINERIE — tools/build-fr.mjs
   Writes the French pages, fr/<page>.html, from the English pages and the French dictionary each
   of them carries (const FR = { … };, the one setLang() uses in the browser), so the French text is
   in the page source: search engines index it as its own page, AI crawlers and link previews (no
   JavaScript) read it. English stays at the root (/x.html), French is /fr/x.html.

     node tools/build-fr.mjs          write fr/*.html, the hreflang links of the English pages and sitemap.xml
     node tools/build-fr.mjs --check  change nothing; exit 1 if a file is out of date

   Run it after any change of text (English or French) or of markup in one of the pages below, and
   after node tools/prerender-prices.mjs: that one fills the prices of the English pages, then this
   one copies them and has their prices written in French by the same render().
   Exit codes: 0 all good; 1 (--check) a file is out of date; 2 a page cannot be built (its problems
   are listed; nothing is written for it, the other pages are still built).

   A French page is its English page with:
     · <html lang="fr">;
     · the content of every data-i18n element from FR (the outermost one, as setLang() does), the
       placeholder / alt / aria-label of data-i18n-ph / -alt / -aria from FR (aria: FR, else the
       page's AR map), the data-lang blocks shown for fr and hidden for en, the contact form's
       language field set to fr, and the few aria-labels no dictionary carries (ARIA below);
     · in the head: FR.title, FR.desc as the description (a {key} in it is a price, see
       prerender-prices.mjs), FR.og_title (else FR.title), FR.og_desc (else FR.desc), og:locale
       fr_BE, canonical and og:url on itself, hreflang en / fr / x-default (= en);
     · JSON-LD in French: FAQPage questions and answers from FR.qN / FR.aN, Service from FR.ld_name,
       FR.ld_type and FR.ld_desc, ProfilePage FR.ld_job, and the url of the page itself;
     · its relative URLs: links between pages are kept (every page here has its French twin, so
       they stay in fr/), everything else (assets/, the scripts, any other file) gets « ../ »; the
       contact form's return address (_next) is the French home page.
   The scripts are copied as they are: the same code runs on both, reads <html lang> (PAGE_LANG) to
   know which page it is on, and sends the language switch to the other one.
   FR keys that are plain text, not HTML: title, desc, og_title, og_desc, ld_*. A data-i18n key that
   FR lacks stays English, as in the browser, and is listed.
   The English pages get the same hreflang links, and sitemap.xml lists both versions of each page
   (each French entry repeats the English one: lastmod, priority, images), with the alternates.
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { render as renderPrices, report, escAttr, escText, decode, plainText } from './prerender-prices.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://lagoffinerie.be/';
const PAGES = ['index.html', 'work.html', 'about.html', 'websites.html', 'digital-strategy.html', 'ai-automation.html',
  'mentions-legales.html', 'cgu.html', 'donnees-personnelles.html', 'cookies.html'];
const CHECK = process.argv.includes('--check');
/* aria-labels written in the markup and translated only by code at run time (index.html's carousel, nav.js). */
const ARIA = {
  'Language': 'Langue', 'Mobile navigation': 'Navigation mobile', 'Our three services': 'Nos trois services',
  'Work': 'Réalisations', 'Projects': 'Projets', 'Previous project': 'Projet précédent', 'Next project': 'Projet suivant'
};

const name = (file) => (file === 'index.html' ? '' : file);   // the home page is « / »
const url = (file, L) => SITE + (L === 'fr' ? 'fr/' : '') + name(file);
const alternates = (file, indent) => [
  `<link rel="alternate" hreflang="en" href="${url(file, 'en')}">`,
  `<link rel="alternate" hreflang="fr" href="${url(file, 'fr')}">`,
  `<link rel="alternate" hreflang="x-default" href="${url(file, 'en')}">`
].map((l) => indent + l).join('\n');

/* ---------- reading a page ---------- */
/* Tags in document order, with their positions; the text of <script> and <style> and comments are skipped. */
function tags(src) {
  const out = [];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) { out.push({ close: true, tag: m[1].toLowerCase(), start: m.index, end: re.lastIndex }); continue; }
    const tag = m[2].toLowerCase();
    out.push({ close: false, tag, attrs: m[3], start: m.index, end: re.lastIndex });
    if (tag === 'script' || tag === 'style') {
      const close = src.toLowerCase().indexOf('</' + tag, re.lastIndex);
      re.lastIndex = close < 0 ? src.length : close;
    }
  }
  return out;
}
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const attr = (attrs, a) => { const m = new RegExp(`\\s${a}="([^"]*)"`).exec(attrs); return m ? m[1] : null; };
/* Set (or remove, with null) one attribute of a tag. */
function setAttr(tagText, a, value) {
  const re = new RegExp(`\\s${a}(?:="[^"]*")?(?=[\\s/>])`);
  if (value === null) return tagText.replace(re, '');
  const v = value === true ? '' : `="${value}"`;
  if (re.test(tagText)) return tagText.replace(re, ` ${a}${v}`);
  return tagText.replace(/\s*(\/?)>$/, ` ${a}${v}$1>`);
}
/* Apply [start, end, text] edits, which never overlap. */
function apply(src, edits) {
  edits.sort((a, b) => b[0] - a[0]);
  for (const [s, e, t] of edits) src = src.slice(0, s) + t + src.slice(e);
  return src;
}
/* The literal object after « const NAME = » (FR) or « const NAME= » (AR), read by vm. */
function literal(src, re, label, problem) {
  const m = re.exec(src);
  if (!m) return null;
  const start = m.index + m[0].length - 1;
  const end = label === 'FR' ? src.indexOf('\n};', start) + 2 : (() => {   // AR: the matching brace
    let d = 0;
    for (let i = start; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) return i + 1; }
    return -1;
  })();
  if (end < 2) { problem(`the ${label} object has no end`); return null; }
  try { return vm.runInNewContext('(' + src.slice(start, end) + ')', {}); } catch (e) { problem(`${label} cannot be read (${e.message})`); return null; }
}

/* ---------- relative URLs ---------- */
/* A link to one of the pages stays as it is (in fr/ it leads to the French twin); anything else is a shared file, one folder up. */
function frUrl(v) {
  if (/^([a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(v)) return v;   // absolute, scheme (data:, mailto:, tel:…), same page
  const p = v.split(/[?#]/)[0];
  if (p === '' || p === '.' || p === './' || (PAGES.includes(p.replace(/^\.\//, '')))) return v;
  return '../' + v;
}
const PAGE_LINK = /^(?:\.\/?)?(?:[\w-]+\.html)?(?:[?#].*)?$/;

/* ---------- one French page ---------- */
function build(file, src, problems) {
  const problem = (msg) => { if (!problems.has(msg)) problems.set(msg, []); };
  const FR = literal(src, /\nconst FR = \{/, 'FR', problem);
  if (!FR) { problem('no « const FR = { … }; » dictionary'); return null; }
  const AR = (literal(src, /\bconst AR=\{/, 'AR', problem) || {}).fr || {};
  for (const k of ['title', 'desc']) if (typeof FR[k] !== 'string') problem(`FR.${k} is missing (the French ${k === 'title' ? 'title' : 'meta description'})`);
  // A dictionary string is written into the page as it is at run time too: a relative URL in it must be a page.
  for (const [k, v] of Object.entries(FR)) {
    if (typeof v !== 'string') continue;
    for (const m of v.matchAll(/\s(?:href|src)=\\?"([^"\\]*)\\?"/g)) {
      if (!/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(m[1]) && !PAGE_LINK.test(m[1])) problem(`FR.${k} links to « ${m[1]} », which is not a page: write it from the root (/…) so it works from fr/ too`);
    }
  }

  // 1. The data-i18n contents (the outermost element, as setLang() does), and what each English question is.
  const enQ = {};
  const missing = new Set();
  let out = src;
  {
    const t = tags(out), edits = [];
    for (let i = 0; i < t.length; i++) {
      const o = t[i];
      if (o.close || VOID.has(o.tag)) continue;
      const key = attr(o.attrs, 'data-i18n');
      if (key === null) continue;
      let d = 0, j = i + 1;
      for (; j < t.length; j++) {
        if (t[j].tag !== o.tag) continue;
        if (!t[j].close) d++; else if (d-- === 0) break;
      }
      if (j >= t.length) { problem(`<${o.tag} data-i18n="${key}"> has no closing tag`); continue; }
      const inner = out.slice(o.end, t[j].start);
      if (/^q\d+$/.test(key)) enQ[plainText(inner)] = key;
      if (typeof FR[key] === 'string') edits.push([o.end, t[j].start, FR[key]]); else missing.add(key);
      while (i + 1 < t.length && t[i + 1].start < t[j].end) i++;   // what is inside is replaced with it
    }
    out = apply(out, edits);
  }

  // 2. Attributes, everywhere (the French contents included, as at run time).
  {
    const edits = [];
    for (const o of tags(out)) {
      if (o.close) continue;
      let tag = out.slice(o.start, o.end), k;
      if ((k = attr(o.attrs, 'data-i18n-ph')) !== null) { if (typeof FR[k] === 'string') tag = setAttr(tag, 'placeholder', escAttr(FR[k])); else missing.add(k); }
      if ((k = attr(o.attrs, 'data-i18n-alt')) !== null) { if (typeof FR[k] === 'string') tag = setAttr(tag, 'alt', escAttr(FR[k])); else missing.add(k); }
      if ((k = attr(o.attrs, 'data-i18n-aria')) !== null) {
        const v = typeof FR[k] === 'string' ? FR[k] : AR[k];
        if (typeof v === 'string') tag = setAttr(tag, 'aria-label', escAttr(v)); else missing.add(k);
      } else {
        const a = attr(o.attrs, 'aria-label');
        if (a !== null && ARIA[decode(a)]) tag = setAttr(tag, 'aria-label', escAttr(ARIA[decode(a)]));
      }
      const dl = attr(o.attrs, 'data-lang');
      if (dl === 'fr') tag = setAttr(tag, 'hidden', null);
      else if (dl === 'en') tag = setAttr(tag, 'hidden', true);
      if (attr(o.attrs, 'id') === 'f-lang') tag = setAttr(tag, 'value', 'fr');
      if (attr(o.attrs, 'name') === '_next') {
        const v = attr(o.attrs, 'value') || '';
        if (v.startsWith(SITE) && !v.startsWith(SITE + 'fr/')) tag = setAttr(tag, 'value', SITE + 'fr/' + v.slice(SITE.length));
      }
      for (const a of ['href', 'src']) {
        const v = attr(o.attrs, a);
        if (v !== null && frUrl(v) !== v) tag = setAttr(tag, a, frUrl(v));
      }
      if (tag !== out.slice(o.start, o.end)) edits.push([o.start, o.end, tag]);
    }
    out = apply(out, edits);
  }

  // 3. The head.
  const head = (re, to, what, optional) => {
    if (!re.test(out)) { if (!optional) problem(`no ${what} in the English page`); return; }
    out = out.replace(re, to);
  };
  const metaTpl = (start, text) => /\{\w+\}/.test(text)
    ? `${start} data-price-tpl="${escAttr(text)}" content="">`               // the amounts: render() below
    : `${start} content="${escAttr(text)}">`;
  head(/<html lang="en">/, '<html lang="fr">', '<html lang="en">');
  if (typeof FR.title === 'string') head(/<title>[^<]*<\/title>/, () => `<title>${escText(FR.title)}</title>`, '<title>');
  if (typeof FR.desc === 'string') head(/<meta name="description"[^>]*>/, () => metaTpl('<meta name="description"', FR.desc), 'meta description');
  head(/<meta property="og:title"[^>]*>/, () => `<meta property="og:title" content="${escAttr(FR.og_title || FR.title || '')}">`, 'og:title', true);
  head(/<meta property="og:description"[^>]*>/, () => metaTpl('<meta property="og:description"', FR.og_desc || FR.desc || ''), 'og:description', true);
  head(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url(file, 'fr')}">`, 'og:url', true);
  head(/<meta property="og:locale" content="en_BE">/, '<meta property="og:locale" content="fr_BE">', 'og:locale', true);
  head(/<meta property="og:locale:alternate" content="fr_BE">/, '<meta property="og:locale:alternate" content="en_BE">', 'og:locale:alternate', true);
  head(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url(file, 'fr')}">`, 'canonical');
  out = withAlternates(out, file, problem);

  // 4. JSON-LD.
  out = out.replace(/(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/g, (whole, open, json, close) => {
    let data;
    try { data = JSON.parse(json); } catch (e) { problem(`unreadable JSON-LD (${e.message})`); return whole; }
    const type = data['@type'];
    if (type === 'FAQPage') {
      for (const q of data.mainEntity || []) {
        const k = enQ[q.name], n = k && k.slice(1);
        if (!k) { problem(`FAQPage: « ${q.name} » is not a question of the page (data-i18n="qN")`); continue; }
        if (typeof FR['q' + n] !== 'string' || typeof FR['a' + n] !== 'string') { problem(`FAQPage: FR.q${n} or FR.a${n} is missing`); continue; }
        q.name = plainText(FR['q' + n]);
        q.acceptedAnswer.text = plainText(FR['a' + n]);
      }
    } else if (type === 'Service') {
      for (const [f, k] of [['name', 'ld_name'], ['serviceType', 'ld_type'], ['description', 'ld_desc']]) {
        if (typeof FR[k] === 'string') data[f] = FR[k]; else problem(`Service: FR.${k} is missing (its ${f} in French)`);
      }
      data.url = url(file, 'fr');
    } else if (type === 'ProfilePage') {
      data.url = url(file, 'fr');
      if (data.mainEntity && FR.ld_job) data.mainEntity.jobTitle = FR.ld_job;
    } else return whole;                                     // ProfessionalService (its description: render()), WebSite
    return open + JSON.stringify(data, null, 1) + close;
  });

  // 5. The prices, in French.
  const r = renderPrices('fr/' + file, out);
  for (const [msg, lines] of r.problems) problems.set(msg, lines);
  return { out: r.out, missing: [...missing] };
}

/* The hreflang links, right after the canonical one, the same on both versions. */
function withAlternates(src, file, problem) {
  const s = src.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n/g, '');
  const m = /^([ \t]*)<link rel="canonical" href="[^"]*">\n/m.exec(s);
  if (!m) { problem('no <link rel="canonical"> to put the hreflang links after'); return src; }
  return s.slice(0, m.index + m[0].length) + alternates(file, m[1]) + '\n' + s.slice(m.index + m[0].length);
}

/* ---------- sitemap.xml: both versions of each page, with their alternates ---------- */
function sitemap(src, problem) {
  const blocks = [...src.matchAll(/([ \t]*)<url>\n[\s\S]*?<\/url>\n/g)];
  if (!blocks.length) { problem('no <url> entries'); return src; }
  const before = src.slice(0, blocks[0].index), after = src.slice(blocks.at(-1).index + blocks.at(-1)[0].length);
  const out = [];
  for (const b of blocks) {
    const loc = (/<loc>([^<]*)<\/loc>/.exec(b[0]) || [])[1] || '';
    if (loc.startsWith(SITE + 'fr/')) continue;                // the French entries are written again below
    const file = PAGES.find((f) => loc === url(f, 'en'));
    if (!file) { out.push(b[0]); continue; }
    const ind = b[1] + '  ';
    const links = ['en', 'fr', 'x-default'].map((h) => `${ind}<xhtml:link rel="alternate" hreflang="${h}" href="${url(file, h === 'fr' ? 'fr' : 'en')}"/>`).join('\n');
    let en = b[0].replace(/[ \t]*<xhtml:link [^>]*\/>\n/g, '');
    en = en.replace(/^[ \t]*(?:<image:image>|<\/url>)/m, (line) => links + '\n' + line);   // before the images
    out.push(en, en.replace(`<loc>${url(file, 'en')}</loc>`, `<loc>${url(file, 'fr')}</loc>`));
  }
  for (const f of PAGES) if (!out.some((b) => b.includes(`<loc>${url(f, 'en')}</loc>`))) problem(`${url(f, 'en')} is not listed`);
  return before + out.join('') + after;
}

/* ---------- all pages ---------- */
let stale = 0, broken = 0;
const writes = [];
function result(file, now, next) {
  if (now === next) { console.log(`${file}: up to date`); return; }
  stale++;
  if (CHECK) { console.log(`${file}: OUT OF DATE, run node tools/build-fr.mjs`); return; }
  writes.push([file, next]);
}
const read = (f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { return null; } };
for (const file of PAGES) {
  const src = read(file);
  const problems = new Map();
  const en = withAlternates(src, file, (msg) => problems.set(msg, []));
  const fr = build(file, en, problems);
  if (problems.size || !fr) {
    broken++;
    report(file, problems);
    console.error(`${file}: ${CHECK ? 'NOT CHECKED' : 'NOT WRITTEN'}, fix the problems above`);
    continue;
  }
  if (fr.missing.length) console.log(`${file}: stays English in fr/ (no FR key): ${fr.missing.join(', ')}`);
  result(file, src, en);
  result('fr/' + file, read('fr/' + file), fr.out);
}
{
  const problems = new Map();
  const src = read('sitemap.xml');
  const next = sitemap(src, (msg) => problems.set(msg, []));
  if (problems.size) { broken++; report('sitemap.xml', problems); }
  else result('sitemap.xml', src, next);
}
if (!CHECK) {
  fs.mkdirSync(path.join(ROOT, 'fr'), { recursive: true });
  for (const [file, text] of writes) { fs.writeFileSync(path.join(ROOT, file), text); console.log(`${file}: written`); }
}
if (broken) process.exit(2);
if (CHECK && stale) process.exit(1);
