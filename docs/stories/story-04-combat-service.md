# Story 04: Combat Resolution Service

**Story ID:** SIEGE-004  
**Title:** Implement Combat System with Attack Range and Damage Resolution  
**Priority:** P0 (Critical)  
**Estimate:** 2 Story Points (~1.5 hours)  
**Sprint:** MVP Sprint 1  
**Dependencies:** Story 03 (Pathfinding - for range calculation)

---

## User Story

**As a** player  
**I want to** attack enemy units within my weapon's range and deal damage  
**So that** I can destroy enemies and win battles

---

## Business Context

Combat is the primary interaction mechanic in Siege Tactics. This service implements:
- Attack range calculation for each weapon type
- Valid attack target determination
- Damage application to target units
- Unit destruction when health reaches zero

This implements PRD Story 3 (Weapon Attack Actions) and Story 4 (Three Distinct Weapon Types).

---

## Acceptance Criteria

### AC1: Attack Range Calculation
- [ ] Calculate valid attack hexes based on weapon type
- [ ] Catapult range: 4-5 hexes
- [ ] Ballista range: 5-6 hexes  
- [ ] Trebuchet range: 6-8 hexes
- [ ] Range uses hex distance (not Euclidean)
- [ ] Minimum range respected (can't attack adjacent hexes)

### AC2: Valid Target Determination
- [ ] Enemy units within attack range are valid targets
- [ ] Friendly units cannot be targeted
- [ ] Targets must be visible (fog of war - Story 07, skip for MVP)
- [ ] Empty hexes are not valid targets

### AC3: Damage Application
- [ ] Attacking unit's damage value applied to target
- [ ] Target health reduced by damage amount
- [ ] Damage based on weapon stats from WeaponStats.ts
- [ ] Minimum damage of 1 (no zero damage attacks)

### AC4: Unit Destruction
- [ ] Unit removed from battlefield when health <= 0
- [ ] Destroyed units removed from playerUnits or aiUnits array
- [ ] XP awarded to attacker for kills (player only)
- [ ] Event emitted when unit destroyed

### AC5: Turn Action Tracking
- [ ] Attacking unit marked as hasAttackedThisTurn = true
- [ ] Units cannot attack twice in same turn
- [ ] Attack action separate from movement action

---

## Technical Implementation Details

### File to Create

#### Primary File: `src/services/CombatService.ts`

**Location:** `src/services/CombatService.ts`

**Class Structure:**
```typescript
import { Unit } from '../models/Unit';
import { HexCoordinate } from '../models/HexCoordinate';
import { GameState } from '../core/GameState';
import { HexUtils } from '../utils/HexUtils';
import { PathfindingService } from './PathfindingService';
import { CONSTANTS } from '../utils/Constants';
import { Logger } from '../utils/Logger';

export class CombatService {
  /**
   * Calculate all hexes within attack range of a unit
   * @param unit Attacking unit
   * @param gameState Current game state
   * @returns Array of hex coordinates in attack range
   */
  public static getAttackRange(unit: Unit, gameState: GameState): HexCoordinate[] {
    const range = unit.getAttackRange();
    const attackableHexes: HexCoordinate[] = [];
    
    // Iterate through all battlefield hexes
    gameState.battlefield.forEach((tile, key) => {
      const coord = tile.coordinate;
      const distance = PathfindingService.hexDistance(unit.position, coord);
      
      // Check if in range (between min and max)
      if (distance >= range.min && distance <= range.max) {
        attackableHexes.push(coord);
      }
    });
    
    return attackableHexes;
  }

  /**
   * Get all valid enemy targets within attack range
   * @param attacker Attacking unit
   * @param gameState Current game state
   * @returns Array of enemy units that can be attacked
   */
  public static getValidTargets(attacker: Unit, gameState: GameState): Unit[] {
    const attackRange = this.getAttackRange(attacker, gameState);
    const enemyUnits = attacker.owner === 'player' 
      ? gameState.aiUnits 
      : gameState.playerUnits;
    
    return enemyUnits.filter(enemy => {
      const enemyKey = HexUtils.toKey(enemy.position);
      return attackRange.some(hex => HexUtils.toKey(hex) === enemyKey);
    });
  }

  /**
   * Check if target is valid for attack
   * @param attacker Attacking unit
   * @param target Target unit
   * @param gameState Current game state
   * @returns True if target can be attacked
   */
  public static canAttack(
    attacker: Unit, 
    target: Unit, 
    gameState: GameState
  ): boolean {
    // Cannot attack if already attacked this turn
    if (attacker.hasAttackedThisTurn) {
      return false;
    }
    
    // Cannot attack friendly units
    if (attacker.owner === target.owner) {
      return false;
    }
    
    // Must be in attack range
    const distance = PathfindingService.hexDistance(
      attacker.position, 
      target.position
    );
    const range = attacker.getAttackRange();
    
    if (distance < range.min || distance > range.max) {
      return false;
    }
    
    // Target must be alive
    if (target.health <= 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Execute attack from attacker to target
   * @param attacker Attacking unit
   * @param target Target unit
   * @param gameState Current game state
   * @returns Attack result with damage dealt and target destroyed status
   */
  public static executeAttack(
    attacker: Unit,
    target: Unit,
    gameState: GameState
  ): AttackResult {
    // Validate attack
    if (!this.canAttack(attacker, target, gameState)) {
      Logger.warn('Invalid attack attempted');
      return { success: false, damage: 0, targetDestroyed: false };
    }
    
    // Calculate damage
    const damage = attacker.getDamage();
    
    // Apply damage to target
    target.takeDamage(damage);
    
    // Mark attacker as having attacked
    attacker.hasAttackedThisTurn = true;
    
    Logger.info(`${attacker.type} dealt ${damage} damage to ${target.type}`);
    
    // Check if target destroyed
    const targetDestroyed = target.health <= 0;
    
    if (targetDestroyed) {
      this.handleUnitDestruction(target, attacker, gameState);
    }
    
    return {
      success: true,
      damage: damage,
      targetDestroyed: targetDestroyed,
      attacker: attacker,
      target: target
    };
  }

  /**
   * Handle unit destruction and cleanup
   * @param destroyed The destroyed unit
   * @param attacker The unit that dealt killing blow
   * @param gameState Current game state
   */
  private static handleUnitDestruction(
    destroyed: Unit,
    attacker: Unit,
    gameState: GameState
  ): void {
    Logger.info(`${destroyed.type} (${destroyed.owner}) destroyed!`);
    
    // Remove from appropriate unit array
    if (destroyed.owner === 'player') {
      const index = gameState.playerUnits.findIndex(u => u.id === destroyed.id);
      if (index !== -1) {
        gameState.playerUnits.splice(index, 1);
      }
    } else {
      const index = gameState.aiUnits.findIndex(u => u.id === destroyed.id);
      if (index !== -1) {
        gameState.aiUnits.splice(index, 1);
      }
    }
    
    // Award XP if player got the kill
    if (attacker.owner === 'player') {
      // XP awarding handled by ProgressRepository (Story 05)
      // For now, just emit event
      Logger.info(`Player earned ${CONSTANTS.XP_PER_KILL} XP!`);
    }
    
    // Clear selection if destroyed unit was selected
    if (gameState.selectedUnit?.id === destroyed.id) {
      gameState.selectedUnit = null;
    }
  }
}

/**
 * Result of an attack action
 */
export interface AttackResult {
  success: boolean;
  damage: number;
  targetDestroyed: boolean;
  attacker?: Unit;
  target?: Unit;
}
```

### Integration Points

**GameEngine.ts Usage:**

When player clicks enemy unit to attack:

```typescript
import { CombatService, AttackResult } from '../services/CombatService';

private handleAttackAction(target: Unit): void {
  const attacker = this.gameState.selectedUnit;
  if (!attacker) return;
  
  // Execute attack
  const result = CombatService.executeAttack(
    attacker,
    target,
    this.gameState
  );
  
  if (result.success) {
    // Emit event for projectile animation (Story 05)
    this.eventBus.emit('attackExecuted', result);
    
    // Check victory conditions
    this.checkVictoryConditions();
  }
}

private checkVictoryConditions(): void {
  if (this.gameState.aiUnits.length === 0) {
    this.eventBus.emit('victory', 'player');
  } else if (this.gameState.playerUnits.length === 0) {
    this.eventBus.emit('defeat', 'ai');
  }
}
```

**GameState.ts Usage:**

Calculate and store valid attack hexes:

```typescript
import { CombatService } from '../services/CombatService';

public selectUnit(unit: Unit): void {
  this.selectedUnit = unit;
  
  // Calculate valid moves
  this.validMoveHexes = PathfindingService.getReachableHexes(
    unit.position,
    unit.getMovementRange(),
    this
  );
  
  // Calculate valid attack hexes
  this.validAttackHexes = CombatService.getAttackRange(unit, this);
}
```

### Constants to Add

Add to `src/utils/Constants.ts`:

```typescript
export const CONSTANTS = {
  // ... existing constants
  XP_PER_KILL: 50, // XP awarded per enemy destroyed
  MIN_DAMAGE: 1 // Minimum damage per attack
};
```

### Existing Code References

**WeaponStats.ts:**
- Already defines attack ranges for each weapon type
- `attackRangeMin` and `attackRangeMax` properties
- `damage` property for damage calculation

**Unit.ts:**
- `unit.getAttackRange()` returns {min, max} object
- `unit.getDamage()` returns weapon damage value
- `unit.takeDamage(amount)` reduces health
- `unit.hasAttackedThisTurn` flag for turn tracking

---

## Testing Instructions

### Manual Console Testing

Add to `main.ts` for testing:

```typescript
// Test 1: Attack Range Calculation
const gameState = new GameState();
gameState.initialize(WeaponType.CATAPULT);
const playerUnit = gameState.playerUnits[0];
const attackRange = CombatService.getAttackRange(playerUnit, gameState);
console.log(`Attack range hexes: ${attackRange.length}`);
// Expected: ~30-40 hexes for catapult (range 4-5)

// Test 2: Valid Targets
const targets = CombatService.getValidTargets(playerUnit, gameState);
console.log(`Valid targets: ${targets.length}`);
// Expected: 0 or 1 (depending on AI spawn position)

// Test 3: Attack Execution
const aiUnit = gameState.aiUnits[0];
// Move units into range manually for testing
aiUnit.position = {q: 0, r: 4, s: -4}; // Within catapult range
const result = CombatService.executeAttack(playerUnit, aiUnit, gameState);
console.log(`Attack result:`, result);
// Expected: success=true, damage=30-40, targetDestroyed depends on health

// Test 4: Unit Destruction
const lowHealthUnit = gameState.aiUnits[0];
lowHealthUnit.health = 10;
const killResult = CombatService.executeAttack(playerUnit, lowHealthUnit, gameState);
console.log(`Target destroyed: ${killResult.targetDestroyed}`);
console.log(`AI units remaining: ${gameState.aiUnits.length}`);
// Expected: targetDestroyed=true, aiUnits.length reduced by 1
```

### Integration Testing (After UI)

1. Select player unit
2. Valid attack hexes highlighted in red
3. Click enemy unit in range
4. Damage numbers appear (optional visual)
5. Enemy health bar decreases
6. Enemy destroyed when health reaches 0
7. Victory screen appears when all enemies destroyed

---

## Edge Cases & Error Handling

### Edge Case 1: Attack Out of Range
- `canAttack()` returns false
- `executeAttack()` returns failure result
- No damage dealt, no turn consumed

### Edge Case 2: Already Attacked This Turn
- `canAttack()` returns false
- UI should disable attack option

### Edge Case 3: Friendly Fire Attempt
- `canAttack()` returns false
- Prevents player from damaging own units

### Edge Case 4: Overkill Damage
- If damage > remaining health, unit destroyed
- Excess damage ignored (no splash damage)

### Edge Case 5: Attacking Dead Unit
- `canAttack()` returns false
- Dead units should be removed from arrays

### Edge Case 6: Selected Unit Destroyed
- Clear `gameState.selectedUnit` reference
- Prevents null reference errors

---

## Definition of Done

- [ ] `CombatService.ts` created with all methods
- [ ] Attack range calculation correct for all weapon types
- [ ] Valid target determination works
- [ ] Damage application reduces target health
- [ ] Unit destruction removes unit from arrays
- [ ] Turn action tracking (hasAttackedThisTurn) functional
- [ ] No TypeScript compilation errors
- [ ] Manual console tests pass
- [ ] Victory/defeat detection works
- [ ] Code reviewed for clarity

---

## Related Stories

- **Depends On:** Story 03 (Pathfinding - for distance calculation)
- **Blocks:** Story 05 (Game Loop Integration - combat actions)
- **Related:** PRD Story 3 (Weapon Attack Actions), PRD Story 4 (Weapon Types)

---

## Notes for Developer

**Implementation Tips:**

1. **Range Calculation:** Use PathfindingService.hexDistance for accuracy
2. **Array Filtering:** Use Array.some() for efficient hex matching
3. **Immutable Checks:** Validate before modifying state
4. **Event Emission:** Prepare for animation system (Story 05)

**Common Pitfalls:**

- Forgetting minimum range (can't attack adjacent)
- Mutating wrong unit array (player vs AI)
- Not clearing selectedUnit when destroyed
- Off-by-one in range comparison (>= vs >)
- Not checking hasAttackedThisTurn flag

**Time Estimates:**

- Attack range calculation: 20 minutes
- Valid target filtering: 15 minutes
- Damage application: 15 minutes
- Unit destruction logic: 20 minutes
- Testing: 20 minutes

**Total: ~1.5 hours**

---

**Story Created By:** Bob (Scrum Master)  
**Date:** November 21, 2025  
**Status:** Ready for Development
