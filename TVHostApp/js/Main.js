/**
 * Object handling all video tag playback features and application remote ccontroller events.
 *
 * @property {Boolean}    paused        - is playback paused
 * @property {Array}    posters        - images to display as video posters
 * @property {Array}    sources        - video array with video urls
 * @property {Number}    currentSrc    - id of the currently playing streem
 * @property {Object}    player        - HTML video tag object
 * @property {Object}    logEl        - HTML object containing logs printed on the screen
 * @property {Object}    tvKey        - object containing key codes of all Tizen TV keys
 */
var Main = (function () {
    'use strict';

    var paused = true;
    var posters = ['img/BUNNY_poster.jpg', 'img/SINTEL_poster.jpg'];
    var sources = ['http://media.w3.org/2010/05/bunny/trailer.mp4', 'http://media.w3.org/2010/05/sintel/trailer.mp4'];
    //var sources = ['video/BUNNY.mp4', 'video/SINTEL.mp4'];
    var currentSource = 0;
    var player = null;
    var logEl = null;
    var tvKey = null;


    /**
     * Creates HTML video tag and adds all event listeners
     */
    function createPlayer() {
        var player = document.createElement('video');

        player.src = sources[0];
        player.poster = posters[0];

        player.addEventListener('loadeddata', function (e) {
            Main.log("Movie loaded.");
        });
        player.addEventListener('loadedmetadata', function (e) {
            Main.log("Meta data loaded.");
        });
        player.addEventListener('timeupdate', function (e) {
            Main.log("Current time: " + player.currentTime);
        });
        player.addEventListener('play', function (e) {
            Main.log("Playback started.");
        });
        player.addEventListener('pause', function (e) {
            Main.log("Playback paused.");
        });
        player.addEventListener('ended', function (e) {
            Main.log("Playback finished.");
        });
        player.addEventListener('click', function (e) {
            if (paused) {
                Main.play();
            } else {
                Main.pause();
            }
        });

        return player;
    }

    /**
     * Display application version
     */
    function displayVersion() {
        var el = document.createElement('div');
        el.id = 'version';
        el.innerHTML = 'ver: ' + tizen.application.getAppInfo().version;
        document.body.appendChild(el);
    }

    // Object's public API
    return {

        displayVersion: displayVersion,

        /**
         * Initialize object with key codes and register playback keys.
         */
        onLoad: function () {
            tvKey = new Common.API.TVKeyValue();

            if (tizen !== undefined) {
                tizen.tvinputdevice.registerKey('1');
                tizen.tvinputdevice.registerKey('2');
                tizen.tvinputdevice.registerKey('MediaFastForward');
                tizen.tvinputdevice.registerKey('MediaPlayPause');
                tizen.tvinputdevice.registerKey('MediaPause');
                tizen.tvinputdevice.registerKey('MediaPlay');
                tizen.tvinputdevice.registerKey('MediaRewind');
                initMS();
            }
        },

        /**
         * Function which print logs on the screen
         * @param {String} msg - text to print on the screen
         */
        log: function (msg) {
            var logsEl = document.getElementById('logs');

            if (msg) {
                // Update logs
                console.log('[MultiScreenHTML5Video]: ', msg);
                logsEl.innerHTML += msg + '<br />';
            } else {
                // Clear logs
                logsEl.innerHTML = '';
            }

            logsEl.scrollTop = logsEl.scrollHeight;
        },

        /**
         * Stop the player when application is closed.
         */
        onUnload: function () {
            player.pause();
            player.currentTime = 0;
        },


        swapSource: function(newSrc) {
            sources[0] = newSrc;
            currentSource = sources.length - 1;
            this.changeSource();
        },

        /**
         * Choose next source video and poster
         */
        changeSource: function () {
            currentSource += 1;

            // Last source reached, go to the first one
            if (currentSource >= sources.length) {
                currentSource = 0;
            }

            if (!player) {
                player = createPlayer();
                document.querySelector('.left').appendChild(player);
            }

            player.poster = posters[currentSource];
            player.src = sources[currentSource];
        },

        /**
         * Function to start video playback.
         * Create video element if it does not exist yet.
         */
        play: function () {
            if (!player) {
                player = createPlayer();
                document.querySelector('.left').appendChild(player);
            }

            player.play();
            paused = false;
        },

        /**
         * Function to pause video playback.
         */
        pause: function () {
            player.pause();
            paused = true;
        },

        /**
         * Key handler for remote keys.
         */
        keyDown: function (event) {
            var keyCode = event.keyCode;
            var tmp = null;
            var seekJump = 5;

            Main.log("Key pressed: " + keyCode);

            switch (keyCode) {
                case tvKey.KEY_RETURN:
                    Main.log("RETURN");
                    tizen.application.getCurrentApplication().hide();
                    break;

                case tvKey.KEY_PLAY:
                    Main.play();
                    break;

                case tvKey.KEY_STOP:
                    player.pause();
                    player.currentTime = 0;
                    break;

                case tvKey.KEY_PLAY_PAUSE:
                case tvKey.KEY_PAUSE:
                    if (paused) {
                        Main.play();
                    } else {
                        Main.pause();
                    }
                    break;

                case tvKey.KEY_VOL_UP:
                case tvKey.KEY_PANEL_VOL_UP:
                    try {
                        player.volume += 0.1;
                    } catch (e) {
                        Main.log("Volume is already at maximum.");
                    }
                    break;

                case tvKey.KEY_VOL_DOWN:
                case tvKey.KEY_PANEL_VOL_DOWN:
                    try {
                        player.volume -= 0.1;
                    } catch (e) {
                        Main.log("Volume is already at minimum.");
                    }
                    break;

                case tvKey.KEY_FF:
                    if (!player.seeking && player.currentTime + seekJump < player.seekable.end(0)) {
                        player.pause();
                        player.currentTime += seekJump;
                        player.play();
                    }
                    break;

                case tvKey.KEY_RW:
                    if (!player.seeking && player.currentTime - seekJump > player.seekable.start(0)) {
                        player.pause();
                        player.currentTime -= seekJump;
                        player.play();
                    }
                    break;

                case tvKey.KEY_1:
                    Main.log("KEY1");
                    Main.changeSource();
                    break;

                case tvKey.KEY_2:
                    Main.log("KEY2");
                    Main.swapSource(event.newSrc);
                    break;

                default:
                    Main.log("Unhandled key: " + keyCode);
                    break;
            }
        }
    };
}());


// Initialise the application
window.onload = function () {
    if (window.tizen === undefined) {
        Main.log('This application needs to be run on Tizen device');
        return;
    }

    Main.displayVersion();
    Main.onLoad();
    document.body.addEventListener('unload', Main.onUnload);
    document.body.addEventListener('keydown', Main.keyDown);
};
