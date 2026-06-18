(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function normalize(value) {
        return (value || "").toString().trim().toLowerCase();
    }

    ready(function () {
        var toggle = document.querySelector("[data-nav-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");

        if (toggle && menu) {
            toggle.addEventListener("click", function () {
                menu.classList.toggle("is-open");
            });
        }

        var hero = document.querySelector("[data-hero]");
        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
            var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
            var previous = hero.querySelector("[data-hero-prev]");
            var next = hero.querySelector("[data-hero-next]");
            var active = 0;
            var timer = null;

            function show(index) {
                if (!slides.length) {
                    return;
                }

                active = (index + slides.length) % slides.length;

                slides.forEach(function (slide, i) {
                    slide.classList.toggle("is-active", i === active);
                });

                dots.forEach(function (dot, i) {
                    dot.classList.toggle("is-active", i === active);
                });
            }

            function move(step) {
                show(active + step);
            }

            function start() {
                stop();
                timer = window.setInterval(function () {
                    move(1);
                }, 5200);
            }

            function stop() {
                if (timer) {
                    window.clearInterval(timer);
                    timer = null;
                }
            }

            dots.forEach(function (dot, i) {
                dot.addEventListener("click", function () {
                    show(i);
                    start();
                });
            });

            if (previous) {
                previous.addEventListener("click", function () {
                    move(-1);
                    start();
                });
            }

            if (next) {
                next.addEventListener("click", function () {
                    move(1);
                    start();
                });
            }

            hero.addEventListener("mouseenter", stop);
            hero.addEventListener("mouseleave", start);
            show(0);
            start();
        }

        var searchInput = document.querySelector("[data-search-input]");
        var genreFilter = document.querySelector("[data-genre-filter]");
        var yearFilter = document.querySelector("[data-year-filter]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
        var empty = document.querySelector("[data-empty-state]");

        if (searchInput && cards.length) {
            var params = new URLSearchParams(window.location.search);
            var initialQuery = params.get("q");

            if (initialQuery) {
                searchInput.value = initialQuery;
            }

            function applyFilters() {
                var query = normalize(searchInput.value);
                var genre = genreFilter ? normalize(genreFilter.value) : "";
                var year = yearFilter ? normalize(yearFilter.value) : "";
                var visible = 0;

                cards.forEach(function (card) {
                    var text = normalize(card.getAttribute("data-search"));
                    var cardGenre = normalize(card.getAttribute("data-genre"));
                    var cardYear = normalize(card.getAttribute("data-year"));
                    var matchQuery = !query || text.indexOf(query) !== -1;
                    var matchGenre = !genre || cardGenre.indexOf(genre) !== -1;
                    var matchYear = !year || cardYear === year;
                    var showCard = matchQuery && matchGenre && matchYear;

                    card.hidden = !showCard;

                    if (showCard) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }

            searchInput.addEventListener("input", applyFilters);

            if (genreFilter) {
                genreFilter.addEventListener("change", applyFilters);
            }

            if (yearFilter) {
                yearFilter.addEventListener("change", applyFilters);
            }

            applyFilters();
        }
    });
})();
