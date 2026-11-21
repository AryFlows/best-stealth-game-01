'use strict';
/* Frost Veil — the HUD. Every mechanic reads out in plain text above the
   canvas: the detection state and meter, the intel count, the objective,
   each guard's state, whether the player is in shadow or behind cover,
   and a toast line for events (heard a footstep, intel found, exit open).
   The start, win and caught screens are overlays on the same page. */
window.FV = window.FV || {};

FV.HUD = (function buildHud() {
  function el(id) { return document.getElementById(id); }
  var toastTimer = null;

  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  }

  function guardWord(state) {
    if (state === 'patrol') return 'PATROL';
    if (state === 'investigate') return 'SUSPICIOUS';
    if (state === 'chase') return 'CHASING';
    return 'RETURNING';
  }

  return {
    showToast: function showToast(msg) {
      var t = el('toast');
      if (!t) return;
      t.textContent = msg;
      t.classList.add('show');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
    },
    flashNoise: function flashNoise() {
      var n = el('noise-flash');
      if (!n) return;
      n.classList.add('show');
      setTimeout(function () { n.classList.remove('show'); }, 350);
    },
    showScreen: function showScreen(name) {
      var screens = ['start-screen', 'win-screen', 'caught-screen'];
      for (var i = 0; i < screens.length; i++) {
        var s = el(screens[i]);
        if (s) s.classList.toggle('show', screens[i] === name);
      }
    },
    update: function update(game) {
      var badge = el('state-badge');
      var label = FV.detectionLabel(game.detection);
      if (badge) {
        badge.textContent = label;
        badge.className = 'badge ' + game.detection.state;
      }
      var fill = el('detect-fill');
      if (fill) fill.style.width = Math.round(game.detection.global) + '%';
      var dtext = el('detect-text');
      if (dtext) dtext.textContent = Math.round(game.detection.global) + '%';
      var intel = el('intel-count');
      if (intel) intel.textContent = 'INTEL ' + game.intelGot + '/' + FV.CONFIG.INTEL_TOTAL;
      var obj = el('objective');
      if (obj) {
        obj.textContent = game.intelGot >= FV.CONFIG.INTEL_TOTAL
          ? 'OBJECTIVE: reach the green EXIT — unseen'
          : 'OBJECTIVE: steal ' + (FV.CONFIG.INTEL_TOTAL - game.intelGot) + ' more intel, then reach the EXIT';
      }
      var timer = el('timer');
      if (timer) timer.textContent = fmtTime(game.elapsedMs);
      var cover = el('cover-label');
      if (cover) cover.textContent = FV.COVER.statusLabel(game.player.x, game.player.y, game.player.crouched);
      var list = el('guard-list');
      if (list) {
        var seeing = FV.visibleGuards(game.guards, game.player.x, game.player.y);
        var html = '';
        for (var i = 0; i < game.guards.length; i++) {
          var g = game.guards[i];
          var sees = seeing.indexOf(g.name) >= 0;
          html += '<span class="guard-chip ' + g.state + (sees ? ' seeing' : '') + '">' + g.name + ' · ' + guardWord(g.state) +
            ' · ' + Math.round(g.suspicion) + '%' + (sees ? ' · SEES YOU' : '') + '</span>';
        }
        list.innerHTML = html;
      }
      var seenBy = el('seen-by');
      if (seenBy) {
        var names = FV.visibleGuards(game.guards, game.player.x, game.player.y);
        seenBy.textContent = names.length ? 'SEEN BY: ' + names.join(', ') : '';
        seenBy.style.display = names.length ? '' : 'none';
      }
      var winStats = el('win-stats');
      if (winStats && game.phase === 'won') {
        winStats.textContent = 'Time ' + fmtTime(game.elapsedMs) +
          ' · spotted ' + game.detection.timesSpotted + ' time' + (game.detection.timesSpotted === 1 ? '' : 's') +
          ' · caught ' + game.timesCaught + ' time' + (game.timesCaught === 1 ? '' : 's') +
          (game.detection.timesSpotted === 0 ? ' · NEVER SEEN — ghost run' : '');
      }
      var caughtGuard = el('caught-guard');
      if (caughtGuard && game.phase === 'caught' && game.caughtBy) {
        caughtGuard.textContent = 'Caught by ' + game.caughtBy + '. Press R to slip back in.';
      }
    }
  };
})();
