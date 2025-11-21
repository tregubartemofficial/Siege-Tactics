# Story 01: Battlefield Rendering System

**Story ID:** SIEGE-001  
**Title:** Implement Canvas-Based Hex Grid Battlefield Renderer  
**Priority:** P0 (Critical - Blocking)  
**Estimate:** 3 Story Points (~2 hours)  
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

The rendering system must display:
- 15x15 hexagonal grid using cube coordinates
- Hex tile boundaries clearly visible
- Playable area vs. shrink zone differentiation
- Coordinate system for debugging (optional but helpful)

---

## Acceptance Criteria

### AC1: Canvas Setup and Initialization
- [ ] Canvas element is correctly sized and attached to DOM
- [ ] Canvas uses 2D rendering context
- [ ] Canvas responds to window resize events
- [ ] Coordinate system origin is centered on battlefield
- [ ] Pixel ratio handling for high-DPI displays

### AC2: Hexagon Drawing Mathematics
- [ ] Hexagon vertices calculated using flat-top orientation
- [ ] Hex size constant produces proper spacing (no gaps/overlaps)
- [ ] Cube coordinates correctly converted to pixel coordinates
- [ ] All 15x15 hexes visible within canvas bounds

### AC3: Grid Rendering
- [ ] Each hex tile has visible border stroke
- [ ] Hex interiors filled with base color
- [ ] Grid renders at 60fps without performance issues
- [ ] All hexes from GameState.battlefield are rendered

### AC4: Visual Styling
- [ ] Hex border color: Medieval stone gray (#5a5a5a)
- [ ] Default hex fill: Grass green (#7a9b4f)
- [ ] Shrink zone hexes: Darkened red tint (#4a2020)
- [ ] Readable and distinct hex boundaries

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
export class BattlefieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;
  private centerX: number;
  private centerY: number;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize canvas context
    // Set up coordinate system
    // Calculate hex size based on canvas dimensions
  }

  public render(gameState: GameState): void {
    // Clear canvas
    // Draw all hex tiles from gameState.battlefield
    // Apply shrink zone styling
  }

  private drawHex(coord: HexCoordinate, style: HexStyle): void {
    // Calculate pixel position from cube coordinate
    // Draw hexagon path
    // Fill and stroke
  }

  private hexToPixel(coord: HexCoordinate): { x: number; y: number } {
    // Convert cube coordinate to pixel position
    // Use flat-top hex orientation
  }

  private calculateHexVertices(x: number, y: number): Array<{x: number, y: number}> {
    // Return 6 vertices for hexagon at center (x, y)
  }

  public resize(): void {
    // Handle canvas resize
    // Recalculate hex size and center position
  }
}
```

**Key Algorithms:**

**Flat-Top Hex to Pixel Conversion:**
```typescript
// Flat-top orientation (horizontal hexes)
const x = hexSize * (3/2 * q);
const y = hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
```

**Hexagon Vertices (Flat-Top):**
```typescript
const angles = [0, 60, 120, 180, 240, 300]; // degrees
const vertices = angles.map(angleDeg => {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: centerX + hexSize * Math.cos(angleRad),
    y: centerY + hexSize * Math.sin(angleRad)
  };
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
