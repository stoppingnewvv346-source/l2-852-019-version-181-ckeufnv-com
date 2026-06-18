(function () {
    var attachedPlayers = new WeakMap();

    function attachStream(video, stream) {
        if (attachedPlayers.has(video)) {
            return;
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = stream;
            attachedPlayers.set(video, true);
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });

            hls.loadSource(stream);
            hls.attachMedia(video);
            attachedPlayers.set(video, hls);
            return;
        }

        video.src = stream;
        attachedPlayers.set(video, true);
    }

    window.bindMoviePlayer = function (stream) {
        var video = document.getElementById("moviePlayer");
        var cover = document.getElementById("playerCover");

        if (!video || !stream) {
            return;
        }

        function begin() {
            attachStream(video, stream);

            if (cover) {
                cover.classList.add("is-hidden");
            }

            video.controls = true;

            var result = video.play();

            if (result && typeof result.catch === "function") {
                result.catch(function () {
                    if (cover) {
                        cover.classList.remove("is-hidden");
                    }
                });
            }
        }

        if (cover) {
            cover.addEventListener("click", begin);
        }

        video.addEventListener("click", function () {
            if (video.paused) {
                begin();
            }
        });

        video.addEventListener("play", function () {
            if (cover) {
                cover.classList.add("is-hidden");
            }
        });
    };
})();
