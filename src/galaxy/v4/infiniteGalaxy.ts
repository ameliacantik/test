/**
 * Infinite Galaxy — True scale, streaming, LOD
 * Feels like real outer space: vast, mostly empty, with structure
 * 
 * Core idea: Galaxy is infinite (or 50k LY radius), but we only generate sectors near player
 * Each sector's existence and content is deterministic from seed + sector coords
 * So exploring feels infinite but reproducible
 */

import { SeededRNG } from '../../utils/seedRandom';
import { GALAXY } from '../../core/constants';
import { SystemDiscoveryState, type StarData } from '../../core/types';
import { generateStarSystem } from '../starSystem';
import { GalacticStructure, DEFAULT_GALACTIC_CONFIG } from './galacticStructure';
import type { Vec2 } from '../../utils/math';

export interface GalaxySector {
  id: string;
  coord: Vec2; // sector coordinates (e.g., 0,0 ; 1,0 ; etc.)
  worldPos: Vec2; // world position of sector center
  systems: StarData[];
  explored: boolean;
  generatedAt: number;
  density: number; // 0-1, how dense this sector is
  regionName: string;
}

export interface DeepSpacePOI {
  id: string;
  type: 'rogue_planet' | 'asteroid_field' | 'derelict' | 'anomaly' | 'nebula_core' | 'black_hole_wandering' | 'void_echo' | 'ancient_gate';
  position: Vec2;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'unique';
  discovered: boolean;
}

export class InfiniteGalaxy {
  seed: string;
  rng: SeededRNG;
  structure: GalacticStructure;
  sectors: Map<string, GalaxySector> = new Map();
  systems: Map<string, StarData> = new Map();
  deepSpacePOIs: Map<string, DeepSpacePOI[]> = new Map(); // per sector
  startingSystemId: string = '';
  private sectorSize: number;
  private cacheSize: number = 100; // max sectors to keep in memory

  // For true scale, we use LY as unit
  // Sector size 1000 LY, galaxy radius 50000 LY = 100x100 sectors = 10k sectors, 20k-40k systems if all generated
  // But we only generate on demand

  constructor(seed: string = GALAXY.SEED, sectorSize: number = 1000) {
    this.seed = seed;
    this.sectorSize = sectorSize;
    this.rng = new SeededRNG(seed);
    this.structure = new GalacticStructure({ seed, radius: 50000, coreRadius: 5000, armCount: 4 });

    // Generate starting sector and neighbors
    this.generateStartingArea();
  }

  private generateStartingArea() {
    // Find a good starting position: in habitable zone, not too dense, not too empty, yellow star
    let attempts = 0;
    let startSector: GalaxySector | null = null;
    let startSystem: StarData | null = null;

    while (attempts < 100) {
      const angle = this.rng.range(0, Math.PI * 2);
      const dist = this.rng.range(8000, 15000); // habitable zone
      const worldPos: Vec2 = {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.6,
      };
      const sectorCoord = this.worldToSector(worldPos);
      const sector = this.generateSector(sectorCoord.x, sectorCoord.y);

      // Find yellow or red dwarf, low danger
      const candidate = sector.systems.find(s =>
        (s.starType === 'yellow_star' || s.starType === 'red_dwarf') && s.dangerLevel < 0.3
      );

      if (candidate) {
        startSector = sector;
        startSystem = candidate;
        break;
      }
      attempts++;
    }

    if (!startSystem || !startSector) {
      // Fallback: generate sector 0,0
      const fallbackSector = this.generateSector(0, 0);
      startSystem = fallbackSector.systems[0];
      startSector = fallbackSector;
    }

    this.startingSystemId = startSystem!.id;
    startSystem!.discoveryState = SystemDiscoveryState.Detected;

    // Generate 3x3 area around start for immediate exploration
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        this.generateSector(startSector!.coord.x + dx, startSector!.coord.y + dy);
      }
    }

    console.log(`Infinite Galaxy initialized: seed ${this.seed}, start ${startSystem!.name} at ${startSector!.coord.x},${startSector!.coord.y}, ${this.systems.size} systems in 3x3 area`);
  }

  worldToSector(worldPos: Vec2): Vec2 {
    return {
      x: Math.floor(worldPos.x / this.sectorSize),
      y: Math.floor(worldPos.y / this.sectorSize),
    };
  }

  sectorToWorld(sectorCoord: Vec2): Vec2 {
    return {
      x: sectorCoord.x * this.sectorSize + this.sectorSize / 2,
      y: sectorCoord.y * this.sectorSize + this.sectorSize / 2,
    };
  }

  generateSector(sx: number, sy: number): GalaxySector {
    const id = `${sx},${sy}`;
    if (this.sectors.has(id)) return this.sectors.get(id)!;

    const sectorRng = this.rng.fork(`sector-${sx}-${sy}`);
    const worldPos = this.sectorToWorld({ x: sx, y: sy });

    // Density based on galactic structure
    const density = this.structure.getDensityAtDeterministic(worldPos, sectorRng.fork('density'));
    const regionName = this.structure.getRegionName(worldPos);

    // Number of systems based on density: mostly empty space!
    // Real space is 99% empty: even in dense areas, many sectors empty
    let systemCount: number;
    if (density < 0.05) {
      systemCount = sectorRng.bool(0.1) ? 1 : 0; // 90% empty in voids
    } else if (density < 0.2) {
      systemCount = sectorRng.bool(0.3) ? sectorRng.int(1, 2) : 0; // 70% empty in sparse
    } else if (density < 0.5) {
      systemCount = sectorRng.int(0, 3); // 25% empty in medium
    } else {
      systemCount = sectorRng.int(1, 5); // dense: 1-5 systems
    }

    // Special: core has more, but also more danger
    if (Math.hypot(worldPos.x, worldPos.y) < 2000) {
      systemCount = sectorRng.int(2, 6);
    }

    const systems: StarData[] = [];
    for (let i = 0; i < systemCount; i++) {
      const sysRng = sectorRng.fork(`system-${i}`);
      const offsetX = sysRng.range(100, this.sectorSize - 100);
      const offsetY = sysRng.range(100, this.sectorSize - 100);
      const pos: Vec2 = {
        x: sx * this.sectorSize + offsetX,
        y: sy * this.sectorSize + offsetY,
      };
      const sysId = `SYS-${sx}-${sy}-${i}-${sysRng.int(1000, 9999)}`;
      const system = generateStarSystem(sysRng, sysId, pos, { x: sx, y: sy }, i);

      // Adjust danger based on galactic position
      const dangerMod = this.structure.getDangerModifier(pos);
      system.dangerLevel = Math.min(1, system.dangerLevel * 0.5 + dangerMod * 0.5);

      systems.push(system);
      this.systems.set(sysId, system);
    }

    // Deep space POIs (rogue planets, etc.) — also based on density but can exist even in empty sectors
    const pois: DeepSpacePOI[] = [];
    const poiCount = density < 0.1 ? (sectorRng.bool(0.2) ? 1 : 0) : sectorRng.int(0, Math.floor(density * 3));
    for (let i = 0; i < poiCount; i++) {
      const poiRng = sectorRng.fork(`poi-${i}`);
      const poi = this.generateDeepSpacePOI(poiRng, { x: sx, y: sy }, i);
      pois.push(poi);
    }

    const sector: GalaxySector = {
      id,
      coord: { x: sx, y: sy },
      worldPos,
      systems,
      explored: false,
      generatedAt: Date.now(),
      density,
      regionName,
    };

    this.sectors.set(id, sector);
    this.deepSpacePOIs.set(id, pois);

    // Cache management: if too many sectors, remove oldest far from player (handled externally)
    if (this.sectors.size > this.cacheSize) {
      this.pruneCache();
    }

    return sector;
  }

  private generateDeepSpacePOI(rng: SeededRNG, sectorCoord: Vec2, index: number): DeepSpacePOI {
    const types: DeepSpacePOI['type'][] = ['rogue_planet', 'asteroid_field', 'derelict', 'anomaly', 'void_echo'];
    const type = rng.pick(types);

    const offsetX = rng.range(0, this.sectorSize);
    const offsetY = rng.range(0, this.sectorSize);
    const pos: Vec2 = {
      x: sectorCoord.x * this.sectorSize + offsetX,
      y: sectorCoord.y * this.sectorSize + offsetY,
    };

    const names: Record<DeepSpacePOI['type'], string[]> = {
      rogue_planet: ['Rogue Planet', 'Drifter', 'Exile', 'Wanderer'],
      asteroid_field: ['Asteroid Field', 'Debris Field', 'Shattered Moon', 'Rocky Expanse'],
      derelict: ['Derelict', 'Ghost Ship', 'Abandoned Hull', 'Lost Vessel'],
      anomaly: ['Anomaly', 'Gravitational Echo', 'Energy Fluctuation', 'Void Rift'],
      nebula_core: ['Nebula Core', 'Stellar Nursery', 'Dust Cloud'],
      black_hole_wandering: ['Wandering Black Hole', 'Dark Star'],
      void_echo: ['Void Echo', 'Energy Entity', 'Vacuum Life'],
      ancient_gate: ['Ancient Gate', 'Portal Frame', 'Wormhole Residue'],
    };

    const rarities: DeepSpacePOI['rarity'][] = ['common', 'common', 'uncommon', 'rare', 'very_rare'];

    return {
      id: `POI-${sectorCoord.x}-${sectorCoord.y}-${index}`,
      type,
      position: pos,
      name: `${rng.pick(names[type])} ${rng.int(100, 9999)}`,
      description: `Deep space ${type} detected. ${type === 'rogue_planet' ? 'Planet without star, drifting in void.' : type === 'asteroid_field' ? 'Dense field of rocks and ice.' : type === 'derelict' ? 'Abandoned, cold, dark. What happened?' : 'Unclassified phenomenon.'}`,
      rarity: rng.pick(rarities),
      discovered: false,
    };
  }

  private pruneCache() {
    // Remove oldest sectors that are not near starting area and not explored
    const sectorsArray = Array.from(this.sectors.values()).sort((a, b) => a.generatedAt - b.generatedAt);
    for (const sector of sectorsArray) {
      if (this.sectors.size <= this.cacheSize * 0.8) break;
      // Don't prune if it contains visited systems
      const hasVisited = sector.systems.some(s => s.discoveryState === SystemDiscoveryState.Visited || s.discoveryState === SystemDiscoveryState.Scanned);
      if (!hasVisited && Math.hypot(sector.coord.x, sector.coord.y) > 5) {
        this.sectors.delete(sector.id);
        for (const sys of sector.systems) {
          if (sys.discoveryState === SystemDiscoveryState.Unknown) {
            this.systems.delete(sys.id);
          }
        }
        this.deepSpacePOIs.delete(sector.id);
      }
    }
  }

  getSector(x: number, y: number): GalaxySector | undefined {
    return this.sectors.get(`${x},${y}`);
  }

  getSystem(id: string): StarData | undefined {
    return this.systems.get(id);
  }

  getAllSystems(): StarData[] {
    return Array.from(this.systems.values());
  }

  getAllSectors(): GalaxySector[] {
    return Array.from(this.sectors.values());
  }

  getSystemsInRange(pos: Vec2, range: number): StarData[] {
    // Determine sectors in range
    const minSector = this.worldToSector({ x: pos.x - range, y: pos.y - range });
    const maxSector = this.worldToSector({ x: pos.x + range, y: pos.y + range });

    const result: StarData[] = [];

    for (let sx = minSector.x; sx <= maxSector.x; sx++) {
      for (let sy = minSector.y; sy <= maxSector.y; sy++) {
        const sector = this.generateSector(sx, sy); // generate on demand
        for (const sys of sector.systems) {
          const dx = sys.position.x - pos.x;
          const dy = sys.position.y - pos.y;
          if (dx * dx + dy * dy <= range * range) {
            result.push(sys);
          }
        }
      }
    }

    return result;
  }

  getSectorsInRange(pos: Vec2, range: number): GalaxySector[] {
    const minSector = this.worldToSector({ x: pos.x - range, y: pos.y - range });
    const maxSector = this.worldToSector({ x: pos.x + range, y: pos.y + range });

    const result: GalaxySector[] = [];
    for (let sx = minSector.x; sx <= maxSector.x; sx++) {
      for (let sy = minSector.y; sy <= maxSector.y; sy++) {
        result.push(this.generateSector(sx, sy));
      }
    }
    return result;
  }

  getPOIsInRange(pos: Vec2, range: number): DeepSpacePOI[] {
    const sectors = this.getSectorsInRange(pos, range);
    const result: DeepSpacePOI[] = [];
    for (const sector of sectors) {
      const pois = this.deepSpacePOIs.get(sector.id) || [];
      for (const poi of pois) {
        const dx = poi.position.x - pos.x;
        const dy = poi.position.y - pos.y;
        if (dx * dx + dy * dy <= range * range) {
          result.push(poi);
        }
      }
    }
    return result;
  }

  revealSystem(id: string, state: SystemDiscoveryState) {
    const sys = this.systems.get(id);
    if (sys) {
      const order = [
        SystemDiscoveryState.Unknown,
        SystemDiscoveryState.Detected,
        SystemDiscoveryState.Scanned,
        SystemDiscoveryState.Visited,
        SystemDiscoveryState.Explored,
        SystemDiscoveryState.FullySurveyed,
      ];
      const currentIdx = order.indexOf(sys.discoveryState);
      const newIdx = order.indexOf(state);
      if (newIdx > currentIdx) {
        sys.discoveryState = state;
        if (state === SystemDiscoveryState.Scanned) sys.scannedAt = Date.now();
        if (state === SystemDiscoveryState.Visited) sys.visitedAt = Date.now();
        if (state === SystemDiscoveryState.Detected && !sys.discoveredAt) sys.discoveredAt = Date.now();

        // Mark sector explored
        const sectorId = `${sys.sector.x},${sys.sector.y}`;
        const sector = this.sectors.get(sectorId);
        if (sector) sector.explored = true;
      }
    }
  }

  // For saving: only save generated sectors and systems that have been discovered
  toJSON() {
    const discoveredSystems = Array.from(this.systems.values()).filter(s => s.discoveryState !== SystemDiscoveryState.Unknown);
    const generatedSectors = Array.from(this.sectors.values()).map(s => ({
      ...s,
      systems: s.systems.filter(sys => sys.discoveryState !== SystemDiscoveryState.Unknown).map(sys => sys.id), // save only IDs to avoid duplication
    }));

    return {
      seed: this.seed,
      sectorSize: this.sectorSize,
      systems: discoveredSystems,
      sectors: generatedSectors,
      startingSystemId: this.startingSystemId,
      deepSpacePOIs: Array.from(this.deepSpacePOIs.entries()).filter(([_, pois]) => pois.some(p => p.discovered)),
    };
  }

  static fromJSON(data: any): InfiniteGalaxy {
    const galaxy = new InfiniteGalaxy(data.seed, data.sectorSize || 1000);
    galaxy.systems.clear();
    galaxy.sectors.clear();
    galaxy.deepSpacePOIs.clear();

    // Restore discovered systems
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
          regionName: 'Restored Sector',
        });
      }
      galaxy.sectors.get(sectorId)!.systems.push(sys);
    }

    galaxy.startingSystemId = data.startingSystemId;

    // Restore POIs
    if (data.deepSpacePOIs) {
      for (const [sectorId, pois] of data.deepSpacePOIs) {
        galaxy.deepSpacePOIs.set(sectorId, pois as any);
      }
    }

    return galaxy;
  }

  // Stats for UI
  getStats() {
    const allSystems = this.getAllSystems();
    const discovered = allSystems.filter(s => s.discoveryState !== SystemDiscoveryState.Unknown).length;
    const totalGenerated = allSystems.length;
    const sectorsGenerated = this.sectors.size;
    // Estimated total galaxy size: 50k radius, 1000 sector size = ~100x100 = 10k sectors, avg 2 systems/sector = 20k systems
    const estimatedTotal = 20000;
    const exploredPercent = (discovered / estimatedTotal) * 100;

    return {
      discovered,
      totalGenerated,
      sectorsGenerated,
      estimatedTotal,
      exploredPercent,
      seed: this.seed,
    };
  }
}
