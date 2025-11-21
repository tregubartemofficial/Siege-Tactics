/**
 * HexUtils - Hexagonal Grid Utilities
 * Based on Red Blob Games hex coordinate algorithms
 * Uses cube coordinate system where q + r + s = 0
 */

import { CONSTANTS } from './Constants';

export interface HexCoordinate {
  q: number;
  r: number;
  s: number;
}

export class HexUtils {
  /**
   * Create a hex coordinate from q and r
   * s is automatically calculated to maintain q + r + s = 0
   */
  static create(q: number, r: number): HexCoordinate {
    return { q, r, s: -q - r };
  }

  /**
   * Calculate distance between two hexes
   */
  static distance(a: HexCoordinate, b: HexCoordinate): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
  }

  /**
   * Check if two coordinates are equal
   */
  static equals(a: HexCoordinate, b: HexCoordinate): boolean {
    return a.q === b.q && a.r === b.r && a.s === b.s;
  }

  /**
   * Get all 6 neighboring hexes
   */
  static neighbors(hex: HexCoordinate): HexCoordinate[] {
    const directions: [number, number, number][] = [
      [+1, -1, 0], [+1, 0, -1], [0, +1, -1],
      [-1, +1, 0], [-1, 0, +1], [0, -1, +1]
    ];

    return directions.map(([dq, dr, ds]) => ({
      q: hex.q + dq,
      r: hex.r + dr,
      s: hex.s + ds
    }));
  }

  /**
   * Check if hex is within grid bounds
   */
  static inBounds(hex: HexCoordinate, radius: number = CONSTANTS.GRID_RADIUS): boolean {
    return Math.abs(hex.q) <= radius && 
           Math.abs(hex.r) <= radius && 
           Math.abs(hex.s) <= radius;
  }

  /**
   * Get all hexes within a given range
   */
  static getHexesInRange(center: HexCoordinate, range: number): HexCoordinate[] {
    const results: HexCoordinate[] = [];
    
    for (let q = -range; q <= range; q++) {
      for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
        const hex = this.create(center.q + q, center.r + r);
        results.push(hex);
      }
    }
    
    return results;
  }

  /**
   * Convert hex coordinate to pixel position (for rendering)
   */
  static hexToPixel(hex: HexCoordinate, hexSize: number = CONSTANTS.HEX_SIZE): { x: number; y: number } {
    const x = hexSize * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
    const y = hexSize * (3 / 2 * hex.r);
    return { x, y };
  }

  /**
   * Convert pixel position to hex coordinate (for mouse interaction)
   */
  static pixelToHex(x: number, y: number, hexSize: number = CONSTANTS.HEX_SIZE): HexCoordinate {
    const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / hexSize;
    const r = (2 / 3 * y) / hexSize;
    return this.hexRound({ q, r, s: -q - r });
  }

  /**
   * Round fractional hex coordinates to nearest hex
   */
  private static hexRound(hex: HexCoordinate): HexCoordinate {
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

  /**
   * Create a unique string key for a hex coordinate (for Maps/Sets)
   */
  static toKey(hex: HexCoordinate): string {
    return `${hex.q},${hex.r}`;
  }

  /**
   * Parse a hex coordinate from a string key
   */
  static fromKey(key: string): HexCoordinate {
    const [q, r] = key.split(',').map(Number);
    return this.create(q, r);
  }
}
