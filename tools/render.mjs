// Renders every artboard listed in design/manifest.json to
//   assets/boards/<option>/<board>.png         full-size (3840x2160) artwork
//   assets/boards/<option>/<board>-screen.png  1600x900, used inside the photo
// Usage: cd tools && npm run render [-- <option-id> ...]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESIGN = path.join(ROOT, 'design');
const OUT = path.join(ROOT, 'assets', 'boards');

const manifest = JSON.parse(await fs.readFile(path.join(DESIGN, 'manifest.json'), 'utf8'));
const only = process.argv.slice(2);
const { width, height } = manifest.size;
const screen = manifest.screenSize;

// Turn a canvas .dc.html into a plain page: drop the canvas runtime, unwrap
// <x-dc>/<helmet>, and point /_blob/<id> urls at local files.
function toPlainHtml(src) {
  const blobs = { ...manifest.fonts, ...manifest.images };
  return src
    .replace(/<script src="\.\/support\.js"><\/script>/, '')
    .replace(/<script type="text\/x-dc"[\s\S]*?<\/script>/, '')
    .replace(/<\/?x-dc>|<\/?helmet>/g, '')
    .replace(/\/_blob\/([a-f0-9]{32})/g, (m, id) => {
      if (!blobs[id]) throw new Error(`Unknown blob ${id}: add it to design/manifest.json`);
      return encodeURI(blobs[id]);
    });
}

const browser = await chromium.launch();
for (const art of manifest.artboards) {
  if (only.length && !only.includes(art.option)) continue;
  const html = toPlainHtml(await fs.readFile(path.join(DESIGN, art.file), 'utf8'));
  const tmp = path.join(DESIGN, `.render-${art.file}`);
  await fs.writeFile(tmp, html);
  await fs.mkdir(path.join(OUT, art.option), { recursive: true });

  for (const [scale, suffix] of [[1, ''], [screen.width / width, '-screen']]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(OUT, art.option, `${art.board}${suffix}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height } });
    await page.close();
    console.log('✓', path.relative(ROOT, file));
  }
  await fs.rm(tmp);
}
await browser.close();
