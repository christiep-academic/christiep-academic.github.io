/* ============================================================
   CHRISTIE PANG — main.js
   All interactive behaviours: navigation, loader, zoom,
   theme, text-mode, profile carousel, right-side actions.
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONSTANTS & STATE
  ---------------------------------------------------------- */
  const LOADER_DURATION = 2200; // ms — must cover all 3 page-flips (0.3+0.55*3+0.55 ≈ 2.3s)
  const ZOOM_STEP       = 1;    // px per click
  const ZOOM_MIN        = 12;
  const ZOOM_MAX        = 22;

  let currentPage     = 'home';
  let isNavigating    = false;
  let currentFontSize = 16;
  let isDark          = false;
  let isTextMode      = false;

  /* ----------------------------------------------------------
     DOM REFERENCES
  ---------------------------------------------------------- */
  const loader      = document.getElementById('pageLoader');
  const sideNav     = document.getElementById('sideNav');
  const navToggle   = document.getElementById('navToggle');
  const mainContent = document.getElementById('mainContent');

  const contactGroup = document.getElementById('contactGroup');
  const contactBtn   = document.getElementById('contactBtn');
  const accessGroup  = document.getElementById('accessGroup');
  const accessBtn    = document.getElementById('accessBtn');
  const topBtn       = document.getElementById('topBtn');

  const zoomInBtn   = document.getElementById('zoomInBtn');
  const zoomOutBtn  = document.getElementById('zoomOutBtn');
  const themeBtn    = document.getElementById('themeBtn');
  const themeIcon   = document.getElementById('themeIcon');
  const themeTip    = document.getElementById('themeTip');
  const textImgBtn  = document.getElementById('textImgBtn');
  const textImgTip  = document.getElementById('textImgTip');

  const allNavLinks    = document.querySelectorAll('.nav-link[data-page]');
  const allMobileLinks = document.querySelectorAll('.mobile-nav-link[data-page]');
  const allSections    = document.querySelectorAll('.page-section');

  const scrollProgressBar = document.getElementById('scrollProgress');


  /* ----------------------------------------------------------
     LOADER
  ---------------------------------------------------------- */
  function showLoader() {
    loader.classList.add('active');
    loader.removeAttribute('aria-hidden');
  }

  function hideLoader() {
    loader.classList.remove('active');
    loader.setAttribute('aria-hidden', 'true');
  }

  /* Restart the page-flip CSS animations by cloning the flip wrapper */
  function resetBookAnimation() {
    const wrap = loader.querySelector('.page-flip-wrap');
    if (!wrap) return;
    const clone = wrap.cloneNode(true);
    wrap.parentNode.replaceChild(clone, wrap);
  }

  /* ----------------------------------------------------------
     PAGE NAVIGATION
  ---------------------------------------------------------- */
  function navigateTo(page, skipLoader) {
    if (page === currentPage || isNavigating) return;
    isNavigating = true;

    /* On mobile or when flagged, skip the book animation for snappy tab switching */
    if (skipLoader || window.innerWidth <= 700) {
      switchPage(page);
      isNavigating = false;
      return;
    }

    resetBookAnimation();
    showLoader();

    setTimeout(() => {
      switchPage(page);
      hideLoader();
      isNavigating = false;
    }, LOADER_DURATION);
  }

  function switchPage(page) {
    /* Hide all, show target */
    allSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(page);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'instant' });
      /* Reset progress bar to 0 for new page */
      scrollProgressBar.style.width = '0%';
    }

    /* Update nav active states */
    allNavLinks.forEach(a => {
      const isActive = a.dataset.page === page;
      a.classList.toggle('active', isActive);
      a.toggleAttribute('aria-current', isActive);
    });
    allMobileLinks.forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });

    /* Mark More toggle active when its linked page (younger) is shown */
    const moreToggleEl = document.getElementById('moreToggle');
    if (moreToggleEl) moreToggleEl.classList.toggle('active', page === 'younger');

    currentPage = page;
    updateTopBtn();
  }

  /* ----------------------------------------------------------
     NAV LINK CLICK HANDLERS
  ---------------------------------------------------------- */
  function handleNavClick(e) {
    e.preventDefault();
    const page = this.dataset.page;
    if (page === 'younger') {
      openYmModal();
      return;
    }
    if (page) navigateTo(page);
  }

  allNavLinks.forEach(a => a.addEventListener('click', handleNavClick));
  allMobileLinks.forEach(a => a.addEventListener('click', handleNavClick));
  document.querySelectorAll('a.inline-nav[data-page]').forEach(a => a.addEventListener('click', handleNavClick));

  /* Home-page internal nav triggers (e.g. "Publications →") */
  document.querySelectorAll('.nav-trigger').forEach(a => {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      const page = this.dataset.page;
      if (page) navigateTo(page);
    });
  });

  /* ----------------------------------------------------------
     SIDE NAV TOGGLE
  ---------------------------------------------------------- */
  navToggle.addEventListener('click', () => {
    const expanded = sideNav.classList.toggle('expanded');
    navToggle.setAttribute('aria-expanded', String(expanded));
  });

  /* Collapse nav when clicking outside on mobile */
  document.addEventListener('click', e => {
    if (sideNav.classList.contains('expanded') &&
        !sideNav.contains(e.target) &&
        window.innerWidth <= 900) {
      sideNav.classList.remove('expanded');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ----------------------------------------------------------
     RIGHT PANEL — ACTION GROUPS
  ---------------------------------------------------------- */
  function openGroup(group, btn) {
    group.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }

  function closeGroup(group, btn) {
    group.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }

  function toggleGroup(group, btn, otherGroup, otherBtn) {
    if (group.classList.contains('open')) {
      closeGroup(group, btn);
    } else {
      closeGroup(otherGroup, otherBtn); // close sibling first
      openGroup(group, btn);
    }
  }

  contactBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleGroup(contactGroup, contactBtn, accessGroup, accessBtn);
  });

  accessBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleGroup(accessGroup, accessBtn, contactGroup, contactBtn);
  });

  /* Close menus when clicking anywhere else */
  document.addEventListener('click', (e) => {
    if (!contactGroup.contains(e.target)) closeGroup(contactGroup, contactBtn);
    if (!accessGroup.contains(e.target))  closeGroup(accessGroup, accessBtn);
  });

  /* Keyboard: close on Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeGroup(contactGroup, contactBtn);
      closeGroup(accessGroup, accessBtn);
      closeMorePanel();
    }
  });

  /* ----------------------------------------------------------
     MORE PANEL (mobile ≤700px)
  ---------------------------------------------------------- */
  const morePanel    = document.getElementById('morePanel');
  const moreToggle   = document.getElementById('moreToggle');
  const moreBackdrop = document.getElementById('moreBackdrop');

  function openMorePanel() {
    morePanel.classList.add('open');
    moreBackdrop.classList.add('open');
    moreToggle.setAttribute('aria-expanded', 'true');
    morePanel.setAttribute('aria-hidden', 'false');
  }

  function closeMorePanel() {
    if (!morePanel) return;
    morePanel.classList.remove('open');
    moreBackdrop.classList.remove('open');
    moreToggle.setAttribute('aria-expanded', 'false');
    morePanel.setAttribute('aria-hidden', 'true');
  }

  if (moreToggle) {
    moreToggle.addEventListener('click', () => {
      morePanel.classList.contains('open') ? closeMorePanel() : openMorePanel();
    });
  }

  if (moreBackdrop) {
    moreBackdrop.addEventListener('click', closeMorePanel);
  }

  /* Younger Me link inside panel → close panel then navigate */
  document.querySelectorAll('.more-page-link').forEach(link => {
    link.addEventListener('click', closeMorePanel);
  });

  /* Accessibility passthroughs */
  const mobileZoomIn  = document.getElementById('mobileZoomIn');
  const mobileZoomOut = document.getElementById('mobileZoomOut');
  const mobileThemeBtn  = document.getElementById('mobileTheme');
  const mobileThemeIcon = document.getElementById('mobileThemeIcon');
  const mobileThemeTip  = document.getElementById('mobileThemeTip');
  const mobileTextBtn   = document.getElementById('mobileTextImg');
  const mobileTextTip   = document.getElementById('mobileTextTip');
  const mobileTopBtn    = document.getElementById('mobileTopBtn');

  if (mobileZoomIn)  mobileZoomIn.addEventListener('click',  () => zoomInBtn.click());
  if (mobileZoomOut) mobileZoomOut.addEventListener('click', () => zoomOutBtn.click());

  if (mobileThemeBtn) {
    /* Sync initial state */
    if (isDark) {
      mobileThemeIcon.src = 'Icon/light.png';
      mobileThemeTip.textContent = 'Light';
    }
    mobileThemeBtn.addEventListener('click', () => {
      themeBtn.click();
      const nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
      mobileThemeIcon.src = nowDark ? 'Icon/light.png' : 'Icon/dark.png';
      mobileThemeTip.textContent = nowDark ? 'Light' : 'Dark';
    });
  }

  if (mobileTextBtn) {
    mobileTextBtn.addEventListener('click', () => {
      textImgBtn.click();
      mobileTextTip.textContent =
        document.body.classList.contains('text-only-mode') ? 'Show Images' : 'Text Mode';
    });
  }

  if (mobileTopBtn) {
    mobileTopBtn.addEventListener('click', () => {
      closeMorePanel();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     BACK TO TOP
  ---------------------------------------------------------- */
  function updateTopBtn() {
    const visible = window.scrollY > 300;
    topBtn.classList.toggle('visible', visible);
  }

  window.addEventListener('scroll', updateTopBtn, { passive: true });

  topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ----------------------------------------------------------
     ZOOM IN / OUT
  ---------------------------------------------------------- */
  function applyFontSize() {
    /* Use CSS zoom so all px-based sizes scale uniformly */
    mainContent.style.zoom = (currentFontSize / 16).toFixed(3);
  }

  zoomInBtn.addEventListener('click', () => {
    if (currentFontSize < ZOOM_MAX) { currentFontSize += ZOOM_STEP; applyFontSize(); }
  });

  zoomOutBtn.addEventListener('click', () => {
    if (currentFontSize > ZOOM_MIN) { currentFontSize -= ZOOM_STEP; applyFontSize(); }
  });

  /* ----------------------------------------------------------
     DARK / LIGHT MODE
  ---------------------------------------------------------- */
  /* data-theme already set by inline <head> script — sync JS state */
  isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    themeIcon.src = 'Icon/light.png';
    themeIcon.alt = 'Light Mode';
    themeTip.textContent = 'Light Mode';
  }

  themeBtn.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeIcon.src = isDark ? 'Icon/light.png' : 'Icon/dark.png';
    themeIcon.alt = isDark ? 'Light Mode' : 'Dark Mode';
    themeTip.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  });

  /* ----------------------------------------------------------
     TEXT / IMAGE SWITCH
  ---------------------------------------------------------- */
  textImgBtn.addEventListener('click', () => {
    isTextMode = !isTextMode;
    document.body.classList.toggle('text-only-mode', isTextMode);
    textImgTip.textContent = isTextMode ? 'Show Images' : 'Text Mode';
  });


  /* ----------------------------------------------------------
     NEWS FILTER (Latest / All)
  ---------------------------------------------------------- */
  function applyNewsFilter(showLatest) {
    const items = Array.from(document.querySelectorAll('.news-item'));
    items.forEach((item, idx) => {
      item.style.display = (!showLatest || idx < 6) ? '' : 'none';
    });
  }

  document.querySelectorAll('.filter-slash-btn[data-news-filter]').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-slash-btn[data-news-filter]').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      applyNewsFilter(this.dataset.newsFilter === 'latest');
    });
  });

  /* Apply "Latest" (top 6) by default on load */
  applyNewsFilter(true);

  /* ----------------------------------------------------------
     RESEARCH TOPIC FILTER  — scoped to [data-topic] chips only
  ---------------------------------------------------------- */
  document.querySelectorAll('.filter-chip[data-topic]').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.filter-chip[data-topic]').forEach(c => c.classList.remove('active'));
      this.classList.add('active');

      const topic = this.dataset.topic;
      const papersSection = document.getElementById('papers-sec');
      if (!papersSection) return;
      papersSection.querySelectorAll('.paper-item').forEach(item => {
        const match = topic === 'all' || (item.dataset.topic || '').split(' ').includes(topic);
        item.style.display = match ? '' : 'none';
      });
    });
  });

  /* ----------------------------------------------------------
     SERVICE FILTER
  ---------------------------------------------------------- */
  document.querySelectorAll('.filter-chip[data-service-filter]').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.filter-chip[data-service-filter]').forEach(c => c.classList.remove('active'));
      this.classList.add('active');

      const tag = this.dataset.serviceFilter;
      document.querySelectorAll('.service-item[data-service-tag]').forEach(item => {
        const match = tag === 'all' || (item.dataset.serviceTag || '').split(' ').includes(tag);
        item.style.display = match ? '' : 'none';
      });
    });
  });

  /* ----------------------------------------------------------
     RESEARCH HIGHLIGHTS → navigate to Research page
  ---------------------------------------------------------- */
  document.querySelectorAll('.research-card').forEach(card => {
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return; /* let real links work normally */
      navigateTo('research');
    });
  });

  /* "All" badge beside Research Highlights heading → Research page */
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.style.cursor = 'pointer';
    tag.addEventListener('click', function () {
      navigateTo('research');
    });
  });

  /* ----------------------------------------------------------
     STICKY TOC HIGHLIGHT ON SCROLL (About + Research)
  ---------------------------------------------------------- */
  function initSectionToc(sectionEl) {
    if (!sectionEl) return;
    const links = sectionEl.querySelectorAll('.about-toc-link');
    if (!links.length) return;

    const anchorIds = Array.from(links).map(l => l.getAttribute('href').replace('#', ''));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    anchorIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  initSectionToc(document.getElementById('about'));
  initSectionToc(document.getElementById('research'));

  /* ----------------------------------------------------------
     RESEARCH PAGE: smooth scroll for TOC links
     (within same section — browser handles hash anchors)
  ---------------------------------------------------------- */
  document.querySelectorAll('.toc-link, .about-toc-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });

  /* ----------------------------------------------------------
     SCROLL PROGRESS BAR
  ---------------------------------------------------------- */
  function updateScrollProgress() {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  /* ----------------------------------------------------------
     SCROLL-REVEAL FADE-IN
  ---------------------------------------------------------- */
  function initRevealAnimations() {
    /* Respect reduced-motion system preference */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });

    /* Card grids — scale+fade, staggered per card */
    ['.research-grid', '.blog-grid'].forEach(sel => {
      document.querySelectorAll(sel).forEach(grid => {
        Array.from(grid.children).forEach((card, i) => {
          card.classList.add('reveal-card');
          card.style.setProperty('--reveal-delay', `${i * 0.10}s`);
          revealObserver.observe(card);
        });
      });
    });

    /* Row lists — translateY+fade, staggered per row */
    ['.news-list', '.paper-list', '.award-list',
     '.funding-list', '.press-list', '.teaching-list',
     '.service-list', '.about-entries'].forEach(sel => {
      document.querySelectorAll(sel).forEach(list => {
        Array.from(list.children).forEach((row, i) => {
          row.classList.add('reveal');
          row.style.setProperty('--reveal-delay', `${i * 0.08}s`);
          revealObserver.observe(row);
        });
      });
    });

    /* Individual elements — no stagger */
    ['.page-header', '.research-filters', '.about-block',
     '.subsection-title', '.section-heading',
     '.home-greeting', '.home-profile'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
      });
    });
  }
  initRevealAnimations();

  /* ----------------------------------------------------------
     MEDIA LINK (Research → About press-anchor)
  ---------------------------------------------------------- */
  document.querySelectorAll('a.js-media-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo('about', true);
      /* After section becomes visible, scroll to press-anchor */
      setTimeout(() => {
        const anchor = document.getElementById('press-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    });
  });

  /* ----------------------------------------------------------
     YOUNGER ME MODAL
  ---------------------------------------------------------- */
  const ymModal   = document.getElementById('ymModal');
  const ymConfirm = document.getElementById('ymConfirm');
  const ymCancel  = document.getElementById('ymCancel');
  const ymOpenBtn = document.getElementById('youngerOpenBtn');

  function openYmModal() { if (ymModal) ymModal.removeAttribute('hidden'); }
  function closeYmModal() { if (ymModal) ymModal.setAttribute('hidden', ''); }

  if (ymOpenBtn) ymOpenBtn.addEventListener('click', openYmModal);

  if (ymConfirm) ymConfirm.addEventListener('click', () => {
    window.open('https://cpcoding0930.github.io/christiecp_website/work_main.html', '_blank', 'noopener');
    closeYmModal();
  });
  if (ymCancel) ymCancel.addEventListener('click', closeYmModal);
  if (ymModal)  ymModal.addEventListener('click', e => { if (e.target === ymModal) closeYmModal(); });

  /* ----------------------------------------------------------
     INITIAL SETUP
  ---------------------------------------------------------- */
  /* Dismiss entry loader */
  setTimeout(hideLoader, LOADER_DURATION);

  /* Set initial top-btn state */
  updateTopBtn();

  /* Close action menus on any scroll */
  window.addEventListener('scroll', () => {
    closeGroup(contactGroup, contactBtn);
    closeGroup(accessGroup,  accessBtn);
  }, { passive: true });

})();
