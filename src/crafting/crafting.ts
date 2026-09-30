/**
 * Crafting System v6 — Craft ship modules, drones, repair parts, probes, equipment, supplies
 * Data-driven recipes
 */

import { ResourceType, ModuleType, type CraftingRecipe } from '../core/types';

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'repair_kit',
    name: 'Repair Kit',
    description: 'Basic repair kit for modules. Restores 25% health.',
    category: 'repair',
    inputs: { [ResourceType.Minerals]: 20, [ResourceType.Supplies]: 5 },
    outputs: [{ type: 'resource', id: 'repair_kit', amount: 1 }],
    requiredLevel: 1,
  },
  {
    id: 'advanced_repair_kit',
    name: 'Advanced Repair Kit',
    description: 'Advanced repair kit. Restores 50% health + removes malfunctions.',
    category: 'repair',
    inputs: { [ResourceType.Minerals]: 40, [ResourceType.TechSalvage]: 2, [ResourceType.Supplies]: 10 },
    outputs: [{ type: 'resource', id: 'advanced_repair_kit', amount: 1 }],
    requiredModule: ModuleType.Workshop,
    requiredLevel: 3,
  },
  {
    id: 'scout_drone',
    name: 'Scout Drone',
    description: 'Light drone for long-range scanning. +100 sensor range for 1 scan.',
    category: 'drone',
    inputs: { [ResourceType.Minerals]: 30, [ResourceType.TechSalvage]: 3, [ResourceType.Exotic]: 1 },
    outputs: [{ type: 'drone', id: 'scout', amount: 1 }],
    requiredModule: ModuleType.DroneBay,
    requiredLevel: 2,
  },
  {
    id: 'combat_drone',
    name: 'Combat Drone',
    description: 'Combat drone. Assists in ship combat, +20 weapon power.',
    category: 'drone',
    inputs: { [ResourceType.Minerals]: 50, [ResourceType.TechSalvage]: 5, [ResourceType.Exotic]: 2 },
    outputs: [{ type: 'drone', id: 'combat', amount: 1 }],
    requiredModule: ModuleType.DroneBay,
    requiredLevel: 5,
    researchRequired: 'drone_combat',
  },
  {
    id: 'probe',
    name: 'Survey Probe',
    description: 'Probe for deep space scanning. Reveals 1 unknown system.',
    category: 'probe',
    inputs: { [ResourceType.Minerals]: 15, [ResourceType.TechSalvage]: 1 },
    outputs: [{ type: 'probe', id: 'survey', amount: 1 }],
    requiredModule: ModuleType.ScienceLab,
    requiredLevel: 1,
  },
  {
    id: 'advanced_probe',
    name: 'Advanced Probe',
    description: 'Advanced probe. Reveals 3 systems + anomalies.',
    category: 'probe',
    inputs: { [ResourceType.Minerals]: 30, [ResourceType.TechSalvage]: 3, [ResourceType.Exotic]: 1 },
    outputs: [{ type: 'probe', id: 'advanced', amount: 1 }],
    requiredModule: ModuleType.ScienceLab,
    requiredLevel: 4,
    researchRequired: 'advanced_probes',
  },
  {
    id: 'food_supplies',
    name: 'Food Supplies',
    description: 'Generate food from organics + water. +20 food.',
    category: 'supplies',
    inputs: { [ResourceType.Organics]: 10, [ResourceType.Water]: 10 },
    outputs: [{ type: 'resource', id: ResourceType.Food, amount: 20 }],
    requiredLevel: 1,
  },
  {
    id: 'ship_supplies',
    name: 'Ship Supplies',
    description: 'General supplies for crew. +20 supplies.',
    category: 'supplies',
    inputs: { [ResourceType.Minerals]: 10, [ResourceType.Organics]: 5 },
    outputs: [{ type: 'resource', id: ResourceType.Supplies, amount: 20 }],
    requiredLevel: 1,
  },
  {
    id: 'shield_booster',
    name: 'Shield Booster',
    description: 'Temporary shield boost. +100 shield for next combat.',
    category: 'equipment',
    inputs: { [ResourceType.Exotic]: 3, [ResourceType.TechSalvage]: 2, [ResourceType.Minerals]: 20 },
    outputs: [{ type: 'resource', id: 'shield_booster', amount: 1 }],
    requiredModule: ModuleType.ShieldCore,
    requiredLevel: 3,
  },
  {
    id: 'fuel_synthesizer',
    name: 'Synthesized Fuel',
    description: 'Create fuel from minerals + organics. +100 fuel.',
    category: 'supplies',
    inputs: { [ResourceType.Minerals]: 20, [ResourceType.Organics]: 10 },
    outputs: [{ type: 'resource', id: ResourceType.Fuel, amount: 100 }],
    requiredModule: ModuleType.Engine,
    requiredLevel: 2,
  },
  {
    id: 'alien_translator',
    name: 'Alien Translator',
    description: 'Device to decode alien language. Required for language puzzles.',
    category: 'equipment',
    inputs: { [ResourceType.TechSalvage]: 5, [ResourceType.AlienArtifact]: 1, [ResourceType.Exotic]: 3 },
    outputs: [{ type: 'resource', id: 'alien_translator', amount: 1 }],
    requiredModule: ModuleType.ScienceLab,
    requiredLevel: 6,
    researchRequired: 'alien_linguistics',
  },
  {
    id: 'wormhole_stabilizer',
    name: 'Wormhole Stabilizer',
    description: 'Stabilizes unstable wormhole for safe travel. Single use.',
    category: 'equipment',
    inputs: { [ResourceType.Exotic]: 5, [ResourceType.DarkMatter]: 1, [ResourceType.TechSalvage]: 5 },
    outputs: [{ type: 'resource', id: 'wormhole_stabilizer', amount: 1 }],
    requiredModule: ModuleType.Engine,
    requiredLevel: 8,
    researchRequired: 'wormhole_physics',
  },
];

export class CraftingManager {
  unlockedRecipes: Set<string> = new Set(['repair_kit', 'food_supplies', 'ship_supplies', 'probe', 'fuel_synthesizer']);
  private researchCompleted: Set<string> = new Set();

  constructor() {
    // Load from save if exists
    const saved = localStorage.getItem('aether_crafting');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.unlockedRecipes = new Set(data.unlocked || []);
        this.researchCompleted = new Set(data.research || []);
      } catch {}
    }
  }

  save() {
    localStorage.setItem('aether_crafting', JSON.stringify({
      unlocked: Array.from(this.unlockedRecipes),
      research: Array.from(this.researchCompleted),
    }));
  }

  getAvailableRecipes(playerLevel: number, modules: any[], researchIds: string[]): CraftingRecipe[] {
    return CRAFTING_RECIPES.filter(recipe => {
      if (recipe.requiredLevel > playerLevel) return false;
      if (recipe.requiredModule) {
        const hasModule = modules.some((m: any) => m.type === recipe.requiredModule && m.level >= 1);
        if (!hasModule) return false;
      }
      if (recipe.researchRequired && !researchIds.includes(recipe.researchRequired)) return false;
      return true;
    });
  }

  canCraft(recipeId: string, resources: Record<string, number>): boolean {
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    
    for (const [res, amount] of Object.entries(recipe.inputs)) {
      const have = resources[res] || 0;
      if (have < (amount as number)) return false;
    }
    return true;
  }

  craft(recipeId: string, resources: Record<string, number>): { success: boolean; message: string; outputs?: any[] } {
    const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { success: false, message: 'Recipe not found' };

    if (!this.canCraft(recipeId, resources)) {
      return { success: false, message: 'Insufficient resources' };
    }

    // Deduct inputs
    for (const [res, amount] of Object.entries(recipe.inputs)) {
      resources[res] = (resources[res] || 0) - (amount as number);
    }

    this.save();
    return {
      success: true,
      message: `Crafted ${recipe.name}`,
      outputs: recipe.outputs,
    };
  }

  unlockRecipe(recipeId: string) {
    this.unlockedRecipes.add(recipeId);
    this.save();
  }

  completeResearch(researchId: string) {
    this.researchCompleted.add(researchId);
    // Unlock recipes that require this research
    for (const recipe of CRAFTING_RECIPES) {
      if (recipe.researchRequired === researchId) {
        this.unlockedRecipes.add(recipe.id);
      }
    }
    this.save();
  }

  toJSON() {
    return {
      unlocked: Array.from(this.unlockedRecipes),
      research: Array.from(this.researchCompleted),
    };
  }

  static fromJSON(data: any): CraftingManager {
    const mgr = new CraftingManager();
    if (data) {
      mgr.unlockedRecipes = new Set(data.unlocked || ['repair_kit', 'food_supplies', 'ship_supplies', 'probe', 'fuel_synthesizer']);
      mgr.researchCompleted = new Set(data.research || []);
    }
    return mgr;
  }
}
