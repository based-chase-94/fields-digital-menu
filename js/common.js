/* Shared by both pages: selected colorway, bottom docks, and the full-size viewer. */
(function () {
  const C = window.MENU_CONFIG;
  const STORE_KEY = 'fields-menu-option';

  function optionById(id) {
    return C.options.find((o) => o.id === id);
  }

  function initialOption() {
    const fromUrl = new URLSearchParams(location.search).get('option');
    if (optionById(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (optionById(saved)) return saved;
    } catch (e) {}
    return C.options[0].id;
  }

  const listeners = [];
  const state = {
    option: initialOption(),
    set(id, opts = {}) {
      if (!optionById(id) || (id === state.option && !opts.force)) return;
      state.option = id;
      try { localStorage.setItem(STORE_KEY, id); } catch (e) {}
      const url = new URL(location.href);
      url.searchParams.set('option', id);
      history.replaceState(null, '', url);
      listeners.forEach((fn) => fn(id, opts));
    },
    onChange(fn) { listeners.push(fn); },
  };

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    [].concat(children).forEach((c) => c && node.append(c));
    return node;
  }

  // A board's artwork: a muted looping video if the board is animated, else the PNG.
  // `ready()` resolves once the first frame can be shown.
  function media(option, board, kind, attrs = {}) {
    const poster = C.image(option, board, kind);
    const src = C.video(option, board, kind);
    if (!src) {
      const img = el('img', { src: poster, decoding: 'async', ...attrs });
      img.ready = () => img.decode().catch(() => {});
      return img;
    }
    const { alt, ...rest } = attrs;
    const v = el('video', { src, poster, muted: '', loop: '', playsinline: '', preload: 'auto', 'aria-label': alt || null, ...rest });
    v.muted = true; // the attribute alone doesn't allow autoplay everywhere
    v.ready = () => (v.readyState >= 2 ? Promise.resolve() : new Promise((r) => {
      v.addEventListener('loadeddata', r, { once: true });
      v.addEventListener('error', r, { once: true });
    }));
    return v;
  }

  function swatch(option) {
    const s = el('span', { class: 'swatch', 'aria-hidden': 'true' });
    s.style.setProperty('--ground', option.ground);
    s.style.setProperty('--accent', option.accent);
    return s;
  }

  // Bottom-left: colorway picker (a radio group of swatches).
  function colorwayDock() {
    const group = el('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Colorway' });
    const buttons = C.options.map((o) =>
      el('button', {
        type: 'button', role: 'radio', 'data-option': o.id, title: o.description,
        onclick: () => state.set(o.id),
      }, [swatch(o), el('span', { text: o.name })])
    );
    group.append(...buttons);
    group.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const i = C.options.findIndex((o) => o.id === state.option);
      const next = C.options[(i + dir + C.options.length) % C.options.length];
      state.set(next.id);
      buttons.find((b) => b.dataset.option === next.id).focus();
    });
    const sync = () => buttons.forEach((b) => {
      const on = b.dataset.option === state.option;
      b.setAttribute('aria-checked', on);
      b.tabIndex = on ? 0 : -1;
    });
    sync();
    state.onChange(sync);
    return el('div', { class: 'dock dock-left' }, [el('span', { class: 'dock-label', text: 'Colorway' }), group]);
  }

  // Bottom-right: switch between the in-store photo and the artwork gallery.
  function viewDock(current) {
    const views = [
      { id: 'photo', label: 'In store', href: 'index.html' },
      { id: 'gallery', label: 'Artwork', href: 'gallery.html' },
    ];
    const links = views.map((v) => {
      const a = el('a', { href: v.href, 'data-view': v.id, 'aria-current': v.id === current ? 'page' : null, text: v.label });
      a.addEventListener('click', () => { a.href = `${v.href}?option=${state.option}`; });
      return a;
    });
    return el('nav', { class: 'dock dock-right', 'aria-label': 'View' }, [el('div', { class: 'seg' }, links)]);
  }

  // Full-size viewer: shows one board at a time, arrows step through boards.
  const viewer = {
    dialog: null,
    open(optionId, boardId) {
      if (!this.dialog) this.build();
      this.optionId = optionId;
      this.index = Math.max(0, C.boards.findIndex((b) => b.id === boardId));
      this.render();
      if (!this.dialog.open) this.dialog.showModal();
    },
    step(d) {
      this.index = (this.index + d + C.boards.length) % C.boards.length;
      this.render();
    },
    render() {
      const option = optionById(this.optionId);
      const board = C.boards[this.index];
      const art = media(option, board.id, 'full', { class: 'viewer-img', alt: `${option.name}: ${board.title} menu board` });
      this.stage.replaceChildren(art);
      if (art.play) art.play().catch(() => {});
      this.caption.replaceChildren(swatch(option), el('strong', { text: option.name }), el('span', { text: ` · ${board.title}` }));
      this.count.textContent = `${this.index + 1} / ${C.boards.length}`;
    },
    build() {
      this.stage = el('div', { class: 'viewer-stage' });
      this.caption = el('div', { class: 'viewer-caption' });
      this.count = el('span', { class: 'viewer-count' });
      const btn = (label, cls, fn, glyph) => el('button', { type: 'button', class: `viewer-btn ${cls}`, 'aria-label': label, onclick: fn }, [icon(glyph)]);
      this.dialog = el('dialog', { class: 'viewer', 'aria-label': 'Full-size artwork' }, [
        this.stage,
        el('div', { class: 'viewer-bar' }, [
          this.caption,
          el('div', { class: 'viewer-nav' }, [
            btn('Previous board', 'prev', () => this.step(-1), 'left'),
            this.count,
            btn('Next board', 'next', () => this.step(1), 'right'),
            btn('Close', 'close', () => this.dialog.close(), 'close'),
          ]),
        ]),
      ]);
      this.dialog.addEventListener('click', (e) => {
        if (e.target === this.dialog || e.target.classList.contains('viewer-stage')) this.dialog.close();
      });
      this.dialog.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') this.step(-1);
        if (e.key === 'ArrowRight') this.step(1);
      });
      this.dialog.addEventListener('close', () => this.stage.replaceChildren()); // stop any video
      document.body.append(this.dialog);
    },
  };

  function icon(name) {
    const paths = {
      left: 'M15 5l-7 7 7 7',
      right: 'M9 5l7 7-7 7',
      close: 'M6 6l12 12M18 6L6 18',
    };
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', paths[name]);
    svg.append(p);
    return svg;
  }

  window.MenuApp = { config: C, state, el, media, swatch, optionById, colorwayDock, viewDock, viewer };
})();
