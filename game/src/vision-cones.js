'use strict';
/* Frost Veil — vision cones. A guard sees the player only when three things
   are true: the player is inside the cone's range, inside its angle, and
   in line of sight — walls and crates block the view. The same raycast
   shapes the cone the player sees, so a cone visibly stops at a wall. */
window.FV = window.FV || {};

/* Distance from (x0,y0) along `angle` until a solid tile or `maxDist`. */
FV.raycast = function raycast(x0, y0, angle, maxDist) {
  var step = 6;
  var dx = Math.cos(angle);
  var dy = Math.sin(angle);
  for (var d = step; d <= maxDist; d += step) {
    if (FV.isSolidTile(Math.floor((x0 + dx * d) / FV.CONFIG.TILE), Math.floor((y0 + dy * d) / FV.CONFIG.TILE))) {
      return d;
    }
  }
  return maxDist;
};

/* True when no wall or crate stands between two points. */
FV.hasLineOfSight = function hasLineOfSight(x0, y0, x1, y1) {
  var dx = x1 - x0;
  var dy = y1 - y0;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return true;
  var step = 6;
  for (var d = step; d < dist; d += step) {
    var px = x0 + (dx / dist) * d;
    var py = y0 + (dy / dist) * d;
    if (FV.isSolidTile(Math.floor(px / FV.CONFIG.TILE), Math.floor(py / FV.CONFIG.TILE))) return false;
  }
  return true;
};

function angleDiff(a, b) {
  var d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/* Can this guard see the player right now? Returns {visible, distance}. */
FV.canGuardSee = function canGuardSee(guard, px, py) {
  var cfg = FV.CONFIG;
  var dx = px - guard.x;
  var dy = py - guard.y;
  var dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > cfg.VISION_RANGE) return { visible: false, distance: dist };
  var angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angleTo, guard.facing)) > cfg.VISION_HALF_ANGLE) {
    return { visible: false, distance: dist };
  }
  if (!FV.hasLineOfSight(guard.x, guard.y, px, py)) return { visible: false, distance: dist };
  return { visible: true, distance: dist };
};

/* The guards that can see the player right now, by name — the HUD
   highlights their chips so the player knows exactly who spotted them. */
FV.visibleGuards = function visibleGuards(guards, px, py) {
  var out = [];
  for (var i = 0; i < guards.length; i++) {
    if (FV.canGuardSee(guards[i], px, py).visible) out.push(guards[i].name);
  }
  return out;
};

/* The cone's outline as points, raycast so it hugs walls and crates.
   The renderer fills this polygon. */
FV.conePolygon = function conePolygon(guard) {
  var cfg = FV.CONFIG;
  var points = [{ x: guard.x, y: guard.y }];
  var steps = 16;
  for (var i = 0; i <= steps; i++) {
    var a = guard.facing - cfg.VISION_HALF_ANGLE + (2 * cfg.VISION_HALF_ANGLE * i) / steps;
    var d = FV.raycast(guard.x, guard.y, a, cfg.VISION_RANGE);
    points.push({ x: guard.x + Math.cos(a) * d, y: guard.y + Math.sin(a) * d });
  }
  return points;
};
