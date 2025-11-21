/**
 * HexTile Model
 * Represents a single hex cell on the battlefield grid
 */

import { HexCoordinate } from './HexCoordinate';
import { Unit } from './Unit';
import { VisibilityState } from '../services/VisionService';

export class HexTile {
  public coordinate: HexCoordinate;
  public isVisible: boolean = false;
  public isExplored: boolean = false;
  public isInBounds: boolean = true;
  public occupiedBy: Unit | null = null;
  public visibilityForPlayer: VisibilityState = VisibilityState.UNEXPLORED;

  constructor(coordinate: HexCoordinate) {
    this.coordinate = coordinate;
  }

  isEmpty(): boolean {
    return this.occupiedBy === null;
  }

  canMoveTo(): boolean {
    return this.isEmpty() && this.isInBounds;
  }

  /**
   * Get the opacity multiplier for this tile based on fog of war
   * @returns Opacity value between 0 and 1
   */
  public getOpacity(): number {
    switch (this.visibilityForPlayer) {
      case VisibilityState.UNEXPLORED:
        return 0.1; // Very dark (10% opacity)
      case VisibilityState.EXPLORED:
        return 0.5; // Dimmed (50% opacity)
      case VisibilityState.VISIBLE:
        return 1.0; // Full brightness
      default:
        return 1.0;
    }
  }
}
