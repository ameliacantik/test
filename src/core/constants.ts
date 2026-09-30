/**
 * Game balancing constants - data-driven tuning
 * v6: Combat, Crafting, Research, Wormhole, Moons, Forest/Artificial, Food/Supplies, Weather, Language
 */

export const GALAXY = {
  SEED: 'GALAXY-847291-AETHER',
  SECTOR_SIZE: 1000, // 1000 LY per sector
  SECTORS_X: 100, // 100x100 = 10k sectors, ~20k systems estimated, but streamed
  SECTORS_Y: 100,
  SYSTEMS_PER_SECTOR_MIN: 0, // Real space is mostly empty! 0-5
  SYSTEMS_PER_SECTOR_MAX: 5,
  GALAXY_RADIUS: 50000, // 50k LY radius like Milky Way
  CORE_RADIUS: 5000,
  ARM_COUNT: 4,
  STAR_DENSITY: 0.6,
  // For infinite galaxy, we generate on demand, not all at once
  INITIAL_SECTORS: 9, // 3x3 around start
  CACHE_SIZE: 150, // max sectors in memory
};

export const SHIP = {
  BASE_FUEL: 1000,
  BASE_FUEL_CAPACITY: 1200,
  FTL_FUEL_COST_PER_LY: 12,
  FTL_MIN_RANGE: 250,
  FTL_BASE_RANGE: 600,
  SUBLIGHT_SPEED: 80,
  HULL_MAX: 1000,
  SHIELD_MAX: 500,
  POWER_MAX: 1000,
  HEAT_DISSIPATION: 0.8,
  SCAN_RANGE_BASE: 500,
  // v4: Fuel scooping, emergency jump
  FUEL_SCOOP_RATE: 5,
  EMERGENCY_JUMP_FUEL_COST: 200,
  EMERGENCY_JUMP_RANGE: 300,
};

export const SCAN = {
  SYSTEM_SCAN_TIME: 3000,
  PLANET_SCAN_TIME: 5000,
  LONG_RANGE_SCAN_COST: 25,
  DISCOVERY_XP: 10,
  LONG_RANGE_RANGE_MULTIPLIER: 1.5,
  DEEP_SPACE_SCAN_RANGE: 2000,
};

export const RESOURCES = {
  FUEL_VALUE: 1,
  MINERAL_VALUE: 3,
  ORGANIC_VALUE: 5,
  EXOTIC_VALUE: 25,
  TECH_VALUE: 50,
  FOOD_VALUE: 4,
  SUPPLIES_VALUE: 3,
  ARTIFACT_VALUE: 100,
  DARK_MATTER_VALUE: 250,
};

export const TRAVEL = {
  SUBLIGHT_FUEL_PER_LY: 0.5,
  FTL_CHARGE_TIME: 10000, // ms
  FTL_COOLDOWN: 5000,
  MAX_JUMP_DISTANCE: 2000, // LY
  MIN_JUMP_DISTANCE: 50,
  WORMHOLE_FUEL_COST: 0,
  WORMHOLE_RISK_BASE: 0.1,
};

export const COMBAT = {
  BASE_WEAPON_DAMAGE: 50,
  SHIELD_REGEN_RATE: 0.02,
  ARMOR_REDUCTION: 0.3,
  ESCAPE_BASE_CHANCE: 0.3,
  NEGOTIATE_BASE_COST: 100,
};

export const CRAFTING = {
  BASE_CRAFT_TIME: 2000,
};

export const RESEARCH = {
  BASE_RESEARCH_SPEED: 1,
};

export const SAVE_KEY = 'aether_voyager_save_v1';
export const GALAXY_KEY = 'aether_voyager_galaxy_v1';
export const SAVE_VERSION = 6;
