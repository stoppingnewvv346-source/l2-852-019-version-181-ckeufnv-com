
(function () {
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };

  const normalize = (value) => (value || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\u3000\-_/|·，。！？、,.!?:;()（）【】\[\]']/g, '');

  const filterItems = (scope, query) => {
    const items = scope.querySelectorAll('[data-filter-item]');
    const q = normalize(query);
    let visible = 0;
    items.forEach((item) => {
      const hay = normalize(item.getAttribute('data-search-text') || item.textContent || '');
      const ok = !q || hay.includes(q);
      item.hidden = !ok;
      if (ok) visible += 1;
    });
    const empty = scope.querySelector('[data-empty-state]');
    if (empty) empty.hidden = visible !== 0;
  };

  const bindSearch = (scope) => {
    const input = scope.querySelector('[data-search-input]');
    const chips = scope.querySelectorAll('[data-search-chip]');
    if (!input) return;
    const setActive = (active) => chips.forEach((chip) => chip.classList.toggle('active', chip === active));
    const apply = (value) => filterItems(scope, value);
    input.addEventListener('input', () => apply(input.value));
    chips.forEach((chip) => chip.addEventListener('click', () => {
      const value = chip.getAttribute('data-value') || '';
      input.value = value;
      setActive(chip);
      apply(value);
    }));
    apply(input.value);
  };

  const bindMobileMenu = () => {
    const btn = document.querySelector('[data-nav-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
      menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
    });
  };

  const bindHeroCarousel = (root) => {
    const cards = Array.from(root.querySelectorAll('[data-hero-slide]'));
    if (cards.length <= 1) return;
    const prev = root.querySelector('[data-hero-prev]');
    const next = root.querySelector('[data-hero-next]');
    const dots = Array.from(root.querySelectorAll('[data-hero-dot]'));
    let index = 0;
    let timer = null;
    const show = (nextIndex) => {
      index = (nextIndex + cards.length) % cards.length;
      cards.forEach((card, i) => card.hidden = i !== index);
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    };
    const play = () => {
      stop();
      timer = window.setInterval(() => show(index + 1), 5200);
    };
    const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
    prev && prev.addEventListener('click', () => { show(index - 1); play(); });
    next && next.addEventListener('click', () => { show(index + 1); play(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); play(); }));
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    show(0);
    play();
  };

  const initPlayer = (root) => {
    const video = root.querySelector('video');
    const overlay = root.querySelector('[data-player-overlay]');
    const btn = root.querySelector('[data-player-start]');
    const src = root.getAttribute('data-m3u8') || '';
    if (!video || !src) return;
    let started = false;
    let hls = null;
    const destroyHls = () => {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
      hls = null;
    };
    const start = async () => {
      if (started) {
        try { await video.play(); } catch (err) {}
        return;
      }
      started = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (window.Hls && window.Hls.isSupported()) {
        destroyHls();
        hls = new window.Hls();
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        video.src = src;
      }
      try {
        await video.play();
        root.classList.add('is-playing');
      } catch (err) {
        root.classList.remove('is-playing');
      }
    };
    if (btn) btn.addEventListener('click', start);
    if (overlay) overlay.addEventListener('click', start);
    video.addEventListener('click', () => { if (!started) start(); });
    video.addEventListener('play', () => root.classList.add('is-playing'));
    video.addEventListener('pause', () => root.classList.remove('is-playing'));
    root._destroyHls = destroyHls;
  };

  ready(() => {
    bindMobileMenu();
    document.querySelectorAll('[data-search-scope]').forEach(bindSearch);
    document.querySelectorAll('[data-hero-carousel]').forEach(bindHeroCarousel);
    document.querySelectorAll('[data-hls-player]').forEach(initPlayer);
  });
})();
