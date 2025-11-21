/**
 * ProgressRepository - LocalStorage Persistence
 * Handles saving and loading player progress
 */

import { PlayerProgress } from '../models/PlayerProgress';
import { CONSTANTS } from '../utils/Constants';
import { Logger } from '../utils/Logger';

export class ProgressRepository {
  private static STORAGE_KEY = CONSTANTS.STORAGE_KEY;

  static save(progress: PlayerProgress): void {
    try {
      const json = JSON.stringify(progress);
      localStorage.setItem(this.STORAGE_KEY, json);
      Logger.info('Progress saved', progress);
    } catch (error) {
      Logger.error('Failed to save progress', error);
      // Handle quota exceeded or privacy mode
    }
  }

  static load(): PlayerProgress {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (json) {
        const progress = JSON.parse(json) as PlayerProgress;
        Logger.info('Progress loaded', progress);
        return progress;
      }
    } catch (error) {
      Logger.error('Failed to load progress', error);
    }
    
    return this.getDefault();
  }

  static getDefault(): PlayerProgress {
    return {
      totalXP: 0,
      unlockedWeapons: ['catapult'] // Catapult always unlocked
    };
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    Logger.info('Progress cleared');
  }
}
