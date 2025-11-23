import { GameState } from '../core/GameState';
import { Unit } from '../models/Unit';
import { HexCoordinate } from '../models/HexCoordinate';
import { PathfindingService } from './PathfindingService';
import { CombatService } from './CombatService';
import { HexUtils } from '../utils/HexUtils';
import { Logger } from '../utils/Logger';
import { EventBus } from '../core/EventBus';

/**
 * AIService - Simple Tactical AI for Enemy Units
 * Executes AI turns with basic attack/movement decision making
 */
export class AIService {
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Execute AI turn for all AI units
   * Strategy: Attack if possible, otherwise move closer to enemies
   * 
   * @param gameState Current game state
   */
  public async executeTurn(gameState: GameState): Promise<void> {
    Logger.info('=== AI Turn Executing ===');
    
    // Check if any AI units remain
    if (gameState.aiUnits.length === 0) {
      Logger.info('No AI units remaining');
      return;
    }
    
    // Process each AI unit
    for (const unit of [...gameState.aiUnits]) {
      // Skip if unit was destroyed during this turn
      if (!unit.isAlive()) continue;
      
      await this.processUnit(unit, gameState);
      
      // Add delay for visibility
      await this.delay(500);
    }
    
    // End AI turn and switch to player
    Logger.info('=== AI Turn Complete ===');
    gameState.switchTurn('player');
    this.eventBus.emit('playerTurnStarted');
  }

  /**
   * Process a single AI unit's turn
   * Strategy: Try to attack first, then move if no attack possible
   * 
   * @param unit AI unit to process
   * @param gameState Current game state
   */
  private async processUnit(unit: Unit, gameState: GameState): Promise<void> {
    Logger.debug(`Processing AI ${unit.type} at (${unit.position.q}, ${unit.position.r})`);
    
    // Strategy: Attack if possible, otherwise move closer
    
    // 1. Try to attack first (before moving)
    const attackExecuted = await this.tryAttack(unit, gameState);
    
    if (attackExecuted) {
      Logger.info(`AI ${unit.type} attacked`);
    }
    
    // 2. Try to move if haven't moved yet
    if (!unit.hasMovedThisTurn) {
      const moveExecuted = await this.tryMove(unit, gameState);
      
      if (moveExecuted) {
        Logger.info(`AI ${unit.type} moved to (${unit.position.q}, ${unit.position.r})`);
      }
    }
    
    // 3. Try to attack again after moving (if we can)
    if (!unit.hasAttackedThisTurn) {
      await this.tryAttack(unit, gameState);
    }
  }

  /**
   * Attempt to attack with AI unit
   * Prioritizes low-health targets that are visible
   * 
   * @param unit AI unit attempting to attack
   * @param gameState Current game state
   * @returns True if attack was executed successfully
   */
  private async tryAttack(unit: Unit, gameState: GameState): Promise<boolean> {
    if (unit.hasAttackedThisTurn) {
      Logger.debug(`${unit.type} has already attacked this turn`);
      return false;
    }
    
    // Get valid targets in range
    const targets = CombatService.getValidTargets(unit, gameState);
    
    // Filter to only visible targets (fog of war)
    const visibleTargets = targets.filter(target => 
      gameState.visionService.isUnitVisibleToAI(target)
    );
    
    if (visibleTargets.length === 0) {
      Logger.debug(`${unit.type} has no visible targets in range`);
      return false;
    }
    
    // Choose best target (lowest health = prioritize killing)
    const target = this.selectBestTarget(visibleTargets);
    
    Logger.info(`AI ${unit.type} targeting ${target.type} (${target.health} HP)`);
    
    // Execute attack
    const result = CombatService.executeAttack(unit, target, gameState);
    
    if (result.success) {
      this.eventBus.emit('attackExecuted', result);
      
      // Check for victory
      if (gameState.playerUnits.length === 0) {
        Logger.info('💀 DEFEAT! All player units destroyed!');
        this.eventBus.emit('gameEnded', { victor: 'ai', state: gameState });
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Attempt to move AI unit toward nearest enemy
   * Uses pathfinding to find best movement destination
   * Respects fog of war - only moves toward visible enemies
   * 
   * @param unit AI unit attempting to move
   * @param gameState Current game state
   * @returns True if movement was executed successfully
   */
  private async tryMove(unit: Unit, gameState: GameState): Promise<boolean> {
    if (unit.hasMovedThisTurn) {
      Logger.debug(`${unit.type} has already moved this turn`);
      return false;
    }
    
    // Find nearest visible player unit (respects fog of war)
    const nearestEnemy = this.findNearestEnemy(unit, gameState.playerUnits, gameState);
    
    if (!nearestEnemy) {
      Logger.debug('AI cannot see any enemies (fog of war)');
      return false;
    }
    
    // Get reachable hexes
    const reachableHexes = PathfindingService.getReachableHexes(
      unit.position,
      unit.getMovementRange(),
      gameState
    );
    
    if (reachableHexes.length === 0) {
      Logger.debug(`${unit.type} cannot move (no reachable hexes)`);
      return false;
    }
    
    // Choose hex at optimal range (respects minRange)
    const destination = this.selectBestMoveDestination(
      reachableHexes,
      nearestEnemy.position,
      unit
    );
    
    Logger.debug(`${unit.type} moving toward enemy at (${nearestEnemy.position.q}, ${nearestEnemy.position.r})`);
    
    // Find path to destination
    const path = PathfindingService.findPath(
      unit.position,
      destination,
      gameState
    );
    
    if (path.length > 0) {
      const oldPos = unit.position;
      unit.position = destination;
      unit.hasMovedThisTurn = true;
      
      // Update fog of war after AI movement
      gameState.updateVision();
      
      this.eventBus.emit('unitMoved', { unit, path, oldPosition: oldPos });
      return true;
    }
    
    Logger.debug(`${unit.type} could not find path to destination`);
    return false;
  }

  /**
   * Select best attack target
   * Strategy: Prioritize low-health targets to maximize kills
   * 
   * @param targets Available enemy targets
   * @returns Best target to attack
   */
  private selectBestTarget(targets: Unit[]): Unit {
    // Sort by health ascending (weakest first)
    const sorted = [...targets].sort((a, b) => a.health - b.health);
    return sorted[0];
  }

  /**
   * Find nearest enemy unit to this AI unit
   * Uses hex distance for calculation
   * 
   * @param unit AI unit
   * @param enemies Array of enemy units
   * @returns Nearest visible enemy unit, or null if no visible enemies
   */
  private findNearestEnemy(unit: Unit, enemies: Unit[], gameState: GameState): Unit | null {
    if (enemies.length === 0) return null;
    
    // Filter to only visible enemies (fog of war)
    const visibleEnemies = enemies.filter(enemy => 
      gameState.visionService.isUnitVisibleToAI(enemy)
    );
    
    if (visibleEnemies.length === 0) return null;
    
    let nearest = visibleEnemies[0];
    let minDistance = HexUtils.distance(unit.position, nearest.position);
    
    for (const enemy of visibleEnemies) {
      const distance = HexUtils.distance(unit.position, enemy.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    }
    
    return nearest;
  }

  /**
   * Select best movement destination
   * Strategy: Move to optimal range (respects minRange to avoid getting too close)
   * 
   * @param reachableHexes Available movement destinations
   * @param targetPosition Target to move toward
   * @param unit AI unit performing the movement (to check weapon minRange)
   * @returns Best hex to move to
   */
  private selectBestMoveDestination(
    reachableHexes: HexCoordinate[],
    targetPosition: HexCoordinate,
    unit: Unit
  ): HexCoordinate {
    const minRange = unit.weaponType.minRange;
    const maxRange = unit.weaponType.maxRange;
    
    // Find hexes within optimal attack range
    const optimalHexes = reachableHexes.filter(hex => {
      const distance = HexUtils.distance(hex, targetPosition);
      return distance >= minRange && distance <= maxRange;
    });
    
    // If we can reach optimal range, choose closest to target within that range
    if (optimalHexes.length > 0) {
      let bestHex = optimalHexes[0];
      let minDistance = HexUtils.distance(bestHex, targetPosition);
      
      for (const hex of optimalHexes) {
        const distance = HexUtils.distance(hex, targetPosition);
        if (distance < minDistance) {
          minDistance = distance;
          bestHex = hex;
        }
      }
      
      return bestHex;
    }
    
    // If can't reach optimal range, move as close as possible while respecting minRange
    let bestHex = reachableHexes[0];
    let bestScore = Math.abs(HexUtils.distance(bestHex, targetPosition) - minRange);
    
    for (const hex of reachableHexes) {
      const distance = HexUtils.distance(hex, targetPosition);
      
      // Don't move closer than minRange
      if (distance < minRange) continue;
      
      // Prefer getting closer to target
      const score = distance - minRange;
      
      if (score < bestScore) {
        bestScore = score;
        bestHex = hex;
      }
    }
    
    return bestHex;
  }

  /**
   * Delay execution for AI turn visibility
   * Adds dramatic pause between AI actions
   * 
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
