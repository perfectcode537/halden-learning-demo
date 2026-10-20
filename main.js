(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  if (hasGsap) root.classList.add('js');
  document.body.classList.add('is-loading');

  /* ---------- Lazy videos: load near view, play only while visible ---------- */
  const vio = new IntersectionObserver(entries => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (v.dataset.src && !v.src) { v.src = v.dataset.src; }
        v.play().catch(() => {});
      } else if (!v.paused) v.pause();
    });
  }, { rootMargin: '200px 0px' });
  $$('video[data-src]').forEach(v => vio.observe(v));

  /* ---------- Split helpers ---------- */
  const splitChars = el => {
    const text = el.textContent; el.textContent = '';
    [...text].forEach(ch => {
      const s = document.createElement('span');
      s.className = 'char'; s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    });
  };
  const wrapWords = (node, cls, skip, out = []) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = cls; s.textContent = p;
          out.push(s); frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !(skip && n.matches(skip))) wrapWords(n, cls, skip, out);
    });
    return out;
  };
  $$('.hero__title .chars').forEach(splitChars);

  /* ---------- Curtain loader ---------- */
  const curtain = $('.curtain');
  const countEl = $('.curtain__count span');
  let shown = 0, target = 0, done = false;
  const bump = setInterval(() => { target = Math.min(target + Math.random() * 16, 90); }, 110);
  const ready = () => { if (done) return; done = true; clearInterval(bump); target = 100; };
  window.addEventListener('load', ready);
  setTimeout(ready, 2600);
  (function tick() {
    shown += (target - shown) * 0.14;
    countEl.textContent = String(Math.round(shown)).padStart(2, '0');
    if (!done || shown < 99.5) requestAnimationFrame(tick);
    else { countEl.textContent = '100'; openCurtain(); }
  })();

  function openCurtain() {
    document.body.classList.remove('is-loading');
    const nav = $('.nav');
    if (!hasGsap) { curtain.remove(); nav.classList.remove('nav--pre'); return; }
    const lb = $('.hero .letterbox').offsetHeight;
    gsap.timeline()
      .to('.curtain__center', { opacity: 0, y: -20, duration: .6, ease: 'power2.in' })
      .to('.curtain__top, .curtain__bot', { height: lb, duration: 1.5, ease: 'expo.inOut' }, '-=.1')
      .set(curtain, { display: 'none' })
      .from('.hero__frame', { scale: 1.35, duration: 2.6, ease: 'expo.out' }, '-=1.3')
      .from('.hero__title .char', {
        yPercent: 120, rotateX: -90, opacity: 0, duration: 1.6, stagger: 0.028, ease: 'expo.out'
      }, '-=2.3')
      .fromTo('.hero-in', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out' }, '-=1.4')
      .call(() => nav.classList.remove('nav--pre'), null, '-=1.4');
  }

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.set('.hero-in', { opacity: 0 });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? document.body : $(id);
    if (!el) return;
    e.preventDefault(); closeMenu();
    lenis ? lenis.scrollTo(el, { offset: 0, duration: 1.8 }) : el.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- Nav ---------- */
  const nav = $('.nav'), hero = $('.hero'), toggle = $('.nav__toggle');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: s => {
      const y = s.scroll();
      nav.classList.toggle('is-solid', y > hero.offsetHeight * .6);
      nav.classList.toggle('is-hidden', y > lastY + 2 && y > window.innerHeight && !root.classList.contains('menu-open'));
      lastY = y;
    }
  });
  function closeMenu() { root.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); }
  toggle.addEventListener('click', () => {
    const open = root.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      lenis && lenis.stop();
      gsap.fromTo('.menu__links a', { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, stagger: .06, ease: 'expo.out', delay: .25 });
    } else closeMenu();
  });

  /* ---------- Hero: timecode + 3D push-back ---------- */
  const tc = $('.tc'), t0 = performance.now();
  const pad = n => String(n).padStart(2, '0');
  gsap.ticker.add(() => {
    const s = (performance.now() - t0) / 1000;
    tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(Math.floor(s) % 60)}:${pad(Math.floor(s * 25) % 25)}`;
  });
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__frame', { scale: .8, rotateX: 14, yPercent: 8, borderRadius: 40, ease: 'none' }, 0)
    .to('.hero .letterbox', { height: 0, ease: 'none' }, 0)
    .to('.hero__content', { yPercent: -30, opacity: 0, filter: 'blur(10px)', ease: 'none' }, 0)
    .to('.hero__meta, .hero__cue', { opacity: 0, ease: 'none', duration: .3 }, 0);
  const heroVideo = $('.hero__video');
  ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: s => s.isActive ? heroVideo.play().catch(() => {}) : heroVideo.pause() });

  /* ---------- Title word masks ---------- */
  $$('.split').forEach(el => {
    const words = wrapWords(el, 'wd');
    words.forEach(w => { const m = document.createElement('span'); m.className = 'row'; m.style.display = 'inline-block'; w.replaceWith(m); m.appendChild(w); w.style.display = 'inline-block'; });
    gsap.from(words, { yPercent: 115, rotate: 4, duration: 1.4, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ---------- Generic reveals & counters ---------- */
  $$('.reveal').forEach(el => gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  $$('[data-count]').forEach(el => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 2.4, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' }, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-GB'); } });
  });
  $$('.chapter').forEach(el => gsap.from(el, { opacity: 0, x: -30, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

  /* ---------- Manifesto: words light up, video pills pop in ---------- */
  const mText = $('.manifesto__text');
  const mWords = wrapWords(mText, 'w', '.pill');
  gsap.to(mWords, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: mText, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  $$('.pill').forEach(p => gsap.from(p, { scale: 0, rotate: -12, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: p, start: 'top 80%' } }));

  /* ---------- About: layered 3D depth ---------- */
  const vis = $('.about__visual');
  const depth = [[-.06, 0], [.14, 40], [.24, 80]];
  $$('.layer', vis).forEach((l, i) => {
    gsap.fromTo(l, { yPercent: depth[i][0] * -60 }, { yPercent: depth[i][0] * 60, ease: 'none', scrollTrigger: { trigger: vis, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from(l, { clipPath: 'inset(100% 0 0 0 round 26px)', duration: 1.6, delay: i * .15, ease: 'expo.out', scrollTrigger: { trigger: vis, start: 'top 75%' } });
  });
  if (fine && !reduce) {
    const rx = gsap.quickTo(vis, 'rotationX', { duration: 1, ease: 'power3.out' });
    const ry = gsap.quickTo(vis, 'rotationY', { duration: 1, ease: 'power3.out' });
    const lz = $$('.layer', vis).map((l, i) => [gsap.quickTo(l, 'x', { duration: 1, ease: 'power3.out' }), gsap.quickTo(l, 'z', { duration: 1, ease: 'power3.out' }), depth[i][1]]);
    vis.addEventListener('pointermove', e => {
      const r = vis.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      rx(-py * 10); ry(px * 12); lz.forEach(([x, z, d]) => { x(px * d * .4); z(d); });
    });
    vis.addEventListener('pointerleave', () => { rx(0); ry(0); lz.forEach(([x, z]) => { x(0); z(0); }); });
  }

  /* ---------- Services: sticky stacking cards ---------- */
  const cards = $$('.scard');
  cards.forEach((c, i) => c.style.setProperty('--i', i));
  cards.forEach((c, i) => {
    if (i === cards.length - 1) return;
    gsap.to(c, {
      scale: 1 - (cards.length - i) * .035, filter: 'brightness(.45)', ease: 'none',
      scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 20%', scrub: true }
    });
  });
  cards.forEach(c => gsap.from(c.querySelector('.scard__body'), { opacity: 0, x: 60, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 70%' } }));

  /* ---------- Film band: bars close in, words come into focus ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.film', start: 'top bottom', end: 'bottom top', scrub: true } })
    .fromTo('.film__media video', { scale: 1.35 }, { scale: 1, ease: 'none' }, 0)
    .fromTo('.film__bar', { height: 0 }, { height: '13vh', ease: 'none', duration: .5 }, .25);
  const fWords = wrapWords($('.film__quote'), 'w');
  gsap.to(fWords, { opacity: 1, filter: 'blur(0px)', stagger: .1, ease: 'none', scrollTrigger: { trigger: '.film', start: 'top 55%', end: 'center 45%', scrub: true } });

  /* ---------- Approach (desktop pinned horizontal) / Ring ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('.approach__track');
    const tween = gsap.to(track, {
      x: () => -Math.max(0, track.scrollWidth - window.innerWidth + track.offsetLeft), ease: 'none',
      scrollTrigger: { trigger: '.approach', start: 'top top', end: () => '+=' + Math.max(600, track.scrollWidth - window.innerWidth * .4), pin: '.approach__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    $$('.step').forEach(step => {
      gsap.fromTo(step.querySelector('img'), { scale: 1.35 }, { scale: 1.05, ease: 'none', scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      gsap.fromTo(step, { rotateY: -24, z: -120, opacity: .3, transformPerspective: 1400, transformOrigin: '0% 50%' }, { rotateY: 0, z: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left 105%', end: 'left 50%', scrub: true } });
      gsap.fromTo(step.querySelector('.step__big'), { xPercent: 60 }, { xPercent: -20, ease: 'none', scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  });
  mm.add('(max-width: 900px)', () => {
    gsap.from('.step', { opacity: 0, x: 80, duration: 1.3, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.approach__track', start: 'top 85%' } });
  });

  /* 3D ring: figures placed on a cylinder, turned by scroll + slow drift */
  const spin = $('.ring__spin'), figs = $$('figure', spin);
  let radius = 0, scrollRot = 0, drift = 0;
  const layoutRing = () => {
    // card width from viewport, capped so a card always fits under the title
    const avail = window.innerHeight - (window.innerWidth < 700 ? 230 : 300);
    const w = Math.min(Math.max(window.innerWidth * (window.innerWidth < 700 ? .46 : .19), 150), 300, avail * .75);
    spin.style.setProperty('--w', w + 'px');
    radius = Math.round((w / 2) / Math.tan(Math.PI / figs.length) * 1.18);
    figs.forEach((f, i) => { f.style.transform = `rotateY(${i * 360 / figs.length}deg) translateZ(${radius}px)`; });
  };
  layoutRing();
  window.addEventListener('resize', layoutRing);
  gsap.ticker.add(() => {
    if (!reduce) drift += .04;
    spin.style.transform = `translateY(13vh) translateZ(${-radius}px) rotateX(-6deg) rotateY(${scrollRot + drift}deg)`;
  });
  const ringST = { trigger: '.ring', start: 'top top', end: '+=220%', pin: '.ring__pin', scrub: 1, anticipatePin: 1, onUpdate: s => { scrollRot = -s.progress * 300; } };
  ScrollTrigger.create(ringST);
  gsap.from('.ring__title .title', { opacity: 0, scale: .85, filter: 'blur(12px)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.ring', start: 'top 60%' } });

  /* ---------- Reviews: seamless dual marquee ---------- */
  $$('.rrow__track').forEach(t => [...t.children].forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); t.appendChild(k); }));
  gsap.from('.rrow', { opacity: 0, y: 60, duration: 1.4, stagger: .15, ease: 'expo.out', scrollTrigger: { trigger: '.rrow', start: 'top 88%' } });

  /* ---------- Contact & footer ---------- */
  gsap.fromTo('.contact__bg video', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.footer__word', { yPercent: 50, opacity: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.footer__word', start: 'top 95%' } });

  /* ---------- Pointer niceties ---------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: .6, ease: 'power3.out' }), y = gsap.quickTo(btn, 'y', { duration: .6, ease: 'power3.out' });
      btn.addEventListener('pointermove', e => { const r = btn.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .25); y((e.clientY - r.top - r.height / 2) * .35); });
      btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });
    $$('.step, .review').forEach(card => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: .8, ease: 'power3.out' }), ry = gsap.quickTo(card, 'rotationY', { duration: .8, ease: 'power3.out' });
      gsap.set(card, { transformPerspective: 1000 });
      card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); rx(-((e.clientY - r.top) / r.height - .5) * 8); ry(((e.clientX - r.left) / r.width - .5) * 10); });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
    const cur = $('.cursor'), label = $('.cursor__label');
    const cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3.out' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3.out' });
    window.addEventListener('pointermove', e => { cur.classList.add('is-on'); cx(e.clientX); cy(e.clientY); });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    $$('a, button, input, select, textarea').forEach(el => {
      el.addEventListener('pointerenter', () => cur.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cur.classList.remove('is-hover'));
    });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; cur.classList.add('is-label'); });
      el.addEventListener('pointerleave', () => cur.classList.remove('is-label'));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
