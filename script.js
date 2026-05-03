/**
 * ARIA CHEN REAL ESTATE — script.js
 * Pure vanilla JS — no dependencies
 */

'use strict';

/* ================================================================
   UTILITY HELPERS
   ================================================================ */

/**
 * RAF-throttled event listener
 */
function onScrollThrottled(callback) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/**
 * Easing function for counter animation
 */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* ================================================================
   1. NAV — GLASSMORPHISM ON SCROLL
   ================================================================ */
function initNav() {
  const nav    = document.getElementById('siteNav');
  const burger = document.querySelector('.nav-hamburger');
  const menu   = document.getElementById('mobileMenu');

  if (!nav) return;

  function updateNav() {
    if (window.scrollY > 80) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }

  updateNav();
  onScrollThrottled(updateNav);

  // Hamburger toggle
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
      menu.setAttribute('aria-hidden', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }
}

/* ================================================================
   2. SMOOTH SCROLL FOR ANCHOR LINKS
   ================================================================ */
function initSmoothScroll() {
  const NAV_H = 72;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id     = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_H;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ================================================================
   3. INTERSECTION OBSERVER — SCROLL-TRIGGERED REVEAL
   ================================================================ */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
  );

  items.forEach(el => io.observe(el));
}

/* ================================================================
   4. COUNTER ANIMATION — HERO STATS
   ================================================================ */
function initCounters() {
  const counters = document.querySelectorAll('.stat__number[data-target]');
  if (!counters.length) return;

  let animated = false;
  const DURATION = 1800;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const start  = performance.now();

    function frame(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      const value    = Math.round(easeOutExpo(progress) * target);
      el.textContent = prefix + value + suffix;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = prefix + target + suffix;
      }
    }
    requestAnimationFrame(frame);
  }

  const heroStats = document.querySelector('.hero__stats');
  if (!heroStats) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counters.forEach(c => animateCounter(c));
        io.disconnect();
      }
    });
  }, { threshold: 0.4 });

  io.observe(heroStats);
}

/* ================================================================
   5. PROPERTY SEARCH — FOCUS EFFECT & FILTER PILLS
   ================================================================ */
function initSearch() {
  const input = document.getElementById('propertySearch');
  const bar   = input?.closest('.search-bar');

  // Pills
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('pill--active'));
      pill.classList.add('pill--active');
    });
  });
}

/* ================================================================
   6. COMMUNITY CARDS — HORIZONTAL SCROLL + DOTS
   ================================================================ */
function initCommunities() {
  const wrap  = document.querySelector('.communities__scroll-wrap');
  const track = document.getElementById('communitiesTrack');
  const dots  = document.querySelectorAll('#communityDots .dot');

  if (!wrap || !track || !dots.length) return;

  const cards = track.querySelectorAll('.community-card');

  // Drag-to-scroll
  let isDragging = false, startX = 0, scrollLeft = 0;

  wrap.addEventListener('mousedown', e => {
    isDragging = true;
    startX     = e.pageX - wrap.offsetLeft;
    scrollLeft = wrap.scrollLeft;
    wrap.classList.add('is-dragging');
  });

  wrap.addEventListener('mouseleave', () => {
    isDragging = false;
    wrap.classList.remove('is-dragging');
  });

  wrap.addEventListener('mouseup', () => {
    isDragging = false;
    wrap.classList.remove('is-dragging');
  });

  wrap.addEventListener('mousemove', e => {
    if (!isDragging) return;
    e.preventDefault();
    const x    = e.pageX - wrap.offsetLeft;
    const walk = (x - startX) * 1.5;
    wrap.scrollLeft = scrollLeft - walk;
  });

  // Dot click
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx  = parseInt(dot.dataset.index, 10);
      const card = cards[idx];
      if (!card) return;

      wrap.scrollTo({
        left: card.offsetLeft - parseInt(getComputedStyle(wrap).paddingLeft || '0', 10),
        behavior: 'smooth'
      });

      setActiveDot(idx);
    });
  });

  // Scroll sync dots
  function setActiveDot(idx) {
    dots.forEach((d, i) => d.classList.toggle('dot--active', i === idx));
  }

  wrap.addEventListener('scroll', () => {
    let closest = 0, minDiff = Infinity;
    cards.forEach((card, idx) => {
      const diff = Math.abs(card.offsetLeft - wrap.scrollLeft);
      if (diff < minDiff) { minDiff = diff; closest = idx; }
    });
    setActiveDot(closest);
  }, { passive: true });
}

/* ================================================================
   7. TESTIMONIAL CAROUSEL — AUTO-PLAY
   ================================================================ */
function initTestimonials() {
  const track   = document.getElementById('testimonialTrack');
  const dotBtns = document.querySelectorAll('.carousel-dot');

  if (!track || !dotBtns.length) return;

  const slides  = track.querySelectorAll('.testimonial');
  let current   = 0;
  let timer;

  function goTo(idx) {
    current = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotBtns.forEach((d, i) => d.classList.toggle('dot--active', i === current));
  }

  function startAutoplay() {
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  function stopAutoplay() {
    clearInterval(timer);
  }

  // Dot clicks
  dotBtns.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      goTo(idx);
      startAutoplay();
    });
  });

  // Touch swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      stopAutoplay();
      goTo(current + (diff > 0 ? 1 : -1));
      startAutoplay();
    }
  });

  startAutoplay();
}

/* ================================================================
   8. VALUATION MULTI-STEP FORM
   ================================================================ */
function initValuation() {
  const step1      = document.getElementById('valStep1');
  const step2      = document.getElementById('valStep2');
  const step3      = document.getElementById('valStep3');
  const step4      = document.getElementById('valStep4');
  const btn1       = document.getElementById('valStep1Btn');
  const btn2       = document.getElementById('valStep2Btn');
  const restart    = document.getElementById('valRestart');
  const msgEl      = document.getElementById('valLoadingMsg');
  const fillEl     = document.getElementById('valProgressFill');
  const addrEl     = document.getElementById('valAddress');
  const resultAddr = document.getElementById('valResultAddress');

  if (!step1) return;

  const LOADING_MESSAGES = [
    'Analyzing 847 recent sales in your area...',
    'Calculating price per square foot benchmarks...',
    'Identifying comparable properties within 0.5 km...',
    'Evaluating neighbourhood market velocity...',
    'Reviewing listing-to-sale price ratios...',
    'Applying current demand factors...',
    'Generating your personalized valuation report...',
  ];

  /* --- Inline validation helpers --- */
  function getOrCreateError(inputEl) {
    const field = inputEl.closest('.val-field');
    let err = field.querySelector('.val-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'val-error';
      field.appendChild(err);
    }
    return err;
  }

  function showFieldError(inputEl, message) {
    inputEl.classList.add('is-invalid');
    inputEl.classList.remove('is-valid');
    const err = getOrCreateError(inputEl);
    err.textContent = message;
    err.classList.add('is-visible');
  }

  function clearFieldError(inputEl) {
    inputEl.classList.remove('is-invalid');
    const field = inputEl.closest('.val-field');
    const err = field?.querySelector('.val-error');
    if (err) err.classList.remove('is-visible');
  }

  function markFieldValid(inputEl) {
    inputEl.classList.remove('is-invalid');
    inputEl.classList.add('is-valid');
    const field = inputEl.closest('.val-field');
    const err = field?.querySelector('.val-error');
    if (err) err.classList.remove('is-visible');
  }

  function attachFieldValidation(inputEl, validateFn, errorMsg) {
    inputEl.addEventListener('blur', () => {
      if (!validateFn(inputEl.value)) showFieldError(inputEl, errorMsg);
      else markFieldValid(inputEl);
    });
    inputEl.addEventListener('input', () => {
      if (validateFn(inputEl.value)) markFieldValid(inputEl);
      else clearFieldError(inputEl);
    });
  }

  /* --- Wire up field validators --- */
  attachFieldValidation(
    addrEl,
    v => v.trim().length >= 5,
    'Please enter a valid street address (e.g. 123 Marine Drive, West Vancouver).'
  );

  const nameEl  = document.getElementById('valName');
  const emailEl = document.getElementById('valEmail');
  const phoneEl = document.getElementById('valPhone');

  attachFieldValidation(nameEl,  v => v.trim().length > 1, 'Please enter your full name.');
  attachFieldValidation(emailEl, v => /\S+@\S+\.\S+/.test(v.trim()), 'Please enter a valid email address.');
  attachFieldValidation(phoneEl, v => v.trim().replace(/\D/g, '').length >= 7, 'Please enter a valid phone number.');

  /* --- Step transitions --- */
  function showStep(step) {
    [step1, step2, step3, step4].forEach(s => {
      if (s === step) {
        s.classList.remove('val-step--hidden');
        s.classList.add('val-step--entering');
        setTimeout(() => s.classList.remove('val-step--entering'), 450);
      } else {
        s.classList.add('val-step--hidden');
        s.classList.remove('val-step--entering');
      }
    });
  }

  /* --- Step 1 → 2 --- */
  btn1.addEventListener('click', () => {
    if (addrEl.value.trim().length < 5) {
      showFieldError(addrEl, 'Please enter a valid street address.');
      addrEl.focus();
      return;
    }
    markFieldValid(addrEl);
    showStep(step2);
    setTimeout(() => nameEl.focus(), 50);
  });

  addrEl.addEventListener('keydown', e => { if (e.key === 'Enter') btn1.click(); });

  /* --- Step 2 → 3 → 4 --- */
  btn2.addEventListener('click', () => {
    let hasError = false;

    if (!nameEl.value.trim()) {
      showFieldError(nameEl, 'Please enter your full name.');
      if (!hasError) { nameEl.focus(); hasError = true; }
    } else { markFieldValid(nameEl); }

    if (!/\S+@\S+\.\S+/.test(emailEl.value.trim())) {
      showFieldError(emailEl, 'Please enter a valid email address.');
      if (!hasError) { emailEl.focus(); hasError = true; }
    } else { markFieldValid(emailEl); }

    if (phoneEl.value.trim().replace(/\D/g, '').length < 7) {
      showFieldError(phoneEl, 'Please enter a valid phone number.');
      if (!hasError) { phoneEl.focus(); hasError = true; }
    } else { markFieldValid(phoneEl); }

    if (hasError) return;
    showStep(step3);
    runLoadingSequence();
  });

  function runLoadingSequence() {
    let msgIndex = 0;
    const TOTAL_DURATION = 4200;
    const MSG_INTERVAL   = TOTAL_DURATION / LOADING_MESSAGES.length;
    const startTime = performance.now();

    function updateProgress(now) {
      const elapsed = now - startTime;
      const pct = Math.min((elapsed / TOTAL_DURATION) * 100, 98);
      if (fillEl) fillEl.style.width = pct + '%';
      if (elapsed < TOTAL_DURATION) requestAnimationFrame(updateProgress);
    }
    requestAnimationFrame(updateProgress);

    if (msgEl) {
      msgEl.textContent = LOADING_MESSAGES[0];
      const msgTimer = setInterval(() => {
        msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
        msgEl.style.opacity = '0';
        setTimeout(() => { msgEl.textContent = LOADING_MESSAGES[msgIndex]; msgEl.style.opacity = '1'; }, 200);
      }, MSG_INTERVAL);

      setTimeout(() => {
        clearInterval(msgTimer);
        if (fillEl) fillEl.style.width = '100%';
        setTimeout(() => {
          if (resultAddr) resultAddr.textContent = addrEl.value.trim();
          showStep(step4);
        }, 350);
      }, TOTAL_DURATION);
    }
  }

  /* --- Restart --- */
  if (restart) {
    restart.addEventListener('click', () => {
      [addrEl, nameEl, emailEl, phoneEl].forEach(el => {
        el.value = '';
        el.classList.remove('is-valid', 'is-invalid');
        const field = el.closest('.val-field');
        field?.querySelector('.val-error')?.classList.remove('is-visible');
      });
      if (fillEl) fillEl.style.width = '0%';
      step1.querySelectorAll('.val-step__num').forEach((n, i) => {
        n.classList.remove('active', 'done');
        if (i === 0) n.classList.add('active');
      });
      showStep(step1);
    });
  }
}

/* ================================================================
   9. STICKY MOBILE BAR — SHOW/HIDE LOGIC
   ================================================================ */
function initMobileBar() {
  const bar = document.getElementById('mobileStickyBar');
  if (!bar) return;

  // Only active on mobile
  const mq = window.matchMedia('(max-width: 768px)');

  function update() {
    if (!mq.matches) {
      bar.classList.remove('is-visible');
      return;
    }
    // Show after scrolling past hero
    bar.classList.toggle('is-visible', window.scrollY > 200);
  }

  update();
  onScrollThrottled(update);
  mq.addEventListener('change', update);
}

/* ================================================================
   10. ABOUT — PLAY BUTTON INTERACTION
   ================================================================ */
function initAboutPlay() {
  const playBtns = document.querySelectorAll('.about__play-btn, .about__play-trigger');
  playBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // In a real implementation, this would open a video modal.
      // For the demo, we show a styled alert.
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:9000;
        background:rgba(0,0,0,.88);
        display:flex;align-items:center;justify-content:center;
        backdrop-filter:blur(8px);cursor:pointer;
      `;

      const box = document.createElement('div');
      box.style.cssText = `
        background:#1A2340;border-radius:16px;
        padding:3rem 2.5rem;text-align:center;
        max-width:480px;width:90%;
        border:1px solid rgba(201,169,110,.3);
      `;
      box.innerHTML = `
        <div style="width:72px;height:72px;background:#E8714A;border-radius:50%;
                    display:flex;align-items:center;justify-content:center;
                    margin:0 auto 1.5rem;font-size:1.8rem;">▶</div>
        <h3 style="font-family:'Playfair Display',serif;font-size:1.5rem;
                   color:#fff;margin-bottom:.75rem;">Aria's Story</h3>
        <p style="color:rgba(255,255,255,.6);font-size:.92rem;line-height:1.6;margin-bottom:1.5rem;">
          Video player would load here in production. Connect your video hosting service (YouTube, Vimeo) to bring Aria's story to life.
        </p>
        <button style="background:#E8714A;color:#fff;border:none;padding:.75rem 2rem;
                       border-radius:8px;font-size:.9rem;font-weight:600;
                       cursor:pointer;font-family:sans-serif;">Close</button>
      `;
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      overlay.addEventListener('click', () => document.body.removeChild(overlay));
      box.querySelector('button').addEventListener('click', e => {
        e.stopPropagation();
        document.body.removeChild(overlay);
      });
    });
  });
}

/* ================================================================
   11. SEARCH BAR — FOCUS EFFECT (already in CSS, JS enhancement)
   ================================================================ */
function initSearchFocus() {
  const searchInput = document.getElementById('propertySearch');
  if (!searchInput) return;

  searchInput.addEventListener('focus', () => {
    searchInput.select();
  });

  // Simulate search on submit
  const submitBtn = document.querySelector('.search-submit');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const q = searchInput.value.trim();
      if (q.length < 2) {
        searchInput.focus();
        return;
      }
      // Visual feedback
      submitBtn.textContent = 'Searching...';
      submitBtn.disabled = true;
      setTimeout(() => {
        submitBtn.textContent = 'Search';
        submitBtn.disabled = false;
      }, 1200);
    });
  }
}

/* ================================================================
   12. STAGGERED REVEAL FOR PROPERTY CARDS
   ================================================================ */
function initCardStagger() {
  const cards = document.querySelectorAll('.property-card.reveal');
  cards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.12}s`;
  });

  const soldItems = document.querySelectorAll('.sold-item');
  soldItems.forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.08}s`;
  });
}

/* ================================================================
   13. COMMUNITY TRACK — TOUCH & ACCESSIBILITY
   ================================================================ */
function initCommunityA11y() {
  const cards = document.querySelectorAll('.community-card');
  cards.forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        card.querySelector('.community-card__cta')?.click();
      }
    });
  });
}

/* ================================================================
   14. PASSIVE PARALLAX ON HERO IMAGE (desktop only)
   ================================================================ */
function initHeroParallax() {
  const heroImg = document.querySelector('.hero__img');
  if (!heroImg) return;

  const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
  if (!mq.matches) return;

  onScrollThrottled(() => {
    const scrollY = window.scrollY;
    if (scrollY > window.innerHeight) return;
    heroImg.style.transform = `scale(1) translateY(${scrollY * 0.25}px)`;
  });
}

/* ================================================================
   15. LAZY-LOAD IMAGES — polyfill fallback
   ================================================================ */
function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) return; // native support

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if (!lazyImages.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        io.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => io.observe(img));
}

/* ================================================================
   BOOT — schedule by criticality
   ================================================================ */
const scheduleIdle = window.requestIdleCallback
  ? (cb, opts) => window.requestIdleCallback(cb, opts)
  : cb => setTimeout(cb, 1);

// Critical: must be ready before first user interaction
initNav();
initSmoothScroll();
initCounters();
initHeroParallax();

// Above-fold UX: needs to be ready before user scrolls
scheduleIdle(() => {
  initReveal();
  initCardStagger();
}, { timeout: 500 });

// Below-fold: can wait until browser is idle
scheduleIdle(() => {
  initSearch();
  initCommunities();
  initTestimonials();
  initValuation();
  initMobileBar();
  initAboutPlay();
  initSearchFocus();
  initCommunityA11y();
  initLazyImages();
}, { timeout: 2000 });

console.log('%cAria Chen Real Estate — Site Ready', 'color:#A07850;font-weight:700;font-size:14px;');
