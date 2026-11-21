'use strict';
/* Frost Veil — the detection meter. Each guard carries its own suspicion
   from 0 to 100. Being seen fills it — faster up close, slower in shadow
   or crouched, faster while running. Breaking line of sight drains it.
   The highest suspicion is the game's global state: under 25 the player
   is hidden, 25–99 a guard is getting suspicious, at 100 the alarm sounds
   and every guard chases. Lose them and the alarm fades. */
window.FV = window.FV || {};

FV.createDetection = function createDetection() {
  return {
    global: 0,
    alert: false,
    state: 'hidden', // hidden | suspicious | alert
    timesSpotted: 0,
    peak: 0
  };
};

FV.updateDetection = function updateDetection(detection, guards, player, dt) {
  var cfg = FV.CONFIG;
  var conceal = FV.COVER.concealmentAt(player.x, player.y, player.crouched);
  var max = 0;
  for (var i = 0; i < guards.length; i++) {
    var g = guards[i];
    var seen = FV.canGuardSee(g, player.x, player.y);
    if (seen.visible) {
      var closeness = 1 - seen.distance / cfg.VISION_RANGE;
      var rate = (cfg.DETECT_BASE + cfg.DETECT_CLOSE_BONUS * closeness) * conceal;
      if (player.running) rate *= cfg.RUN_FACTOR;
      g.suspicion = Math.min(100, g.suspicion + rate * dt);
      g.lastSeen = { x: player.x, y: player.y };
      g.lastSeenAt = performance.now();
    } else {
      var decay = detection.alert ? cfg.ALERT_DECAY : cfg.DETECT_DECAY;
      g.suspicion = Math.max(0, g.suspicion - decay * dt);
    }
    if (g.suspicion > max) max = g.suspicion;
    /* First crossing into "getting suspicious" earns one warning, so the
       player gets a fair chance to break away before the chase starts. */
    if (g.suspicion >= 55 && !g.warned) {
      g.warned = true;
      FV.AUDIO.suspicion();
      FV.HUD.showToast(g.name + ' is getting suspicious…');
    }
    if (g.suspicion < 25) g.warned = false;
    /* A guard that is sure of what it saw chases; one that only suspects
       investigates the last place it saw the player. */
    if (g.suspicion >= 100 && g.state !== 'chase') {
      g.state = 'chase';
    } else if (g.suspicion >= 55 && g.state === 'patrol' && g.lastSeen) {
      g.state = 'investigate';
      g.target = { x: g.lastSeen.x, y: g.lastSeen.y };
      g.scanTimer = 0;
    }
  }
  detection.global = max;
  if (max > detection.peak) detection.peak = max;
  var wasAlert = detection.alert;
  if (max >= 100) {
    detection.alert = true;
    detection.state = 'alert';
    if (!wasAlert) detection.timesSpotted++;
  } else if (max >= 25) {
    detection.alert = false;
    detection.state = 'suspicious';
  } else {
    detection.alert = false;
    detection.state = 'hidden';
  }
  /* When the alarm fades, chasing guards give up and walk home. */
  if (wasAlert && !detection.alert) {
    for (var j = 0; j < guards.length; j++) {
      if (guards[j].state === 'chase') {
        guards[j].state = 'return';
        guards[j].lastSeen = null;
      }
    }
  }
};

FV.detectionLabel = function detectionLabel(detection) {
  if (detection.state === 'alert') return 'ALERT';
  if (detection.state === 'suspicious') return 'SPOTTED ' + Math.round(detection.global) + '%';
  return 'HIDDEN';
};
