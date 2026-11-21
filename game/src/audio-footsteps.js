'use strict';
/* Frost Veil — sound, synthesized with WebAudio only. No audio files, no
   network. Footstep ticks, a pickup blip, an alert sting and an exit
   chime, all built from oscillators. The context is created on the first
   key press or click, so browsers allow it; everything is a no-op when
   audio is unavailable (headless screenshots included). */
window.FV = window.FV || {};

FV.AUDIO = (function buildAudio() {
  var ctx = null;
  var muted = false;
  var master = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, when) {
    if (!ctx || muted) return;
    try {
      var t0 = ctx.currentTime + (when || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.4, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) { /* audio is decoration, never fatal */ }
  }

  function noiseTick(vol, stepN) {
    if (!ctx || muted) return;
    try {
      var len = Math.floor(ctx.sampleRate * 0.05);
      var buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ctx.createBufferSource();
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      /* Alternate feet land at slightly different pitches, so the walk
         sounds like steps instead of a metronome. */
      filter.frequency.value = stepN % 2 === 0 ? 900 : 1100;
      var gain = ctx.createGain();
      gain.gain.value = vol;
      src.buffer = buffer;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start();
    } catch (e) { /* audio is decoration, never fatal */ }
  }

  return {
    unlock: function unlock() {
      var c = ensure();
      if (c && c.state === 'suspended') c.resume().catch(function () {});
    },
    toggleMute: function toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted: function isMuted() { return muted; },
    step: function step(running, stepN) {
      ensure();
      noiseTick(running ? 0.5 : 0.28, stepN || 0);
    },
    suspicion: function suspicion() {
      ensure();
      tone(330, 0.14, 'triangle', 0.35);
      tone(262, 0.2, 'triangle', 0.3, 0.12);
    },
    pickup: function pickup() {
      ensure();
      tone(660, 0.12, 'sine', 0.5);
      tone(990, 0.16, 'sine', 0.45, 0.09);
    },
    alert: function alert() {
      ensure();
      tone(220, 0.22, 'sawtooth', 0.4);
      tone(311, 0.3, 'sawtooth', 0.4, 0.16);
    },
    caught: function caught() {
      ensure();
      tone(196, 0.3, 'sawtooth', 0.45);
      tone(147, 0.5, 'sawtooth', 0.45, 0.22);
    },
    win: function win() {
      ensure();
      tone(523, 0.18, 'sine', 0.5);
      tone(659, 0.18, 'sine', 0.5, 0.14);
      tone(784, 0.18, 'sine', 0.5, 0.28);
      tone(1047, 0.4, 'sine', 0.5, 0.42);
    }
  };
})();
