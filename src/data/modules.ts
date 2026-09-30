import { ModuleType, ResourceType } from '../core/types';

export interface ModuleDef {
  type: ModuleType;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  basePower: number;
  powerPerLevel: number;
  baseUpgradeCost: Partial<Record<ResourceType, number>>;
}

export const MODULE_DEFS: Record<ModuleType, ModuleDef> = {
  [ModuleType.Bridge]: {
    type: ModuleType.Bridge,
    name: 'Bridge',
    description: 'Command center. Crew coordination and navigation.',
    icon: '◉',
    maxLevel: 10,
    basePower: 20,
    powerPerLevel: 2,
    baseUpgradeCost: { [ResourceType.Minerals]: 50, [ResourceType.TechSalvage]: 10 }
  },
  [ModuleType.Engineering]: {
    type: ModuleType.Engineering,
    name: 'Engineering',
    description: 'Maintains all ship systems. Repair speed and efficiency.',
    icon: '🔧',
    maxLevel: 10,
    basePower: 15,
    powerPerLevel: 1.5,
    baseUpgradeCost: { [ResourceType.Minerals]: 60 }
  },
  [ModuleType.Reactor]: {
    type: ModuleType.Reactor,
    name: 'Fusion Reactor',
    description: 'Primary power source. Output increases with level.',
    icon: '☢',
    maxLevel: 10,
    basePower: -100, // generates power
    powerPerLevel: -15,
    baseUpgradeCost: { [ResourceType.Minerals]: 80, [ResourceType.Exotic]: 10 }
  },
  [ModuleType.ShieldCore]: {
    type: ModuleType.ShieldCore,
    name: 'Shield Core',
    description: 'Energy shield. Protects hull from impacts and radiation.',
    icon: '🛡',
    maxLevel: 10,
    basePower: 30,
    powerPerLevel: 3,
    baseUpgradeCost: { [ResourceType.Minerals]: 70, [ResourceType.Exotic]: 15 }
  },
  [ModuleType.Navigation]: {
    type: ModuleType.Navigation,
    name: 'Navigation',
    description: 'FTL calculations and route plotting. Range and accuracy.',
    icon: '🧭',
    maxLevel: 10,
    basePower: 25,
    powerPerLevel: 2,
    baseUpgradeCost: { [ResourceType.TechSalvage]: 20, [ResourceType.Minerals]: 40 }
  },
  [ModuleType.CargoBay]: {
    type: ModuleType.CargoBay,
    name: 'Cargo Bay',
    description: 'Storage for resources and salvage.',
    icon: '📦',
    maxLevel: 10,
    basePower: 10,
    powerPerLevel: 1,
    baseUpgradeCost: { [ResourceType.Minerals]: 50 }
  },
  [ModuleType.CrewQuarters]: {
    type: ModuleType.CrewQuarters,
    name: 'Crew Quarters',
    description: 'Living space. Morale and crew capacity.',
    icon: '🛏',
    maxLevel: 10,
    basePower: 15,
    powerPerLevel: 1,
    baseUpgradeCost: { [ResourceType.Minerals]: 40, [ResourceType.Organics]: 20 }
  },
  [ModuleType.MedicalBay]: {
    type: ModuleType.MedicalBay,
    name: 'Medical Bay',
    description: 'Crew health and biological research.',
    icon: '+',
    maxLevel: 10,
    basePower: 20,
    powerPerLevel: 1.5,
    baseUpgradeCost: { [ResourceType.Organics]: 30, [ResourceType.Minerals]: 30 }
  },
  [ModuleType.ScienceLab]: {
    type: ModuleType.ScienceLab,
    name: 'Science Lab',
    description: 'Analysis, research, discovery value multiplier.',
    icon: '🔬',
    maxLevel: 10,
    basePower: 35,
    powerPerLevel: 2.5,
    baseUpgradeCost: { [ResourceType.TechSalvage]: 25, [ResourceType.Minerals]: 50 }
  },
  [ModuleType.Workshop]: {
    type: ModuleType.Workshop,
    name: 'Workshop',
    description: 'Fabrication and repairs. Crafting efficiency.',
    icon: '⚒',
    maxLevel: 10,
    basePower: 20,
    powerPerLevel: 2,
    baseUpgradeCost: { [ResourceType.Minerals]: 60, [ResourceType.TechSalvage]: 10 }
  },
  [ModuleType.Hangar]: {
    type: ModuleType.Hangar,
    name: 'Shuttle Hangar',
    description: 'Planetary landing craft and EVA operations.',
    icon: '🚀',
    maxLevel: 10,
    basePower: 15,
    powerPerLevel: 1,
    baseUpgradeCost: { [ResourceType.Minerals]: 80 }
  },
  [ModuleType.DroneBay]: {
    type: ModuleType.DroneBay,
    name: 'Drone Bay',
    description: 'Automated probes and mining drones.',
    icon: '🤖',
    maxLevel: 10,
    basePower: 25,
    powerPerLevel: 2,
    baseUpgradeCost: { [ResourceType.TechSalvage]: 15, [ResourceType.Minerals]: 50 }
  },
  [ModuleType.CommRoom]: {
    type: ModuleType.CommRoom,
    name: 'Comms Array',
    description: 'Long-range communication and signal interception.',
    icon: '📡',
    maxLevel: 10,
    basePower: 30,
    powerPerLevel: 2,
    baseUpgradeCost: { [ResourceType.TechSalvage]: 20, [ResourceType.Minerals]: 30 }
  },
  [ModuleType.ObservationDeck]: {
    type: ModuleType.ObservationDeck,
    name: 'Observation Deck',
    description: 'Visual scanning and crew morale boost.',
    icon: '👁',
    maxLevel: 10,
    basePower: 5,
    powerPerLevel: 0.5,
    baseUpgradeCost: { [ResourceType.Minerals]: 30 }
  },
  [ModuleType.MiningModule]: {
    type: ModuleType.MiningModule,
    name: 'Mining Rig',
    description: 'Resource extraction from asteroids and planets.',
    icon: '⛏',
    maxLevel: 10,
    basePower: 40,
    powerPerLevel: 3,
    baseUpgradeCost: { [ResourceType.Minerals]: 70, [ResourceType.Fuel]: 20 }
  },
  [ModuleType.ResearchModule]: {
    type: ModuleType.ResearchModule,
    name: 'Research Module',
    description: 'Advanced analysis. Unlocks new technologies.',
    icon: '🧪',
    maxLevel: 10,
    basePower: 45,
    powerPerLevel: 3,
    baseUpgradeCost: { [ResourceType.TechSalvage]: 30, [ResourceType.Exotic]: 10 }
  },
  [ModuleType.LifeSupport]: {
    type: ModuleType.LifeSupport,
    name: 'Life Support',
    description: 'Oxygen, water recycling, environmental control.',
    icon: '♻',
    maxLevel: 10,
    basePower: 25,
    powerPerLevel: 1.5,
    baseUpgradeCost: { [ResourceType.Organics]: 25, [ResourceType.Minerals]: 35 }
  },
  [ModuleType.Engine]: {
    type: ModuleType.Engine,
    name: 'Impulse Engine',
    description: 'Sublight propulsion. Speed and fuel efficiency.',
    icon: '🔥',
    maxLevel: 10,
    basePower: 50,
    powerPerLevel: 4,
    baseUpgradeCost: { [ResourceType.Minerals]: 90, [ResourceType.Fuel]: 30 }
  },
  [ModuleType.SensorArray]: {
    type: ModuleType.SensorArray,
    name: 'Sensor Array',
    description: 'Long-range detection. Anomaly and life detection.',
    icon: '📶',
    maxLevel: 10,
    basePower: 35,
    powerPerLevel: 2.5,
    baseUpgradeCost: { [ResourceType.TechSalvage]: 25, [ResourceType.Exotic]: 5 }
  },
};
