'use strict';
/* Frost Veil — patrol routes. Four guards walk the manor in loops, pausing
   at each waypoint to scan the room. Waypoints are tile coordinates; every
   leg between two consecutive waypoints is open floor, so a guard never
   walks into a wall. */
window.FV = window.FV || {};

FV.PATROL_ROUTES = [
  {
    name: 'Vesper',
    color: '#b42318',
    waypoints: [[2, 2], [9, 2], [9, 7], [2, 7]],
    startFacing: 0,
    scanSpeed: 1.4
  },
  {
    name: 'Nocturne',
    color: '#8b1a12',
    waypoints: [[13, 2], [29, 2], [29, 7], [13, 7]],
    startFacing: Math.PI,
    scanSpeed: 0.9
  },
  {
    name: 'Hollow',
    color: '#a83226',
    waypoints: [[5, 11], [8, 11], [8, 14], [5, 14]],
    startFacing: Math.PI / 2,
    scanSpeed: 1.1
  },
  {
    name: 'Wraith',
    color: '#7f1d1d',
    waypoints: [[13, 12], [29, 12], [29, 17], [13, 17]],
    startFacing: -Math.PI / 2,
    scanSpeed: 1.2
  }
];

FV.createGuards = function createGuards() {
  return FV.PATROL_ROUTES.map(function (route) {
    var start = FV.tileCenter(route.waypoints[0][0], route.waypoints[0][1]);
    return {
      name: route.name,
      color: route.color,
      x: start.x,
      y: start.y,
      radius: 13,
      facing: route.startFacing,
      scanSpeed: route.scanSpeed || 1.1,
      waypoints: route.waypoints.map(function (w) { return FV.tileCenter(w[0], w[1]); }),
      wpIndex: 1,
      pauseTimer: 0,
      scanTimer: 0,
      scanFrom: 0,
      state: 'patrol',
      target: null,
      suspicion: 0,
      lastSeen: null,
      lastSeenAt: 0
    };
  });
};

/* The patrol waypoint nearest to a point — where a guard resumes after an
   investigation or a chase. */
FV.nearestWaypoint = function nearestWaypoint(guard, px, py) {
  var best = 0;
  var bestDist = Infinity;
  for (var i = 0; i < guard.waypoints.length; i++) {
    var w = guard.waypoints[i];
    var d = (w.x - px) * (w.x - px) + (w.y - py) * (w.y - py);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
};
