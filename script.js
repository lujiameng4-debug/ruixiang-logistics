document.addEventListener('DOMContentLoaded', () => {

  const copyrightYear = document.getElementById('copyrightYear');
  if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

  // ========== 侧边栏逻辑 ==========
  const sidebar = document.getElementById('sidebar');
  const sidebarTrigger = document.getElementById('sidebar-trigger');
  const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  let isCollapsed = localStorage.getItem('rxSidebarCollapsed') === 'true';
  let collapseTimer = null;
  const isMobile = () => window.innerWidth <= 768;

  function applySidebarState() {
    document.documentElement.classList.remove('sidebar-collapsed-init');
    if (isCollapsed) {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
    } else {
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
    }
  }

  applySidebarState();

  // ========== 折叠侧边栏 tooltip ==========
  const tooltip = document.createElement('div');
  tooltip.className = 'sidebar-tooltip';
  document.body.appendChild(tooltip);

  sidebar.querySelectorAll('.sidebar-link[data-tooltip]').forEach(link => {
    link.addEventListener('mouseenter', (e) => {
      if (!isCollapsed || isMobile()) return;
      const text = link.getAttribute('data-tooltip');
      tooltip.textContent = text;
      const rect = link.getBoundingClientRect();
      tooltip.style.left = (rect.right + 12) + 'px';
      tooltip.style.top = (rect.top + rect.height / 2) + 'px';
      tooltip.style.transform = 'translateY(-50%)';
      tooltip.classList.add('show');
    });
    link.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });
  });

  // 移动端菜单
  if (mobileSidebarToggle) {
    mobileSidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      sidebarOverlay.classList.toggle('active');
      const spans = mobileSidebarToggle.querySelectorAll('span');
      const isOpen = sidebar.classList.contains('mobile-open');
      mobileSidebarToggle.setAttribute('aria-expanded', String(isOpen));
      spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
      spans[1].style.opacity = isOpen ? '0' : '1';
      spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      sidebarOverlay.classList.remove('active');
      const spans = mobileSidebarToggle.querySelectorAll('span');
      mobileSidebarToggle.setAttribute('aria-expanded', 'false');
      spans[0].style.transform = '';
      spans[1].style.opacity = '1';
      spans[2].style.transform = '';
    });
  }

  // 侧边栏链接点击后关闭移动端菜单
  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      if (isMobile()) {
        sidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
        const spans = mobileSidebarToggle.querySelectorAll('span');
        mobileSidebarToggle.setAttribute('aria-expanded', 'false');
        spans[0].style.transform = '';
        spans[1].style.opacity = '1';
        spans[2].style.transform = '';
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !sidebar.classList.contains('mobile-open')) return;
    sidebar.classList.remove('mobile-open');
    sidebarOverlay.classList.remove('active');
    mobileSidebarToggle?.setAttribute('aria-expanded', 'false');
    mobileSidebarToggle?.focus();
    const spans = mobileSidebarToggle?.querySelectorAll('span');
    if (spans?.length === 3) {
      spans[0].style.transform = '';
      spans[1].style.opacity = '1';
      spans[2].style.transform = '';
    }
  });

  // 高亮当前 section 对应的导航链接
  const sections = document.querySelectorAll('section[id], footer[id]');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  const highlightNav = () => {
    let currentId = '';
    const atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50);
    if (atBottom) {
      const lastEl = sections[sections.length - 1];
      if (lastEl) currentId = lastEl.id;
    } else {
      sections.forEach(section => {
        const top = section.getBoundingClientRect().top;
        if (top <= 120) {
          currentId = section.id;
        }
      });
      const partners = document.getElementById('routes');
      if (partners) {
        const bounds = partners.getBoundingClientRect();
        const viewportMiddle = (window.innerHeight + (isMobile() ? 64 : 72)) / 2;
        if (bounds.top <= viewportMiddle && bounds.bottom >= viewportMiddle) currentId = 'routes';
      }
    }
    sidebarLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  function centerPartners(behavior = 'smooth') {
    const partners = document.getElementById('routes');
    if (!partners) return;
    const headerHeight = isMobile() ? 64 : 72;
    const availableHeight = window.innerHeight - headerHeight;
    const topSpace = Math.max(0, (availableHeight - partners.offsetHeight) / 2);
    const targetTop = window.scrollY + partners.getBoundingClientRect().top - headerHeight - topSpace;
    window.scrollTo({ top: targetTop, behavior });
  }

  document.querySelectorAll('a[href="#routes"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      if (window.location.hash !== '#routes') history.pushState(null, '', '#routes');
      centerPartners();
    });
  });

  // ========== 标签页切换（通用） ==========
  document.querySelectorAll('.about-tabs').forEach(tabGroup => {
    const section = tabGroup.closest('.section');
    const tabs = tabGroup.querySelectorAll('.about-tab');
    const panels = section.querySelectorAll('.about-tab-panel');

    panels.forEach(panel => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', 'about-tab-' + panel.id.replace('tab-', ''));
      panel.setAttribute('aria-hidden', String(!panel.classList.contains('active')));
    });

    function activateTab(tab, moveFocus = false) {
      const target = tab.dataset.tab;
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => {
        const active = panel.id === 'tab-' + target;
        panel.classList.toggle('active', active);
        panel.setAttribute('aria-hidden', String(!active));
      });
      if (moveFocus) tab.focus({ preventScroll: true });
      if (target === 'history' && typeof refreshHistoryCarousel === 'function') {
        setTimeout(refreshHistoryCarousel, 10);
        setTimeout(refreshHistoryCarousel, 100);
      }
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', event => {
        const index = Array.from(tabs).indexOf(tab);
        let nextIndex;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        activateTab(tabs[nextIndex], true);
        const next = tabs[nextIndex];
        tabGroup.scrollTo({ left: next.offsetLeft - tabGroup.offsetLeft - 20, behavior: 'smooth' });
      });
    });
  });

  // ========== 跨区域标签页跳转 ==========
  document.querySelectorAll('[data-switch-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      const tabId = link.dataset.switchTab;
      const panel = document.getElementById('tab-' + tabId);
      if (!panel) return;
      const section = panel.closest('.section');
      const tabGroup = section.querySelector('.about-tabs');
      if (!tabGroup) return;
      tabGroup.querySelectorAll('.about-tab').forEach(t => {
        const active = t.dataset.tab === tabId;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      section.querySelectorAll('.about-tab-panel').forEach(p => {
        const active = p === panel;
        p.classList.toggle('active', active);
        p.setAttribute('aria-hidden', String(!active));
      });
      if (tabId === 'history' && typeof refreshHistoryCarousel === 'function') {
        setTimeout(refreshHistoryCarousel, 10);
        setTimeout(refreshHistoryCarousel, 100);
      }
    });
  });

  // ========== 图片子轮播 ==========
  document.querySelectorAll('.img-sub-carousel').forEach(carousel => {
    const slides = carousel.querySelectorAll('.img-sub-slide');
    const dots = carousel.querySelectorAll('.img-sub-dot');
    let idx = 0;

    function showSubSlide(i) {
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add('active');
      dots[idx].classList.add('active');
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        showSubSlide(i);
      });
    });

    let subTimer = setInterval(() => showSubSlide(idx + 1), 4000);
    carousel.addEventListener('mouseenter', () => clearInterval(subTimer));
    carousel.addEventListener('mouseleave', () => {
      subTimer = setInterval(() => showSubSlide(idx + 1), 4000);
    });
  });

  // ========== 车队轮播 ==========
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fleetSlides = document.querySelectorAll('.fleet-slide');
  const fleetDots = document.querySelectorAll('.fleet-dot');
  const fleetPrev = document.getElementById('fleetPrev');
  const fleetNext = document.getElementById('fleetNext');
  let fleetIdx = 0;

  function showFleetSlide(idx) {
    fleetIdx = (idx + fleetSlides.length) % fleetSlides.length;
    fleetSlides.forEach((slide, index) => {
      const active = index === fleetIdx;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    fleetDots.forEach((dot, index) => {
      const active = index === fleetIdx;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-current', String(active));
    });
  }

  if (fleetPrev && fleetNext) {
    const fleetCarousel = document.getElementById('fleetCarousel');
    fleetPrev.addEventListener('click', () => showFleetSlide(fleetIdx - 1));
    fleetNext.addEventListener('click', () => showFleetSlide(fleetIdx + 1));
    fleetDots.forEach(dot => {
      dot.addEventListener('click', () => showFleetSlide(+dot.dataset.fdot));
    });
    let fleetTouchStartX = 0;
    fleetCarousel.addEventListener('touchstart', event => {
      fleetTouchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    fleetCarousel.addEventListener('touchend', event => {
      const distance = fleetTouchStartX - event.changedTouches[0].clientX;
      if (Math.abs(distance) > 48) showFleetSlide(fleetIdx + (distance > 0 ? 1 : -1));
    }, { passive: true });
    showFleetSlide(fleetIdx);
  }

  // ========== Hero 轮播 ==========
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.carousel-dot');
  const carousel = document.getElementById('heroCarousel');
  const heroSection = document.getElementById('home');
  const TOTAL = slides.length;
  let current = 0;
  let autoTimer = null;
  let heroVisible = true;
  let videoPauseTimer = null;
  const saveData = navigator.connection?.saveData === true;

  function syncHeroVideos(keepIndex = -1) {
    slides.forEach((slide, index) => {
      const video = slide.querySelector('.hero-video');
      if (!video) return;
      if ((index !== current && index !== keepIndex) || reduceMotion || saveData || document.hidden || !heroVisible) {
        video.pause();
        return;
      }
      video.play().catch(() => {
        video.classList.remove('is-playing');
      });
    });
  }

  function preloadNextHeroVideo() {
    if (reduceMotion || saveData) return;
    const nextVideo = slides[(current + 1) % TOTAL]?.querySelector('.hero-video');
    if (nextVideo && nextVideo.preload === 'none') {
      nextVideo.preload = 'auto';
      nextVideo.load();
    }
  }

  slides.forEach(slide => {
    const video = slide.querySelector('.hero-video');
    if (!video) return;
    video.addEventListener('playing', () => video.classList.add('is-playing'));
    video.addEventListener('error', () => video.classList.remove('is-playing'));
  });

  function goTo(idx) {
    const previous = current;
    clearTimeout(videoPauseTimer);
    slides[previous].classList.remove('active');
    current = (idx + TOTAL) % TOTAL;
    slides[current].classList.add('active');
    slides.forEach((slide, index) => {
      const active = index === current;
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === current);
      dot.setAttribute('aria-current', index === current ? 'true' : 'false');
    });
    // 整张幻灯片（视频与文字）一起淡入淡出，旧视频在淡出完成后才暂停。
    syncHeroVideos(previous !== current && !reduceMotion ? previous : -1);
    if (previous !== current && !reduceMotion) {
      videoPauseTimer = setTimeout(() => syncHeroVideos(), 950);
    }
    preloadNextHeroVideo();
  }

  function startAuto() {
    if (reduceMotion || document.hidden || !heroVisible || autoTimer || TOTAL < 2 || heroSection?.matches(':hover') || heroSection?.contains(document.activeElement)) return;
    autoTimer = setInterval(() => goTo(current + 1), 7000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
    startAuto();
  }

  function pauseAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  if (heroSection) {
    heroSection.addEventListener('mouseenter', pauseAuto);
    heroSection.addEventListener('mouseleave', startAuto);
    heroSection.addEventListener('focusin', pauseAuto);
    heroSection.addEventListener('focusout', event => {
      if (!heroSection.contains(event.relatedTarget)) startAuto();
    });
    const heroObserver = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      syncHeroVideos();
      if (heroVisible) startAuto();
      else pauseAuto();
    }, { threshold: 0.15 });
    heroObserver.observe(heroSection);
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => { goTo(parseInt(dot.dataset.dot)); resetAuto(); });
  });

  // 触摸滑动支持
  let touchStartX = 0;
  if (carousel) {
    carousel.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { goTo(diff > 0 ? current + 1 : current - 1); resetAuto(); }
    }, { passive: true });
  }

  goTo(current);
  startAuto();
  document.addEventListener('visibilitychange', () => {
    syncHeroVideos();
    if (document.hidden) pauseAuto();
    else if (!autoTimer) startAuto();
  });

  // ========== 数字递增动画 ==========
  const animateCounters = () => {
    document.querySelectorAll('.stat-number[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      let step = 0;

      const update = () => {
        step++;
        current = Math.min(Math.round(increment * step), target);
        el.textContent = current.toLocaleString();
        if (step < steps) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    });
  };

  // ========== 滚动进入视口动画 ==========
  const fadeEls = document.querySelectorAll(
    '.service-card, .fleet-card, .route-card, .contact-card, .step, .about-feature, .cert-item'
  );
  fadeEls.forEach(el => el.classList.add('fade-in'));

  let countersAnimated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  fadeEls.forEach(el => observer.observe(el));

  const statsSection = document.querySelector('.hero-stats');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !countersAnimated) {
        countersAnimated = true;
        animateCounters();
        statsObserver.disconnect();
      }
    }, { threshold: 0.5 });
    statsObserver.observe(statsSection);
  }

  // ========== 表单提交 ==========
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = '提交成功！我们会尽快联系您';
      btn.style.background = '#10b981';
      btn.style.borderColor = '#10b981';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.disabled = false;
        form.reset();
      }, 3000);
    });
  }

  // ========== 新闻图片轮播 ==========
  const newsSlides = document.querySelectorAll('.news-img-slide');
  const newsDots = document.querySelectorAll('.news-img-dot');
  if (newsSlides.length > 0) {
    let newsIdx = 0;
    const newsCarousel = document.querySelector('.news-img-carousel');
    const newsVideos = [...newsSlides].map(slide => slide.querySelector('video'));
    let newsInView = false;
    const canPlayNews = () => newsInView && !document.hidden && !reduceMotion && !navigator.connection?.saveData;
    function syncNewsVideo() {
      newsVideos.forEach((video, i) => {
        if (!video) return;
        if (i === newsIdx && canPlayNews()) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }
    function showNewsSlide(i) {
      newsSlides.forEach(s => s.classList.remove('active'));
      newsDots.forEach(d => d.classList.remove('active'));
      newsIdx = (i + newsSlides.length) % newsSlides.length;
      newsSlides[newsIdx].classList.add('active');
      newsDots[newsIdx].classList.add('active');
      syncNewsVideo();
    }
    newsDots.forEach((dot, i) => {
      dot.addEventListener('click', () => showNewsSlide(i));
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        newsInView = entries[0].isIntersecting;
        syncNewsVideo();
      }, { threshold: 0.1 }).observe(newsCarousel);
    } else {
      newsInView = true;
      syncNewsVideo();
    }
    document.addEventListener('visibilitychange', syncNewsVideo);
    setInterval(() => {
      if (newsInView && !document.hidden) showNewsSlide(newsIdx + 1);
    }, 6000);
  }

  // ========== 新闻列表固定4条高度 ==========
  const newsList = document.querySelector('.news-list');
  if (newsList) {
    const items = newsList.querySelectorAll('.news-item');
    if (items.length > 4) {
      let h = 0;
      for (let i = 0; i < 4; i++) h += items[i].offsetHeight;
      newsList.style.maxHeight = h + 'px';
      newsList.style.overflowY = 'auto';
    } else if (items.length === 4) {
      newsList.style.overflow = 'hidden';
    }
  }

  // ========== 服务项目卡片：单击切换并固定显示内容 ==========
  document.querySelectorAll('.service-types-grid .service-card').forEach(card => {
    const toggleCard = () => {
      const isShowingDetails = card.classList.contains('is-locked-details') ||
        (!card.classList.contains('is-locked-default') &&
          ((window.matchMedia('(hover: hover)').matches && card.matches(':hover')) || card.matches(':focus-visible')));
      card.classList.toggle('is-locked-default', isShowingDetails);
      card.classList.toggle('is-locked-details', !isShowingDetails);
    };
    card.addEventListener('click', toggleCard);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleCard();
      }
    });
  });

  // ========== 合作伙伴轮播 ==========
  const partnerTrack = document.querySelector('.partner-track');
  if (partnerTrack) {
    const originalItems = Array.from(partnerTrack.children);
    originalItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      partnerTrack.appendChild(clone);
    });
    const gap = parseFloat(getComputedStyle(partnerTrack).columnGap) || 0;
    const cycleDistance = originalItems.reduce((width, item) => width + item.offsetWidth + gap, 0);
    partnerTrack.style.setProperty('--partner-cycle-distance', cycleDistance + 'px');
    partnerTrack.style.setProperty('--partner-cycle-duration', (cycleDistance / 35) + 's');
  }

  // ========== 企业荣誉连续滚动 ==========
  const honorsTrack = document.querySelector('.honors-track');
  if (honorsTrack) {
    const slides = Array.from(honorsTrack.children);
    slides.forEach(slide => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.tabIndex = -1;
      honorsTrack.appendChild(clone);
    });
  }

  const certTrack = document.querySelector('.honors-certs-track');
  if (certTrack) {
    const items = Array.from(certTrack.children);
    items.forEach(s => certTrack.appendChild(s.cloneNode(true)));
  }

  // ========== 底部快速询价 ==========
  const quoteForm = document.getElementById('freightQuoteForm');
  if (quoteForm) {
    const cargoSelect = quoteForm.elements.cargo;
    const cargoWrap = cargoSelect.closest('.quote-select-wrap');
    if (cargoWrap) {
      const cargoTrigger = document.createElement('button');
      cargoTrigger.type = 'button';
      cargoTrigger.id = 'quoteCargoTrigger';
      cargoTrigger.className = 'quote-cargo-trigger';
      cargoTrigger.setAttribute('aria-haspopup', 'listbox');
      cargoTrigger.setAttribute('aria-expanded', 'false');
      cargoTrigger.setAttribute('aria-controls', 'quoteCargoOptions');

      const cargoMenu = document.createElement('div');
      cargoMenu.id = 'quoteCargoOptions';
      cargoMenu.className = 'quote-cargo-menu';
      cargoMenu.setAttribute('role', 'listbox');
      cargoMenu.setAttribute('aria-label', '货物类型');
      cargoMenu.hidden = true;

      const cargoOptions = Array.from(cargoSelect.options).map((item, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'quote-cargo-option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(item.selected));
        option.dataset.value = item.value;
        option.textContent = item.textContent;
        option.addEventListener('click', () => {
          cargoSelect.value = item.value;
          cargoSelect.dispatchEvent(new Event('change', { bubbles: true }));
          syncCargoSelection();
          closeCargoMenu();
          cargoTrigger.focus();
        });
        option.addEventListener('keydown', event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            cargoOptions[(index + (event.key === 'ArrowDown' ? 1 : -1) + cargoOptions.length) % cargoOptions.length].focus();
          } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            cargoOptions[event.key === 'Home' ? 0 : cargoOptions.length - 1].focus();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            closeCargoMenu();
            cargoTrigger.focus();
          } else if (event.key === 'Tab') {
            closeCargoMenu();
          }
        });
        cargoMenu.appendChild(option);
        return option;
      });

      function syncCargoSelection() {
        const selected = cargoOptions.find(option => option.dataset.value === cargoSelect.value);
        cargoTrigger.textContent = selected ? selected.textContent : cargoSelect.options[0].textContent;
        cargoOptions.forEach(option => option.setAttribute('aria-selected', String(option === selected)));
      }
      function closeCargoMenu() {
        cargoMenu.hidden = true;
        cargoWrap.classList.remove('is-open', 'opens-up');
        cargoTrigger.setAttribute('aria-expanded', 'false');
      }
      function openCargoMenu(focusOption = false) {
        const triggerBounds = cargoTrigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - triggerBounds.bottom;
        cargoWrap.classList.toggle('opens-up', spaceBelow < 280 && triggerBounds.top > spaceBelow);
        cargoMenu.hidden = false;
        cargoWrap.classList.add('is-open');
        cargoTrigger.setAttribute('aria-expanded', 'true');
        if (focusOption) {
          const selectedIndex = cargoOptions.findIndex(option => option.dataset.value === cargoSelect.value);
          cargoOptions[Math.max(0, selectedIndex)].focus();
        }
      }

      cargoTrigger.addEventListener('click', () => {
        if (cargoMenu.hidden) openCargoMenu();
        else closeCargoMenu();
      });
      cargoTrigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          openCargoMenu(true);
        } else if (event.key === 'Escape') {
          closeCargoMenu();
        }
      });
      document.addEventListener('pointerdown', event => {
        if (!cargoWrap.contains(event.target)) closeCargoMenu();
      });
      cargoSelect.addEventListener('change', syncCargoSelection);
      cargoWrap.append(cargoTrigger, cargoMenu);
      cargoWrap.classList.add('is-enhanced');
      cargoSelect.hidden = true;
      quoteForm.querySelector('label[for="quoteCargo"]').htmlFor = cargoTrigger.id;
      syncCargoSelection();
    }
    const status = document.getElementById('freightQuoteStatus');
    const submit = quoteForm.querySelector('button[type="submit"]');
    const setStatus = (message, error = false) => {
      status.textContent = message;
      status.classList.toggle('is-error', error);
    };
    quoteForm.addEventListener('submit', async event => {
      event.preventDefault();
      const payload = {
        origin: quoteForm.elements.origin.value.trim(),
        destination: quoteForm.elements.destination.value.trim(),
        tonnes: Number(quoteForm.elements.tonnes.value),
        cargo: quoteForm.elements.cargo.value,
        contact: quoteForm.elements.contact.value.trim(),
        phone: quoteForm.elements.phone.value.trim(),
        notes: quoteForm.elements.notes.value.trim(),
        website: quoteForm.elements.website.value
      };
      if (!payload.origin || !payload.destination || !Number.isFinite(payload.tonnes) || payload.tonnes < 0.1 || payload.tonnes > 5000) {
        setStatus('请填写装车点、卸车点和 0.1–5000 吨之间的货物重量。', true);
        return;
      }
      if (!payload.contact || !/^[+\d\s()-]{6,30}$/.test(payload.phone)) {
        setStatus('请填写联系人和有效的联系电话。', true);
        return;
      }
      const inquiryApiUrl = window.RUIXIANG_INQUIRY_API_URL;
      if (!inquiryApiUrl || window.location.protocol === 'file:') {
        setStatus('在线提交尚未配置，请通过已发布的网站提交，或直接电话、邮件联系。', true);
        return;
      }
      submit.disabled = true;
      setStatus('正在提交运输需求，请稍候…');
      try {
        const response = await fetch(inquiryApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('在线提交服务暂不可用，请稍后重试，或通过电话、邮件联系我们。');
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || '提交暂时失败，请稍后重试。');
        setStatus('提交成功，运输需求已发送给业务团队。我们会根据您留下的联系方式与您沟通。');
        quoteForm.reset();
        if (cargoSelect) cargoSelect.dispatchEvent(new Event('change', { bubbles: true }));
      } catch (error) {
        setStatus(error.message || '提交暂时失败，请稍后重试，或直接电话、邮件联系。', true);
      } finally {
        submit.disabled = false;
      }
    });
  }

});
