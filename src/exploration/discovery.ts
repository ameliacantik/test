import { SeededRNG } from '../utils/seedRandom';
import { DiscoveryType, type DiscoveryData, type SystemId, type PlanetId } from '../core/types';

export function createDiscovery(
  rng: SeededRNG,
  type: DiscoveryType,
  systemId: SystemId,
  planetId?: PlanetId,
  custom?: Partial<DiscoveryData>
): DiscoveryData {
  const id = `DISC-${Date.now()}-${rng.int(1000, 9999)}`;
  const base: DiscoveryData = {
    id,
    name: custom?.name || `Unknown ${type}`,
    type,
    description: custom?.description || 'Anomalous reading. Requires further analysis.',
    location: { systemId, planetId },
    rarity: custom?.rarity || 'common',
    scientificValue: custom?.scientificValue || rng.int(5, 50),
    economicValue: custom?.economicValue || rng.int(10, 100),
    discoveredAt: Date.now(),
    data: custom?.data || {},
  };
  return base;
}

export const DISCOVERY_TEMPLATES = {
  newPlanet: (planetName: string, planetType: string) => ({
    name: `Planet Discovered: ${planetName}`,
    description: `First recorded observation of ${planetName}, a ${planetType} world. Preliminary scans indicate unique geological features.`,
    scientificValue: 25,
  }),
  newSystem: (systemName: string) => ({
    name: `Star System Charted: ${systemName}`,
    description: `Entered and surveyed ${systemName} for the first time. Stellar data and planetary bodies catalogued.`,
    scientificValue: 50,
  }),
  anomaly: (name: string) => ({
    name: `Anomaly: ${name}`,
    description: `Unclassified phenomenon detected. Energy signature does not match known natural processes.`,
    scientificValue: 75,
  }),
  ruins: (planetName: string) => ({
    name: `Alien Ruins on ${planetName}`,
    description: `Artificial structures detected. Architecture suggests non-human origin, estimated age 3,000-12,000 years. Purpose unknown.`,
    scientificValue: 150,
  }),
  life: (planetName: string) => ({
    name: `Biosignature: ${planetName}`,
    description: `Complex organic activity confirmed on ${planetName}. Potential new species. Requires Science Lab analysis.`,
    scientificValue: 100,
  }),
  exotic: () => ({
    name: `Exotic Matter Vein`,
    description: `Concentrated exotic matter detected. Valuable for FTL research and advanced modules.`,
    scientificValue: 60,
    economicValue: 200,
  }),
  signal: () => ({
    name: `Unknown Signal`,
    description: `Narrow-band transmission with mathematical structure. Prime numbers, then star coordinates. Origin: 400 light years beyond charted space.`,
    scientificValue: 200,
    rarity: 'rare',
  }),
};
