const MOVIES = window.MOVIES || [];
const Hls = window.Hls;
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const $ = (sel, root = document) => root.querySelector(sel);

function debounce(fn, wait = 160) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}

function makePoster(movie, small = false) {
  const cls = small ? 'movie-card small-card' : 'movie-card';
  const title = movie.title || '';
  const cover = movie.cover || '';
  const year = movie.year || '';
  const region = movie.region || '';
  const type = movie.type || '';
  const genre = movie.genre || '';
  const summary = movie.summary || movie.one_line || '';
  return `
    <article class="${cls}" data-title="${escapeHtml(title)}"
      data-region="${escapeHtml(region)}" data-type="${escapeHtml(type)}"
      data-genre="${escapeHtml(genre)}" data-tags="${escapeHtml((movie.tags || []).join(' '))}"
      data-year="${year}" data-bucket="${escapeHtml(movie.bucket || '')}">
      <a href="./${movie.slug}" class="poster-link" aria-label="${escapeHtml(title)}">
        <div class="poster" data-poster>
          <div class="poster-fallback"><span>${escapeHtml(title)}</span></div>
          <img class="poster-img" src="${cover}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">
        </div>
      </a>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(title)}</h3>
        <div class="card-meta">
          <span>${escapeHtml(String(year))}</span>
          <span>·</span>
          <span>${escapeHtml(region || '未知地区')}</span>
          <span>·</span>
          <span>${escapeHtml(type || '影片')}</span>
        </div>
        <p class="card-summary">${escapeHtml(summary)}</p>
        <div class="card-actions">
          <a class="button button-primary" href="./${movie.slug}">立即播放</a>
          <a class="button button-secondary" href="./${movie.slug}#info">详情</a>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function initMobileMenu() {
  const toggle = $('[data-menu-toggle]');
  const panel = $('[data-mobile-panel]');
  if (!toggle || !panel) return;
  toggle.addEventListener('click', () => {
    panel.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(panel.classList.contains('is-open')));
  });
  $$('#mobile-nav a, #mobile-nav button').forEach(node => node.addEventListener('click', () => {
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

function initPosterFallbacks(root = document) {
  $$('.poster', root).forEach(poster => {
    const img = $('.poster-img', poster);
    if (!img) return;
    img.addEventListener('load', () => poster.classList.add('has-image'));
    img.addEventListener('error', () => {
      poster.classList.remove('has-image');
      img.remove();
    }, { once: true });
    if (img.complete && img.naturalWidth > 0) {
      poster.classList.add('has-image');
    }
  });
}

function initHeroCarousel() {
  const root = $('[data-hero-carousel]');
  if (!root) return;
  const slides = $$('.hero-slide', root);
  const dotsWrap = $('[data-carousel-dots]', root);
  const prev = $('[data-carousel-prev]', root);
  const next = $('[data-carousel-next]', root);
  if (slides.length <= 1) return;

  let index = 0;
  const dots = slides.map((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'carousel-dot';
    btn.type = 'button';
    btn.setAttribute('aria-label', `切换到第 ${i + 1} 张`);
    btn.addEventListener('click', () => show(i));
    dotsWrap?.appendChild(btn);
    return btn;
  });

  function show(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
  }

  prev?.addEventListener('click', () => show(index - 1));
  next?.addEventListener('click', () => show(index + 1));
  show(0);

  let timer = window.setInterval(() => show(index + 1), 5200);
  root.addEventListener('mouseenter', () => window.clearInterval(timer));
  root.addEventListener('mouseleave', () => {
    timer = window.setInterval(() => show(index + 1), 5200);
  });
}

function initStaticFilters() {
  const root = $('[data-filter-root]');
  if (!root) return;
  const search = $('[data-filter-input]', root);
  const chips = $$('.filter-chip', root);
  const cards = $$('.movie-card[data-title]', root);
  let activeChip = '';

  function matchCard(card) {
    const hay = [
      card.dataset.title,
      card.dataset.region,
      card.dataset.type,
      card.dataset.genre,
      card.dataset.tags,
      card.dataset.year,
      card.dataset.bucket
    ].join(' ').toLowerCase();
    const q = (search?.value || '').trim().toLowerCase();
    const matchesQuery = !q || hay.includes(q);
    const matchesChip = !activeChip || hay.includes(activeChip.toLowerCase());
    return matchesQuery && matchesChip;
  }

  function apply() {
    let visible = 0;
    cards.forEach(card => {
      const ok = matchCard(card);
      card.hidden = !ok;
      if (ok) visible += 1;
    });
    const counter = $('[data-filter-count]', root);
    if (counter) counter.textContent = String(visible);
  }

  search?.addEventListener('input', debounce(apply, 80));
  chips.forEach(chip => chip.addEventListener('click', () => {
    const value = chip.dataset.filter || '';
    activeChip = activeChip === value ? '' : value;
    chips.forEach(c => c.classList.toggle('is-active', c === chip && activeChip === value));
    if (activeChip !== value) chip.classList.remove('is-active');
    apply();
  }));
  apply();
}

function initSearchPage() {
  const root = $('[data-search-page]');
  if (!root || !MOVIES.length) return;
  const input = $('[data-search-input]', root);
  const results = $('[data-search-results]', root);
  const count = $('[data-search-count]', root);
  const sort = $('[data-search-sort]', root);
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';
  if (input && initialQuery) input.value = initialQuery;

  function rank(movie) {
    const q = (input?.value || '').trim().toLowerCase();
    const hay = [
      movie.title,
      movie.region,
      movie.type,
      movie.genre,
      (movie.tags || []).join(' '),
      movie.summary,
      movie.one_line,
      movie.bucket,
      String(movie.year)
    ].join(' ').toLowerCase();
    if (!q) return movie.score;
    const hit = hay.includes(q) ? 20000 : 0;
    const titleBoost = movie.title.toLowerCase().includes(q) ? 8000 : 0;
    const tagBoost = (movie.tags || []).some(t => String(t).toLowerCase().includes(q)) ? 5000 : 0;
    const yearBoost = String(movie.year).includes(q) ? 3000 : 0;
    return movie.score + hit + titleBoost + tagBoost + yearBoost;
  }

  function render() {
    const q = (input?.value || '').trim().toLowerCase();
    let items = MOVIES.filter(movie => {
      if (!q) return true;
      const hay = [
        movie.title,
        movie.region,
        movie.type,
        movie.genre,
        (movie.tags || []).join(' '),
        movie.summary,
        movie.one_line,
        movie.bucket,
        String(movie.year)
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
    const mode = sort?.value || 'relevance';
    if (mode === 'year') {
      items.sort((a, b) => b.year - a.year || b.score - a.score);
    } else if (mode === 'title') {
      items.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'));
    } else {
      items.sort((a, b) => rank(b) - rank(a));
    }
    count && (count.textContent = String(items.length));
    results.innerHTML = items.slice(0, 120).map(movie => makePoster(movie, true)).join('') || `
      <div class="empty-state">
        <h3>没有找到匹配结果</h3>
        <p>可以换一个片名、地区、类型、年份或标签重新搜索。</p>
      </div>
    `;
    initPosterFallbacks(results);
  }

  input?.addEventListener('input', debounce(render, 80));
  sort?.addEventListener('change', render);
  render();
}

function initPlayer() {
  const player = $('[data-player]');
  if (!player) return;
  const video = $('video[data-hls-src]', player);
  const btn = $('[data-play-button]', player);
  if (!video) return;
  const src = video.dataset.hlsSrc;
  let hls = null;

  const start = () => {
    if (video.readyState >= 2) {
      void video.play().catch(() => {});
    } else {
      video.play().catch(() => {});
    }
  };

  if (src) {
    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) {
          console.warn('HLS error', data);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }

  btn?.addEventListener('click', start);
  video.addEventListener('click', start);
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeroCarousel();
  initStaticFilters();
  initSearchPage();
  initPlayer();
  initPosterFallbacks();
});
