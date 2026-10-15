// Compares one of our Grass artboards against Figma's own render of the same frame.
//
// Usage: cd tools && node figma-check.mjs <artboard> <figma.png> [name,x0,y0,x1,y1 ...]
//   <artboard>   Grass-Board1 | Grass-Board2 | Grass-Board3 | Layout2-Board1..3 (the .dc.html name)
//   <figma.png>  Figma's 3840x2160 render of the frame (get_screenshot with maxDimension 3840)
//   regions      optional boxes in board px; for each, prints the (dx, dy) that would move ours onto
//                Figma's. 0, 0 means aligned. Search range is ±10 px, so ±10 means "look closer".
//
// It builds the artboard on Figma's flat Forest ground (build-grass-latest.py --flat), renders it at
// 4K, prints PSNR (about 28-38 dB is normal: anti-aliasing differs), and writes
// renders/check/<artboard>-diff.png, a difference image (black = match) at 1280 px wide.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import { ROOT, DESIGN, toPlainHtml } from './lib.mjs';

const [name, figma, ...regions] = process.argv.slice(2);
if (!name || !figma) {
  console.error('Usage: node figma-check.mjs <artboard> <figma.png> [name,x0,y0,x1,y1 ...]');
  process.exit(1);
}
const dir = path.join(ROOT, 'renders', 'check');
await fs.mkdir(path.join(dir, 'flat'), { recursive: true });
execFileSync('python3', [path.join(ROOT, 'tools', 'build-grass-latest.py'), path.join(dir, 'flat'), '--flat'], { stdio: 'ignore' });

// Render the flat artboard at 4K.
const ours = path.join(dir, `${name}.png`);
const tmp = path.join(DESIGN, `.render-check-${name}.html`); // next to design/ so asset paths resolve
await fs.writeFile(tmp, toPlainHtml(await fs.readFile(path.join(dir, 'flat', `${name}.dc.html`), 'utf8')));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 3840, height: 2160 } });
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: ours });
await browser.close();
await fs.rm(tmp);

const ff = (...args) => execFileSync('ffmpeg', ['-loglevel', 'error', ...args], { encoding: 'utf8' });
const psnr = ff('-i', figma, '-i', ours, '-filter_complex', '[0]format=yuv444p[a];[1]format=yuv444p[b];[a][b]psnr=stats_file=-', '-f', 'null', '-')
  .match(/psnr_avg:([\d.]+|inf)/);
console.log(`${name}: PSNR ${psnr ? psnr[1] : '?'} dB`);
const diff = path.join(dir, `${name}-diff.png`);
ff('-y', '-i', figma, '-i', ours, '-filter_complex', '[0]format=rgb24[a];[1]format=rgb24[b];[a][b]blend=all_mode=difference,eq=contrast=3,scale=1280:-1', '-frames:v', '1', diff);
console.log('  difference image:', path.relative(ROOT, diff));

// Per region: the shift of ours that best matches Figma (sum of squared differences, every 2nd px).
if (regions.length) {
  const F = PNG.sync.read(fsSync.readFileSync(figma)), M = PNG.sync.read(fsSync.readFileSync(ours));
  const lum = (p, x, y) => { const i = (y * p.width + x) * 4; return p.data[i] + p.data[i + 1]; };
  for (const r of regions) {
    const [label, x0, y0, x1, y1] = r.split(',');
    let best = [Infinity, 0, 0];
    for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
      let sum = 0;
      for (let y = +y0; y < +y1; y += 2) for (let x = +x0; x < +x1; x += 2) {
        const d = lum(F, x, y) - lum(M, x - dx, y - dy);
        sum += d * d;
      }
      if (sum < best[0]) best = [sum, dx, dy];
    }
    console.log(`  ${label.padEnd(14)} move ours by dx ${best[1]}, dy ${best[2]}`);
  }
}
