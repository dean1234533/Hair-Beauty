// Services card slider — mobile only
(function () {
  const slider = document.getElementById('servicesSlider');
  const dotsWrap = document.getElementById('servicesDots');
  const prevBtn = document.getElementById('servicesPrev');
  const nextBtn = document.getElementById('servicesNext');
  if (!slider) return;

  const cards = Array.from(slider.querySelectorAll('.service-card'));
  const total = cards.length;
  let current = 0;
  let timer;
  let active = false;

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    cards.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'services__slider-dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => { goTo(i); resetTimer(); });
      dotsWrap.appendChild(d);
    });
  }

  function goTo(index) {
    current = (index + total) % total;
    slider.scrollTo({ left: current * slider.offsetWidth, behavior: 'smooth' });
    if (dotsWrap) dotsWrap.querySelectorAll('.services__slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 4000);
  }

  function enable() {
    if (active) return;
    active = true;
    buildDots();
    goTo(0);
    resetTimer();
  }

  function disable() {
    if (!active) return;
    active = false;
    clearInterval(timer);
    slider.scrollTo({ left: 0 });
    if (dotsWrap) dotsWrap.innerHTML = '';
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); resetTimer(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); resetTimer(); });

  const mq = window.matchMedia('(max-width: 768px)');
  mq.addEventListener('change', e => e.matches ? enable() : disable());
  if (mq.matches) enable();
})();

// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const menuClose = document.getElementById('menuClose');

hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
menuClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// Intersection observer for fade-up animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(
  '.service-item, .testimonial-card, .photo-feature__content, .stats__item, .contact__left, .contact__right'
).forEach((el, i) => {
  el.classList.add('fade-up');
  el.style.transitionDelay = `${i * 0.06}s`;
  observer.observe(el);
});

// Counter animation for stats
function animateCounter(el, target, isDecimal) {
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = eased * target;
    el.textContent = isDecimal ? value.toFixed(1) : Math.floor(value).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stats__number').forEach(el => {
        const target = parseFloat(el.dataset.target);
        const isDecimal = el.hasAttribute('data-decimal');
        animateCounter(el, target, isDecimal);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.stats');
if (statsEl) statsObserver.observe(statsEl);

// Gallery auto-slider (mobile only)
(function () {
  const slider = document.getElementById('gallerySlider');
  const dotsWrap = document.getElementById('galleryDots');
  if (!slider || !dotsWrap) return;

  const cells = Array.from(slider.querySelectorAll('.gallery__cell'));
  let current = 0;
  let timer;

  // Build dots
  cells.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'gallery__dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.gallery__dot'));

  function goTo(index, resetTimer) {
    cells[current].classList.remove('active');
    dots[current].classList.remove('active');
    // Slide all cells by translating the container
    cells.forEach(c => { c.style.transform = `translateX(${-index * 100}%)`; });
    current = index;
    cells[current].classList.add('active');
    dots[current].classList.add('active');
    if (resetTimer) { clearInterval(timer); startTimer(); }
  }

  function startTimer() {
    timer = setInterval(() => goTo((current + 1) % cells.length, false), 3000);
  }

  // Only run on mobile
  const mq = window.matchMedia('(max-width: 768px)');
  function init() {
    if (mq.matches) {
      goTo(0, false);
      startTimer();
    } else {
      clearInterval(timer);
      cells.forEach(c => { c.style.transform = ''; c.classList.remove('active'); });
    }
  }

  mq.addEventListener('change', init);
  init();
})();

// Testimonial slider dots — mobile only
(function () {
  const grid = document.querySelector('.testimonials__grid');
  const dots = Array.from(document.querySelectorAll('.testimonials__dot'));
  if (!grid || !dots.length) return;

  let current = 0;

  function goTo(index) {
    current = index;
    grid.scrollTo({ left: current * grid.offsetWidth, behavior: 'smooth' });
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  grid.addEventListener('scroll', () => {
    const index = Math.round(grid.scrollLeft / grid.offsetWidth);
    if (index !== current) {
      current = index;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }
  }, { passive: true });
})();

// Form submit (demo — replace with real endpoint)
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.textContent = 'Enquiry Sent ✓';
  btn.style.background = '#2a6b3a';
  btn.style.color = '#fff';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
    btn.style.color = '';
    btn.disabled = false;
    e.target.reset();
  }, 4000);
});
