import { ObstacleType } from '../utils/Constants';
import rockGreyLarge from '../assets/PNG/Objects/rockGrey_large.png';
import rockBrownLarge from '../assets/PNG/Objects/rockBrown_large.png';
import rockGreySmall1 from '../assets/PNG/Objects/rockGrey_small1.png';
import rockGreySmall2 from '../assets/PNG/Objects/rockGrey_small2.png';
import rockGreySmall3 from '../assets/PNG/Objects/rockGrey_small3.png';
import treePineLarge from '../assets/PNG/Objects/treePine_large.png';
import treeRoundLarge from '../assets/PNG/Objects/treeRound_large.png';
import ruinsCorner from '../assets/PNG/Objects/ruinsCorner.png';
import ruinsBrick1 from '../assets/PNG/Objects/ruins_brick1.png';
import castleLarge from '../assets/PNG/Objects/castle_large.png';
import church from '../assets/PNG/Objects/church.png';

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
        rockGreyLarge,
        rockBrownLarge
      ],
      ROCK_SMALL: [
        rockGreySmall1,
        rockGreySmall2,
        rockGreySmall3
      ],
      TREE: [
        treePineLarge,
        treeRoundLarge
      ],
      RUIN: [
        ruinsCorner,
        ruinsBrick1
      ],
      CHURCH: [church],
      CASTLE: [castleLarge]
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
      case 'ROCK_LARGE': return 0.5;
      case 'ROCK_SMALL': return 0.5;
      case 'TREE': return 0.9;
      case 'RUIN': return 1.0;
      case 'CASTLE': return 0.5;
      case 'CHURCH': return 0.7;
      default: return 0.7;
    }
  }
}
