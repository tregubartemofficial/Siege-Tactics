import { HexCoordinate } from '../models/HexCoordinate';
import { GameState } from '../core/GameState';
import { PathfindingService } from '../services/PathfindingService';

/**
 * PathRenderer - Visualizes movement paths and reachable areas
 * Renders path overlays, reachable hexes, and attack ranges
 */
export class PathRenderer {
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;
  private canvas: HTMLCanvasElement;

  constructor(ctx: CanvasRenderingContext2D, hexSize: number, canvas: HTMLCanvasElement) {
    this.ctx = ctx;
    this.hexSize = hexSize;
    this.canvas = canvas;
  }

  /**
   * Main render method for path visualization
   */
  public render(gameState: GameState): void {
    // Render reachable movement hexes (blue overlay)
    if (gameState.validMoveHexes.length > 0) {
      this.renderReachableHexes(gameState.validMoveHexes, 'rgba(100, 150, 255, 0.3)');
    }

    // Render attack range hexes (red overlay)
    if (gameState.validAttackHexes.length > 0) {
      this.renderReachableHexes(gameState.validAttackHexes, 'rgba(255, 100, 100, 0.3)');
    }

    // Render planned path if unit is selected and hovering over valid destination
    if (gameState.selectedUnit && gameState.hoveredHex) {
      const isValidMove = gameState.validMoveHexes.some(hex => 
        hex.q === gameState.hoveredHex!.q && hex.r === gameState.hoveredHex!.r
      );
      
      if (isValidMove) {
        this.renderPath(gameState.selectedUnit.position, gameState.hoveredHex, gameState);
      }
    }
  }

  /**
   * Render overlay on reachable hexes
   */
  private renderReachableHexes(hexes: HexCoordinate[], color: string): void {
    hexes.forEach(hex => {
      const vertices = this.calculateIsometricHexVertices(hex);
      
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = color.replace(/0\.\d+\)$/, '0.6)'); // More opaque border
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      vertices.forEach((vertex, index) => {
        if (index === 0) {
          this.ctx.moveTo(vertex.x, vertex.y);
        } else {
          this.ctx.lineTo(vertex.x, vertex.y);
        }
      });
      this.ctx.closePath();
      
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  /**
   * Render animated path from start to end
   */
  private renderPath(start: HexCoordinate, end: HexCoordinate, gameState: GameState): void {
    // Use actual pathfinding to get the path
    const path = PathfindingService.findPath(start, end, gameState);
    
    if (path.length === 0) return;
    
    // Build full path including start
    const fullPath = [start, ...path];
    
    // Draw path segments
    this.ctx.strokeStyle = '#f4d03f';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Animate with dashes
    const dashOffset = (Date.now() / 30) % 20;
    this.ctx.setLineDash([10, 10]);
    this.ctx.lineDashOffset = -dashOffset;
    
    this.ctx.beginPath();
    fullPath.forEach((coord, index) => {
      const pixel = this.hexToIsometricPixel(coord);
      if (index === 0) {
        this.ctx.moveTo(pixel.x, pixel.y);
      } else {
        this.ctx.lineTo(pixel.x, pixel.y);
      }
    });
    this.ctx.stroke();
    
    // Reset line dash
    this.ctx.setLineDash([]);
    
    // Draw arrow at end
    if (fullPath.length > 1) {
      const lastTwo = fullPath.slice(-2);
      const fromPixel = this.hexToIsometricPixel(lastTwo[0]);
      const toPixel = this.hexToIsometricPixel(lastTwo[1]);
      this.drawArrow(fromPixel, toPixel);
    }
    
    // Draw waypoint circles
    const startPixel = this.hexToIsometricPixel(start);
    const endPixel = this.hexToIsometricPixel(end);
    this.drawWaypoint(startPixel, '#4a7ba7');
    this.drawWaypoint(endPixel, '#f4d03f');
    
    // Draw distance indicator
    const distance = path.length;
    this.drawDistanceIndicator(endPixel, distance);
  }

  /**
   * Draw arrow indicating path direction
   */
  private drawArrow(from: {x: number, y: number}, to: {x: number, y: number}): void {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const arrowSize = 12;
    
    this.ctx.fillStyle = '#f4d03f';
    this.ctx.beginPath();
    this.ctx.moveTo(to.x, to.y);
    this.ctx.lineTo(
      to.x - arrowSize * Math.cos(angle - Math.PI / 6),
      to.y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      to.x - arrowSize * Math.cos(angle + Math.PI / 6),
      to.y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Draw waypoint circle
   */
  private drawWaypoint(pos: {x: number, y: number}, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * Draw distance indicator showing movement cost
   */
  private drawDistanceIndicator(pos: {x: number, y: number}, distance: number): void {
    const text = distance.toString();
    const offsetY = -20; // Position above the waypoint
    
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw background
    const metrics = this.ctx.measureText(text);
    const padding = 4;
    const boxWidth = metrics.width + padding * 2;
    const boxHeight = 18;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(
      pos.x - boxWidth / 2,
      pos.y + offsetY - boxHeight / 2,
      boxWidth,
      boxHeight
    );
    
    // Draw text
    this.ctx.fillStyle = '#f4d03f';
    this.ctx.fillText(text, pos.x, pos.y + offsetY);
  }

  /**
   * Convert hex coordinate to isometric pixel position (matching BattlefieldRenderer)
   */
  private hexToIsometricPixel(coord: HexCoordinate): { x: number; y: number } {
    const hexWidth = Math.sqrt(3) * this.hexSize;
    const hexHeight = 1.5 * this.hexSize;
    const verticalScale = 0.5;

    const x = hexWidth * (coord.q + coord.r / 2);
    const y = hexHeight * coord.r * verticalScale;

    return {
      x: x + this.canvas.width / 2,
      y: y + this.canvas.height / 2
    };
  }

  /**
   * Calculate vertices for isometric hex (matching BattlefieldRenderer)
   */
  private calculateIsometricHexVertices(coord: HexCoordinate): Array<{ x: number; y: number }> {
    const center = this.hexToIsometricPixel(coord);
    const vertices: Array<{ x: number; y: number }> = [];
    const verticalScale = 0.5;

    for (let i = 0; i < 6; i++) {
      const angleRad = (Math.PI / 180) * (60 * i + 30);
      const x = center.x + this.hexSize * Math.cos(angleRad);
      const y = center.y + this.hexSize * Math.sin(angleRad) * verticalScale;
      vertices.push({ x, y });
    }

    return vertices;
  }
}
