// Prepares hand-drawn illustration layers for animation.
//
// Input:  illustrations/<option>/<board>/<plant>-<part>.png
//         Each file is a full 3840x2160 transparent canvas with the piece in its final position.
// Output: design/illustrations/<option>/<board>/<plant>-<part>.png  (trimmed to the artwork)
//         design/illustrations/<option>/<board>/parts.json            (positions + rig)
//
// The rig is found automatically: for each plant, the piece reaching lowest on the board is
// the root, the next piece is whichever overlaps it most, and so on up to the head. Each
// joint pivots at the centre of the pixels the two pieces share.
//
// Usage: cd tools && npm run illustrations
import fs from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
import { ROOT, DESIGN } from './lib.mjs';

const SRC = path.join(ROOT, 'illustrations');
const SOLID = 96; // alpha threshold for "this pixel belongs to the piece"

async function readPng(file) {
  return PNG.sync.read(await fs.readFile(file));
}

function bounds(png) {
  const { width, height, data } = png;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function crop(png, b) {
  const out = new PNG({ width: b.w, height: b.h });
  PNG.bitblt(png, out, b.x, b.y, b.w, b.h, 0, 0);
  return out;
}

// Alpha of a trimmed piece at a board coordinate.
const alphaAt = (p, x, y) => p.png.data[((y - p.box.y) * p.box.w + (x - p.box.x)) * 4 + 3];

// Centre of the pixels two pieces share (in board coordinates), and how many there are.
function overlap(a, b) {
  const x0 = Math.max(a.box.x, b.box.x), x1 = Math.min(a.box.x + a.box.w, b.box.x + b.box.w);
  const y0 = Math.max(a.box.y, b.box.y), y1 = Math.min(a.box.y + a.box.h, b.box.y + b.box.h);
  let n = 0, sx = 0, sy = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (alphaAt(a, x, y) > SOLID && alphaAt(b, x, y) > SOLID) { n++; sx += x; sy += y; }
  }
  return n ? { n, x: sx / n, y: sy / n } : { n: 0 };
}

// Where a root piece meets the ground: centre of its lowest solid pixels.
function rootPivot(p) {
  const { width, height, data } = p.png;
  for (let y = height - 1; y >= 0; y--) {
    let n = 0, sx = 0;
    for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > SOLID) { n++; sx += x; }
    if (n) return { x: sx / n, y: y + 1 };
  }
}

// Fallback when two pieces don't touch: the child's pixel closest to the parent's centre.
function nearest(child, parent) {
  const cx = parent.box.x + parent.box.w / 2, cy = parent.box.y + parent.box.h / 2;
  let best = null, bd = Infinity;
  for (let y = 0; y < child.box.h; y++) for (let x = 0; x < child.box.w; x++) {
    if (child.png.data[(y * child.box.w + x) * 4 + 3] <= SOLID) continue;
    const d = (child.box.x + x - cx) ** 2 + (child.box.y + y - cy) ** 2;
    if (d < bd) { bd = d; best = { x: child.box.x + x, y: child.box.y + y }; }
  }
  return best;
}

const round = (v) => Math.round(v * 10) / 10;

for (const option of await fs.readdir(SRC).catch(() => [])) {
  if (option.startsWith('.')) continue;
  for (const board of await fs.readdir(path.join(SRC, option))) {
    const dir = path.join(SRC, option, board);
    if (board.startsWith('.') || !(await fs.stat(dir)).isDirectory()) continue;
    const outDir = path.join(DESIGN, 'illustrations', option, board);
    await fs.mkdir(outDir, { recursive: true });

    const pieces = [];
    for (const f of (await fs.readdir(dir)).filter((f) => f.endsWith('.png')).sort()) {
      const full = await readPng(path.join(dir, f));
      const box = bounds(full);
      if (!box) { console.warn(`  skipped ${f}: empty`); continue; }
      const name = f.slice(0, -4);
      const [plant, part] = name.split(/-(.+)/);
      const png = crop(full, box);
      await fs.writeFile(path.join(outDir, f), PNG.sync.write(png));
      pieces.push({ name, plant, part: part || 'whole', box, png });
    }

    const plants = {};
    for (const p of pieces) (plants[p.plant] ||= []).push(p);

    const rig = [];
    for (const [plant, list] of Object.entries(plants)) {
      // Root = reaches lowest; then walk up by strongest overlap, head always last.
      const heads = list.filter((p) => p.part === 'head');
      const rest = list.filter((p) => p.part !== 'head').sort((a, b) => (b.box.y + b.box.h) - (a.box.y + a.box.h));
      const chain = [rest.shift() || heads.shift()];
      const pool = [...rest, ...heads];
      while (pool.length) {
        const cur = chain[chain.length - 1];
        const stems = pool.filter((p) => p.part !== 'head');
        const candidates = stems.length ? stems : pool;
        let best = candidates[0], bo = overlap(cur, best);
        for (const c of candidates.slice(1)) { const o = overlap(cur, c); if (o.n > bo.n) { best = c; bo = o; } }
        pool.splice(pool.indexOf(best), 1);
        chain.push(best);
      }
      const joints = chain.map((p, i) => {
        if (i === 0) return rootPivot(p) && { x: p.box.x + rootPivot(p).x, y: p.box.y + rootPivot(p).y };
        const o = overlap(chain[i - 1], p);
        return o.n ? { x: o.x, y: o.y } : nearest(p, chain[i - 1]);
      });
      rig.push({
        plant,
        chain: chain.map((p, i) => ({
          name: p.name,
          // pivot relative to the trimmed image, so it follows the piece if it is moved
          pivot: [round(joints[i].x - p.box.x), round(joints[i].y - p.box.y)],
        })),
      });
      console.log(`${option}/${board}/${plant}: ${chain.map((p) => p.part).join(' → ')}`);
    }

    const parts = Object.fromEntries(pieces.map((p) => [p.name, p.box]));
    await fs.writeFile(path.join(outDir, 'parts.json'), JSON.stringify({ parts, rig }, null, 2) + '\n');
  }
}
