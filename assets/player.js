import { H as Hls } from './hls-dru42stk.js';

document.querySelectorAll('.js-hls-player').forEach(function (box) {
  var video = box.querySelector('video');
  var overlay = box.querySelector('.player-overlay');
  var message = box.querySelector('.player-message');
  var hls = null;

  if (!video || !overlay) {
    return;
  }

  function setMessage(text) {
    if (message) {
      message.textContent = text || '';
    }
  }

  function attach() {
    var url = video.getAttribute('data-play');
    if (!url || video.getAttribute('data-ready') === '1') {
      return Promise.resolve();
    }

    video.setAttribute('data-ready', '1');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      return Promise.resolve();
    }

    if (Hls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setMessage('视频加载失败，请稍后重试。');
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });
      return Promise.resolve();
    }

    setMessage('视频加载失败，请稍后重试。');
    return Promise.reject(new Error('unsupported'));
  }

  function start(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setMessage('');
    attach().then(function () {
      overlay.classList.add('is-hidden');
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          overlay.classList.remove('is-hidden');
        });
      }
    }).catch(function () {
      overlay.classList.remove('is-hidden');
    });
  }

  overlay.addEventListener('click', start);
  video.addEventListener('click', function () {
    if (video.paused) {
      start();
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
});
