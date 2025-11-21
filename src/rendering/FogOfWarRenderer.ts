import { VisionService, VisibilityState } from '../services/VisionService';
import { HexTile } from '../models/HexTile';
import { HexUtils } from '../utils/HexUtils';
import { CONSTANTS } from '../utils/Constants';

/**
 * FogOfWarRenderer - Draws fog of war overlay on the battlefield
 * - Unexplored tiles: Black overlay
 * - Explored tiles: Dimmed overlay (60% opacity)
 * - Visible tiles: No overlay
 */
export class FogOfWarRenderer {
  private ctx: CanvasRenderingContext2D;
  private visionService: VisionService;
  private cameraOffset: { x: number; y: number };

  constructor(
    ctx: CanvasRenderingContext2D,
    visionService: VisionService,
    cameraOffset: { x: number; y: number }
  ) {
    this.ctx = ctx;
    this.visionService = visionService;
    this.cameraOffset = cameraOffset;
  }

  /**
   * Render fog of war overlay for all tiles
   */
  public render(battlefield: Map<string, HexTile>): void {
    battlefield.forEach((tile) => {
      const visibility = this.visionService.getTileVisibilityForPlayer(
        HexUtils.toKey(tile.coordinate)
      );

      // Only draw fog for unexplored and explored tiles
      if (visibility === VisibilityState.UNEXPLORED) {
        this.drawFogOverlay(tile, 1.0); // Full black
      } else if (visibility === VisibilityState.EXPLORED) {
        this.drawFogOverlay(tile, 0.6); // 60% black (dimmed)
      }
      // VISIBLE tiles get no fog overlay
    });
  }

  /**
   * Draw fog overlay on a single hex tile
   */
  private drawFogOverlay(tile: HexTile, opacity: number): void {
    const pixelPos = HexUtils.hexToPixel(tile.coordinate);
    const x = pixelPos.x + this.cameraOffset.x;
    const y = pixelPos.y + this.cameraOffset.y;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#000000';

    // Draw hexagon shape for fog
    this.drawHexagon(x, y);

    this.ctx.restore();
  }

  /**
   * Draw a hexagon at the specified pixel coordinates
   */
  private drawHexagon(x: number, y: number): void {
    const hexWidth = CONSTANTS.HEX_WIDTH;
    const hexHeight = CONSTANTS.HEX_HEIGHT;

    this.ctx.beginPath();

    // Flat-top hexagon vertices
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i; // 60 degrees per vertex
      const vx = x + (hexWidth / 2) * Math.cos(angle);
      const vy = y + (hexHeight / 2) * Math.sin(angle);

      if (i === 0) {
        this.ctx.moveTo(vx, vy);
      } else {
        this.ctx.lineTo(vx, vy);
      }
    }

    this.ctx.closePath();
    this.ctx.fill();
  }

  /**
   * Update camera offset for scrolling
   */
  public updateCameraOffset(offset: { x: number; y: number }): void {
    this.cameraOffset = offset;
  }
}
