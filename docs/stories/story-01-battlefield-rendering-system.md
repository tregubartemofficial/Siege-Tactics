# Story 01: Battlefield Rendering System (2.5D Isometric)

**Story ID:** SIEGE-001  
**Title:** Implement 2.5D Isometric Hex Grid Battlefield Renderer  
**Priority:** P0 (Critical - Blocking)  
**Estimate:** 4 Story Points (~3 hours)  
**Sprint:** MVP Sprint 1  
**Dependencies:** None (Foundation complete)

---

## User Story

**As a** player  
**I want to** see the hex-grid battlefield rendered on screen  
**So that** I can visually understand the game state and play the game

---

## Business Context

This is the **highest priority story** for the MVP. Without visual rendering, the game is invisible and unplayable. The battlefield renderer is the foundation for all other visual features (units, fog of war, effects).

**2.5D Isometric Enhancement:** Using an isometric perspective (elevated viewing angle) provides:
- More professional, polished visual appearance
- Better depth perception for tactical positioning
- Medieval theme enhancement (looks like tabletop war game)
- Still achievable in Canvas with proper math
- **Static camera** - Fixed view angle, no user controls (standard for tactical games)

The rendering system must display:
- 15x15 hexagonal grid using cube coordinates in isometric view
- Hex tiles with depth/elevation appearance
- Hex tile boundaries clearly visible with 3D effect
- Playable area vs. shrink zone differentiation
- Coordinate system for debugging (optional but helpful)

---

## Acceptance Criteria

### AC1: Canvas Setup and Initialization
- [ ] Canvas element is correctly sized and attached to DOM
- [ ] Canvas uses 2D rendering context
- [ ] Coordinate system origin is centered on battlefield (static camera)
- [ ] Camera position fixed - no pan, zoom, or rotation controls
- [ ] Pixel ratio handling for high-DPI displays
- [ ] Canvas responds to window resize events (centers battlefield)

### AC2: Isometric Hexagon Drawing Mathematics
- [ ] Hexagon vertices calculated for isometric projection
- [ ] Isometric transformation matrix applied (30° angle typical)
- [ ] Hex size constant produces proper spacing (no gaps/overlaps)
- [ ] Cube coordinates correctly converted to isometric pixel coordinates
- [ ] All 15x15 hexes visible within canvas bounds with proper depth

### AC3: Grid Rendering with Depth
- [ ] Each hex tile has visible border stroke with 3D edge effect
- [ ] Hex faces show slight elevation/depth
- [ ] Top face and side faces rendered separately for 3D appearance
- [ ] Grid renders at 60fps without performance issues
- [ ] All hexes from GameState.battlefield are rendered
- [ ] Z-order sorting: back hexes render before front hexes

### AC4: Visual Styling (Isometric)
- [ ] Hex top face color: Grass green (#7a9b4f)
- [ ] Hex side faces: Darker shade (#5a7a3a) for depth
- [ ] Hex border color: Medieval stone gray (#5a5a5a)
- [ ] Shrink zone hexes: Darkened red tint on top face (#6a3030)
- [ ] Shrink zone sides: Dark red (#4a2020)
- [ ] Lighting effect: Subtle gradient from top-left to bottom-right
- [ ] Readable and distinct hex boundaries with 3D appearance

### AC5: Integration with GameEngine
- [ ] Renderer class instantiated in GameEngine constructor
- [ ] Renderer.render() called in GameEngine game loop
- [ ] Renderer receives GameState reference for data access
- [ ] EventBus integration for render updates (optional optimization)

---

## Technical Implementation Details

### Files to Create

#### Primary File: `src/rendering/BattlefieldRenderer.ts`

**Location:** `src/rendering/BattlefieldRenderer.ts`

**Class Structure:**
```typescript
import { GameState } from '../core/GameState';
import { HexCoordinate } from '../models/HexCoordinate';
import { HexUtils } from '../utils/HexUtils';

export class BattlefieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;
  private centerX: number;
  private centerY: number;
  
  // Isometric projection constants
  private readonly ISO_ANGLE = Math.PI / 6; // 30 degrees
  private readonly HEX_HEIGHT = 8; // Pixel height for 3D effect

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.hexSize = 35;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
  }

  public render(gameState: GameState): void {
    // Sort hexes by depth (back to front for proper layering)
    const sortedHexes = this.sortHexesByDepth(gameState.battlefield);
    
    // Draw all hex tiles
    sortedHexes.forEach(tile => {
      this.drawIsometricHex(tile.coordinate, gameState);
    });
  }

  private sortHexesByDepth(battlefield: Map<string, HexTile>): HexTile[] {
    // Sort hexes by y-coordinate (back hexes first)
    return Array.from(battlefield.values()).sort((a, b) => {
      const pixelA = this.hexToIsometricPixel(a.coordinate);
      const pixelB = this.hexToIsometricPixel(b.coordinate);
      return pixelA.y - pixelB.y;
    });
  }

  private drawIsometricHex(coord: HexCoordinate, gameState: GameState): void {
    const pixel = this.hexToIsometricPixel(coord);
    const isShrinkZone = HexUtils.distance(coord, {q:0, r:0, s:0}) > gameState.shrinkRadius;
    
    // Draw hex with 3D depth
    this.drawHexTop(pixel, isShrinkZone);
    this.drawHexSides(pixel, isShrinkZone);
  }

  private drawHexTop(pixel: {x: number, y: number}, isShrinkZone: boolean): void {
    const vertices = this.calculateIsometricHexVertices(pixel.x, pixel.y);
    
    // Fill top face
    this.ctx.beginPath();
    vertices.forEach((v, i) => {
      if (i === 0) this.ctx.moveTo(v.x, v.y);
      else this.ctx.lineTo(v.x, v.y);
    });
    this.ctx.closePath();
    
    // Apply gradient for lighting effect
    const gradient = this.ctx.createLinearGradient(
      pixel.x - this.hexSize, pixel.y - this.hexSize,
      pixel.x + this.hexSize, pixel.y + this.hexSize
    );
    
    if (isShrinkZone) {
      gradient.addColorStop(0, '#7a3030');
      gradient.addColorStop(1, '#5a2020');
    } else {
      gradient.addColorStop(0, '#8aab5f');
      gradient.addColorStop(1, '#6a8b3f');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Border
    this.ctx.strokeStyle = '#5a5a5a';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawHexSides(pixel: {x: number, y: number}, isShrinkZone: boolean): void {
    const vertices = this.calculateIsometricHexVertices(pixel.x, pixel.y);
    const sideColor = isShrinkZone ? '#4a2020' : '#5a7a3a';
    
    // Draw visible side faces (bottom-right, bottom, bottom-left)
    // Only draw 3 sides that face the camera
    for (let i = 2; i <= 4; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % 6];
      
      this.ctx.beginPath();
      this.ctx.moveTo(v1.x, v1.y);
      this.ctx.lineTo(v2.x, v2.y);
      this.ctx.lineTo(v2.x, v2.y + this.HEX_HEIGHT);
      this.ctx.lineTo(v1.x, v1.y + this.HEX_HEIGHT);
      this.ctx.closePath();
      
      this.ctx.fillStyle = sideColor;
      this.ctx.fill();
      this.ctx.strokeStyle = '#4a4a4a';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  private hexToIsometricPixel(coord: HexCoordinate): {x: number, y: number} {
    // Standard flat-top hex to pixel
    const flatX = this.hexSize * (3/2 * coord.q);
    const flatY = this.hexSize * (Math.sqrt(3)/2 * coord.q + Math.sqrt(3) * coord.r);
    
    // Apply isometric projection
    const isoX = flatX * Math.cos(this.ISO_ANGLE) - flatY * Math.sin(this.ISO_ANGLE);
    const isoY = flatX * Math.sin(this.ISO_ANGLE) + flatY * Math.cos(this.ISO_ANGLE);
    
    return {
      x: this.centerX + isoX,
      y: this.centerY + isoY
    };
  }

  private calculateIsometricHexVertices(x: number, y: number): Array<{x: number, y: number}> {
    const angles = [0, 60, 120, 180, 240, 300]; // degrees
    return angles.map(angleDeg => {
      const angleRad = (Math.PI / 180) * angleDeg;
      return {
        x: x + this.hexSize * Math.cos(angleRad),
        y: y + this.hexSize * Math.sin(angleRad) * 0.5 // Flatten for isometric
      };
    });
  }

  public resize(): void {
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }
}
```

**Key Algorithms:**

**Isometric Transformation:**
```typescript
// Convert flat hex coordinates to isometric view
// Uses 30-degree angle for classic isometric look
const ISO_ANGLE = Math.PI / 6; // 30 degrees

// Standard hex to pixel
const flatX = hexSize * (3/2 * q);
const flatY = hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);

// Apply isometric rotation matrix
const isoX = flatX * Math.cos(ISO_ANGLE) - flatY * Math.sin(ISO_ANGLE);
const isoY = flatX * Math.sin(ISO_ANGLE) + flatY * Math.cos(ISO_ANGLE);
```

**Isometric Hexagon Vertices:**
```typescript
// Vertices for isometric hex (flattened Y for perspective)
const angles = [0, 60, 120, 180, 240, 300];
const vertices = angles.map(angleDeg => {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: centerX + hexSize * Math.cos(angleRad),
    y: centerY + hexSize * Math.sin(angleRad) * 0.5 // Flatten for iso view
  };
});
```

**Depth Sorting (Z-Order):**
```typescript
// Sort hexes back-to-front to prevent visual artifacts
const sortedHexes = Array.from(battlefield.values()).sort((a, b) => {
  const pixelA = hexToIsometricPixel(a.coordinate);
  const pixelB = hexToIsometricPixel(b.coordinate);
  return pixelA.y - pixelB.y; // Back hexes drawn first
});
```

#### Secondary File: `src/rendering/Renderer.ts`

**Location:** `src/rendering/Renderer.ts`

**Purpose:** Orchestrates all rendering subsystems (battlefield, units, effects, fog of war)

**Class Structure:**
```typescript
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private battlefieldRenderer: BattlefieldRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.battlefieldRenderer = new BattlefieldRenderer(canvas);
  }

  public render(gameState: GameState): void {
    // Clear entire canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render layers in order
    this.battlefieldRenderer.render(gameState);
    // TODO: Unit rendering (Story 02)
    // TODO: Effects rendering (Story 05)
    // TODO: Fog of war (Story 07)
  }

  public resize(): void {
    this.battlefieldRenderer.resize();
  }
}
```

### Integration Points

**GameEngine.ts Modifications:**

1. Import Renderer:
```typescript
import { Renderer } from '../rendering/Renderer';
```

2. Add renderer property:
```typescript
private renderer: Renderer;
```

3. Initialize in constructor:
```typescript
constructor(canvas: HTMLCanvasElement) {
  this.canvas = canvas;
  this.renderer = new Renderer(canvas);
  // ... existing code
}
```

4. Call render in game loop:
```typescript
private render(): void {
  this.renderer.render(this.gameState);
}
```

**main.ts Modifications:**

Ensure canvas element is passed to GameEngine:
```typescript
const canvas = document.getElementById('battleCanvas') as HTMLCanvasElement;
const gameEngine = new GameEngine(canvas);
```

### Constants to Use

From `src/utils/Constants.ts`:
- `CONSTANTS.GRID_RADIUS` - Use for determining grid bounds (7, giving 15x15)
- `CONSTANTS.HEX_SIZE` - Define this constant (recommended: 30-40 pixels)

**Add to Constants.ts:**
```typescript
export const CONSTANTS = {
  // ... existing constants
  HEX_SIZE: 35, // pixels
  CANVAS_WIDTH: 1200, // pixels
  CANVAS_HEIGHT: 800, // pixels
};
```

### Existing Code References

**Use HexUtils for coordinate operations:**
- `HexUtils.toKey(coord)` - Get string key for hex coordinate
- `HexUtils.inBounds(coord)` - Check if coordinate is within grid
- Existing `HexCoordinate` interface from `src/models/HexCoordinate.ts`

**Access GameState data:**
- `gameState.battlefield` - Map of hex coordinates to HexTile objects
- `gameState.shrinkRadius` - Current shrink zone radius

### Visual Design Specifications

From `docs/front-end-spec.md`:

**Color Palette:**
- Hex border: `#5a5a5a` (stone gray)
- Grass terrain: `#7a9b4f` (green)
- Shrink zone: `#6a3030` (dark red)
- Grid lines: 2px width

**Hex Dimensions:**
- Size: 35 pixels (radius from center to vertex)
- Border stroke width: 2px
- Fill opacity: 100%

---

## Testing Instructions

### Visual Verification

1. **Run dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser to `localhost:5173`**

3. **Expected Visual Output:**
   - 15x15 hexagonal grid centered on canvas
   - All hexes have visible borders
   - Hexes fill entire canvas without cutoff
   - No gaps between hexes
   - Grid is symmetrical

4. **Test Shrink Zone (Manual):**
   - Temporarily modify `GameState.shrinkRadius` to 5
   - Outer hexes should display shrink zone color
   - Inner hexes remain normal color

### Console Verification

Add debug logging:
```typescript
Logger.info(`Rendering ${battlefield.size} hexes`);
```

Expected output: `Rendering 169 hexes` (for full 15x15 grid)

### Performance Check

- Open DevTools Performance tab
- Record 5 seconds of gameplay
- Verify rendering stays at 60fps
- No frame drops during idle rendering

---

## Edge Cases & Error Handling

### Edge Case 1: Canvas Not Found
- Verify canvas element exists in HTML before GameEngine instantiation
- Log error if canvas is null: `Logger.error('Canvas element not found')`

### Edge Case 2: Browser without Canvas Support
- Check for `canvas.getContext('2d')` support
- Display fallback message if not supported (unlikely in 2025)

### Edge Case 3: High-DPI Displays (Retina)
- Detect pixel ratio: `window.devicePixelRatio`
- Scale canvas backing store if pixel ratio > 1
- Scale context transform accordingly

### Edge Case 4: Window Resize
- Add resize event listener in Renderer
- Recalculate hex size to fit new canvas dimensions
- Trigger re-render after resize

---

## Definition of Done

- [ ] `BattlefieldRenderer.ts` created with all methods implemented
- [ ] `Renderer.ts` created as orchestrator
- [ ] GameEngine integrated with Renderer
- [ ] Canvas displays 15x15 hex grid
- [ ] Hex borders clearly visible
- [ ] Shrink zone styling works (when shrinkRadius changes)
- [ ] Code compiles without TypeScript errors
- [ ] No console errors during rendering
- [ ] 60fps performance verified in DevTools
- [ ] Visual appearance matches design spec
- [ ] Code reviewed for clarity (AI readability)

---

## Related Stories

- **Blocks:** Story 02 (Unit Rendering), Story 07 (Fog of War Rendering)
- **Depends On:** None
- **Related:** PRD Story 1 (Hex-Grid Battlefield Navigation)

---

## Notes for Developer

**Implementation Tips:**

1. **Start Simple:** Get basic hex grid drawing working first, add styling refinements later
2. **Use Existing Data:** GameState.battlefield already has all hex tiles created
3. **Coordinate System:** Cube coordinates (q, r, s) are already implemented in HexUtils
4. **Reference:** Red Blob Games hex grid guide is gold standard (search "hexagonal grids guide")
5. **Debug Visually:** Draw coordinate labels on hexes during development (remove for production)

**Common Pitfalls:**

- Hex orientation: Use **flat-top** (horizontal), not pointy-top
- Math.PI/180 conversion: Angles in degrees must be converted to radians
- Canvas clearing: Must clear before each render or you'll see ghosting
- Coordinate origin: Center the grid, don't start at (0,0)

**Time Estimates:**

- Canvas setup: 15 minutes
- Hex math implementation: 30 minutes
- Grid rendering loop: 20 minutes
- Styling and polish: 20 minutes
- Integration with GameEngine: 15 minutes
- Testing and debugging: 20 minutes

**Total: ~2 hours**

---

**Story Created By:** Bob (Scrum Master)  
**Date:** November 21, 2025  
**Status:** Ready for Development
