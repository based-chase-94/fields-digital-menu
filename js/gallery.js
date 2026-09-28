/* Artwork view: one column of boards, grouped by colorway, with a jump-link sidebar. */
(function () {
  const { config: C, state, el, media, swatch, viewer, viewDock, motionSwitch } = window.MenuApp;
  const nav = document.getElementById('toc');
  const doc = document.getElementById('doc');

  const anchor = (o, b) => (b ? `${o.id}-${b.id}` : o.id);
  const tocLinks = new Map();
  const motionArt = []; // boards of options with a Motion version, rebuilt when it's toggled
  const switches = [];

  const art = (o, b, i) => media(o, b.id, 'full', { alt: `${o.name}: ${b.title} menu board`, loading: i === 0 && o === C.options[0] ? 'eager' : 'lazy', width: '3840', height: '2160', preload: 'none' });

  for (const o of C.options) {
    const sub = el('ol', { class: 'toc-boards' }, C.boards.map((b, i) => {
      const a = el('a', { href: `#${anchor(o, b)}` }, [el('span', { class: 'toc-num', text: String(i + 1) }), el('span', { text: b.title })]);
      tocLinks.set(anchor(o, b), a);
      return el('li', {}, [a]);
    }));
    const head = el('a', { class: 'toc-option', href: `#${anchor(o)}` }, [swatch(o), el('span', { text: o.name })]);
    tocLinks.set(anchor(o), head);
    nav.append(el('li', { 'data-option': o.id }, [head, sub]));

    const section = el('section', { class: 'doc-option', id: anchor(o), 'aria-labelledby': `${anchor(o)}-h` }, [
      el('header', { class: 'doc-option-head' }, [
        el('h2', { id: `${anchor(o)}-h` }, [swatch(o), el('span', { text: o.name })]),
        el('p', { text: o.description }),
      ]),
    ]);
    if (o.motion) {
      const sw = motionSwitch('doc-motion', true);
      switches.push(sw);
      section.firstChild.append(sw.node);
    }
    C.boards.forEach((b, i) => {
      const frame = el('button', { type: 'button', class: 'page-art', 'aria-label': `View ${o.name} ${b.title} full size`, onclick: () => viewer.open(o.id, b.id) }, [art(o, b, i)]);
      if (o.motion) motionArt.push({ o, b, i, frame });
      section.append(el('figure', { class: 'page', id: anchor(o, b), 'data-option': o.id }, [
        frame,
        el('figcaption', {}, [el('span', { text: b.title }), el('span', { class: 'page-num', text: `Board ${i + 1} of ${C.boards.length}` })]),
      ]));
    });
    doc.append(section);
  }

  // Animated boards only download and play while on screen.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.play().catch(() => {});
      else e.target.pause();
    }
  }, { rootMargin: '200px 0px' });
  doc.querySelectorAll('video').forEach((v) => io.observe(v));

  // Motion toggled: swap those boards between still and moving footage.
  let motion = state.motion;
  const syncMotion = () => {
    switches.forEach((sw) => sw.sync());
    if (motion === state.motion) return;
    motion = state.motion;
    for (const { o, b, i, frame } of motionArt) {
      const old = frame.firstChild;
      if (old.video || old.tagName === 'VIDEO') io.unobserve(old.video || old);
      const next = art(o, b, i);
      frame.replaceChildren(next);
      if (next.video) io.observe(next.video);
    }
  };
  syncMotion();
  state.onChange(syncMotion);

  // Highlight the board nearest the top of the viewport and keep the colorway in sync,
  // so "In store" opens on whatever option the client was just looking at.
  const pages = [...doc.querySelectorAll('.page')];
  let current = null;
  function spy() {
    const line = innerHeight * 0.35;
    let best = pages[0];
    for (const p of pages) if (p.getBoundingClientRect().top <= line) best = p;
    if (best === current) return;
    current = best;
    for (const a of tocLinks.values()) a.removeAttribute('aria-current');
    tocLinks.get(best.id).setAttribute('aria-current', 'location');
    nav.querySelectorAll('li[data-option]').forEach((li) => li.classList.toggle('open', li.dataset.option === best.dataset.option));
    state.set(best.dataset.option);
  }
  addEventListener('scroll', () => requestAnimationFrame(spy), { passive: true });

  document.body.append(viewDock('gallery'));

  // Arriving from the photo view with ?option=… and no hash: jump to that colorway.
  if (!location.hash && state.option !== C.options[0].id) {
    document.getElementById(state.option).scrollIntoView();
  }
  spy();
})();
