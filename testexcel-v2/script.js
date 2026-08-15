(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Header background on scroll =====
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ===== Scroll reveal (transform + opacity only) =====
  const revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
  if (reducedMotion) {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(el => observer.observe(el));
  }

  // ===== Hero scroll-scrub engine =====
  initHeroScrub();

  function initHeroScrub() {
    const heroScrub = document.getElementById('top');
    const heroStage = document.getElementById('heroStage');
    const heroVideo = document.getElementById('heroVideo');
    const heroPoster = document.getElementById('heroPoster');
    if (!heroScrub || !heroStage || !heroVideo) return;

    const VIDEO_SOURCES = ['assets/video/hero-scrub.mp4', 'assets/video/hero-scrub.webm'];
    const POSTER_START = 'assets/video/hero-poster.jpg';
    const POSTER_STATIC = 'assets/video/hero-ending.jpg';

    const bandEls = Array.from(heroStage.querySelectorAll('.band'));
    const bands = bandEls.map((el, i) => {
      const [a, b] = (el.dataset.band || '0,1').split(',').map(Number);
      return { el, a, b, isFirst: i === 0, isLast: i === bandEls.length - 1, lastOp: -1, lastK: -1 };
    });

    // ===== Five static-hero gates (must match CSS media queries exactly) =====
    const GATES = [
      '(max-width: 720px)',
      '(orientation: portrait) and (max-width: 1024px)',
      '(orientation: portrait) and (pointer: coarse)',
      '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
      '(prefers-reduced-motion: reduce)'
    ];
    const MQLS = GATES.map(q => matchMedia(q));

    let scrubOn = false;
    let heroInited = false;
    let heroOnScreen = true;
    let target = 0, shown = 0, rafId = null, lastTick = 0;
    let seekBusy = false, pendingTime = null;
    let loadStart = 0;

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
    function smoothstep(p, e0, e1) {
      const t = clamp((p - e0) / (e1 - e0), 0, 1);
      return t * t * (3 - 2 * t);
    }
    function heroProgress() {
      const rect = heroScrub.getBoundingClientRect();
      const total = heroScrub.offsetHeight - window.innerHeight;
      if (total <= 0) return 1;
      return clamp(-rect.top / total, 0, 1);
    }

    function requestSeek(t) {
      if (!heroVideo.duration || isNaN(t)) return;
      if (seekBusy) { pendingTime = t; return; }
      seekBusy = true;
      heroVideo.currentTime = t;
    }
    heroVideo.addEventListener('seeked', () => {
      seekBusy = false;
      if (pendingTime !== null) {
        const t = pendingTime;
        pendingTime = null;
        requestSeek(t);
      }
    });
    heroVideo.addEventListener('error', () => {
      seekBusy = false;
      pendingTime = null;
      heroStage.classList.remove('video-ready');
    });

    function updateBands(p, loadK) {
      bands.forEach(band => {
        const { el, a, b, isFirst, isLast } = band;
        const f = Math.min(0.02, (b - a) / 3);
        let op;
        if (isFirst && isLast) op = 1;
        else if (isFirst) op = 1 - smoothstep(p, b - f, b);
        else if (isLast) op = smoothstep(p, a, a + f);
        else op = smoothstep(p, a, a + f) * (1 - smoothstep(p, b - f, b));

        const ramp = Math.min(0.025, (b - a) * 0.35);
        let k = clamp((p - a) / ramp, 0, 1);
        if (isFirst) k = Math.max(k, loadK); // only the entrance transform gets the load ramp; opacity already starts at 1 via the skipped ease-in above

        if (Math.abs(op - band.lastOp) > 0.004) {
          el.style.opacity = op;
          band.lastOp = op;
        }
        if (Math.abs(k - band.lastK) > 0.004) {
          el.style.transform = `translateY(${(1 - k) * 16}px)`;
          band.lastK = k;
        }
      });
    }

    function tick(now) {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      const k = 0.16;
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
      let converged = false;
      if (Math.abs(target - shown) < 0.0005) {
        shown = target;
        converged = true;
      }
      const loadK = loadStart ? clamp((performance.now() - loadStart) / 700, 0, 1) : 1;
      requestSeek(shown * (heroVideo.duration || 0));
      updateBands(shown, loadK);
      if (converged && loadK >= 1) {
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }
    }

    function onScroll() {
      target = heroProgress();
      if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
    }

    const heroIO = new IntersectionObserver((entries) => {
      heroOnScreen = entries[0].isIntersecting;
      if (heroOnScreen && scrubOn && rafId === null) rafId = requestAnimationFrame(tick);
    }, { threshold: 0 });
    heroIO.observe(heroScrub);

    async function tryLoadSource(url) {
      return new Promise(async (resolve, reject) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return reject(new Error('fetch failed: ' + res.status));
          const blob = await res.blob();
          const objectUrl = URL.createObjectURL(blob);
          const onCanPlay = () => {
            heroVideo.removeEventListener('error', onError);
            requestSeek(heroProgress() * heroVideo.duration);
            heroStage.classList.add('video-ready');
            resolve();
          };
          const onError = () => {
            heroVideo.removeEventListener('canplay', onCanPlay);
            URL.revokeObjectURL(objectUrl);
            reject(new Error('decode failed for ' + url));
          };
          heroVideo.addEventListener('canplay', onCanPlay, { once: true });
          heroVideo.addEventListener('error', onError, { once: true });
          heroVideo.src = objectUrl;
          heroVideo.load();
        } catch (e) {
          reject(e);
        }
      });
    }

    async function loadHeroBlob() {
      for (const url of VIDEO_SOURCES) {
        try {
          await tryLoadSource(url);
          return; // succeeded
        } catch (e) {
          // try the next source; if none work, the poster stays as the complete fallback
        }
      }
      heroStage.classList.remove('video-ready');
    }

    function initHeroOnce() {
      if (heroInited) return;
      heroInited = true;
      loadStart = performance.now();
      loadHeroBlob();
    }

    function pinToFinalStates() {
      bands.forEach(band => {
        band.el.style.opacity = 1;
        band.el.style.transform = 'none';
      });
    }

    function enableScrub() {
      if (scrubOn) return;
      scrubOn = true;
      heroScrub.classList.remove('is-static');
      heroPoster.src = POSTER_START;
      initHeroOnce();
      window.addEventListener('scroll', onScroll, { passive: true });
      bands.forEach(b => { b.lastOp = -1; b.lastK = -1; });
      window.addEventListener('resize', onScroll, { passive: true });
      onScroll();
    }

    function disableScrub() {
      scrubOn = false;
      heroScrub.classList.add('is-static');
      heroPoster.src = POSTER_STATIC;
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      pinToFinalStates();
    }

    function applyHeroMode() {
      if (GATES.some(q => matchMedia(q).matches)) disableScrub();
      else enableScrub();
    }

    MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
    applyHeroMode();
  }

  // ===== Contact form (static site, JS-only success state) =====
  const form = document.querySelector('.contact-grid');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      if (form.checkValidity()) {
        note.textContent = 'Received. We will be in touch shortly.';
        form.reset();
      } else {
        note.textContent = 'Please fill in every required field.';
      }
    });
  }
})();
