import { GameState } from '../core/GameState';
import { HexCoordinate } from '../models/HexCoordinate';
import { HexTile } from '../models/HexTile';
import { HexUtils } from '../utils/HexUtils';

/**
 * Renders the hex-grid battlefield with 2.5D isometric perspective
 * Handles grid drawing, depth sorting, and visual styling
 */
export class BattlefieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;
  private centerX: number;
  private centerY: number;
  
  // Isometric projection constants
  private readonly ISO_ANGLE = Math.PI / 6; // 30 degrees for classic isometric look
  private readonly HEX_HEIGHT = 8; // Pixel height for 3D depth effect

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get 2D rendering context from canvas');
    }
    
    this.ctx = context;
    this.hexSize = 35; // pixels - radius from center to vertex
    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
  }

  /**
   * Main render method for battlefield
   * Sorts hexes by depth and draws them back-to-front
   */
  public render(gameState: GameState): void {
    // Sort hexes by depth (back to front for proper layering)
    const sortedHexes = this.sortHexesByDepth(gameState.battlefield);
    
    // Draw all hex tiles with isometric perspective
    sortedHexes.forEach(tile => {
      this.drawIsometricHex(tile.coordinate, gameState);
    });
  }

  /**
   * Sort hexes by Y-coordinate for proper z-order rendering
   * Back hexes (higher Y) are drawn first so front hexes overlap correctly
   */
  private sortHexesByDepth(battlefield: Map<string, HexTile>): HexTile[] {
    return Array.from(battlefield.values()).sort((a, b) => {
      const pixelA = this.hexToIsometricPixel(a.coordinate);
      const pixelB = this.hexToIsometricPixel(b.coordinate);
      return pixelA.y - pixelB.y; // Back hexes drawn first
    });
  }

  /**
   * Draw a single hex tile with 3D isometric appearance
   * Renders both top face and visible side faces
   */
  private drawIsometricHex(coord: HexCoordinate, gameState: GameState): void {
    const pixel = this.hexToIsometricPixel(coord);
    const isShrinkZone = HexUtils.distance(coord, {q: 0, r: 0, s: 0}) > gameState.shrinkRadius;
    
    // Draw hex with 3D depth - sides first, then top
    this.drawHexSides(pixel, isShrinkZone);
    this.drawHexTop(pixel, isShrinkZone);
  }

  /**
   * Draw the top face of the hex with lighting gradient
   * Applies color based on shrink zone status
   */
  private drawHexTop(pixel: {x: number, y: number}, isShrinkZone: boolean): void {
    const vertices = this.calculateIsometricHexVertices(pixel.x, pixel.y);
    
    // Fill top face
    this.ctx.beginPath();
    vertices.forEach((v, i) => {
      if (i === 0) this.ctx.moveTo(v.x, v.y);
      else this.ctx.lineTo(v.x, v.y);
    });
    this.ctx.closePath();
    
    // Apply gradient for lighting effect (top-left to bottom-right)
    const gradient = this.ctx.createLinearGradient(
      pixel.x - this.hexSize, pixel.y - this.hexSize,
      pixel.x + this.hexSize, pixel.y + this.hexSize
    );
    
    if (isShrinkZone) {
      // Dark red for shrink zone
      gradient.addColorStop(0, '#7a3030');
      gradient.addColorStop(1, '#5a2020');
    } else {
      // Grass green for playable area
      gradient.addColorStop(0, '#8aab5f');
      gradient.addColorStop(1, '#6a8b3f');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Draw border
    this.ctx.strokeStyle = '#5a5a5a'; // Stone gray
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  /**
   * Draw the visible side faces of the hex for 3D depth effect
   * Only draws the 3 sides facing the camera (bottom faces)
   */
  private drawHexSides(pixel: {x: number, y: number}, isShrinkZone: boolean): void {
    const vertices = this.calculateIsometricHexVertices(pixel.x, pixel.y);
    const sideColor = isShrinkZone ? '#4a2020' : '#5a7a3a'; // Darker shade for sides
    
    // Draw visible side faces (bottom-right, bottom, bottom-left)
    // Only draw 3 sides that face the camera for proper 3D appearance
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
      this.ctx.strokeStyle = '#4a4a4a'; // Darker border for sides
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  /**
   * Convert hex cube coordinates to isometric pixel coordinates
   * Applies 30-degree rotation for classic isometric view
   */
  private hexToIsometricPixel(coord: HexCoordinate): {x: number, y: number} {
    // Standard flat-top hex to pixel conversion
    const flatX = this.hexSize * (3/2 * coord.q);
    const flatY = this.hexSize * (Math.sqrt(3)/2 * coord.q + Math.sqrt(3) * coord.r);
    
    // Apply isometric projection (rotation matrix)
    const isoX = flatX * Math.cos(this.ISO_ANGLE) - flatY * Math.sin(this.ISO_ANGLE);
    const isoY = flatX * Math.sin(this.ISO_ANGLE) + flatY * Math.cos(this.ISO_ANGLE);
    
    return {
      x: this.centerX + isoX,
      y: this.centerY + isoY
    };
  }

  /**
   * Calculate the 6 vertices of an isometric hexagon
   * Returns vertices in clockwise order starting from right vertex
   */
  private calculateIsometricHexVertices(x: number, y: number): Array<{x: number, y: number}> {
    const angles = [0, 60, 120, 180, 240, 300]; // degrees for flat-top hex
    return angles.map(angleDeg => {
      const angleRad = (Math.PI / 180) * angleDeg;
      return {
        x: x + this.hexSize * Math.cos(angleRad),
        y: y + this.hexSize * Math.sin(angleRad) * 0.5 // Flatten Y for isometric perspective
      };
    });
  }

  /**
   * Handle canvas resize - recalculate center point
   */
  public resize(): void {
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }
}
