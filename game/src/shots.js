'use strict';
/* Frost Veil — staged scenes for screenshots. ?scene=cover|patrol|alarm|exit
   poses the player and the guards, sets the detection meter, and pauses
   the simulation so the shot is a steady frame of the game's own render.
   Nothing here is a mock: the same canvas, the same code, only the
   starting positions are staged. */
window.FV = window.FV || {};

FV.SCENES = {
  /* Cover shot: the player crouched in a shadow patch while Vesper's cone
     sweeps past the crates. */
  cover: function cover(game) {
    var p = FV.tileCenter(5, 6);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.crouched = true;
    game.player.facing = Math.PI / 2;
    game.guards[0].x = FV.tileCenter(9, 3).x;
    game.guards[0].y = FV.tileCenter(9, 3).y;
    /* Facing down: the cone's edge sweeps just past the shadow patch
       without landing on the player, so the shot reads as "hidden". */
    game.guards[0].facing = Math.PI / 2;
    game.guards[1].x = FV.tileCenter(20, 5).x;
    game.guards[1].y = FV.tileCenter(20, 5).y;
    game.guards[1].facing = Math.PI / 2;
    /* A second cone in the lower half, so the shot shows the manor is
       patrolled on both floors of the frame. */
    game.guards[2].x = FV.tileCenter(5, 13).x;
    game.guards[2].y = FV.tileCenter(5, 13).y;
    game.guards[2].facing = -Math.PI / 2;
    game.detection.global = 0;
  },
  /* Patrol shot: the player crossing open floor as a guard closes in and
     the meter climbs. */
  patrol: function patrol(game) {
    var p = FV.tileCenter(7, 6);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.facing = 0;
    game.player.running = false;
    game.guards[0].x = FV.tileCenter(9, 4).x;
    game.guards[0].y = FV.tileCenter(9, 4).y;
    game.guards[0].facing = Math.PI;
    game.guards[0].suspicion = 62;
    game.guards[0].lastSeen = { x: p.x, y: p.y };
    game.detection.global = 62;
    game.detection.state = 'suspicious';
    game.intelGot = 1;
    FV.LEVEL.intel[0].taken = true;
    /* A fresh footstep ring, so the noise mechanic reads in the still. */
    game.lastNoise = { x: p.x, y: p.y, radius: FV.CONFIG.NOISE_WALK, at: performance.now() - 200 };
  },
  /* Alarm shot: the alarm is up, all guards chase, the player sprints for
     the exit with the last intel in hand. */
  alarm: function alarm(game) {
    var p = FV.tileCenter(26, 3);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.facing = 0;
    game.player.running = true;
    game.guards[1].x = FV.tileCenter(24, 4).x;
    game.guards[1].y = FV.tileCenter(24, 4).y;
    game.guards[1].facing = 0;
    game.guards[1].state = 'chase';
    game.guards[1].suspicion = 100;
    game.guards[1].lastSeen = { x: p.x, y: p.y };
    game.guards[0].x = FV.tileCenter(22, 2).x;
    game.guards[0].y = FV.tileCenter(22, 2).y;
    game.guards[0].facing = 0;
    game.guards[0].state = 'chase';
    game.guards[0].suspicion = 100;
    game.detection.global = 100;
    game.detection.state = 'alert';
    game.detection.alert = true;
    game.intelGot = 2;
    FV.LEVEL.intel[0].taken = true;
    FV.LEVEL.intel[1].taken = true;
  },
  /* Exit shot: all intel stolen, the player standing on the open exit. */
  exit: function exit(game) {
    var p = FV.tileCenter(29, 1);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.facing = -Math.PI / 2;
    game.intelGot = 3;
    for (var i = 0; i < FV.LEVEL.intel.length; i++) FV.LEVEL.intel[i].taken = true;
    game.detection.global = 0;
    game.phase = 'won';
    game.elapsedMs = 87400;
    game.detection.timesSpotted = 0;
  }
};

FV.applyScene = function applyScene(game) {
  var params = new URLSearchParams(window.location.search);
  var scene = params.get('scene');
  if (!scene || !FV.SCENES[scene]) return false;
  FV.SCENES[scene](game);
  game.paused = true;
  return true;
};
