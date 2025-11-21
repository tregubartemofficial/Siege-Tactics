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
  
  // 3D effect constants
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
   * Civ 6 style - seamless connected hexes with subtle borders
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
      // Grass green for playable area - slightly more vibrant like Civ 6
      gradient.addColorStop(0, '#9bc45f');
      gradient.addColorStop(1, '#7a9b3f');
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Draw subtle border like Civ 6 - thin, semi-transparent
    this.ctx.strokeStyle = 'rgba(90, 90, 90, 0.3)'; // Semi-transparent stone gray
    this.ctx.lineWidth = 1; // Thin border for connected look
    this.ctx.stroke();
  }

  /**
   * Draw the visible side faces of the hex for 3D depth effect
   * Only draws the 3 sides facing the camera (bottom faces)
   * Civ 6 style - subtle 3D with integrated appearance
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
      
      // Very subtle side borders for Civ 6 look
      this.ctx.strokeStyle = 'rgba(74, 74, 74, 0.2)';
      this.ctx.lineWidth = 0.5;
      this.ctx.stroke();
    }
  }

  /**
   * Convert hex cube coordinates to pixel coordinates for pointy-top hexagons
   * With 60-degree isometric projection - Most eye-pleasing view
   * Based on: height = (sqrt(3)/2) * width * cos(60°)
   */
  private hexToIsometricPixel(coord: HexCoordinate): {x: number, y: number} {
    // For pointy-top hexagons with 60° isometric projection
    const hexWidth = Math.sqrt(3) * this.hexSize;
    const hexHeight = this.hexSize * 1.5; // Vertical spacing for pointy-top
    
    // Isometric compression factor (cos(60°) = 0.5)
    const verticalScale = 0.5;
    
    // Calculate position with proper hex grid spacing
    const x = this.centerX + hexWidth * (coord.q + coord.r / 2);
    const y = this.centerY + hexHeight * coord.r * verticalScale;
    
    return { x, y };
  }

  /**
   * Calculate the 6 vertices of a pointy-top isometric hexagon
   * Using 60-degree projection for optimal visual appearance
   */
  private calculateIsometricHexVertices(x: number, y: number): Array<{x: number, y: number}> {
    const vertices: Array<{x: number, y: number}> = [];
    
    // Width stays the same, height is compressed by cos(60°) = 0.5
    const verticalScale = 0.5; // cos(60°)
    
    // Pointy-top hexagon vertices with isometric compression
    for (let i = 0; i < 6; i++) {
      const angleRad = (Math.PI / 180) * (60 * i + 30);
      vertices.push({
        x: x + this.hexSize * Math.cos(angleRad),
        y: y + this.hexSize * Math.sin(angleRad) * verticalScale
      });
    }
    
    return vertices;
  }

  /**
   * Handle canvas resize - recalculate center point
   */
  public resize(): void {
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }
}
