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
