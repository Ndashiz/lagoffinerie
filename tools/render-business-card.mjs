/* La Goffinerie — rend la carte de visite (print/carte-de-visite/carte.html) en fichiers d'impression.
   Usage : node tools/render-business-card.mjs
   Produit dans print/carte-de-visite/export/ :
     recto.pdf, verso.pdf  — une face par fichier, 94 × 54 mm (90 × 50 + 2 mm de fond perdu), vectoriel, polices incorporées
     carte.pdf             — les deux faces dans un seul PDF (page 1 recto, page 2 verso)
     recto.png, verso.png  — les mêmes faces en 600 dpi (2220 × 1276 px) pour les imprimeurs qui veulent une image
     apercu.png            — les deux faces découpées, pour se faire une idée
   Puis vérifie que le QR code du verso se lit toujours (logo au centre), sur l'image 600 dpi et sur une version
   réduite à la taille d'un appareil photo de téléphone ; sort en erreur sinon.
   Playwright et le Chromium de la machine ; jsqr + pngjs pour la lecture du QR (npm i -g jsqr pngjs si absents). */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const globalRoot = () => execSync('npm root -g').toString().trim();
const load = (name) => { try { return require(name); } catch { return require(join(globalRoot(), name)); } };

const { chromium } = load('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', 'print', 'carte-de-visite', 'carte.html');
const out = join(here, '..', 'print', 'carte-de-visite', 'export');
mkdirSync(out, { recursive: true });

const DPI = 600, MM = DPI / 25.4; // px par mm
const FONTS = ['800 20px Sora', '700 20px Sora', '500 20px "Instrument Sans"', '700 20px "Instrument Sans"', '600 20px "JetBrains Mono"'];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const open = async (query = '') => {
    await page.goto(pathToFileURL(src).href + query, { waitUntil: 'networkidle' });
    await page.evaluate(async (fonts) => {
      await document.fonts.ready;
      await Promise.all(fonts.map((f) => document.fonts.load(f)));
    }, FONTS);
    const missing = await page.evaluate((fonts) => fonts.filter((f) => !document.fonts.check(f)), FONTS);
    if (missing.length) throw new Error('Polices non chargées (réseau ?) : ' + missing.join(', '));
  };

  await open();
  // rien ne doit sortir de la zone de sécurité (.face) : un texte trop long ou une ligne qui passe à la ligne
  // finirait dans les 4 mm de marge, voire sous la coupe ; 1 mm de tolérance (le logo du recto en déborde de 0,6)
  const overflow = await page.evaluate(() => {
    const px = 96 / 25.4, out = [];
    document.querySelectorAll('.face').forEach((face, i) => {
      const f = face.getBoundingClientRect();
      face.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return; // <br>, <defs>… : pas de boîte réelle
        const d = Math.max(f.left - r.left, r.right - f.right, f.top - r.top, r.bottom - f.bottom) / px;
        if (d > 1) out.push(`${['recto', 'verso'][i]} : <${el.tagName.toLowerCase()}${el.classList[0] ? '.' + el.classList[0] : ''}> sort de la zone de sécurité de ${d.toFixed(1)} mm`);
      });
    });
    return out;
  });
  if (overflow.length) throw new Error(overflow.join('\n'));
  await page.emulateMedia({ media: 'print' });
  const pdf = (file, pageRanges) => page.pdf({
    path: join(out, file), printBackground: true, preferCSSPageSize: true,
    width: '94mm', height: '54mm', margin: { top: 0, right: 0, bottom: 0, left: 0 }, pageRanges
  });
  await pdf('carte.pdf');
  await pdf('recto.pdf', '1');
  await pdf('verso.pdf', '2');

  // PNG 600 dpi : deviceScaleFactor se fixe à la création du contexte, on rouvre la page dans un contexte 600 dpi
  // et on capture chaque face (.page = le document complet de 94 × 54 mm, fond perdu compris)
  const ctx = await browser.newContext({ deviceScaleFactor: DPI / 96, viewport: { width: 1200, height: 900 } });
  const hi = await ctx.newPage();
  const openHi = async (query) => {
    await hi.goto(pathToFileURL(src).href + query, { waitUntil: 'networkidle' });
    await hi.evaluate(async (fonts) => { await document.fonts.ready; await Promise.all(fonts.map((f) => document.fonts.load(f))); }, FONTS);
  };
  await openHi('');
  // le fond de l'écran passe au papier : la boîte d'une face tombe sur des pixels fractionnaires et le recadrage
  // est arrondi, le pixel de trop est alors couleur papier plutôt que gris ; recadrage à 94 × 54 mm exactement
  await hi.addStyleTag({ content: 'html,body{background:#faf8f2}' });
  const W = Math.round(94 * MM), H = Math.round(54 * MM); // 2220 × 1276
  const { PNG } = load('pngjs');
  for (const [i, file] of [['recto.png'], ['verso.png']].map(([f], i) => [i, f])) {
    const b = await (await hi.$$('.page'))[i].boundingBox();
    // Playwright arrondit le recadrage au pixel CSS entier (355 × 6,25 = 2218,75) : la capture perd une colonne et
    // une ligne de fond perdu ; on la recale sur 2220 × 1276 exactement, le pixel manquant est couleur papier
    const shot = PNG.sync.read(await hi.screenshot({ clip: { x: b.x, y: b.y, width: W / (DPI / 96), height: H / (DPI / 96) } }));
    const img = new PNG({ width: W, height: H });
    for (let p = 0; p < img.data.length; p += 4) img.data.set([0xfa, 0xf8, 0xf2, 0xff], p);
    for (let y = 0; y < Math.min(H, shot.height); y++) {
      const n = Math.min(W, shot.width) * 4;
      img.data.set(shot.data.subarray(y * shot.width * 4, y * shot.width * 4 + n), y * W * 4);
    }
    writeFileSync(join(out, file), PNG.sync.write(img));
  }
  await openHi('?preview');
  // aperçu recadré sur les deux faces (côte à côte), 10 mm de marge autour pour l'ombre portée
  const boxes = await Promise.all((await hi.$$('.page')).map((el) => el.boundingBox()));
  const pad = 10 * 96 / 25.4, x = Math.min(...boxes.map((b) => b.x)) - pad, y = Math.min(...boxes.map((b) => b.y)) - pad;
  await hi.screenshot({ path: join(out, 'apercu.png'), clip: { x, y, width: Math.max(...boxes.map((b) => b.x + b.width)) + pad - x, height: Math.max(...boxes.map((b) => b.y + b.height)) + pad - y } });
  await ctx.close();

  // Lecture du QR code : image 600 dpi, puis réduite (≈ 90 px de côté pour le QR, ce qu'un téléphone voit de loin)
  const jsQR = load('jsqr');
  const png = PNG.sync.read(readFileSync(join(out, 'verso.png')));
  const expect = 'https://lagoffinerie.be';
  const decode = (img) => jsQR(new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, img.data.length), img.width, img.height)?.data;
  const shrink = (img, k) => {
    const w = Math.floor(img.width / k), h = Math.floor(img.height / k), o = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) {
        const p = ((y * k + dy) * img.width + (x * k + dx)) * 4; r += img.data[p]; g += img.data[p + 1]; b += img.data[p + 2];
      }
      const q = (y * w + x) * 4, n = k * k; o.data[q] = r / n; o.data[q + 1] = g / n; o.data[q + 2] = b / n; o.data[q + 3] = 255;
    }
    return o;
  };
  const results = { '600 dpi': decode(png), '150 dpi': decode(shrink(png, 4)), '100 dpi': decode(shrink(png, 6)) };
  for (const [k, v] of Object.entries(results)) console.log(`QR ${k} : ${v === expect ? 'OK' : 'ÉCHEC'} ${v ?? '(illisible)'}`);
  if (Object.values(results).some((v) => v !== expect)) { process.exitCode = 1; console.error('Le QR code ne se lit pas correctement : revoir la taille du logo ou du code.'); }
  console.log('Fichiers écrits dans', out, '— PNG', png.width, '×', png.height, 'px (attendu 2220 × 1276 à 600 dpi, soit', Math.round(94 * MM), '×', Math.round(54 * MM) + ')');
} finally {
  await browser.close();
}
