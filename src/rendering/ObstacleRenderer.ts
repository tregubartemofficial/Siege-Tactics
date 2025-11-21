import { GameState } from '../core/GameState';
import { HexCoordinate } from '../models/HexCoordinate';
import { Obstacle } from '../models/Obstacle';
import { HexTile } from '../models/HexTile';
import { Logger } from '../utils/Logger';

/**
 * ObstacleRenderer - Renders obstacles on the battlefield
 */
export class ObstacleRenderer {
  private ctx: CanvasRenderingContext2D;
  private hexSize: number;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadedImages: Set<string> = new Set();

  constructor(ctx: CanvasRenderingContext2D, hexSize: number) {
    this.ctx = ctx;
    this.hexSize = hexSize;
  }

  public async preloadAssets(): Promise<void> {
    // Preload all obstacle images
    const assetPaths = [
      'src/assets/PNG/Objects/rockGrey_large.png',
      'src/assets/PNG/Objects/rockBrown_large.png',
      'src/assets/PNG/Objects/rockGrey_small1.png',
      'src/assets/PNG/Objects/rockGrey_small2.png',
      'src/assets/PNG/Objects/rockGrey_small3.png',
      'src/assets/PNG/Objects/treePine_large.png',
      'src/assets/PNG/Objects/treeRound_large.png',
      'src/assets/PNG/Objects/ruinsCorner.png',
      'src/assets/PNG/Objects/ruins_brick1.png',
      'src/assets/PNG/Objects/castle_large.png',
      'src/assets/PNG/Objects/church.png'
    ];

    const loadPromises = assetPaths.map(path => this.loadImage(path));
    await Promise.all(loadPromises);
    Logger.info(`Loaded ${this.loadedImages.size} obstacle assets`);
  }

  private loadImage(path: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(path, img);
        this.loadedImages.add(path);
        resolve();
      };
      img.onerror = () => {
        Logger.warn(`Failed to load obstacle asset: ${path}`);
        resolve(); // Don't fail entire load
      };
      img.src = path;
    });
  }

  public render(gameState: GameState): void {
    // Render obstacles in depth order (back to front)
    const sortedTiles = this.sortTilesByDepth(gameState.battlefield);

    sortedTiles.forEach(tile => {
      if (tile.obstacle) {
        this.drawObstacle(tile.coordinate, tile.obstacle, tile);
      }
    });
  }

  private sortTilesByDepth(battlefield: Map<string, HexTile>): HexTile[] {
    return Array.from(battlefield.values()).sort((a, b) => {
      const pixelA = this.hexToIsometricPixel(a.coordinate);
      const pixelB = this.hexToIsometricPixel(b.coordinate);
      return pixelA.y - pixelB.y;
    });
  }

  private drawObstacle(coord: HexCoordinate, obstacle: Obstacle, tile: HexTile): void {
    const pixel = this.hexToIsometricPixel(coord);
    const image = this.imageCache.get(obstacle.assetPath);

    if (!image) {
      // Fallback: draw colored rectangle if image not loaded
      this.drawFallbackObstacle(pixel, obstacle);
      return;
    }

    // Calculate scaled dimensions
    const scaledWidth = image.width * obstacle.scale * 0.8;
    const scaledHeight = image.height * obstacle.scale * 0.8;

    // Apply fog of war opacity
    const opacity = tile.getOpacity();
    this.ctx.globalAlpha = opacity;

    // Draw drop shadow
    if (opacity > 0.3) {
      this.drawShadow(pixel, scaledWidth, scaledHeight);
    }

    // Draw obstacle centered on hex
    this.ctx.drawImage(
      image,
      pixel.x - scaledWidth / 2,
      pixel.y - scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Reset alpha
    this.ctx.globalAlpha = 1.0;
  }

  private drawShadow(pixel: { x: number; y: number }, width: number, height: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(
      pixel.x + 2,
      pixel.y + height / 3,
      width / 3,
      height / 8,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  private drawFallbackObstacle(pixel: { x: number; y: number }, obstacle: Obstacle): void {
    const size = this.hexSize * obstacle.scale;
    this.ctx.fillStyle = '#6B5D4F';
    this.ctx.fillRect(pixel.x - size / 2, pixel.y - size / 2, size, size);
  }

  private hexToIsometricPixel(coord: HexCoordinate): { x: number; y: number } {
    // Must match BattlefieldRenderer exactly!
    const hexWidth = Math.sqrt(3) * this.hexSize;
    const hexHeight = this.hexSize * 1.5;
    const verticalScale = 0.5;
    
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;
    
    const x = centerX + hexWidth * (coord.q + coord.r / 2);
    const y = centerY + hexHeight * coord.r * verticalScale;
    
    return { x, y };
  }
}
