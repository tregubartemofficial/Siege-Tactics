import { HexCoordinate } from '../models/HexCoordinate';
import { GameState } from '../core/GameState';
import { HexUtils } from '../utils/HexUtils';
import { CONSTANTS } from '../utils/Constants';

/**
 * PathfindingService - A* Pathfinding for Hex Grid
 * Implements movement range calculation and shortest path finding
 * Based on Red Blob Games hex algorithms
 */
export class PathfindingService {
  /**
   * Calculate all hexes reachable within movement range
   * Uses breadth-first flood fill with movement cost tracking
   * Respects obstacles that block or slow movement
   * 
   * @param start Starting hex coordinate
   * @param movementRange Maximum movement points available
   * @param gameState Current game state for obstacle checking
   * @returns Array of reachable hex coordinates
   */
  public static getReachableHexes(
    start: HexCoordinate,
    movementRange: number,
    gameState: GameState
  ): HexCoordinate[] {
    const reachable: HexCoordinate[] = [];
    const visited = new Map<string, number>(); // key -> cost to reach
    
    // BFS flood fill tracking actual movement cost
    const queue: Array<{coord: HexCoordinate, cost: number}> = [{coord: start, cost: 0}];
    visited.set(HexUtils.toKey(start), 0);
    
    while (queue.length > 0) {
      const {coord, cost} = queue.shift()!;
      
      // Add to reachable if not the starting position
      if (cost > 0) {
        // Can only stop on unoccupied hexes
        if (!this.isOccupiedByUnit(coord, gameState) && this.isInPlayableArea(coord, gameState)) {
          reachable.push(coord);
        }
      }
      
      // Explore neighbors if we have movement points left
      if (cost < movementRange) {
        const neighbors = HexUtils.neighbors(coord);
        
        for (const neighbor of neighbors) {
          // Must be in bounds and playable area
          if (!HexUtils.inBounds(neighbor, CONSTANTS.GRID_RADIUS)) continue;
          if (!this.isInPlayableArea(neighbor, gameState)) continue;
          
          // Calculate movement cost (1 + obstacle penalty)
          const moveCost = this.getMovementCost(neighbor, gameState);
          
          // Skip impassable tiles (Infinity cost = blocked by obstacle)
          if (moveCost === Infinity) continue;
          
          // Each hex costs 1 movement point + obstacle penalty
          const newCost = cost + 1 + moveCost;
          
          // Only visit if within range and cheaper than before
          const neighborKey = HexUtils.toKey(neighbor);
          const previousCost = visited.get(neighborKey) ?? Infinity;
          
          if (newCost <= movementRange && newCost < previousCost) {
            visited.set(neighborKey, newCost);
            queue.push({coord: neighbor, cost: newCost});
          }
        }
      }
    }
    
    return reachable;
  }

  /**
   * Find shortest path between two hexes using A* algorithm
   * 
   * @param start Starting hex coordinate
   * @param goal Target hex coordinate
   * @param gameState Current game state for obstacle checking
   * @returns Array of hex coordinates representing path (excluding start, including goal)
   */
  public static findPath(
    start: HexCoordinate,
    goal: HexCoordinate,
    gameState: GameState
  ): HexCoordinate[] {
    // Check if goal is valid
    if (this.isOccupiedByUnit(goal, gameState) || !this.isInPlayableArea(goal, gameState)) {
      return [];
    }
    
    // Check if goal has impassable obstacle
    const goalTile = gameState.getTileAt(goal);
    if (goalTile?.obstacle?.movementCost === Infinity) {
      return [];
    }
    
    // A* data structures
    const openSet = new Set<string>([HexUtils.toKey(start)]);
    const cameFrom = new Map<string, HexCoordinate>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    gScore.set(HexUtils.toKey(start), 0);
    fScore.set(HexUtils.toKey(start), HexUtils.distance(start, goal));
    
    while (openSet.size > 0) {
      // Get hex with lowest fScore
      let current: HexCoordinate | null = null;
      let lowestF = Infinity;
      
      openSet.forEach(key => {
        const f = fScore.get(key) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = HexUtils.fromKey(key);
        }
      });
      
      if (!current) break;
      
      const currentKey = HexUtils.toKey(current);
      
      // Goal reached
      if (HexUtils.equals(current, goal)) {
        return this.reconstructPath(cameFrom, current);
      }
      
      openSet.delete(currentKey);
      
      // Explore neighbors
      const neighbors = this.getValidNeighbors(current, gameState);
      neighbors.forEach(neighbor => {
        const neighborKey = HexUtils.toKey(neighbor);
        
        // Calculate actual movement cost (1 + obstacle penalty)
        const moveCost = this.getMovementCost(neighbor, gameState);
        const tentativeGScore = (gScore.get(currentKey) ?? Infinity) + 1 + moveCost;
        
        if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, current!);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + HexUtils.distance(neighbor, goal));
          
          if (!openSet.has(neighborKey)) {
            openSet.add(neighborKey);
          }
        }
      });
    }
    
    // No path found
    return [];
  }

  /**
   * Get all valid neighboring hexes (in bounds, not blocked by obstacles)
   * 
   * @param coord Current hex coordinate
   * @param gameState Current game state
   * @returns Array of valid neighbor coordinates
   */
  private static getValidNeighbors(coord: HexCoordinate, gameState: GameState): HexCoordinate[] {
    return HexUtils.neighbors(coord).filter(neighbor => {
      // Must be in bounds
      if (!HexUtils.inBounds(neighbor, CONSTANTS.GRID_RADIUS)) return false;
      
      // Must be in playable area (not in shrink zone)
      if (!this.isInPlayableArea(neighbor, gameState)) return false;
      
      // Cannot path through impassable obstacles (Infinity cost)
      const moveCost = this.getMovementCost(neighbor, gameState);
      if (moveCost === Infinity) return false;
      
      // Can traverse through occupied hexes for pathfinding
      // (but can't stop on them - checked in getReachableHexes and goal validation)
      return true;
    });
  }

  /**
   * Get movement cost for a hex (includes obstacle costs)
   * 
   * @param coord Hex coordinate
   * @param gameState Current game state
   * @returns Movement cost (0 = normal, 0.5 = difficult, Infinity = impassable)
   */
  private static getMovementCost(coord: HexCoordinate, gameState: GameState): number {
    const tile = gameState.getTileAt(coord);
    return tile?.obstacle?.movementCost ?? 0;
  }

  /**
   * Check if hex is occupied by a unit
   * 
   * @param coord Hex coordinate to check
   * @param gameState Current game state
   * @returns True if hex is occupied by a unit
   */
  private static isOccupiedByUnit(coord: HexCoordinate, gameState: GameState): boolean {
    const key = HexUtils.toKey(coord);
    
    // Check player units
    const playerOccupied = gameState.playerUnits.some(
      unit => HexUtils.toKey(unit.position) === key
    );
    
    // Check AI units
    const aiOccupied = gameState.aiUnits.some(
      unit => HexUtils.toKey(unit.position) === key
    );
    
    return playerOccupied || aiOccupied;
  }

  /**
   * Check if hex is in playable area (not in shrink zone)
   * 
   * @param coord Hex coordinate to check
   * @param gameState Current game state
   * @returns True if hex is in playable area
   */
  private static isInPlayableArea(coord: HexCoordinate, gameState: GameState): boolean {
    const center = HexUtils.create(0, 0);
    const distanceFromCenter = HexUtils.distance(coord, center);
    return distanceFromCenter <= gameState.shrinkRadius;
  }

  /**
   * Reconstruct path from A* cameFrom map
   * 
   * @param cameFrom Map of hex -> previous hex in path
   * @param current Goal hex coordinate
   * @returns Array of hex coordinates from start to goal (excluding start)
   */
  private static reconstructPath(
    cameFrom: Map<string, HexCoordinate>,
    current: HexCoordinate
  ): HexCoordinate[] {
    const path: HexCoordinate[] = [current];
    let currentKey = HexUtils.toKey(current);
    
    while (cameFrom.has(currentKey)) {
      current = cameFrom.get(currentKey)!;
      currentKey = HexUtils.toKey(current);
      path.unshift(current);
    }
    
    // Remove start position (first element)
    path.shift();
    
    return path;
  }

  /**
   * Check if a move from one hex to another is valid
   * 
   * @param from Starting hex
   * @param to Destination hex
   * @param movementRange Unit's movement range
   * @param gameState Current game state
   * @returns True if move is valid
   */
  public static isValidMove(
    from: HexCoordinate,
    to: HexCoordinate,
    movementRange: number,
    gameState: GameState
  ): boolean {
    // Check if destination is within range
    const distance = HexUtils.distance(from, to);
    if (distance > movementRange) return false;
    
    // Check if destination is reachable
    const reachableHexes = this.getReachableHexes(from, movementRange, gameState);
    return reachableHexes.some(hex => HexUtils.equals(hex, to));
  }
}
