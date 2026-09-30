/**
 * Galactic Structure — Realistic spiral galaxy generation
 * Makes outer space feel like real outer space: vast, mostly empty, with structure
 */

import type { Vec2 } from '../../utils/math';
import { SeededRNG } from '../../utils/seedRandom';

export interface GalacticConfig {
  seed: string;
  type: 'spiral' | 'elliptical' | 'irregular';
  radius: number; // in LY, e.g., 50000
  coreRadius: number; // core bulge radius
  armCount: number; // 2-4 for spiral
  armTightness: number; // 0.1-0.5, how tight spiral winds
  armWidth: number; // width of arms
  starDensity: number; // base density 0-1
  hasCentralBlackHole: boolean;
}

export const DEFAULT_GALACTIC_CONFIG: GalacticConfig = {
  seed: 'GALAXY-847291-AETHER',
  type: 'spiral',
  radius: 50000, // 50k LY diameter like Milky Way
  coreRadius: 5000,
  armCount: 4,
  armTightness: 0.25,
  armWidth: 0.5,
  starDensity: 0.6,
  hasCentralBlackHole: true,
};

export class GalacticStructure {
  config: GalacticConfig;
  rng: SeededRNG;

  constructor(config: Partial<GalacticConfig> = {}) {
    this.config = { ...DEFAULT_GALACTIC_CONFIG, ...config };
    this.rng = new SeededRNG(this.config.seed);
  }

  /**
   * Calculate star density at a given galactic position
   * Core = high density, arms = medium, voids = low
   * Returns 0-1
   */
  getDensityAt(pos: Vec2): number {
    const distFromCenter = Math.hypot(pos.x, pos.y);
    const angle = Math.atan2(pos.y, pos.x);

    if (distFromCenter > this.config.radius) return 0;

    // Core bulge: high density near center, falls off exponentially
    let coreDensity = 0;
    if (distFromCenter < this.config.coreRadius) {
      coreDensity = Math.exp(-distFromCenter / (this.config.coreRadius * 0.5)) * 0.8;
    }

    // Spiral arms
    let armDensity = 0;
    if (this.config.type === 'spiral') {
      for (let arm = 0; arm < this.config.armCount; arm++) {
        const armOffset = (arm / this.config.armCount) * Math.PI * 2;
        // Spiral formula: r = a * e^(b*theta)
        // We want to know if pos is near an arm
        const expectedAngle = armOffset + distFromCenter * this.config.armTightness * 0.001;
        let angleDiff = Math.abs(angle - expectedAngle);
        angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

        // Wrap angle diff to account for spiral winding multiple times
        // Simplified: check if angle is close to arm at this radius
        const armInfluence = Math.exp(-angleDiff * angleDiff / (this.config.armWidth * this.config.armWidth));
        armDensity = Math.max(armDensity, armInfluence * 0.6);
      }
    }

    // Disk density: falls off with distance from center and from galactic plane (y=0)
    const diskDensity = Math.exp(-distFromCenter / (this.config.radius * 0.4)) * Math.exp(-Math.abs(pos.y) / (this.config.radius * 0.2)) * 0.4;

    // Combine, with some randomness for clumps and voids
    const base = Math.max(coreDensity, Math.max(armDensity, diskDensity));
    const noise = this.rng.range(0.7, 1.3); // will be deterministic per pos if we use pos-based rng

    return Math.min(1, base * noise * this.config.starDensity);
  }

  /**
   * Deterministic density with pos-based RNG for consistency
   */
  getDensityAtDeterministic(pos: Vec2, seedRng: SeededRNG): number {
    const distFromCenter = Math.hypot(pos.x, pos.y);
    if (distFromCenter > this.config.radius) return 0;

    const angle = Math.atan2(pos.y, pos.x);

    let coreDensity = 0;
    if (distFromCenter < this.config.coreRadius) {
      coreDensity = Math.exp(-distFromCenter / (this.config.coreRadius * 0.5)) * 0.8;
    }

    let armDensity = 0;
    if (this.config.type === 'spiral') {
      for (let arm = 0; arm < this.config.armCount; arm++) {
        const armOffset = (arm / this.config.armCount) * Math.PI * 2;
        const expectedAngle = armOffset + distFromCenter * this.config.armTightness * 0.001;
        let angleDiff = Math.abs(angle - expectedAngle);
        angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
        const armInfluence = Math.exp(-angleDiff * angleDiff / (this.config.armWidth * this.config.armWidth));
        armDensity = Math.max(armDensity, armInfluence * 0.6);
      }
    }

    const diskDensity = Math.exp(-distFromCenter / (this.config.radius * 0.4)) * Math.exp(-Math.abs(pos.y) / (this.config.radius * 0.3)) * 0.4;

    const base = Math.max(coreDensity, Math.max(armDensity, diskDensity));
    const noise = seedRng.range(0.5, 1.5);

    // Add clumps: occasional high density clusters
    if (seedRng.bool(0.05)) {
      return Math.min(1, base * noise * 2.5);
    }

    return Math.min(1, base * noise * this.config.starDensity);
  }

  /**
   * Get galactic region name based on position
   */
  getRegionName(pos: Vec2): string {
    const dist = Math.hypot(pos.x, pos.y);
    const angle = Math.atan2(pos.y, pos.x);
    const angleDeg = (angle * 180 / Math.PI + 360) % 360;

    if (dist < 1000) return 'Core — Sagittarius A* Region';
    if (dist < this.config.coreRadius) return 'Core Bulge';

    // Determine arm
    const armIndex = Math.floor((angleDeg / 360) * this.config.armCount);
    const armNames = ['Perseus Arm', 'Sagittarius Arm', 'Scutum-Centaurus Arm', 'Outer Arm', 'Norma Arm'];
    const armName = armNames[armIndex % armNames.length];

    if (dist < 10000) return `Inner ${armName}`;
    if (dist < 25000) return `${armName} — Habitable Zone`;
    if (dist < 40000) return `Outer ${armName}`;
    return 'Galactic Halo — The Deep Void';
  }

  /**
   * Get danger modifier based on region
   * Core = high danger (radiation, black holes), arms = medium, halo = low but unknown
   */
  getDangerModifier(pos: Vec2): number {
    const dist = Math.hypot(pos.x, pos.y);
    if (dist < 1000) return 0.9; // near central black hole
    if (dist < this.config.coreRadius) return 0.6;
    if (dist < 10000) return 0.3;
    if (dist < 25000) return 0.2;
    if (dist < 40000) return 0.15;
    return 0.25; // halo: low known danger but high unknown
  }

  /**
   * Generate background nebula positions for rendering
   */
  generateNebulae(count: number = 20): { pos: Vec2; radius: number; color: string; type: 'emission' | 'reflection' | 'dark' }[] {
    const nebulae = [];
    const colors = [
      'rgba(150, 80, 200, 0.08)', // purple emission
      'rgba(80, 150, 200, 0.06)', // blue reflection
      'rgba(200, 80, 80, 0.07)',  // red emission
      'rgba(80, 200, 150, 0.05)', // green
      'rgba(200, 150, 80, 0.06)', // yellow
    ];

    for (let i = 0; i < count; i++) {
      const angle = this.rng.range(0, Math.PI * 2);
      const dist = this.rng.range(this.config.coreRadius, this.config.radius * 0.8);
      const pos: Vec2 = {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.6, // flatten disk
      };
      nebulae.push({
        pos,
        radius: this.rng.range(2000, 8000),
        color: this.rng.pick(colors),
        type: this.rng.pick(['emission', 'reflection', 'dark'] as const),
      });
    }

    return nebulae;
  }
}
