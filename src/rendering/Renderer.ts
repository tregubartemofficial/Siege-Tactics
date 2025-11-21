import { GameState } from '../core/GameState';
import { BattlefieldRenderer } from './BattlefieldRenderer';
import { UnitRenderer } from './UnitRenderer';
import { PathRenderer } from './PathRenderer';
import { ObstacleRenderer } from './ObstacleRenderer';

/**
 * Main rendering orchestrator that manages all rendering subsystems
 * Coordinates battlefield, units, effects, and fog of war rendering
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private battlefieldRenderer: BattlefieldRenderer;
  private obstacleRenderer: ObstacleRenderer;
  private unitRenderer: UnitRenderer;
  private pathRenderer: PathRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get 2D rendering context from canvas');
    }
    
    this.ctx = context;
    
    // Setup responsive canvas size
    this.resizeCanvas();
    
    this.battlefieldRenderer = new BattlefieldRenderer(canvas);
    this.obstacleRenderer = new ObstacleRenderer(context, 50); // hexSize = 50
    this.unitRenderer = new UnitRenderer(context, 50, canvas); // hexSize = 50
    this.pathRenderer = new PathRenderer(context, 50, canvas); // hexSize = 50
    
    // Preload obstacle assets
    this.obstacleRenderer.preloadAssets();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resize());
    
    // Handle high-DPI displays
    this.setupHighDPI();
    
    // Update all renderers after initial canvas setup
    this.battlefieldRenderer.resize();
    this.unitRenderer.resize(canvas);
  }

  /**
   * Initialize fog of war (now integrated into tile rendering)
   */
  public initFogOfWar(_gameState: GameState): void {
    // Fog of war is now handled directly in BattlefieldRenderer via tile opacity
    // This method kept for compatibility with GameEngine
  }

  /**
   * Main render method called every frame
   * Renders all game elements in proper layered order
   */
  public render(gameState: GameState): void {
    // Clear entire canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render layers in order (back to front)
    this.battlefieldRenderer.render(gameState);
    this.obstacleRenderer.render(gameState); // Obstacles after terrain
    this.pathRenderer.render(gameState); // Path overlays after obstacles
    this.unitRenderer.render(gameState);
    
    // TODO: Effects rendering (Story 05)
  }

  /**
   * Handle canvas resize events
   * Recalculates positioning for all rendering subsystems
   */
  public resize(): void {
    this.resizeCanvas();
    this.setupHighDPI();
    this.battlefieldRenderer.resize();
    this.unitRenderer.resize(this.canvas);
  }

  /**
   * Resize canvas to fit container while maintaining aspect ratio
   */
  private resizeCanvas(): void {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    // Get container dimensions
    let containerWidth = container.clientWidth;
    let containerHeight = container.clientHeight;
    
    // Fallback to window dimensions if container has no size
    if (containerWidth === 0 || containerHeight === 0) {
      containerWidth = window.innerWidth;
      containerHeight = window.innerHeight;
    }
    
    // Ensure minimum size
    const minWidth = 320;
    const minHeight = 240;
    
    const finalWidth = Math.max(containerWidth, minWidth);
    const finalHeight = Math.max(containerHeight, minHeight);
    
    // Set canvas dimensions
    this.canvas.width = finalWidth;
    this.canvas.height = finalHeight;
    
    // Set canvas style dimensions (CSS pixels)
    this.canvas.style.width = finalWidth + 'px';
    this.canvas.style.height = finalHeight + 'px';
  }

  /**
   * Setup high-DPI display support (Retina displays)
   * Scales canvas backing store to match device pixel ratio
   */
  private setupHighDPI(): void {
    const dpr = window.devicePixelRatio || 1;
    
    if (dpr > 1) {
      // Get current canvas size
      const width = this.canvas.width;
      const height = this.canvas.height;
      
      // Scale canvas backing store
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      
      // Scale context to match
      this.ctx.scale(dpr, dpr);
      
      // Keep CSS size unchanged
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
    }
  }
}
