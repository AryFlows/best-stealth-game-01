'use strict';
/* Frost Veil — central tuning. Every number the game balances on lives here,
   so a balance pass touches one file and nothing else. */
window.FV = window.FV || {};

FV.CONFIG = {
  TILE: 40,
  COLS: 32,
  ROWS: 20,
  WIDTH: 1280,
  HEIGHT: 800,

  PLAYER_RADIUS: 13,
  WALK_SPEED: 132,
  RUN_SPEED: 205,
  CROUCH_SPEED: 72,

  GUARD_PATROL_SPEED: 56,
  GUARD_CHASE_SPEED: 108,
  GUARD_INVESTIGATE_SPEED: 78,
  GUARD_SCAN_SECONDS: 1.6,
  GUARD_PAUSE_SECONDS: 1.1,

  VISION_RANGE: 235,
  VISION_HALF_ANGLE: 0.87, // about 50 degrees each side of the facing

  DETECT_BASE: 42,          // suspicion per second at the edge of the cone
  DETECT_CLOSE_BONUS: 58,   // extra suspicion per second at point-blank range
  DETECT_DECAY: 14,         // suspicion per second while unseen
  ALERT_DECAY: 10,          // suspicion per second while the alarm is running

  SHADOW_FACTOR: 0.45,      // detection is this much slower inside a shadow zone
  CROUCH_FACTOR: 0.6,       // and this much slower while crouched
  RUN_FACTOR: 1.3,          // running is easier to spot

  CATCH_RADIUS: 26,         // a guard this close catches the player

  NOISE_WALK: 55,           // how far a walking footstep carries
  NOISE_RUN: 190,           // how far a running footstep carries
  NOISE_CROUCH: 22,         // how far a crouched footstep carries
  STEP_WALK_MS: 420,
  STEP_RUN_MS: 300,
  NOISE_RING_MS: 700,       // how long a footstep's ring stays on screen
  INTEL_PICKUP_RADIUS: 26,  // how close the player must be to grab intel

  INTEL_TOTAL: 3,

  COLORS: {
    floor: '#ece5cd',
    floorAlt: '#e3dac0',
    wall: '#3b3f4a',
    wallTop: '#565b68',
    crate: '#7a5a34',
    crateTop: '#9c7748',
    shadow: 'rgba(38, 52, 86, 0.42)',
    shadowEdge: '#2a3a5e',
    exit: '#1f9d55',
    exitGlow: '#37d67a',
    intel: '#e8a13a',
    player: '#0e7490',
    playerRing: '#ffffff',
    guard: '#b42318',
    guardRing: '#ffd166',
    cone: 'rgba(245, 158, 11, 0.30)',
    coneAlert: 'rgba(220, 38, 38, 0.38)',
    coneEdge: 'rgba(245, 158, 11, 0.55)',
    noise: 'rgba(14, 116, 144, 0.5)',
    text: '#1f2937'
  }
};
