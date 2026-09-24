// Shared by render.mjs and record.mjs: turns a canvas artboard into a plain local page.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DESIGN = path.join(ROOT, 'design');
export const OUT = path.join(ROOT, 'assets', 'boards');

export const manifest = JSON.parse(await fs.readFile(path.join(DESIGN, 'manifest.json'), 'utf8'));

// Drop the canvas runtime, unwrap <x-dc>/<helmet>, and point /_blob/<id> urls at local files.
export function toPlainHtml(src) {
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

// Writes the plain page next to the design files (so relative asset paths resolve)
// and returns its file:// url plus a cleanup function.
export async function plainPage(artboardFile) {
  const html = toPlainHtml(await fs.readFile(path.join(DESIGN, artboardFile), 'utf8'));
  const tmp = path.join(DESIGN, `.render-${artboardFile}`);
  await fs.writeFile(tmp, html);
  return { url: pathToFileURL(tmp).href, cleanup: () => fs.rm(tmp) };
}

export async function loadPage(browser, artboardFile, scale = 1) {
  const { width, height } = manifest.size;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  const { url, cleanup } = await plainPage(artboardFile);
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await cleanup();
  return page;
}

export function artboardsFor(filter = []) {
  return manifest.artboards.filter((a) => !filter.length || filter.includes(a.option));
}
