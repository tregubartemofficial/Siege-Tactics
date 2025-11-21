import { GameState } from '../core/GameState';
import { HexCoordinate } from '../models/HexCoordinate';
import { HexUtils } from '../utils/HexUtils';
import { PathfindingService } from '../services/PathfindingService';
import { Logger } from '../utils/Logger';

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

    // Only player can interact during their turn
    if (this.gameState.currentTurn !== 'player') {
      Logger.info('Not your turn!');
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

    // If unit is selected, try to move
    if (this.gameState.selectedUnit) {
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
    
    // Calculate reachable hexes
    this.gameState.validMoveHexes = PathfindingService.getReachableHexes(
      unit.position,
      unit.getMovementRange(),
      this.gameState
    );

    Logger.info(`Selected ${unit.type} at (${unit.position.q}, ${unit.position.r})`);
    Logger.info(`Can move to ${this.gameState.validMoveHexes.length} hexes`);
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

    // Clear selection
    this.gameState.selectedUnit = null;
    this.gameState.validMoveHexes = [];
    this.gameState.hoveredHex = null;
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
