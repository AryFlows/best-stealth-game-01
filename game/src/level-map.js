'use strict';
/* Frost Veil — the manor level. One hand-drawn map, parsed into a grid.
   Legend: # wall · . floor · C crate (cover, blocks sight and movement) ·
   S shadow floor (dark zone that hides the player) · E exit · P spawn ·
   1/2/3 intel pickups. The map is validated by a flood fill in main.js. */
window.FV = window.FV || {};

FV.LEVEL_MAP = [
  '################################',
  '#..........#.................E.#',
  '#..1.......#...................#',
  '#.......C..#..........SS.......#',
  '#..........#......C...SS.......#',
  '#.........................C....#',
  '#....SS....#..............C....#',
  '#....SS....#...................#',
  '#..........#................2..#',
  '#####.##########.##########.####',
  '#..........#...................#',
  '#...C......#.........C.........#',
  '#...SS.....#....3..............#',
  '#...SS.....#...................#',
  '#..............................#',
  '#..........#...C...........C...#',
  '#..........#............SS.....#',
  '#.C........#............SS.....#',
  '#.P........#...................#',
  '################################'
];

FV.LEVEL = (function buildLevel() {
  var cfg = FV.CONFIG;
  var grid = [];
  var spawn = { x: 2, y: 18 };
  var exit = { x: 29, y: 1 };
  var intel = [];
  for (var r = 0; r < FV.LEVEL_MAP.length; r++) {
    var row = [];
    for (var c = 0; c < FV.LEVEL_MAP[r].length; c++) {
      var ch = FV.LEVEL_MAP[r][c];
      row.push(ch);
      if (ch === 'P') spawn = { x: c, y: r };
      if (ch === 'E') exit = { x: c, y: r };
      if (ch === '1' || ch === '2' || ch === '3') intel.push({ x: c, y: r, id: ch, taken: false });
    }
    grid.push(row);
  }
  return { grid: grid, spawn: spawn, exit: exit, intel: intel };
})();

FV.tileAt = function tileAt(cx, cy) {
  if (cx < 0 || cy < 0 || cx >= FV.CONFIG.COLS || cy >= FV.CONFIG.ROWS) return '#';
  return FV.LEVEL.grid[cy][cx];
};

FV.tileAtPx = function tileAtPx(px, py) {
  return FV.tileAt(Math.floor(px / FV.CONFIG.TILE), Math.floor(py / FV.CONFIG.TILE));
};

FV.isSolidTile = function isSolidTile(cx, cy) {
  var t = FV.tileAt(cx, cy);
  return t === '#' || t === 'C';
};

FV.isShadowTile = function isShadowTile(cx, cy) {
  /* The spawn alcove counts as shadow: the player starts hidden, and a
     guard patrolling the row above cannot spot a player who waits there. */
  var t = FV.tileAt(cx, cy);
  return t === 'S' || t === 'P';
};

FV.isExitTile = function isExitTile(cx, cy) {
  return FV.tileAt(cx, cy) === 'E';
};

FV.tileCenter = function tileCenter(cx, cy) {
  var t = FV.CONFIG.TILE;
  return { x: cx * t + t / 2, y: cy * t + t / 2 };
};

/* Flood fill from the spawn: every intel tile and the exit must be reachable
   on walkable floor, or the level is broken. Returns a list of problems. */
FV.validateLevel = function validateLevel() {
  var cfg = FV.CONFIG;
  var problems = [];
  for (var r = 0; r < cfg.ROWS; r++) {
    if (FV.LEVEL_MAP[r].length !== cfg.COLS) {
      problems.push('row ' + r + ' is ' + FV.LEVEL_MAP[r].length + ' wide, expected ' + cfg.COLS);
    }
  }
  if (FV.LEVEL_MAP.length !== cfg.ROWS) problems.push('map has ' + FV.LEVEL_MAP.length + ' rows, expected ' + cfg.ROWS);
  if (problems.length) return problems;
  var seen = {};
  var queue = [[FV.LEVEL.spawn.x, FV.LEVEL.spawn.y]];
  seen[FV.LEVEL.spawn.x + ',' + FV.LEVEL.spawn.y] = true;
  while (queue.length) {
    var cur = queue.shift();
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < dirs.length; i++) {
      var nx = cur[0] + dirs[i][0];
      var ny = cur[1] + dirs[i][1];
      if (nx < 0 || ny < 0 || nx >= cfg.COLS || ny >= cfg.ROWS) continue;
      if (seen[nx + ',' + ny]) continue;
      if (FV.isSolidTile(nx, ny)) continue;
      seen[nx + ',' + ny] = true;
      queue.push([nx, ny]);
    }
  }
  var targets = FV.LEVEL.intel.map(function (p) { return { x: p.x, y: p.y, what: 'intel ' + p.id }; });
  targets.push({ x: FV.LEVEL.exit.x, y: FV.LEVEL.exit.y, what: 'exit' });
  for (var j = 0; j < targets.length; j++) {
    if (!seen[targets[j].x + ',' + targets[j].y]) problems.push(targets[j].what + ' at ' + targets[j].x + ',' + targets[j].y + ' is unreachable');
  }
  return problems;
};
