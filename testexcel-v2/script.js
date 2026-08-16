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

  // ===== Service card glow: re-fires every time a card scrolls into view =====
  const glowCards = document.querySelectorAll('.service-card');
  if (glowCards.length && !reducedMotion) {
    const glowObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.remove('card-glow');
          void el.offsetWidth; // force reflow so the animation restarts every time
          el.classList.add('card-glow');
        }
      });
    }, { threshold: 0.3 });
    glowCards.forEach(el => glowObserver.observe(el));
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

  // ===== Contact form: validated, persisted via TestExcel's own API, one row per submission =====
  //
  // The frontend never talks to MySQL directly — it POSTs to this API endpoint,
  // which is the only thing holding database/SMTP credentials (server/index.js,
  // configured entirely through Hostinger's environment-variable settings, never
  // in this file or the repo). Fill in the real endpoint once the API is
  // deployed; until then the form fails closed with a clear, honest error
  // rather than pretending to succeed.
  const CONTACT_API_URL = 'YOUR_CONTACT_API_URL'; // e.g. https://api.testexcel.example/api/contact

  const form = document.getElementById('contactForm');
  if (form) {
    const note = form.querySelector('.form-note');
    const submitBtn = form.querySelector('button[type="submit"]');
    const fields = {
      name: form.querySelector('#name'),
      company: form.querySelector('#company'),
      email: form.querySelector('#email'),
      role: form.querySelector('#role'),
      service: form.querySelector('#service'),
      message: form.querySelector('#message'),
      website: form.querySelector('#website'), // honeypot
    };

    let submitting = false;
    let succeeded = false;

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setNote(text, state) {
      note.textContent = text;
      if (state) note.setAttribute('data-state', state);
      else note.removeAttribute('data-state');
    }

    function validate() {
      const name = fields.name.value.trim();
      const email = fields.email.value.trim();
      const message = fields.message.value.trim();

      if (!name) return 'Please enter your full name.';
      if (!email || !EMAIL_RE.test(email)) return 'Please enter a valid email address.';
      if (!message || message.length < 10) return 'Please tell us a little more about how we can help.';
      return null;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitting || succeeded) return; // stops double-click / repeat-click duplicates

      // Honeypot: real visitors never fill this field (it's visually and
      // programmatically hidden). If it has a value, this is almost certainly
      // a bot — accept silently without hitting the database or sending mail.
      if (fields.website.value.trim() !== '') {
        setNote('Received. We will be in touch shortly.');
        form.reset();
        succeeded = true;
        return;
      }

      const validationError = validate();
      if (validationError) {
        setNote(validationError, 'error');
        const name = fields.name.value.trim();
        const email = fields.email.value.trim();
        let fieldToFocus = fields.name;
        if (name) fieldToFocus = (email && EMAIL_RE.test(email)) ? fields.message : fields.email;
        fieldToFocus.focus();
        return;
      }

      if (CONTACT_API_URL === 'YOUR_CONTACT_API_URL') {
        setNote("We couldn't send your request. Please try again, or email us directly.", 'error');
        console.error('Contact form: CONTACT_API_URL is not configured.');
        return;
      }

      submitting = true;
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      setNote('');

      // Idempotency key: unique per submit attempt, and re-used across retries of
      // the SAME attempt, so a flaky network retry can never create two rows
      // (the API enforces this server-side too, via a UNIQUE constraint).
      function uuidv4() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        // Fallback for older browsers: still a valid v4-shaped UUID, just
        // using Math.random instead of a CSPRNG — fine for an idempotency
        // key, which only needs to be unique, not unguessable.
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      const requestRef = uuidv4();

      const payload = {
        request_ref: requestRef,
        full_name: fields.name.value.trim(),
        company: fields.company.value.trim() || null,
        email: fields.email.value.trim(),
        role: fields.role.value.trim() || null,
        service_interest: fields.service.value || null,
        message: fields.message.value.trim(),
        source_page: window.location.href,
      };

      try {
        const res = await fetch(CONTACT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(`Contact API error: ${res.status} ${data.error || ''}`);
        }

        succeeded = true;
        setNote('Thank you. Your request has been received. We’ll review the details and get back to you.');
        form.reset();
        submitBtn.textContent = originalLabel;
        submitBtn.disabled = true; // prevent an accidental resubmit of the same successful request
      } catch (err) {
        console.error('Contact form submission failed:', err); // technical detail logged, never shown to the visitor
        setNote("We couldn't send your request. Please try again.", 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      } finally {
        submitting = false;
        submitBtn.removeAttribute('aria-busy');
      }
    });
  }
})();
