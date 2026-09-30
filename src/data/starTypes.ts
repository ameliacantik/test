import { StarType } from '../core/types';

export interface StarTypeDef {
  type: StarType;
  name: string;
  color: string;
  tempRange: [number, number];
  luminosity: [number, number];
  rarity: number; // 0-1 weight
  danger: number; // 0-1
  description: string;
}

export const STAR_TYPES: Record<StarType, StarTypeDef> = {
  [StarType.RedDwarf]: {
    type: StarType.RedDwarf,
    name: 'Red Dwarf',
    color: '#ff6b4a',
    tempRange: [2300, 3800],
    luminosity: [0.01, 0.08],
    rarity: 0.35,
    danger: 0.1,
    description: 'Small, cool, long-lived stars. Most common in the galaxy.'
  },
  [StarType.YellowStar]: {
    type: StarType.YellowStar,
    name: 'Yellow Star',
    color: '#ffdd55',
    tempRange: [5200, 6000],
    luminosity: [0.8, 1.5],
    rarity: 0.2,
    danger: 0.15,
    description: 'Stable middle-aged stars like Sol. Often host habitable worlds.'
  },
  [StarType.BlueGiant]: {
    type: StarType.BlueGiant,
    name: 'Blue Giant',
    color: '#5aa0ff',
    tempRange: [10000, 30000],
    luminosity: [10, 1000],
    rarity: 0.05,
    danger: 0.6,
    description: 'Massive, hot, short-lived. Intense radiation, but rich exotic matter nearby.'
  },
  [StarType.WhiteDwarf]: {
    type: StarType.WhiteDwarf,
    name: 'White Dwarf',
    color: '#e0f0ff',
    tempRange: [5000, 40000],
    luminosity: [0.01, 1],
    rarity: 0.15,
    danger: 0.3,
    description: 'Remnant of a dead star. Dense, hot core surrounded by debris.'
  },
  [StarType.NeutronStar]: {
    type: StarType.NeutronStar,
    name: 'Neutron Star',
    color: '#9ef0ff',
    tempRange: [600000, 1000000],
    luminosity: [0.1, 10],
    rarity: 0.05,
    danger: 0.9,
    description: 'Ultra-dense pulsar. Extreme gravity and radiation. Navigation hazard.'
  },
  [StarType.BinaryStar]: {
    type: StarType.BinaryStar,
    name: 'Binary System',
    color: '#ffb86c',
    tempRange: [4000, 8000],
    luminosity: [1, 5],
    rarity: 0.12,
    danger: 0.4,
    description: 'Two stars orbiting each other. Complex gravitational dynamics.'
  },
  [StarType.BrownDwarf]: {
    type: StarType.BrownDwarf,
    name: 'Brown Dwarf',
    color: '#8a5a44',
    tempRange: [300, 2000],
    luminosity: [0.0001, 0.01],
    rarity: 0.07,
    danger: 0.05,
    description: 'Failed star, dim and cool. Often overlooked, but may hide secrets.'
  },
  [StarType.BlackHole]: {
    type: StarType.BlackHole,
    name: 'Black Hole',
    color: '#000000',
    tempRange: [0, 0],
    luminosity: [0, 0],
    rarity: 0.01,
    danger: 1.0,
    description: 'Singularity. Light cannot escape. Reality bends here. Do not approach lightly.'
  },
};
