/**
 * GameEngine - Core Game Loop Orchestrator
 * Main game loop, state management, and turn coordination
 */

import { EventBus } from './EventBus';
import { GameState } from './GameState';
import { Renderer } from '../rendering/Renderer';
import { InteractionController } from '../ui/InteractionController';
import { AIService } from '../services/AIService';
import { SoundService } from '../services/SoundService';
import { WeaponType } from '../utils/Constants';
import { Logger } from '../utils/Logger';

export class GameEngine {
  public gameState: GameState;
  private eventBus: EventBus;
  private renderer: Renderer;
  private interactionController: InteractionController | null = null;
  private aiService: AIService;
  private soundService: SoundService;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.eventBus = EventBus.getInstance();
    this.gameState = new GameState();
    this.renderer = new Renderer(canvas);
    this.aiService = new AIService();
    
    // Initialize sound service
    this.soundService = new SoundService({
      weaponFireUrl: '/src/assets/sound/ES_Medieval, GUI, Select, Archery  - attack sound- Epidemic Sound.mp3',
      backgroundMusicUrl: '/src/assets/sound/main-theme.mp3',
      moveSoundUrl: '/src/assets/sound/Machine MOVING SOUND.wav',
      loseSoundUrl: '/src/assets/sound/lose sound.mp3',
      defaultSfxVolume: 0.7,
      defaultMusicVolume: 0.5
    });
    
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    Logger.info('GameEngine initialized');
  }

  private setupEventListeners(): void {
    this.eventBus.on('unitSelected', this.handleUnitSelected.bind(this));
    this.eventBus.on('hexClicked', this.handleHexClicked.bind(this));
    this.eventBus.on('turnEnded', this.handleTurnEnded.bind(this));
    this.eventBus.on('aiTurnStarted', this.handleAITurnStarted.bind(this));
    this.eventBus.on('playerTurnStarted', this.handlePlayerTurnStarted.bind(this));
    
    // Sound effects
    this.eventBus.on('attackExecuted', () => {
      this.soundService.playWeaponFire();
    });
    
    this.eventBus.on('unitMoved', () => {
      this.soundService.playMove();
    });
    
    // Mute toggle
    this.eventBus.on('muteToggled', () => {
      this.soundService.toggleMute();
      this.updateMuteButtonUI();
    });
  }
  
  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // M key to toggle mute
      if (e.key.toLowerCase() === 'm') {
        this.soundService.toggleMute();
        this.updateMuteButtonUI();
      }
    });
  }
  
  /**
   * Update mute button visual state
   */
  private updateMuteButtonUI(): void {
    const muteBtn = document.getElementById('mute-button');
    if (muteBtn) {
      const isMuted = this.soundService.isSoundMuted();
      muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
      muteBtn.setAttribute('aria-label', isMuted ? 'Unmute sounds' : 'Mute sounds');
    }
  }

  public initialize(selectedWeapon: WeaponType): void {
    Logger.info(`Initializing game with weapon: ${selectedWeapon}`);
    this.gameState.initialize(selectedWeapon);
    
    // Initialize fog of war
    this.renderer.initFogOfWar(this.gameState);
    
    // Resume background music when game starts
    this.soundService.resumeBackgroundMusic();
    
    // Initialize interaction controller after game state is ready
    if (!this.interactionController) {
      this.interactionController = new InteractionController(
        this.renderer['canvas'],
        this.gameState
      );
    }
    
    this.startGameLoop();
    this.eventBus.emit('gameInitialized', this.gameState);
  }

  private startGameLoop(): void {
    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      
      this.update(deltaTime);
      this.render();
      
      this.animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    this.animationFrameId = requestAnimationFrame(gameLoop);
    Logger.info('Game loop started');
  }

  private update(deltaTime: number): void {
    this.gameState.update(deltaTime);
  }

  private render(): void {
    this.renderer.render(this.gameState);
  }

  private handleUnitSelected(unitId: string): void {
    Logger.debug(`Unit selected: ${unitId}`);
    // Handle unit selection logic
  }

  private handleHexClicked(q: number, r: number): void {
    Logger.debug(`Hex clicked: (${q}, ${r})`);
    // Handle hex click logic
  }

  private handleTurnEnded(): void {
    Logger.info('Turn ended - current turn: ' + this.gameState.currentTurn);
    
    // Check victory condition before switching turns
    const victor = this.gameState.checkVictoryCondition();
    if (victor) {
      this.handleGameEnd(victor);
      return;
    }
    
    // If player just ended their turn, switch to AI
    if (this.gameState.currentTurn === 'player') {
      Logger.info('Switching to AI turn...');
      this.gameState.switchTurn('ai');
      this.eventBus.emit('aiTurnStarted');
    }
  }

  private async handleAITurnStarted(): Promise<void> {
    Logger.info('AI turn starting...');
    
    // Update UI
    const uiController = (window as any).siegeTactics?.uiController;
    if (uiController) {
      uiController.updateTurnIndicator('ai');
    }
    
    // Disable player input during AI turn
    this.gameState.isAnimating = true;
    
    // Small delay before AI acts
    await this.delay(500);
    
    // Execute AI turn
    await this.aiService.executeTurn(this.gameState);
    
    // Re-enable player input
    this.gameState.isAnimating = false;
    
    // Check victory after AI turn
    const victor = this.gameState.checkVictoryCondition();
    if (victor) {
      this.handleGameEnd(victor);
    }
  }

  private handlePlayerTurnStarted(): void {
    Logger.info('Player turn started');
    this.gameState.isAnimating = false;
    
    // Update UI
    const uiController = (window as any).siegeTactics?.uiController;
    if (uiController) {
      uiController.updateTurnIndicator('player');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleGameEnd(victor: 'player' | 'ai'): void {
    Logger.info(`Game ended. Victor: ${victor}`);
    this.stopGameLoop();
    
    // Stop background music with fade-out
    this.soundService.stopBackgroundMusic();
    
    // Play lose sound if player lost
    if (victor === 'ai') {
      this.soundService.playLose();
    }
    
    this.eventBus.emit('gameEnded', { victor, state: this.gameState });
  }

  private stopGameLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public destroy(): void {
    this.stopGameLoop();
    if (this.interactionController) {
      this.interactionController.destroy();
      this.interactionController = null;
    }
    this.eventBus.removeAllListeners();
    Logger.info('GameEngine destroyed');
  }
}
