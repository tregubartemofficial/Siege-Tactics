/**
 * HexTile Model
 * Represents a single hex cell on the battlefield grid
 */

import { HexCoordinate } from './HexCoordinate';
import { Unit } from './Unit';

export class HexTile {
  public coordinate: HexCoordinate;
  public isVisible: boolean = false;
  public isExplored: boolean = false;
  public isInBounds: boolean = true;
  public occupiedBy: Unit | null = null;

  constructor(coordinate: HexCoordinate) {
    this.coordinate = coordinate;
  }

  isEmpty(): boolean {
    return this.occupiedBy === null;
  }

  canMoveTo(): boolean {
    return this.isEmpty() && this.isInBounds;
  }
}
