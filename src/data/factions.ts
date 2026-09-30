import { FactionId } from '../core/types';

export interface FactionDef {
  id: FactionId;
  name: string;
  shortName: string;
  color: string;
  description: string;
  ideology: string;
  traits: string[];
}

export const FACTIONS: Record<FactionId, FactionDef> = {
  [FactionId.HumanFederation]: {
    id: FactionId.HumanFederation,
    name: 'Human Federation',
    shortName: 'FED',
    color: '#4a90e2',
    description: 'Largest human government. Bureaucratic but stable. Controls core worlds.',
    ideology: 'Order & Expansion',
    traits: ['Diplomatic', 'Trade Focused', 'Large Territory']
  },
  [FactionId.IndependentTraders]: {
    id: FactionId.IndependentTraders,
    name: 'Independent Traders Guild',
    shortName: 'ITG',
    color: '#f5a623',
    description: 'Loose network of merchants and smugglers. They go where profit is.',
    ideology: 'Profit & Freedom',
    traits: ['Opportunistic', 'Well-Informed', 'Neutral']
  },
  [FactionId.MilitaryEmpire]: {
    id: FactionId.MilitaryEmpire,
    name: 'Helian Empire',
    shortName: 'HEL',
    color: '#d0021b',
    description: 'Militaristic successor state. Highly disciplined, territorial.',
    ideology: 'Strength & Discipline',
    traits: ['Aggressive', 'Advanced Weapons', 'Closed Borders']
  },
  [FactionId.ScientificCoalition]: {
    id: FactionId.ScientificCoalition,
    name: 'Scientific Coalition',
    shortName: 'SCI',
    color: '#7ed321',
    description: 'Researchers, explorers, and academics. Seek knowledge above all.',
    ideology: 'Knowledge & Discovery',
    traits: ['Curious', 'Technologically Advanced', 'Peaceful']
  },
  [FactionId.Nomadic]: {
    id: FactionId.Nomadic,
    name: 'Void Nomads',
    shortName: 'NOM',
    color: '#bd10e0',
    description: 'Generation ships wandering for centuries. Know secret routes.',
    ideology: 'Survival & Tradition',
    traits: ['Elusive', 'Survivors', 'Ancient Knowledge']
  },
  [FactionId.Ancient]: {
    id: FactionId.Ancient,
    name: '??? UNKNOWN ???',
    shortName: '???',
    color: '#00ffff',
    description: 'Signal pattern does not match any known civilization. Extremely old.',
    ideology: 'Unknown',
    traits: ['Incomprehensible', 'Technologically Godlike', 'Vanished']
  },
};
