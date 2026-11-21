'use strict';
/* Frost Veil — the renderer. One canvas, drawn bright and legible: a light
   manor floor, dark walls and crates that read as cover at a glance, warm
   amber vision cones, red guards with a gold ring, and a teal player with
   a white ring. Every mechanic is visible in a still screenshot. */
window.FV = window.FV || {};

FV.RENDER = (function buildRender() {
  var cfg = FV.CONFIG;

  function drawFloor(ctx) {
    for (var r = 0; r < cfg.ROWS; r++) {
      for (var c = 0; c < cfg.COLS; c++) {
        var t = FV.tileAt(c, r);
        var x = c * cfg.TILE;
        var y = r * cfg.TILE;
        if (t === '#') {
          ctx.fillStyle = cfg.COLORS.wall;
          ctx.fillRect(x, y, cfg.TILE, cfg.TILE);
          ctx.fillStyle = cfg.COLORS.wallTop;
          ctx.fillRect(x, y, cfg.TILE, 5);
        } else {
          ctx.fillStyle = (c + r) % 2 === 0 ? cfg.COLORS.floor : cfg.COLORS.floorAlt;
          ctx.fillRect(x, y, cfg.TILE, cfg.TILE);
        }
        if (t === 'S') {
          ctx.fillStyle = cfg.COLORS.shadow;
          ctx.fillRect(x, y, cfg.TILE, cfg.TILE);
          ctx.strokeStyle = cfg.COLORS.shadowEdge;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, cfg.TILE - 1, cfg.TILE - 1);
        }
        if (t === 'C') {
          ctx.fillStyle = cfg.COLORS.crate;
          ctx.fillRect(x + 3, y + 3, cfg.TILE - 6, cfg.TILE - 6);
          ctx.fillStyle = cfg.COLORS.crateTop;
          ctx.fillRect(x + 3, y + 3, cfg.TILE - 6, 8);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, cfg.TILE - 6, cfg.TILE - 6);
          ctx.beginPath();
          ctx.moveTo(x + 3, y + 3);
          ctx.lineTo(x + cfg.TILE - 3, y + cfg.TILE - 3);
          ctx.moveTo(x + cfg.TILE - 3, y + 3);
          ctx.lineTo(x + 3, y + cfg.TILE - 3);
          ctx.stroke();
        }
      }
    }
  }

  function drawExit(ctx, game) {
    var e = FV.tileCenter(FV.LEVEL.exit.x, FV.LEVEL.exit.y);
    var open = game.intelGot >= cfg.INTEL_TOTAL;
    var pulse = open ? 0.6 + 0.4 * Math.sin(performance.now() / 240) : 0.25;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = open ? cfg.COLORS.exitGlow : '#9aa5b1';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = open ? cfg.COLORS.exit : '#6b7280';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(open ? 'EXIT' : 'LOCK', e.x, e.y - 30);
  }

  function drawIntel(ctx, game) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < FV.LEVEL.intel.length; i++) {
      var p = FV.LEVEL.intel[i];
      if (p.taken) continue;
      var c = FV.tileCenter(p.x, p.y);
      var bob = Math.sin(performance.now() / 300 + i * 2) * 2;
      ctx.fillStyle = cfg.COLORS.intel;
      ctx.beginPath();
      ctx.arc(c.x, c.y + bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff7e0';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('i', c.x, c.y + bob);
    }
  }

  function drawCones(ctx, game) {
    for (var i = 0; i < game.guards.length; i++) {
      var g = game.guards[i];
      var poly = FV.conePolygon(g);
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (var j = 1; j < poly.length; j++) ctx.lineTo(poly[j].x, poly[j].y);
      ctx.closePath();
      ctx.fillStyle = g.state === 'chase' ? cfg.COLORS.coneAlert : cfg.COLORS.cone;
      ctx.fill();
      ctx.strokeStyle = cfg.COLORS.coneEdge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawGuards(ctx, game) {
    for (var i = 0; i < game.guards.length; i++) {
      var g = game.guards[i];
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cfg.COLORS.guardRing;
      ctx.lineWidth = 2;
      ctx.stroke();
      /* Facing tick so the patrol direction reads at a glance. */
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.facing) * (g.radius + 7), g.y + Math.sin(g.facing) * (g.radius + 7));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      /* Suspicion arc above the guard. */
      if (g.suspicion > 1) {
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius + 6, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * g.suspicion) / 100);
        ctx.strokeStyle = g.suspicion >= 100 ? '#dc2626' : '#f59e0b';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.name, g.x, g.y - g.radius - 12);
    }
  }

  function drawPlayer(ctx, game) {
    var p = game.player;
    var inShadow = FV.COVER.isInShadow(p.x, p.y);
    ctx.save();
    if (inShadow) ctx.globalAlpha = 0.75;
    ctx.fillStyle = cfg.COLORS.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cfg.COLORS.playerRing;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.facing) * (p.radius + 8), p.y + Math.sin(p.facing) * (p.radius + 8));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#0e7490';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', p.x, p.y - p.radius - 12);
    if (p.crouched) {
      ctx.fillStyle = '#0e7490';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('CROUCHED', p.x, p.y + p.radius + 14);
    }
  }

  /* Faint dots mark each guard's patrol route, so the routes read in a
     still screenshot even before a guard walks them. */
  function drawRoutes(ctx, game) {
    ctx.fillStyle = 'rgba(180, 35, 24, 0.35)';
    for (var i = 0; i < game.guards.length; i++) {
      var wps = game.guards[i].waypoints;
      for (var j = 0; j < wps.length; j++) {
        ctx.beginPath();
        ctx.arc(wps[j].x, wps[j].y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawNoise(ctx, game) {
    if (!game.lastNoise) return;
    var age = performance.now() - game.lastNoise.at;
    if (age > cfg.NOISE_RING_MS) return;
    var prog = age / cfg.NOISE_RING_MS;
    ctx.beginPath();
    ctx.arc(game.lastNoise.x, game.lastNoise.y, game.lastNoise.radius * prog + 8, 0, Math.PI * 2);
    ctx.strokeStyle = cfg.COLORS.noise;
    ctx.globalAlpha = 1 - prog;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  return {
    draw: function draw(ctx, game) {
      ctx.clearRect(0, 0, cfg.WIDTH, cfg.HEIGHT);
      drawFloor(ctx);
      drawExit(ctx, game);
      drawIntel(ctx, game);
      drawRoutes(ctx, game);
      drawCones(ctx, game);
      drawNoise(ctx, game);
      drawGuards(ctx, game);
      drawPlayer(ctx, game);
    }
  };
})();
