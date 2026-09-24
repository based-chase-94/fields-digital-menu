# Fields · Menu Boards

A client presentation of the Fields digital menu boards. It's a static site with no build step.

- **In store** (`index.html`): the counter photo with each colorway on the three TVs. Pick a colorway at bottom left. Click a screen to see that board full size.
  - **Mix & Match**, the fourth colorway tab, gives each TV its own colorway through a dropdown per board. It starts as Almond / Forest / Sunshine; set the starting combination with `mixDefaults` in `js/config.js`.
  - **Back** returns to the tabs and leaves the screens as they are. Picking a colorway tab replaces the mix.
  - A mix isn't saved: reloading or sharing the link opens a single colorway.
- **Artwork** (`gallery.html`): every board as a full-size PNG in one scrolling column, with a sidebar that jumps to each colorway and board.

The toggle at bottom right switches between the two views and keeps the selected colorway.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 5178
```

## Deploy

Any static host works: GitHub Pages, Netlify or Vercel. Serve the repo root. There's nothing to build.

## Adding a colorway

1. Add the artwork:
   - `assets/boards/<id>/<board>.png` at 3840×2160, for the gallery and the full-size view
   - `assets/boards/<id>/<board>-screen.png` at 1600×900, for the photo
   - `<board>` is `salads`, `build` or `beverages`
2. Add an entry to `options` in [`js/config.js`](js/config.js):
   ```js
   { id: 'lavender', name: 'Lavender', ground: '#…', accent: '#…', description: '…' },
   ```
   If any of its boards are animated, add `animated: ['salads', …]` (see below).

The toggle, gallery sidebar and photo pick it up automatically.

## Re-rendering artwork from the design canvas

The boards are designed in the Claude design canvas. Copies of its artboards live in `design/`, and [`design/manifest.json`](design/manifest.json) maps each artboard file to an option and a board.

```bash
cd tools
npm install
npx playwright install chromium
npm run render              # all options
npm run render -- forest    # just one
```

Rendering needs the brand fonts in `Fields Style Guide/fonts/`. That folder is git-ignored, so keep a local copy.

## Animated boards

Some boards have hand-drawn illustrations that sway in a looping breeze.

1. **Drawings:** save each piece to `illustrations/<colorway>/<board>/<plant>-<part>.png`.
   - Use a full 3840×2160 transparent canvas with the piece in its final position.
   - Split plants into segments, e.g. `dandelion1-stem2`, `dandelion1-stem1` and `dandelion1-head`.
   - Let neighboring segments overlap slightly at the joints.
2. **Rig:** run `npm run illustrations`. It trims the pieces and works out the joints automatically. Place the trimmed pieces from `design/illustrations/` in the canvas artboard; if you move them there, the animation follows.
3. **Motion:** edit [`design/motion.json`](design/motion.json). It sets how strong the sway is, the wind direction, head flutter and loop length. All sway cycles divide evenly into the loop length, so the video loops seamlessly.
4. **Record:**
   ```bash
   npm run record -- almond salads --preview   # quick 720p check
   npm run record -- almond salads             # 4K TV master + site videos
   ```
   - The 4K master goes to `renders/master/`. It uses the store's proven settings: H.264 High at 3840×2160, 30fps, with a silent audio track. It isn't committed to git, so send it to the client directly.
   - The site copies and first-frame posters go to `assets/boards/`.
5. **Show it on the site:** list the board in that colorway's `animated` array in `js/config.js`.

The text of an animated board is part of its video. After changing it in the canvas, re-record the board; `npm run render` skips animated boards.

## How the photo works

In `js/config.js`, `screens` holds the four corners of each black TV area in photo pixels. They were measured by fitting straight lines to the edges of the black fill, with under 1.2px of error. Each board is mapped onto its corners with a CSS perspective (`matrix3d`) transform, so it follows the slight keystone of each panel.

A few light effects on top help the boards sit in the photo:
- a dark panel border
- edge falloff on the angled outer screens
- a faint ceiling reflection
- film grain to match the photo

These are in `css/styles.css` under "In-store view". If the photo is replaced, re-measure the corners.
