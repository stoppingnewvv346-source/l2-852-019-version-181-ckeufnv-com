(function () {
  var body = document.body;
  var toggle = document.querySelector('[data-menu-toggle]');
  if (toggle) {
    toggle.addEventListener('click', function () {
      body.classList.toggle('menu-open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  if (slides.length > 1) {
    var current = 0;
    var showSlide = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    };
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        showSlide(i);
      });
    });
    window.setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  var searchInput = document.querySelector('[data-live-search]');
  var clearButton = document.querySelector('[data-clear-search]');
  var emptyState = document.querySelector('[data-empty-state]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var activeFilter = { name: 'all', value: 'all' };

  var setSearchFromQuery = function () {
    if (!searchInput) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');
    if (query) {
      searchInput.value = query;
    }
  };

  var applyFilter = function () {
    if (!cards.length) {
      return;
    }
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var visible = 0;
    cards.forEach(function (card) {
      var haystack = (card.getAttribute('data-search') || '').toLowerCase();
      var matchesText = !query || haystack.indexOf(query) !== -1;
      var matchesFilter = true;
      if (activeFilter.name !== 'all') {
        var value = card.getAttribute('data-' + activeFilter.name) || '';
        matchesFilter = value.indexOf(activeFilter.value) !== -1;
      }
      var show = matchesText && matchesFilter;
      card.style.display = show ? '' : 'none';
      if (show) {
        visible += 1;
      }
    });
    if (emptyState) {
      emptyState.style.display = visible ? 'none' : 'block';
    }
  };

  setSearchFromQuery();
  if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
  }
  if (clearButton && searchInput) {
    clearButton.addEventListener('click', function () {
      searchInput.value = '';
      activeFilter = { name: 'all', value: 'all' };
      filterButtons.forEach(function (button) {
        button.classList.toggle('is-active', button.getAttribute('data-filter') === 'all');
      });
      applyFilter();
      searchInput.focus();
    });
  }
  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      filterButtons.forEach(function (item) {
        item.classList.remove('is-active');
      });
      button.classList.add('is-active');
      activeFilter = {
        name: button.getAttribute('data-filter') || 'all',
        value: button.getAttribute('data-value') || 'all'
      };
      applyFilter();
    });
  });
  applyFilter();

  var player = document.querySelector('[data-player]');
  if (player) {
    var video = player.querySelector('video');
    var overlay = player.querySelector('[data-play-overlay]');
    var message = player.querySelector('[data-player-message]');
    var stream = video ? video.getAttribute('data-stream') : '';
    var ready = false;
    var hlsInstance = null;

    var showMessage = function (text) {
      if (message) {
        message.textContent = text;
        message.style.display = 'block';
      }
    };

    var prepareVideo = function () {
      if (!video || ready || !stream) {
        return;
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
        ready = true;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showMessage('播放暂不可用');
          }
        });
        ready = true;
        return;
      }
      showMessage('播放暂不可用');
    };

    var startPlayback = function () {
      prepareVideo();
      if (!video) {
        return;
      }
      var playTask = video.play();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      if (playTask && typeof playTask.catch === 'function') {
        playTask.catch(function () {
          if (overlay) {
            overlay.classList.remove('is-hidden');
          }
        });
      }
    };

    if (overlay) {
      overlay.addEventListener('click', startPlayback);
    }
    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          startPlayback();
        }
      });
      video.addEventListener('play', function () {
        if (overlay) {
          overlay.classList.add('is-hidden');
        }
      });
      video.addEventListener('pause', function () {
        if (overlay) {
          overlay.classList.remove('is-hidden');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    }
  }
})();
