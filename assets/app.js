(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
      return;
    }
    document.addEventListener('DOMContentLoaded', fn);
  }

  function setupMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) {
      return;
    }
    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function setupLocalFilters() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));
    scopes.forEach(function (scope) {
      var search = scope.querySelector('[data-local-search]');
      var chips = Array.prototype.slice.call(scope.querySelectorAll('[data-category-filter]'));
      var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
      var activeCategory = 'all';

      function apply() {
        var query = search ? search.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var title = (card.getAttribute('data-title') || '').toLowerCase();
          var category = card.getAttribute('data-category') || '';
          var matchesText = !query || title.indexOf(query) !== -1;
          var matchesCategory = activeCategory === 'all' || category === activeCategory;
          card.classList.toggle('hidden-by-filter', !(matchesText && matchesCategory));
        });
      }

      if (search) {
        search.addEventListener('input', apply);
      }

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          activeCategory = chip.getAttribute('data-category-filter') || 'all';
          chips.forEach(function (item) {
            item.classList.toggle('is-active', item === chip);
          });
          apply();
        });
      });
    });
  }

  function setupSearchPage() {
    var results = document.querySelector('[data-search-results]');
    if (!results || !window.MovieCatalog) {
      return;
    }
    var input = document.querySelector('[data-search-input]');
    var title = document.querySelector('[data-search-title]');
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q') || '';

    if (input) {
      input.value = query;
    }

    function card(movie) {
      var text = movie.oneLine || movie.summary || '';
      return [
        '<article class="movie-card movie-card-compact">',
        '<a href="' + movie.url + '" class="movie-cover" aria-label="观看' + escapeHtml(movie.title) + '">',
        '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '<span class="movie-score">' + movie.score + '</span>',
        '<span class="movie-type">' + escapeHtml(movie.type) + '</span>',
        '</a>',
        '<div class="movie-body">',
        '<a class="movie-title" href="' + movie.url + '">' + escapeHtml(movie.title) + '</a>',
        '<p>' + escapeHtml(text) + '</p>',
        '<div class="movie-meta">',
        '<span>' + escapeHtml(movie.year) + '</span>',
        '<span>' + escapeHtml(movie.region) + '</span>',
        '<span>' + escapeHtml(movie.genre) + '</span>',
        '</div>',
        '</div>',
        '</article>'
      ].join('');
    }

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function render(value) {
      var key = String(value || '').trim().toLowerCase();
      var pool = window.MovieCatalog;
      var list = key ? pool.filter(function (movie) {
        return movie.searchText.indexOf(key) !== -1;
      }) : pool.slice(0, 80);
      if (title) {
        title.textContent = key ? '搜索结果' : '推荐影片';
      }
      results.innerHTML = list.slice(0, 240).map(card).join('');
    }

    render(query);
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupLocalFilters();
    setupSearchPage();
  });
})();
