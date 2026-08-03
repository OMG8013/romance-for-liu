/**
 * Background Music — Global Audio Player (per-page music)
 * Uses local MP3 files from assets/source/.
 * Each page maps to a specific music file; playback position is saved per-file.
 * Auto-injects a floating play/pause button on every page.
 */
(function () {
    'use strict';

    // ---- Page → music file mapping ----
    var PAGE_MUSIC = {
        'pages/love1.html':           '2.mp3',  // 心形文字与鲜花爆炸
        'pages/love2.html':           '3.mp3',  // 爱心粒子
        'pages/love3.html':           '5.mp3',  // I LOVE U 文字雨+爱心
        'pages/love4.html':           '4.mp3',  // 便签墙
        'pages/snow-heart.html':      '6.mp3',  // 雪花爱心破碎
        'pages/py-sticky-heart.html': '4.mp3',  // 便签爱心
        'pages/py-random-heart.html': '6.mp3'   // 随机出现合成爱心
        // 首页及其他未指定页面 → 1.mp3 (default)
    };

    // ---- Detect current page ----
    var inPagesDir = window.location.pathname.indexOf('/pages/') !== -1;
    var filename = window.location.pathname.split('/').pop() || 'index.html';
    var pageKey = inPagesDir ? 'pages/' + filename : filename;
    var musicFile = PAGE_MUSIC[pageKey] || '1.mp3';
    var MUSIC_URL = (inPagesDir ? '../' : '') + 'assets/source/' + musicFile;

    // ---- Storage keys (time is per-music-file) ----
    var STORAGE_KEY_PLAYING = 'romance-bg-playing';
    var STORAGE_KEY_TIME = 'romance-bg-time-' + musicFile;
    var STORAGE_KEY_VOL = 'romance-bg-vol';

    // ---- Create <audio> element ----
    var audio = document.createElement('audio');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = parseFloat(localStorage.getItem(STORAGE_KEY_VOL) || '0.45');
    audio.src = MUSIC_URL;

    // ---- SVG icons ----
    var ICON_PLAY =
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">' +
        '<path d="M8 5v14l11-7z"/>' +
        '</svg>';

    var ICON_PAUSE =
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">' +
        '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' +
        '</svg>';

    var ICON_LOADING =
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">' +
        '<path d="M21 12a9 9 0 1 1-6.219-8.56" stroke-linecap="round"/>' +
        '</svg>';

    // ---- Create button ----
    var btn = document.createElement('button');
    btn.className = 'music-toggle';
    btn.id = 'bg-music-btn';
    btn.setAttribute('aria-label', '播放背景音乐');
    btn.title = '点击开关背景音乐';
    btn.style.display = 'none'; // hidden until DOM ready

    var iconWrap = document.createElement('span');
    iconWrap.className = 'music-icon-wrap';
    iconWrap.innerHTML = ICON_PLAY;
    btn.appendChild(iconWrap);

    var state = 'paused'; // 'paused' | 'playing' | 'loading' | 'pending'

    function setIcon(html) {
        iconWrap.innerHTML = html;
    }

    function updateButton() {
        switch (state) {
            case 'playing':
                btn.classList.add('playing');
                btn.classList.remove('pending');
                setIcon(ICON_PAUSE);
                btn.setAttribute('aria-label', '暂停背景音乐');
                btn.title = '暂停背景音乐';
                break;
            case 'loading':
                btn.classList.add('playing');
                btn.classList.remove('pending');
                setIcon(ICON_LOADING);
                btn.title = '加载中…';
                break;
            case 'pending':
                btn.classList.add('playing', 'pending');
                setIcon(ICON_PLAY);
                btn.setAttribute('aria-label', '点击播放背景音乐');
                btn.title = '点击任意位置或此按钮开始播放';
                break;
            default: // paused
                btn.classList.remove('playing', 'pending');
                setIcon(ICON_PLAY);
                btn.setAttribute('aria-label', '播放背景音乐');
                btn.title = '点击开关背景音乐';
        }
    }

    function saveTime() {
        try {
            localStorage.setItem(STORAGE_KEY_TIME, String(audio.currentTime));
        } catch (e) {}
    }

    function play() {
        state = 'loading';
        updateButton();

        var saved = parseFloat(localStorage.getItem(STORAGE_KEY_TIME) || '0');
        if (saved > 0 && audio.duration && saved < audio.duration) {
            audio.currentTime = saved;
        }

        var p = audio.play();
        if (p && typeof p.then === 'function') {
            p.then(function () {
                state = 'playing';
                updateButton();
                localStorage.setItem(STORAGE_KEY_PLAYING, 'true');
            }).catch(function (err) {
                // Autoplay blocked — wait for user gesture
                state = 'pending';
                updateButton();
                localStorage.setItem(STORAGE_KEY_PLAYING, 'true'); // remember intent
                waitForFirstInteraction();
            });
        } else {
            state = 'playing';
            updateButton();
            localStorage.setItem(STORAGE_KEY_PLAYING, 'true');
        }
    }

    function pause() {
        audio.pause();
        saveTime();
        state = 'paused';
        updateButton();
        localStorage.setItem(STORAGE_KEY_PLAYING, 'false');
    }

    function waitForFirstInteraction() {
        function onInteract(e) {
            // Don't trigger if the user clicked our own button — it handles itself
            if (e.target && e.target.closest && e.target.closest('#bg-music-btn')) return;
            document.removeEventListener('click', onInteract);
            document.removeEventListener('touchstart', onInteract);
            document.removeEventListener('keydown', onInteract);
            play();
        }
        document.addEventListener('click', onInteract);
        document.addEventListener('touchstart', onInteract);
        document.addEventListener('keydown', onInteract);
    }

    // ---- Button click handler ----
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (state === 'playing') {
            pause();
        } else {
            play();
        }
    });

    // ---- Audio events ----
    audio.addEventListener('loadedmetadata', function () {
        // Restore time once metadata is available
        var saved = parseFloat(localStorage.getItem(STORAGE_KEY_TIME) || '0');
        if (saved > 0 && saved < audio.duration) {
            audio.currentTime = saved;
        }
    });

    audio.addEventListener('playing', function () {
        state = 'playing';
        updateButton();
    });

    audio.addEventListener('pause', function () {
        if (state === 'playing') {
            // Paused by system (e.g., tab inactive) — keep state as "playing" intent
            // so it resumes on next interaction
        }
    });

    audio.addEventListener('ended', function () {
        // loop=true should prevent this, but just in case
        audio.currentTime = 0;
        audio.play().catch(function () {});
    });

    audio.addEventListener('error', function () {
        state = 'paused';
        updateButton();
        btn.title = '音乐加载失败，点击重试';
    });

    // ---- Save time periodically ----
    setInterval(function () {
        if (state === 'playing' && !audio.paused) {
            saveTime();
        }
    }, 2000);

    // ---- Save time before page unload (navigation) ----
    window.addEventListener('pagehide', saveTime);
    window.addEventListener('beforeunload', saveTime);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) saveTime();
    });

    // ---- Initialize on DOM ready ----
    function init() {
        document.body.appendChild(audio);
        document.body.appendChild(btn);
        btn.style.display = '';

        // Check if music was playing before navigation
        var wasPlaying = localStorage.getItem(STORAGE_KEY_PLAYING);

        if (wasPlaying === 'true') {
            // Show "playing" visual state immediately
            state = 'pending';
            updateButton();

            // Try to autoplay (may work if browser allows it after prior interaction)
            // Wait a tick for audio metadata to load
            var tryPlay = function () {
                play();
            };

            if (audio.readyState >= 1) {
                tryPlay();
            } else {
                audio.addEventListener('loadedmetadata', tryPlay, { once: true });
                // Fallback: try after 1.5s even if metadata doesn't fire
                setTimeout(function () {
                    if (state === 'pending') tryPlay();
                }, 1500);
            }
        } else {
            state = 'paused';
            updateButton();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
