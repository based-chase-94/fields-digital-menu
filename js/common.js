/* Shared by both pages: selected colorway, bottom docks, and the full-size viewer. */
(function () {
  const C = window.MENU_CONFIG;
  const STORE_KEY = 'fields-menu-option';
  const MOTION_KEY = 'fields-menu-motion';

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

  function initialMotion() {
    const fromUrl = new URLSearchParams(location.search).get('motion');
    if (fromUrl != null) return fromUrl === '1';
    try { return localStorage.getItem(MOTION_KEY) === '1'; } catch (e) { return false; }
  }

  // What's on screen: one colorway for every board (`option`), or a per-board `mix`.
  // A mix lives only for this page view; `option` is remembered and shared in the URL.
  const listeners = [];
  const notify = () => listeners.forEach((fn) => fn());
  let lastMix = null;
  const state = {
    option: initialOption(),
    mix: null,
    // Motion toggle: options with `motion` (Grass) show moving footage instead of a still.
    motion: initialMotion(),
    set(id, opts = {}) {
      if (!optionById(id) || (id === state.option && !state.mix && !opts.force)) return;
      state.option = id;
      state.mix = null;
      try { localStorage.setItem(STORE_KEY, id); } catch (e) {}
      const url = new URL(location.href);
      url.searchParams.set('option', id);
      history.replaceState(null, '', url);
      notify();
    },
    // Start (or resume) mixing: the last mix this visit, else the defaults.
    startMix() {
      if (state.mix) return;
      state.mix = lastMix = { ...(lastMix || C.mixDefaults) };
      notify();
    },
    setMix(board, id) {
      if (!state.mix || !optionById(id) || state.mix[board] === id) return;
      state.mix = { ...state.mix, [board]: id };
      lastMix = state.mix;
      notify();
    },
    setMotion(on) {
      if (on === state.motion) return;
      state.motion = on;
      try { localStorage.setItem(MOTION_KEY, on ? '1' : '0'); } catch (e) {}
      const url = new URL(location.href);
      if (on) url.searchParams.set('motion', '1');
      else url.searchParams.delete('motion');
      history.replaceState(null, '', url);
      notify();
    },
    // Whether any board on screen shows an option that has a Motion version.
    hasMotion() {
      return C.boards.some((b) => optionById(state.optionFor(b.id)).motion);
    },
    // The colorway a given board is showing.
    optionFor(board) {
      return (state.mix && state.mix[board]) || state.option;
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
  // With Motion on, a moving background under the board's text (see motionMedia).
  // `ready()` resolves once the first frame can be shown.
  function media(option, board, kind, attrs = {}) {
    const poster = C.image(option, board, kind);
    const motion = state.motion && C.motion(option, board, kind);
    if (motion) return motionMedia(motion, poster, attrs);
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

  // The shared background loop, started at this board's moment, with the text PNG on top.
  // The still (text included) is the video's poster, so nothing shifts while it loads.
  // Acts like a <video> for callers: ready(), play() and pause().
  function motionMedia({ video: src, text, start }, poster, attrs) {
    const { alt, class: cls, preload, loading, width, height, ...rest } = attrs;
    const v = el('video', { src, poster, muted: '', loop: '', playsinline: '', preload: preload || 'auto' });
    v.muted = true;
    // Jump to this board's moment once the browser can seek there. GitHub Pages serves byte
    // ranges, so that's straight away; a server without them (python http.server) has to
    // download the whole file first.
    let seeked = !start;
    const seek = () => {
      const t = start % v.duration;
      if (seeked || !v.seekable.length || v.seekable.end(0) < t) return;
      seeked = true;
      v.currentTime = t;
      v.removeEventListener('progress', seek);
    };
    v.addEventListener('loadedmetadata', () => { seek(); v.addEventListener('progress', seek); }, { once: true });
    v.addEventListener('canplaythrough', seek, { once: true });
    const img = el('img', { src: text, alt: '', decoding: 'async', loading });
    const node = el('div', { class: `motion-art${cls ? ` ${cls}` : ''}`, role: 'img', 'aria-label': alt || null, ...rest }, [v, img]);
    node.video = v;
    node.play = () => v.play();
    node.pause = () => v.pause();
    node.ready = () => Promise.all([
      img.decode().catch(() => {}),
      v.readyState >= 2 ? null : new Promise((r) => {
        v.addEventListener('loadeddata', r, { once: true });
        v.addEventListener('error', r, { once: true });
      }),
    ]);
    return node;
  }

  function swatch(option) {
    const s = el('span', { class: 'swatch', 'aria-hidden': 'true' });
    s.style.setProperty('--ground', option.ground);
    s.style.setProperty('--accent', option.accent);
    return s;
  }

  // Bottom-left: colorway tabs, plus Mix & Match. Mix & Match swaps the tabs for a Back
  // button and one colorway picker per board; Back returns to the tabs and leaves the
  // screens as they are, until a colorway tab is chosen.
  function colorwayDock() {
    const slot = el('div', { class: 'dock dock-left' });

    // ---- Tabs ----
    const radios = C.options.map((o) =>
      el('button', {
        type: 'button', role: 'radio', 'data-option': o.id, title: o.description,
        onclick: () => state.set(o.id),
      }, [swatch(o), el('span', { text: o.name })])
    );
    const group = el('div', { class: 'seg-group', role: 'radiogroup', 'aria-label': 'Colorway' }, radios);
    group.addEventListener('keydown', (e) => {
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      const i = Math.max(0, radios.indexOf(document.activeElement));
      const next = radios[(i + dir + radios.length) % radios.length];
      state.set(next.dataset.option);
      next.focus();
    });
    const mixTab = el('button', { type: 'button', class: 'mix-tab', onclick: () => setOpen(true) },
      [mixDots(), el('span', { text: 'Mix & Match' })]);
    const tabs = el('div', { class: 'panel' }, [
      el('span', { class: 'dock-label', text: 'Colorway' }),
      el('div', { class: 'seg' }, [group, mixTab]),
    ]);

    // ---- Mix & Match ----
    const back = el('button', { type: 'button', class: 'panel back-btn', onclick: () => setOpen(false) },
      [icon('left'), el('span', { text: 'Back' })]);
    const pickers = C.boards.map(boardPicker);
    const mixGroup = el('div', { class: 'panel mix-group', role: 'group', 'aria-label': 'Mix & Match' }, pickers.map((p) => p.node));

    const motion = motionSwitch();

    function setOpen(on, focus = true) {
      if (on) state.startMix();
      if (openMenu) openMenu.close();
      slot.replaceChildren(...(on ? [back, mixGroup] : [tabs]), motion.node);
      slot.classList.toggle('mixing', on);
      if (focus) (on ? pickers[0].button : mixTab).focus({ preventScroll: true });
    }

    const sync = () => {
      radios.forEach((b) => b.setAttribute('aria-checked', !state.mix && b.dataset.option === state.option));
      const current = radios.find((b) => b.getAttribute('aria-checked') === 'true') || radios[0];
      radios.forEach((b) => { b.tabIndex = b === current ? 0 : -1; });
      mixTab.setAttribute('aria-pressed', !!state.mix);
      pickers.forEach((p) => p.sync());
      motion.sync();
    };
    sync();
    state.onChange(sync);
    setOpen(false, false);
    return slot;
  }

  // Motion on/off for options that have moving footage (Grass). In the dock it hides unless
  // a board on screen has a Motion version; `always` keeps it shown (the gallery's Grass heading).
  function motionSwitch(cls = 'panel motion-panel', always = false) {
    const button = el('button', { type: 'button', role: 'switch', class: 'motion-btn', onclick: () => state.setMotion(!state.motion) },
      [el('span', { class: 'motion-track', 'aria-hidden': 'true' }), el('span', { text: 'Motion' })]);
    const node = el('div', { class: cls }, [button]);
    return {
      node, button,
      sync() {
        node.hidden = !always && !state.hasMotion();
        button.setAttribute('aria-checked', state.motion);
      },
    };
  }

  // Three overlapping dots in the colorways' grounds: the Mix & Match tab icon.
  function mixDots() {
    return el('span', { class: 'mix-dots', 'aria-hidden': 'true' }, C.options.slice(0, 3).map((o) => {
      const d = el('span');
      d.style.background = o.ground;
      return d;
    }));
  }

  // One board's colorway picker: a button that opens an upward list of swatches.
  let openMenu = null;
  document.addEventListener('pointerdown', (e) => {
    if (openMenu && !openMenu.node.contains(e.target)) openMenu.close();
  });
  function boardPicker(board) {
    const button = el('button', { type: 'button', class: 'pick-btn', 'aria-haspopup': 'listbox', 'aria-expanded': 'false' });
    const items = C.options.map((o) =>
      el('li', { role: 'option', tabindex: '-1', 'data-option': o.id, onclick: () => choose(o.id) },
        [swatch(o), el('span', { text: o.name }), icon('check')]));
    const list = el('ul', { class: 'pick-menu', role: 'listbox', 'aria-label': `${board.title} colorway`, hidden: '' }, items);
    const node = el('div', { class: 'pick' }, [el('span', { class: 'pick-label', text: board.short || board.title }), button, list]);

    const picker = {
      node, button,
      sync() {
        const o = optionById(state.optionFor(board.id));
        button.replaceChildren(swatch(o), el('span', { class: 'pick-name', text: o.name }), icon('down'));
        button.setAttribute('aria-label', `${board.title}: ${o.name}`);
        items.forEach((li) => li.setAttribute('aria-selected', li.dataset.option === o.id));
      },
      open() {
        if (openMenu) openMenu.close();
        openMenu = picker;
        list.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        (items.find((li) => li.getAttribute('aria-selected') === 'true') || items[0]).focus();
      },
      close(refocus) {
        list.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        if (openMenu === picker) openMenu = null;
        if (refocus) button.focus();
      },
    };
    function choose(id) {
      state.setMix(board.id, id);
      picker.close(true);
    }
    button.addEventListener('click', () => (list.hidden ? picker.open() : picker.close()));
    button.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); picker.open(); }
    });
    list.addEventListener('keydown', (e) => {
      const i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (i >= 0) choose(items[i].dataset.option);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        picker.close(true);
      } else if (e.key === 'Tab') {
        picker.close();
      }
    });
    return picker;
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
    return el('nav', { class: 'dock dock-right', 'aria-label': 'View' }, [el('div', { class: 'panel' }, [el('div', { class: 'seg' }, links)])]);
  }

  // Full-size viewer: shows one board at a time, arrows step through boards.
  // `colorway` is an option id, or a function (board id → option id) for a mix.
  const viewer = {
    dialog: null,
    open(colorway, boardId) {
      if (!this.dialog) this.build();
      this.colorway = colorway;
      this.index = Math.max(0, C.boards.findIndex((b) => b.id === boardId));
      this.render();
      if (!this.dialog.open) this.dialog.showModal();
    },
    step(d) {
      this.index = (this.index + d + C.boards.length) % C.boards.length;
      this.render();
    },
    render() {
      const board = C.boards[this.index];
      const option = optionById(typeof this.colorway === 'function' ? this.colorway(board.id) : this.colorway);
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
      down: 'M7 10l5 5 5-5',
      check: 'M5 12.5l4.5 4.5L19 7.5',
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

  window.MenuApp = { config: C, state, el, media, swatch, optionById, colorwayDock, motionSwitch, viewDock, viewer };
})();
