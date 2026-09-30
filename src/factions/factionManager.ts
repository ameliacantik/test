import { FactionId, type FactionState } from '../core/types';
import { FACTIONS } from '../data/factions';

export function createInitialFactionStates(): Record<FactionId, FactionState> {
  const states = {} as Record<FactionId, FactionState>;
  for (const factionId of Object.values(FactionId)) {
    const def = FACTIONS[factionId];
    const initialRep = factionId === FactionId.HumanFederation ? 10 : factionId === FactionId.Ancient ? 0 : 0;

    states[factionId] = {
      id: factionId,
      reputation: initialRep,
      attitude: getAttitude(initialRep),
      knownSystems: [],
      tradeModifier: 1.0,
      lastInteraction: Date.now(),
    };
  }
  return states;
}

function getAttitude(rep: number): FactionState['attitude'] {
  if (rep <= -50) return 'hostile';
  if (rep <= -10) return 'unfriendly';
  if (rep <= 30) return 'neutral';
  if (rep <= 70) return 'friendly';
  return 'allied';
}

export class FactionManager {
  states: Record<FactionId, FactionState>;

  constructor(states: Record<FactionId, FactionState>) {
    this.states = states;
  }

  getReputation(factionId: FactionId): number {
    return this.states[factionId]?.reputation || 0;
  }

  modifyReputation(factionId: FactionId, amount: number, reason?: string): number {
    const state = this.states[factionId];
    if (!state) return 0;

    const oldRep = state.reputation;
    state.reputation = Math.max(-100, Math.min(100, state.reputation + amount));
    state.attitude = getAttitude(state.reputation);
    state.lastInteraction = Date.now();

    // Trade modifier: better rep = better prices (lower buy, higher sell)
    state.tradeModifier = 1 - (state.reputation / 100) * 0.3; // 0.7 to 1.3

    console.log(`Faction ${factionId} rep: ${oldRep} -> ${state.reputation} (${reason || 'no reason'})`);

    return state.reputation;
  }

  getAttitude(factionId: FactionId): FactionState['attitude'] {
    return this.states[factionId]?.attitude || 'neutral';
  }

  getTradeModifier(factionId: FactionId): number {
    return this.states[factionId]?.tradeModifier || 1.0;
  }

  canAccessSystem(factionId: FactionId, dangerLevel: number): boolean {
    const rep = this.getReputation(factionId);
    const attitude = this.getAttitude(factionId);

    if (attitude === 'hostile' && dangerLevel > 0.3) return false; // hostile factions block access
    if (attitude === 'unfriendly' && rep < -20) return Math.random() > 0.5; // chance to be denied

    return true;
  }

  // Dynamic events that affect factions
  simulateFactionDynamics(rng: () => number) {
    // Occasional reputation drift, conflicts, etc.
    // For MVP, just small random fluctuations for non-player factions
    if (rng() < 0.01) {
      const factions = Object.values(FactionId);
      const f1 = factions[Math.floor(rng() * factions.length)];
      const f2 = factions[Math.floor(rng() * factions.length)];
      if (f1 !== f2) {
        // Factions interaction - could affect trade routes, danger levels
        console.log(`Faction event: ${f1} interacts with ${f2}`);
      }
    }
  }

  getSummary() {
    return Object.values(this.states).map(s => ({
      id: s.id,
      name: FACTIONS[s.id].name,
      reputation: s.reputation,
      attitude: s.attitude,
      color: FACTIONS[s.id].color,
    }));
  }
}
