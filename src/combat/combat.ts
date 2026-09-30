/**
 * Combat System v6 — Ship combat with tactics, not just shooting
 * Considers shields, armor, weapons, reactor, heat, crew, positioning
 * Enemy archetypes: Pirate, Military, Alien, Drone, Ancient Machine, Unknown Entity
 * Choices: Fight, Escape, Negotiate, Hide, Hack, Distract
 */

import { SeededRNG } from '../utils/seedRandom';
import { EnemyType, FactionId, ResourceType, type CombatEncounter } from '../core/types';

const ENEMY_NAMES: Record<EnemyType, string[]> = {
  [EnemyType.Pirate]: ['Black Star Raider', 'Void Marauder', 'Rust Bucket', 'Crimson Fang', 'Drifter King', 'Salvage Scum'],
  [EnemyType.Military]: ['Imperial Patrol', 'Federation Frigate', 'Enforcer MK-II', 'Peacekeeper', 'Border Guard'],
  [EnemyType.Alien]: ['Xeno Hunter', 'Bio-Ship', 'Spore Cloud', 'Crystal Entity', 'Void Whale', 'Unknown Contact'],
  [EnemyType.Drone]: ['Scout Drone', 'Defense Drone', 'Swarm Unit', 'Ancient Sentinel', 'Auto-Turret'],
  [EnemyType.AncientMachine]: ['Guardian', 'Watcher', 'Sentinel Prime', 'Architect Drone', 'The Old One'],
  [EnemyType.UnknownEntity]: ['???', 'Void Echo', 'Gravitational Anomaly', 'The Silence', 'Non-Euclidean'],
};

const ENEMY_DESCRIPTIONS: Record<EnemyType, string[]> = {
  [EnemyType.Pirate]: ['Heavily modified freighter with extra guns welded on.', 'Fast attack craft, hit and run tactics.', 'Salvaged warship, dangerous but unstable.'],
  [EnemyType.Military]: ['Disciplined formation, standard Imperial doctrine.', 'Heavy armor, strong shields, predictable but tough.', 'Elite unit, better tech than pirates.'],
  [EnemyType.Alien]: ['Biology and technology merged. Unpredictable.', 'Moves like it is alive, not piloted.', 'Energy readings make no sense.'],
  [EnemyType.Drone]: ['No crew, pure logic. No mercy, no fear.', 'Swarm behavior, attacks from multiple angles.', 'Ancient design, still functional after millennia.'],
  [EnemyType.AncientMachine]: ['Built by the Ancient civilization. Far beyond us.', 'It has been waiting. For you?', 'Technology that breaks known physics.'],
  [EnemyType.UnknownEntity]: ['Sensors cannot get a lock. Is it even there?', 'Reality bends around it. Crew reports headaches.', 'It should not exist.'],
};

export function generateCombatEncounter(rng: SeededRNG, dangerLevel: number, systemFaction?: FactionId): CombatEncounter {
  const typeRoll = rng.next();
  let enemyType: EnemyType;
  
  if (dangerLevel > 0.8) {
    enemyType = rng.pick([EnemyType.AncientMachine, EnemyType.UnknownEntity, EnemyType.Alien] as any);
  } else if (dangerLevel > 0.6) {
    enemyType = rng.pick([EnemyType.Military, EnemyType.Alien, EnemyType.AncientMachine] as any);
  } else if (dangerLevel > 0.3) {
    enemyType = rng.pick([EnemyType.Pirate, EnemyType.Military, EnemyType.Drone] as any);
  } else {
    enemyType = rng.pick([EnemyType.Pirate, EnemyType.Drone] as any);
  }

  const name = rng.pick(ENEMY_NAMES[enemyType]);
  const description = rng.pick(ENEMY_DESCRIPTIONS[enemyType]);

  const baseHull = 200 + dangerLevel * 800 + rng.range(-50, 50);
  const baseShield = 100 + dangerLevel * 500;
  const baseWeapon = 20 + dangerLevel * 80;

  const factionMap: Partial<Record<EnemyType, FactionId>> = {
    [EnemyType.Pirate]: FactionId.Nomadic,
    [EnemyType.Military]: FactionId.MilitaryEmpire,
    [EnemyType.Alien]: FactionId.Ancient,
    [EnemyType.Drone]: FactionId.Ancient,
  };

  return {
    id: `COMBAT-${rng.int(1000, 9999)}-${Date.now()}`,
    enemyType,
    enemyName: `${name} ${rng.int(1, 99)}`,
    enemyFaction: factionMap[enemyType] || systemFaction,
    danger: dangerLevel,
    enemyHull: baseHull,
    enemyHullMax: baseHull,
    enemyShield: baseShield,
    enemyWeapon: baseWeapon,
    rewards: {
      credits: Math.floor(100 + dangerLevel * 1000 + rng.range(0, 200)),
      resources: {
        ...(rng.bool(0.6) ? { [ResourceType.Minerals]: Math.floor(rng.range(10, 50)) } : {}),
        ...(rng.bool(0.3) ? { [ResourceType.TechSalvage]: Math.floor(rng.range(1, 5)) } : {}),
        ...(enemyType === EnemyType.AncientMachine && rng.bool(0.5) ? { [ResourceType.AlienArtifact]: 1 } : {}),
        ...(enemyType === EnemyType.UnknownEntity && rng.bool(0.3) ? { [ResourceType.DarkMatter]: 1 } : {}),
      },
      reputation: {
        ...(factionMap[enemyType] ? { [factionMap[enemyType]!]: -5 } : {}),
        ...(enemyType === EnemyType.Pirate ? { [FactionId.IndependentTraders]: 5, [FactionId.HumanFederation]: 3 } : {}),
      }
    },
    canNegotiate: enemyType === EnemyType.Pirate || enemyType === EnemyType.Military,
    canHack: enemyType === EnemyType.Drone || enemyType === EnemyType.AncientMachine,
    description,
  };
}

export class CombatManager {
  currentEncounter: CombatEncounter | null = null;
  private log: string[] = [];

  startCombat(encounter: CombatEncounter) {
    this.currentEncounter = encounter;
    this.log = [`Encounter: ${encounter.enemyName} (${encounter.enemyType})`, encounter.description];
    return encounter;
  }

  // Player actions
  attack(playerWeapon: number, playerShield: number): { playerDamage: number; enemyDamage: number; log: string } {
    if (!this.currentEncounter) throw new Error('No combat');

    const rng = new SeededRNG(`${Date.now()}-${Math.random()}`);
    
    // Enemy attacks
    const enemyHit = rng.bool(0.7);
    const enemyDamage = enemyHit ? this.currentEncounter.enemyWeapon * rng.range(0.8, 1.2) : 0;
    
    // Player attacks
    const playerHit = rng.bool(0.75);
    const playerDamage = playerHit ? playerWeapon * rng.range(0.8, 1.2) : 0;

    // Apply to enemy shield first, then hull
    if (playerDamage > 0) {
      if (this.currentEncounter.enemyShield > 0) {
        const shieldDamage = Math.min(playerDamage, this.currentEncounter.enemyShield);
        this.currentEncounter.enemyShield -= shieldDamage;
        const hullDamage = playerDamage - shieldDamage;
        this.currentEncounter.enemyHull -= hullDamage;
        this.log.push(`You hit ${this.currentEncounter.enemyName} for ${playerDamage.toFixed(0)} (${shieldDamage.toFixed(0)} shield, ${hullDamage.toFixed(0)} hull)`);
      } else {
        this.currentEncounter.enemyHull -= playerDamage;
        this.log.push(`You hit ${this.currentEncounter.enemyName} for ${playerDamage.toFixed(0)} hull`);
      }
    } else {
      this.log.push(`Your attack missed ${this.currentEncounter.enemyName}`);
    }

    if (enemyDamage > 0) {
      this.log.push(`${this.currentEncounter.enemyName} hits you for ${enemyDamage.toFixed(0)}`);
    } else {
      this.log.push(`${this.currentEncounter.enemyName} misses`);
    }

    return {
      playerDamage: enemyDamage,
      enemyDamage: playerDamage,
      log: this.log[this.log.length - 1],
    };
  }

  attemptEscape(playerSpeed: number): { success: boolean; log: string } {
    if (!this.currentEncounter) throw new Error('No combat');
    const rng = new SeededRNG(`${Date.now()}-${Math.random()}`);
    const escapeChance = 0.3 + playerSpeed * 0.005 + (this.currentEncounter.enemyType === EnemyType.Drone ? -0.2 : 0);
    const success = rng.bool(Math.min(0.9, escapeChance));
    const log = success 
      ? `Escape successful! FTL spooling...` 
      : `Escape failed! ${this.currentEncounter.enemyName} blocks your jump vector`;
    this.log.push(log);
    return { success, log };
  }

  attemptNegotiate(playerCredits: number, playerReputation: number): { success: boolean; cost: number; log: string } {
    if (!this.currentEncounter) throw new Error('No combat');
    if (!this.currentEncounter.canNegotiate) {
      return { success: false, cost: 0, log: `${this.currentEncounter.enemyName} does not negotiate` };
    }
    const rng = new SeededRNG(`${Date.now()}-${Math.random()}`);
    const cost = Math.floor(100 + this.currentEncounter.danger * 500);
    const negotiateChance = 0.4 + playerReputation * 0.01 + (playerCredits > cost ? 0.2 : -0.2);
    const success = rng.bool(negotiateChance);
    const log = success
      ? `Negotiation successful! Paid ${cost} CR to avoid combat`
      : `Negotiation failed! ${this.currentEncounter.enemyName} wants blood, not credits`;
    this.log.push(log);
    return { success, cost: success ? cost : 0, log };
  }

  attemptHack(playerTech: number): { success: boolean; log: string } {
    if (!this.currentEncounter) throw new Error('No combat');
    if (!this.currentEncounter.canHack) {
      return { success: false, log: `${this.currentEncounter.enemyName} cannot be hacked` };
    }
    const rng = new SeededRNG(`${Date.now()}-${Math.random()}`);
    const hackChance = 0.2 + playerTech * 0.05;
    const success = rng.bool(hackChance);
    if (success) {
      this.currentEncounter.enemyShield *= 0.5;
      this.currentEncounter.enemyWeapon *= 0.7;
    }
    const log = success
      ? `Hack successful! ${this.currentEncounter.enemyName} systems compromised — shield -50%, weapon -30%`
      : `Hack failed! ${this.currentEncounter.enemyName} firewall blocks intrusion`;
    this.log.push(log);
    return { success, log };
  }

  attemptDistract(): { success: boolean; log: string } {
    if (!this.currentEncounter) throw new Error('No combat');
    const rng = new SeededRNG(`${Date.now()}-${Math.random()}`);
    const success = rng.bool(0.5);
    if (success) {
      this.currentEncounter.enemyWeapon *= 0.8;
    }
    const log = success
      ? `Distraction successful! Launched probe/debris, ${this.currentEncounter.enemyName} targeting confused`
      : `Distraction failed! ${this.currentEncounter.enemyName} ignores your tricks`;
    this.log.push(log);
    return { success, log };
  }

  isCombatOver(): { over: boolean; victory: boolean } {
    if (!this.currentEncounter) return { over: true, victory: false };
    if (this.currentEncounter.enemyHull <= 0) return { over: true, victory: true };
    return { over: false, victory: false };
  }

  endCombat() {
    const encounter = this.currentEncounter;
    this.currentEncounter = null;
    this.log = [];
    return encounter;
  }

  getLog(): string[] {
    return [...this.log];
  }

  toJSON() {
    return {
      currentEncounter: this.currentEncounter,
      log: this.log,
    };
  }

  static fromJSON(data: any): CombatManager {
    const mgr = new CombatManager();
    if (data) {
      mgr.currentEncounter = data.currentEncounter || null;
      (mgr as any).log = data.log || [];
    }
    return mgr;
  }
}
