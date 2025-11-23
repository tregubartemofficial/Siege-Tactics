/**
 * Unit Model
 * Represents a siege weapon unit on the battlefield
 */

import { HexCoordinate } from './HexCoordinate';
import { WeaponStats, getWeaponStats } from './WeaponStats';
import { WeaponType, PlayerType, CONSTANTS } from '../utils/Constants';

export class Unit {
  public id: string;
  public type: WeaponType;
  public owner: PlayerType;
  public position: HexCoordinate;
  public health: number;
  public maxHealth: number;
  public hasMovedThisTurn: boolean = false;
  public hasAttackedThisTurn: boolean = false;
  public movementPointsUsed: number = 0; // Track how many movement points used this turn
  private weaponStats: WeaponStats;

  constructor(id: string, type: WeaponType, owner: PlayerType, position: HexCoordinate) {
    this.id = id;
    this.type = type;
    this.owner = owner;
    this.position = position;
    this.maxHealth = CONSTANTS.STARTING_HEALTH;
    this.health = this.maxHealth;
    this.weaponStats = getWeaponStats(type);
  }

  getMovementRange(): number {
    return this.weaponStats.movementRange;
  }

  getRemainingMovement(): number {
    return Math.max(0, this.getMovementRange() - this.movementPointsUsed);
  }

  canMove(): boolean {
    // Can't move after attacking
    if (this.hasAttackedThisTurn) return false;
    // Can move if has movement points left
    return this.getRemainingMovement() > 0;
  }

  getAttackRange(): { min: number; max: number } {
    return {
      min: this.weaponStats.attackRangeMin,
      max: this.weaponStats.attackRangeMax
    };
  }

  getDamage(): number {
    return this.weaponStats.damage;
  }

  getWeaponStats(): WeaponStats {
    return this.weaponStats;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  resetTurnActions(): void {
    this.hasMovedThisTurn = false;
    this.hasAttackedThisTurn = false;
    this.movementPointsUsed = 0;
  }

  canAttack(): boolean {
    return !this.hasAttackedThisTurn;
  }
}
