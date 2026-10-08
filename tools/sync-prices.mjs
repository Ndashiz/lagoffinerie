#!/usr/bin/env node
/* =========================================================
   LA GOFFINERIE — tools/sync-prices.mjs
   Writes the prices set in Jarvis (La Goffinerie → Technique)
   into config.js. Visitors already see them — site-state.js
   re-prices every page from Jarvis's fresh answer — but the page
   source, search engines and link previews read config.js and the
   pre-rendered pages: run tools/prerender-prices.mjs after this.
   The GitHub Action « Sync prices from Jarvis »
   (.github/workflows/sync-prices.yml) runs both every hour and
   commits what changed.

     node tools/sync-prices.mjs                  read Jarvis, rewrite config.js if it differs
     node tools/sync-prices.mjs --check          change nothing; exit 1 if config.js differs
     node tools/sync-prices.mjs --from x.json    read the answer from a file instead of Jarvis

   What it reads: GET https://jarvis.ndashiz.be/api/gf/config,
   its `pricing` — the amounts Jarvis lays over config.js, with the
   same keys and the same shapes (a number, [low, high], or
   { quote: true, from }), or null when Jarvis does not drive the
   prices. Then config.js is left alone.

   What it writes: only the literal at each path (packages.pro.build:
   « packages » among LG_CONFIG's keys, then « pro » among its keys,
   then « build »), the comments and the alignment kept. Each step
   of a path must be there once, outside the comments; the new file
   is evaluated and compared with what was asked before it is
   written.

   Exit codes: 0 done or nothing to do (Jarvis unreachable is a
   warning, not a failure: the next run tries again), 1 --check
   found a difference, 2 the answer does not fit config.js (a key
   renamed on one side, a broken amount): fix it, nothing written.
   ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ROOT, 'config.js');
const JARVIS = 'https://jarvis.ndashiz.be/api/gf/config';
const CHECK = process.argv.includes('--check');
const FROM = (() => { const i = process.argv.indexOf('--from'); return i > 0 ? process.argv[i + 1] : null; })();

function fail(msg) { console.error('sync-prices: ' + msg); process.exit(2); }
function summary(lines) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}

/* ---------- the answer ---------- */
async function readAnswer() {
  if (FROM) return JSON.parse(fs.readFileSync(path.resolve(FROM), 'utf8'));
  try {
    const res = await fetch(JARVIS, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    // Not a failure: the visitors' pages fall back the same way, and the next run tries again.
    console.log(`::warning::Jarvis did not answer (${e.message}); config.js left as it is.`);
    process.exit(0);
  }
}

/* ---------- config.js, read the way the browser reads it ---------- */
function evaluate(src) {
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox, { filename: 'config.js' });
  if (!sandbox.window.LG_CONFIG) fail('config.js does not define window.LG_CONFIG');
  return JSON.parse(JSON.stringify(sandbox.window.LG_CONFIG));
}

/* ---------- shapes, as in site-state.js ---------- */
const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e7;
const isRange = (v) => Array.isArray(v) && v.length === 2 && isNum(v[0]) && isNum(v[1]);
const isFrom = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && v.quote === true && isNum(v.from);
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const literal = (v) => (Array.isArray(v) ? `[${v[0]}, ${v[1]}]` : isObj(v) ? `{ quote: true, from: ${v.from} }` : String(v));

/** Every amount of `pricing`, checked against config.js: [{ path, from, to }], only those that change. */
function updates(pricing, cfg) {
  const out = [];
  (function walk(src, ref, at) {
    for (const [k, v] of Object.entries(src)) {
      const where = [...at, k].join('.');
      if (!isObj(ref) || !Object.prototype.hasOwnProperty.call(ref, k)) fail(`Jarvis sets « ${where} », which config.js does not have`);
      const r = ref[k];
      if (isRange(r)) {
        if (!isRange(v) || v[0] > v[1]) fail(`« ${where} » should be [low, high], Jarvis sent ${JSON.stringify(v)}`);
        if (v[0] !== r[0] || v[1] !== r[1]) out.push({ path: [...at, k], from: r, to: [v[0], v[1]] });
      } else if (isFrom(r)) {
        if (!isFrom(v)) fail(`« ${where} » should be { quote: true, from }, Jarvis sent ${JSON.stringify(v)}`);
        if (v.from !== r.from) out.push({ path: [...at, k], from: r, to: { quote: true, from: v.from } });
      } else if (isNum(r)) {
        if (!isNum(v)) fail(`« ${where} » should be a number, Jarvis sent ${JSON.stringify(v)}`);
        if (v !== r) out.push({ path: [...at, k], from: r, to: v });
      } else if (isObj(r)) {
        if (!isObj(v)) fail(`« ${where} » should be a group of amounts, Jarvis sent ${JSON.stringify(v)}`);
        walk(v, r, [...at, k]);
      } else {
        fail(`« ${where} » is not an amount in config.js`);
      }
    }
  })(pricing, cfg, []);
  return out;
}

/** The source with its comments blanked out, same length, so a match's position is a position in the file. */
function blankComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return src.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:'"\\])(\/\/.*)$/gm, (m, pre, c) => pre + blank(c));
}

/* ---------- where a value sits: path by path, inside its parent's braces ----------
   `packages.pro.build`: « packages » once among LG_CONFIG's own keys, « pro » once among its keys,
   « build » once among pro's — so the two `build:` of config.js are never confused. */
function skipString(code, j) { const q = code[j]; for (j++; j < code.length && code[j] !== q; j++) if (code[j] === '\\') j++; return j; }
function closing(code, i) {
  let depth = 0;
  for (let j = i; j < code.length; j++) {
    const c = code[j];
    if (c === '"' || c === "'") { j = skipString(code, j); continue; }
    if (c === '{' || c === '[') depth++;
    else if ((c === '}' || c === ']') && --depth === 0) return j;
  }
  fail('config.js: unbalanced brackets');
}
/** The start of the value of `key` among the keys of the object body [from, to): -1 absent, -2 twice. */
function findKey(code, from, to, key) {
  const re = new RegExp(String.raw`^${key}\s*:\s*`);
  let depth = 0, hit = -1;
  for (let j = from; j < to; j++) {
    const c = code[j];
    if (c === '"' || c === "'") { j = skipString(code, j); continue; }
    if (c === '{' || c === '[') { depth++; continue; }
    if (c === '}' || c === ']') { depth--; continue; }
    if (depth || !/[A-Za-z_$]/.test(c) || /[\w$]/.test(code[j - 1] || '')) continue;
    const m = re.exec(code.slice(j, to));
    if (!m) continue;
    if (hit !== -1) return -2;
    hit = j + m[0].length;
  }
  return hit;
}
function valueEnd(code, i) {
  if (code[i] === '{' || code[i] === '[') return closing(code, i) + 1;
  const m = /^-?\d+(?:\.\d+)?/.exec(code.slice(i));
  return m ? i + m[0].length : -1;
}
/** [start, end) of the literal at `path` in config.js. */
function locate(code, path) {
  let from = code.indexOf('{', code.indexOf('LG_CONFIG'));
  if (from < 0) fail('config.js: no « window.LG_CONFIG = { … } »');
  let to = closing(code, from);
  for (let i = 0; i < path.length; i++) {
    const where = path.slice(0, i + 1).join('.');
    const at = findKey(code, from + 1, to, path[i]);
    if (at === -1) fail(`« ${where} » is not in config.js (outside the comments)`);
    if (at === -2) fail(`« ${where} » is written twice in config.js; it must be there once`);
    const end = valueEnd(code, at);
    if (end < 0) fail(`« ${where} » in config.js is not a literal this tool can rewrite`);
    if (i === path.length - 1) return [at, end];
    if (code[at] !== '{') fail(`« ${where} » in config.js is not a group of amounts`);
    from = at; to = end - 1;
  }
}

/** Rewrite one literal in place; a trailing comment on the same line keeps its column. */
function rewrite(src, path, value) {
  const [start, end] = locate(blankComments(src), path);
  const next = literal(value);
  const delta = next.length - (end - start);
  let rest = src.slice(end);
  const eol = rest.indexOf('\n') < 0 ? rest.length : rest.indexOf('\n');
  // `essentiel: { build: 700,  monthly: 20 },            // …`: give or take spaces before the `//`.
  const line = rest.slice(0, eol).replace(/( +)(?=\/\/)/, (sp) => ' '.repeat(Math.max(1, sp.length - delta)));
  rest = line + rest.slice(eol);
  return src.slice(0, start) + next + rest;
}

/* ---------- run ---------- */
const answer = await readAnswer();
if (!isObj(answer)) fail('the answer is not a JSON object');
if (answer.pricing === null || answer.pricing === undefined) {
  console.log('Jarvis does not drive the prices (pricing: null): config.js decides, nothing to do.');
  process.exit(0);
}
if (!isObj(answer.pricing)) fail('`pricing` is neither null nor an object');

const src = fs.readFileSync(CONFIG, 'utf8');
const cfg = evaluate(src);
const todo = updates(answer.pricing, cfg);
if (!todo.length) {
  console.log('config.js already shows the prices set in Jarvis.');
  process.exit(0);
}
const lines = todo.map((u) => `${u.path.join('.')}: ${literal(u.from)} → ${literal(u.to)}`);
console.log(lines.join('\n'));
if (CHECK) {
  console.log(`config.js: OUT OF DATE (${todo.length} amount${todo.length === 1 ? '' : 's'}), run node tools/sync-prices.mjs`);
  process.exit(1);
}

let out = src;
for (const u of todo) out = rewrite(out, u.path, u.to);
// The new file must say exactly what was asked, and nothing else may have moved.
const expected = JSON.parse(JSON.stringify(cfg));
for (const u of todo) u.path.slice(0, -1).reduce((o, k) => o[k], expected)[u.path[u.path.length - 1]] = u.to;
if (JSON.stringify(evaluate(out)) !== JSON.stringify(expected)) fail('the rewritten config.js does not read back as asked; nothing written');
fs.writeFileSync(CONFIG, out);
console.log(`config.js: written (${todo.length} amount${todo.length === 1 ? '' : 's'}). Now run node tools/prerender-prices.mjs.`);
summary(['### Prices set in Jarvis, written into config.js', '', ...lines.map((l) => `- \`${l}\``)]);
