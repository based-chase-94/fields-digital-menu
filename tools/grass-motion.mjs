// Builds the moving background for the Grass colorway's Motion toggle, from the coming-soon
// footage (assets/grass.mp4, git-ignored):
//   assets/boards/grass/motion.mp4          1920x1080, gallery + full-size viewer
//   assets/boards/grass/motion-screen.mp4   960x540, inside the photo (the TVs are small there)
// One loop serves all three boards: the site starts each board at its own moment (config.js
// `motion.start`) and lays the board's text on top (<board>-text.png, from `npm run render`).
//
// Same look as the Grass stills (design/assets/grass-*.jpg): softened, and darkened to 0.575x,
// which matches the salads still to within ~50 dB PSNR. The last second crossfades into the
// first so the loop has no visible seam; the loop is 1s shorter than the footage.
// Usage: cd tools && npm run grass-motion
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, OUT } from './lib.mjs';
import { stamp } from './stamp.mjs';

const SRC = path.join(ROOT, 'assets', 'grass.mp4');
const FADE = 1;
const DARKEN = 0.575;

const duration = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SRC]).toString();
const loop = duration - FADE;

// sigma 3 at 4K, scaled to the output size
for (const [w, h, crf, suffix] of [[1920, 1080, 30, ''], [960, 540, 28, '-screen']]) {
  const sigma = (3 * w) / 3840;
  const look = `scale=${w}:${h}:flags=lanczos,gblur=sigma=${sigma},colorchannelmixer=rr=${DARKEN}:gg=${DARKEN}:bb=${DARKEN}`;
  const graph = [
    `[0:v]${look},split[a][b]`,
    `[a]trim=start=${FADE},setpts=PTS-STARTPTS[body]`,
    `[b]trim=end=${FADE},setpts=PTS-STARTPTS[head]`,
    `[body][head]xfade=transition=fade:duration=${FADE}:offset=${(loop - FADE).toFixed(3)},format=yuv420p[v]`,
  ].join(';');
  const file = path.join(OUT, 'grass', `motion${suffix}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SRC, '-filter_complex', graph, '-map', '[v]', '-an',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', String(crf), '-movflags', '+faststart', file], { stdio: 'inherit' });
  console.log('✓', path.relative(ROOT, file), `(${loop.toFixed(2)}s loop)`);
}
await stamp();
