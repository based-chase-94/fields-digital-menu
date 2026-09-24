// Records animated boards to seamless-looping MP4.
//
// The board is rendered from its canvas artboard; illustration pieces placed there
// (or, if absent, from design/illustrations/<option>/<board>/) are rigged with the pivots in
// parts.json and posed frame by frame from design/motion.json, then piped to ffmpeg.
//
// Usage: cd tools && npm run record -- <option> <board> [--preview]
//   --preview   1280x720, fast encode         → renders/preview/<option>-<board>.mp4
//   (default)   3840x2160 TV master, matching the store's existing signage file
//                                             → renders/master/<option>-<board>.mp4
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, DESIGN, manifest, loadPage } from './lib.mjs';

const args = process.argv.slice(2);
const preview = args.includes('--preview');
const [option, board] = args.filter((a) => !a.startsWith('--'));
const art = manifest.artboards.find((a) => a.option === option && a.board === board);
if (!art) throw new Error(`No artboard for ${option}/${board} in design/manifest.json`);

const rigFile = path.join(DESIGN, 'illustrations', option, board, 'parts.json');
const rig = JSON.parse(await fs.readFile(rigFile, 'utf8').catch(() => {
  throw new Error(`No ${path.relative(ROOT, rigFile)}: run \`npm run illustrations\` first`);
}));
const motionAll = JSON.parse(await fs.readFile(path.join(DESIGN, 'motion.json'), 'utf8'));
const motion = { ...motionAll, ...(motionAll.boards[board] || {}) };

const { width } = manifest.size;
const outW = preview ? 1280 : width;
const frames = Math.round(motion.loop * motion.fps);
const outDir = path.join(ROOT, 'renders', preview ? 'preview' : 'master');
const out = path.join(outDir, `${option}-${board}.mp4`);
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await loadPage(browser, art.file, outW / width);

// ---- Rig the pieces inside the page ----
const found = await page.evaluate(({ rig, motion, option, board }) => {
  const root = document.querySelector('body > div');
  const byName = {};
  for (const img of root.querySelectorAll('img')) {
    const m = decodeURI(img.src).match(/illustrations\/[^/]+\/[^/]+\/([^/]+)\.png$/);
    if (m) byName[m[1]] = img;
  }
  // Pieces not placed in the canvas artboard: add them at their drawn positions.
  const placedInCanvas = Object.keys(byName).length;
  for (const [name, box] of Object.entries(rig.parts)) {
    if (byName[name]) continue;
    const img = document.createElement('img');
    img.src = `illustrations/${option}/${board}/${name}.png`;
    Object.assign(img.style, { position: 'absolute', left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px`, display: 'block' });
    root.append(img);
    byName[name] = img;
  }

  const TAU = Math.PI * 2, L = motion.loop, W = motion.wind;
  const sign = W.from === 'right' ? -1 : 1;
  const wind = (t) => W.harmonics.reduce((s, h) => s + h.amp * Math.sin(TAU * h.cycles * t / L + h.phase), 0);

  // Build nested wrappers: root piece → … → head, each rotating about its joint.
  const plants = rig.rig.map((p, pi) => {
    const pieces = p.chain.map((c) => {
      const img = byName[c.name];
      return { img, pivot: [img.offsetLeft + c.pivot[0], img.offsetTop + c.pivot[1]] };
    });
    let parent = null;
    const joints = pieces.map(({ img, pivot }, i) => {
      const wrap = document.createElement('div');
      Object.assign(wrap.style, { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', transformOrigin: `${pivot[0]}px ${pivot[1]}px` });
      if (parent) parent.append(wrap); else img.before(wrap);
      wrap.append(img);
      parent = wrap;
      const kind = i === 0 ? 'root' : i === pieces.length - 1 ? 'head' : 'mid';
      return { wrap, cfg: motion.joints[kind] };
    });
    const head = pieces[pieces.length - 1].pivot;
    return { joints, head, seed: pi * 2.39996 };
  });
  // The breeze reaches each plant in turn, by the position of its head.
  const xs = plants.map((p) => p.head[0]);
  const edge = sign < 0 ? Math.max(...xs) : Math.min(...xs);
  plants.forEach((p) => { p.delay = Math.abs(edge - p.head[0]) / W.speed; });

  window.__pose = (t) => {
    for (const p of plants) {
      for (const { wrap, cfg } of p.joints) {
        const tt = t - p.delay - (cfg.lag || 0);
        let a = cfg.amp * (W.lean + wind(tt));
        if (cfg.flutter) a += cfg.flutter.amp * Math.sin(TAU * cfg.flutter.cycles * t / L + p.seed);
        wrap.style.transform = `rotate(${(sign * a).toFixed(4)}deg)`;
      }
    }
  };
  return { placedInCanvas, total: Object.keys(rig.parts).length };
}, { rig, motion, option, board });
console.log(`${option}/${board}: ${found.total} pieces (${found.placedInCanvas} from the canvas), ${frames} frames at ${outW}px`);

// ---- Encode ----
const x264 = preview
  ? ['-preset', 'veryfast', '-crf', '20']
  : ['-preset', 'slow', '-b:v', '40M', '-maxrate', '50M', '-bufsize', '80M', '-level', '5.1'];
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(motion.fps), '-i', '-',
  // A silent audio track: some TV players won't loop a video-only file.
  '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  '-map', '0:v', '-map', '1:a', '-shortest',
  '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', ...x264,
  '-c:a', 'aac', '-b:a', '128k',
  '-movflags', '+faststart',
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res())));

const t0 = Date.now();
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.__pose(t), f / motion.fps);
  const buf = await page.screenshot(preview ? { type: 'jpeg', quality: 92 } : { type: 'png' });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % motion.fps === 0) process.stdout.write(`\r  ${Math.round((100 * f) / frames)}%`);
}
ff.stdin.end();
await done;
await browser.close();
console.log(`\r✓ ${path.relative(ROOT, out)} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
