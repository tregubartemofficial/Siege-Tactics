import { GameState } from '../core/GameState';
import { HexCoordinate } from '../models/HexCoordinate';
import { Unit } from '../models/Unit';
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

  constructor(canvas: HTMLCanvasElement, gameState: GameState) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
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

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left - this.canvas.width / 2;
      const y = touch.clientY - rect.top - this.canvas.height / 2;
      
      const hex = this.pixelToIsometricHex(x, y);
      if (HexUtils.inBounds(hex, this.gameState.shrinkRadius)) {
        this.gameState.hoveredHex = hex;
      }
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left - this.canvas.width / 2;
      const y = touch.clientY - rect.top - this.canvas.height / 2;
      
      const hex = this.pixelToIsometricHex(x, y);
      if (HexUtils.inBounds(hex, this.gameState.shrinkRadius)) {
        this.gameState.hoveredHex = hex;
      } else {
        this.gameState.hoveredHex = null;
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left - this.canvas.width / 2;
      const y = touch.clientY - rect.top - this.canvas.height / 2;
      
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
        // If clicking on already selected unit, deselect it
        if (this.gameState.selectedUnit && this.gameState.selectedUnit.id === clickedUnit.id) {
          this.deselectUnit();
        } else {
          this.selectUnit(clickedUnit.id);
        }
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
    
    // Clear hover after touch ends
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
      // If clicking on already selected unit, deselect it
      if (this.gameState.selectedUnit && this.gameState.selectedUnit.id === clickedUnit.id) {
        this.deselectUnit();
      } else {
        this.selectUnit(clickedUnit.id);
      }
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

    if (!unit || !unit.isAlive()) {
      Logger.info('Cannot select this unit');
      return;
    }

    this.gameState.selectedUnit = unit;
    this.updateValidHexes(unit);

    Logger.info(`Selected ${unit.type} at (${unit.position.q}, ${unit.position.r})`);
    Logger.info(`Movement: ${unit.getRemainingMovement()}/${unit.getMovementRange()}`);
    Logger.info(`Can move to ${this.gameState.validMoveHexes.length} hexes`);
    Logger.info(`Can attack ${this.gameState.validAttackHexes.length} hexes`);
  }

  private updateValidHexes(unit: Unit): void {
    // Calculate reachable hexes using remaining movement
    if (unit.canMove()) {
      this.gameState.validMoveHexes = PathfindingService.getReachableHexes(
        unit.position,
        unit.getRemainingMovement(),
        this.gameState
      );
    } else {
      this.gameState.validMoveHexes = [];
    }

    // Calculate attack range
    if (unit.canAttack()) {
      this.gameState.validAttackHexes = CombatService.getAttackRange(
        unit,
        this.gameState
      );
    } else {
      this.gameState.validAttackHexes = [];
    }
  }

  private deselectUnit(): void {
    this.gameState.selectedUnit = null;
    this.gameState.validMoveHexes = [];
    this.gameState.validAttackHexes = [];
    this.gameState.plannedPath = [];
    Logger.info('Unit deselected');
  }

  private tryMoveUnit(destination: HexCoordinate): void {
    if (!this.gameState.selectedUnit) return;

    const unit = this.gameState.selectedUnit;

    // Check if unit can move (not after attacking)
    if (!unit.canMove()) {
      Logger.info('Cannot move after attacking');
      return;
    }

    // Check if destination is valid
    const isValidMove = this.gameState.validMoveHexes.some(hex =>
      HexUtils.equals(hex, destination)
    );

    if (!isValidMove) {
      Logger.info('Cannot move there');
      return;
    }

    // Calculate movement cost (includes obstacle penalties)
    const path = PathfindingService.findPath(unit.position, destination, this.gameState);
    let movementCost = 0;
    
    // Calculate actual cost including obstacles
    for (const hex of path) {
      const tile = this.gameState.getTileAt(hex);
      const obstacleCost = tile?.obstacle?.movementCost ?? 0;
      movementCost += 1 + obstacleCost; // 1 base + obstacle penalty
    }

    // Move the unit
    const oldPos = unit.position;
    unit.position = destination;
    unit.movementPointsUsed += movementCost;
    unit.hasMovedThisTurn = true;

    Logger.info(`Moved ${unit.type} from (${oldPos.q}, ${oldPos.r}) to (${destination.q}, ${destination.r}) - Used ${movementCost} movement (${unit.getRemainingMovement()} remaining)`);

    // Emit event for move sound
    EventBus.getInstance().emit('unitMoved', { unitId: unit.id, from: oldPos, to: destination });

    // Update fog of war after movement
    this.gameState.updateVision();

    // Update valid move/attack hexes for remaining movement
    this.updateValidHexes(unit);

    // Keep unit selected if it still has movement or can attack
    if (!unit.canMove() && !unit.canAttack()) {
      this.gameState.selectedUnit = null;
      this.gameState.validMoveHexes = [];
      this.gameState.validAttackHexes = [];
      this.gameState.hoveredHex = null;
    }
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

      // After attacking, unit can no longer move
      attacker.hasMovedThisTurn = true;

      // Clear selection and valid hexes
      this.gameState.selectedUnit = null;
      this.gameState.validMoveHexes = [];
      this.gameState.validAttackHexes = [];
    } else {
      Logger.warn('Attack failed');
    }
  }

  /**
   * Convert isometric pixel position to hex coordinate
   * Matches the projection used in renderers
   */
  private pixelToIsometricHex(x: number, y: number): HexCoordinate {
    const hexSize = 50; // Must match BattlefieldRenderer
    const verticalScale = 0.5;

    // Inverse isometric transformation
    const adjustedY = y / verticalScale;
    const q = (x * Math.sqrt(3) / 3 - adjustedY / 3) / hexSize;
    const r = (adjustedY * 2 / 3) / hexSize;

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
