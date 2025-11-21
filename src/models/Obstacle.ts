import { ObstacleType } from '../utils/Constants';

/**
 * Obstacle - Represents a blocking or decorative element on the battlefield
 */
export class Obstacle {
  public type: ObstacleType;
  public assetPath: string;
  public movementCost: number; // Infinity = impassable, 0.5 = difficult terrain, 0 = no cost
  public blocksLineOfSight: boolean;
  public scale: number;

  constructor(type: ObstacleType) {
    this.type = type;
    this.assetPath = this.getAssetPath(type);
    this.movementCost = this.getMovementCost(type);
    this.blocksLineOfSight = this.blocksLOS(type);
    this.scale = this.getScale(type);
  }

  private getAssetPath(type: ObstacleType): string {
    const assetMap: Record<ObstacleType, string[]> = {
      ROCK_LARGE: [
        'src/assets/PNG/Objects/rockGrey_large.png',
        'src/assets/PNG/Objects/rockBrown_large.png'
      ],
      ROCK_SMALL: [
        'src/assets/PNG/Objects/rockGrey_small1.png',
        'src/assets/PNG/Objects/rockGrey_small2.png',
        'src/assets/PNG/Objects/rockGrey_small3.png'
      ],
      TREE: [
        'src/assets/PNG/Objects/treePine_large.png',
        'src/assets/PNG/Objects/treeRound_large.png'
      ],
      RUIN: [
        'src/assets/PNG/Objects/ruinsCorner.png',
        'src/assets/PNG/Objects/ruins_brick1.png'
      ],
      CHURCH: ['src/assets/PNG/Objects/church.png'],
      CASTLE: ['src/assets/PNG/Objects/castle_large.png']
    };

    const variants = assetMap[type];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  private getMovementCost(type: ObstacleType): number {
    // Impassable obstacles
    if (['ROCK_LARGE', 'CASTLE', 'CHURCH'].includes(type)) {
      return Infinity;
    }
    // Difficult terrain (costs extra movement)
    return 0.5;
  }

  private blocksLOS(type: ObstacleType): boolean {
    // Large obstacles block line of sight for fog of war
    return ['ROCK_LARGE', 'TREE', 'RUIN', 'WALL'].includes(type);
  }

  private getScale(type: ObstacleType): number {
    // Scale relative to hex size
    switch(type) {
      case 'ROCK_LARGE': return 0.8;
      case 'ROCK_SMALL': return 0.5;
      case 'TREE': return 0.9;
      case 'RUIN': return 1.0;
      case 'CASTLE': return 0.8;
      case 'CHURCH': return 0.7;
      default: return 0.7;
    }
  }
}
