# Story 09: Fog of War System

**Story ID:** SIEGE-009  
**Story Points:** 3  
**Priority:** High  
**Dependencies:** Story 01 (Battlefield Rendering), Story 02 (Unit Rendering)

## User Story
As a player, I want to see only the tiles within my units' vision range and previously explored areas, so that I must use tactical positioning and reconnaissance to reveal the enemy's location and movements.

## Description
Implement a fog of war system that limits visibility for both the player and AI. Each unit has a vision range that reveals tiles within a certain hex distance. Tiles outside vision range are either completely hidden (unexplored) or shown in a dimmed state (previously explored but not currently visible). This adds strategic depth by requiring players to scout and position units carefully.

## Acceptance Criteria

### 1. Visibility States
- [ ] Three tile visibility states: **Unexplored** (black/hidden), **Explored** (dimmed/gray), **Visible** (full color)
- [ ] Each unit has a vision range property (default: 3 hexes)
- [ ] All tiles within vision range of any friendly unit are **Visible**
- [ ] Previously visible tiles become **Explored** when no longer in range
- [ ] Unexplored tiles are completely black with no terrain details

### 2. Vision Calculation
- [ ] Vision range calculated using hex distance from each unit
- [ ] Vision blocked by obstacles (rocks, walls, ruins from Story 07)
- [ ] Line of sight check: obstacles block vision to tiles behind them
- [ ] Vision updates automatically when units move
- [ ] Efficient caching to avoid recalculating every frame

### 3. Rendering Integration
- [ ] Unexplored tiles render as solid black hexes
- [ ] Explored tiles render with 40% opacity (dimmed)
- [ ] Visible tiles render at 100% opacity (full color)
- [ ] Enemy units only visible when in player's vision range
- [ ] Fog of war overlay renders on top of terrain but below UI

### 4. Gameplay Rules
- [ ] Player cannot see enemy units outside vision range
- [ ] Player cannot target enemies outside vision range
- [ ] AI has same vision restrictions (fair play)
- [ ] Obstacles revealed when within vision range
- [ ] At game start, only tiles around player units are visible

### 5. Performance
- [ ] Vision calculation completes in <16ms (60 FPS)
- [ ] Only recalculate when units move or are destroyed
- [ ] Use spatial caching for line-of-sight checks
- [ ] No frame drops during vision updates

## Technical Implementation

### File 1: `src/services/VisionService.ts`

```typescript
/**
 * Vision Service - Manages fog of war and tile visibility
 * 
 * Responsibilities:
 * - Calculate visible tiles for each faction
 * - Track explored vs unexplored tiles
 * - Perform line-of-sight checks with obstacle blocking
 * - Cache vision data for performance
 */

import { HexCoordinate } from '../models/HexCoordinate';
import { HexTile } from '../models/HexTile';
import { Unit } from '../models/Unit';
import { HexUtils } from '../utils/HexUtils';

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
  private visionRange: number = 3; // Default vision range in hexes
  private needsUpdate: boolean = true;

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
      const visibleTiles = this.calculateVisibleTiles(
        unit.position,
        this.visionRange,
        battlefield
      );
      visibleTiles.forEach(key => {
        this.visionData.playerVisibleTiles.add(key);
        this.visionData.playerExploredTiles.add(key); // Also mark as explored
      });
    });

    // Calculate new visible tiles for AI
    aiUnits.forEach(unit => {
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

    this.needsUpdate = false;
  }

  /**
   * Calculate all tiles visible from a position
   * Uses line-of-sight with obstacle blocking
   */
  private calculateVisibleTiles(
    origin: HexCoordinate,
    range: number,
    battlefield: Map<string, HexTile>
  ): Set<string> {
    const visibleTiles = new Set<string>();
    const originKey = HexUtils.getKey(origin);
    
    // Origin tile is always visible
    visibleTiles.add(originKey);

    // Get all tiles within range
    const tilesInRange = this.getTilesInRange(origin, range, battlefield);

    // Check line of sight to each tile
    tilesInRange.forEach(targetKey => {
      const targetTile = battlefield.get(targetKey);
      if (!targetTile) return;

      if (this.hasLineOfSight(origin, targetTile.coordinate, battlefield)) {
        visibleTiles.add(targetKey);
      }
    });

    return visibleTiles;
  }

  /**
   * Get all tiles within hex distance range
   */
  private getTilesInRange(
    origin: HexCoordinate,
    range: number,
    battlefield: Map<string, HexTile>
  ): Set<string> {
    const tilesInRange = new Set<string>();

    // Iterate through cube coordinates within range
    for (let q = -range; q <= range; q++) {
      for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
        const s = -q - r;
        const coord: HexCoordinate = {
          q: origin.q + q,
          r: origin.r + r,
          s: origin.s + s
        };

        const key = HexUtils.getKey(coord);
        if (battlefield.has(key)) {
          tilesInRange.add(key);
        }
      }
    }

    return tilesInRange;
  }

  /**
   * Check if there's line of sight between two hex coordinates
   * Obstacles block line of sight
   */
  private hasLineOfSight(
    from: HexCoordinate,
    to: HexCoordinate,
    battlefield: Map<string, HexTile>
  ): boolean {
    // Use Bresenham-style line algorithm for hexes
    const distance = HexUtils.distance(from, to);
    
    if (distance === 0) return true; // Same tile
    if (distance === 1) return true; // Adjacent tiles always visible

    // Check each tile along the line
    for (let i = 1; i < distance; i++) {
      const t = i / distance;
      const interpolated = this.hexLerp(from, to, t);
      const rounded = this.hexRound(interpolated);
      
      const key = HexUtils.getKey(rounded);
      const tile = battlefield.get(key);

      // If tile has obstacle, it blocks line of sight
      if (tile?.obstacle && tile.obstacle.blocksLineOfSight) {
        return false;
      }
    }

    return true;
  }

  /**
   * Linear interpolation between two hex coordinates
   */
  private hexLerp(a: HexCoordinate, b: HexCoordinate, t: number): {q: number, r: number, s: number} {
    return {
      q: a.q + (b.q - a.q) * t,
      r: a.r + (b.r - a.r) * t,
      s: a.s + (b.s - a.s) * t
    };
  }

  /**
   * Round fractional hex coordinates to nearest hex
   */
  private hexRound(hex: {q: number, r: number, s: number}): HexCoordinate {
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
    const key = HexUtils.getKey(unit.position);
    return this.visionData.playerVisibleTiles.has(key);
  }

  /**
   * Check if a unit is visible to the AI
   */
  public isUnitVisibleToAI(unit: Unit): boolean {
    const key = HexUtils.getKey(unit.position);
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
    this.needsUpdate = true;
  }

  /**
   * Get current vision range
   */
  public getVisionRange(): number {
    return this.visionRange;
  }

  /**
   * Mark vision as needing update (call after unit moves)
   */
  public markDirty(): void {
    this.needsUpdate = true;
  }

  /**
   * Check if vision needs recalculation
   */
  public isDirty(): boolean {
    return this.needsUpdate;
  }

  /**
   * Reset all vision data (for new game)
   */
  public reset(): void {
    this.visionData.playerVisibleTiles.clear();
    this.visionData.playerExploredTiles.clear();
    this.visionData.aiVisibleTiles.clear();
    this.visionData.aiExploredTiles.clear();
    this.needsUpdate = true;
  }
}
```

### File 2: Update `src/models/Obstacle.ts`

Add line-of-sight blocking property:

```typescript
export interface Obstacle {
  type: ObstacleType;
  assetName: string;
  blocksMovement: boolean;
  blocksLineOfSight: boolean; // NEW: Whether obstacle blocks vision
  height: number;
}

export const OBSTACLE_DEFINITIONS: Record<ObstacleType, Obstacle> = {
  [ObstacleType.ROCK_LARGE]: {
    type: ObstacleType.ROCK_LARGE,
    assetName: 'rock_large.png',
    blocksMovement: true,
    blocksLineOfSight: true, // Large rocks block vision
    height: 2
  },
  [ObstacleType.ROCK_SMALL]: {
    type: ObstacleType.ROCK_SMALL,
    assetName: 'rock_small.png',
    blocksMovement: true,
    blocksLineOfSight: false, // Small rocks don't block vision
    height: 1
  },
  [ObstacleType.TREE]: {
    type: ObstacleType.TREE,
    assetName: 'tree.png',
    blocksMovement: true,
    blocksLineOfSight: true, // Trees block vision
    height: 3
  },
  [ObstacleType.RUIN]: {
    type: ObstacleType.RUIN,
    assetName: 'ruin.png',
    blocksMovement: true,
    blocksLineOfSight: true, // Ruins block vision
    height: 2
  },
  [ObstacleType.WALL]: {
    type: ObstacleType.WALL,
    assetName: 'wall.png',
    blocksMovement: true,
    blocksLineOfSight: true, // Walls block vision
    height: 2
  },
  [ObstacleType.HAY]: {
    type: ObstacleType.HAY,
    assetName: 'hay.png',
    blocksMovement: false,
    blocksLineOfSight: false, // Hay bales don't block vision
    height: 1
  },
  [ObstacleType.BARREL]: {
    type: ObstacleType.BARREL,
    assetName: 'barrel.png',
    blocksMovement: false,
    blocksLineOfSight: false, // Barrels don't block vision
    height: 1
  }
};
```

### File 3: Create `src/rendering/FogOfWarRenderer.ts`

```typescript
/**
 * Fog of War Renderer - Renders visibility overlay
 * 
 * Renders three visibility states:
 * - Unexplored: Solid black
 * - Explored: Dimmed (40% opacity)
 * - Visible: Full color (no overlay)
 */

import { HexCoordinate } from '../models/HexCoordinate';
import { HexUtils } from '../utils/HexUtils';
import { VisionService, VisibilityState } from '../services/VisionService';
import { BATTLEFIELD_CONFIG } from '../utils/Constants';

export class FogOfWarRenderer {
  private hexSize: number;
  private ctx: CanvasRenderingContext2D;
  
  constructor(
    ctx: CanvasRenderingContext2D,
    hexSize: number = BATTLEFIELD_CONFIG.HEX_SIZE
  ) {
    this.ctx = ctx;
    this.hexSize = hexSize;
  }

  /**
   * Render fog of war overlay for all tiles
   */
  public renderFogOfWar(
    battlefield: Map<string, any>,
    visionService: VisionService,
    isPlayerTurn: boolean
  ): void {
    battlefield.forEach((tile, key) => {
      const visibility = isPlayerTurn
        ? visionService.getTileVisibilityForPlayer(key)
        : visionService.getTileVisibilityForAI(key);

      this.renderTileFog(tile.coordinate, visibility);
    });
  }

  /**
   * Render fog overlay for a single tile
   */
  private renderTileFog(coord: HexCoordinate, visibility: VisibilityState): void {
    const { x, y } = this.hexToIsometric(coord);

    if (visibility === VisibilityState.VISIBLE) {
      // No fog - tile is fully visible
      return;
    }

    if (visibility === VisibilityState.UNEXPLORED) {
      // Solid black - never seen
      this.drawHexOverlay(x, y, 'rgba(0, 0, 0, 1.0)');
    } else if (visibility === VisibilityState.EXPLORED) {
      // Dimmed - previously seen
      this.drawHexOverlay(x, y, 'rgba(0, 0, 0, 0.6)');
    }
  }

  /**
   * Draw semi-transparent overlay on a hex tile
   */
  private drawHexOverlay(x: number, y: number, color: string): void {
    this.ctx.save();
    this.ctx.fillStyle = color;

    // Draw isometric hex shape (top face only)
    const width = this.hexSize * Math.sqrt(3);
    const height = this.hexSize * 2;

    this.ctx.beginPath();
    
    // Isometric hex vertices (same as BattlefieldRenderer)
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);
    
    // Top face diamond shape
    this.ctx.moveTo(x, y - height / 4);
    this.ctx.lineTo(x + width / 2 * cos30, y - height / 4 - width / 2 * sin30);
    this.ctx.lineTo(x + width * cos30, y - height / 4);
    this.ctx.lineTo(x + width / 2 * cos30, y - height / 4 + width / 2 * sin30);
    this.ctx.closePath();

    this.ctx.fill();
    this.ctx.restore();
  }

  /**
   * Convert hex coordinates to isometric screen position
   */
  private hexToIsometric(coord: HexCoordinate): { x: number; y: number } {
    // Flat-top hex to cartesian
    const flatX = this.hexSize * (3/2) * coord.q;
    const flatY = this.hexSize * (Math.sqrt(3)/2 * coord.q + Math.sqrt(3) * coord.r);

    // Apply isometric transformation (30° rotation)
    const cos30 = Math.cos(Math.PI / 6);
    const sin30 = Math.sin(Math.PI / 6);

    const isoX = flatX * cos30 - flatY * cos30;
    const isoY = flatX * sin30 + flatY * sin30;

    // Center on canvas
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;

    return {
      x: centerX + isoX,
      y: centerY + isoY
    };
  }
}
```

### File 4: Integration with `src/core/GameEngine.ts`

```typescript
import { VisionService } from '../services/VisionService';
import { FogOfWarRenderer } from '../rendering/FogOfWarRenderer';

export class GameEngine {
  // ... existing properties ...
  private visionService: VisionService;
  private fogRenderer: FogOfWarRenderer;

  constructor() {
    // ... existing initialization ...
    
    this.visionService = new VisionService();
    this.fogRenderer = new FogOfWarRenderer(this.ctx, BATTLEFIELD_CONFIG.HEX_SIZE);

    // Initial vision update
    this.updateVision();
  }

  /**
   * Update vision when units move or are destroyed
   */
  private updateVision(): void {
    const playerUnits = this.gameState.getPlayerUnits();
    const aiUnits = this.gameState.getAIUnits();
    const battlefield = this.gameState.getBattlefield();

    this.visionService.updateVision(playerUnits, aiUnits, battlefield);
  }

  /**
   * Main render loop
   */
  private render(): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Render battlefield
    this.battlefieldRenderer.render(this.gameState.getBattlefield());

    // 2. Render obstacles (only if visible)
    this.obstacleRenderer.render(
      this.gameState.getBattlefield(),
      this.visionService,
      this.gameState.isPlayerTurn()
    );

    // 3. Render units (only if visible)
    this.unitRenderer.render(
      this.gameState.getPlayerUnits(),
      this.gameState.getAIUnits(),
      this.visionService,
      this.gameState.isPlayerTurn()
    );

    // 4. Render fog of war overlay
    this.fogRenderer.renderFogOfWar(
      this.gameState.getBattlefield(),
      this.visionService,
      this.gameState.isPlayerTurn()
    );

    // 5. Render UI elements (always visible)
    this.uiController.render();
  }

  private setupEventListeners(): void {
    // ... existing listeners ...

    // Update vision when unit moves
    this.eventBus.on('unitMoved', () => {
      this.updateVision();
    });

    // Update vision when unit is destroyed
    this.eventBus.on('unitDestroyed', () => {
      this.updateVision();
    });

    // Update vision when turn ends
    this.eventBus.on('turnEnded', () => {
      this.updateVision();
    });
  }

  // ... rest of existing code ...
}
```

### File 5: Update `src/rendering/UnitRenderer.ts`

Only render units if visible:

```typescript
import { VisionService } from '../services/VisionService';

export class UnitRenderer {
  // ... existing code ...

  public render(
    playerUnits: Unit[],
    aiUnits: Unit[],
    visionService: VisionService,
    isPlayerTurn: boolean
  ): void {
    // Always render player units
    playerUnits.forEach(unit => {
      this.renderUnit(unit, true);
    });

    // Only render AI units if visible to player
    aiUnits.forEach(unit => {
      const isVisible = isPlayerTurn
        ? visionService.isUnitVisibleToPlayer(unit)
        : true; // AI always sees its own units

      if (isVisible) {
        this.renderUnit(unit, false);
      }
    });
  }

  // ... rest of existing code ...
}
```

### File 6: Update `src/services/CombatService.ts`

Prevent targeting invisible units:

```typescript
import { VisionService } from './VisionService';

export class CombatService {
  constructor(
    private eventBus: EventBus,
    private visionService: VisionService
  ) {}

  public canAttack(attacker: Unit, target: Unit, isPlayerAttacking: boolean): boolean {
    // Check if target is visible
    const isTargetVisible = isPlayerAttacking
      ? this.visionService.isUnitVisibleToPlayer(target)
      : this.visionService.isUnitVisibleToAI(target);

    if (!isTargetVisible) {
      console.log('[CombatService] Cannot attack: target not visible');
      return false;
    }

    // ... existing attack range checks ...
  }

  // ... rest of existing code ...
}
```

## Testing Instructions

### Manual Testing
1. **Initial Visibility:**
   - Start new game
   - Verify only tiles near player units are visible
   - Rest of map should be black (unexplored)

2. **Movement Reveals Tiles:**
   - Move unit forward
   - Verify new tiles become visible
   - Verify previously visible tiles become dimmed (explored)

3. **Obstacle Blocking:**
   - Position unit behind large rock or wall
   - Verify tiles behind obstacle are not visible
   - Move unit to different angle
   - Verify tiles become visible from new position

4. **Enemy Visibility:**
   - Move player unit toward AI unit
   - Enemy should appear when entering vision range
   - Enemy should disappear when leaving vision range

5. **Attack Restrictions:**
   - Try to click on unexplored tile with enemy
   - Verify cannot target invisible enemies
   - Move closer to reveal enemy
   - Verify can now target enemy

6. **AI Fair Play:**
   - Switch to AI turn (internally)
   - Verify AI has same vision restrictions
   - AI should not attack units outside its vision

### Performance Testing
- Open browser DevTools Performance tab
- Move unit and measure vision calculation time
- Should complete in <16ms
- No frame drops during vision updates

### Edge Cases
1. **Unit Destroyed:** Unit dies → vision recalculates, tiles may become unexplored
2. **All Units Same Location:** Multiple units at same hex → vision combines correctly
3. **Vision Range 0:** Set vision range to 0 → only unit's own tile visible
4. **No Obstacles:** Map without obstacles → vision is circular around each unit
5. **Obstacle Removed:** Obstacle destroyed (future feature) → vision recalculates

## Definition of Done
- [ ] VisionService.ts created and tested
- [ ] FogOfWarRenderer.ts created and tested
- [ ] Three visibility states render correctly (unexplored, explored, visible)
- [ ] Vision updates when units move
- [ ] Obstacles block line of sight
- [ ] Enemy units only visible within vision range
- [ ] Cannot target invisible enemies
- [ ] AI has same vision restrictions as player
- [ ] Performance: vision calculation <16ms
- [ ] No visual glitches or z-order issues
- [ ] Code reviewed and follows project patterns

## Time Estimate
**3 Story Points = ~2 hours**

Breakdown:
- VisionService implementation: 45 minutes
- FogOfWarRenderer implementation: 30 minutes
- GameEngine integration: 20 minutes
- UnitRenderer/CombatService updates: 15 minutes
- Testing and optimization: 10 minutes

## Notes
- Vision range of 3 hexes balances strategy and fun
- Line-of-sight blocking adds tactical depth with obstacles
- Three visibility states (unexplored/explored/visible) are standard in strategy games
- Explored state helps players remember where they've been
- Fair AI vision prevents cheating and makes AI beatable
- Caching prevents recalculating vision every frame (performance)
- Fog renders after terrain but before UI (correct z-order)

## Future Enhancements (Out of Scope)
- Per-unit vision range (scouts have longer range)
- Vision range affected by elevation/height
- Shared vision between friendly units in multiplayer
- "Reveal map" cheat code for testing
- Fog of war toggle in settings
- Particle effects when new areas revealed
- Sound effect when discovering enemy units
