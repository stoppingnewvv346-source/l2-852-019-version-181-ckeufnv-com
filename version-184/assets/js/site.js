(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupGlobalSearch() {
    var forms = document.querySelectorAll("[data-global-search]");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q']");
        var value = input ? input.value.trim() : "";
        var url = "./search.html";
        if (value) {
          url += "?q=" + encodeURIComponent(value);
        }
        window.location.href = url;
      });
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var next = Number(dot.getAttribute("data-hero-dot"));
        show(next);
        play();
      });
    });

    hero.addEventListener("mouseenter", function () {
      clearInterval(timer);
    });

    hero.addEventListener("mouseleave", play);
    play();
  }

  function setupFilters() {
    var forms = document.querySelectorAll("[data-filter-form]");
    forms.forEach(function (form) {
      var root = form.closest("section") || document;
      var cards = Array.prototype.slice.call(root.querySelectorAll(".filter-card"));
      var input = form.querySelector("input[name='query']");
      var yearSelect = form.querySelector("select[name='year']");
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";
      if (input && initialQuery) {
        input.value = initialQuery;
      }

      function filter() {
        var query = input ? input.value.trim().toLowerCase() : "";
        var year = yearSelect ? yearSelect.value : "";
        cards.forEach(function (card) {
          var haystack = card.getAttribute("data-search") || "";
          var cardYear = card.getAttribute("data-year") || "";
          var matchedQuery = !query || haystack.indexOf(query) !== -1;
          var matchedYear = !year || cardYear === year;
          card.classList.toggle("is-hidden", !(matchedQuery && matchedYear));
        });
      }

      if (input) {
        input.addEventListener("input", filter);
      }
      if (yearSelect) {
        yearSelect.addEventListener("change", filter);
      }
      filter();
    });
  }

  function setupPlayers() {
    var players = document.querySelectorAll("[data-player]");
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var trigger = player.querySelector("[data-play-trigger]");
      if (!video || !trigger) {
        return;
      }
      var stream = video.getAttribute("data-stream");
      var hlsInstance = null;
      var attached = false;
      var attaching = false;
      var callbacks = [];

      function finishAttach() {
        attached = true;
        attaching = false;
        callbacks.splice(0).forEach(function (callback) {
          callback();
        });
      }

      function attach(callback) {
        if (attached) {
          callback();
          return;
        }
        callbacks.push(callback);
        if (attaching) {
          return;
        }
        attaching = true;
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(stream);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, finishAttach);
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              attaching = false;
            }
          });
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream;
          video.addEventListener("loadedmetadata", finishAttach, { once: true });
          return;
        }
        video.src = stream;
        finishAttach();
      }

      function start() {
        attach(function () {
          var attempt = video.play();
          player.classList.add("is-playing");
          if (attempt && typeof attempt.catch === "function") {
            attempt.catch(function () {
              player.classList.remove("is-playing");
            });
          }
        });
      }

      trigger.addEventListener("click", start);
      video.addEventListener("play", function () {
        player.classList.add("is-playing");
      });
      video.addEventListener("pause", function () {
        if (!video.ended) {
          player.classList.remove("is-playing");
        }
      });
      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    setupMenu();
    setupGlobalSearch();
    setupHero();
    setupFilters();
    setupPlayers();
  });
})();
