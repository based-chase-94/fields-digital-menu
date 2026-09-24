# Fields · Menu Boards

A client presentation site for the Fields restaurant's three digital menu boards, plus the
tools that render the boards and animate their illustrations. It's a static site with no build step.
Private repo: github.com/based-chase-94/fields-digital-menu. It will be hosted on Cloudflare Pages
from the repo root.

## Two workstreams: keep them in separate chats
- **Site:** `index.html`, `gallery.html`, `js/`, `css/`, rendering boards to PNG, and deploys.
- **Animation:** illustration rigging, motion tuning, and recording videos. Read
  [`docs/animation.md`](docs/animation.md) before doing animation work.

## Source of truth: the design canvas
- The boards are designed in a Claude design canvas: https://claude.ai/artifact/BDCwUUaGNZYqXfTh135si5
  - 9 artboards: 3 colorways × 3 boards, each 3840×2160.
  - `design/*.dc.html` are local copies of those artboards.
  - [`design/manifest.json`](design/manifest.json) maps each artboard file to a colorway and board. It also maps each canvas `/_blob/<id>` asset to a local file.
- **The user edits the canvas live.** Always re-read the files you need from the canvas before
  relying on the local copies. Publishing to the canvas needs a fresh read first: a stale publish is refused as a conflict.
- Colorway ids: `almond`, `forest`, `sunshine`. Board ids: `salads` (left TV), `build` (center), `beverages` (right).
- Brand colors are in the canvas at `project/ds/fields/tokens.json`, e.g. Poppy is `#e84a28`.

## Layout
- `js/config.js` holds everything the site shows:
  - `options`: the colorways. Each has an `animated: [boards]` list for boards with video.
  - `boards`
  - `screens`: TV corner points in the photo, measured to under 1.2px error.
- `js/common.js`: selected colorway (URL `?option=` plus localStorage), the two bottom docks, the full-size viewer, and `media()`, which returns a video if a board is animated and an image otherwise.
- `js/scene.js`: the photo view. Boards are warped onto the TVs with CSS `matrix3d`.
- `js/gallery.js`: the doc-style artwork page.
- `assets/boards/<option>/<board>.png`: 3840×2160. `<board>-screen.png` is the 1600×900 version used in the photo. Animated boards also have `.mp4` versions.
- `tools/`: Node + Playwright + ffmpeg (Homebrew).

## Commands (run in `tools/`)
```bash
npm run render [-- forest ...]        # re-render static boards from design/*.dc.html
npm run illustrations                 # trim and rig illustration layers (animation chat)
npm run record -- <option> <board> [--preview]   # animated boards (animation chat)
```
- `render` skips animated boards: their text is part of the video, so they must be re-recorded.
- Fonts come from `Fields Style Guide/fonts/`. That folder is git-ignored and local only.

## Rules
- Commit locally with a clear message. Only push when the user asks.
- Don't commit the 4K masters in `renders/` (git-ignored, often 60–200 MB). The user delivers them to the client directly.
- After changing site code, check it in a real browser before calling it done. The preview
  server is `.claude/launch.json` → `site` (port 5178). Headless Playwright screenshots are more reliable than the
  browser pane for this page.
- Keep the site UI neutral. It's a frame around the Fields artwork, not branded itself.
