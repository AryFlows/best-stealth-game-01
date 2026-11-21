'use strict';
/* Frost Veil — the game itself. Wires input, the loop, pickups, the exit,
   and the win/caught flow together. Steal all 3 intel, then reach the
   green EXIT without being caught. Break line of sight and the meter
   drains; get caught and the run restarts. */
window.FV = window.FV || {};

FV.GAME = (function buildGame() {
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var problems = FV.validateLevel();
  if (problems.length) console.warn('Frost Veil: level problems:', problems);

  var game = {
    player: FV.createPlayer(),
    guards: FV.createGuards(),
    detection: FV.createDetection(),
    intelGot: 0,
    elapsedMs: 0,
    phase: 'start', // start | playing | won | caught
    paused: false,
    timesCaught: 0,
    caughtBy: null,
    lastNoise: null,
    keys: {}
  };

  var KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'run', ShiftRight: 'run',
    KeyC: 'crouch', ControlLeft: 'crouch', ControlRight: 'crouch'
  };

  function readInput() {
    return {
      up: Boolean(game.keys.up),
      down: Boolean(game.keys.down),
      left: Boolean(game.keys.left),
      right: Boolean(game.keys.right),
      run: Boolean(game.keys.run),
      crouch: Boolean(game.keys.crouch)
    };
  }

  function resetRun() {
    game.player = FV.createPlayer();
    game.guards = FV.createGuards();
    game.detection = FV.createDetection();
    game.intelGot = 0;
    game.elapsedMs = 0;
    game.timesCaught = 0;
    game.caughtBy = null;
    game.lastNoise = null;
    for (var i = 0; i < FV.LEVEL.intel.length; i++) FV.LEVEL.intel[i].taken = false;
  }

  function startGame() {
    resetRun();
    game.phase = 'playing';
    FV.HUD.showScreen(null);
    FV.HUD.showToast('Steal the intel. Reach the exit. Stay unseen.');
  }

  function winGame() {
    game.phase = 'won';
    FV.AUDIO.win();
    FV.HUD.showScreen('win-screen');
    FV.HUD.update(game);
  }

  function caughtBy(guard) {
    if (game.phase !== 'playing') return;
    game.phase = 'caught';
    game.timesCaught++;
    game.caughtBy = guard.name;
    FV.AUDIO.caught();
    FV.HUD.showScreen('caught-screen');
    FV.HUD.update(game);
  }

  function checkPickups() {
    var r = FV.CONFIG.INTEL_PICKUP_RADIUS;
    for (var i = 0; i < FV.LEVEL.intel.length; i++) {
      var p = FV.LEVEL.intel[i];
      if (p.taken) continue;
      var c = FV.tileCenter(p.x, p.y);
      var dx = game.player.x - c.x;
      var dy = game.player.y - c.y;
      if (dx * dx + dy * dy < r * r) {
        p.taken = true;
        game.intelGot++;
        FV.AUDIO.pickup();
        FV.HUD.showToast(game.intelGot >= FV.CONFIG.INTEL_TOTAL
          ? 'All intel stolen — the EXIT is open!'
          : 'Intel recovered ' + game.intelGot + '/' + FV.CONFIG.INTEL_TOTAL);
      }
    }
  }

  function checkExit() {
    if (game.intelGot < FV.CONFIG.INTEL_TOTAL) return;
    var tile = FV.playerTile(game.player);
    if (FV.isExitTile(tile.x, tile.y)) {
      winGame();
    }
  }

  function step(dt) {
    if (game.phase !== 'playing' || game.paused) return;
    game.elapsedMs += dt * 1000;
    var noise = FV.updatePlayer(game.player, readInput(), dt);
    if (noise) {
      game.lastNoise = { x: noise.x, y: noise.y, radius: noise.radius, at: performance.now() };
      FV.AUDIO.step(noise.running, noise.n);
      if (noise.running) FV.HUD.flashNoise();
      var heard = FV.hearNoise(game.guards, noise);
      if (heard.length) FV.HUD.showToast(heard.join(', ') + ' heard something…');
    }
    var wasAlert = game.detection.alert;
    FV.updateDetection(game.detection, game.guards, game.player, dt);
    if (game.detection.alert && !wasAlert) {
      FV.AUDIO.alert();
      FV.HUD.showToast('SPOTTED! Break line of sight!');
    }
    for (var i = 0; i < game.guards.length; i++) {
      FV.updateGuard(game.guards[i], dt, { player: game.player, onCaught: caughtBy });
      if (game.phase !== 'playing') return;
    }
    checkPickups();
    checkExit();
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - (frame.last || now)) / 1000);
    frame.last = now;
    step(dt);
    FV.RENDER.draw(ctx, game);
    FV.HUD.update(game);
    requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', function (e) {
    FV.AUDIO.unlock();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
    if (e.code === 'KeyM') {
      var muted = FV.AUDIO.toggleMute();
      FV.HUD.showToast(muted ? 'Sound off' : 'Sound on');
      return;
    }
    if (e.code === 'KeyR' && (game.phase === 'caught' || game.phase === 'won')) {
      startGame();
      return;
    }
    if (e.code === 'Enter' || e.code === 'Space') {
      if (game.phase === 'start' || game.phase === 'won' || game.phase === 'caught') {
        startGame();
        return;
      }
    }
    var action = KEYMAP[e.code];
    if (action) game.keys[action] = true;
  });
  window.addEventListener('keyup', function (e) {
    var action = KEYMAP[e.code];
    if (action) game.keys[action] = false;
  });
  /* Losing focus must never leave a key stuck down: the player would
     walk straight into a guard's cone while tabbed away. */
  window.addEventListener('blur', function () { game.keys = {}; });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) game.keys = {};
  });
  window.addEventListener('mousedown', function () { FV.AUDIO.unlock(); });
  var startBtn = document.getElementById('start-btn');
  if (startBtn) startBtn.addEventListener('click', function () { FV.AUDIO.unlock(); startGame(); });
  var againBtn = document.getElementById('again-btn');
  if (againBtn) againBtn.addEventListener('click', startGame);
  var retryBtn = document.getElementById('retry-btn');
  if (retryBtn) retryBtn.addEventListener('click', startGame);

  /* A staged scene (for screenshots) poses the game before the first
     frame; otherwise the start screen waits for the player. */
  var staged = FV.applyScene(game);
  if (staged) {
    game.phase = game.phase === 'won' ? 'won' : 'playing';
    FV.HUD.showScreen(game.phase === 'won' ? 'win-screen' : null);
  } else {
    FV.HUD.showScreen('start-screen');
  }
  FV.HUD.update(game);
  requestAnimationFrame(frame);
  return game;
})();
