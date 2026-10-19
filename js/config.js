/*
 * Everything the two pages show comes from this file.
 *
 * Adding a colorway:
 *   1. Put its artwork at assets/boards/<id>/<board>.png (3840x2160) and
 *      assets/boards/<id>/<board>-screen.png (1600x900); `npm run render`
 *      in tools/ writes both from design/manifest.json.
 *   2. Add an entry to `options` below. Order here = order in the toggle and gallery.
 *
 * Archiving a colorway: give it `archived: true`. The site leaves it out (its artwork stays
 * in assets/boards/); delete the flag to bring it back. With one colorway left, the colorway
 * tabs and Mix & Match hide themselves.
 *
 * Adding a board: add it to `boards`; to show it in the photo, give it a `screens` entry.
 *
 * Grass is the only live option (the final boards). Layout 2 is archived; with two or more options
 * the tabs come back, labelled `optionsLabel`. An option's `titles` names its boards where they
 * differ from `boards`.
 */
window.MENU_CONFIG = {
  title: 'Fields · Menu Boards',
  optionsLabel: 'Layout', // the bottom-left tabs choose between these
  mixAndMatch: false,     // per-TV mixing would repeat dishes across the two layouts

  photo: {
    src: 'assets/photo.jpg',
    backdrop: 'assets/photo-blur.jpg',
    width: 2400,
    height: 1792,
    // The part of the photo that must stay visible on any screen size (the TV wall),
    // and the point the crop centres on.
    focus: { x0: 380, y0: 500, x1: 2150, y1: 880, cx: 1266, cy: 900 },
  },

  // `short` labels the board's picker in Mix & Match.
  boards: [
    { id: 'salads', title: 'House Bowls', short: 'Salads' },
    { id: 'build', title: 'Grow Your Own', short: 'BYO' },
    { id: 'beverages', title: 'Proteins + Upgrades', short: 'Upgrades' },
  ],

  // Mix & Match starts from this combination (board → colorway) the first time it's opened.
  mixDefaults: { salads: 'grass', build: 'grass-2', beverages: 'grass' },

  // Corners of each black TV area in photo pixels, clockwise from top-left.
  // Measured by fitting lines to the edges of the black fill (under 1.2px error).
  // `shade` darkens the edge of the panel that angles away from the camera.
  screens: [
    { board: 'salads', shade: 'left',
      corners: [[400.1, 539.3], [973.9, 536.9], [980.6, 854.3], [421.4, 856.5]] },
    { board: 'build', shade: null,
      corners: [[979.5, 537.1], [1549.2, 532.5], [1543.0, 850.2], [986.6, 852.9]] },
    { board: 'beverages', shade: 'right',
      corners: [[1554.9, 534.3], [2132.4, 528.7], [2116.8, 847.9], [1549.0, 848.8]] },
  ],

  options: [
    { id: 'almond', name: 'Almond', ground: '#f4e9e1', accent: '#e84a28',
      description: 'Almond ground, Forest text, Poppy headlines and prices',
      animated: ['salads'], archived: true },
    { id: 'forest', name: 'Forest', ground: '#283628', accent: '#f9e14d',
      description: 'Forest ground, Almond text, Sunshine headlines and prices',
      animated: ['salads'], archived: true },
    { id: 'sunshine', name: 'Sunshine', ground: '#f9e14d', accent: '#5f2637',
      description: 'Sunshine ground, Forest text, Burgundy headlines and prices',
      animated: ['salads'], archived: true },
    // Stills from the coming-soon grass footage (assets/grass.mp4, a different moment per
    // board), softened and darkened for legibility: see design/assets/grass-*.jpg.
    // `motion`: Still / Motion / Panorama. Motion swaps the stills for the moving footage (one
    // shared loop, tools/grass-motion.mjs) under each board's text; `start` is each board's
    // moment in the loop, matching its still. `span`: Panorama, one field across all three TVs
    // (archived for now: set `span: true` to bring the Panorama choice back).
    { id: 'grass', name: 'Grass', ground: '#3f5a22', accent: '#f9e14d',
      description: 'Grass photo ground: the final boards from Figma (FINAL - 1, 2, 3)',
      motion: { start: { salads: 0, build: 9.5, beverages: 17.5 }, span: false } },
    // Archived: the earlier second row in Figma (frames 3, 1, 2), same ground and footage
    // (`motion.from`). Delete `archived` to bring back the Layout toggle.
    { id: 'grass-2', name: 'Layout 2', ground: '#3f5a22', accent: '#f9e14d',
      description: 'Second row in Figma, Field Trip first: Build Your Field Trip, Fields Gathered, Bowls + Refreshers',
      titles: { salads: 'Build Your Field Trip', build: 'Fields Gathered', beverages: 'Bowls + Refreshers' },
      motion: { from: 'grass', start: { salads: 0, build: 9.5, beverages: 17.5 }, span: true }, archived: true },
  ],

  // A board's name in this option: its own `titles` entry, else the board's title.
  boardTitle(option, board) {
    return (option.titles && option.titles[board.id]) || board.title;
  },

  // Where artwork lives; an option may override with its own `images: { <board>: {full, screen} }`.
  image(option, board, kind) {
    const own = option.images && option.images[board];
    if (own && own[kind]) return own[kind];
    return this.versioned(`${option.id}/${board}${kind === 'screen' ? '-screen' : ''}.png`);
  },

  // Boards listed in an option's `animated` also have a looping video next to the PNG
  // (<board>.mp4 at 1920x1080, <board>-screen.mp4 at 1600x900); the PNG is its poster.
  video(option, board, kind) {
    if (!(option.animated || []).includes(board)) return null;
    return this.versioned(`${option.id}/${board}${kind === 'screen' ? '-screen' : ''}.mp4`);
  },

  // With Motion on, an option with `motion` shows a moving background under the board's
  // text: { video, text, start }, or null. The still PNG stays as the poster. The footage
  // comes from `motion.from` (another option's folder) when the option shares it.
  motion(option, board, kind) {
    if (!option.motion) return null;
    const screen = kind === 'screen' ? '-screen' : '';
    return {
      video: this.versioned(`${option.motion.from || option.id}/motion${screen}.mp4`),
      text: this.versioned(`${option.id}/${board}-text${screen}.png`),
      start: option.motion.start[board] || 0,
    };
  },

  // Panorama: one field across all three TVs. `span.mp4` holds the boards side by side, in
  // `boards` order (left TV to right); each board shows its third: { video, text, index, across }.
  span(option, board, kind) {
    if (!option.motion || !option.motion.span) return null;
    const screen = kind === 'screen' ? '-screen' : '';
    return {
      video: this.versioned(`${option.motion.from || option.id}/span${screen}.mp4`),
      text: this.versioned(`${option.id}/${board}-text${screen}.png`),
      index: this.boards.findIndex((b) => b.id === board),
      across: this.boards.length,
    };
  },

  // Board file URL with a content hash from assets/boards/versions.js (written by the render
  // tools), so updated artwork is never served from a stale browser or CDN cache.
  versioned(file) {
    const v = (window.BOARD_VERSIONS || {})[file];
    return `assets/boards/${file}${v ? `?v=${v}` : ''}`;
  },
};

// Archived colorways are kept above for reference but not shown.
window.MENU_CONFIG.options = window.MENU_CONFIG.options.filter((o) => !o.archived);
