/**
 * Siege Tactics - Main Entry Point
 * Initializes the game and sets up the UI
 */

import { GameEngine } from './core/GameEngine';
import { UIController } from './ui/UIController';
import { ProgressRepository } from './services/ProgressRepository';
import { Logger } from './utils/Logger';
import { PathfindingService } from './services/PathfindingService';
import { CombatService } from './services/CombatService';
import { HexUtils } from './utils/HexUtils';
import './styles/main.css';

class SiegeTactics {
  private gameEngine: GameEngine | null = null;
  public uiController: UIController;

  constructor() {
    Logger.info('Siege Tactics initializing...');
    
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      Logger.error('Canvas element not found!');
      throw new Error('Canvas element not found');
    }

    this.uiController = new UIController();
    
    // Load player progress and show main menu
    this.showMainMenu();

    Logger.info('Siege Tactics initialized successfully');
  }

  private showMainMenu(): void {
    const progress = ProgressRepository.load();
    this.uiController.showMainMenu(progress);
  }

  public startBattle(selectedWeapon: string): void {
    Logger.info(`Starting battle with weapon: ${selectedWeapon}`);
    
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.gameEngine = new GameEngine(canvas);
    this.gameEngine.initialize(selectedWeapon as any);
    
    this.uiController.showBattleUI();
  }

  public endBattle(): void {
    if (this.gameEngine) {
      this.gameEngine.destroy();
      this.gameEngine = null;
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new SiegeTactics();
  
  // Make game instance globally accessible for UI callbacks
  (window as any).siegeTactics = game;
  
  // Expose PathfindingService for testing in console
  (window as any).PathfindingService = PathfindingService;
  (window as any).CombatService = CombatService;
  (window as any).HexUtils = HexUtils;
  
  Logger.info('=== Siege Tactics Ready! ===');
  Logger.info('🎮 GAMEPLAY:');
  Logger.info('1. Start battle: siegeTactics.startBattle("catapult")');
  Logger.info('2. Click your unit (bottom) to select');
  Logger.info('3. Blue overlay = movement, Red overlay = attack range');
  Logger.info('4. Click hex to move, or enemy to attack');
  Logger.info('5. Click "END TURN" button to let AI play');
  Logger.info('6. Watch turn indicator (blue=player, red=AI)');
  Logger.info('7. Destroy all enemies to win!');
});

