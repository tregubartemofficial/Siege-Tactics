import { HexCoordinate } from '../models/HexCoordinate';
import { HexTile } from '../models/HexTile';
import { Unit } from '../models/Unit';
import { HexUtils } from '../utils/HexUtils';

/**
 * VisionService - Manages fog of war and tile visibility
 * Calculates which tiles are visible, explored, or unexplored for each faction
 */

export enum VisibilityState {
  UNEXPLORED = 'unexplored',  // Never seen (black)
  EXPLORED = 'explored',      // Previously seen (dimmed)
  VISIBLE = 'visible'         // Currently visible (full color)
}

export interface VisionData {
  playerVisibleTiles: Set<string>;    // Currently visible to player
  playerExploredTiles: Set<string>;   // Previously seen by player
  aiVisibleTiles: Set<string>;        // Currently visible to AI
  aiExploredTiles: Set<string>;       // Previously seen by AI
}

export class VisionService {
  private visionData: VisionData;
  private visionRange: number = 4; // Default vision range in hexes

  constructor() {
    this.visionData = {
      playerVisibleTiles: new Set(),
      playerExploredTiles: new Set(),
      aiVisibleTiles: new Set(),
      aiExploredTiles: new Set()
    };
  }

  /**
   * Update vision for all units
   * Call this after units move or at turn start
   */
  public updateVision(
    playerUnits: Unit[],
    aiUnits: Unit[],
    battlefield: Map<string, HexTile>
  ): void {
    // Move current visible tiles to explored before recalculating
    this.visionData.playerVisibleTiles.forEach(key => {
      this.visionData.playerExploredTiles.add(key);
    });
    this.visionData.aiVisibleTiles.forEach(key => {
      this.visionData.aiExploredTiles.add(key);
    });

    // Clear current visible tiles
    this.visionData.playerVisibleTiles.clear();
    this.visionData.aiVisibleTiles.clear();

    // Calculate new visible tiles for player
    playerUnits.forEach(unit => {
      if (!unit.isAlive()) return;
      
      const visibleTiles = this.calculateVisibleTiles(
        unit.position,
        this.visionRange,
        battlefield
      );
      visibleTiles.forEach(key => {
        this.visionData.playerVisibleTiles.add(key);
        this.visionData.playerExploredTiles.add(key);
      });
    });

    // Calculate new visible tiles for AI
    aiUnits.forEach(unit => {
      if (!unit.isAlive()) return;
      
      const visibleTiles = this.calculateVisibleTiles(
        unit.position,
        this.visionRange,
        battlefield
      );
      visibleTiles.forEach(key => {
        this.visionData.aiVisibleTiles.add(key);
        this.visionData.aiExploredTiles.add(key);
      });
    });
  }

  /**
   * Calculate all tiles visible from a position
   * Simple radial vision without obstacle blocking
   */
  private calculateVisibleTiles(
    origin: HexCoordinate,
    range: number,
    battlefield: Map<string, HexTile>
  ): Set<string> {
    const visibleTiles = new Set<string>();
    const originKey = HexUtils.toKey(origin);
    
    // Origin tile is always visible
    visibleTiles.add(originKey);

    // Check all tiles within range
    battlefield.forEach((tile, key) => {
      const distance = HexUtils.distance(origin, tile.coordinate);
      if (distance <= range) {
        visibleTiles.add(key);
      }
    });

    return visibleTiles;
  }

  /**
   * Get visibility state for a tile from player's perspective
   */
  public getTileVisibilityForPlayer(tileKey: string): VisibilityState {
    if (this.visionData.playerVisibleTiles.has(tileKey)) {
      return VisibilityState.VISIBLE;
    }
    if (this.visionData.playerExploredTiles.has(tileKey)) {
      return VisibilityState.EXPLORED;
    }
    return VisibilityState.UNEXPLORED;
  }

  /**
   * Get visibility state for a tile from AI's perspective
   */
  public getTileVisibilityForAI(tileKey: string): VisibilityState {
    if (this.visionData.aiVisibleTiles.has(tileKey)) {
      return VisibilityState.VISIBLE;
    }
    if (this.visionData.aiExploredTiles.has(tileKey)) {
      return VisibilityState.EXPLORED;
    }
    return VisibilityState.UNEXPLORED;
  }

  /**
   * Check if a unit is visible to the player
   */
  public isUnitVisibleToPlayer(unit: Unit): boolean {
    const key = HexUtils.toKey(unit.position);
    return this.visionData.playerVisibleTiles.has(key);
  }

  /**
   * Check if a unit is visible to the AI
   */
  public isUnitVisibleToAI(unit: Unit): boolean {
    const key = HexUtils.toKey(unit.position);
    return this.visionData.aiVisibleTiles.has(key);
  }

  /**
   * Get all player visible tiles
   */
  public getPlayerVisibleTiles(): Set<string> {
    return this.visionData.playerVisibleTiles;
  }

  /**
   * Get all AI visible tiles
   */
  public getAIVisibleTiles(): Set<string> {
    return this.visionData.aiVisibleTiles;
  }

  /**
   * Set custom vision range for all units
   */
  public setVisionRange(range: number): void {
    this.visionRange = Math.max(1, Math.min(10, range)); // Clamp 1-10
  }

  /**
   * Get current vision range
   */
  public getVisionRange(): number {
    return this.visionRange;
  }

  /**
   * Reset all vision data (for new game)
   */
  public reset(): void {
    this.visionData.playerVisibleTiles.clear();
    this.visionData.playerExploredTiles.clear();
    this.visionData.aiVisibleTiles.clear();
    this.visionData.aiExploredTiles.clear();
  }
}
