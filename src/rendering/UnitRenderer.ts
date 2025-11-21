import { GameState } from '../core/GameState';
import { Unit } from '../models/Unit';
import { HexCoordinate } from '../models/HexCoordinate';
import { WeaponType } from '../utils/Constants';

/**
 * Renders units (siege weapons) on the battlefield
 * Handles unit sprites, health bars, and selection highlighting
 */
export class UnitRenderer {
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;
  private centerX: number;
  private centerY: number;

  constructor(ctx: CanvasRenderingContext2D, hexSize: number, canvas: HTMLCanvasElement) {
    this.ctx = ctx;
    this.hexSize = hexSize;
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
  }

  /**
   * Main render method for all units
   * Renders player units, AI units, and selection highlight
   */
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

  /**
   * Draw a single unit with sprite and health bar
   */
  private drawUnit(unit: Unit, isAI: boolean): void {
    const pixelPos = this.hexToIsometricPixel(unit.position);
    
    // Draw weapon-specific shape (placeholder sprite)
    this.drawWeaponSprite(unit.type, pixelPos, isAI);
    
    // Draw health bar above unit
    this.drawHealthBar(unit, pixelPos);
  }

  /**
   * Draw weapon sprite as colored shape (placeholder for actual sprites)
   * Different sizes and colors for each weapon type
   */
  private drawWeaponSprite(
    weaponType: WeaponType, 
    position: {x: number, y: number}, 
    isAI: boolean
  ): void {
    const ctx = this.ctx;
    
    // Set color based on owner and weapon type
    ctx.fillStyle = this.getWeaponColor(weaponType, isAI);
    
    // Draw shape based on weapon type
    ctx.beginPath();
    switch(weaponType) {
      case 'catapult':
        // Small square - 20x20px
        ctx.rect(position.x - 10, position.y - 10, 20, 20);
        break;
      case 'ballista':
        // Tall rectangle - 15x25px
        ctx.rect(position.x - 7.5, position.y - 12.5, 15, 25);
        break;
      case 'trebuchet':
        // Large square - 30x30px
        ctx.rect(position.x - 15, position.y - 15, 30, 30);
        break;
    }
    ctx.fill();
    
    // Add border to sprite for definition
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * Get color for weapon sprite based on type and owner
   */
  private getWeaponColor(weaponType: WeaponType, isAI: boolean): string {
    if (isAI) {
      return '#a74a4a'; // Red tint for all AI units
    }
    
    // Player unit colors by weapon type
    switch(weaponType) {
      case 'catapult': return '#4a7ba7'; // Blue
      case 'ballista': return '#6a9b4f'; // Green
      case 'trebuchet': return '#8a4a9b'; // Purple
      default: return '#5a5a5a'; // Gray fallback
    }
  }

  /**
   * Draw health bar above unit
   * Color changes based on health percentage
   */
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
    
    // Health fill (colored based on health percentage)
    this.ctx.fillStyle = this.getHealthColor(healthPercent);
    this.ctx.fillRect(barX, barY, currentBarWidth, barHeight);
    
    // Border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  /**
   * Get health bar color based on health percentage
   * Green > 66%, Yellow 33-66%, Red < 33%
   */
  private getHealthColor(healthPercent: number): string {
    if (healthPercent > 0.66) return '#4a9b4a'; // Green
    if (healthPercent > 0.33) return '#d4a944'; // Yellow
    return '#a74a4a'; // Red
  }

  /**
   * Draw selection highlight around selected unit
   * Yellow dashed border
   */
  private drawSelectionHighlight(unit: Unit): void {
    const pixelPos = this.hexToIsometricPixel(unit.position);
    const highlightSize = 40; // Larger than largest unit sprite
    
    this.ctx.strokeStyle = '#f4d03f'; // Yellow
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([5, 3]); // Dashed line pattern
    this.ctx.strokeRect(
      pixelPos.x - highlightSize/2,
      pixelPos.y - highlightSize/2,
      highlightSize,
      highlightSize
    );
    this.ctx.setLineDash([]); // Reset to solid lines
  }

  /**
   * Convert hex cube coordinates to isometric pixel coordinates
   * Must match BattlefieldRenderer's projection
   */
  private hexToIsometricPixel(coord: HexCoordinate): {x: number, y: number} {
    // For pointy-top hexagons with 60° isometric projection
    const hexWidth = Math.sqrt(3) * this.hexSize;
    const hexHeight = this.hexSize * 1.5;
    
    // Isometric compression factor (cos(60°) = 0.5)
    const verticalScale = 0.5;
    
    // Calculate position with proper hex grid spacing
    const x = this.centerX + hexWidth * (coord.q + coord.r / 2);
    const y = this.centerY + hexHeight * coord.r * verticalScale;
    
    return { x, y };
  }

  /**
   * Handle canvas resize
   */
  public resize(canvas: HTMLCanvasElement): void {
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
  }
}
