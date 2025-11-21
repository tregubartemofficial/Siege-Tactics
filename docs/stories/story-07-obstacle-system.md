# Story 07: Obstacle System with Asset Rendering

**Story ID:** SIEGE-007  
**Title:** Implement Map Obstacles with Kenney Hexagon Pack Assets  
**Priority:** P1 (Should Have - Enhances Gameplay)  
**Estimate:** 3 Story Points (~2 hours)  
**Sprint:** MVP Sprint 2  
**Dependencies:** Story 01 (Battlefield Rendering), Story 03 (Pathfinding)

---

## User Story

**As a** player  
**I want to** navigate around obstacles on the battlefield  
**So that** I have more tactical positioning challenges and varied terrain

---

## Business Context

Obstacles add **tactical depth** to Siege Tactics by:
- Creating natural cover and chokepoints
- Forcing strategic positioning decisions
- Making maps more visually interesting and varied
- Blocking line of sight (future fog of war enhancement)
- Adding replayability through different obstacle layouts

**Asset Integration:** You have the **Kenney Hexagon Pack** with perfect medieval-themed obstacles:
- Rocks (various sizes)
- Trees (pine, round)
- Medieval structures (ruins, walls, towers)
- Decorative elements (hay, fences, barrels)

This story implements obstacle placement, collision detection, and visual rendering using these professional assets.

---

## Acceptance Criteria

### AC1: Obstacle Data Model
- [ ] Obstacle type defined in Constants (ROCK, TREE, RUIN, WALL, etc.)
- [ ] HexTile model extended with `obstacle: Obstacle | null` property
- [ ] Obstacle has `type`, `blocksMovement`, `blocksLineOfSight` properties
- [ ] Obstacle asset path mapping defined for each type

### AC2: Obstacle Placement System
- [ ] Random obstacle generation during battlefield initialization
- [ ] Configurable obstacle density (e.g., 15-20% of hexes)
- [ ] Obstacles don't spawn on starting positions (player/AI units)
- [ ] Minimum spacing between obstacles (no clusters)
- [ ] Deterministic placement (seed-based for testing)

### AC3: Obstacle Rendering
- [ ] ObstacleRenderer class created
- [ ] Sprites loaded from Kenney asset pack
- [ ] Obstacles rendered on top of hex tiles, below units
- [ ] Isometric-compatible positioning (centered on hex)
- [ ] Scale obstacles appropriately to hex size
- [ ] Render order: terrain → obstacles → units

### AC4: Pathfinding Integration
- [ ] PathfindingService checks `tile.obstacle?.blocksMovement`
- [ ] Occupied hexes excluded from valid movement
- [ ] Units cannot move to hexes with blocking obstacles
- [ ] Path calculation avoids obstacle hexes

### AC5: Visual Polish
- [ ] Obstacles have subtle drop shadows for depth
- [ ] Multiple asset variations per obstacle type
- [ ] Consistent medieval theme throughout
- [ ] Clear visual distinction between obstacle types

---

## Technical Implementation Details

### Files to Create/Modify

#### New File: `src/models/Obstacle.ts`

**Location:** `src/models/Obstacle.ts`

```typescript
import { ObstacleType } from '../utils/Constants';

export class Obstacle {
  public type: ObstacleType;
  public assetPath: string;
  public blocksMovement: boolean;
  public blocksLineOfSight: boolean;
  public scale: number;

  constructor(type: ObstacleType) {
    this.type = type;
    this.assetPath = this.getAssetPath(type);
    this.blocksMovement = this.isBlocking(type);
    this.blocksLineOfSight = this.blocksLOS(type);
    this.scale = this.getScale(type);
  }

  private getAssetPath(type: ObstacleType): string {
    const assetMap: Record<ObstacleType, string[]> = {
      ROCK_LARGE: [
        'kenney_hexagon-pack/PNG/Objects/rockGrey_large.png',
        'kenney_hexagon-pack/PNG/Objects/rockBrown_large.png'
      ],
      ROCK_SMALL: [
        'kenney_hexagon-pack/PNG/Objects/rockGrey_small1.png',
        'kenney_hexagon-pack/PNG/Objects/rockGrey_small2.png',
        'kenney_hexagon-pack/PNG/Objects/rockGrey_small3.png'
      ],
      TREE: [
        'kenney_hexagon-pack/PNG/Objects/treePine_large.png',
        'kenney_hexagon-pack/PNG/Objects/treeRound_large.png'
      ],
      RUIN: [
        'kenney_hexagon-pack/PNG/Tiles/Medieval/medieval_ruins.png',
        'kenney_hexagon-pack/PNG/Objects/ruinsCorner.png'
      ],
      WALL: [
        'kenney_hexagon-pack/PNG/Objects/wall.png',
        'kenney_hexagon-pack/PNG/Objects/wall_corner.png'
      ],
      HAY: ['kenney_hexagon-pack/PNG/Objects/hay.png'],
      BARREL: [
        'kenney_hexagon-pack/PNG/Objects/box1.png',
        'kenney_hexagon-pack/PNG/Objects/box2.png'
      ]
    };

    const variants = assetMap[type];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  private isBlocking(type: ObstacleType): boolean {
    // All obstacles block movement in MVP
    // Future: decorative obstacles (HAY, BARREL) might not block
    return true;
  }

  private blocksLOS(type: ObstacleType): boolean {
    // Large obstacles block line of sight for fog of war
    return ['ROCK_LARGE', 'TREE', 'RUIN', 'WALL'].includes(type);
  }

  private getScale(type: ObstacleType): number {
    // Scale relative to hex size
    switch(type) {
      case 'ROCK_LARGE': return 0.8;
      case 'ROCK_SMALL': return 0.5;
      case 'TREE': return 0.9;
      case 'RUIN': return 1.0;
      case 'WALL': return 0.7;
      case 'HAY': return 0.6;
      case 'BARREL': return 0.5;
      default: return 0.7;
    }
  }
}
```

#### New File: `src/rendering/ObstacleRenderer.ts`

**Location:** `src/rendering/ObstacleRenderer.ts`

```typescript
import { GameState } from '../core/GameState';
import { HexCoordinate } from '../models/HexCoordinate';
import { Obstacle } from '../models/Obstacle';
import { Logger } from '../utils/Logger';

export class ObstacleRenderer {
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadedImages: Set<string> = new Set();

  constructor(ctx: CanvasRenderingContext2D, hexSize: number) {
    this.ctx = ctx;
    this.hexSize = hexSize;
  }

  public async preloadAssets(): Promise<void> {
    // Preload all obstacle images
    const assetPaths = [
      'kenney_hexagon-pack/PNG/Objects/rockGrey_large.png',
      'kenney_hexagon-pack/PNG/Objects/rockBrown_large.png',
      'kenney_hexagon-pack/PNG/Objects/rockGrey_small1.png',
      'kenney_hexagon-pack/PNG/Objects/treePine_large.png',
      'kenney_hexagon-pack/PNG/Objects/treeRound_large.png',
      'kenney_hexagon-pack/PNG/Tiles/Medieval/medieval_ruins.png',
      'kenney_hexagon-pack/PNG/Objects/wall.png',
      'kenney_hexagon-pack/PNG/Objects/hay.png'
    ];

    const loadPromises = assetPaths.map(path => this.loadImage(path));
    await Promise.all(loadPromises);
    Logger.info(`Loaded ${this.loadedImages.size} obstacle assets`);
  }

  private loadImage(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(path, img);
        this.loadedImages.add(path);
        resolve();
      };
      img.onerror = () => {
        Logger.warn(`Failed to load obstacle asset: ${path}`);
        resolve(); // Don't fail entire load
      };
      img.src = path;
    });
  }

  public render(gameState: GameState): void {
    // Render obstacles in depth order (back to front)
    const sortedTiles = this.sortTilesByDepth(gameState.battlefield);

    sortedTiles.forEach(tile => {
      if (tile.obstacle) {
        this.drawObstacle(tile.coordinate, tile.obstacle);
      }
    });
  }

  private sortTilesByDepth(battlefield: Map<string, HexTile>): HexTile[] {
    return Array.from(battlefield.values()).sort((a, b) => {
      const pixelA = this.hexToIsometricPixel(a.coordinate);
      const pixelB = this.hexToIsometricPixel(b.coordinate);
      return pixelA.y - pixelB.y;
    });
  }

  private drawObstacle(coord: HexCoordinate, obstacle: Obstacle): void {
    const pixel = this.hexToIsometricPixel(coord);
    const image = this.imageCache.get(obstacle.assetPath);

    if (!image) {
      // Fallback: draw colored circle if image not loaded
      this.drawFallbackObstacle(pixel, obstacle);
      return;
    }

    // Draw drop shadow
    this.drawShadow(pixel);

    // Calculate scaled dimensions
    const scaledWidth = image.width * obstacle.scale * 0.3; // Adjust for hex size
    const scaledHeight = image.height * obstacle.scale * 0.3;

    // Draw centered on hex
    this.ctx.drawImage(
      image,
      pixel.x - scaledWidth / 2,
      pixel.y - scaledHeight, // Anchor at bottom
      scaledWidth,
      scaledHeight
    );
  }

  private drawShadow(pixel: {x: number, y: number}): void {
    const shadowSize = this.hexSize * 0.4;
    const gradient = this.ctx.createRadialGradient(
      pixel.x, pixel.y + 5,
      0,
      pixel.x, pixel.y + 5,
      shadowSize
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      pixel.x - shadowSize,
      pixel.y - shadowSize + 5,
      shadowSize * 2,
      shadowSize * 2
    );
  }

  private drawFallbackObstacle(pixel: {x: number, y: number}, obstacle: Obstacle): void {
    // Fallback rendering if image fails to load
    const size = this.hexSize * obstacle.scale * 0.5;
    
    this.ctx.fillStyle = '#5a5a5a';
    this.ctx.beginPath();
    this.ctx.arc(pixel.x, pixel.y, size, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#3a3a3a';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private hexToIsometricPixel(coord: HexCoordinate): {x: number, y: number} {
    // Same as BattlefieldRenderer - extract to shared utility if needed
    const ISO_ANGLE = Math.PI / 6;
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;
    
    const flatX = this.hexSize * (3/2 * coord.q);
    const flatY = this.hexSize * (Math.sqrt(3)/2 * coord.q + Math.sqrt(3) * coord.r);
    
    const isoX = flatX * Math.cos(ISO_ANGLE) - flatY * Math.sin(ISO_ANGLE);
    const isoY = flatX * Math.sin(ISO_ANGLE) + flatY * Math.cos(ISO_ANGLE);
    
    return { x: centerX + isoX, y: centerY + isoY };
  }
}
```

#### New Service: `src/services/ObstacleGenerationService.ts`

**Location:** `src/services/ObstacleGenerationService.ts`

```typescript
import { GameState } from '../core/GameState';
import { Obstacle } from '../models/Obstacle';
import { HexCoordinate } from '../models/HexCoordinate';
import { HexUtils } from '../utils/HexUtils';
import { ObstacleType, CONSTANTS } from '../utils/Constants';
import { Logger } from '../utils/Logger';

export class ObstacleGenerationService {
  /**
   * Generate obstacles across the battlefield
   * @param gameState Current game state
   * @param density Percentage of hexes with obstacles (0-1)
   * @param seed Random seed for deterministic generation
   */
  public static generateObstacles(
    gameState: GameState,
    density: number = 0.15,
    seed?: number
  ): void {
    const rng = this.createSeededRandom(seed);
    const tiles = Array.from(gameState.battlefield.values());
    
    // Filter out tiles where units will spawn
    const availableTiles = tiles.filter(tile => 
      !this.isSpawnZone(tile.coordinate, gameState)
    );

    const obstacleCount = Math.floor(availableTiles.length * density);
    const selectedTiles = this.selectRandomTiles(availableTiles, obstacleCount, rng);

    selectedTiles.forEach(tile => {
      const obstacleType = this.selectObstacleType(tile.coordinate, rng);
      tile.obstacle = new Obstacle(obstacleType);
    });

    Logger.info(`Generated ${obstacleCount} obstacles on battlefield`);
  }

  private static isSpawnZone(coord: HexCoordinate, gameState: GameState): boolean {
    // Check if hex is near player or AI starting positions
    const playerSpawn = {q: -3, r: 5, s: -2}; // Example from GameState
    const aiSpawn = {q: 3, r: -5, s: 2};
    
    const distToPlayer = HexUtils.distance(coord, playerSpawn);
    const distToAI = HexUtils.distance(coord, aiSpawn);
    
    return distToPlayer <= 2 || distToAI <= 2;
  }

  private static selectRandomTiles(
    tiles: HexTile[],
    count: number,
    rng: () => number
  ): HexTile[] {
    const shuffled = [...tiles].sort(() => rng() - 0.5);
    return shuffled.slice(0, count);
  }

  private static selectObstacleType(
    coord: HexCoordinate,
    rng: () => number
  ): ObstacleType {
    const distance = Math.abs(coord.q) + Math.abs(coord.r);
    const roll = rng();

    // Vary obstacles by distance from center
    if (distance < 3) {
      // Center: more ruins and walls
      if (roll < 0.4) return 'RUIN';
      if (roll < 0.7) return 'WALL';
      return 'ROCK_LARGE';
    } else if (distance < 6) {
      // Mid-range: mix of obstacles
      if (roll < 0.3) return 'TREE';
      if (roll < 0.5) return 'ROCK_LARGE';
      if (roll < 0.7) return 'HAY';
      return 'ROCK_SMALL';
    } else {
      // Outer edges: natural obstacles
      if (roll < 0.5) return 'TREE';
      if (roll < 0.8) return 'ROCK_LARGE';
      return 'ROCK_SMALL';
    }
  }

  private static createSeededRandom(seed?: number): () => number {
    if (!seed) return Math.random;
    
    let state = seed;
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }
}
```

### Constants to Add

Add to `src/utils/Constants.ts`:

```typescript
export type ObstacleType = 
  | 'ROCK_LARGE' 
  | 'ROCK_SMALL' 
  | 'TREE' 
  | 'RUIN' 
  | 'WALL' 
  | 'HAY' 
  | 'BARREL';

export const OBSTACLE_CONFIG = {
  DENSITY: 0.15, // 15% of hexes have obstacles
  MIN_SPACING: 1, // Min hexes between obstacles
  ASSET_BASE_PATH: 'kenney_hexagon-pack/PNG/'
};
```

### Model Modifications

**Modify:** `src/models/HexTile.ts`

Add obstacle property:

```typescript
import { Obstacle } from './Obstacle';

export class HexTile {
  public coordinate: HexCoordinate;
  public terrain: TerrainType;
  public obstacle: Obstacle | null; // NEW

  constructor(coordinate: HexCoordinate) {
    this.coordinate = coordinate;
    this.terrain = 'grass';
    this.obstacle = null; // NEW
  }
  
  public isPassable(): boolean {
    return this.obstacle === null || !this.obstacle.blocksMovement;
  }
}
```

### Integration Points

**GameState.ts Modifications:**

Initialize obstacles during battlefield creation:

```typescript
import { ObstacleGenerationService } from '../services/ObstacleGenerationService';

public initialize(playerWeapon: WeaponType): void {
  this.createBattlefield();
  this.spawnUnits(playerWeapon);
  
  // Generate obstacles
  ObstacleGenerationService.generateObstacles(this, 0.15);
  
  this.currentTurn = 'player';
  this.turnCount = 0;
}
```

**PathfindingService.ts Modifications:**

Check obstacles when calculating movement:

```typescript
private static getNeighbors(coord: HexCoordinate, gameState: GameState): HexCoordinate[] {
  const directions: HexCoordinate[] = [
    {q: 1, r: 0, s: -1},
    // ... other directions
  ];
  
  return directions
    .map(dir => ({
      q: coord.q + dir.q,
      r: coord.r + dir.r,
      s: coord.s + dir.s
    }))
    .filter(neighbor => {
      if (!HexUtils.inBounds(neighbor)) return false;
      
      // Check for blocking obstacles
      const tile = gameState.battlefield.get(HexUtils.toKey(neighbor));
      if (tile?.obstacle?.blocksMovement) return false;
      
      return true;
    });
}
```

**Renderer.ts Modifications:**

Add ObstacleRenderer to rendering pipeline:

```typescript
import { ObstacleRenderer } from './ObstacleRenderer';

export class Renderer {
  private obstacleRenderer: ObstacleRenderer;
  
  constructor(canvas: HTMLCanvasElement) {
    // ... existing code
    this.obstacleRenderer = new ObstacleRenderer(ctx, HEX_SIZE);
  }
  
  public async initialize(): Promise<void> {
    await this.obstacleRenderer.preloadAssets();
  }
  
  public render(gameState: GameState): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.battlefieldRenderer.render(gameState);
    this.obstacleRenderer.render(gameState); // NEW: After terrain, before units
    this.unitRenderer.render(gameState);
    // ... fog of war, effects
  }
}
```

---

## Testing Instructions

### Visual Verification

1. **Start game:**
   ```bash
   npm run dev
   ```

2. **Expected output:**
   - 15-20% of hexes have obstacles
   - Various obstacle types (rocks, trees, ruins)
   - Obstacles don't spawn near starting positions
   - Obstacles rendered on top of terrain, below units

3. **Test movement:**
   - Select unit
   - Blue movement hexes should exclude obstacle hexes
   - Clicking obstacle hex should not move unit

4. **Test variety:**
   - Restart game multiple times
   - Obstacle placement should vary
   - Different obstacle types appear

### Console Testing

```typescript
// Test obstacle count
const obstacleCount = Array.from(gameState.battlefield.values())
  .filter(tile => tile.obstacle !== null).length;
console.log(`Obstacles: ${obstacleCount}`);
// Expected: ~25-30 obstacles (15% of 169 hexes)

// Test passability
const blockedTiles = Array.from(gameState.battlefield.values())
  .filter(tile => !tile.isPassable());
console.log(`Blocked tiles: ${blockedTiles.length}`);
```

### Asset Loading Test

```typescript
// Verify assets loaded
console.log(`Loaded obstacle assets: ${obstacleRenderer.loadedImages.size}`);
// Expected: 8-10 images loaded
```

---

## Edge Cases & Error Handling

### Edge Case 1: Asset Loading Failure
- Fallback to colored circles if images don't load
- Log warning but continue gameplay
- Game still playable without sprites

### Edge Case 2: Too Many Obstacles
- Cap density at 25% maximum
- Ensure minimum 2-hex spacing from spawn points
- Always leave path between player and AI

### Edge Case 3: Obstacle on Unit Position
- Check existing unit positions before placing obstacles
- Move obstacle to adjacent hex if conflict
- Validate during obstacle generation

### Edge Case 4: Pathfinding Deadlock
- Ensure generated obstacles don't block all paths
- Validate connectivity between spawn points
- Regenerate if no valid path exists

---

## Definition of Done

- [ ] Obstacle data model created
- [ ] HexTile extended with obstacle property
- [ ] ObstacleRenderer implemented with asset loading
- [ ] ObstacleGenerationService creates varied obstacles
- [ ] Obstacles visible on battlefield
- [ ] Pathfinding respects obstacles (movement blocked)
- [ ] Obstacles don't spawn on starting positions
- [ ] Assets from Kenney pack correctly loaded
- [ ] Drop shadows render beneath obstacles
- [ ] No TypeScript compilation errors
- [ ] No console errors during obstacle rendering
- [ ] Game playable with obstacles adding tactical challenge

---

## Related Stories

- **Depends On:** Story 01 (Battlefield Rendering), Story 03 (Pathfinding)
- **Blocks:** None (optional enhancement)
- **Related:** Future Story - Line of Sight / Fog of War

---

## Notes for Developer

**Implementation Tips:**

1. **Asset Loading:** Preload all obstacles in `Renderer.initialize()` before first render
2. **Rendering Order:** Terrain → Obstacles → Units → Effects
3. **Pathfinding:** Simply check `tile.obstacle?.blocksMovement` in neighbor filter
4. **Variety:** Use random selection from asset arrays for visual diversity

**Asset Recommendations:**

**For Medieval Theme:**
- **Rocks:** `rockGrey_large.png`, `rockGrey_small*.png`
- **Trees:** `treePine_large.png`, `treeRound_large.png`
- **Ruins:** `medieval_ruins.png`, `ruinsCorner.png`
- **Walls:** `wall.png`, `wall_corner.png`
- **Props:** `hay.png`, `box1.png`

**Common Pitfalls:**

- Forgetting to await asset loading before first render
- Not checking obstacle in pathfinding (units walk through)
- Placing obstacles on spawn positions (blocks starting units)
- Wrong render order (obstacles above units looks wrong)

**Time Estimates:**

- Data models: 20 minutes
- Asset loading system: 30 minutes
- Obstacle renderer: 30 minutes
- Generation service: 30 minutes
- Pathfinding integration: 15 minutes
- Testing: 15 minutes

**Total: ~2 hours**

---

**Story Created By:** Bob (Scrum Master)  
**Date:** November 21, 2025  
**Status:** Ready for Development
