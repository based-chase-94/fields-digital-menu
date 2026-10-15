// Builds the moving background for the Grass colorway's Motion toggle, from the coming-soon
// footage (assets/grass.mp4, git-ignored):
//   assets/boards/grass/motion.mp4          1920x1080, gallery + full-size viewer
//   assets/boards/grass/motion-screen.mp4   960x540, inside the photo (the TVs are small there)
// One loop serves all three boards: the site starts each board at its own moment (config.js
// `motion.start`) and lays the board's text on top (<board>-text.png, from `npm run render`).
//
// Panorama: one field across all three TVs instead of the same one three times. A 48:9 band
// through the middle of the footage, each TV showing a third (so 1280x720 of source per TV):
//   assets/boards/grass/span.mp4          3840x720, native: 1280 px per board
//   assets/boards/grass/span-screen.mp4   2880x540, 960 px per board, inside the photo
// The site draws all three boards from one playing video, so the seams between TVs line up.
//
// Same look as the Grass stills (design/assets/grass-*.jpg): softened, and darkened to 0.575x,
// which matches the salads still to within ~50 dB PSNR. The last second crossfades into the
// first so the loop has no visible seam; the loop is 1s shorter than the footage.
// Usage: cd tools && npm run grass-motion [-- <name> ...]
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, OUT } from './lib.mjs';
import { stamp } from './stamp.mjs';

const SRC = path.join(ROOT, 'assets', 'grass.mp4');
const FADE = 1;
const DARKEN = 0.575;

// Frame-exact, like grass-masters.mjs: the footage's frames relabelled as 30 fps, the loop is every
// frame after the first FADE seconds' worth, trimmed to exactly that many (xfade emits one extra).
const total = +execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', SRC]).toString();
const FADE_FRAMES = FADE * 30;
const frames = total - FADE_FRAMES;
const loop = frames / 30;
const only = process.argv.slice(2); // e.g. `npm run grass-motion -- span span-screen`

// [name, crop of the 3840x2160 footage, output size, boards across, crf]
const outputs = [
  ['motion', null, 1920, 1080, 1, 30],
  ['motion-screen', null, 960, 540, 1, 28],
  ['span', '3840:720:0:720', 3840, 720, 3, 32],
  ['span-screen', '3840:720:0:720', 2880, 540, 3, 33],
];
for (const [name, crop, w, h, across, crf] of outputs) {
  if (only.length && !only.includes(name)) continue;
  const sigma = (3 * w) / across / 3840; // sigma 3 on a 4K board, scaled to this board width
  const look = `setpts=N/30/TB,${crop ? `crop=${crop},` : ''}scale=${w}:${h}:flags=lanczos,gblur=sigma=${sigma},colorchannelmixer=rr=${DARKEN}:gg=${DARKEN}:bb=${DARKEN}`;
  const graph = [
    `[0:v]${look},split[a][b]`,
    `[a]trim=start_frame=${FADE_FRAMES},setpts=PTS-STARTPTS[body]`,
    `[b]trim=end_frame=${FADE_FRAMES},setpts=PTS-STARTPTS[head]`,
    `[body][head]xfade=transition=fade:duration=${FADE}:offset=${(frames - FADE_FRAMES) / 30},trim=end_frame=${frames},format=yuv420p[v]`,
  ].join(';');
  const file = path.join(OUT, 'grass', `${name}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SRC, '-filter_complex', graph, '-map', '[v]', '-an', '-r', '30', '-frames:v', String(frames),
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', String(crf), '-movflags', '+faststart', file], { stdio: 'inherit' });
  console.log('✓', path.relative(ROOT, file), `(${loop.toFixed(2)}s loop)`);
}
await stamp();
