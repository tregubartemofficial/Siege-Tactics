import { GameState } from '../core/GameState';
import { HexCoordinate } from '../models/HexCoordinate';
import { HexUtils } from '../utils/HexUtils';
import { PathfindingService } from '../services/PathfindingService';
import { CombatService } from '../services/CombatService';
import { Logger } from '../utils/Logger';
import { EventBus } from '../core/EventBus';

/**
 * InteractionController - Handles mouse/touch input for game interactions
 * Manages unit selection, hex hovering, and movement commands
 */
export class InteractionController {
  private canvas: HTMLCanvasElement;
  private gameState: GameState;
  private hexSize: number = 35;

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - this.canvas.width / 2;
    const y = event.clientY - rect.top - this.canvas.height / 2;

    // Convert isometric pixel to hex coordinate
    const hex = this.pixelToIsometricHex(x, y);

    // Update hovered hex if in bounds
    if (HexUtils.inBounds(hex, this.gameState.shrinkRadius)) {
      this.gameState.hoveredHex = hex;
    } else {
      this.gameState.hoveredHex = null;
    }
  }

  private handleMouseLeave(): void {
    this.gameState.hoveredHex = null;
  }

  private handleClick(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - this.canvas.width / 2;
    const y = event.clientY - rect.top - this.canvas.height / 2;

    const hex = this.pixelToIsometricHex(x, y);

    if (!HexUtils.inBounds(hex, this.gameState.shrinkRadius)) {
      return;
    }

    // Block input during AI turn or animations
    if (this.gameState.currentTurn !== 'player' || this.gameState.isAnimating) {
      Logger.info('Wait for AI turn to complete...');
      return;
    }

    // Check if clicking on a player unit
    const clickedUnit = this.gameState.playerUnits.find(unit =>
      HexUtils.equals(unit.position, hex)
    );

    if (clickedUnit) {
      this.selectUnit(clickedUnit.id);
      return;
    }

    // If unit is selected, check for attack or movement
    if (this.gameState.selectedUnit) {
      // Check if clicking on enemy unit for attack
      const enemyUnit = CombatService.getEnemyAtHex(
        hex,
        this.gameState.selectedUnit,
        this.gameState
      );

      if (enemyUnit) {
        this.tryAttackUnit(hex);
        return;
      }

      // Otherwise try to move
      this.tryMoveUnit(hex);
    }
  }

  private selectUnit(unitId: string): void {
    const unit = this.gameState.playerUnits.find(u => u.id === unitId);

    if (!unit || !unit.isAlive() || !unit.canMove()) {
      Logger.info('Cannot select this unit');
      return;
    }

    this.gameState.selectedUnit = unit;
    
    // Calculate reachable hexes for movement
    this.gameState.validMoveHexes = PathfindingService.getReachableHexes(
      unit.position,
      unit.getMovementRange(),
      this.gameState
    );

    // Calculate attack range
    this.gameState.validAttackHexes = CombatService.getAttackRange(
      unit,
      this.gameState
    );

    Logger.info(`Selected ${unit.type} at (${unit.position.q}, ${unit.position.r})`);
    Logger.info(`Can move to ${this.gameState.validMoveHexes.length} hexes`);
    Logger.info(`Can attack ${this.gameState.validAttackHexes.length} hexes`);
  }

  private tryMoveUnit(destination: HexCoordinate): void {
    if (!this.gameState.selectedUnit) return;

    // Check if destination is valid
    const isValidMove = this.gameState.validMoveHexes.some(hex =>
      HexUtils.equals(hex, destination)
    );

    if (!isValidMove) {
      Logger.info('Cannot move there');
      return;
    }

    // Move the unit
    const unit = this.gameState.selectedUnit;
    const oldPos = unit.position;
    unit.position = destination;
    unit.hasMovedThisTurn = true;

    Logger.info(`Moved ${unit.type} from (${oldPos.q}, ${oldPos.r}) to (${destination.q}, ${destination.r})`);

    // Emit event for move sound
    EventBus.getInstance().emit('unitMoved', { unitId: unit.id, from: oldPos, to: destination });

    // Update fog of war after movement
    this.gameState.updateVision();

    // Clear selection
    this.gameState.selectedUnit = null;
    this.gameState.validMoveHexes = [];
    this.gameState.validAttackHexes = [];
    this.gameState.hoveredHex = null;
  }

  private tryAttackUnit(target: HexCoordinate): void {
    if (!this.gameState.selectedUnit) return;

    const attacker = this.gameState.selectedUnit;

    // Check if attacker can still attack
    if (!attacker.canAttack()) {
      Logger.info('Unit has already attacked this turn');
      return;
    }

    // Find the actual target unit
    const targetUnit = CombatService.getEnemyAtHex(
      target,
      attacker,
      this.gameState
    );

    if (!targetUnit) {
      Logger.info('No enemy at target location');
      return;
    }

    // Execute attack
    const result = CombatService.executeAttack(
      attacker,
      targetUnit,
      this.gameState
    );

    if (result.success) {
      Logger.info(`Attack successful! Dealt ${result.damage} damage`);
      
      if (result.targetDestroyed) {
        Logger.info('Enemy destroyed!');
        
        // Check for victory
        if (this.gameState.aiUnits.length === 0) {
          Logger.info('🎉 VICTORY! All enemies destroyed!');
        }
      }

      // Keep unit selected if they can still move
      if (!attacker.canMove()) {
        this.gameState.selectedUnit = null;
        this.gameState.validMoveHexes = [];
        this.gameState.validAttackHexes = [];
      }
    } else {
      Logger.warn('Attack failed');
    }
  }

  /**
   * Convert isometric pixel position to hex coordinate
   * Matches the projection used in renderers
   */
  private pixelToIsometricHex(x: number, y: number): HexCoordinate {
    const verticalScale = 0.5;

    // Inverse isometric transformation
    const adjustedY = y / verticalScale;
    const q = (x * Math.sqrt(3) / 3 - adjustedY / 3) / this.hexSize;
    const r = (adjustedY * 2 / 3) / this.hexSize;

    return this.hexRound({ q, r, s: -q - r });
  }

  /**
   * Round fractional hex coordinates to nearest hex
   */
  private hexRound(hex: { q: number; r: number; s: number }): HexCoordinate {
    let q = Math.round(hex.q);
    let r = Math.round(hex.r);
    let s = Math.round(hex.s);

    const qDiff = Math.abs(q - hex.q);
    const rDiff = Math.abs(r - hex.r);
    const sDiff = Math.abs(s - hex.s);

    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    } else {
      s = -q - r;
    }

    return { q, r, s };
  }

  public destroy(): void {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
}
