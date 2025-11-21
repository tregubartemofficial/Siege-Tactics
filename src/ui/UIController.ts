/**
 * UIController - DOM UI Management
 * Handles all DOM-based UI interactions
 */

import { EventBus } from '../core/EventBus';
import { PlayerProgress, ProgressManager } from '../models/PlayerProgress';
import { ProgressRepository } from '../services/ProgressRepository';
import { WEAPON_CONFIGS } from '../models/WeaponStats';
import { WeaponType } from '../utils/Constants';
import { Logger } from '../utils/Logger';

export class UIController {
  private eventBus: EventBus;
  private mainMenuEl: HTMLElement | null;
  private battleUIEl: HTMLElement | null;
  private victoryScreenEl: HTMLElement | null;
  private helpOverlayEl: HTMLElement | null;
  private selectedWeapon: WeaponType = 'catapult';

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.mainMenuEl = document.getElementById('main-menu');
    this.battleUIEl = document.getElementById('battle-ui');
    this.victoryScreenEl = document.getElementById('victory-screen');
    this.helpOverlayEl = document.getElementById('help-overlay');
    
    this.setupEventListeners();
    Logger.info('UIController initialized');
  }

  private setupEventListeners(): void {
    // Main Menu
    document.getElementById('start-battle-btn')?.addEventListener('click', () => {
      this.eventBus.emit('startBattle', this.selectedWeapon);
      (window as any).siegeTactics?.startBattle(this.selectedWeapon);
    });

    document.getElementById('help-btn')?.addEventListener('click', () => {
      this.showHelp();
    });

    // Battle UI
    document.getElementById('end-turn-btn')?.addEventListener('click', () => {
      Logger.info('Player ending turn...');
      this.eventBus.emit('turnEnded');
    });

    document.getElementById('pause-btn')?.addEventListener('click', () => {
      // TODO: Implement pause functionality
      Logger.info('Pause clicked');
    });

    // Victory Screen
    document.getElementById('rematch-btn')?.addEventListener('click', () => {
      (window as any).siegeTactics?.startBattle(this.selectedWeapon);
    });

    document.getElementById('main-menu-btn')?.addEventListener('click', () => {
      (window as any).siegeTactics?.endBattle();
      this.showMainMenu(ProgressRepository.load());
    });

    // Help Overlay
    document.getElementById('close-help-btn')?.addEventListener('click', () => {
      this.hideHelp();
    });

    // Game Events
    this.eventBus.on('gameEnded', this.handleGameEnded.bind(this));
  }

  public showMainMenu(progress: PlayerProgress): void {
    // Create manager for this session (not stored as property)
    new ProgressManager(progress);
    this.hideAll();
    
    if (this.mainMenuEl) {
      this.mainMenuEl.style.display = 'flex';
      this.updateXPDisplay(progress);
      this.renderWeaponSelection(progress);
    }
  }

  private updateXPDisplay(progress: PlayerProgress): void {
    const xpValueEl = document.getElementById('xp-value');
    const xpProgressEl = document.getElementById('xp-progress');
    const xpNextUnlockEl = document.getElementById('xp-next-unlock');

    if (xpValueEl) {
      xpValueEl.textContent = `${progress.totalXP} XP`;
    }

    const manager = new ProgressManager(progress);
    const nextUnlock = manager.getNextUnlock();

    if (nextUnlock && xpProgressEl && xpNextUnlockEl) {
      const percentage = (progress.totalXP / nextUnlock.xpRequired) * 100;
      xpProgressEl.style.width = `${Math.min(percentage, 100)}%`;
      xpNextUnlockEl.textContent = `Next Unlock: ${WEAPON_CONFIGS[nextUnlock.weapon].displayName} at ${nextUnlock.xpRequired} XP`;
    } else if (xpNextUnlockEl) {
      xpNextUnlockEl.textContent = 'All weapons unlocked!';
      if (xpProgressEl) {
        xpProgressEl.style.width = '100%';
      }
    }
  }

  private renderWeaponSelection(progress: PlayerProgress): void {
    const container = document.getElementById('weapon-selection');
    if (!container) return;

    container.innerHTML = '';

    Object.values(WEAPON_CONFIGS).forEach(weapon => {
      const isUnlocked = progress.unlockedWeapons.includes(weapon.type);
      const card = document.createElement('div');
      card.className = `weapon-card ${isUnlocked ? 'unlocked' : 'locked'} ${this.selectedWeapon === weapon.type ? 'selected' : ''}`;
      
      card.innerHTML = `
        <div class="weapon-icon">${this.getWeaponIcon(weapon.type)}</div>
        <div class="weapon-name">${weapon.displayName}</div>
        <div class="weapon-description">${weapon.description}</div>
        <div class="weapon-stats-mini">
          Range: ${weapon.attackRangeMin}-${weapon.attackRangeMax} | Damage: ${weapon.damage}
        </div>
        ${!isUnlocked ? `<div class="unlock-requirement">🔒 Unlock at ${weapon.unlockXP} XP</div>` : ''}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.selectedWeapon = weapon.type;
          this.renderWeaponSelection(progress);
        });
      }

      container.appendChild(card);
    });
  }

  private getWeaponIcon(type: WeaponType): string {
    const icons: Record<WeaponType, string> = {
      catapult: '🎯',
      ballista: '🏹',
      trebuchet: '⚔️'
    };
    return icons[type] || '⚔️';
  }

  public showBattleUI(): void {
    this.hideAll();
    if (this.battleUIEl) {
      this.battleUIEl.style.display = 'flex';
    }
  }

  private showVictoryScreen(result: 'victory' | 'defeat', xpEarned: number): void {
    this.hideAll();
    
    if (this.victoryScreenEl) {
      this.victoryScreenEl.style.display = 'flex';
      
      const titleEl = document.getElementById('victory-title');
      if (titleEl) {
        titleEl.textContent = result === 'victory' ? 'VICTORY!' : 'DEFEAT';
        titleEl.className = `victory-title ${result}`;
      }

      // Update stats
      document.getElementById('xp-earned')!.textContent = `+${xpEarned}`;
      
      // Update progress
      const progress = ProgressRepository.load();
      const manager = new ProgressManager(progress);
      const unlockedWeapon = manager.addXP(xpEarned);
      
      if (unlockedWeapon) {
        const notificationEl = document.getElementById('unlock-notification');
        const weaponNameEl = document.getElementById('unlocked-weapon-name');
        if (notificationEl && weaponNameEl) {
          notificationEl.style.display = 'block';
          weaponNameEl.textContent = WEAPON_CONFIGS[unlockedWeapon].displayName.toUpperCase();
        }
      }
      
      ProgressRepository.save(manager.getProgress());
      
      // Update XP display
      this.updateVictoryXPDisplay(manager.getProgress());
    }
  }

  private updateVictoryXPDisplay(progress: PlayerProgress): void {
    const totalXPEl = document.getElementById('total-xp');
    if (totalXPEl) {
      totalXPEl.textContent = progress.totalXP.toString();
    }

    const xpProgressEl = document.getElementById('victory-xp-progress');
    const xpNextUnlockEl = document.getElementById('victory-next-unlock');
    const manager = new ProgressManager(progress);
    const nextUnlock = manager.getNextUnlock();

    if (nextUnlock && xpProgressEl && xpNextUnlockEl) {
      const percentage = (progress.totalXP / nextUnlock.xpRequired) * 100;
      xpProgressEl.style.width = `${Math.min(percentage, 100)}%`;
      xpNextUnlockEl.textContent = `Next: ${WEAPON_CONFIGS[nextUnlock.weapon].displayName} at ${nextUnlock.xpRequired} XP`;
    } else if (xpNextUnlockEl) {
      xpNextUnlockEl.textContent = 'All weapons unlocked!';
    }
  }

  private showHelp(): void {
    if (this.helpOverlayEl) {
      this.helpOverlayEl.style.display = 'flex';
    }
  }

  private hideHelp(): void {
    if (this.helpOverlayEl) {
      this.helpOverlayEl.style.display = 'none';
    }
  }

  private hideAll(): void {
    if (this.mainMenuEl) this.mainMenuEl.style.display = 'none';
    if (this.battleUIEl) this.battleUIEl.style.display = 'none';
    if (this.victoryScreenEl) this.victoryScreenEl.style.display = 'none';
  }

  public updateTurnIndicator(turn: 'player' | 'ai'): void {
    const indicator = document.getElementById('turn-indicator');
    if (indicator) {
      indicator.textContent = turn === 'player' ? 'PLAYER TURN' : 'AI TURN';
      indicator.className = `turn-indicator ${turn}`;
    }
  }

  private handleGameEnded(data: { victor: 'player' | 'ai'; state: any }): void {
    Logger.info('Game ended', data);
    
    // Calculate XP earned (50 per enemy destroyed)
    const enemiesDestroyed = 1; // TODO: Get from game state
    const xpEarned = enemiesDestroyed * 50;
    
    const result = data.victor === 'player' ? 'victory' : 'defeat';
    this.showVictoryScreen(result, xpEarned);
  }
}
