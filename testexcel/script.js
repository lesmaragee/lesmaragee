(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('year').textContent = new Date().getFullYear();

  // ===== Scroll reveal =====
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
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(el => observer.observe(el));
  }

  // ===== Hero scanner sequence =====
  const rows = document.querySelectorAll('.scanner-row');
  const final = document.querySelector('.scanner-final');
  if (rows.length) {
    if (reducedMotion) {
      rows.forEach(r => r.classList.add('is-checked'));
      final && final.classList.add('is-cleared');
    } else {
      let delay = 500;
      rows.forEach((row, i) => {
        setTimeout(() => row.classList.add('is-checked'), delay + i * 420);
      });
      setTimeout(() => final && final.classList.add('is-cleared'), delay + rows.length * 420 + 200);
    }
  }

  // ===== Stat counters =====
  const stats = document.querySelectorAll('.stat-num');
  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    if (reducedMotion) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach(el => statObserver.observe(el));

  // ===== Contact form (UI only) =====
  const form = document.querySelector('.final-cta form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-note');
      if (form.checkValidity()) {
        note.textContent = 'Thank you — we will be in touch shortly.';
        form.reset();
      } else {
        note.textContent = 'Please fill in all required fields.';
      }
    });
  }
})();
