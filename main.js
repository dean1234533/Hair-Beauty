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

// Testimonial slider dots (mobile only)
const grid = document.querySelector('.testimonials__grid');
const dots = document.querySelectorAll('.testimonials__dot');

if (grid && dots.length) {
  const updateDots = () => {
    const index = Math.round(grid.scrollLeft / grid.offsetWidth * (dots.length / (dots.length - 1 + 1)));
    const cards = grid.querySelectorAll('.testimonial-card');
    let active = 0;
    cards.forEach((card, i) => {
      const cardLeft = card.offsetLeft - grid.offsetLeft;
      if (Math.abs(grid.scrollLeft - cardLeft) < card.offsetWidth / 2) active = i;
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === active));
  };

  grid.addEventListener('scroll', updateDots, { passive: true });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const cards = grid.querySelectorAll('.testimonial-card');
      if (cards[i]) grid.scrollTo({ left: cards[i].offsetLeft - grid.offsetLeft, behavior: 'smooth' });
    });
  });
}

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
