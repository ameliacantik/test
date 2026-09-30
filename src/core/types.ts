import type { Vec2 } from '../utils/math';

export type SystemId = string;
export type PlanetId = string;
export type DiscoveryId = string;
export type ModuleId = string;
export type CrewId = string;
export type StationId = string;
export type QuestId = string;

export enum SystemDiscoveryState {
  Unknown = 'unknown',
  Detected = 'detected',
  Scanned = 'scanned',
  Visited = 'visited',
  Explored = 'explored',
  FullySurveyed = 'fully_surveyed',
}

export enum StarType {
  RedDwarf = 'red_dwarf',
  YellowStar = 'yellow_star',
  BlueGiant = 'blue_giant',
  WhiteDwarf = 'white_dwarf',
  NeutronStar = 'neutron_star',
  BinaryStar = 'binary_star',
  BrownDwarf = 'brown_dwarf',
  BlackHole = 'black_hole',
}

export enum PlanetType {
  Barren = 'barren',
  Desert = 'desert',
  Ice = 'ice',
  Ocean = 'ocean',
  Volcanic = 'volcanic',
  Toxic = 'toxic',
  GasGiant = 'gas_giant',
  EarthLike = 'earth_like',
  Crystal = 'crystal',
  Ancient = 'ancient',
  Radioactive = 'radioactive',
  Forest = 'forest',
  Artificial = 'artificial',
  Unknown = 'unknown',
  Rogue = 'rogue',
}

export enum ResourceType {
  Fuel = 'fuel',
  Minerals = 'minerals',
  Organics = 'organics',
  Exotic = 'exotic',
  TechSalvage = 'tech_salvage',
  Water = 'water',
  Food = 'food',
  Supplies = 'supplies',
  AlienArtifact = 'alien_artifact',
  DarkMatter = 'dark_matter',
}

export enum DiscoveryType {
  StarSystem = 'star_system',
  Planet = 'planet',
  Species = 'species',
  Mineral = 'mineral',
  Anomaly = 'anomaly',
  Structure = 'structure',
  Signal = 'signal',
  Technology = 'technology',
  Language = 'language',
  Wormhole = 'wormhole',
  Moon = 'moon',
}

export enum ModuleType {
  Bridge = 'bridge',
  Engineering = 'engineering',
  Reactor = 'reactor',
  ShieldCore = 'shield_core',
  Navigation = 'navigation',
  CargoBay = 'cargo_bay',
  CrewQuarters = 'crew_quarters',
  MedicalBay = 'medical_bay',
  ScienceLab = 'science_lab',
  Workshop = 'workshop',
  Hangar = 'hangar',
  DroneBay = 'drone_bay',
  CommRoom = 'comm_room',
  ObservationDeck = 'observation_deck',
  MiningModule = 'mining_module',
  ResearchModule = 'research_module',
  LifeSupport = 'life_support',
  Engine = 'engine',
  SensorArray = 'sensor_array',
}

export enum FactionId {
  HumanFederation = 'human_federation',
  IndependentTraders = 'independent_traders',
  MilitaryEmpire = 'military_empire',
  ScientificCoalition = 'scientific_coalition',
  Nomadic = 'nomadic',
  Ancient = 'ancient',
}

export enum CrewRole {
  Captain = 'captain',
  Pilot = 'pilot',
  Engineer = 'engineer',
  Scientist = 'scientist',
  Doctor = 'doctor',
  Navigator = 'navigator',
  Security = 'security',
  Trader = 'trader',
  Explorer = 'explorer',
  Technician = 'technician',
}

export enum QuestType {
  Exploration = 'exploration',
  Delivery = 'delivery',
  Research = 'research',
  Rescue = 'rescue',
  Combat = 'combat',
  Investigation = 'investigation',
  Trading = 'trading',
  Diplomacy = 'diplomacy',
  Survey = 'survey',
  Mystery = 'mystery',
}

export enum QuestStatus {
  Available = 'available',
  Active = 'active',
  Completed = 'completed',
  Failed = 'failed',
  Expired = 'expired',
}

export interface StarData {
  id: SystemId;
  name: string;
  position: Vec2;
  sector: Vec2;
  starType: StarType;
  starClass: string;
  temperature: number;
  luminosity: number;
  discoveryState: SystemDiscoveryState;
  planets: PlanetData[];
  anomalies: AnomalyData[];
  stations: StationData[];
  faction?: FactionId;
  dangerLevel: number; // 0-1
  resources: Partial<Record<ResourceType, number>>;
  discoveredAt?: number;
  scannedAt?: number;
  visitedAt?: number;
}

export interface MoonData {
  id: string;
  name: string;
  parentPlanetId: PlanetId;
  radius: number;
  orbitRadius: number;
  type: PlanetType;
  attributes: {
    temperature: number;
    gravity: number;
    water: number;
    mineralDensity: number;
  };
  resources: Partial<Record<ResourceType, number>>;
  hasLife: boolean;
  hasRuins: boolean;
  description: string;
}

export type WeatherType = 'clear' | 'dust_storm' | 'rain' | 'snow' | 'volcanic_ash' | 'toxic_fog' | 'crystal_shower' | 'radiation_storm' | 'aurora' | 'meteor_shower';

export interface PlanetData {
  id: PlanetId;
  name: string;
  type: PlanetType;
  parentSystemId: SystemId;
  orbitRadius: number;
  orbitAngle: number;
  radius: number;
  attributes: {
    temperature: number; // C
    gravity: number; // G
    atmosphere: number; // 0-1
    radiation: number; // 0-1
    water: number; // 0-1
    mineralDensity: number; // 0-1
    organicActivity: number; // 0-1
  };
  resources: Partial<Record<ResourceType, number>>;
  discoveries: DiscoveryId[];
  isLandable: boolean;
  hasLife: boolean;
  hasRuins: boolean;
  scanned: boolean;
  description: string;
  moons?: MoonData[];
  weather?: WeatherType;
  landingCategory?: 'flyby' | 'orbital' | 'landing' | 'deep_expedition';
}

export interface AnomalyData {
  id: string;
  type: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'unique';
  description: string;
}

export interface MarketItem {
  resource: ResourceType;
  buyPrice: number; // price station buys from player
  sellPrice: number; // price station sells to player
  supply: number; // 0-1, affects price
  demand: number; // 0-1
  stock: number;
}

export interface StationData {
  id: StationId;
  name: string;
  faction: FactionId;
  type: 'outpost' | 'station' | 'colony' | 'derelict' | 'gate';
  description?: string;
  market?: MarketItem[];
  services?: ('refuel' | 'repair' | 'trade' | 'missions' | 'upgrade')[];
  wealth?: number; // 0-1
  population?: number;
}

export interface DiscoveryData {
  id: DiscoveryId;
  name: string;
  type: DiscoveryType;
  description: string;
  location: { systemId: SystemId; planetId?: PlanetId };
  rarity: string;
  scientificValue: number;
  economicValue: number;
  discoveredAt: number;
  data?: any;
}

export interface ShipModule {
  id: ModuleId;
  type: ModuleType;
  name: string;
  level: number;
  maxLevel: number;
  powerConsumption: number;
  health: number; // 0-100
  efficiency: number; // 0-1+ based on level
  description: string;
  upgradeCost: Partial<Record<ResourceType, number>>;
}

export interface ShipState {
  name: string;
  position: Vec2;
  currentSystemId: SystemId | null;
  targetSystemId: SystemId | null;
  fuel: number;
  fuelCapacity: number;
  hull: number;
  hullMax: number;
  shield: number;
  shieldMax: number;
  power: number;
  powerMax: number;
  heat: number; // 0-100
  oxygen: number; // 0-100
  food: number; // 0-100
  supplies: number; // 0-100
  crewMorale: number; // 0-100
  cargoUsed: number;
  cargoCapacity: number;
  modules: ShipModule[];
  resources: Record<ResourceType, number>;
  sensorRange: number;
  ftlRange: number;
  ftlCharge: number; // 0-100
  // v6 combat
  weaponPower: number;
  armor: number;
  drones: number;
  probes: number;
}

// v6 Combat
export enum EnemyType {
  Pirate = 'pirate',
  Military = 'military',
  Alien = 'alien',
  Drone = 'drone',
  AncientMachine = 'ancient_machine',
  UnknownEntity = 'unknown_entity',
}

export interface CombatEncounter {
  id: string;
  enemyType: EnemyType;
  enemyName: string;
  enemyFaction?: FactionId;
  danger: number;
  enemyHull: number;
  enemyHullMax: number;
  enemyShield: number;
  enemyWeapon: number;
  rewards: {
    credits: number;
    resources?: Partial<Record<ResourceType, number>>;
    reputation?: Partial<Record<FactionId, number>>;
  };
  canNegotiate: boolean;
  canHack: boolean;
  description: string;
}

// v6 Crafting
export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  category: 'module' | 'drone' | 'probe' | 'repair' | 'equipment' | 'supplies';
  inputs: Partial<Record<ResourceType, number>>;
  outputs: {
    type: 'module' | 'resource' | 'drone' | 'probe';
    id: string;
    amount: number;
  }[];
  requiredModule?: ModuleType;
  requiredLevel: number;
  researchRequired?: string;
}

// v6 Research
export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  category: 'propulsion' | 'weapons' | 'shields' | 'scanning' | 'biology' | 'energy' | 'ancient';
  cost: Partial<Record<ResourceType, number>>;
  requiredData: number;
  requiredSamples: number;
  time: number; // seconds
  prerequisites: string[];
  unlocks: string[];
  completed: boolean;
  progress: number; // 0-100
}

// v6 Wormhole
export interface WormholeData {
  id: string;
  position: Vec2;
  linkedTo?: Vec2;
  linkedSystemId?: SystemId;
  stability: number; // 0-1
  type: 'stable' | 'unstable' | 'ancient_gate';
  discovered: boolean;
}

// v6 Alien Language
export interface AlienLanguagePuzzle {
  id: string;
  alienWord: string;
  humanTranslation?: string;
  symbols: string[];
  difficulty: number;
  solved: boolean;
  rewards: {
    codexEntry?: string;
    reputation?: Partial<Record<FactionId, number>>;
  };
}

export interface CrewMember {
  id: CrewId;
  name: string;
  role: CrewRole;
  level: number;
  xp: number;
  skills: {
    piloting: number;
    engineering: number;
    science: number;
    medical: number;
    combat: number;
    trading: number;
    exploration: number;
  };
  morale: number; // 0-100
  health: number; // 0-100
  traits: string[];
  personality: string;
  origin: string;
  loyalty: number; // 0-100
  salary: number; // credits per cycle
  status: 'active' | 'injured' | 'on_mission' | 'resting';
  bio: string;
}

export interface QuestData {
  id: QuestId;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  giver: {
    name: string;
    faction?: FactionId;
    stationId?: StationId;
  };
  objectives: {
    id: string;
    description: string;
    type: 'travel' | 'scan' | 'collect' | 'deliver' | 'investigate' | 'talk';
    targetSystemId?: SystemId;
    targetPlanetId?: PlanetId;
    resourceType?: ResourceType;
    resourceAmount?: number;
    completed: boolean;
  }[];
  rewards: {
    credits: number;
    resources?: Partial<Record<ResourceType, number>>;
    reputation?: Partial<Record<FactionId, number>>;
    discovery?: string;
  };
  timeLimit?: number; // timestamp
  createdAt: number;
  completedAt?: number;
  branchingChoices?: {
    id: string;
    label: string;
    description: string;
    consequences: string;
  }[];
  selectedChoice?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'unique';
}

export interface FactionState {
  id: FactionId;
  reputation: number; // -100 to 100
  attitude: 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'allied';
  knownSystems: SystemId[];
  tradeModifier: number; // price multiplier
  lastInteraction: number;
}

export interface GameState {
  version: number;
  galaxySeed: string;
  player: {
    name: string;
    credits: number;
    discoveries: number;
    systemsVisited: number;
    distanceTraveled: number;
    level: number;
    xp: number;
  };
  ship: ShipState;
  galaxy: {
    exploredSystems: SystemId[];
    scannedSystems: SystemId[];
    discoveredPlanets: PlanetId[];
  };
  discoveries: DiscoveryData[];
  codex: {
    unlockedEntries: string[];
  };
  codexData?: any;
  story?: any;
  worldMemory?: any;
  crew: CrewMember[];
  quests: {
    active: QuestData[];
    completed: QuestData[];
    available: QuestData[];
  };
  factions: Record<FactionId, FactionState>;
  time: {
    startTime: number;
    playTime: number;
    lastSave: number;
    day: number;
  };
  flags: Record<string, boolean>;
}

export interface FactionData {
  id: FactionId;
  name: string;
  description: string;
  color: string;
  reputation: number; // -100 to 100
  territory: Vec2[];
  ideology: string;
}

export type GameEventType =
  | 'SHIP_MOVED'
  | 'SYSTEM_ENTERED'
  | 'SYSTEM_SCANNED'
  | 'PLANET_SCANNED'
  | 'DISCOVERY_FOUND'
  | 'FUEL_LOW'
  | 'POWER_LOW'
  | 'HEAT_CRITICAL'
  | 'OXYGEN_LOW'
  | 'CARGO_FULL'
  | 'SHIELD_HIT'
  | 'HULL_DAMAGED'
  | 'MODULE_DAMAGED'
  | 'MODULE_REPAIRED'
  | 'MODULE_UPGRADED'
  | 'CREW_EVENT'
  | 'CREW_JOINED'
  | 'CREW_LEFT'
  | 'ANOMALY_DETECTED'
  | 'FACTION_ENCOUNTER'
  | 'FACTION_REP_CHANGED'
  | 'RESOURCE_COLLECTED'
  | 'RESOURCE_TRADED'
  | 'FTL_JUMP'
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETED'
  | 'QUEST_FAILED'
  | 'MISSION_AVAILABLE'
  | 'MARKET_UPDATE'
  | 'SAVE_GAME'
  | 'LOAD_GAME'
  | 'COMBAT_STARTED'
  | 'COMBAT_ENDED'
  | 'WORMHOLE_TRAVEL'
  | 'RESEARCH_COMPLETED'
  | 'CRAFTING_COMPLETED'
  | 'LANGUAGE_DECODED';

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: any;
}
