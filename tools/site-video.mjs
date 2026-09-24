// Makes the website's copies of a recorded 4K master (renders/master/<option>-<board>.mp4):
//   assets/boards/<option>/<board>.mp4          1920x1080, gallery + full-size viewer
//   assets/boards/<option>/<board>-screen.mp4   1600x900, inside the photo
//   assets/boards/<option>/<board>.png / -screen.png   posters = the video's first frame,
//                                                      so nothing jumps when playback starts
// The master itself stays out of git (too large); hand it to the client separately.
// Usage: cd tools && node site-video.mjs <option> <board>   (record.mjs runs this after a master)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, OUT } from './lib.mjs';

export function siteVideo(option, board) {
  const master = path.join(ROOT, 'renders', 'master', `${option}-${board}.mp4`);
  const dir = path.join(OUT, option);
  const ff = (...args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  const web = ['-an', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-movflags', '+faststart'];

  ff('-i', master, '-vf', 'scale=1920:1080:flags=lanczos', ...web, '-crf', '22', path.join(dir, `${board}.mp4`));
  ff('-i', master, '-vf', 'scale=1600:900:flags=lanczos', ...web, '-crf', '23', path.join(dir, `${board}-screen.mp4`));
  ff('-i', master, '-frames:v', '1', path.join(dir, `${board}.png`));
  ff('-i', master, '-frames:v', '1', '-vf', 'scale=1600:900:flags=lanczos', path.join(dir, `${board}-screen.png`));
  for (const f of [`${board}.mp4`, `${board}-screen.mp4`, `${board}.png`, `${board}-screen.png`]) {
    console.log('✓', path.relative(ROOT, path.join(dir, f)));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [option, board] = process.argv.slice(2);
  await fs.access(path.join(ROOT, 'renders', 'master', `${option}-${board}.mp4`));
  siteVideo(option, board);
}
