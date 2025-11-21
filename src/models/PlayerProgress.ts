/**
 * PlayerProgress Model
 * Tracks player XP and weapon unlocks (persisted to LocalStorage)
 */

import { WeaponType } from '../utils/Constants';
import { WEAPON_CONFIGS } from './WeaponStats';

export interface PlayerProgress {
  totalXP: number;
  unlockedWeapons: WeaponType[];
}

export class ProgressManager {
  private progress: PlayerProgress;

  constructor(progress: PlayerProgress) {
    this.progress = progress;
  }

  addXP(amount: number): WeaponType | null {
    this.progress.totalXP += amount;
    return this.checkForUnlock();
  }

  private checkForUnlock(): WeaponType | null {
    for (const [type, stats] of Object.entries(WEAPON_CONFIGS)) {
      if (
        !this.progress.unlockedWeapons.includes(type as WeaponType) &&
        this.progress.totalXP >= stats.unlockXP
      ) {
        this.progress.unlockedWeapons.push(type as WeaponType);
        return type as WeaponType;
      }
    }
    return null;
  }

  hasUnlockedWeapon(type: WeaponType): boolean {
    return this.progress.unlockedWeapons.includes(type);
  }

  getNextUnlock(): { weapon: WeaponType; xpRequired: number; xpRemaining: number } | null {
    const locked = Object.entries(WEAPON_CONFIGS)
      .filter(([type]) => !this.progress.unlockedWeapons.includes(type as WeaponType))
      .sort((a, b) => a[1].unlockXP - b[1].unlockXP);

    if (locked.length === 0) return null;

    const [type, stats] = locked[0];
    return {
      weapon: type as WeaponType,
      xpRequired: stats.unlockXP,
      xpRemaining: Math.max(0, stats.unlockXP - this.progress.totalXP)
    };
  }

  getTotalXP(): number {
    return this.progress.totalXP;
  }

  getUnlockedWeapons(): WeaponType[] {
    return [...this.progress.unlockedWeapons];
  }

  getProgress(): PlayerProgress {
    return { ...this.progress };
  }
}
