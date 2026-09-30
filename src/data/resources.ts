import { ResourceType } from '../core/types';

export interface ResourceDef {
  type: ResourceType;
  name: string;
  color: string;
  value: number;
  rarity: number;
  description: string;
  icon: string;
}

export const RESOURCES: Record<ResourceType, ResourceDef> = {
  [ResourceType.Fuel]: {
    type: ResourceType.Fuel,
    name: 'Helium-3 Fuel',
    color: '#ffaa00',
    value: 1,
    rarity: 0.8,
    description: 'Primary FTL fuel. Refined from gas giants and nebulae.',
    icon: '⛽'
  },
  [ResourceType.Minerals]: {
    type: ResourceType.Minerals,
    name: 'Rare Minerals',
    color: '#a0a0a0',
    value: 3,
    rarity: 0.6,
    description: 'Construction materials, hull plating, components.',
    icon: '◈'
  },
  [ResourceType.Organics]: {
    type: ResourceType.Organics,
    name: 'Bio-Organics',
    color: '#4ade80',
    value: 5,
    rarity: 0.4,
    description: 'Organic compounds, medical supplies, life support.',
    icon: '🧬'
  },
  [ResourceType.Exotic]: {
    type: ResourceType.Exotic,
    name: 'Exotic Matter',
    color: '#d8b4fe',
    value: 25,
    rarity: 0.15,
    description: 'Strange matter with negative mass properties. FTL tech requires it.',
    icon: '✦'
  },
  [ResourceType.TechSalvage]: {
    type: ResourceType.TechSalvage,
    name: 'Tech Salvage',
    color: '#60a5fa',
    value: 50,
    rarity: 0.08,
    description: 'Recovered technology, ancient artifacts, research data.',
    icon: '⚙'
  },
  [ResourceType.Water]: {
    type: ResourceType.Water,
    name: 'Water Ice',
    color: '#7dd3fc',
    value: 2,
    rarity: 0.7,
    description: 'Essential for life support and fuel processing.',
    icon: '💧'
  },
  [ResourceType.Food]: {
    type: ResourceType.Food,
    name: 'Food Supplies',
    color: '#facc15',
    value: 4,
    rarity: 0.5,
    description: 'Nutrient packs for crew. Grown in hydroponics or synthesized from organics.',
    icon: '🍱'
  },
  [ResourceType.Supplies]: {
    type: ResourceType.Supplies,
    name: 'Ship Supplies',
    color: '#e5e7eb',
    value: 3,
    rarity: 0.6,
    description: 'General supplies: spare parts, tools, consumables for crew and ship.',
    icon: '📦'
  },
  [ResourceType.AlienArtifact]: {
    type: ResourceType.AlienArtifact,
    name: 'Alien Artifact',
    color: '#ff6b9d',
    value: 100,
    rarity: 0.03,
    description: 'Ancient alien artifact. Priceless for research and collectors. Origin unknown.',
    icon: '◬'
  },
  [ResourceType.DarkMatter]: {
    type: ResourceType.DarkMatter,
    name: 'Dark Matter',
    color: '#1a1a2e',
    value: 250,
    rarity: 0.01,
    description: 'Dark matter sample. Breaks known physics. Required for wormhole travel and ancient tech.',
    icon: '🌑'
  },
};
