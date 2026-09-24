/*
 * Everything the two pages show comes from this file.
 *
 * Adding a colorway:
 *   1. Put its artwork at assets/boards/<id>/<board>.png (3840x2160) and
 *      assets/boards/<id>/<board>-screen.png (1600x900); `npm run render`
 *      in tools/ writes both from design/manifest.json.
 *   2. Add an entry to `options` below. Order here = order in the toggle and gallery.
 *
 * Adding a board: add it to `boards`; to show it in the photo, give it a `screens` entry.
 */
window.MENU_CONFIG = {
  title: 'Fields · Menu Boards',

  photo: {
    src: 'assets/photo.jpg',
    backdrop: 'assets/photo-blur.jpg',
    width: 2400,
    height: 1792,
    // The part of the photo that must stay visible on any screen size (the TV wall),
    // and the point the crop centres on.
    focus: { x0: 380, y0: 500, x1: 2150, y1: 880, cx: 1266, cy: 900 },
  },

  boards: [
    { id: 'salads', title: 'Salads & Grain Bowls' },
    { id: 'build', title: 'Build Your Own Bowl' },
    { id: 'beverages', title: 'Beverages' },
  ],

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
      animated: ['salads'] },
    { id: 'forest', name: 'Forest', ground: '#283628', accent: '#f9e14d',
      description: 'Forest ground, Almond text, Sunshine headlines and prices' },
    { id: 'sunshine', name: 'Sunshine', ground: '#f9e14d', accent: '#5f2637',
      description: 'Sunshine ground, Forest text, Burgundy headlines and prices' },
  ],

  // Where artwork lives; an option may override with its own `images: { <board>: {full, screen} }`.
  image(option, board, kind) {
    const own = option.images && option.images[board];
    if (own && own[kind]) return own[kind];
    return `assets/boards/${option.id}/${board}${kind === 'screen' ? '-screen' : ''}.png`;
  },

  // Boards listed in an option's `animated` also have a looping video next to the PNG
  // (<board>.mp4 at 1920x1080, <board>-screen.mp4 at 1600x900); the PNG is its poster.
  video(option, board, kind) {
    if (!(option.animated || []).includes(board)) return null;
    return `assets/boards/${option.id}/${board}${kind === 'screen' ? '-screen' : ''}.mp4`;
  },
};
