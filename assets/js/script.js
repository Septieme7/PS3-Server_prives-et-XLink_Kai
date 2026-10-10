/* =========================================================
   PS3 Revival Guide — Script
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Références ---------- */
  const root          = document.documentElement;
  const themeToggle   = document.getElementById('themeToggle');
  const menuToggle    = document.getElementById('menuToggle');
  const sidebar       = document.getElementById('sidebar');
  const backdrop      = document.getElementById('sidebarBackdrop');
  const scrollTopBtn  = document.getElementById('scrollTop');
  const progressBar   = document.getElementById('scrollProgressBar');
  const toast         = document.getElementById('toast');
  const navLinks      = Array.from(document.querySelectorAll('.nav-link'));
  const sections      = Array.from(document.querySelectorAll('section[id]'));
  const dnsCodes      = Array.from(document.querySelectorAll('code.dns'));

  const THEME_KEY = 'ps3-guide-theme';
  const LANG_KEY  = 'ps3-guide-lang';
  const PREFERS_DARK = window.matchMedia('(prefers-color-scheme: dark)');

  /* =========================================================
     I18N — uniquement les chaînes dynamiques (toast, ARIA, tooltips)
     ========================================================= */
  const I18N = {
    fr: {
      'toast.copied':     'DNS copié : ',
      'toast.error':      'Copie impossible',
      'menu.open':        'Ouvrir le menu',
      'menu.close':       'Fermer le menu',
      'scrollTop.label':  'Remonter en haut de la page',
      'scrollTop.title':  'Remonter',
      'dns.title':        'Cliquer pour copier'
    },
    en: {
      'toast.copied':     'DNS copied: ',
      'toast.error':      'Copy failed',
      'menu.open':        'Open menu',
      'menu.close':       'Close menu',
      'scrollTop.label':  'Scroll back to top',
      'scrollTop.title':  'Back to top',
      'dns.title':        'Click to copy'
    }
  };

  // La langue est lue depuis <html lang="…"> (défini par chaque page HTML)
  function currentLang() {
    const l = root.getAttribute('lang');
    return (l === 'en') ? 'en' : 'fr';
  }
  function t(key) {
    const dict = I18N[currentLang()] || I18N.fr;
    return dict[key] != null ? dict[key] : '';
  }

  // Mémorise la langue de la page courante (pour information)
  (function rememberLang() {
    try { localStorage.setItem(LANG_KEY, currentLang()); } catch (e) { /* ignore */ }
  })();

  /* =========================================================
     1. THÈME (clair / sombre) — partagé entre les 2 pages
     ========================================================= */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#070b14' : '#f3f6fc');
  }
  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function storeTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
  }

  (function initTheme() {
    const stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') applyTheme(stored);
    else applyTheme(PREFERS_DARK.matches ? 'dark' : 'light');
  })();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* =========================================================
     2. MENU MOBILE
     ========================================================= */
  function openSidebar() {
    if (!sidebar || !menuToggle) return;
    sidebar.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', t('menu.close'));
    if (backdrop) {
      backdrop.hidden = false;
      requestAnimationFrame(() => backdrop.classList.add('show'));
    }
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    if (!sidebar || !menuToggle) return;
    sidebar.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', t('menu.open'));
    if (backdrop) {
      backdrop.classList.remove('show');
      setTimeout(() => {
        if (!backdrop.classList.contains('show')) backdrop.hidden = true;
      }, 260);
    }
    document.body.style.overflow = '';
  }
  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? closeSidebar() : openSidebar();
    });
  }
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 1024px)').matches) closeSidebar();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  /* =========================================================
     3. SCROLL (barre de progression + bouton UP)
     ========================================================= */
  let ticking = false;
  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const docH    = document.documentElement.scrollHeight - window.innerHeight;
    const pct     = docH > 0 ? (scrollY / docH) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (scrollTopBtn) {
      if (scrollY > 420) scrollTopBtn.classList.add('visible');
      else               scrollTopBtn.classList.remove('visible');
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     4. NAV ACTIVE (IntersectionObserver)
     ========================================================= */
  if ('IntersectionObserver' in window && sections.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(sec => obs.observe(sec));
  }

  /* =========================================================
     5. COPIE DES DNS
     ========================================================= */
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (err) { reject(err); }
    });
  }

  function handleDnsCopy(el) {
    const text = (el.textContent || '').trim();
    copyText(text).then(() => {
      el.classList.add('copied');
      showToast(t('toast.copied') + text);
      setTimeout(() => el.classList.remove('copied'), 900);
    }).catch(() => showToast(t('toast.error')));
  }

  dnsCodes.forEach(el => {
    el.setAttribute('title', t('dns.title'));
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.addEventListener('click', () => handleDnsCopy(el));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDnsCopy(el);
      }
    });
  });

  /* =========================================================
     6. LIENS INTERNES (scroll doux + focus)
     ========================================================= */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', href);
      target.setAttribute('tabindex', '-1');
      setTimeout(() => target.focus({ preventScroll: true }), 500);
    });
  });

  /* =========================================================
     7. HEADER "SCROLLED"
     ========================================================= */
  const header = document.getElementById('siteHeader');
  if (header) {
    const headerObs = () => {
      if (window.scrollY > 20) header.classList.add('scrolled');
      else                     header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', headerObs, { passive: true });
    headerObs();
  }

  /* =========================================================
     8. IMAGE REBONDISSANTE (DVD-style)
     ========================================================= */
  (function initBouncer() {
    const img = document.getElementById('bouncingImage');
    if (!img) return;

    img.addEventListener('error', () => { img.classList.add('error'); }, { once: true });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) { img.style.display = 'none'; return; }

    let imgW = 90;
    let imgH = 90;
    let sizeReady = false;

    function computeSize() {
      const targetW = window.innerWidth <= 640 ? 60 : 90;
      const ratio = img.naturalWidth ? (img.naturalHeight / img.naturalWidth) : 1;
      imgW = targetW;
      imgH = Math.round(targetW * ratio);
      img.style.width = targetW + 'px';
      img.style.height = imgH + 'px';
      sizeReady = true;
    }

    let x = Math.random() * Math.max(1, window.innerWidth - 200);
    let y = Math.random() * Math.max(1, window.innerHeight - 200);
    const baseSpeed = 1.15;
    let vx = (Math.random() > 0.5 ? 1 : -1) * baseSpeed;
    let vy = (Math.random() > 0.5 ? 1 : -1) * baseSpeed;
    let rotation = 0;
    let scale = 1;
    let lastHitAt = 0;
    let paused = false;

    if (img.complete && img.naturalWidth) {
      computeSize();
    } else {
      img.addEventListener('load', computeSize, { once: true });
      setTimeout(() => { if (!sizeReady) computeSize(); }, 800);
    }

    window.addEventListener('resize', () => {
      computeSize();
      const maxX = window.innerWidth  - imgW;
      const maxY = window.innerHeight - imgH;
      if (x > maxX) x = Math.max(0, maxX);
      if (y > maxY) y = Math.max(0, maxY);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      paused = document.hidden;
      if (!paused) requestAnimationFrame(tick);
    });

    function tick() {
      if (paused) return;

      const maxX = window.innerWidth  - imgW;
      const maxY = window.innerHeight - imgH;

      x += vx;
      y += vy;

      let hit = false;
      if (x <= 0)          { x = 0;    vx =  Math.abs(vx); hit = true; }
      else if (x >= maxX)  { x = maxX; vx = -Math.abs(vx); hit = true; }
      if (y <= 0)          { y = 0;    vy =  Math.abs(vy); hit = true; }
      else if (y >= maxY)  { y = maxY; vy = -Math.abs(vy); hit = true; }

      if (hit) {
        rotation += 18;
        scale = 1.12;
        const now = performance.now();
        if (now - lastHitAt > 80) {
          lastHitAt = now;
          img.classList.add('bounce-hit');
          setTimeout(() => img.classList.remove('bounce-hit'), 280);
        }
      }
      if (scale > 1) scale = Math.max(1, scale - 0.012);

      img.style.transform =
        `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(() => requestAnimationFrame(tick));
  })();

  /* =========================================================
     9. API PUBLIQUE (optionnelle)
     ========================================================= */
  window.PS3Guide = {
    setTheme: (t) => { applyTheme(t); storeTheme(t); },
    getTheme: () => root.getAttribute('data-theme'),
    getLang:  () => currentLang()
  };
})();