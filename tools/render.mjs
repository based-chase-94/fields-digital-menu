// Renders every artboard listed in design/manifest.json to
//   assets/boards/<option>/<board>.png         full-size (3840x2160) artwork
//   assets/boards/<option>/<board>-screen.png  1600x900, used inside the photo
//   assets/boards/<option>/<board>-text(-screen).png  text alone, for options with a motion.mp4
// Usage: cd tools && npm run render [-- <option-id> ...]
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, OUT, manifest, loadPage, artboardsFor } from './lib.mjs';
import { stamp } from './stamp.mjs';

const { width, height } = manifest.size;
const screen = manifest.screenSize;

const browser = await chromium.launch();
for (const art of artboardsFor(process.argv.slice(2))) {
  await fs.mkdir(path.join(OUT, art.option), { recursive: true });
  // Animated boards get their stills from the video, so text changes need a re-record.
  if (await fs.access(path.join(OUT, art.option, `${art.board}.mp4`)).then(() => true, () => false)) {
    console.log(`• ${art.option}/${art.board} is animated: run \`npm run record -- ${art.option} ${art.board}\``);
    continue;
  }
  for (const [scale, suffix] of [[1, ''], [screen.width / width, '-screen']]) {
    const page = await loadPage(browser, art.file, scale);
    const file = path.join(OUT, art.option, `${art.board}${suffix}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height } });
    await page.close();
    console.log('✓', path.relative(ROOT, file));
  }
  // An option with a moving background (motion.mp4, see grass-motion.mjs) also gets the
  // board's text alone on a transparent layer, which the site lays over the video.
  if (await fs.access(path.join(OUT, art.option, 'motion.mp4')).then(() => true, () => false)) {
    for (const [scale, suffix] of [[1, '-text'], [screen.width / width, '-text-screen']]) {
      const page = await loadPage(browser, art.file, scale);
      await page.addStyleTag({ content: 'body, body > div { background: transparent !important; }' });
      const file = path.join(OUT, art.option, `${art.board}${suffix}.png`);
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width, height }, omitBackground: true });
      await page.close();
      console.log('✓', path.relative(ROOT, file));
    }
  }
}
await browser.close();
await stamp();
