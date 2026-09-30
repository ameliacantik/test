import { SeededRNG } from '../utils/seedRandom';
import { StarType, FactionId, SystemDiscoveryState, type StarData, ResourceType } from '../core/types';
import { STAR_TYPES } from '../data/starTypes';
import { generatePlanetsForSystem } from './planetGenerator';
import { generateMarket } from '../economy/market';
import type { Vec2 } from '../utils/math';

const SYSTEM_PREFIXES = [
  'Kepler', 'Gliese', 'Trappist', 'Eridanus', 'Cygnus', 'Lyra', 'Draco', 'Orion',
  'Vega', 'Altair', 'Sirius', 'Proxima', 'Ross', 'Luhman', 'Teegarden', 'Wolf',
  'Kapteyn', 'Lacaille', 'Groombridge', 'Kruger', 'Struve', 'Van Maanen', 'Luyten'
];

const SYSTEM_SUFFIXES = [
  'Prime', 'Minor', 'Major', 'Secundus', 'Tertius', 'Quartus', 'Quintus', 'Septus',
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota'
];

const STATION_NAMES = [
  'Port', 'Station', 'Outpost', 'Hub', 'Depot', 'Waypoint', 'Harbor', 'Anchor',
  'Gateway', 'Crossroads', 'Haven', 'Refuge', 'Bastion', 'Citadel', 'Spire'
];

const STATION_PREFIX = [
  'New', 'Old', 'Far', 'Deep', 'High', 'Low', 'Free', 'Independent',
  'Federation', 'Helian', 'Science', 'Trade', 'Void', 'Star', 'Hope'
];

function pickStarType(rng: SeededRNG): StarType {
  const types = Object.values(STAR_TYPES);
  const total = types.reduce((s, t) => s + t.rarity, 0);
  let r = rng.next() * total;
  for (const t of types) {
    r -= t.rarity;
    if (r <= 0) return t.type;
  }
  return StarType.RedDwarf;
}

export function generateStarSystem(rng: SeededRNG, id: string, position: Vec2, sector: Vec2, indexInSector: number): StarData {
  const starType = pickStarType(rng);
  const starDef = STAR_TYPES[starType];

  const prefix = rng.pick(SYSTEM_PREFIXES);
  const suffix = rng.pick(SYSTEM_SUFFIXES);
  const num = rng.int(100, 9999);
  const name = `${prefix} ${num} ${suffix}`;

  const temp = rng.range(starDef.tempRange[0], starDef.tempRange[1]);
  const lum = rng.range(starDef.luminosity[0], starDef.luminosity[1]);

  const planetCount = starType === StarType.BlackHole ? rng.int(0, 2)
    : starType === StarType.NeutronStar ? rng.int(0, 3)
    : starType === StarType.BlueGiant ? rng.int(1, 4)
    : rng.int(1, 8);

  const planets = generatePlanetsForSystem(rng.fork('planets'), id, starType, planetCount);

  // Faction assignment
  let faction: FactionId | undefined;
  const factionRoll = rng.next();
  if (factionRoll < 0.15) faction = FactionId.HumanFederation;
  else if (factionRoll < 0.25) faction = FactionId.IndependentTraders;
  else if (factionRoll < 0.30) faction = FactionId.MilitaryEmpire;
  else if (factionRoll < 0.35) faction = FactionId.ScientificCoalition;
  else if (factionRoll < 0.38) faction = FactionId.Nomadic;

  // Stations
  const stations = [];
  if (faction && rng.bool(0.6)) {
    const stationId = `${id}-ST0`;
    const stationName = `${rng.pick(STATION_PREFIX)} ${rng.pick(STATION_NAMES)} ${rng.int(10, 99)}`;
    const stationType = rng.pick(['outpost', 'station', 'colony', 'gate'] as const);
    const wealth = rng.range(0.2, 0.95);
    const population = stationType === 'colony' ? rng.int(1000, 50000) : stationType === 'station' ? rng.int(200, 5000) : rng.int(20, 500);

    const station: any = {
      id: stationId,
      name: stationName,
      faction,
      type: stationType,
      description: `${stationType} operated by ${faction}. ${stationType === 'colony' ? 'Large population center.' : stationType === 'station' ? 'Trading hub and refuel point.' : 'Small outpost, limited services.'}`,
      wealth,
      population,
      services: [] as any[],
    };

    // Services based on type
    if (stationType === 'colony') station.services = ['refuel', 'repair', 'trade', 'missions', 'upgrade'];
    else if (stationType === 'station') station.services = ['refuel', 'repair', 'trade', 'missions'];
    else if (stationType === 'outpost') station.services = ['refuel', 'trade'];
    else if (stationType === 'gate') station.services = ['refuel', 'repair'];

    // Market
    if (station.services.includes('trade')) {
      station.market = generateMarket(rng.fork(`market-${stationId}`), station);
    }

    stations.push(station);
  }
  if (rng.bool(0.08)) {
    const derelictId = `${id}-ST-DERELICT`;
    stations.push({
      id: derelictId,
      name: `Derelict ${rng.int(100, 999)}`,
      faction: FactionId.HumanFederation,
      type: 'derelict' as const,
      description: 'Abandoned vessel or station. Dark, cold. What happened here?',
      services: [],
      wealth: 0.1,
      population: 0,
    });
  }

  // Additional stations for high-value systems
  if (faction && rng.bool(0.2) && starType !== StarType.BlackHole && starType !== StarType.NeutronStar) {
    const extraId = `${id}-ST1`;
    const extraName = `${rng.pick(STATION_PREFIX)} ${rng.pick(STATION_NAMES)} ${rng.int(10, 99)}`;
    const extraType = rng.pick(['station', 'outpost'] as const);
    const extraStation: any = {
      id: extraId,
      name: extraName,
      faction,
      type: extraType,
      description: `Secondary ${extraType} in system.`,
      wealth: rng.range(0.3, 0.8),
      population: rng.int(50, 2000),
      services: ['refuel', 'trade'],
    };
    extraStation.market = generateMarket(rng.fork(`market-${extraId}`), extraStation);
    stations.push(extraStation);
  }

  // Anomalies
  const anomalies = [];
  const anomalyChance = starDef.danger * 0.5 + 0.1;
  if (rng.bool(anomalyChance)) {
    const anomalyTypes = ['Gravitational Anomaly', 'Energy Fluctuation', 'Unknown Signal', 'Temporal Distortion', 'Void Echo', 'Ancient Debris Field'];
    anomalies.push({
      id: `${id}-ANO-${indexInSector}`,
      type: rng.pick(anomalyTypes),
      name: rng.pick(anomalyTypes),
      rarity: rng.bool(0.1) ? 'rare' : rng.bool(0.3) ? 'uncommon' : 'common' as any,
      description: 'Unidentified phenomenon. Requires close scan.'
    });
  }

  // Resources at system level (asteroids)
  const resources: Partial<Record<ResourceType, number>> = {};
  if (rng.bool(0.5)) resources[ResourceType.Minerals] = rng.int(50, 500);
  if (rng.bool(0.3)) resources[ResourceType.Fuel] = rng.int(20, 300);
  if (rng.bool(0.1)) resources[ResourceType.Exotic] = rng.int(1, 20);

  // Discovery state - all unknown initially except starting system
  const discoveryState = SystemDiscoveryState.Unknown;

  return {
    id,
    name,
    position,
    sector,
    starType,
    starClass: `${starDef.name} (${starDef.type})`,
    temperature: temp,
    luminosity: lum,
    discoveryState,
    planets,
    anomalies,
    stations,
    faction,
    dangerLevel: Math.max(0, Math.min(1, starDef.danger + rng.range(-0.1, 0.2))),
    resources,
  };
}
