# Story 06: Game Loop Integration & Canvas Interaction

**Story ID:** SIEGE-006  
**Title:** Complete GameEngine Integration with User Input and Victory Conditions  
**Priority:** P0 (Critical)  
**Estimate:** 2 Story Points (~1.5 hours)  
**Sprint:** MVP Sprint 1  
**Dependencies:** Story 01-05 (All rendering and services)

---

## User Story

**As a** player  
**I want to** interact with the game by clicking on hexes and units  
**So that** I can select units, move them, and attack enemies

---

## Business Context

This story connects all previously built systems into a playable game. It implements:
- Canvas click detection to hex coordinate conversion
- Unit selection via click
- Movement and attack actions via click
- Victory/defeat detection
- Turn progression
- UI state updates

This is the **final integration story** that makes the game fully playable.

---

## Acceptance Criteria

### AC1: Canvas Click to Hex Conversion
- [ ] Mouse clicks on canvas converted to hex coordinates
- [ ] Pixel coordinates correctly mapped to cube coordinates
- [ ] Click detection accounts for hex boundaries
- [ ] Out-of-bounds clicks handled gracefully

### AC2: Unit Selection
- [ ] Clicking on player unit selects it
- [ ] Selected unit highlighted (via rendering system)
- [ ] Valid move hexes displayed (blue overlay)
- [ ] Valid attack hexes displayed (red overlay)
- [ ] Clicking empty hex deselects unit

### AC3: Movement Action
- [ ] Clicking valid move hex moves selected unit
- [ ] Unit position updated in GameState
- [ ] Movement animation triggered (optional for MVP)
- [ ] Unit marked as hasMovedThisTurn
- [ ] Invalid moves rejected with visual feedback

### AC4: Attack Action
- [ ] Clicking enemy unit in attack range triggers attack
- [ ] Projectile animation displayed (optional for MVP)
- [ ] Damage applied to target
- [ ] Unit marked as hasAttackedThisTurn
- [ ] Invalid attacks rejected

### AC5: Turn Management
- [ ] "End Turn" button ends player turn
- [ ] AI turn executes automatically
- [ ] Turn indicator updates (Player/AI)
- [ ] Action flags reset at start of turn

### AC6: Victory Conditions
- [ ] Victory screen shown when all AI units destroyed
- [ ] Defeat screen shown when all player units destroyed
- [ ] XP earned displayed on victory screen
- [ ] "Play Again" button restarts game

---

## Technical Implementation Details

### Files to Modify/Create

#### Modify: `src/core/GameEngine.ts`

Add complete input handling and game loop logic:

```typescript
import { Renderer } from '../rendering/Renderer';
import { PathfindingService } from '../services/PathfindingService';
import { CombatService } from '../services/CombatService';
import { AIService } from '../services/AIService';
import { HexUtils } from '../utils/HexUtils';
import { HexCoordinate } from '../models/HexCoordinate';
import { Unit } from '../models/Unit';

export class GameEngine {
  private renderer: Renderer;
  private aiService: AIService;
  private canvas: HTMLCanvasElement;
  private gameState: GameState;
  private eventBus: EventBus;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.eventBus = EventBus.getInstance();
    this.gameState = new GameState();
    this.renderer = new Renderer(canvas);
    this.aiService = new AIService();
    
    this.setupEventListeners();
    this.setupCanvasInput();
    Logger.info('GameEngine initialized');
  }

  private setupCanvasInput(): void {
    this.canvas.addEventListener('click', (event) => {
      this.handleCanvasClick(event);
    });
  }

  private handleCanvasClick(event: MouseEvent): void {
    // Don't process clicks during AI turn or animations
    if (this.gameState.isAnimating || this.gameState.currentTurn === 'ai') {
      return;
    }
    
    // Convert mouse position to hex coordinate
    const hexCoord = this.pixelToHex(event.offsetX, event.offsetY);
    
    if (!hexCoord || !HexUtils.inBounds(hexCoord)) {
      return;
    }
    
    Logger.info(`Hex clicked: ${HexUtils.toKey(hexCoord)}`);
    
    // Check what was clicked
    const clickedUnit = this.getUnitAtHex(hexCoord);
    
    if (clickedUnit) {
      this.handleUnitClick(clickedUnit, hexCoord);
    } else {
      this.handleEmptyHexClick(hexCoord);
    }
  }

  private pixelToHex(pixelX: number, pixelY: number): HexCoordinate | null {
    // Convert from canvas pixel coordinates to hex cube coordinates
    // This is the inverse of the hexToPixel function used in rendering
    
    const hexSize = 35; // Must match BattlefieldRenderer.hexSize
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // Adjust for canvas center offset
    const x = pixelX - centerX;
    const y = pixelY - centerY;
    
    // Flat-top hex orientation inverse transform
    const q = (2/3 * x) / hexSize;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / hexSize;
    const s = -q - r;
    
    // Round to nearest hex using cube coordinate rounding
    return this.cubeRound({q, r, s});
  }

  private cubeRound(frac: {q: number, r: number, s: number}): HexCoordinate {
    let q = Math.round(frac.q);
    let r = Math.round(frac.r);
    let s = Math.round(frac.s);
    
    const qDiff = Math.abs(q - frac.q);
    const rDiff = Math.abs(r - frac.r);
    const sDiff = Math.abs(s - frac.s);
    
    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    } else {
      s = -q - r;
    }
    
    return {q, r, s};
  }

  private getUnitAtHex(coord: HexCoordinate): Unit | null {
    const key = HexUtils.toKey(coord);
    
    // Check player units
    for (const unit of this.gameState.playerUnits) {
      if (HexUtils.toKey(unit.position) === key) {
        return unit;
      }
    }
    
    // Check AI units
    for (const unit of this.gameState.aiUnits) {
      if (HexUtils.toKey(unit.position) === key) {
        return unit;
      }
    }
    
    return null;
  }

  private handleUnitClick(unit: Unit, coord: HexCoordinate): void {
    const selectedUnit = this.gameState.selectedUnit;
    
    if (unit.owner === 'player') {
      // Select player unit
      this.selectUnit(unit);
    } else {
      // Clicked enemy unit - try to attack
      if (selectedUnit && selectedUnit.owner === 'player') {
        this.tryAttack(selectedUnit, unit);
      }
    }
  }

  private handleEmptyHexClick(coord: HexCoordinate): void {
    const selectedUnit = this.gameState.selectedUnit;
    
    if (!selectedUnit) {
      return; // No unit selected, nothing to do
    }
    
    // Try to move to this hex
    this.tryMove(selectedUnit, coord);
  }

  private selectUnit(unit: Unit): void {
    this.gameState.selectedUnit = unit;
    
    // Calculate valid moves
    this.gameState.validMoveHexes = PathfindingService.getReachableHexes(
      unit.position,
      unit.getMovementRange(),
      this.gameState
    );
    
    // Calculate valid attacks
    this.gameState.validAttackHexes = CombatService.getAttackRange(
      unit,
      this.gameState
    );
    
    this.eventBus.emit('unitSelected', {unit});
    Logger.info(`Selected unit: ${unit.type}`);
  }

  private tryMove(unit: Unit, destination: HexCoordinate): void {
    if (unit.hasMovedThisTurn) {
      Logger.warn('Unit has already moved this turn');
      return;
    }
    
    // Check if destination is valid
    const destKey = HexUtils.toKey(destination);
    const isValidMove = this.gameState.validMoveHexes.some(
      hex => HexUtils.toKey(hex) === destKey
    );
    
    if (!isValidMove) {
      Logger.warn('Invalid move destination');
      return;
    }
    
    // Find path
    const path = PathfindingService.findPath(
      unit.position,
      destination,
      this.gameState
    );
    
    if (path.length === 0) {
      Logger.warn('No path to destination');
      return;
    }
    
    // Execute move
    unit.position = destination;
    unit.hasMovedThisTurn = true;
    
    // Update valid actions after move
    this.selectUnit(unit);
    
    this.eventBus.emit('unitMoved', {unit, path});
    Logger.info(`Unit moved to ${destKey}`);
  }

  private tryAttack(attacker: Unit, target: Unit): void {
    if (attacker.hasAttackedThisTurn) {
      Logger.warn('Unit has already attacked this turn');
      return;
    }
    
    // Execute attack
    const result = CombatService.executeAttack(
      attacker,
      target,
      this.gameState
    );
    
    if (result.success) {
      this.eventBus.emit('attackExecuted', result);
      Logger.info(`Attack dealt ${result.damage} damage`);
      
      // Check victory conditions
      this.checkVictoryConditions();
      
      // Update valid actions
      if (this.gameState.selectedUnit?.id === attacker.id) {
        this.selectUnit(attacker);
      }
    } else {
      Logger.warn('Attack failed');
    }
  }

  private checkVictoryConditions(): void {
    if (this.gameState.aiUnits.length === 0) {
      this.handleVictory();
    } else if (this.gameState.playerUnits.length === 0) {
      this.handleDefeat();
    }
  }

  private handleVictory(): void {
    Logger.info('Player victory!');
    this.eventBus.emit('victory', {
      winner: 'player',
      turnsPlayed: this.gameState.turnCount
    });
    // UIController will handle showing victory screen
  }

  private handleDefeat(): void {
    Logger.info('Player defeat!');
    this.eventBus.emit('defeat', {
      winner: 'ai',
      turnsPlayed: this.gameState.turnCount
    });
    // UIController will handle showing defeat screen
  }

  private async handleTurnEnded(): Promise<void> {
    if (this.gameState.currentTurn === 'player') {
      // Player ended turn
      Logger.info('Player turn ended');
      this.gameState.currentTurn = 'ai';
      this.gameState.selectedUnit = null;
      
      // Start AI turn
      this.gameState.isAnimating = true;
      await this.aiService.executeTurn(this.gameState);
      this.gameState.isAnimating = false;
      
      // Reset player units for new turn
      this.gameState.playerUnits.forEach(unit => {
        unit.hasMovedThisTurn = false;
        unit.hasAttackedThisTurn = false;
      });
      
      this.gameState.turnCount++;
      Logger.info('Player turn started');
    }
  }

  // Existing game loop methods (update, render)
  private update(deltaTime: number): void {
    // Update animations, effects, etc.
    // For MVP, can be minimal
  }

  private render(): void {
    this.renderer.render(this.gameState);
  }
}
```

#### Modify: `src/ui/UIController.ts`

Add event listeners for victory/defeat:

```typescript
export class UIController {
  constructor() {
    this.setupEventListeners();
    this.setupVictoryDefeatHandlers();
  }

  private setupVictoryDefeatHandlers(): void {
    const eventBus = EventBus.getInstance();
    
    eventBus.on('victory', (data) => {
      this.showVictoryScreen(data);
    });
    
    eventBus.on('defeat', (data) => {
      this.showDefeatScreen(data);
    });
  }

  private showVictoryScreen(data: any): void {
    // Hide game screen
    document.getElementById('gameScreen')!.classList.add('hidden');
    
    // Show victory screen
    const victoryScreen = document.getElementById('victoryScreen')!;
    victoryScreen.classList.remove('hidden');
    
    // Update victory text
    document.getElementById('victoryText')!.textContent = 
      `Victory! Turns: ${data.turnsPlayed}`;
  }

  private showDefeatScreen(data: any): void {
    // Hide game screen
    document.getElementById('gameScreen')!.classList.add('hidden');
    
    // Show defeat screen
    const defeatScreen = document.getElementById('defeatScreen')!;
    defeatScreen.classList.remove('hidden');
    
    // Update defeat text
    document.getElementById('defeatText')!.textContent = 
      `Defeat! Turns: ${data.turnsPlayed}`;
  }
}
```

#### Create: `src/rendering/OverlayRenderer.ts` (Optional)

For rendering valid move/attack hexes:

```typescript
export class OverlayRenderer {
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;

  constructor(ctx: CanvasRenderingContext2D, hexSize: number) {
    this.ctx = ctx;
    this.hexSize = hexSize;
  }

  public renderMoveOverlay(hexes: HexCoordinate[]): void {
    hexes.forEach(hex => {
      const pixel = this.hexToPixel(hex);
      this.drawHexOverlay(pixel, 'rgba(100, 150, 255, 0.3)'); // Blue
    });
  }

  public renderAttackOverlay(hexes: HexCoordinate[]): void {
    hexes.forEach(hex => {
      const pixel = this.hexToPixel(hex);
      this.drawHexOverlay(pixel, 'rgba(255, 100, 100, 0.3)'); // Red
    });
  }

  private drawHexOverlay(pixel: {x: number, y: number}, color: string): void {
    // Draw semi-transparent hex overlay
    this.ctx.fillStyle = color;
    // ... hex drawing code (reuse from BattlefieldRenderer)
  }
}
```

---

## Testing Instructions

### Full Integration Testing

1. **Start Game:**
   - Run `npm run dev`
   - Select weapon from main menu
   - Click "Start Battle"

2. **Test Unit Selection:**
   - Click on player unit
   - Verify blue hexes appear (valid moves)
   - Verify red hexes appear (valid attacks)
   - Click empty area → selection should clear

3. **Test Movement:**
   - Select unit
   - Click blue hex
   - Verify unit moves to new position
   - Verify blue hexes update based on new position

4. **Test Attack:**
   - Position unit in range of enemy
   - Select unit
   - Click enemy unit
   - Verify damage dealt
   - Verify health bar updates

5. **Test Turn Progression:**
   - Click "End Turn"
   - Verify AI turn executes
   - Verify AI unit moves/attacks
   - Verify turn switches back to player

6. **Test Victory:**
   - Destroy all AI units
   - Verify victory screen appears
   - Verify XP earned displayed

7. **Test Defeat:**
   - Let AI destroy all player units
   - Verify defeat screen appears

---

## Edge Cases & Error Handling

### Edge Case 1: Click Outside Canvas
- event.offsetX/offsetY may be negative
- Pixel to hex conversion should return null
- No action taken

### Edge Case 2: Rapid Clicking During AI Turn
- isAnimating flag prevents clicks
- UI should show "AI Turn" indicator

### Edge Case 3: Click on Dead Unit
- getUnitAtHex checks unit arrays
- Dead units already removed
- No invalid references

### Edge Case 4: Select Unit After Moving
- Unit can still attack after moving
- Valid attack hexes should still display
- Movement hexes should be empty

---

## Definition of Done

- [ ] Canvas click detection working
- [ ] Unit selection functional
- [ ] Movement system working
- [ ] Attack system working
- [ ] Turn progression working
- [ ] Victory/defeat detection working
- [ ] UI screens transition correctly
- [ ] No TypeScript errors
- [ ] Full game playable end-to-end
- [ ] Performance: 60fps maintained
- [ ] Code reviewed

---

## Related Stories

- **Depends On:** Stories 01-05 (all systems)
- **Blocks:** None (final integration)
- **Related:** All PRD stories

---

## Notes for Developer

**Time Estimates:**
- Click detection: 20 minutes
- Unit selection: 15 minutes
- Movement integration: 20 minutes
- Attack integration: 15 minutes
- Victory conditions: 10 minutes
- Testing: 20 minutes

**Total: ~1.5 hours**

---

**Story Created By:** Bob (Scrum Master)  
**Date:** November 21, 2025  
**Status:** Ready for Development
