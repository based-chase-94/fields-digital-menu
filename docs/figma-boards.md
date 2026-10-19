# Updating the Grass boards from Figma, and baking Motion videos

The runbook for the request we get most: "this Figma frame changed, update the board (and push live,
and/or bake a new Motion video)". Every step below has been done this way several times.

## Where things are

- **Figma file** `M1z6HCWOdK1fgN3RUznL2Z` ("Menu Boards"), page **LATEST BOARDS** (`118:6884`).
  The live boards are the frames named **FINAL - 1 / 2 / 3**:

  | Figma frame | id | Artboard | Board id / TV | Caption |
  |---|---|---|---|---|
  | FINAL - 1 | `122:810` | `Grass-Board1.dc.html` | `salads`, left | House Bowls |
  | FINAL - 2 | `122:876` | `Grass-Board2.dc.html` | `build`, centre | Grow Your Own |
  | FINAL - 3 | `122:1217` | `Grass-Board3.dc.html` | `beverages`, right | Proteins + Upgrades |

  Frame ids can change when the designer rebuilds a frame: if one isn't found, list the page with
  `get_metadata` on `118:6884` and match by frame name.
- **Generator**: `tools/build-grass-latest.py` writes all six Grass artboards (the three live ones and the
  archived Layout 2) from Figma's positions. Board 1 is `signature()`, board 2 `build()`, board 3 `beverages()`.
  Never hand-edit `design/Grass-Board*.dc.html`; change the generator and regenerate.
- **Vector pieces** (Figma's lettering, icons, ticket): `design/assets/field-trip/*.svg`, each uploaded to the
  canvas. The `SVG` dict in the generator maps name to canvas blob id; `design/manifest.json` `images` maps the
  blob id back to the local file (render needs both).
- **Design canvas**: https://claude.ai/artifact/BDCwUUaGNZYqXfTh135si5, row D on the Grass page.

## 1. Read the Figma frame

1. Load the `figma:figma-design-to-code` skill first (the Figma MCP requires it), then call
   `get_design_context` on the frame with `skillNames: "figma-design-to-code"`.
2. Diff it against the board's function in the generator: text, prices, positions (`left`/`top`), sizes,
   gaps, colours, new or removed pieces.
3. Read description line breaks off the screenshot it returns: Figma wraps by width and the browser wraps
   differently, so we hard-break every line.

## 2. Vector pieces

- Download each SVG the design context lists: `curl -sfL -o design/assets/field-trip/<name>.svg "<url>"`.
- The same Figma asset hash does not guarantee the same file. Compare with the existing piece: identical, or
  every number within 0.01 px, means reuse the existing one. Otherwise it's new: give it a new name
  (we suffix `-2`, `-3`, `-4`…).
- Upload only new ones: `Artifact` publish with `url` = the canvas, `asset: true`, `file_paths` = the SVGs.
  Add each returned blob id to the generator's `SVG` dict and to `design/manifest.json` `images`
  (`"<id>": "assets/field-trip/<name>.svg"`). Delete pieces nothing uses any more, from both.

## 3. Edit the generator

Use Figma's numbers directly. Conventions that keep us within 1 px:

- Heart of the Land lines: Figma draws them about 1 px lower than the browser, so add 1 to `top`.
- Midstar titles that Figma centres on a y: `top = y - 60.9` (sometimes `- 59.9`; measure).
- Descriptions: an explicit list of lines joined with `<br>`, `white-space: nowrap`,
  `font-feature-settings: 'dlig' 1` (Figma joins tt/ll like Fredoka's discretionary ligatures), Figma's
  `letter-spacing`. Assert in the edit script that the joined lines equal Figma's text, so no word gets lost.
- Percentage insets: the `inset(top, right, bottom, left)` helper. Rotated pieces: centre the unrotated
  box in Figma's container, then `transform: rotate(…)`.
- Figma rounds list rows to whole pixels: give rows explicit heights if a list drifts down the board.
- Known, accepted differences: text after "ff" (and sometimes "fi") runs up to ~5 px long; Heart of the Land
  has no "@", so Figma and the browser fall back to different fonts for it.

## 4. Check against Figma

1. `get_screenshot` on the frame with `maxDimension: 3840`; `curl` the URL to `renders/check/figma-<n>.png`.
2. `cd tools && node figma-check.mjs Grass-Board<n> ../renders/check/figma-<n>.png name,x0,y0,x1,y1 …`
   with a box around each heading, price, description block and icon. It prints PSNR (28 to 38 dB is
   normal), writes `renders/check/Grass-Board<n>-diff.png` (look at it: only faint outlines should remain),
   and a shift per box. Fix until every box says `dx 0, dy 0` (±1 is fine). `±10` means a box landed on
   repetitive content, like a dashed line or a long stroke; measure that a different way.

## 5. Canvas

1. `Artifact` read `project/Grass-Board<n>.dc.html` (and `project/canvas.json` if a title changes) into a
   scratch folder. If it differs from `design/Grass-Board<n>.dc.html`, someone edited the canvas: stop and ask.
2. `python3 tools/build-grass-latest.py <scratch>/canvas/project`, `cmp` the other boards against `design/`
   (they should be unchanged), copy the changed ones into `design/`, and delete the unchanged ones from the
   scratch folder.
3. Publish only the changed files: `Artifact` publish, `url` = canvas, `root` = `<scratch>/canvas`,
   `file_path` = one changed file, `files` = the others. Canvas titles are `D1 · …` in `canvas.json`.
4. If a board's heading changed, also update its caption: `boards[].title` in `js/config.js`.

## 6. Site

1. `cd tools && npm run render -- grass` writes the stills, `-screen` copies, the `-text` layers that Motion
   and Panorama lay over the video, and `versions.js`.
2. A board that didn't change can come out as "modified" from render noise (PSNR above 50 dB against the
   committed file). `git checkout` it, then `npm run stamp`.
3. Check in a browser: `node serve-ranges.mjs`, which serves byte ranges like GitHub Pages so Motion seeks.
   With headless Playwright, load `index.html?motion=still|loop|span` and `gallery.html`. Check the captions,
   the TV labels, that Panorama draws 3 canvases (while it's archived: that the dock shows only Still · Motion), and that there are no console errors. Take a screenshot.
4. Commit. **Push only when asked.** After `git push origin main`, poll
   `gh api repos/based-chase-94/fields-digital-menu/pages/builds/latest --jq '.status + " " + .commit[0:7]'`
   until it says `built <sha>`, then load the live site once.

## 7. Bake Motion videos (only when asked, Motion only)

The user wants **Motion masters only, never Panorama**. Bake only the boards they name.

1. The board's text layer must be current: run step 6.1 first.
2. `cd tools && npm run grass-masters -- salads` (or `build`, `beverages`; several at once is fine).
   About 2.5 min per board. It writes `renders/master/grass-<board>.mp4`, about 92 MB and git-ignored.
   `-- --preview` writes a 960×540 check to `renders/preview/` in about 15 s.
3. Verify:
   - `ffprobe` should show h264 High, level 51, 3840×2160, 30/1, 554 frames, about 40 Mbps, and an AAC track.
   - Grab a frame: `ffmpeg -ss 6 -i <file> -frames:v 1 -vf scale=1280:-1 check.png`, and look at it.
   - Check the loop point. The step from the last frame to the first should be within the normal range:
     ```bash
     f=renders/master/grass-salads.mp4
     ffmpeg -loglevel error -i $f -i $f -filter_complex "[0]scale=480:270,format=gray[a];[1]scale=480:270,format=gray,trim=start_frame=1,setpts=PTS-STARTPTS[b0];[1]scale=480:270,format=gray,trim=end_frame=1[c];[b0][c]concat[b];[a][b]blend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - | grep -o 'YAVG=[0-9.]*' | cut -d= -f2 | python3 -c "import sys,statistics;v=[float(x) for x in sys.stdin];print(f'median {statistics.median(v):.2f} max {max(v):.2f} loop point {v[-1]:.2f}')"
     ```
     The loop point should not exceed the max. A near-zero minimum would mean a duplicated frame.
4. The user renames masters for delivery (`house-bowls.mp4`, `build-your-own.mp4`, `ingredients.mp4`).
   Leave those alone and tell them the new file's name.

The site's own Motion and Panorama loops (`npm run grass-motion`) don't contain text, so text changes never
need them rebuilt. Rebuild only if the footage or its look changes, and then only the ones asked for
(`-- motion motion-screen`).

## Why the video tools are frame-exact

The footage is 29.97 fps. Resampling it to 30 fps, or cutting by time, drops or doubles a frame at the loop
point. So both tools relabel the frames as 30 fps (`setpts=N/30/TB`, 0.1% faster), cut by frame number, and
trim `xfade`'s one extra frame. Keep it that way.
