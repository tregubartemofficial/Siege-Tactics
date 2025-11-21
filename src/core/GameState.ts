/**
 * GameState - Central State Management
 * Represents the current state of an active battle
 */

import { Unit } from '../models/Unit';
import { HexTile } from '../models/HexTile';
import { HexCoordinate } from '../models/HexCoordinate';
import { WeaponType, PlayerType, CONSTANTS } from '../utils/Constants';
import { HexUtils } from '../utils/HexUtils';
import { VisionService } from '../services/VisionService';

export class GameState {
  // Core state
  public battlefield: Map<string, HexTile> = new Map();
  public playerUnits: Unit[] = [];
  public aiUnits: Unit[] = [];
  public currentTurn: PlayerType = 'player';
  public selectedUnit: Unit | null = null;
  public shrinkRadius: number = CONSTANTS.GRID_RADIUS;
  public turnCount: number = 0;
  
  // Fog of War
  public visionService: VisionService;
  
  // Transient state
  public hoveredHex: HexCoordinate | null = null;
  public validMoveHexes: HexCoordinate[] = [];
  public validAttackHexes: HexCoordinate[] = [];
  public plannedPath: HexCoordinate[] = [];
  public isAnimating: boolean = false;

  constructor() {
    this.visionService = new VisionService();
  }

  public initialize(playerWeapon: WeaponType): void {
    this.createBattlefield();
    this.spawnUnits(playerWeapon);
    this.currentTurn = 'player';
    this.turnCount = 0;
    this.visionService.reset();
    
    // Initial vision calculation
    this.updateVision();
  }

  private createBattlefield(): void {
    // Create hex grid using cube coordinates
    for (let q = -CONSTANTS.GRID_RADIUS; q <= CONSTANTS.GRID_RADIUS; q++) {
      for (let r = -CONSTANTS.GRID_RADIUS; r <= CONSTANTS.GRID_RADIUS; r++) {
        const coord = HexUtils.create(q, r);
        if (HexUtils.inBounds(coord)) {
          const tile = new HexTile(coord);
          this.battlefield.set(HexUtils.toKey(coord), tile);
        }
      }
    }
  }

  private spawnUnits(playerWeapon: WeaponType): void {
    // Spawn player unit at bottom
    const playerStart = HexUtils.create(-3, 5);
    const playerUnit = new Unit('player-1', playerWeapon, 'player', playerStart);
    this.playerUnits.push(playerUnit);
    
    const playerTile = this.getTileAt(playerStart);
    if (playerTile) {
      playerTile.occupiedBy = playerUnit;
    }
    
    // Spawn AI unit at top
    const aiStart = HexUtils.create(3, -5);
    const aiUnit = new Unit('ai-1', 'catapult', 'ai', aiStart);
    this.aiUnits.push(aiUnit);
    
    const aiTile = this.getTileAt(aiStart);
    if (aiTile) {
      aiTile.occupiedBy = aiUnit;
    }
  }

  public switchTurn(newTurn: PlayerType): void {
    this.currentTurn = newTurn;
    this.resetUnitActions();
    this.selectedUnit = null;
    this.validMoveHexes = [];
    this.validAttackHexes = [];
    this.plannedPath = [];
    
    if (newTurn === 'player') {
      this.turnCount++;
      
      // Shrink map every 5 turns
      if (this.turnCount % CONSTANTS.SHRINK_INTERVAL === 0) {
        this.shrinkRadius = Math.max(CONSTANTS.MIN_SHRINK_RADIUS, this.shrinkRadius - 1);
        this.updateBoundaries();
      }
    }
    
    // Update vision at start of each turn
    this.updateVision();
  }

  private resetUnitActions(): void {
    const units = this.currentTurn === 'player' ? this.playerUnits : this.aiUnits;
    units.forEach(unit => unit.resetTurnActions());
  }

  private updateBoundaries(): void {
    this.battlefield.forEach(tile => {
      const distance = HexUtils.distance(tile.coordinate, HexUtils.create(0, 0));
      tile.isInBounds = distance <= this.shrinkRadius;
    });
  }

  public checkVictoryCondition(): 'player' | 'ai' | null {
    const aliveAI = this.aiUnits.filter(u => u.isAlive());
    const alivePlayers = this.playerUnits.filter(u => u.isAlive());
    
    if (aliveAI.length === 0) return 'player';
    if (alivePlayers.length === 0) return 'ai';
    return null;
  }

  public getTileAt(coord: HexCoordinate): HexTile | null {
    return this.battlefield.get(HexUtils.toKey(coord)) || null;
  }

  public getAllTiles(): HexTile[] {
    return Array.from(this.battlefield.values());
  }

  public update(_deltaTime: number): void {
    // Update animations, timers, etc. (to be implemented)
  }

  /**
   * Update fog of war vision for all units
   * Updates both VisionService and tile visibility states
   */
  public updateVision(): void {
    this.visionService.updateVision(
      this.playerUnits,
      this.aiUnits,
      this.battlefield
    );
    
    // Update tile visibility states from VisionService
    this.battlefield.forEach((tile, key) => {
      tile.visibilityForPlayer = this.visionService.getTileVisibilityForPlayer(key);
    });
  }
}
