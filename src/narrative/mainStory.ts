import { SeededRNG } from '../utils/seedRandom';
import { QuestType, QuestStatus, FactionId, ResourceType, type QuestData } from '../core/types';
import type { Galaxy } from '../galaxy/galaxy';

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  requiredLevel: number;
  requiredDiscoveries: number;
  requiredSystems: number;
  quests: string[]; // quest IDs in order
  rewards: {
    credits: number;
    reputation?: Partial<Record<FactionId, number>>;
    unlocks?: string[]; // codex entries, tech, systems
  };
  isCompleted: boolean;
}

export const MAIN_STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'chapter-1-awakening',
    title: 'Chapter 1: Awakening',
    description: 'Your journey begins. Learn the ship, explore nearby systems, and pick up strange signals.',
    requiredLevel: 1,
    requiredDiscoveries: 0,
    requiredSystems: 1,
    quests: ['main-1-1', 'main-1-2'],
    rewards: {
      credits: 500,
      unlocks: ['ancient-signal', 'stellar-red-dwarf'],
    },
    isCompleted: false,
  },
  {
    id: 'chapter-2-echoes',
    title: 'Chapter 2: Echoes in the Void',
    description: 'The signal grows stronger. Factions take notice. You find your first Ancient ruins.',
    requiredLevel: 2,
    requiredDiscoveries: 5,
    requiredSystems: 3,
    quests: ['main-2-1', 'main-2-2', 'main-2-3'],
    rewards: {
      credits: 1500,
      reputation: { [FactionId.ScientificCoalition]: 15 },
      unlocks: ['ancient-ruins', 'ancient-overview'],
    },
    isCompleted: false,
  },
  {
    id: 'chapter-3-nomad-secret',
    title: 'Chapter 3: The Nomad Secret',
    description: 'Void Nomads know more than they say. Gain their trust to learn the truth about the Ancients.',
    requiredLevel: 3,
    requiredDiscoveries: 12,
    requiredSystems: 6,
    quests: ['main-3-1', 'main-3-2'],
    rewards: {
      credits: 3000,
      reputation: { [FactionId.Nomadic]: 25 },
      unlocks: ['faction-nomad-secret', 'wormhole-network'],
    },
    isCompleted: false,
  },
  {
    id: 'chapter-4-silent-planet',
    title: 'Chapter 4: The Silent Planet',
    description: 'ANOM-8472 awaits. Every faction wants it. The countdown continues. Your choice will echo across the galaxy.',
    requiredLevel: 5,
    requiredDiscoveries: 25,
    requiredSystems: 10,
    quests: ['main-4-1', 'main-4-2', 'main-4-3'],
    rewards: {
      credits: 10000,
      unlocks: ['silent-planet', 'ancient-tech', 'phenomena-void-echo'],
    },
    isCompleted: false,
  },
  {
    id: 'chapter-5-return',
    title: 'Chapter 5: What Returns',
    description: 'The wormhole network awakens. Something is coming through. You must decide: close it, control it, or follow it.',
    requiredLevel: 7,
    requiredDiscoveries: 40,
    requiredSystems: 15,
    quests: ['main-5-1', 'main-5-2'],
    rewards: {
      credits: 25000,
      unlocks: ['wormhole-network'],
    },
    isCompleted: false,
  },
];

export function generateMainQuest(rng: SeededRNG, galaxy: Galaxy, chapterId: string, questId: string): QuestData {
  const chapter = MAIN_STORY_CHAPTERS.find(c => c.id === chapterId);
  if (!chapter) throw new Error(`Chapter ${chapterId} not found`);

  const systems = galaxy.getAllSystems();
  const targetSystem = rng.pick(systems);
  const targetPlanet = targetSystem.planets.length > 0 ? rng.pick(targetSystem.planets) : undefined;

  const questMap: Record<string, Partial<QuestData>> = {
    'main-1-1': {
      title: 'First Light',
      description: 'The AETHER-01 is ready. Perform a system scan and get familiar with your ship. Your Science Officer detected an unusual signal in the background radiation.',
      type: QuestType.Exploration,
      objectives: [
        { id: 'scan-system', description: `Scan your current system (${galaxy.getSystem(galaxy.startingSystemId)?.name})`, type: 'scan', targetSystemId: galaxy.startingSystemId, completed: false },
        { id: 'check-ship', description: 'Check ship modules in Ship tab', type: 'talk', completed: false },
      ],
      rarity: 'common',
    },
    'main-1-2': {
      title: 'The Whisper',
      description: 'The signal is faint but structured. Prime numbers, then coordinates. It points to a system 2 jumps away. Someone wants to be found. Or something wants to warn you.',
      type: QuestType.Investigation,
      objectives: [
        { id: 'travel-signal', description: `Travel to ${targetSystem.name} — source of the whisper`, type: 'travel', targetSystemId: targetSystem.id, completed: false },
        { id: 'investigate-signal', description: 'Investigate the signal source', type: 'investigate', targetSystemId: targetSystem.id, completed: false },
      ],
      branchingChoices: [
        { id: 'report-coalition', label: 'Report to Scientific Coalition', description: 'Safe, science reputation', consequences: 'Gain 10 Coalition rep, 200 credits, unlock codex entry' },
        { id: 'keep-secret', label: 'Keep it secret', description: 'Risky, but you keep control', consequences: 'No rep change, but you get exclusive data worth 500 credits later' },
      ],
      rarity: 'uncommon',
    },
    'main-2-1': {
      title: 'Ancient Footprints',
      description: 'Your Science Officer found something in the last scan: artificial structures on a planet that should be dead. Non-human. 8,000 years old. The architecture matches no known civilization.',
      type: QuestType.Research,
      objectives: [
        { id: 'find-ruins', description: `Find a planet with ruins (scan systems)`, type: 'scan', completed: false },
        { id: 'scan-ruins', description: `Scan the planet with ruins`, type: 'scan', targetPlanetId: targetPlanet?.id, completed: false },
      ],
      rarity: 'rare',
    },
    'main-2-2': {
      title: 'The Coalition Wants It',
      description: 'Scientific Coalition intercepted your discovery log (how?). They want the ruins data. They are offering credits and tech. But your Explorer says there is more on that planet — a data core, intact, that Coalition would confiscate.',
      type: QuestType.Diplomacy,
      objectives: [
        { id: 'decision', description: 'Decide: give data to Coalition or keep it', type: 'talk', completed: false },
      ],
      branchingChoices: [
        { id: 'give-coalition', label: 'Give to Coalition', description: 'Gain rep and credits, lose data core', consequences: '+15 Coalition rep, 800 credits, but lose chance at Ancient tech' },
        { id: 'keep-core', label: 'Keep the data core', description: 'Risk Coalition anger, gain Ancient tech', consequences: '-5 Coalition rep, but unlock Ancient Tech codex and exotic matter' },
        { id: 'copy-both', label: 'Make a copy, then give original', description: 'Requires Science Lab level 3', consequences: 'If successful: +10 rep and keep tech. If failed: -10 rep and lose both' },
      ],
      rarity: 'rare',
    },
    'main-2-3': {
      title: 'Echoes',
      description: 'Since the ruins, your crew reports strange things. Dreams of roads in the void. Whispers on empty channels. Your Navigator plotted a course you didn\'t order — to a system that isn\'t on any chart. The coordinates match the whisper from Chapter 1.',
      type: QuestType.Mystery,
      objectives: [
        { id: 'follow-dream', description: 'Follow the dream coordinates (travel to uncharted system)', type: 'travel', targetSystemId: targetSystem.id, completed: false },
      ],
      rarity: 'very_rare',
    },
    'main-3-1': {
      title: 'Nomad Contact',
      description: 'A Nomad generation ship, the "Endless Dream", has been shadowing you for 3 days. They finally hailed. Their elder wants to meet. She says she knew your ship would come. She says she knew your name before you were born.',
      type: QuestType.Diplomacy,
      objectives: [
        { id: 'meet-nomad', description: 'Rendezvous with Nomad fleet', type: 'travel', targetSystemId: targetSystem.id, completed: false },
        { id: 'gain-trust', description: 'Gain Nomad trust (requires 20+ Nomad rep or completion of 2 Nomad missions)', type: 'talk', completed: false },
      ],
      rarity: 'rare',
    },
    'main-3-2': {
      title: 'The Truth They Hide',
      description: 'The elder showed you a scar: a perfect circle with symbols. Her grandmother went to the silent planet. Came back without memory, without crew, with this scar that pulses with the Ancient signal. "The Ancients didn\'t disappear," she says. "They left. Because something was coming. Something that hunts civilizations that sing too loudly."',
      type: QuestType.Investigation,
      objectives: [
        { id: 'learn-secret', description: 'Learn the Nomad secret (requires trust)', type: 'investigate', completed: false },
      ],
      rarity: 'legendary',
    },
    'main-4-1': {
      title: 'The Silent Planet — Approach',
      description: 'ANOM-8472. The silent planet. From orbit, it looks alive — city lights, power grid — but radio silent. The Ancient signal originates from a 2km tower at the south pole. Surrounding it: 3,000+ identical objects in concentric circles. Pods? Ships? Eggs? Every faction is converging. Federation wants quarantine, Coalition wants study, Empire wants to secure, Traders want to loot. Nomads... Nomads are leaving the sector.',
      type: QuestType.Mystery,
      objectives: [
        { id: 'travel-silent', description: 'Travel to ANOM-8472 (requires FTL range 800+ and 1000 fuel)', type: 'travel', completed: false },
        { id: 'orbital-scan', description: 'Perform orbital scan of silent planet', type: 'scan', completed: false },
      ],
      rarity: 'unique',
    },
    'main-4-2': {
      title: 'The Choice',
      description: 'Orbital scan complete. The tower just powered on. It noticed you. The 3,000 objects are powering on too. Countdown at 68.4% and accelerating. You have 3 options, Captain. And about 10 minutes before every faction fleet arrives and makes the choice for you.',
      type: QuestType.Mystery,
      objectives: [
        { id: 'make-choice', description: 'Choose your approach to the silent planet', type: 'talk', completed: false },
      ],
      branchingChoices: [
        { id: 'land-immediately', label: 'Land Immediately', description: 'Brave, dangerous, first to touch surface', consequences: 'Unique quest chain, high risk, possible first contact or death, unlocks Ancient tech, Nomad respect' },
        { id: 'orbital-study', label: 'Orbital Study', description: 'Cautious, scientific, safe', consequences: 'Begin investigation from orbit, gain Coalition rep, unlock research chain, but lose first-mover advantage' },
        { id: 'quarantine-report', label: 'Quarantine and Report', description: 'Safe, faction-approved, bureaucratic', consequences: 'Federation +20 rep, safe route, but mystery remains, other factions may get there first' },
        { id: 'destroy-tower', label: 'Destroy the Tower (Security recommendation)', description: 'Extreme, irreversible', consequences: 'Tower destroyed, signal stops, countdown stops, but what did you destroy? And what will come looking for it?' },
      ],
      rarity: 'unique',
    },
    'main-4-3': {
      title: 'What Woke Up',
      description: 'You made your choice. Now deal with consequences. The tower is... reacting. The pods are opening. Something is coming out. Or something is coming through. Your crew is screaming. Not in fear. In wonder. Or is it the same thing?',
      type: QuestType.Mystery,
      objectives: [
        { id: 'survive', description: 'Survive the awakening', type: 'investigate', completed: false },
      ],
      rarity: 'unique',
    },
    'main-5-1': {
      title: 'The Roads Open',
      description: 'The wormhole network is awakening. Gates across 400 light years are powering on. Some lead to empty space. Some lead to... elsewhere. One gate, near ANOM-8472, is stable and shows a destination: a galaxy that is not our own. Or a time that is not our own. The signal countdown is at 12.3%.',
      type: QuestType.Exploration,
      objectives: [
        { id: 'find-gate', description: 'Find an active wormhole gate', type: 'travel', completed: false },
        { id: 'scan-gate', description: 'Scan the gate', type: 'scan', completed: false },
      ],
      rarity: 'legendary',
    },
    'main-5-2': {
      title: 'The Final Choice',
      description: 'The gate is open. You can close it (requires exotic matter and will destroy ANOM-8472), control it (requires Ancient tech and will make you target of every faction), or enter it (one-way, unknown destination, but answers). Your crew looks to you. The galaxy holds its breath. What does it mean to be an explorer?',
      type: QuestType.Mystery,
      objectives: [
        { id: 'final-choice', description: 'Make the final choice', type: 'talk', completed: false },
      ],
      branchingChoices: [
        { id: 'close-gate', label: 'Close the Gate', description: 'Destroy ANOM-8472 and the gate, stop the signal, save the galaxy from whatever is coming', consequences: 'Galaxy safe, but Ancient knowledge lost, Nomads approve, Coalition furious, you are hero and destroyer' },
        { id: 'control-gate', label: 'Control the Gate', description: 'Use Ancient tech to control network, become gatekeeper', consequences: 'You control travel, become most powerful entity in galaxy, every faction wants you dead or allied, endless responsibility' },
        { id: 'enter-gate', label: 'Enter the Gate', description: 'Leave everything, follow the Ancients, find out where they went and why', consequences: 'Game ends? Or begins anew? Your name becomes legend, your crew becomes myth, and somewhere, 12,000 years ago, a new signal starts broadcasting' },
      ],
      rarity: 'unique',
    },
  };

  const base = questMap[questId];
  if (!base) throw new Error(`Quest ${questId} not found`);

  return {
    id: questId,
    title: base.title!,
    description: base.description!,
    type: base.type!,
    status: QuestStatus.Available,
    giver: {
      name: questId.startsWith('main-1') ? 'AETHER-01 AI' : questId.startsWith('main-3') ? 'Elder Yara of Endless Dream' : 'Unknown',
      faction: questId.includes('3') ? FactionId.Nomadic : FactionId.ScientificCoalition,
    },
    objectives: base.objectives || [],
    rewards: {
      credits: base.rarity === 'unique' ? 5000 : base.rarity === 'legendary' ? 2000 : base.rarity === 'rare' ? 800 : 300,
      reputation: { [FactionId.ScientificCoalition]: 5 },
      resources: base.rarity === 'rare' || base.rarity === 'legendary' || base.rarity === 'unique' ? { [ResourceType.TechSalvage]: 3, [ResourceType.Exotic]: 2 } : undefined,
    },
    createdAt: Date.now(),
    branchingChoices: base.branchingChoices,
    rarity: base.rarity || 'common',
  };
}

export class StoryManager {
  chapters: StoryChapter[];
  currentChapterIndex: number = 0;
  completedQuests: Set<string> = new Set();

  constructor() {
    this.chapters = JSON.parse(JSON.stringify(MAIN_STORY_CHAPTERS));
  }

  getCurrentChapter(): StoryChapter | null {
    if (this.currentChapterIndex >= this.chapters.length) return null;
    return this.chapters[this.currentChapterIndex];
  }

  canStartChapter(playerLevel: number, discoveries: number, systems: number): boolean {
    const chapter = this.getCurrentChapter();
    if (!chapter) return false;
    return playerLevel >= chapter.requiredLevel && discoveries >= chapter.requiredDiscoveries && systems >= chapter.requiredSystems;
  }

  completeQuest(questId: string) {
    this.completedQuests.add(questId);
    const chapter = this.getCurrentChapter();
    if (chapter && chapter.quests.every(q => this.completedQuests.has(q))) {
      chapter.isCompleted = true;
      this.currentChapterIndex++;
      return true; // chapter completed
    }
    return false;
  }

  getProgress(): { chapter: number; total: number; percent: number; currentTitle: string } {
    const total = this.chapters.length;
    const completed = this.chapters.filter(c => c.isCompleted).length;
    const current = this.getCurrentChapter();
    return {
      chapter: this.currentChapterIndex + 1,
      total,
      percent: (completed / total) * 100,
      currentTitle: current?.title || 'Story Complete',
    };
  }

  toJSON() {
    return {
      chapters: this.chapters,
      currentChapterIndex: this.currentChapterIndex,
      completedQuests: Array.from(this.completedQuests),
    };
  }

  static fromJSON(data: any): StoryManager {
    const manager = new StoryManager();
    manager.chapters = data.chapters || JSON.parse(JSON.stringify(MAIN_STORY_CHAPTERS));
    manager.currentChapterIndex = data.currentChapterIndex || 0;
    manager.completedQuests = new Set(data.completedQuests || []);
    return manager;
  }
}
