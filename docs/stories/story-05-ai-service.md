# Story 05: Basic AI Opponent Service

**Story ID:** SIEGE-005  
**Title:** Implement Simple Tactical AI for Enemy Units  
**Priority:** P0 (Critical)  
**Estimate:** 3 Story Points (~2 hours)  
**Sprint:** MVP Sprint 1  
**Dependencies:** Story 03 (Pathfinding), Story 04 (Combat)

---

## User Story

**As a** player  
**I want to** face an AI opponent that makes tactical decisions  
**So that** I have a challenging single-player experience

---

## Business Context

The AI opponent is essential for single-player gameplay. For the MVP, the AI needs to:
- Make reasonable movement decisions (move toward player)
- Attack when targets are in range
- Follow basic tactical principles (prioritize low-health targets)
- Execute turns without requiring human input

This implements PRD Story 6 (PvE Combat Against AI) with simplified behavior suitable for a 5-hour hackathon timeline.

---

## Acceptance Criteria

### AC1: AI Turn Execution
- [ ] AI takes turn automatically when currentTurn === 'ai'
- [ ] AI processes all its units sequentially
- [ ] AI turn completes and switches back to player turn
- [ ] No infinite loops or turn lockups

### AC2: Movement Decision Making
- [ ] AI units move toward nearest player unit
- [ ] AI uses pathfinding for valid movement
- [ ] AI respects movement range limits
- [ ] AI doesn't move into occupied hexes

### AC3: Attack Decision Making
- [ ] AI attacks if enemy in range
- [ ] AI prioritizes low-health targets
- [ ] AI uses correct attack ranges per weapon type
- [ ] AI attacks before moving (if possible)

### AC4: Turn Order Logic
- [ ] AI considers all units before ending turn
- [ ] Units mark actions taken (moved/attacked)
- [ ] Turn resets action flags for next round

### AC5: Basic Tactical Behavior
- [ ] Attack preferred over movement when both possible
- [ ] Move closer if no attack available
- [ ] Skip turn if no valid actions (surrounded/immobilized)

---

## Technical Implementation Details

### File to Create

#### Primary File: `src/services/AIService.ts`

**Location:** `src/services/AIService.ts`

**Class Structure:**
```typescript
import { GameState } from '../core/GameState';
import { Unit } from '../models/Unit';
import { HexCoordinate } from '../models/HexCoordinate';
import { PathfindingService } from './PathfindingService';
import { CombatService, AttackResult } from './CombatService';
import { HexUtils } from '../utils/HexUtils';
import { Logger } from '../utils/Logger';
import { EventBus } from '../core/EventBus';

export class AIService {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Execute AI turn for all AI units
   * @param gameState Current game state
   */
  public async executeTurn(gameState: GameState): Promise<void> {
    Logger.info('AI turn starting');
    
    // Process each AI unit
    for (const unit of gameState.aiUnits) {
      await this.processUnit(unit, gameState);
      
      // Add delay for visibility (optional)
      await this.delay(500);
    }
    
    // Reset turn flags
    this.resetTurnFlags(gameState.aiUnits);
    
    // End AI turn
    gameState.currentTurn = 'player';
    this.eventBus.emit('turnEnded', { player: 'ai' });
    
    Logger.info('AI turn complete');
  }

  /**
   * Process a single AI unit's turn
   * @param unit AI unit to process
   * @param gameState Current game state
   */
  private async processUnit(unit: Unit, gameState: GameState): Promise<void> {
    // Strategy: Attack if possible, otherwise move closer
    
    // 1. Try to attack first
    const attackExecuted = await this.tryAttack(unit, gameState);
    
    if (attackExecuted) {
      Logger.info(`AI ${unit.type} attacked`);
    }
    
    // 2. Try to move if haven't moved
    if (!unit.hasMovedThisTurn) {
      const moveExecuted = await this.tryMove(unit, gameState);
      
      if (moveExecuted) {
        Logger.info(`AI ${unit.type} moved`);
      }
    }
    
    // 3. If can attack after moving, try again
    if (!unit.hasAttackedThisTurn) {
      await this.tryAttack(unit, gameState);
    }
  }

  /**
   * Attempt to attack with AI unit
   * @param unit AI unit
   * @param gameState Current game state
   * @returns True if attack was executed
   */
  private async tryAttack(unit: Unit, gameState: GameState): Promise<boolean> {
    if (unit.hasAttackedThisTurn) return false;
    
    // Get valid targets
    const targets = CombatService.getValidTargets(unit, gameState);
    
    if (targets.length === 0) return false;
    
    // Choose best target (lowest health)
    const target = this.selectBestTarget(targets);
    
    // Execute attack
    const result = CombatService.executeAttack(unit, target, gameState);
    
    if (result.success) {
      this.eventBus.emit('attackExecuted', result);
      return true;
    }
    
    return false;
  }

  /**
   * Attempt to move AI unit toward nearest enemy
   * @param unit AI unit
   * @param gameState Current game state
   * @returns True if movement was executed
   */
  private async tryMove(unit: Unit, gameState: GameState): Promise<boolean> {
    if (unit.hasMovedThisTurn) return false;
    
    // Find nearest player unit
    const nearestEnemy = this.findNearestEnemy(unit, gameState.playerUnits);
    
    if (!nearestEnemy) return false;
    
    // Get reachable hexes
    const reachableHexes = PathfindingService.getReachableHexes(
      unit.position,
      unit.getMovementRange(),
      gameState
    );
    
    if (reachableHexes.length === 0) return false;
    
    // Choose hex closest to enemy
    const destination = this.selectBestMoveDestination(
      reachableHexes,
      nearestEnemy.position
    );
    
    // Move unit
    const path = PathfindingService.findPath(
      unit.position,
      destination,
      gameState
    );
    
    if (path.length > 0) {
      unit.position = destination;
      unit.hasMovedThisTurn = true;
      
      this.eventBus.emit('unitMoved', { unit, path });
      return true;
    }
    
    return false;
  }

  /**
   * Select best attack target (prioritize low health)
   * @param targets Available targets
   * @returns Best target to attack
   */
  private selectBestTarget(targets: Unit[]): Unit {
    // Sort by health ascending, attack weakest first
    return targets.sort((a, b) => a.health - b.health)[0];
  }

  /**
   * Find nearest enemy unit
   * @param unit AI unit
   * @param enemies Array of enemy units
   * @returns Nearest enemy unit
   */
  private findNearestEnemy(unit: Unit, enemies: Unit[]): Unit | null {
    if (enemies.length === 0) return null;
    
    let nearest = enemies[0];
    let minDistance = PathfindingService.hexDistance(unit.position, nearest.position);
    
    for (const enemy of enemies) {
      const distance = PathfindingService.hexDistance(unit.position, enemy.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    }
    
    return nearest;
  }

  /**
   * Select best movement destination (closest to target)
   * @param reachableHexes Available movement destinations
   * @param targetPosition Target to move toward
   * @returns Best hex to move to
   */
  private selectBestMoveDestination(
    reachableHexes: HexCoordinate[],
    targetPosition: HexCoordinate
  ): HexCoordinate {
    let bestHex = reachableHexes[0];
    let minDistance = PathfindingService.hexDistance(bestHex, targetPosition);
    
    for (const hex of reachableHexes) {
      const distance = PathfindingService.hexDistance(hex, targetPosition);
      if (distance < minDistance) {
        minDistance = distance;
        bestHex = hex;
      }
    }
    
    return bestHex;
  }

  /**
   * Reset turn action flags for all units
   * @param units Units to reset
   */
  private resetTurnFlags(units: Unit[]): void {
    units.forEach(unit => {
      unit.hasMovedThisTurn = false;
      unit.hasAttackedThisTurn = false;
    });
  }

  /**
   * Delay execution for AI turn visibility
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Integration Points

**GameEngine.ts Integration:**

Add AI turn execution to game loop:

```typescript
import { AIService } from '../services/AIService';

export class GameEngine {
  private aiService: AIService;

  constructor(canvas: HTMLCanvasElement) {
    // ... existing code
    this.aiService = new AIService();
  }

  private handleTurnEnded(): void {
    if (this.gameState.currentTurn === 'player') {
      // Player ended turn, switch to AI
      this.gameState.currentTurn = 'ai';
      this.startAITurn();
    } else {
      // AI ended turn, switch to player
      this.gameState.currentTurn = 'player';
      this.resetPlayerUnits();
    }
    
    this.gameState.turnCount++;
  }

  private async startAITurn(): Promise<void> {
    // Disable player input during AI turn
    this.gameState.isAnimating = true;
    
    // Execute AI turn
    await this.aiService.executeTurn(this.gameState);
    
    // Re-enable player input
    this.gameState.isAnimating = false;
  }

  private resetPlayerUnits(): void {
    this.gameState.playerUnits.forEach(unit => {
      unit.hasMovedThisTurn = false;
      unit.hasAttackedThisTurn = false;
    });
  }
}
```

**Event System Integration:**

AI uses EventBus for communication:
- `attackExecuted` - Triggers projectile animation
- `unitMoved` - Triggers movement animation
- `turnEnded` - Signals turn completion

---

## Testing Instructions

### Manual Console Testing

Add to `main.ts` for testing:

```typescript
// Test 1: AI Turn Execution
const gameState = new GameState();
gameState.initialize(WeaponType.CATAPULT);
gameState.currentTurn = 'ai';

const aiService = new AIService();
await aiService.executeTurn(gameState);

console.log(`Turn after AI: ${gameState.currentTurn}`);
// Expected: 'player'

// Test 2: AI Movement
const aiUnit = gameState.aiUnits[0];
const initialPos = {...aiUnit.position};
gameState.currentTurn = 'ai';
await aiService.executeTurn(gameState);
console.log(`AI moved: ${JSON.stringify(initialPos)} -> ${JSON.stringify(aiUnit.position)}`);
// Expected: Position changed toward player

// Test 3: AI Attack
// Position units in attack range
const playerUnit = gameState.playerUnits[0];
const aiUnit2 = gameState.aiUnits[0];
aiUnit2.position = {q: playerUnit.position.q + 4, r: playerUnit.position.r, s: playerUnit.position.s - 4};
const initialHealth = playerUnit.health;
gameState.currentTurn = 'ai';
await aiService.executeTurn(gameState);
console.log(`Player health: ${initialHealth} -> ${playerUnit.health}`);
// Expected: Health reduced by catapult damage
```

### Integration Testing (Full Game)

1. Start game
2. End player turn immediately (click "End Turn")
3. Observe AI unit behavior:
   - AI unit should move toward player
   - If in range, AI should attack
4. Verify turn switches back to player
5. Verify player can act again

### Performance Testing

- AI turn should complete within 1-2 seconds
- No noticeable lag during AI processing
- Delays should feel natural (not too slow/fast)

---

## Edge Cases & Error Handling

### Edge Case 1: No Player Units Remaining
- AI should handle empty playerUnits array
- findNearestEnemy returns null gracefully
- AI turn ends without errors

### Edge Case 2: AI Unit Surrounded
- reachableHexes may be empty
- tryMove returns false, no movement
- Unit can still attack if target in range

### Edge Case 3: All Targets Out of Range
- getValidTargets returns empty array
- tryAttack returns false
- AI attempts movement instead

### Edge Case 4: Turn Loop During Async
- Prevent player input during AI turn using isAnimating flag
- Ensure turn doesn't switch mid-AI-execution

### Edge Case 5: AI Unit Destroyed During Own Turn
- Check if unit still exists before processing
- Skip destroyed units in aiUnits array

---

## Definition of Done

- [ ] `AIService.ts` created with all methods
- [ ] AI turn execution completes successfully
- [ ] AI units move toward player units
- [ ] AI units attack when targets in range
- [ ] AI prioritizes low-health targets
- [ ] Turn switches back to player after AI turn
- [ ] Action flags reset correctly between turns
- [ ] No TypeScript compilation errors
- [ ] Manual testing shows reasonable AI behavior
- [ ] No infinite loops or turn lockups
- [ ] Code reviewed for clarity

---

## Related Stories

- **Depends On:** Story 03 (Pathfinding), Story 04 (Combat)
- **Blocks:** Story 06 (Game Loop Integration)
- **Related:** PRD Story 6 (PvE Combat Against AI)

---

## Notes for Developer

**AI Complexity Levels:**

**MVP (This Story):**
- Attack if possible
- Move toward nearest enemy
- Prioritize weak targets

**Post-Hackathon Enhancements:**
- Tactical positioning (avoid clusters)
- Kiting behavior (maintain range)
- Focus fire (all units target one enemy)
- Defensive positioning when low health

**Implementation Tips:**

1. **Keep It Simple:** Basic behavior is sufficient for MVP
2. **Use Existing Services:** Leverage PathfindingService and CombatService
3. **Async/Await:** Add delays for visual clarity
4. **Event Emission:** Communicate actions to animation system

**Common Pitfalls:**

- Forgetting to reset action flags between turns
- Not checking if unit still alive before processing
- Infinite loop if no valid actions available
- Blocking UI during AI turn (use async properly)
- Not switching turn back to player

**Time Estimates:**

- Basic AI structure: 20 minutes
- Attack logic: 20 minutes
- Movement logic: 30 minutes
- Target selection: 15 minutes
- Turn management: 20 minutes
- Testing: 15 minutes

**Total: ~2 hours**

---

**Story Created By:** Bob (Scrum Master)  
**Date:** November 21, 2025  
**Status:** Ready for Development
