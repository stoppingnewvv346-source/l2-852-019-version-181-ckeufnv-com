(function () {
  const ready = function (callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  };

  ready(function () {
    const menuButton = document.querySelector('[data-menu-toggle]');
    const mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuButton && mobilePanel) {
      menuButton.addEventListener('click', function () {
        mobilePanel.classList.toggle('is-open');
      });
    }

    const hero = document.querySelector('[data-hero]');
    if (hero) {
      const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
      const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
      const prev = hero.querySelector('[data-hero-prev]');
      const next = hero.querySelector('[data-hero-next]');
      let current = 0;
      let timer = null;

      const showSlide = function (index) {
        if (!slides.length) {
          return;
        }
        current = (index + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle('is-active', slideIndex === current);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle('is-active', dotIndex === current);
        });
      };

      const restart = function () {
        if (timer) {
          window.clearInterval(timer);
        }
        timer = window.setInterval(function () {
          showSlide(current + 1);
        }, 5200);
      };

      dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
          showSlide(index);
          restart();
        });
      });

      if (prev) {
        prev.addEventListener('click', function () {
          showSlide(current - 1);
          restart();
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          showSlide(current + 1);
          restart();
        });
      }

      restart();
    }

    const searchInput = document.querySelector('[data-search-input]');
    const clearButton = document.querySelector('[data-clear-search]');
    const cards = Array.from(document.querySelectorAll('[data-movie-card]'));
    const emptyState = document.querySelector('[data-empty-state]');
    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
    let activeFilter = 'all';

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

    if (searchInput && query) {
      searchInput.value = query;
    }

    const applyFilter = function () {
      if (!cards.length) {
        return;
      }

      const terms = searchInput ? searchInput.value.trim().toLowerCase() : '';
      let shown = 0;

      cards.forEach(function (card) {
        const text = (card.getAttribute('data-search-text') || '').toLowerCase();
        const category = card.getAttribute('data-category') || '';
        const matchText = !terms || text.indexOf(terms) !== -1;
        const matchFilter = activeFilter === 'all' || category === activeFilter;
        const visible = matchText && matchFilter;
        card.hidden = !visible;
        if (visible) {
          shown += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = shown !== 0;
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', applyFilter);
      applyFilter();
    }

    if (clearButton && searchInput) {
      clearButton.addEventListener('click', function () {
        searchInput.value = '';
        activeFilter = 'all';
        filterButtons.forEach(function (button) {
          button.classList.toggle('is-active', button.getAttribute('data-filter') === 'all');
        });
        applyFilter();
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      });
    }

    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeFilter = button.getAttribute('data-filter') || 'all';
        filterButtons.forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        applyFilter();
      });
    });

    const player = document.querySelector('[data-player]');

    if (player) {
      const video = player.querySelector('video');
      const trigger = player.querySelector('[data-player-trigger]');
      let attached = false;
      let hlsInstance = null;

      const startVideo = function () {
        if (!video) {
          return;
        }

        const source = video.getAttribute('data-src');
        if (!source) {
          return;
        }

        player.classList.add('is-playing');

        if (!attached) {
          attached = true;

          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
          } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({ enableWorker: true });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
          } else {
            video.src = source;
          }
        }

        const playResult = video.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(function () {});
        }
      };

      if (trigger) {
        trigger.addEventListener('click', startVideo);
      }

      if (video) {
        video.addEventListener('click', function () {
          if (video.paused) {
            startVideo();
          }
        });

        window.addEventListener('beforeunload', function () {
          if (hlsInstance) {
            hlsInstance.destroy();
          }
        });
      }
    }
  });
})();
