/* In-store view: the photo, cropped to fill the window, with each board
 * projected onto its TV through a perspective (matrix3d) transform. */
(function () {
  const { config: C, state, el, viewer, colorwayDock, viewDock, optionById } = window.MenuApp;
  const P = C.photo;
  const SW = 1600, SH = 900; // local size of a screen element (matches the -screen.png)

  // ---- Projective transform: maps the SWxSH rectangle onto four corners ----
  function adj(m) {
    return [
      m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
      m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
      m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
    ];
  }
  function mulMM(a, b) {
    const c = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j];
      c[3 * i + j] = s;
    }
    return c;
  }
  function mulMV(m, v) {
    return [0, 1, 2].map((i) => m[3 * i] * v[0] + m[3 * i + 1] * v[1] + m[3 * i + 2] * v[2]);
  }
  function basis(p) { // p: [[x,y] x4] in order TL, TR, BL, BR
    const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1];
    const v = mulMV(adj(m), [p[3][0], p[3][1], 1]);
    return mulMM(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
  }
  function matrix3d(dst) {
    const src = [[0, 0], [SW, 0], [0, SH], [SW, SH]];
    const t = mulMM(basis(dst), adj(basis(src)));
    const n = t.map((x) => x / t[8]);
    return `matrix3d(${[n[0], n[3], 0, n[6], n[1], n[4], 0, n[7], 0, 0, 1, 0, n[2], n[5], 0, n[8]].join(',')})`;
  }

  // ---- Build DOM ----
  const scene = document.getElementById('scene');
  const photo = el('img', { class: 'photo', src: P.src, alt: 'Front counter with three menu screens above it', decoding: 'async' });
  scene.append(photo);

  const screens = C.screens.map((s) => {
    const board = C.boards.find((b) => b.id === s.board);
    const layers = el('div', { class: 'screen-layers' });
    const node = el('button', {
      type: 'button',
      class: `screen${s.shade ? ` shade-${s.shade}` : ''}`,
      'aria-label': `View ${board.title} full size`,
      onclick: () => viewer.open(state.option, board.id),
    }, [layers, el('span', { class: 'fx fx-vignette' }), el('span', { class: 'fx fx-glare' }),
        el('span', { class: 'fx fx-grain' }), el('span', { class: 'fx fx-hover' })]);
    scene.append(node);
    return { def: s, board, node, layers, imgs: {} };
  });

  // ---- Crop the photo to the window, keeping the TV wall in view ----
  function layout() {
    const vw = innerWidth, vh = innerHeight, f = P.focus;
    const pad = Math.min(vw * 0.04, 40);
    // "cover", but never so large that the TV wall runs off the sides.
    const s = Math.min(Math.max(vw / P.width, vh / P.height), (vw - 2 * pad) / (f.x1 - f.x0));
    const w = P.width * s, h = P.height * s;
    const place = (view, size, lo, hi, c) => {
      if (size <= view) return (view - size) / 2;
      let o = view / 2 - c * s;
      o = Math.max(o, pad - lo * s); // keep focus box in view…
      o = Math.min(o, view - pad - hi * s);
      return Math.min(0, Math.max(view - size, o)); // …without exposing an edge
    };
    const ox = place(vw, w, f.x0, f.x1, f.cx);
    const oy = place(vh, h, f.y0, f.y1, f.cy);
    Object.assign(photo.style, { width: `${w}px`, height: `${h}px`, transform: `translate(${ox}px, ${oy}px)` });
    scene.classList.toggle('letterboxed', h < vh - 1 || w < vw - 1);

    for (const sc of screens) {
      const [tl, tr, br, bl] = sc.def.corners.map(([x, y]) => [ox + x * s, oy + y * s]);
      sc.node.style.transform = matrix3d([tl, tr, bl, br]);
    }
  }

  // ---- Colorway switching with a crossfade ----
  function layerFor(sc, option) {
    if (!sc.imgs[option.id]) {
      const img = el('img', { src: C.image(option, sc.board.id, 'screen'), alt: '', decoding: 'async', draggable: 'false' });
      sc.imgs[option.id] = img;
      sc.layers.append(img);
    }
    return sc.imgs[option.id];
  }

  let token = 0;
  async function show(id) {
    const my = ++token;
    const option = optionById(id);
    const imgs = screens.map((sc) => layerFor(sc, option));
    // Swap all three screens together once every image is ready.
    await Promise.all(imgs.map((img) => img.decode().catch(() => {})));
    if (my !== token) return;
    const z = my + 1; // incoming layer sits on top and fades in; the old one fades out after it
    screens.forEach((sc, i) => {
      for (const img of Object.values(sc.imgs)) {
        const on = img === imgs[i];
        if (on && !img.classList.contains('active')) img.style.zIndex = z;
        img.classList.toggle('active', on);
      }
    });
    document.title = `${option.name} · ${C.title}`;
  }

  // Warm the cache for the other options so the first switch is instant.
  function preload() {
    C.options.forEach((o) => C.boards.forEach((b) => { new Image().src = C.image(o, b.id, 'screen'); }));
  }

  document.body.append(colorwayDock(), viewDock('photo'));
  state.onChange(show);
  addEventListener('resize', layout);
  layout();
  show(state.option).then(() => {
    scene.classList.add('ready');
    (window.requestIdleCallback || setTimeout)(preload);
  });
})();
