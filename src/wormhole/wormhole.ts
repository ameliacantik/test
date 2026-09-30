/**
 * Wormhole System v6 — Ancient gates and natural wormholes for fast travel
 * Enables travel across galaxy without fuel cost but with risk
 */

import { SeededRNG } from '../utils/seedRandom';
import type { Vec2 } from '../utils/math';
import type { SystemId, WormholeData } from '../core/types';

export class WormholeManager {
  wormholes: Map<string, WormholeData> = new Map();
  private rng: SeededRNG;

  constructor(seed: string) {
    this.rng = new SeededRNG(seed + '-wormhole');
    this.generateWormholes();
  }

  private generateWormholes() {
    // Generate stable wormholes — rare, hand-placed like in lore
    const count = 8;
    
    for (let i = 0; i < count; i++) {
      const angle = this.rng.range(0, Math.PI * 2);
      const dist = this.rng.range(5000, 40000);
      const pos: Vec2 = {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.6,
      };

      // Pair them
      const linkedAngle = angle + Math.PI + this.rng.range(-0.5, 0.5);
      const linkedDist = this.rng.range(5000, 40000);
      const linkedPos: Vec2 = {
        x: Math.cos(linkedAngle) * linkedDist,
        y: Math.sin(linkedAngle) * linkedDist * 0.6,
      };

      const type = i < 2 ? 'ancient_gate' : this.rng.bool(0.7) ? 'stable' : 'unstable';
      const stability = type === 'stable' ? this.rng.range(0.8, 1.0) : type === 'ancient_gate' ? 1.0 : this.rng.range(0.3, 0.7);

      const wh1: WormholeData = {
        id: `WH-${i * 2}`,
        position: pos,
        linkedTo: linkedPos,
        stability,
        type,
        discovered: false,
      };

      const wh2: WormholeData = {
        id: `WH-${i * 2 + 1}`,
        position: linkedPos,
        linkedTo: pos,
        stability,
        type,
        discovered: false,
      };

      this.wormholes.set(wh1.id, wh1);
      this.wormholes.set(wh2.id, wh2);
    }

    console.log(`Wormhole network: ${this.wormholes.size} wormholes generated`);
  }

  getWormhole(id: string): WormholeData | undefined {
    return this.wormholes.get(id);
  }

  getAllWormholes(): WormholeData[] {
    return Array.from(this.wormholes.values());
  }

  getWormholesInRange(pos: Vec2, range: number): WormholeData[] {
    const result: WormholeData[] = [];
    for (const wh of this.wormholes.values()) {
      const dx = wh.position.x - pos.x;
      const dy = wh.position.y - pos.y;
      if (dx * dx + dy * dy <= range * range) {
        result.push(wh);
      }
    }
    return result;
  }

  getDiscoveredWormholes(): WormholeData[] {
    return Array.from(this.wormholes.values()).filter(wh => wh.discovered);
  }

  discoverWormhole(id: string) {
    const wh = this.wormholes.get(id);
    if (wh) {
      wh.discovered = true;
      // Also discover linked
      for (const other of this.wormholes.values()) {
        if (other.position.x === wh.linkedTo?.x && other.position.y === wh.linkedTo?.y) {
          other.discovered = true;
        }
      }
    }
  }

  canTravelThrough(wormholeId: string, hasStabilizer: boolean): { can: boolean; risk: number; message: string } {
    const wh = this.wormholes.get(wormholeId);
    if (!wh) return { can: false, risk: 1, message: 'Wormhole not found' };
    if (!wh.discovered) return { can: false, risk: 1, message: 'Wormhole not discovered' };
    if (!wh.linkedTo) return { can: false, risk: 1, message: 'Wormhole has no destination' };

    if (wh.type === 'ancient_gate') {
      return { can: true, risk: 0, message: 'Ancient gate — stable, safe travel' };
    }

    if (wh.type === 'stable') {
      const risk = 1 - wh.stability;
      return { can: true, risk, message: `Stable wormhole — ${Math.floor(risk * 100)}% risk of minor damage` };
    }

    // Unstable
    if (hasStabilizer) {
      return { can: true, risk: 0.1, message: 'Unstable wormhole stabilized — 10% risk' };
    }

    return { can: true, risk: 1 - wh.stability, message: `Unstable wormhole — ${Math.floor((1 - wh.stability) * 100)}% risk! Requires stabilizer for safety` };
  }

  travelThrough(wormholeId: string, hasStabilizer: boolean): { success: boolean; destination: Vec2 | null; damage: number; message: string } {
    const check = this.canTravelThrough(wormholeId, hasStabilizer);
    if (!check.can) {
      return { success: false, destination: null, damage: 0, message: check.message };
    }

    const wh = this.wormholes.get(wormholeId)!;
    const rng = new SeededRNG(`${Date.now()}-${wormholeId}`);

    // Roll for risk
    if (rng.next() < check.risk) {
      const damage = Math.floor(rng.range(50, 200) * check.risk);
      if (rng.bool(check.risk * 0.3)) {
        // Failure — random destination
        const randomPos: Vec2 = {
          x: rng.range(-40000, 40000),
          y: rng.range(-20000, 20000),
        };
        return {
          success: false,
          destination: randomPos,
          damage,
          message: `Wormhole malfunction! Thrown off course to random location. Hull -${damage}`,
        };
      }
      return {
        success: true,
        destination: wh.linkedTo!,
        damage,
        message: `Traveled through ${wh.type} wormhole but suffered damage. Hull -${damage}`,
      };
    }

    return {
      success: true,
      destination: wh.linkedTo!,
      damage: 0,
      message: `Successfully traveled through ${wh.type} wormhole to ${wh.linkedTo!.x.toFixed(0)}, ${wh.linkedTo!.y.toFixed(0)}`,
    };
  }

  toJSON() {
    return {
      wormholes: Array.from(this.wormholes.values()),
    };
  }

  static fromJSON(data: any, seed: string): WormholeManager {
    const manager = new WormholeManager(seed);
    manager.wormholes.clear();
    for (const wh of data.wormholes as WormholeData[]) {
      manager.wormholes.set(wh.id, wh);
    }
    return manager;
  }
}
