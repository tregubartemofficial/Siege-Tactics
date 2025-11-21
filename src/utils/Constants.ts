/**
 * Game Constants
 * Central location for all game configuration values
 */

export const CONSTANTS = {
  // Grid Configuration
  GRID_SIZE: 15,
  GRID_RADIUS: 7, // 15x15 grid = -7 to +7 in cube coordinates
  
  // Hex Rendering
  HEX_SIZE: 30, // Pixels
  HEX_WIDTH: 52, // ~30 * sqrt(3)
  HEX_HEIGHT: 60, // 30 * 2
  
  // Game Balance
  XP_PER_KILL: 50,
  STARTING_HEALTH: 100,
  FOG_OF_WAR_RADIUS: 4, // Hexes
  SHRINK_INTERVAL: 5, // Turns
  MIN_SHRINK_RADIUS: 5, // Hexes
  
  // Weapon Unlock Thresholds
  BALLISTA_UNLOCK_XP: 100,
  TREBUCHET_UNLOCK_XP: 300,
  
  // Animation Timing
  UNIT_MOVE_DURATION: 400, // ms per hex
  PROJECTILE_DURATION: 800, // ms
  DAMAGE_FLASH_DURATION: 300, // ms
  AI_TURN_DELAY: 500, // ms before AI starts thinking
  
  // Canvas Rendering
  TARGET_FPS: 60,
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  
  // Colors
  COLORS: {
    PLAYER_UNIT: '#4A7C9D',
    AI_UNIT: '#C24641',
    MOVEMENT_RANGE: 'rgba(74, 124, 157, 0.3)',
    ATTACK_RANGE: 'rgba(194, 70, 65, 0.3)',
    FOG_OF_WAR: 'rgba(0, 0, 0, 0.7)',
    GRID_LINE: '#6B5D4F',
    HEX_DEFAULT: '#E8DCC8',
    HEX_HOVER: '#D4C8B0',
  },
  
  // LocalStorage Keys
  STORAGE_KEY: 'siege_tactics_progress',
} as const;

export type WeaponType = 'catapult' | 'ballista' | 'trebuchet';
export type PlayerType = 'player' | 'ai';
