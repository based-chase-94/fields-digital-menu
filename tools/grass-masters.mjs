// 4K TV masters for the Grass boards' Motion version: the moving grass under each board's text.
//   renders/master/grass-<board>.mp4   3840x2160, one per TV (git-ignored; delivered to the client)
//
// Same picture as the site's Motion toggle: the footage (assets/grass.mp4) softened and darkened to
// the stills' look, made into a seamless loop by crossfading its last second into its first, and
// started at the board's own moment (config.js `motion.start`) so the three TVs don't match. The
// board's text is <board>-text.png from `npm run render`, so re-run that first after text changes.
// Encoded like the store's proven signage files (see docs/animation.md, Output): H.264 High 5.1,
// 30 fps, yuv420p, ~40 Mbps, plus a silent AAC track because some players won't loop video-only files.
// Usage: cd tools && npm run grass-masters [-- salads build beverages] [--preview]   (--preview: 960x540 to renders/preview/)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, OUT } from './lib.mjs';

const SRC = path.join(ROOT, 'assets', 'grass.mp4');
const DARKEN = 0.575;
const START = { salads: 0, build: 9.5, beverages: 17.5 }; // keep in step with js/config.js
const args = process.argv.slice(2);
const PREVIEW = args.includes('--preview');
const picked = args.filter((a) => !a.startsWith('--'));
const boards = picked.length ? picked : Object.keys(START);

// Frame-exact throughout: the footage's frames are relabelled as 30 fps (0.1% faster than its 29.97,
// imperceptible) so no frame is ever dropped or doubled. The loop is every frame after the first
// FADE ones, with its last FADE frames crossfaded into the first FADE, so it ends on the frame just
// before it starts.
const total = +execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', SRC]).toString();
const FADE_FRAMES = 30;
const frames = total - FADE_FRAMES; // the loop's length in frames
const DIR = path.join(ROOT, 'renders', PREVIEW ? 'preview' : 'master');
await fs.mkdir(DIR, { recursive: true });

for (const board of boards) {
  const cut = Math.round(START[board] * 30) % frames; // the loop's frame at this board's moment
  const text = path.join(OUT, 'grass', `${board}-text.png`);
  const file = path.join(DIR, `grass-${board}.mp4`);
  const graph = [
    `[0:v]setpts=N/30/TB,${PREVIEW ? 'scale=960:540,gblur=sigma=0.75' : 'gblur=sigma=3'},colorchannelmixer=rr=${DARKEN}:gg=${DARKEN}:bb=${DARKEN},split[a][b]`,
    `[a]trim=start_frame=${FADE_FRAMES},setpts=PTS-STARTPTS[body]`,
    `[b]trim=end_frame=${FADE_FRAMES},setpts=PTS-STARTPTS[head]`,
    // xfade emits one frame too many (its end point inclusive); without the trim a rotated loop
    // loses its last frame and jumps at the loop point.
    `[body][head]xfade=transition=fade:duration=${FADE_FRAMES / 30}:offset=${(frames - FADE_FRAMES) / 30},trim=end_frame=${frames}[loop]`,
    // Rotate the loop so it starts at this board's moment, cutting on a frame number.
    cut
      ? `[loop]split[l1][l2];[l1]trim=start_frame=${cut},setpts=PTS-STARTPTS[t1];[l2]trim=end_frame=${cut},setpts=PTS-STARTPTS[t2];[t1][t2]concat=n=2:v=1:a=0,setpts=N/30/TB[bg]`
      : '[loop]null[bg]',
    `${PREVIEW ? '[1:v]scale=960:540[txt];[bg][txt]' : '[bg][1:v]'}overlay=format=auto,format=yuv420p[v]`,
  ].join(';');
  console.log(`grass/${board}: ${frames} frames (${(frames / 30).toFixed(2)}s), starting at frame ${cut} …`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SRC, '-loop', '1', '-i', text,
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-filter_complex', graph, '-map', '[v]', '-map', '2:a', '-r', '30', '-frames:v', String(frames), '-t', (frames / 30).toFixed(3),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-preset', 'slow',
    ...(PREVIEW ? ['-crf', '23'] : ['-b:v', '40M', '-maxrate', '50M', '-bufsize', '80M', '-level', '5.1']),
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', file], { stdio: 'inherit' });
  console.log('✓', path.relative(ROOT, file));
}
