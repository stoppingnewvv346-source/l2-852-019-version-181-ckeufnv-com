import { H as Hls } from './hls-vendor.js';

const toggleButton = document.querySelector('[data-mobile-toggle]');
const mobileMenu = document.querySelector('[data-mobile-menu]');

if (toggleButton && mobileMenu) {
  toggleButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}

document.querySelectorAll('[data-hero]').forEach((hero) => {
  const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  const prev = hero.querySelector('[data-hero-prev]');
  const next = hero.querySelector('[data-hero-next]');
  let index = 0;
  let timer = null;

  const show = (nextIndex) => {
    if (!slides.length) {
      return;
    }
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-hidden', slideIndex !== index);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === index);
    });
  };

  const start = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(index + 1), 6000);
  };

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      show(Number(dot.dataset.heroDot || 0));
      start();
    });
  });

  if (prev) {
    prev.addEventListener('click', () => {
      show(index - 1);
      start();
    });
  }

  if (next) {
    next.addEventListener('click', () => {
      show(index + 1);
      start();
    });
  }

  show(0);
  start();
});

document.querySelectorAll('[data-search-scope]').forEach((scope) => {
  const input = scope.querySelector('[data-search-input]');
  const list = scope.querySelector('[data-search-list]');

  if (!input || !list) {
    return;
  }

  input.addEventListener('input', () => {
    const keyword = input.value.trim().toLowerCase();
    const items = list.querySelectorAll('.movie-card, .rank-item');

    items.forEach((item) => {
      const haystack = (item.dataset.title || item.textContent || '').toLowerCase();
      item.classList.toggle('is-filtered', keyword.length > 0 && !haystack.includes(keyword));
    });
  });
});

document.querySelectorAll('[data-player]').forEach((player) => {
  const video = player.querySelector('video');
  const trigger = player.querySelector('[data-play-trigger]');
  const error = player.querySelector('[data-player-error]');
  const stream = player.dataset.stream;
  let loaded = false;
  let hls = null;

  const revealError = () => {
    if (error) {
      error.hidden = false;
    }
  };

  const loadStream = () => {
    if (!video || !stream || loaded) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      loaded = true;
      return;
    }

    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(stream);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data && data.fatal) {
          revealError();
        }
      });
      loaded = true;
      return;
    }

    revealError();
  };

  const playVideo = () => {
    if (!video) {
      return;
    }
    loadStream();
    if (trigger) {
      trigger.hidden = true;
    }
    video.controls = true;
    const request = video.play();
    if (request && typeof request.catch === 'function') {
      request.catch(() => {
        if (trigger) {
          trigger.hidden = false;
        }
      });
    }
  };

  if (trigger) {
    trigger.addEventListener('click', playVideo);
  }

  if (video) {
    video.addEventListener('click', () => {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
      }
    });
    video.addEventListener('error', revealError);
  }

  window.addEventListener('pagehide', () => {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  });
});
