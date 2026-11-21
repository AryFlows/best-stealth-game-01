'use strict';
/* Frost Veil — guard AI. Four states, one at a time:
   patrol → walk the route, pause and scan at each waypoint.
   investigate → a footstep was heard; walk to the sound, look around.
   chase → the player was spotted; run at the last seen position.
   return → walk back to the nearest waypoint and resume the patrol.
   A guard that reaches the player during a chase catches them. */
window.FV = window.FV || {};

function moveTowardGuard(guard, tx, ty, speed, dt) {
  var dx = tx - guard.x;
  var dy = ty - guard.y;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2) return true;
  dx /= dist;
  dy /= dist;
  guard.facing = Math.atan2(dy, dx);
  var nx = guard.x + dx * speed * dt;
  if (!FV.spotBlocked(nx, guard.y, guard.radius)) guard.x = nx;
  var ny = guard.y + dy * speed * dt;
  if (!FV.spotBlocked(guard.x, ny, guard.radius)) guard.y = ny;
  var left = Math.sqrt((tx - guard.x) * (tx - guard.x) + (ty - guard.y) * (ty - guard.y));
  return left < 6;
}

function scanAround(guard, dt) {
  /* A slow sweep: the guard turns its head while standing still. Each
     guard sweeps at its own speed, so the patrols feel like people. */
  guard.facing += dt * (guard.scanSpeed || 1.1);
}

FV.updateGuard = function updateGuard(guard, dt, ctx) {
  var cfg = FV.CONFIG;
  /* Unstuck: if a guard makes no progress toward its goal for two
     seconds (wedged on a wall corner), it gives up and walks home. */
  if (guard.state === 'investigate' || guard.state === 'chase' || guard.state === 'return') {
    if (guard.lastX === undefined) { guard.lastX = guard.x; guard.lastY = guard.y; guard.stuckTimer = 0; }
    var moved = Math.sqrt((guard.x - guard.lastX) * (guard.x - guard.lastX) + (guard.y - guard.lastY) * (guard.y - guard.lastY));
    if (moved > 4) { guard.lastX = guard.x; guard.lastY = guard.y; guard.stuckTimer = 0; }
    else {
      guard.stuckTimer += dt;
      if (guard.stuckTimer > 2) {
        guard.state = 'return';
        guard.target = null;
        guard.scanTimer = 0;
        guard.stuckTimer = 0;
      }
    }
  }
  if (guard.state === 'patrol') {
    if (guard.pauseTimer > 0) {
      guard.pauseTimer -= dt;
      scanAround(guard, dt);
      return;
    }
    var wp = guard.waypoints[guard.wpIndex];
    var arrived = moveTowardGuard(guard, wp.x, wp.y, cfg.GUARD_PATROL_SPEED, dt);
    if (arrived) {
      guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
      guard.pauseTimer = cfg.GUARD_PAUSE_SECONDS;
    }
    return;
  }
  if (guard.state === 'investigate') {
    if (!guard.target) { guard.state = 'return'; return; }
    if (guard.scanTimer > 0) {
      guard.scanTimer -= dt;
      scanAround(guard, dt);
      if (guard.scanTimer <= 0) guard.state = 'return';
      return;
    }
    var reached = moveTowardGuard(guard, guard.target.x, guard.target.y, cfg.GUARD_INVESTIGATE_SPEED, dt);
    if (reached) guard.scanTimer = cfg.GUARD_SCAN_SECONDS;
    return;
  }
  if (guard.state === 'chase') {
    var goal = guard.lastSeen || { x: ctx.player.x, y: ctx.player.y };
    moveTowardGuard(guard, goal.x, goal.y, cfg.GUARD_CHASE_SPEED, dt);
    var pdx = ctx.player.x - guard.x;
    var pdy = ctx.player.y - guard.y;
    if (Math.sqrt(pdx * pdx + pdy * pdy) < cfg.CATCH_RADIUS) ctx.onCaught(guard);
    return;
  }
  if (guard.state === 'return') {
    var idx = FV.nearestWaypoint(guard, guard.x, guard.y);
    var dest = guard.waypoints[idx];
    var home = moveTowardGuard(guard, dest.x, dest.y, cfg.GUARD_PATROL_SPEED, dt);
    if (home) {
      guard.wpIndex = (idx + 1) % guard.waypoints.length;
      guard.state = 'patrol';
      guard.pauseTimer = 0.5;
    }
  }
};

/* A noise event reaches every guard inside its radius: patrolling guards
   turn to investigate the sound. Chasing guards ignore it. */
FV.hearNoise = function hearNoise(guards, noise) {
  var heard = [];
  for (var i = 0; i < guards.length; i++) {
    var g = guards[i];
    if (g.state === 'chase') continue;
    var dx = noise.x - g.x;
    var dy = noise.y - g.y;
    if (Math.sqrt(dx * dx + dy * dy) <= noise.radius) {
      g.state = 'investigate';
      g.target = { x: noise.x, y: noise.y };
      g.scanTimer = 0;
      heard.push(g.name);
    }
  }
  return heard;
};
