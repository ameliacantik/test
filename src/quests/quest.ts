import { SeededRNG } from '../utils/seedRandom';
import { QuestType, QuestStatus, FactionId, ResourceType, type QuestData, type SystemId } from '../core/types';
import type { Galaxy } from '../galaxy/galaxy';

const QUEST_TITLES: Record<QuestType, string[]> = {
  [QuestType.Exploration]: [
    'Chart the Unknown', 'Beyond the Veil', 'Lost Sector Survey', 'The Edge of Maps',
    'Where No One Has Gone', 'Signal in the Dark'
  ],
  [QuestType.Delivery]: [
    'Urgent Delivery', 'Supply Run', 'Fragile Cargo', 'The Last Shipment',
    'Medical Supplies', 'Fuel for the Outpost'
  ],
  [QuestType.Research]: [
    'Anomalous Readings', 'Sample Collection', 'Xenobiology Study', 'Ancient Data',
    'The Scientist\'s Request', 'Unidentified Material'
  ],
  [QuestType.Rescue]: [
    'Distress Call', 'Missing Crew', 'Stranded Survivor', 'Emergency Evac',
    'The Lost Expedition', 'SOS'
  ],
  [QuestType.Combat]: [
    'Pirate Hunt', 'Clear the Sector', 'Defend the Convoy', 'Bounty',
    'Hostile Contact', 'Security Detail'
  ],
  [QuestType.Investigation]: [
    'The Silent Station', 'Ghost Signal', 'Disappearance', 'The Anomaly',
    'What Happened Here?', 'Echoes of the Past'
  ],
  [QuestType.Trading]: [
    'Trade Opportunity', 'Market Disruption', 'Rare Goods', 'The Merchant\'s Favor',
    'Supply and Demand', 'Profit Margin'
  ],
  [QuestType.Diplomacy]: [
    'First Contact', 'Mediation', 'The Ambassador', 'Faction Dispute',
    'Negotiation', 'The Peace Offering'
  ],
  [QuestType.Survey]: [
    'Planetary Survey', 'Resource Assessment', 'Habitable World Search', 'Geological Survey',
    'Atmospheric Analysis', 'Deep Scan'
  ],
  [QuestType.Mystery]: [
    'The Silent Planet', 'The Void Whisper', 'Ancient Beacon', 'The Unseen',
    'What Lies Beneath', 'The Forgotten'
  ],
};

const QUEST_DESCRIPTIONS: Record<QuestType, string[]> = {
  [QuestType.Exploration]: [
    'An uncharted system has been detected by long-range sensors. No one has visited it. Yet.',
    'A gravitational anomaly suggests a hidden jump route. Chart it, if you dare.',
  ],
  [QuestType.Delivery]: [
    'Outpost needs supplies urgently. They will pay well for fast delivery.',
    'Fragile scientific equipment must be delivered without damage. No sudden maneuvers.',
  ],
  [QuestType.Research]: [
    'Scientist needs samples from a specific planet type. High radiation, high reward.',
    'Ancient data core was found. Need help decoding it. Your Science Lab might be key.',
  ],
  [QuestType.Rescue]: [
    'Escape pod detected. Life signs faint. Time is limited.',
    'Research vessel lost contact near a black hole. Search and rescue.',
  ],
  [QuestType.Combat]: [
    'Pirates have been raiding trade routes. Faction wants them cleared.',
    'Hostile drones detected near colony. Eliminate threat.',
  ],
  [QuestType.Investigation]: [
    'Station went silent. No distress call. Last transmission was... strange.',
    'Signal repeats prime numbers, then coordinates. Someone or something wants to be found.',
  ],
  [QuestType.Trading]: [
    'Price spike detected in nearby system. Buy low, sell high. Classic.',
    'Merchant needs rare goods transported. Will pay premium for discretion.',
  ],
  [QuestType.Diplomacy]: [
    'Two factions dispute territory. Mediator needed. Choose sides carefully.',
    'First contact protocol. New civilization detected. Do not screw this up.',
  ],
  [QuestType.Survey]: [
    'Need detailed scan of planets in system. Science Coalition will pay for data.',
    'Search for water worlds. Colony expansion depends on it.',
  ],
  [QuestType.Mystery]: [
    'Planet shows active technology but no life. All cities lit, no movement. What happened?',
    'Signal from 12,000 years ago. Same signal detected now, 400 LY away. How?',
  ],
};

function pickQuestType(rng: SeededRNG): QuestType {
  const types = Object.values(QuestType);
  return rng.pick(types);
}

export function generateQuest(rng: SeededRNG, galaxy: Galaxy, faction?: FactionId, playerLevel: number = 1): QuestData {
  const type = pickQuestType(rng);
  const title = rng.pick(QUEST_TITLES[type]);
  const description = rng.pick(QUEST_DESCRIPTIONS[type]);

  const systems = galaxy.getAllSystems();
  const targetSystem = rng.pick(systems);
  const targetPlanet = targetSystem.planets.length > 0 ? rng.pick(targetSystem.planets) : undefined;

  const giverName = `${rng.pick(['Commander', 'Dr.', 'Captain', 'Administrator', 'Trader', 'Chief'])} ${rng.pick(['Vance', 'Chen', 'Okafor', 'Sato', 'Reyes', 'Kovacs', 'Wren', 'Stone'])}`;
  const giverFaction = faction || targetSystem.faction || rng.pick(Object.values(FactionId));

  const rarityRoll = rng.next();
  const rarity = rarityRoll < 0.05 ? 'legendary' : rarityRoll < 0.15 ? 'rare' : rarityRoll < 0.4 ? 'uncommon' : 'common';

  const objectives: QuestData['objectives'] = [];

  switch (type) {
    case QuestType.Exploration:
      objectives.push({
        id: 'obj-1',
        description: `Travel to ${targetSystem.name}`,
        type: 'travel',
        targetSystemId: targetSystem.id,
        completed: false,
      });
      objectives.push({
        id: 'obj-2',
        description: `Scan ${targetSystem.name}`,
        type: 'scan',
        targetSystemId: targetSystem.id,
        completed: false,
      });
      break;
    case QuestType.Survey:
      objectives.push({
        id: 'obj-1',
        description: `Travel to ${targetSystem.name}`,
        type: 'travel',
        targetSystemId: targetSystem.id,
        completed: false,
      });
      if (targetPlanet) {
        objectives.push({
          id: 'obj-2',
          description: `Scan planet ${targetPlanet.name}`,
          type: 'scan',
          targetSystemId: targetSystem.id,
          targetPlanetId: targetPlanet.id,
          completed: false,
        });
      }
      break;
    case QuestType.Delivery:
      const resType = rng.pick(Object.values(ResourceType));
      const amount = rng.int(10, 50) * playerLevel;
      objectives.push({
        id: 'obj-1',
        description: `Collect ${amount} ${resType}`,
        type: 'collect',
        resourceType: resType,
        resourceAmount: amount,
        completed: false,
      });
      objectives.push({
        id: 'obj-2',
        description: `Deliver to ${targetSystem.name}`,
        type: 'deliver',
        targetSystemId: targetSystem.id,
        resourceType: resType,
        resourceAmount: amount,
        completed: false,
      });
      break;
    case QuestType.Research:
      if (targetPlanet) {
        objectives.push({
          id: 'obj-1',
          description: `Investigate ${targetPlanet.name} in ${targetSystem.name}`,
          type: 'investigate',
          targetSystemId: targetSystem.id,
          targetPlanetId: targetPlanet.id,
          completed: false,
        });
      } else {
        objectives.push({
          id: 'obj-1',
          description: `Investigate anomaly in ${targetSystem.name}`,
          type: 'investigate',
          targetSystemId: targetSystem.id,
          completed: false,
        });
      }
      break;
    default:
      objectives.push({
        id: 'obj-1',
        description: `Travel to ${targetSystem.name} and investigate`,
        type: 'travel',
        targetSystemId: targetSystem.id,
        completed: false,
      });
  }

  const credits = rng.int(100, 500) * (rarity === 'legendary' ? 5 : rarity === 'rare' ? 2 : 1) * playerLevel;
  const reputationReward: Partial<Record<FactionId, number>> = {};
  reputationReward[giverFaction] = rng.int(5, 20) * (rarity === 'legendary' ? 2 : 1);

  // Branching for mystery/investigation
  let branchingChoices: QuestData['branchingChoices'];
  if (type === QuestType.Mystery || type === QuestType.Investigation) {
    branchingChoices = [
      { id: 'study', label: 'Study the phenomenon', description: 'Scientific approach, low risk', consequences: 'Gain research data, faction science rep' },
      { id: 'report', label: 'Report to faction', description: 'Safe, faction reward', consequences: 'Credits + reputation, but mystery remains' },
      { id: 'follow', label: 'Follow the signal', description: 'Dangerous, unknown reward', consequences: 'Unlock hidden system, high risk/reward' },
      { id: 'sell', label: 'Sell information', description: 'Profit, moral cost', consequences: 'High credits, lose science rep' },
    ];
  }

  return {
    id: `QUEST-${Date.now()}-${rng.int(1000, 9999)}`,
    title,
    description,
    type,
    status: QuestStatus.Available,
    giver: {
      name: giverName,
      faction: giverFaction,
    },
    objectives,
    rewards: {
      credits,
      reputation: reputationReward,
      resources: rarity === 'rare' || rarity === 'legendary' ? { [ResourceType.TechSalvage]: rng.int(1, 5), [ResourceType.Exotic]: rng.int(1, 3) } : undefined,
    },
    createdAt: Date.now(),
    timeLimit: rng.bool(0.3) ? Date.now() + rng.int(1, 7) * 24 * 60 * 60 * 1000 : undefined,
    branchingChoices,
    rarity,
  };
}

export class QuestManager {
  available: QuestData[] = [];
  active: QuestData[] = [];
  completed: QuestData[] = [];

  constructor(available: QuestData[] = [], active: QuestData[] = [], completed: QuestData[] = []) {
    this.available = available;
    this.active = active;
    this.completed = completed;
  }

  generateAvailableQuests(rng: SeededRNG, galaxy: Galaxy, count: number, playerLevel: number = 1) {
    for (let i = 0; i < count; i++) {
      const qRng = rng.fork(`quest-${Date.now()}-${i}`);
      const quest = generateQuest(qRng, galaxy, undefined, playerLevel);
      this.available.push(quest);
    }
  }

  acceptQuest(questId: string): boolean {
    const idx = this.available.findIndex(q => q.id === questId);
    if (idx === -1) return false;
    const quest = this.available[idx];
    quest.status = QuestStatus.Active;
    this.active.push(quest);
    this.available.splice(idx, 1);
    return true;
  }

  completeObjective(questId: string, objectiveId: string): boolean {
    const quest = this.active.find(q => q.id === questId);
    if (!quest) return false;
    const obj = quest.objectives.find(o => o.id === objectiveId);
    if (!obj) return false;
    obj.completed = true;

    // Check if all objectives complete
    if (quest.objectives.every(o => o.completed)) {
      quest.status = QuestStatus.Completed;
      quest.completedAt = Date.now();
      this.completed.push(quest);
      this.active = this.active.filter(q => q.id !== questId);
      return true;
    }
    return false;
  }

  // Auto-check objectives based on game state
  checkAutoObjectives(currentSystemId: string | null, scannedSystems: string[], scannedPlanets: string[], resources: Record<string, number>) {
    for (const quest of this.active) {
      for (const obj of quest.objectives) {
        if (obj.completed) continue;
        if (obj.type === 'travel' && obj.targetSystemId === currentSystemId) {
          obj.completed = true;
        }
        if (obj.type === 'scan' && obj.targetSystemId && scannedSystems.includes(obj.targetSystemId)) {
          // If planet specified, need that planet scanned
          if (obj.targetPlanetId) {
            if (scannedPlanets.includes(obj.targetPlanetId)) obj.completed = true;
          } else {
            obj.completed = true;
          }
        }
        if (obj.type === 'collect' && obj.resourceType && obj.resourceAmount) {
          if ((resources[obj.resourceType] || 0) >= obj.resourceAmount) obj.completed = true;
        }
      }
      // Check completion
      if (quest.objectives.every(o => o.completed)) {
        quest.status = QuestStatus.Completed;
        quest.completedAt = Date.now();
        this.completed.push(quest);
      }
    }
    this.active = this.active.filter(q => q.status !== QuestStatus.Completed);
  }

  getActiveQuests(): QuestData[] {
    return this.active;
  }

  getAvailableQuests(): QuestData[] {
    return this.available;
  }
}
