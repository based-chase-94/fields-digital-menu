# Animating the boards

This is the handoff for the animation workstream: how the swaying illustrations are built, what's
done so far, and what to watch out for. The site side only needs the files described under "Output" below.

## Status (2026-09-24)
- **Almond · salads:** done. Three dandelions, a 20s loop. The 4K master is in `renders/master/almond-salads.mp4`,
  and the site versions are in `assets/boards/almond/`.
- **Forest and Sunshine · salads:** waiting on the user's recolored illustrations. They'll use the same shapes and
  positions, so the rig and motion carry over unchanged.
- **Build and beverages boards:** no illustrations yet.

## What the user provides
- One PNG per piece, saved to `illustrations/<colorway>/<board>/<plant>-<part>.png`:
  - a full 3840×2160 transparent canvas with the piece in its final position
  - pre-colored for that colorway
  - hand-drawn texture, which is why these are PNGs rather than vectors
- Plants are split into segments that overlap slightly at the joints, e.g. `dandelion1-stem2` (lowest, runs off the bottom edge), `dandelion1-stem1` and `dandelion1-head`.
- The segment names don't set their order; the rig works it out from the art.

## Pipeline (run in `tools/`)
1. **`npm run illustrations`** ([tools/illustrations.mjs](../tools/illustrations.mjs))
   - Trims each piece to `design/illustrations/<colorway>/<board>/<name>.png`.
   - Writes `parts.json` with each piece's box and its chain from root to head.
   - Root: the piece that reaches lowest on the board. Its pivot is the center of its lowest solid pixels.
   - Next piece up: whichever overlaps the current one most. The head always comes last.
   - Joint pivots: the center of the pixels two pieces share (alpha > 96). If two pieces don't touch, it uses the child's closest pixel instead.
   - Pivots are stored relative to the child piece, so a piece moved in the canvas keeps its joint.
   - To check a rig, draw the pivots over the pieces. We did this for Almond salads and all nine landed on the joints.
2. **Place the pieces in the canvas artboard.** Upload the trimmed PNGs as canvas assets and add them as
   absolutely positioned `<img data-part="<name>">` elements using the `parts.json` boxes.
   - Add each asset's blob id to `design/manifest.json` under `images`.
   - The recorder finds pieces by their resolved file path. If a piece isn't in the artboard, it adds it itself.
3. **`npm run record -- <colorway> <board> --preview`**: a 1280×720 check in about 20s, saved to `renders/preview/`.
4. **`npm run record -- <colorway> <board>`**: the 4K master, about 2–3 min. It then runs
   [tools/site-video.mjs](../tools/site-video.mjs) to make the site copies.
5. **Show it on the site:** add the board to that colorway's `animated` list in `js/config.js`.

## How the recorder works ([tools/record.mjs](../tools/record.mjs))
- It loads the artboard as a plain page (`tools/lib.mjs` swaps canvas blob urls for local files).
- It wraps each plant's pieces in nested full-board `<div>`s, one per joint, each with `transform-origin` at its pivot.
  The head sits inside the upper stem, which sits inside the lower stem, so the rotations add up.
- For each frame it calls `window.__pose(t)` and takes a Playwright screenshot, then pipes the frames to ffmpeg.
  Because each frame is set exactly, nothing is dropped and the loop is exact.
- Motion comes from [`design/motion.json`](../design/motion.json). The `boards` key allows per-board overrides.
  - **Wind:** a sum of sines whose cycle counts divide the loop evenly, which is what makes it seamless. `lean` is a constant bend downwind.
  - **Breeze delay:** each plant is reached later the further its head is from the upwind edge (`speed` in px/s).
  - **Joints:** `root`, `mid` and `head` each have an `amp` in degrees and a `lag` in seconds, so the tops trail like a whip. The head adds a `flutter`.
  - **Current values** (the user asked for livelier motion and more flutter than the first pass):
    - root 1.8°, mid 2.9°, head 4.1°
    - flutter 2.0° at 11 cycles
    - harmonics at 1, 2, 3 and 5 cycles
    - 20s loop at 30fps

## Output
- **Master:** `renders/master/<colorway>-<board>.mp4`
  - matches the store's existing, proven signage file: H.264 High, level 5.1, 3840×2160, 30fps, yuv420p, target 40 Mbps (simple boards come in lower, around 25 Mbps)
  - has a silent AAC track, because some TV players won't loop a video-only file
  - git-ignored; the user delivers it to the client directly
- **Site copies** in `assets/boards/<colorway>/`:
  - `<board>.mp4` at 1920×1080 and `<board>-screen.mp4` at 1600×900, both with no audio and faststart
  - `<board>.png` and `-screen.png` posters, taken from the video's **first frame** so nothing jumps when playback starts

## Gotchas we hit
- In the plain page, the `<style>` from the canvas's `<helmet>` is the first child of `<body>`. Use `body > div` to find the board.
- `npm run render` skips boards that have an `.mp4`. After any text or logo change on an animated board, re-record it.
- Canvas publishes are refused if you didn't read the latest version first. A single-file read wasn't enough once; a full artifact read cleared it.
- The canvas's comment auto-reply can make edits itself. Check the canvas before redoing a change a comment asked for.
