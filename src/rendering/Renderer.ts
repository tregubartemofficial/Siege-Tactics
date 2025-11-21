import { GameState } from '../core/GameState';
import { BattlefieldRenderer } from './BattlefieldRenderer';
import { UnitRenderer } from './UnitRenderer';
import { PathRenderer } from './PathRenderer';

/**
 * Main rendering orchestrator that manages all rendering subsystems
 * Coordinates battlefield, units, effects, and fog of war rendering
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private battlefieldRenderer: BattlefieldRenderer;
  private unitRenderer: UnitRenderer;
  private pathRenderer: PathRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Failed to get 2D rendering context from canvas');
    }
    
    this.ctx = context;
    this.battlefieldRenderer = new BattlefieldRenderer(canvas);
    this.unitRenderer = new UnitRenderer(context, 35, canvas); // hexSize = 35
    this.pathRenderer = new PathRenderer(context, 35, canvas); // hexSize = 35
    
    // Handle high-DPI displays
    this.setupHighDPI();
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
    this.pathRenderer.render(gameState); // Path overlays after battlefield
    this.unitRenderer.render(gameState);
    
    // TODO: Effects rendering (Story 05)
    // TODO: Fog of war (Story 07)
  }

  /**
   * Handle canvas resize events
   * Recalculates positioning for all rendering subsystems
   */
  public resize(): void {
    this.setupHighDPI();
    this.battlefieldRenderer.resize();
    this.unitRenderer.resize(this.canvas);
  }

  /**
   * Setup high-DPI display support (Retina displays)
   * Scales canvas backing store to match device pixel ratio
   */
  private setupHighDPI(): void {
    const dpr = window.devicePixelRatio || 1;
    
    if (dpr > 1) {
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
    }
  }
}
