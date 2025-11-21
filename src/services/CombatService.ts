import { Unit } from '../models/Unit';
import { HexCoordinate } from '../models/HexCoordinate';
import { GameState } from '../core/GameState';
import { HexUtils } from '../utils/HexUtils';
import { CONSTANTS } from '../utils/Constants';
import { Logger } from '../utils/Logger';
import { EventBus } from '../core/EventBus';

/**
 * CombatService - Attack Resolution and Damage Calculation
 * Handles combat mechanics, range checking, and unit destruction
 */
export class CombatService {
  /**
   * Calculate all hexes within attack range of a unit
   * Uses hex distance to determine valid attack positions
   * 
   * @param unit Attacking unit
   * @param gameState Current game state
   * @returns Array of hex coordinates in attack range
   */
  public static getAttackRange(unit: Unit, gameState: GameState): HexCoordinate[] {
    const range = unit.getAttackRange();
    const attackableHexes: HexCoordinate[] = [];
    
    // Iterate through all battlefield hexes
    gameState.battlefield.forEach((tile) => {
      const coord = tile.coordinate;
      const distance = HexUtils.distance(unit.position, coord);
      
      // Check if in range (between min and max)
      // Also check if within playable area (shrink zone)
      if (distance >= range.min && distance <= range.max) {
        const centerDistance = HexUtils.distance(coord, HexUtils.create(0, 0));
        if (centerDistance <= gameState.shrinkRadius) {
          attackableHexes.push(coord);
        }
      }
    });
    
    return attackableHexes;
  }

  /**
   * Get all valid enemy targets within attack range
   * Filters enemy units that are within attackable hexes
   * 
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
      if (!enemy.isAlive()) return false;
      
      const enemyKey = HexUtils.toKey(enemy.position);
      return attackRange.some(hex => HexUtils.toKey(hex) === enemyKey);
    });
  }

  /**
   * Check if specific target is valid for attack
   * Validates range, ownership, turn state, and fog of war
   * 
   * @param attacker Attacking unit
   * @param target Target unit
   * @param gameState Current game state (optional, for fog of war check)
   * @returns True if target can be attacked
   */
  public static canAttack(
    attacker: Unit, 
    target: Unit,
    gameState?: GameState
  ): boolean {
    // Cannot attack if already attacked this turn
    if (attacker.hasAttackedThisTurn) {
      Logger.debug('Unit has already attacked this turn');
      return false;
    }
    
    // Cannot attack friendly units
    if (attacker.owner === target.owner) {
      Logger.debug('Cannot attack friendly units');
      return false;
    }
    
    // Must be in attack range
    const distance = HexUtils.distance(
      attacker.position, 
      target.position
    );
    const range = attacker.getAttackRange();
    
    if (distance < range.min || distance > range.max) {
      Logger.debug(`Target out of range: ${distance} (need ${range.min}-${range.max})`);
      return false;
    }
    
    // Target must be alive
    if (!target.isAlive()) {
      Logger.debug('Target is already destroyed');
      return false;
    }
    
    // Check fog of war: player can only attack visible enemies
    if (gameState && attacker.owner === 'player') {
      if (!gameState.visionService.isUnitVisibleToPlayer(target)) {
        Logger.debug('Cannot attack unit in fog of war');
        return false;
      }
    }
    
    return true;
  }

  /**
   * Execute attack from attacker to target
   * Applies damage, marks turn actions, handles destruction
   * 
   * @param attacker Attacking unit
   * @param target Target unit
   * @param gameState Current game state
   * @returns Attack result with damage dealt and destruction status
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
    
    // Calculate damage (minimum 1)
    const damage = Math.max(CONSTANTS.MIN_DAMAGE, attacker.getDamage());
    
    // Store target health before damage for logging
    const targetHealthBefore = target.health;
    
    // Apply damage to target
    target.takeDamage(damage);
    
    // Mark attacker as having attacked
    attacker.hasAttackedThisTurn = true;
    
    Logger.info(`${attacker.type} dealt ${damage} damage to ${target.type} (${targetHealthBefore} → ${target.health} HP)`);
    
    // Emit event for sound effect
    EventBus.getInstance().emit('attackExecuted', {
      attackerId: attacker.id,
      targetId: target.id,
      damage: damage,
      weaponType: attacker.type
    });
    
    // Check if target destroyed
    const targetDestroyed = !target.isAlive();
    
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
   * Removes unit from arrays, awards XP, clears selection
   * 
   * @param destroyed The destroyed unit
   * @param attacker The unit that dealt killing blow
   * @param gameState Current game state
   */
  private static handleUnitDestruction(
    destroyed: Unit,
    attacker: Unit,
    gameState: GameState
  ): void {
    Logger.info(`${destroyed.type} (${destroyed.owner}) destroyed by ${attacker.type}!`);
    
    // Remove from appropriate unit array
    if (destroyed.owner === 'player') {
      const index = gameState.playerUnits.findIndex(u => u.id === destroyed.id);
      if (index !== -1) {
        gameState.playerUnits.splice(index, 1);
        Logger.debug(`Removed player unit, ${gameState.playerUnits.length} remaining`);
      }
    } else {
      const index = gameState.aiUnits.findIndex(u => u.id === destroyed.id);
      if (index !== -1) {
        gameState.aiUnits.splice(index, 1);
        Logger.debug(`Removed AI unit, ${gameState.aiUnits.length} remaining`);
      }
    }
    
    // Award XP if player got the kill
    if (attacker.owner === 'player' && destroyed.owner === 'ai') {
      gameState.enemiesDestroyedByPlayer++;
      Logger.info(`Player earned ${CONSTANTS.XP_PER_KILL} XP! Total enemies destroyed: ${gameState.enemiesDestroyedByPlayer}`);
    }
    
    // Clear selection if destroyed unit was selected
    if (gameState.selectedUnit?.id === destroyed.id) {
      gameState.selectedUnit = null;
      gameState.validMoveHexes = [];
      gameState.validAttackHexes = [];
    }
  }

  /**
   * Check if hex coordinate contains an enemy unit
   * Helper method for target selection
   * 
   * @param coord Hex coordinate to check
   * @param attacker The attacking unit (to determine which units are enemies)
   * @param gameState Current game state
   * @returns Enemy unit at coordinate, or null if none
   */
  public static getEnemyAtHex(
    coord: HexCoordinate,
    attacker: Unit,
    gameState: GameState
  ): Unit | null {
    const enemyUnits = attacker.owner === 'player' 
      ? gameState.aiUnits 
      : gameState.playerUnits;
    
    const coordKey = HexUtils.toKey(coord);
    return enemyUnits.find(unit => 
      HexUtils.toKey(unit.position) === coordKey && unit.isAlive()
    ) || null;
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
