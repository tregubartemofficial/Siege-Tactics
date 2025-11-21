# Story 02: Unit Rendering System

**Story ID:** SIEGE-002  
**Title:** Implement Unit Sprite Rendering on Hex Grid  
**Priority:** P0 (Critical)  
**Estimate:** 2 Story Points (~1.5 hours)  
**Sprint:** MVP Sprint 1  
**Dependencies:** Story 01 (Battlefield Rendering)

---

## User Story

**As a** player  
**I want to** see my siege weapon unit and enemy units displayed on the battlefield  
**So that** I can identify unit positions, types, and health status

---

## Business Context

Unit visualization is essential for gameplay. Players must distinguish between:
- Player units vs AI units
- Different weapon types (Catapult, Ballista, Trebuchet)
- Unit health status
- Selected unit highlighting

This story implements visual representation of all units on the battlefield, building on the hex grid from Story 01.

---

## Acceptance Criteria

### AC1: Unit Sprite Rendering
- [ ] Player units render as colored shapes/rectangles (placeholder sprites)
- [ ] AI units render with different color than player units
- [ ] Units positioned correctly at hex center coordinates
- [ ] All units from gameState.playerUnits and gameState.aiUnits are rendered

### AC2: Weapon Type Differentiation
- [ ] Catapult: Small square (20x20px), color: blue (#4a7ba7)
- [ ] Ballista: Tall rectangle (15x25px), color: green (#6a9b4f)
- [ ] Trebuchet: Large square (30x30px), color: purple (#8a4a9b)
- [ ] AI units use red tint (#a74a4a) variants of same shapes

### AC3: Unit Health Display
- [ ] Health bar rendered above each unit
- [ ] Health bar width proportional to current health percentage
- [ ] Health bar colors: Green (>66%), Yellow (33-66%), Red (<33%)
- [ ] Health bar dimensions: 30px width × 4px height

### AC4: Unit Selection Highlighting
- [ ] Selected unit has yellow border/glow (3px stroke, #f4d03f)
- [ ] Non-selected units have no highlight
- [ ] Selection updates when gameState.selectedUnit changes
- [ ] Selection visible over health bar and sprite

### AC5: Rendering Order and Layering
- [ ] Units render on top of hex grid (after battlefield layer)
- [ ] Health bars render on top of unit sprites
- [ ] Selection highlight renders last (topmost layer)

---

## Technical Implementation Details

### File to Create

#### Primary File: `src/rendering/UnitRenderer.ts`

**Location:** `src/rendering/UnitRenderer.ts`

**Class Structure:**
```typescript
import { GameState } from '../core/GameState';
import { Unit } from '../models/Unit';
import { HexCoordinate } from '../models/HexCoordinate';
import { WeaponType } from '../utils/Constants';

export class UnitRenderer {
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;

  constructor(ctx: CanvasRenderingContext2D, hexSize: number) {
    this.ctx = ctx;
    this.hexSize = hexSize;
  }

  public render(gameState: GameState): void {
    // Render all player units
    gameState.playerUnits.forEach(unit => this.drawUnit(unit, false));
    
    // Render all AI units
    gameState.aiUnits.forEach(unit => this.drawUnit(unit, true));
    
    // Render selection highlight if unit selected
    if (gameState.selectedUnit) {
      this.drawSelectionHighlight(gameState.selectedUnit);
    }
  }

  private drawUnit(unit: Unit, isAI: boolean): void {
    const pixelPos = this.hexToPixel(unit.position);
    
    // Draw weapon-specific shape
    this.drawWeaponSprite(unit.type, pixelPos, isAI);
    
    // Draw health bar
    this.drawHealthBar(unit, pixelPos);
  }

  private drawWeaponSprite(
    weaponType: WeaponType, 
    position: {x: number, y: number}, 
    isAI: boolean
  ): void {
    const ctx = this.ctx;
    
    // Set color based on owner and weapon type
    ctx.fillStyle = this.getWeaponColor(weaponType, isAI);
    
    switch(weaponType) {
      case WeaponType.CATAPULT:
        // Small square
        ctx.fillRect(position.x - 10, position.y - 10, 20, 20);
        break;
      case WeaponType.BALLISTA:
        // Tall rectangle
        ctx.fillRect(position.x - 7.5, position.y - 12.5, 15, 25);
        break;
      case WeaponType.TREBUCHET:
        // Large square
        ctx.fillRect(position.x - 15, position.y - 15, 30, 30);
        break;
    }
    
    // Add border to sprite
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private getWeaponColor(weaponType: WeaponType, isAI: boolean): string {
    if (isAI) {
      return '#a74a4a'; // Red tint for all AI units
    }
    
    switch(weaponType) {
      case WeaponType.CATAPULT: return '#4a7ba7'; // Blue
      case WeaponType.BALLISTA: return '#6a9b4f'; // Green
      case WeaponType.TREBUCHET: return '#8a4a9b'; // Purple
      default: return '#5a5a5a'; // Gray fallback
    }
  }

  private drawHealthBar(unit: Unit, position: {x: number, y: number}): void {
    const barWidth = 30;
    const barHeight = 4;
    const barX = position.x - barWidth / 2;
    const barY = position.y - 25; // Above unit sprite
    
    const healthPercent = unit.health / unit.maxHealth;
    const currentBarWidth = barWidth * healthPercent;
    
    // Background (black)
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Health fill (colored based on health)
    this.ctx.fillStyle = this.getHealthColor(healthPercent);
    this.ctx.fillRect(barX, barY, currentBarWidth, barHeight);
    
    // Border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  private getHealthColor(healthPercent: number): string {
    if (healthPercent > 0.66) return '#4a9b4a'; // Green
    if (healthPercent > 0.33) return '#d4a944'; // Yellow
    return '#a74a4a'; // Red
  }

  private drawSelectionHighlight(unit: Unit): void {
    const pixelPos = this.hexToPixel(unit.position);
    const highlightSize = 40; // Larger than largest unit sprite
    
    this.ctx.strokeStyle = '#f4d03f'; // Yellow
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([5, 3]); // Dashed line
    this.ctx.strokeRect(
      pixelPos.x - highlightSize/2,
      pixelPos.y - highlightSize/2,
      highlightSize,
      highlightSize
    );
    this.ctx.setLineDash([]); // Reset to solid lines
  }

  private hexToPixel(coord: HexCoordinate): {x: number, y: number} {
    // Same conversion as BattlefieldRenderer
    // Copy this logic or extract to shared utility
    const x = this.hexSize * (3/2 * coord.q);
    const y = this.hexSize * (Math.sqrt(3)/2 * coord.q + Math.sqrt(3) * coord.r);
    return {x, y};
  }
}
```

### Integration Points

**Renderer.ts Modifications:**

Add UnitRenderer to the rendering pipeline:

```typescript
import { UnitRenderer } from './UnitRenderer';

export class Renderer {
  private unitRenderer: UnitRenderer;
  
  constructor(canvas: HTMLCanvasElement) {
    // ... existing code
    const ctx = canvas.getContext('2d')!;
    this.unitRenderer = new UnitRenderer(ctx, HEX_SIZE);
  }
  
  public render(gameState: GameState): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.battlefieldRenderer.render(gameState);
    this.unitRenderer.render(gameState); // NEW: Render units
    // TODO: Effects, fog of war
  }
}
```

### Constants to Add

Add to `src/utils/Constants.ts`:

```typescript
export const RENDER_CONSTANTS = {
  UNIT_SIZES: {
    CATAPULT: { width: 20, height: 20 },
    BALLISTA: { width: 15, height: 25 },
    TREBUCHET: { width: 30, height: 30 }
  },
  HEALTH_BAR: {
    WIDTH: 30,
    HEIGHT: 4,
    OFFSET_Y: -25 // Above unit
  },
  SELECTION_HIGHLIGHT: {
    SIZE: 40,
    COLOR: '#f4d03f',
    LINE_WIDTH: 3,
    DASH_PATTERN: [5, 3]
  }
};
```

### Existing Code References

**Unit Data Access:**
- `gameState.playerUnits: Unit[]` - All player-controlled units
- `gameState.aiUnits: Unit[]` - All AI-controlled units
- `gameState.selectedUnit: Unit | null` - Currently selected unit
- `unit.type: WeaponType` - Weapon type enum
- `unit.health: number` - Current health
- `unit.maxHealth: number` - Maximum health
- `unit.position: HexCoordinate` - Hex coordinate position

---

## Testing Instructions

### Visual Verification

1. **Start game with weapon selection:**
   ```typescript
   // In main.ts or GameEngine initialization
   gameEngine.initialize(WeaponType.CATAPULT);
   ```

2. **Expected Visual Output:**
   - Blue square (player catapult) visible at bottom of battlefield
   - Red square (AI catapult) visible at top of battlefield
   - Green health bars above both units (at 100%)

3. **Test Unit Selection:**
   - Trigger unit selection: `gameState.selectedUnit = gameState.playerUnits[0]`
   - Yellow dashed border should appear around selected unit

4. **Test Health Display:**
   - Manually reduce unit health: `unit.takeDamage(50)`
   - Health bar should shrink and turn yellow (50% health)
   - Further damage: `unit.takeDamage(40)` should turn bar red

5. **Test Multiple Weapon Types:**
   - Unlock ballista and trebuchet (set XP high)
   - Start game with different weapons
   - Verify shape differentiation (square vs rectangle vs large square)

### Console Verification

Add debug logging:
```typescript
Logger.info(`Rendering ${playerUnits.length + aiUnits.length} units`);
```

Expected: `Rendering 2 units` (1 player, 1 AI for MVP)

### Performance Check

- Units should render without frame drops
- Verify 60fps maintained with multiple units
- Selection highlight animation smooth

---

## Edge Cases & Error Handling

### Edge Case 1: No Units on Battlefield
- If both playerUnits and aiUnits are empty, render nothing
- No errors should be thrown

### Edge Case 2: Unit Outside Grid Bounds
- Check if unit position is valid hex coordinate
- Skip rendering if position is invalid
- Log warning: `Logger.warn('Unit position out of bounds')`

### Edge Case 3: Negative or Zero Health
- Health bar should not render if health <= 0
- Unit sprite should still render (death animation placeholder)
- Consider adding transparency for dead units (optional)

### Edge Case 4: Selected Unit Destroyed
- If selectedUnit is destroyed, gameState.selectedUnit should be null
- No highlight should render
- Handle gracefully without errors

---

## Definition of Done

- [ ] `UnitRenderer.ts` created with all methods implemented
- [ ] Integrated into Renderer.ts rendering pipeline
- [ ] Player and AI units visible on battlefield
- [ ] Weapon type differentiation clear (3 distinct shapes/colors)
- [ ] Health bars display correctly with color coding
- [ ] Selection highlight renders on selected unit
- [ ] No TypeScript compilation errors
- [ ] No console errors during rendering
- [ ] Performance: 60fps with multiple units
- [ ] Visual appearance matches design spec
- [ ] Code reviewed for clarity

---

## Related Stories

- **Depends On:** Story 01 (Battlefield Rendering)
- **Blocks:** Story 05 (Game Loop Integration), Story 06 (Canvas Click Handling)
- **Related:** PRD Story 4 (Three Distinct Weapon Types)

---

## Notes for Developer

**Implementation Tips:**

1. **Placeholder Sprites:** Use colored rectangles for MVP; can be replaced with actual sprites later
2. **Coordinate Consistency:** Use same hexToPixel conversion as BattlefieldRenderer
3. **Rendering Order:** Units must render AFTER battlefield to appear on top
4. **Health Bar Position:** Adjust Y-offset based on unit sprite height

**Common Pitfalls:**

- Canvas state not reset: Use `ctx.save()` and `ctx.restore()` for isolated rendering
- Selection highlight persists: Must clear canvas each frame
- Health bar overflow: Clamp health percentage between 0 and 1
- Unit not centered: Use sprite dimensions to calculate offset from hex center

**Time Estimates:**

- Basic shape rendering: 20 minutes
- Health bar system: 20 minutes
- Selection highlight: 15 minutes
- Color and styling: 15 minutes
- Integration with Renderer: 10 minutes
- Testing: 20 minutes

**Total: ~1.5 hours**

---

**Story Created By:** Bob (Scrum Master)  
**Date:** November 21, 2025  
**Status:** Ready for Development
