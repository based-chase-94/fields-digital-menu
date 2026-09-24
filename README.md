# Fields · Menu Boards

A client presentation of the Fields digital menu boards. It's a static site with no build step.

- **In store** (`index.html`): the counter photo with each colorway on the three TVs. Pick a colorway at bottom left. Click a screen to see that board full size.
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

## How the photo works

In `js/config.js`, `screens` holds the four corners of each black TV area in photo pixels. They were measured by fitting straight lines to the edges of the black fill, with under 1.2px of error. Each board is mapped onto its corners with a CSS perspective (`matrix3d`) transform, so it follows the slight keystone of each panel.

A few light effects on top help the boards sit in the photo:
- a dark panel border
- edge falloff on the angled outer screens
- a faint ceiling reflection
- film grain to match the photo

These are in `css/styles.css` under "In-store view". If the photo is replaced, re-measure the corners.
