import { PlanetType } from '../core/types';

export interface PlanetTypeDef {
  type: PlanetType;
  name: string;
  color: string;
  secondaryColor: string;
  atmosphere: [number, number];
  temp: [number, number];
  gravity: [number, number];
  water: [number, number];
  mineral: [number, number];
  organic: [number, number];
  landable: boolean;
  rarity: number;
  description: string;
}

export const PLANET_TYPES: Record<PlanetType, PlanetTypeDef> = {
  [PlanetType.Barren]: {
    type: PlanetType.Barren,
    name: 'Barren',
    color: '#8d8d8d',
    secondaryColor: '#5a5a5a',
    atmosphere: [0, 0.1],
    temp: [-100, 80],
    gravity: [0.3, 1.2],
    water: [0, 0.05],
    mineral: [0.5, 1],
    organic: [0, 0.05],
    landable: true,
    rarity: 0.25,
    description: 'Lifeless rock. Stripped by solar winds, but rich in surface minerals.'
  },
  [PlanetType.Desert]: {
    type: PlanetType.Desert,
    name: 'Desert',
    color: '#e6b87d',
    secondaryColor: '#c48a4a',
    atmosphere: [0.2, 0.6],
    temp: [20, 80],
    gravity: [0.5, 1.1],
    water: [0, 0.2],
    mineral: [0.3, 0.8],
    organic: [0.05, 0.3],
    landable: true,
    rarity: 0.15,
    description: 'Vast dunes and canyon systems. Traces of ancient waterways.'
  },
  [PlanetType.Ice]: {
    type: PlanetType.Ice,
    name: 'Ice World',
    color: '#aee4ff',
    secondaryColor: '#6fb7e0',
    atmosphere: [0.1, 0.5],
    temp: [-180, -10],
    gravity: [0.3, 0.9],
    water: [0.6, 1],
    mineral: [0.2, 0.6],
    organic: [0, 0.2],
    landable: true,
    rarity: 0.12,
    description: 'Frozen ocean world. Subsurface liquid water may harbor life.'
  },
  [PlanetType.Ocean]: {
    type: PlanetType.Ocean,
    name: 'Oceanic',
    color: '#1e90ff',
    secondaryColor: '#0a4a8a',
    atmosphere: [0.6, 1],
    temp: [0, 35],
    gravity: [0.8, 1.3],
    water: [0.8, 1],
    mineral: [0.1, 0.4],
    organic: [0.5, 1],
    landable: false,
    rarity: 0.08,
    description: 'Water world. No landmasses detected. Deep biosphere likely.'
  },
  [PlanetType.Volcanic]: {
    type: PlanetType.Volcanic,
    name: 'Volcanic',
    color: '#ff4d2e',
    secondaryColor: '#8a1a0a',
    atmosphere: [0.3, 0.8],
    temp: [200, 1200],
    gravity: [0.7, 1.5],
    water: [0, 0.1],
    mineral: [0.7, 1],
    organic: [0, 0.1],
    landable: true,
    rarity: 0.08,
    description: 'Tectonically active. Lava flows, mineral geysers. Extreme heat.'
  },
  [PlanetType.Toxic]: {
    type: PlanetType.Toxic,
    name: 'Toxic',
    color: '#7fff4d',
    secondaryColor: '#3a7a23',
    atmosphere: [0.7, 1],
    temp: [-20, 120],
    gravity: [0.6, 1.2],
    water: [0, 0.3],
    mineral: [0.4, 0.9],
    organic: [0.2, 0.6],
    landable: true,
    rarity: 0.07,
    description: 'Corrosive atmosphere. Chemical seas. Life here would be... different.'
  },
  [PlanetType.GasGiant]: {
    type: PlanetType.GasGiant,
    name: 'Gas Giant',
    color: '#d4a0ff',
    secondaryColor: '#7a4aa0',
    atmosphere: [1, 1],
    temp: [-150, -20],
    gravity: [2, 5],
    water: [0, 0.1],
    mineral: [0, 0.2],
    organic: [0, 0.1],
    landable: false,
    rarity: 0.15,
    description: 'Immense ball of gas. No solid surface. Moons may be interesting.'
  },
  [PlanetType.EarthLike]: {
    type: PlanetType.EarthLike,
    name: 'Earth-like',
    color: '#4ade80',
    secondaryColor: '#1e5a8a',
    atmosphere: [0.8, 1],
    temp: [0, 40],
    gravity: [0.8, 1.2],
    water: [0.4, 0.9],
    mineral: [0.3, 0.7],
    organic: [0.7, 1],
    landable: true,
    rarity: 0.03,
    description: 'Rare. Temperate, breathable atmosphere, liquid water, life. Precious.'
  },
  [PlanetType.Crystal]: {
    type: PlanetType.Crystal,
    name: 'Crystal',
    color: '#ff8ef5',
    secondaryColor: '#a020a0',
    atmosphere: [0.1, 0.4],
    temp: [-50, 200],
    gravity: [0.2, 0.8],
    water: [0, 0.2],
    mineral: [0.9, 1],
    organic: [0, 0.1],
    landable: true,
    rarity: 0.03,
    description: 'Entire surface crystallized. Resonates with unknown energy. High exotic value.'
  },
  [PlanetType.Ancient]: {
    type: PlanetType.Ancient,
    name: 'Ancient World',
    color: '#b8b8a0',
    secondaryColor: '#6a6a5a',
    atmosphere: [0.3, 0.7],
    temp: [-20, 60],
    gravity: [0.5, 1.1],
    water: [0.1, 0.5],
    mineral: [0.5, 0.9],
    organic: [0.1, 0.4],
    landable: true,
    rarity: 0.02,
    description: 'Artificial structures cover the surface. Who built them? Where did they go?'
  },
  [PlanetType.Radioactive]: {
    type: PlanetType.Radioactive,
    name: 'Radioactive',
    color: '#ccff00',
    secondaryColor: '#6a8a00',
    atmosphere: [0.2, 0.6],
    temp: [0, 300],
    gravity: [0.6, 1.4],
    water: [0, 0.1],
    mineral: [0.6, 1],
    organic: [0, 0.2],
    landable: true,
    rarity: 0.02,
    description: 'Irradiated wasteland. Reactor breach? Supernova proximity? Requires shielding.'
  },
  [PlanetType.Forest]: {
    type: PlanetType.Forest,
    name: 'Forest World',
    color: '#228B22',
    secondaryColor: '#145214',
    atmosphere: [0.7, 1],
    temp: [5, 35],
    gravity: [0.7, 1.1],
    water: [0.5, 0.9],
    mineral: [0.2, 0.5],
    organic: [0.8, 1],
    landable: true,
    rarity: 0.05,
    description: 'Dense forests covering continents. Towering trees, rich biodiversity, oxygen-rich. Home to complex ecosystems.'
  },
  [PlanetType.Artificial]: {
    type: PlanetType.Artificial,
    name: 'Artificial World',
    color: '#a0a0b0',
    secondaryColor: '#606070',
    atmosphere: [0.5, 0.9],
    temp: [-10, 40],
    gravity: [0.8, 1.2],
    water: [0.1, 0.4],
    mineral: [0.6, 0.9],
    organic: [0.1, 0.3],
    landable: true,
    rarity: 0.01,
    description: 'Entire planet is artificial. Dyson-like structure, metal crust, geometric patterns visible from orbit. Who built it?'
  },
  [PlanetType.Unknown]: {
    type: PlanetType.Unknown,
    name: 'Unknown',
    color: '#ff00ff',
    secondaryColor: '#800080',
    atmosphere: [0, 1],
    temp: [-200, 1000],
    gravity: [0.1, 3],
    water: [0, 1],
    mineral: [0, 1],
    organic: [0, 1],
    landable: false,
    rarity: 0.005,
    description: 'Sensors cannot classify. Readings are contradictory. Impossible geometry. Something is wrong with this planet.'
  },
  [PlanetType.Rogue]: {
    type: PlanetType.Rogue,
    name: 'Rogue Planet',
    color: '#1a1a2a',
    secondaryColor: '#0a0a14',
    atmosphere: [0, 0.2],
    temp: [-250, -50],
    gravity: [0.3, 1.0],
    water: [0, 0.3],
    mineral: [0.4, 0.8],
    organic: [0, 0.2],
    landable: true,
    rarity: 0.02,
    description: 'Planet without star. Drifting in void, cold, dark. Geothermal heat keeps subsurface ocean liquid. Lonely wanderer.'
  },
};
