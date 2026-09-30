/**
 * World Memory — Galaxy remembers player actions
 * Persistent consequences that make world feel alive
 */

export interface WorldEvent {
  id: string;
  type: 'colony_helped' | 'pirate_destroyed' | 'ruins_discovered' | 'station_built' | 'faction_war' | 'trade_route_changed' | 'system_colonized' | 'anomaly_contained' | 'first_contact' | 'ancient_tech_recovered';
  timestamp: number;
  systemId: string;
  description: string;
  consequences: {
    type: 'reputation' | 'market' | 'station' | 'danger' | 'discovery' | 'quest';
    data: any;
  }[];
  isPermanent: boolean;
}

export interface SystemStateChange {
  systemId: string;
  changes: {
    danger?: number;
    wealth?: number;
    population?: number;
    newStation?: any;
    factionChange?: string;
    tradeRoute?: string;
  };
  reason: string;
  timestamp: number;
}

export class WorldMemory {
  events: WorldEvent[] = [];
  systemChanges: Map<string, SystemStateChange[]> = new Map();
  private rng: () => number;

  constructor(rng: () => number) {
    this.rng = rng;
  }

  addEvent(event: Omit<WorldEvent, 'id' | 'timestamp'>): WorldEvent {
    const fullEvent: WorldEvent = {
      id: `WEVT-${Date.now()}-${Math.floor(this.rng() * 10000)}`,
      timestamp: Date.now(),
      ...event,
    };
    this.events.unshift(fullEvent);
    if (this.events.length > 100) this.events.pop();

    // Apply consequences
    this.applyConsequences(fullEvent);

    return fullEvent;
  }

  private applyConsequences(event: WorldEvent) {
    for (const cons of event.consequences) {
      switch (cons.type) {
        case 'station':
          // New station built, etc.
          this.addSystemChange(event.systemId, {
            newStation: cons.data,
            reason: event.description,
          });
          break;
        case 'danger':
          this.addSystemChange(event.systemId, {
            danger: cons.data.danger,
            reason: event.description,
          });
          break;
        case 'market':
          this.addSystemChange(event.systemId, {
            wealth: cons.data.wealth,
            reason: event.description,
          });
          break;
      }
    }
  }

  private addSystemChange(systemId: string, change: { danger?: number; wealth?: number; population?: number; newStation?: any; factionChange?: string; tradeRoute?: string; reason: string }) {
    if (!this.systemChanges.has(systemId)) {
      this.systemChanges.set(systemId, []);
    }
    this.systemChanges.get(systemId)!.push({
      systemId,
      changes: change,
      reason: change.reason,
      timestamp: Date.now(),
    });
  }

  // Specific event helpers
  onColonyHelped(systemId: string, colonyName: string) {
    return this.addEvent({
      type: 'colony_helped',
      systemId,
      description: `Helped colony ${colonyName} with supplies. Colony is growing.`,
      consequences: [
        { type: 'market', data: { wealth: 0.1 } },
        { type: 'station', data: { populationGrowth: 500 } },
        { type: 'reputation', data: { faction: 'human_federation', amount: 5 } },
      ],
      isPermanent: true,
    });
  }

  onPirateDestroyed(systemId: string) {
    return this.addEvent({
      type: 'pirate_destroyed',
      systemId,
      description: `Destroyed pirate base in ${systemId}. Trade routes now safer.`,
      consequences: [
        { type: 'danger', data: { danger: -0.2 } },
        { type: 'market', data: { wealth: 0.05 } },
        { type: 'reputation', data: { faction: 'independent_traders', amount: 10 } },
      ],
      isPermanent: true,
    });
  }

  onRuinsDiscovered(systemId: string, planetName: string) {
    return this.addEvent({
      type: 'ruins_discovered',
      systemId,
      description: `Discovered Ancient ruins on ${planetName}. Factions are interested.`,
      consequences: [
        { type: 'discovery', data: { type: 'ancient_ruins' } },
        { type: 'quest', data: { type: 'investigation', systemId } },
      ],
      isPermanent: true,
    });
  }

  onAncientTechRecovered(systemId: string) {
    return this.addEvent({
      type: 'ancient_tech_recovered',
      systemId,
      description: `Recovered Ancient technology in ${systemId}. Scientific Coalition offers reward.`,
      consequences: [
        { type: 'reputation', data: { faction: 'scientific_coalition', amount: 15 } },
        { type: 'discovery', data: { type: 'ancient_tech' } },
      ],
      isPermanent: true,
    });
  }

  // Simulate world changes over time
  simulateTimePassage(days: number, galaxy: any, rng: () => number) {
    // Occasionally, colonies grow, pirates move, etc.
    if (rng() < 0.1 * days) {
      // Random system gets a new station
      const systems = galaxy.getAllSystems();
      const sys = systems[Math.floor(rng() * systems.length)];
      if (sys.stations.length < 3 && rng() < 0.3) {
        this.addEvent({
          type: 'station_built',
          systemId: sys.id,
          description: `New outpost built in ${sys.name} due to increased trade.`,
          consequences: [
            { type: 'station', data: { name: `New Outpost ${Math.floor(rng() * 100)}` } },
          ],
          isPermanent: true,
        });
      }
    }

    if (rng() < 0.05 * days) {
      // Faction war or conflict changes danger
      const systems = galaxy.getAllSystems();
      const sys = systems[Math.floor(rng() * systems.length)];
      if (sys.faction) {
        this.addEvent({
          type: 'faction_war',
          systemId: sys.id,
          description: `Faction conflict in ${sys.name}. Danger increased.`,
          consequences: [
            { type: 'danger', data: { danger: 0.1 } },
          ],
          isPermanent: false,
        });
      }
    }
  }

  getEventsForSystem(systemId: string): WorldEvent[] {
    return this.events.filter(e => e.systemId === systemId);
  }

  getRecentEvents(count: number = 10): WorldEvent[] {
    return this.events.slice(0, count);
  }

  toJSON() {
    return {
      events: this.events,
      systemChanges: Array.from(this.systemChanges.entries()),
    };
  }

  static fromJSON(data: any, rng: () => number): WorldMemory {
    const memory = new WorldMemory(rng);
    memory.events = data.events || [];
    memory.systemChanges = new Map(data.systemChanges || []);
    return memory;
  }
}
