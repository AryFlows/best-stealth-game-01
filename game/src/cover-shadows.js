'use strict';
/* Frost Veil — cover and shadow. Two ways to stay unseen: stand in a dark
   shadow zone, or keep a crate between you and a guard's eyes. The shadow
   check is a tile lookup; the cover check is a line-of-sight test against
   the solid tiles, shared with the vision-cone code. */
window.FV = window.FV || {};

FV.COVER = {
  /* True while the player stands on a shadow tile. */
  isInShadow: function isInShadow(px, py) {
    var t = FV.CONFIG.TILE;
    return FV.isShadowTile(Math.floor(px / t), Math.floor(py / t));
  },

  /* True while a solid tile (wall or crate) sits within one tile of the
     player — the "BEHIND COVER" badge in the HUD. */
  isNearCover: function isNearCover(px, py) {
    var t = FV.CONFIG.TILE;
    var cx = Math.floor(px / t);
    var cy = Math.floor(py / t);
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (FV.isSolidTile(cx + dx, cy + dy)) return true;
      }
    }
    return false;
  },

  /* The detection multiplier for standing at this spot: shadows slow a
     guard's suspicion, and crouching in one slows it further. */
  concealmentAt: function concealmentAt(px, py, crouched) {
    var factor = 1;
    if (FV.COVER.isInShadow(px, py)) factor *= FV.CONFIG.SHADOW_FACTOR;
    if (crouched) factor *= FV.CONFIG.CROUCH_FACTOR;
    return factor;
  },

  /* How hidden the player is right now, as a short label for the HUD.
     The factor in brackets is how much slower a guard's suspicion fills
     here — the number the player is actually playing against. */
  statusLabel: function statusLabel(px, py, crouched) {
    var factor = FV.COVER.concealmentAt(px, py, crouched);
    var suffix = factor < 1 ? ' (×' + factor.toFixed(2).replace(/0$/, '') + ')' : '';
    if (FV.COVER.isInShadow(px, py)) return (crouched ? 'HIDDEN · IN SHADOW · CROUCHED' : 'HIDDEN · IN SHADOW') + suffix;
    if (FV.COVER.isNearCover(px, py)) return 'BEHIND COVER';
    return (crouched ? 'EXPOSED · CROUCHED' : 'EXPOSED') + suffix;
  }
};
