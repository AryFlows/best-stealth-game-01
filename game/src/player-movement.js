'use strict';
/* Frost Veil — the player. WASD or arrows to walk, Shift to run (fast and
   loud), C or Ctrl to crouch (slow and quiet). Movement collides against
   solid tiles with axis separation, so the player slides along walls.
   Every footstep is a noise event guards can hear. */
window.FV = window.FV || {};

FV.createPlayer = function createPlayer() {
  var start = FV.tileCenter(FV.LEVEL.spawn.x, FV.LEVEL.spawn.y);
  return {
    x: start.x,
    y: start.y,
    radius: FV.CONFIG.PLAYER_RADIUS,
    facing: -Math.PI / 2,
    moving: false,
    running: false,
    crouched: false,
    stepTimer: 0,
    stepCount: 0
  };
};

/* The tile the player stands on, for pickups and the exit check. */
FV.playerTile = function playerTile(player) {
  var t = FV.CONFIG.TILE;
  return { x: Math.floor(player.x / t), y: Math.floor(player.y / t) };
};

/* Circle-vs-tile collision: true when this spot overlaps a solid tile. */
FV.spotBlocked = function spotBlocked(px, py, radius) {
  var t = FV.CONFIG.TILE;
  var minCx = Math.floor((px - radius) / t);
  var maxCx = Math.floor((px + radius) / t);
  var minCy = Math.floor((py - radius) / t);
  var maxCy = Math.floor((py + radius) / t);
  for (var cy = minCy; cy <= maxCy; cy++) {
    for (var cx = minCx; cx <= maxCx; cx++) {
      if (!FV.isSolidTile(cx, cy)) continue;
      var nearestX = Math.max(cx * t, Math.min(px, cx * t + t));
      var nearestY = Math.max(cy * t, Math.min(py, cy * t + t));
      var dx = px - nearestX;
      var dy = py - nearestY;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
  }
  return false;
};

/* One frame of movement. `input` is {up,down,left,right,run,crouch}.
   Returns a noise event {x, y, radius} when a footstep lands, else null. */
FV.updatePlayer = function updatePlayer(player, input, dt) {
  var cfg = FV.CONFIG;
  var dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  var dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  player.moving = dx !== 0 || dy !== 0;
  player.running = Boolean(input.run) && player.moving && !input.crouch;
  player.crouched = Boolean(input.crouch);
  if (!player.moving) return null;

  var len = Math.sqrt(dx * dx + dy * dy);
  dx /= len;
  dy /= len;
  var speed = player.running ? cfg.RUN_SPEED : player.crouched ? cfg.CROUCH_SPEED : cfg.WALK_SPEED;
  player.facing = Math.atan2(dy, dx);

  var nx = player.x + dx * speed * dt;
  if (!FV.spotBlocked(nx, player.y, player.radius)) player.x = nx;
  var ny = player.y + dy * speed * dt;
  if (!FV.spotBlocked(player.x, ny, player.radius)) player.y = ny;

  /* Footsteps: running steps are frequent and loud, walking steps are
     quiet, crouched steps barely carry at all. */
  player.stepTimer -= dt * 1000;
  if (player.stepTimer <= 0) {
    player.stepTimer = player.running ? cfg.STEP_RUN_MS : cfg.STEP_WALK_MS;
    player.stepCount++;
    var radius = player.running ? cfg.NOISE_RUN : player.crouched ? cfg.NOISE_CROUCH : cfg.NOISE_WALK;
    return { x: player.x, y: player.y, radius: radius, running: player.running, n: player.stepCount };
  }
  return null;
};
