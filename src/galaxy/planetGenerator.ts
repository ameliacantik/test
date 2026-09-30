import { SeededRNG } from '../utils/seedRandom';
import { PlanetType, type PlanetData, type SystemId, ResourceType } from '../core/types';
import { PLANET_TYPES } from '../data/planetTypes';
import { RESOURCES } from '../data/resources';

const PLANET_NAMES = [
  'Acheron', 'Eidolon', 'Khepri', 'Tartarus', 'Lumen', 'Nyx', 'Orion Spur', 'Caladan',
  'Arrakis', 'LV', 'Kepler', 'Gliese', 'Trappist', 'Novus', 'Prime', 'Secundus', 'Tertius',
  'Mira', 'Vega', 'Solis', 'Luna', 'Cinder', 'Ash', 'Ember', 'Frost', 'Azure', 'Crimson',
  'Obsidian', 'Quartz', 'Echo', 'Whisper', 'Silence', 'Memory', 'Hope', 'Despair'
];

function pickPlanetType(rng: SeededRNG): PlanetType {
  const types = Object.values(PLANET_TYPES);
  const totalRarity = types.reduce((s, t) => s + t.rarity, 0);
  let r = rng.next() * totalRarity;
  for (const t of types) {
    r -= t.rarity;
    if (r <= 0) return t.type;
  }
  return PlanetType.Barren;
}

export function generatePlanet(rng: SeededRNG, systemId: SystemId, index: number, starTypeName: string): PlanetData {
  const type = pickPlanetType(rng);
  const def = PLANET_TYPES[type];

  const baseName = rng.pick(PLANET_NAMES);
  const suffix = rng.int(1, 999);
  const name = `${baseName} ${String.fromCharCode(65 + index)}-${suffix}`;

  const temp = rng.range(def.temp[0], def.temp[1]);
  const gravity = rng.range(def.gravity[0], def.gravity[1]);
  const atmosphere = rng.range(def.atmosphere[0], def.atmosphere[1]);
  const water = rng.range(def.water[0], def.water[1]);
  const mineralDensity = rng.range(def.mineral[0], def.mineral[1]);
  const organic = rng.range(def.organic[0], def.organic[1]);
  const radiation = rng.range(0, 1) * (type === 'radioactive' ? 0.8 : 0.3) + (starTypeName.includes('Neutron') ? 0.5 : 0);

  const hasLife = organic > 0.6 && water > 0.3 && atmosphere > 0.4 && type !== PlanetType.Radioactive && type !== PlanetType.Toxic;
  const hasRuins = rng.bool(type === PlanetType.Ancient ? 0.9 : type === PlanetType.Artificial ? 0.95 : type === PlanetType.Unknown ? 0.5 : 0.07);

  const resources: Partial<Record<ResourceType, number>> = {};
  if (mineralDensity > 0.3) resources[ResourceType.Minerals] = Math.floor(rng.range(20, 200) * mineralDensity);
  if (water > 0.3) resources[ResourceType.Water] = Math.floor(rng.range(10, 150) * water);
  if (organic > 0.3) resources[ResourceType.Organics] = Math.floor(rng.range(5, 80) * organic);
  if (rng.bool(mineralDensity * 0.2)) resources[ResourceType.Exotic] = Math.floor(rng.range(1, 15));
  if (rng.bool(0.05)) resources[ResourceType.TechSalvage] = Math.floor(rng.range(1, 5));
  if (rng.bool(0.3)) resources[ResourceType.Fuel] = Math.floor(rng.range(10, 100));
  // v6 new resources
  if (organic > 0.5 && rng.bool(0.4)) resources[ResourceType.Food] = Math.floor(rng.range(5, 50) * organic);
  if (rng.bool(0.2)) resources[ResourceType.Supplies] = Math.floor(rng.range(5, 30));
  if (hasRuins || type === PlanetType.Artificial || type === PlanetType.Ancient) {
    if (rng.bool(0.15)) resources[ResourceType.AlienArtifact] = Math.floor(rng.range(1, 3));
  }
  if (type === PlanetType.Unknown || rng.bool(0.02)) {
    resources[ResourceType.DarkMatter] = Math.floor(rng.range(1, 2));
  }

  // v6 weather
  const weatherTypes: PlanetData['weather'][] = ['clear', 'dust_storm', 'rain', 'snow', 'volcanic_ash', 'toxic_fog', 'crystal_shower', 'radiation_storm', 'aurora', 'meteor_shower'];
  let weather: PlanetData['weather'] = 'clear';
  if (type === PlanetType.Desert) weather = rng.pick(['clear', 'dust_storm', 'meteor_shower'] as any);
  else if (type === PlanetType.Ice) weather = rng.pick(['clear', 'snow', 'aurora'] as any);
  else if (type === PlanetType.Ocean) weather = rng.pick(['clear', 'rain', 'aurora'] as any);
  else if (type === PlanetType.Volcanic) weather = rng.pick(['volcanic_ash', 'meteor_shower', 'clear'] as any);
  else if (type === PlanetType.Toxic) weather = rng.pick(['toxic_fog', 'rain', 'clear'] as any);
  else if (type === PlanetType.Crystal) weather = rng.pick(['crystal_shower', 'clear', 'aurora'] as any);
  else if (type === PlanetType.Radioactive) weather = rng.pick(['radiation_storm', 'clear'] as any);
  else if (type === PlanetType.Forest) weather = rng.pick(['clear', 'rain', 'aurora'] as any);
  else if (type === PlanetType.EarthLike) weather = rng.pick(['clear', 'rain', 'aurora', 'meteor_shower'] as any);
  else if (type === PlanetType.Unknown) weather = rng.pick(weatherTypes);

  // v6 landing category
  let landingCategory: PlanetData['landingCategory'] = 'orbital';
  if (!def.landable || radiation > 0.8 || gravity > 2.5) landingCategory = 'flyby';
  else if (type === PlanetType.GasGiant || type === PlanetType.Unknown) landingCategory = 'orbital';
  else if (type === PlanetType.Ancient || type === PlanetType.Artificial || type === PlanetType.Forest || type === PlanetType.EarthLike) landingCategory = 'deep_expedition';
  else landingCategory = 'landing';

  // v6 moons
  const moons: PlanetData['moons'] = [];
  if (type !== PlanetType.GasGiant && type !== PlanetType.Unknown && rng.bool(0.4)) {
    const moonCount = rng.int(1, 3);
    for (let m = 0; m < moonCount; m++) {
      const moonRng = rng.fork(`moon-${m}`);
      const moonType = moonRng.pick([PlanetType.Barren, PlanetType.Ice, PlanetType.Desert, PlanetType.Crystal]) as PlanetType;
      const moonDef = PLANET_TYPES[moonType as keyof typeof PLANET_TYPES];
      if (!moonDef) continue;
      moons.push({
        id: `${systemId}-P${index}-M${m}`,
        name: `${name} ${String.fromCharCode(97 + m)}`,
        parentPlanetId: `${systemId}-P${index}`,
        radius: moonRng.range(2, 8),
        orbitRadius: moonRng.range(15, 40),
        type: moonType,
        attributes: {
          temperature: moonRng.range(moonDef.temp[0], moonDef.temp[1]),
          gravity: moonRng.range(0.1, 0.5),
          water: moonRng.range(0, 0.3),
          mineralDensity: moonRng.range(0.3, 0.9),
        },
        resources: {
          [ResourceType.Minerals]: Math.floor(moonRng.range(5, 50)),
          ...(moonRng.bool(0.1) ? { [ResourceType.Exotic]: 1 } : {}),
        },
        hasLife: false,
        hasRuins: moonRng.bool(0.05),
        description: `Moon of ${name}. ${moonDef.description}`,
      });
    }
  } else if (type === PlanetType.GasGiant) {
    // Gas giants have many moons
    const moonCount = rng.int(3, 8);
    for (let m = 0; m < moonCount; m++) {
      const moonRng = rng.fork(`moon-${m}`);
      const moonType = moonRng.pick([PlanetType.Barren, PlanetType.Ice, PlanetType.Desert, PlanetType.Ocean, PlanetType.Volcanic]) as PlanetType;
      const moonDef = PLANET_TYPES[moonType as keyof typeof PLANET_TYPES];
      if (!moonDef) continue;
      moons.push({
        id: `${systemId}-P${index}-M${m}`,
        name: `${name} ${String.fromCharCode(97 + m)}`,
        parentPlanetId: `${systemId}-P${index}`,
        radius: moonRng.range(3, 12),
        orbitRadius: moonRng.range(20, 60),
        type: moonType,
        attributes: {
          temperature: moonRng.range(moonDef.temp[0], moonDef.temp[1]),
          gravity: moonRng.range(0.1, 0.8),
          water: moonRng.range(0, 0.6),
          mineralDensity: moonRng.range(0.2, 0.8),
        },
        resources: {
          [ResourceType.Minerals]: Math.floor(moonRng.range(10, 80)),
          ...(moonRng.bool(0.2) ? { [ResourceType.Water]: Math.floor(moonRng.range(5, 30)) } : {}),
        },
        hasLife: moonRng.bool(moonType === PlanetType.Ocean || moonType === PlanetType.EarthLike ? 0.2 : 0.02),
        hasRuins: moonRng.bool(0.08),
        description: `Moon of gas giant ${name}. ${moonDef.description}`,
      });
    }
  }

  const descriptions = [
    `${def.description}`,
    `Orbital period: ${rng.int(80, 900)} days. Axial tilt: ${rng.range(0, 45).toFixed(1)}°.`,
    hasLife ? 'Biosignatures detected. Complex organic chemistry.' : 'No biosignatures. Sterile.',
    hasRuins ? 'Anomalous structures detected on surface. Non-natural geometry.' : '',
    moons.length ? `${moons.length} moon(s) detected.` : '',
    `Weather: ${weather}. Landing: ${landingCategory}.`,
  ].filter(Boolean).join(' ');

  return {
    id: `${systemId}-P${index}`,
    name,
    type,
    parentSystemId: systemId,
    orbitRadius: 50 + index * rng.range(35, 80) + rng.range(-10, 10),
    orbitAngle: rng.range(0, Math.PI * 2),
    radius: rng.range(8, 28),
    attributes: {
      temperature: temp,
      gravity,
      atmosphere,
      radiation: Math.min(1, radiation),
      water,
      mineralDensity,
      organicActivity: organic,
    },
    resources,
    discoveries: [],
    isLandable: def.landable && radiation < 0.8 && gravity < 2.5,
    hasLife,
    hasRuins,
    scanned: false,
    description: descriptions,
    moons,
    weather,
    landingCategory,
  };
}

export function generatePlanetsForSystem(rng: SeededRNG, systemId: SystemId, starType: string, count: number): PlanetData[] {
  const planets: PlanetData[] = [];
  for (let i = 0; i < count; i++) {
    const pRng = rng.fork(`planet-${i}`);
    planets.push(generatePlanet(pRng, systemId, i, starType));
  }
  return planets;
}
