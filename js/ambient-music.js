/**
 * Ambient Music - Web Audio API generated gentle melody
 * No external audio file needed, fully self-contained
 */
(function () {
    'use strict';

    var audioCtx = null;
    var masterGain = null;
    var isPlaying = false;
    var intervalId = null;
    var activeOscillators = [];

    // Chord progression: C - G - Am - F (I - V - vi - IV)
    var chords = [
        { bass: 130.81, notes: [261.63, 329.63, 392.00], melody: 523.25 }, // C: C4 E4 G4, melody C5
        { bass: 196.00, notes: [196.00, 246.94, 392.00], melody: 587.33 }, // G: G3 B3 G4, melody D5
        { bass: 110.00, notes: [220.00, 261.63, 329.63], melody: 440.00 }, // Am: A3 C4 E4, melody A4
        { bass: 174.61, notes: [174.61, 261.63, 349.23], melody: 523.25 }  // F: F3 C4 F4, melody C5
    ];
    var chordIndex = 0;

    function initAudio() {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        audioCtx = new AC();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(audioCtx.destination);
        return true;
    }

    function playNote(freq, startTime, duration, volume) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        // Soft attack and release envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);

        activeOscillators.push(osc);
        osc.onended = function () {
            var idx = activeOscillators.indexOf(osc);
            if (idx > -1) activeOscillators.splice(idx, 1);
        };
    }

    function playChord() {
        if (!audioCtx || !isPlaying) return;

        var chord = chords[chordIndex];
        var now = audioCtx.currentTime;

        // Bass note (soft, long)
        playNote(chord.bass, now, 2.8, 0.12);

        // Chord notes (gentle arpeggio)
        chord.notes.forEach(function (freq, i) {
            playNote(freq, now + 0.1 + i * 0.18, 2.5, 0.08);
        });

        // Melody note (brighter, shorter)
        playNote(chord.melody, now + 0.6, 1.5, 0.06);

        chordIndex = (chordIndex + 1) % chords.length;
    }

    function start() {
        if (isPlaying) return;
        if (!audioCtx) {
            if (!initAudio()) return;
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isPlaying = true;

        // Fade in master gain
        var now = audioCtx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.5, now + 0.8);

        playChord();
        intervalId = setInterval(playChord, 3000);
    }

    function stop() {
        if (!isPlaying) return;
        isPlaying = false;

        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        if (masterGain && audioCtx) {
            var now = audioCtx.currentTime;
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
        }
    }

    // ---- Toggle button ----
    var btn = document.getElementById('music-toggle');
    if (btn) {
        btn.addEventListener('click', function () {
            if (isPlaying) {
                stop();
                btn.classList.remove('playing');
                btn.setAttribute('aria-label', '播放背景音乐');
                localStorage.setItem('romance-music', 'off');
            } else {
                start();
                btn.classList.add('playing');
                btn.setAttribute('aria-label', '暂停背景音乐');
                localStorage.setItem('romance-music', 'on');
            }
        });

        // Restore preference (default: off)
        // Only auto-play if user previously explicitly turned it on
        // Still requires a user gesture, so we check and prepare
        var saved = localStorage.getItem('romance-music');
        if (saved === 'on') {
            // Show "on" state visually, but wait for first interaction to actually start
            // (browsers block autoplay without user gesture)
            btn.classList.add('playing');
            btn.setAttribute('aria-label', '点击播放背景音乐');

            var startOnFirstInteraction = function () {
                start();
                document.removeEventListener('click', startOnFirstInteraction);
                document.removeEventListener('touchstart', startOnFirstInteraction);
                document.removeEventListener('keydown', startOnFirstInteraction);
            };

            // Listen for first user interaction
            document.addEventListener('click', startOnFirstInteraction, { once: true });
            document.addEventListener('touchstart', startOnFirstInteraction, { once: true });
            document.addEventListener('keydown', startOnFirstInteraction, { once: true });
        }
    }
})();
