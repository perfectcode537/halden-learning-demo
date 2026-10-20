(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  if (hasGsap) root.classList.add('js');
  document.body.classList.add('is-loading');

  /* ---------- Loader ---------- */
  const loader = document.querySelector('.loader');
  const countEl = loader.querySelector('.loader__count span');
  let shown = 0, target = 0, done = false;
  const tick = () => {
    shown += (target - shown) * 0.12;
    countEl.textContent = Math.round(shown);
    if (!done || shown < 99.5) requestAnimationFrame(tick);
    else { countEl.textContent = 100; finish(); }
  };
  const bump = setInterval(() => { target = Math.min(target + Math.random() * 18, 88); }, 120);
  const ready = () => { if (done) return; done = true; clearInterval(bump); target = 100; };
  window.addEventListener('load', ready);
  setTimeout(ready, 2600); // never block the visitor for long
  requestAnimationFrame(tick);

  function finish() {
    document.body.classList.remove('is-loading');
    if (!hasGsap) { loader.remove(); document.querySelector('.nav').classList.remove('nav--pre'); return; }
    gsap.timeline()
      .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' })
      .set(loader, { display: 'none' })
      .from('.hero__media', { scale: 1.25, duration: 2.2, ease: 'expo.out' }, '-=0.7')
      .from('.hero__title .line > span', { yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.12, ease: 'expo.out' }, '-=2')
      .to('.hero .reveal-up', { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' }, '-=1.1')
      .call(() => document.querySelector('.nav').classList.remove('nav--pre'), null, '-=1.4');
  }

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.set('.hero .reveal-up', { y: 30 });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = id === '#top' ? document.body : document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(el, { offset: id === '#top' ? 0 : -20, duration: 1.6 });
      else el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Nav ---------- */
  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > hero.offsetHeight - 90);
      nav.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 1.2 && !root.classList.contains('menu-open'));
      lastY = y;
    }
  });
  const toggle = document.querySelector('.nav__toggle');
  function closeMenu() {
    root.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    lenis && lenis.start();
  }
  toggle.addEventListener('click', () => {
    const open = root.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      lenis && lenis.stop();
      gsap.fromTo('.menu a', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.06, ease: 'expo.out', delay: 0.2 });
    } else closeMenu();
  });

  /* ---------- Hero: 3D push-back on scroll ---------- */
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__media', { scale: 0.86, rotateX: 8, yPercent: 10, borderRadius: 32, transformPerspective: 1400, ease: 'none' }, 0)
    .to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none' }, 0);

  /* ---------- Split titles into words ---------- */
  document.querySelectorAll('.split').forEach(el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const o = document.createElement('span'); o.className = 'line';
            o.style.display = 'inline-block';
            const i = document.createElement('span'); i.textContent = part;
            o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    gsap.from(el.querySelectorAll('.line > span'), {
      yPercent: 110, rotate: 3, duration: 1.3, stagger: 0.05, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  /* ---------- Reveals ---------- */
  gsap.utils.toArray('.reveal-up').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.fromTo(el, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });
  ScrollTrigger.batch('.reveal-card', {
    start: 'top 88%',
    onEnter: els => gsap.fromTo(els,
      { opacity: 0, y: 90, rotateX: -14, transformPerspective: 1200, transformOrigin: '50% 0%' },
      { opacity: 1, y: 0, rotateX: 0, duration: 1.5, stagger: 0.12, ease: 'expo.out', clearProps: 'transform' })
  });

  /* ---------- Counters ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%' },
      onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-GB'); }
    });
  });

  /* ---------- Parallax ---------- */
  gsap.utils.toArray('.parallax').forEach(el => {
    const sp = parseFloat(el.dataset.speed || 0.1);
    gsap.fromTo(el, { yPercent: -sp * 50 }, {
      yPercent: sp * 50, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    const img = el.querySelector('img');
    if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Film band: slow zoom + word-by-word light ---------- */
  gsap.fromTo('.film__img img', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.film', start: 'top bottom', end: 'bottom top', scrub: true } });
  const quote = document.querySelector('.film__quote');
  const words = [];
  const wrapWords = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; words.push(s); frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };
  wrapWords(quote);
  gsap.to(words, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.film', start: 'top 60%', end: 'center 40%', scrub: true } });
  gsap.from('.film__by, .film .eyebrow', { opacity: 0, y: 20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.film__quote', start: 'top 70%' } });

  /* ---------- Gallery: staggered depth ---------- */
  gsap.utils.toArray('.g').forEach((g, i) => {
    gsap.fromTo(g, { clipPath: 'inset(18% 10% 18% 10% round 22px)', opacity: 0.2 }, {
      clipPath: 'inset(0% 0% 0% 0% round 22px)', opacity: 1, duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: g, start: 'top 90%' }
    });
    gsap.fromTo(g.querySelector('img'), { scale: 1.25, yPercent: -6 }, {
      scale: 1.05, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- Approach: pinned horizontal (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = document.querySelector('.approach__track');
    const tween = gsap.to(track, {
      x: () => -Math.max(0, track.scrollWidth - window.innerWidth + track.offsetLeft),
      ease: 'none',
      scrollTrigger: {
        trigger: '.approach', start: 'top top', end: () => '+=' + Math.max(600, track.scrollWidth - window.innerWidth * 0.4),
        pin: '.approach__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1
      }
    });
    gsap.utils.toArray('.step').forEach(step => {
      gsap.fromTo(step.querySelector('img'), { scale: 1.3 }, {
        scale: 1.05, ease: 'none',
        scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
      });
      gsap.fromTo(step, { rotateY: -18, opacity: 0.35, transformPerspective: 1400, transformOrigin: '0% 50%' }, {
        rotateY: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 105%', end: 'left 55%', scrub: true }
      });
    });
  });
  mm.add('(max-width: 900px)', () => {
    gsap.from('.step', { opacity: 0, x: 60, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.approach__track', start: 'top 85%' } });
  });

  /* ---------- Footer word rise ---------- */
  gsap.from('.footer__word', { yPercent: 40, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer__word', start: 'top 95%' } });

  /* ---------- 3D tilt cards ---------- */
  if (fine && !reduce) {
    document.querySelectorAll('.tilt').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      const ty = gsap.quickTo(card, 'y', { duration: 0.8, ease: 'power3.out' });
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        rx(-py * 10); ry(px * 12); ty(-10);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); ty(0); });
    });

    /* ---------- Magnetic buttons ---------- */
    document.querySelectorAll('.magnetic').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3.out' });
      const y = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3.out' });
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });

    /* ---------- Cursor ---------- */
    const cur = document.querySelector('.cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3.out' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3.out' });
    window.addEventListener('pointermove', e => { cur.classList.add('is-on'); cx(e.clientX); cy(e.clientY); });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    document.querySelectorAll('a, button, .card, .g').forEach(el => {
      el.addEventListener('pointerenter', () => cur.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cur.classList.remove('is-hover'));
    });
  }

  /* ---------- Pause hero video off-screen ---------- */
  const video = document.querySelector('.hero__video');
  ScrollTrigger.create({
    trigger: hero, start: 'top bottom', end: 'bottom top',
    onToggle: s => { s.isActive ? video.play().catch(() => {}) : video.pause(); }
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
