/**
 * Galaxy — Now powered by InfiniteGalaxy v4
 * True scale: 50k LY radius, spiral arms, streaming sectors, mostly empty space
 * Feels like real outer space
 */

import { InfiniteGalaxy, type GalaxySector as InfiniteSector, type DeepSpacePOI } from './v4/infiniteGalaxy';
import { GALAXY } from '../core/constants';
import { SystemDiscoveryState, type StarData } from '../core/types';
import type { Vec2 } from '../utils/math';

// Re-export for compatibility
export type GalaxySector = InfiniteSector;
export type { DeepSpacePOI };

export class Galaxy extends InfiniteGalaxy {
  constructor(seed: string = GALAXY.SEED) {
    super(seed, 1000);
  }

  // Override toJSON to include legacy format for backward compat
  toJSON() {
    return super.toJSON();
  }

  static fromJSON(data: any): Galaxy {
    // Check if it's old format (has systems array directly without sectors structure)
    if (data.systems && Array.isArray(data.systems) && data.systems.length > 0 && !data.sectors) {
      // Old format: convert to new
      const galaxy = new Galaxy(data.seed);
      galaxy.systems.clear();
      galaxy.sectors.clear();
      for (const sys of data.systems as StarData[]) {
        galaxy.systems.set(sys.id, sys);
        const sectorId = `${sys.sector.x},${sys.sector.y}`;
        if (!galaxy.sectors.has(sectorId)) {
          galaxy.sectors.set(sectorId, {
            id: sectorId,
            coord: sys.sector,
            worldPos: galaxy.sectorToWorld(sys.sector),
            systems: [],
            explored: true,
            generatedAt: Date.now(),
            density: 0.5,
            regionName: 'Legacy Sector',
          });
        }
        galaxy.sectors.get(sectorId)!.systems.push(sys);
      }
      galaxy.startingSystemId = data.startingSystemId;
      return galaxy;
    }

    // New infinite format
    const infinite = InfiniteGalaxy.fromJSON(data);
    const galaxy = new Galaxy(infinite.seed);
    galaxy.systems = infinite.systems;
    galaxy.sectors = infinite.sectors;
    galaxy.deepSpacePOIs = infinite.deepSpacePOIs;
    galaxy.startingSystemId = infinite.startingSystemId;
    galaxy.rng = infinite.rng;
    galaxy.structure = infinite.structure;
    return galaxy;
  }

  // Additional helpers for v4
  getStats() {
    return super.getStats();
  }
}
