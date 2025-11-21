# Story 03: Hex Pathfinding Service

**Story ID:** SIEGE-003  
**Title:** Implement A* Pathfinding for Hex Grid Movement  
**Priority:** P0 (Critical)  
**Estimate:** 3 Story Points (~2 hours)  
**Sprint:** MVP Sprint 1  
**Dependencies:** None (Foundation complete)

---

## User Story

**As a** player  
**I want to** move my unit across the battlefield along valid paths  
**So that** I can position my siege weapon strategically

---

## Business Context

Pathfinding is core gameplay logic that determines where units can move. This service must:
- Calculate all valid movement destinations within unit's movement range
- Find shortest path from unit's position to target hex
- Respect battlefield obstacles (occupied hexes)
- Account for shrinking battlefield boundaries

This implements the movement mechanics from PRD Story 1 (Hex-Grid Battlefield Navigation).

---

## Acceptance Criteria

### AC1: Valid Movement Range Calculation
- [ ] Given a unit position and movement range, return all reachable hexes
- [ ] Movement range respects hex distance (not Euclidean distance)
- [ ] Occupied hexes are excluded from valid destinations
- [ ] Hexes outside battlefield bounds excluded
- [ ] Hexes in shrink zone excluded (optional for MVP)

### AC2: A* Pathfinding Implementation
- [ ] Find shortest path between two hex coordinates
- [ ] Path avoids occupied hexes
- [ ] Path uses hex grid distance heuristic
- [ ] Returns array of hex coordinates representing path
- [ ] Returns empty array if no valid path exists

### AC3: Hex Distance Calculation
- [ ] Calculate hex distance using cube coordinate formula
- [ ] Distance accounts for hex grid topology (not straight line)
- [ ] Distance function pure (no side effects)

### AC4: Neighbor Hex Calculation
- [ ] Given a hex coordinate, return all 6 adjacent hexes
- [ ] Neighbors filtered to only include in-bounds hexes
- [ ] Neighbors excludes occupied positions

### AC5: Integration with GameState
- [ ] Service accepts GameState reference for battlefield data
- [ ] Checks unit occupation from playerUnits and aiUnits
- [ ] Respects current shrinkRadius boundary

---

## Technical Implementation Details

### File to Create

#### Primary File: `src/services/PathfindingService.ts`

**Location:** `src/services/PathfindingService.ts`

**Class Structure:**
```typescript
import { HexCoordinate } from '../models/HexCoordinate';
import { GameState } from '../core/GameState';
import { HexUtils } from '../utils/HexUtils';

export class PathfindingService {
  /**
   * Calculate all hexes reachable within movement range
   * @param start Starting hex coordinate
   * @param movementRange Maximum movement distance
   * @param gameState Current game state for obstacle checking
   * @returns Array of reachable hex coordinates
   */
  public static getReachableHexes(
    start: HexCoordinate,
    movementRange: number,
    gameState: GameState
  ): HexCoordinate[] {
    const reachable: HexCoordinate[] = [];
    const visited = new Set<string>();
    
    // Flood fill algorithm
    const queue: Array<{coord: HexCoordinate, distance: number}> = [{coord: start, distance: 0}];
    
    while (queue.length > 0) {
      const {coord, distance} = queue.shift()!;
      const key = HexUtils.toKey(coord);
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      // Add to reachable if within range and not occupied
      if (distance <= movementRange && distance > 0) {
        if (!this.isOccupied(coord, gameState)) {
          reachable.push(coord);
        }
      }
      
      // Explore neighbors if within movement range
      if (distance < movementRange) {
        const neighbors = this.getNeighbors(coord, gameState);
        neighbors.forEach(neighbor => {
          if (!visited.has(HexUtils.toKey(neighbor))) {
            queue.push({coord: neighbor, distance: distance + 1});
          }
        });
      }
    }
    
    return reachable;
  }

  /**
   * Find shortest path between two hexes using A*
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
    if (this.isOccupied(goal, gameState) || !HexUtils.inBounds(goal)) {
      return [];
    }
    
    const openSet = new Set<string>([HexUtils.toKey(start)]);
    const cameFrom = new Map<string, HexCoordinate>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    gScore.set(HexUtils.toKey(start), 0);
    fScore.set(HexUtils.toKey(start), this.hexDistance(start, goal));
    
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
      if (currentKey === HexUtils.toKey(goal)) {
        return this.reconstructPath(cameFrom, current);
      }
      
      openSet.delete(currentKey);
      
      // Explore neighbors
      const neighbors = this.getNeighbors(current, gameState);
      neighbors.forEach(neighbor => {
        const neighborKey = HexUtils.toKey(neighbor);
        const tentativeGScore = (gScore.get(currentKey) ?? Infinity) + 1;
        
        if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, current!);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + this.hexDistance(neighbor, goal));
          
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
   * Calculate hex distance between two coordinates (cube coordinate distance)
   */
  public static hexDistance(a: HexCoordinate, b: HexCoordinate): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
  }

  /**
   * Get all valid neighboring hexes
   */
  private static getNeighbors(coord: HexCoordinate, gameState: GameState): HexCoordinate[] {
    // Six directions in cube coordinates
    const directions: HexCoordinate[] = [
      {q: 1, r: 0, s: -1},
      {q: 1, r: -1, s: 0},
      {q: 0, r: -1, s: 1},
      {q: -1, r: 0, s: 1},
      {q: -1, r: 1, s: 0},
      {q: 0, r: 1, s: -1}
    ];
    
    return directions
      .map(dir => ({
        q: coord.q + dir.q,
        r: coord.r + dir.r,
        s: coord.s + dir.s
      }))
      .filter(neighbor => {
        // Must be in bounds
        if (!HexUtils.inBounds(neighbor)) return false;
        
        // Can traverse through occupied hexes for pathfinding
        // (but can't stop on them - checked in getReachableHexes)
        return true;
      });
  }

  /**
   * Check if hex is occupied by any unit
   */
  private static isOccupied(coord: HexCoordinate, gameState: GameState): boolean {
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
   * Reconstruct path from A* cameFrom map
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
}
```

### Integration Points

**GameEngine.ts Usage:**

When player clicks hex to move:

```typescript
import { PathfindingService } from '../services/PathfindingService';

private handleHexClicked(targetHex: HexCoordinate): void {
  if (!this.gameState.selectedUnit) return;
  
  const unit = this.gameState.selectedUnit;
  const movementRange = unit.getMovementRange();
  
  // Calculate valid moves
  const reachableHexes = PathfindingService.getReachableHexes(
    unit.position,
    movementRange,
    this.gameState
  );
  
  // Check if target is reachable
  const isReachable = reachableHexes.some(
    hex => HexUtils.toKey(hex) === HexUtils.toKey(targetHex)
  );
  
  if (isReachable) {
    // Find path and move unit
    const path = PathfindingService.findPath(
      unit.position,
      targetHex,
      this.gameState
    );
    
    if (path.length > 0) {
      // Animate movement along path (Story 05)
      unit.position = targetHex;
      unit.hasMovedThisTurn = true;
      this.eventBus.emit('unitMoved', {unit, path});
    }
  }
}
```

**GameState.ts Usage:**

Store valid move hexes for rendering:

```typescript
import { PathfindingService } from '../services/PathfindingService';

public selectUnit(unit: Unit): void {
  this.selectedUnit = unit;
  
  // Calculate valid moves for rendering
  this.validMoveHexes = PathfindingService.getReachableHexes(
    unit.position,
    unit.getMovementRange(),
    this
  );
  
  // Also calculate attack range (Story 04)
}
```

### HexUtils.ts Extensions

Add these helper methods to `src/utils/HexUtils.ts`:

```typescript
/**
 * Convert hex coordinate to string key for Map/Set storage
 */
public static toKey(coord: HexCoordinate): string {
  return `${coord.q},${coord.r},${coord.s}`;
}

/**
 * Convert string key back to hex coordinate
 */
public static fromKey(key: string): HexCoordinate {
  const [q, r, s] = key.split(',').map(Number);
  return {q, r, s};
}
```

---

## Testing Instructions

### Unit Test Cases (Manual Console Testing)

Add to `main.ts` for testing:

```typescript
// Test 1: Hex Distance Calculation
const hexA = HexUtils.create(0, 0);
const hexB = HexUtils.create(3, 2);
const distance = PathfindingService.hexDistance(hexA, hexB);
console.log(`Distance: ${distance}`); // Expected: 5

// Test 2: Reachable Hexes
const gameState = new GameState();
gameState.initialize(WeaponType.CATAPULT);
const playerUnit = gameState.playerUnits[0];
const reachable = PathfindingService.getReachableHexes(
  playerUnit.position,
  3, // movement range
  gameState
);
console.log(`Reachable hexes: ${reachable.length}`); // Should be ~18 hexes

// Test 3: Pathfinding
const start = HexUtils.create(0, 0);
const goal = HexUtils.create(2, 1);
const path = PathfindingService.findPath(start, goal, gameState);
console.log(`Path length: ${path.length}`); // Should be 3
console.log(`Path:`, path);
```

### Visual Verification (After Rendering Integration)

1. Select unit
2. Valid movement hexes should be highlighted (blue overlay)
3. Click valid hex → unit should move to it
4. Click occupied hex → no movement should occur
5. Click hex outside range → no movement should occur

### Performance Testing

```typescript
// Test pathfinding performance
const startTime = performance.now();
for (let i = 0; i < 1000; i++) {
  PathfindingService.findPath(hexA, hexB, gameState);
}
const endTime = performance.now();
console.log(`1000 pathfinds: ${endTime - startTime}ms`);
// Should be < 100ms total (0.1ms per pathfind)
```

---

## Edge Cases & Error Handling

### Edge Case 1: Start and Goal Same Hex
- Should return empty path array
- No movement occurs

### Edge Case 2: Goal Occupied by Unit
- Should return empty path array
- Unit cannot move to occupied hex

### Edge Case 3: No Valid Path Exists
- A* returns empty array
- UI should indicate invalid move (red flash on hex)

### Edge Case 4: Movement Range Zero
- getReachableHexes returns empty array
- Unit cannot move (immobilized)

### Edge Case 5: Start Position Out of Bounds
- Should return empty arrays
- Log warning about invalid state

---

## Definition of Done

- [ ] `PathfindingService.ts` created with all methods
- [ ] `getReachableHexes()` correctly calculates valid moves
- [ ] `findPath()` returns shortest path using A*
- [ ] `hexDistance()` calculates correct cube coordinate distance
- [ ] Neighbor calculation returns all 6 valid adjacent hexes
- [ ] Occupied hex detection works for player and AI units
- [ ] No TypeScript compilation errors
- [ ] Manual console tests pass
- [ ] Performance: pathfinding < 1ms per call
- [ ] Code reviewed for clarity and correctness

---

## Related Stories

- **Blocks:** Story 05 (Game Loop Integration - movement)
- **Depends On:** None (uses existing foundation)
- **Related:** PRD Story 1 (Hex-Grid Battlefield Navigation)

---

## Notes for Developer

**Algorithm References:**

- **A* Algorithm:** Classic graph search, optimal for pathfinding
- **Flood Fill:** BFS variant for reachable hex calculation
- **Cube Coordinates:** Red Blob Games hexagonal grids guide

**Implementation Tips:**

1. **Cube Coordinate Math:** Always verify q + r + s = 0 invariant
2. **String Keys:** Use "q,r,s" format for Map/Set storage
3. **Visited Set:** Prevents infinite loops in graph traversal
4. **Heuristic Function:** hexDistance is admissible for A*

**Common Pitfalls:**

- Forgetting to filter in-bounds neighbors
- Not excluding occupied hexes from destination
- Off-by-one errors in distance calculation
- Infinite loops without visited set
- Performance: use Set/Map, not Array.find()

**Time Estimates:**

- Basic hex distance: 10 minutes
- Neighbor calculation: 15 minutes
- Reachable hexes (flood fill): 30 minutes
- A* pathfinding: 45 minutes
- Testing and debugging: 20 minutes

**Total: ~2 hours**

---

**Story Created By:** Bob (Scrum Master)  
**Date:** November 21, 2025  
**Status:** Ready for Development
