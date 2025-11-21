/**
 * WeaponStats Model
 * Defines characteristics and configuration for each weapon type
 */

import { CONSTANTS, WeaponType } from '../utils/Constants';

export interface WeaponStats {
  type: WeaponType;
  displayName: string;
  movementRange: number;
  attackRangeMin: number;
  attackRangeMax: number;
  damage: number;
  unlockXP: number;
  spriteUrl: string;
  description: string;
}

// Static weapon configurations
export const WEAPON_CONFIGS: Record<WeaponType, WeaponStats> = {
  catapult: {
    type: 'catapult',
    displayName: 'Catapult',
    movementRange: 3,
    attackRangeMin: 2,
    attackRangeMax: 5,
    damage: 35,
    unlockXP: 0,
    spriteUrl: '/assets/sprites/catapult.png',
    description: 'Balanced siege weapon with medium range and damage'
  },
  ballista: {
    type: 'ballista',
    displayName: 'Ballista',
    movementRange: 4,
    attackRangeMin: 3,
    attackRangeMax: 6,
    damage: 30,
    unlockXP: CONSTANTS.BALLISTA_UNLOCK_XP,
    spriteUrl: '/assets/sprites/ballista.png',
    description: 'Long-range precision weapon with high mobility'
  },
  trebuchet: {
    type: 'trebuchet',
    displayName: 'Trebuchet',
    movementRange: 2,
    attackRangeMin: 4,
    attackRangeMax: 8,
    damage: 60,
    unlockXP: CONSTANTS.TREBUCHET_UNLOCK_XP,
    spriteUrl: '/assets/sprites/trebuchet.png',
    description: 'Devastating long-range siege engine with limited mobility'
  }
};

export function getWeaponStats(type: WeaponType): WeaponStats {
  return WEAPON_CONFIGS[type];
}
