/**
 * Research System v6 — Research propulsion, weapons, shields, scanning, biology, energy, ancient tech
 * Requires data, samples, resources, time
 */

import { ResourceType, type ResearchNode } from '../core/types';

export const RESEARCH_TREE: ResearchNode[] = [
  // Propulsion
  {
    id: 'propulsion_1',
    name: 'Improved FTL Drive',
    description: 'Increases FTL range by 20% and reduces fuel cost by 10%.',
    category: 'propulsion',
    cost: { [ResourceType.Minerals]: 50, [ResourceType.TechSalvage]: 5 },
    requiredData: 10,
    requiredSamples: 0,
    time: 60,
    prerequisites: [],
    unlocks: ['propulsion_2', 'fuel_efficiency'],
    completed: false,
    progress: 0,
  },
  {
    id: 'propulsion_2',
    name: 'Advanced FTL Navigation',
    description: 'Reduces FTL failure chance and allows emergency jumps with less damage.',
    category: 'propulsion',
    cost: { [ResourceType.Minerals]: 100, [ResourceType.Exotic]: 5, [ResourceType.TechSalvage]: 10 },
    requiredData: 25,
    requiredSamples: 0,
    time: 120,
    prerequisites: ['propulsion_1'],
    unlocks: ['wormhole_physics'],
    completed: false,
    progress: 0,
  },
  {
    id: 'fuel_efficiency',
    name: 'Fuel Efficiency',
    description: 'Ship uses 15% less fuel for all travel. Enables fuel scooping from stars.',
    category: 'propulsion',
    cost: { [ResourceType.Minerals]: 30, [ResourceType.Organics]: 20 },
    requiredData: 15,
    requiredSamples: 5,
    time: 90,
    prerequisites: ['propulsion_1'],
    unlocks: ['propulsion_2'],
    completed: false,
    progress: 0,
  },
  {
    id: 'wormhole_physics',
    name: 'Wormhole Physics',
    description: 'Understand wormholes. Unlocks wormhole travel and stabilizer crafting.',
    category: 'propulsion',
    cost: { [ResourceType.Exotic]: 10, [ResourceType.DarkMatter]: 2, [ResourceType.AlienArtifact]: 1 },
    requiredData: 50,
    requiredSamples: 10,
    time: 300,
    prerequisites: ['propulsion_2'],
    unlocks: [],
    completed: false,
    progress: 0,
  },

  // Weapons
  {
    id: 'weapons_1',
    name: 'Enhanced Weapons',
    description: '+20% weapon damage. Better targeting systems.',
    category: 'weapons',
    cost: { [ResourceType.Minerals]: 60, [ResourceType.TechSalvage]: 5 },
    requiredData: 10,
    requiredSamples: 0,
    time: 60,
    prerequisites: [],
    unlocks: ['weapons_2', 'drone_combat'],
    completed: false,
    progress: 0,
  },
  {
    id: 'weapons_2',
    name: 'Plasma Weapons',
    description: 'Plasma-based weapons. +40% damage, ignores 20% armor.',
    category: 'weapons',
    cost: { [ResourceType.Minerals]: 120, [ResourceType.Exotic]: 8, [ResourceType.TechSalvage]: 15 },
    requiredData: 30,
    requiredSamples: 5,
    time: 180,
    prerequisites: ['weapons_1'],
    unlocks: ['ancient_weapons'],
    completed: false,
    progress: 0,
  },
  {
    id: 'drone_combat',
    name: 'Combat Drones',
    description: 'Unlocks combat drone crafting and +1 drone bay capacity.',
    category: 'weapons',
    cost: { [ResourceType.Minerals]: 80, [ResourceType.TechSalvage]: 10, [ResourceType.Exotic]: 3 },
    requiredData: 20,
    requiredSamples: 0,
    time: 120,
    prerequisites: ['weapons_1'],
    unlocks: [],
    completed: false,
    progress: 0,
  },
  {
    id: 'ancient_weapons',
    name: 'Ancient Weapons',
    description: 'Reverse-engineered Ancient weapons. +100% damage, but high power consumption.',
    category: 'weapons',
    cost: { [ResourceType.AlienArtifact]: 3, [ResourceType.DarkMatter]: 2, [ResourceType.Exotic]: 15 },
    requiredData: 100,
    requiredSamples: 20,
    time: 600,
    prerequisites: ['weapons_2'],
    unlocks: [],
    completed: false,
    progress: 0,
  },

  // Shields
  {
    id: 'shields_1',
    name: 'Improved Shields',
    description: '+25% shield capacity and faster recharge.',
    category: 'shields',
    cost: { [ResourceType.Minerals]: 50, [ResourceType.TechSalvage]: 5 },
    requiredData: 10,
    requiredSamples: 0,
    time: 60,
    prerequisites: [],
    unlocks: ['shields_2'],
    completed: false,
    progress: 0,
  },
  {
    id: 'shields_2',
    name: 'Adaptive Shields',
    description: 'Shields adapt to damage type. +50% capacity, -20% damage taken.',
    category: 'shields',
    cost: { [ResourceType.Minerals]: 100, [ResourceType.Exotic]: 5, [ResourceType.TechSalvage]: 10 },
    requiredData: 25,
    requiredSamples: 5,
    time: 150,
    prerequisites: ['shields_1'],
    unlocks: [],
    completed: false,
    progress: 0,
  },

  // Scanning
  {
    id: 'scanning_1',
    name: 'Long-Range Sensors',
    description: '+30% sensor range and reveals 1 extra system per scan.',
    category: 'scanning',
    cost: { [ResourceType.Minerals]: 40, [ResourceType.TechSalvage]: 3 },
    requiredData: 10,
    requiredSamples: 0,
    time: 60,
    prerequisites: [],
    unlocks: ['scanning_2', 'advanced_probes'],
    completed: false,
    progress: 0,
  },
  {
    id: 'scanning_2',
    name: 'Anomaly Detection',
    description: 'Detects anomalies, ruins, and life from further away. +20% discovery chance.',
    category: 'scanning',
    cost: { [ResourceType.Minerals]: 80, [ResourceType.Exotic]: 3, [ResourceType.TechSalvage]: 8 },
    requiredData: 20,
    requiredSamples: 10,
    time: 120,
    prerequisites: ['scanning_1'],
    unlocks: ['deep_space_scanning'],
    completed: false,
    progress: 0,
  },
  {
    id: 'advanced_probes',
    name: 'Advanced Probes',
    description: 'Unlocks advanced probe crafting. Probes reveal 3 systems + anomalies.',
    category: 'scanning',
    cost: { [ResourceType.Minerals]: 60, [ResourceType.TechSalvage]: 5 },
    requiredData: 15,
    requiredSamples: 0,
    time: 90,
    prerequisites: ['scanning_1'],
    unlocks: [],
    completed: false,
    progress: 0,
  },
  {
    id: 'deep_space_scanning',
    name: 'Deep Space Scanning',
    description: 'Scan deep space POIs from 3x distance. Detect rogue planets, derelicts.',
    category: 'scanning',
    cost: { [ResourceType.Exotic]: 5, [ResourceType.TechSalvage]: 10 },
    requiredData: 35,
    requiredSamples: 15,
    time: 200,
    prerequisites: ['scanning_2'],
    unlocks: [],
    completed: false,
    progress: 0,
  },

  // Biology
  {
    id: 'biology_1',
    name: 'Xenobiology',
    description: 'Study alien life. +20% organic resource yield, unlocks life detection.',
    category: 'biology',
    cost: { [ResourceType.Organics]: 30, [ResourceType.Water]: 20 },
    requiredData: 10,
    requiredSamples: 10,
    time: 90,
    prerequisites: [],
    unlocks: ['biology_2'],
    completed: false,
    progress: 0,
  },
  {
    id: 'biology_2',
    name: 'Genetic Engineering',
    description: 'Create food from organics. +50% food production, crew health +10%.',
    category: 'biology',
    cost: { [ResourceType.Organics]: 50, [ResourceType.Exotic]: 3, [ResourceType.TechSalvage]: 5 },
    requiredData: 25,
    requiredSamples: 20,
    time: 150,
    prerequisites: ['biology_1'],
    unlocks: [],
    completed: false,
    progress: 0,
  },

  // Energy
  {
    id: 'energy_1',
    name: 'Efficient Reactor',
    description: '+20% power output, -15% heat generation.',
    category: 'energy',
    cost: { [ResourceType.Minerals]: 60, [ResourceType.TechSalvage]: 5 },
    requiredData: 10,
    requiredSamples: 0,
    time: 60,
    prerequisites: [],
    unlocks: ['energy_2'],
    completed: false,
    progress: 0,
  },
  {
    id: 'energy_2',
    name: 'Antimatter Reactor',
    description: '+100% power, but requires exotic fuel. Unlocks high-energy crafting.',
    category: 'energy',
    cost: { [ResourceType.Exotic]: 10, [ResourceType.TechSalvage]: 15, [ResourceType.DarkMatter]: 1 },
    requiredData: 40,
    requiredSamples: 10,
    time: 250,
    prerequisites: ['energy_1'],
    unlocks: [],
    completed: false,
    progress: 0,
  },

  // Ancient
  {
    id: 'alien_linguistics',
    name: 'Alien Linguistics',
    description: 'Decode Ancient language. Unlocks translator crafting and language puzzles.',
    category: 'ancient',
    cost: { [ResourceType.AlienArtifact]: 1, [ResourceType.TechSalvage]: 10 },
    requiredData: 30,
    requiredSamples: 5,
    time: 180,
    prerequisites: [],
    unlocks: ['ancient_tech'],
    completed: false,
    progress: 0,
  },
  {
    id: 'ancient_tech',
    name: 'Ancient Technology',
    description: 'Understand Ancient tech. +50% TechSalvage yield, unlocks Ancient modules.',
    category: 'ancient',
    cost: { [ResourceType.AlienArtifact]: 2, [ResourceType.Exotic]: 10, [ResourceType.DarkMatter]: 1 },
    requiredData: 60,
    requiredSamples: 15,
    time: 400,
    prerequisites: ['alien_linguistics'],
    unlocks: ['ancient_weapons'],
    completed: false,
    progress: 0,
  },
];

export class ResearchManager {
  nodes: Map<string, ResearchNode> = new Map();
  completed: Set<string> = new Set();
  inProgress: string | null = null;
  private progressTimer: number = 0;

  constructor() {
    for (const node of RESEARCH_TREE) {
      this.nodes.set(node.id, { ...node });
    }

    // Load save
    const saved = localStorage.getItem('aether_research');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.completed = new Set(data.completed || []);
        for (const id of this.completed) {
          const node = this.nodes.get(id);
          if (node) {
            node.completed = true;
            node.progress = 100;
          }
        }
        this.inProgress = data.inProgress || null;
        if (this.inProgress) {
          const node = this.nodes.get(this.inProgress);
          if (node) node.progress = data.progress || 0;
        }
      } catch {}
    }
  }

  save() {
    const inProgressNode = this.inProgress ? this.nodes.get(this.inProgress) : null;
    localStorage.setItem('aether_research', JSON.stringify({
      completed: Array.from(this.completed),
      inProgress: this.inProgress,
      progress: inProgressNode?.progress || 0,
    }));
  }

  canStartResearch(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;
    if (node.completed) return false;
    if (this.inProgress) return false;
    
    // Check prerequisites
    for (const prereq of node.prerequisites) {
      if (!this.completed.has(prereq)) return false;
    }
    
    return true;
  }

  canAfford(id: string, resources: Record<string, number>, data: number, samples: number): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;
    
    if (data < node.requiredData) return false;
    if (samples < node.requiredSamples) return false;
    
    for (const [res, amount] of Object.entries(node.cost)) {
      if ((resources[res] || 0) < (amount as number)) return false;
    }
    
    return true;
  }

  startResearch(id: string, resources: Record<string, number>): { success: boolean; message: string } {
    if (!this.canStartResearch(id)) {
      return { success: false, message: 'Cannot start research — prerequisites not met or already in progress' };
    }

    const node = this.nodes.get(id)!;
    
    // Deduct costs
    for (const [res, amount] of Object.entries(node.cost)) {
      resources[res] = (resources[res] || 0) - (amount as number);
    }

    this.inProgress = id;
    node.progress = 0;
    this.progressTimer = 0;
    this.save();

    return { success: true, message: `Started research: ${node.name}` };
  }

  update(delta: number): string | null {
    if (!this.inProgress) return null;
    
    const node = this.nodes.get(this.inProgress);
    if (!node) return null;

    this.progressTimer += delta / 1000; // delta in ms
    node.progress = Math.min(100, (this.progressTimer / node.time) * 100);

    if (node.progress >= 100) {
      node.completed = true;
      this.completed.add(this.inProgress);
      const completedId = this.inProgress;
      this.inProgress = null;
      this.progressTimer = 0;
      this.save();
      return completedId;
    }

    this.save();
    return null;
  }

  getAvailableNodes(): ResearchNode[] {
    return Array.from(this.nodes.values()).filter(node => 
      !node.completed && node.prerequisites.every(p => this.completed.has(p))
    );
  }

  getCompletedNodes(): ResearchNode[] {
    return Array.from(this.nodes.values()).filter(n => n.completed);
  }

  getNode(id: string): ResearchNode | undefined {
    return this.nodes.get(id);
  }

  getProgress(): { completed: number; total: number; percent: number } {
    const total = this.nodes.size;
    const completed = this.completed.size;
    return {
      completed,
      total,
      percent: (completed / total) * 100,
    };
  }

  toJSON() {
    const inProgressNode = this.inProgress ? this.nodes.get(this.inProgress) : null;
    return {
      completed: Array.from(this.completed),
      inProgress: this.inProgress,
      progress: inProgressNode?.progress || 0,
      progressTimer: this.progressTimer,
    };
  }

  static fromJSON(data: any): ResearchManager {
    const mgr = new ResearchManager();
    if (data) {
      mgr.completed = new Set(data.completed || []);
      for (const id of mgr.completed) {
        const node = mgr.nodes.get(id);
        if (node) {
          node.completed = true;
          node.progress = 100;
        }
      }
      mgr.inProgress = data.inProgress || null;
      (mgr as any).progressTimer = data.progressTimer || 0;
      if (mgr.inProgress) {
        const node = mgr.nodes.get(mgr.inProgress);
        if (node) node.progress = data.progress || 0;
      }
    }
    return mgr;
  }
}
