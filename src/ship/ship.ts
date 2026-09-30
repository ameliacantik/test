import { SeededRNG } from '../utils/seedRandom';
import { SHIP } from '../core/constants';
import { ModuleType, ResourceType, type ShipModule, type ShipState } from '../core/types';
import { MODULE_DEFS } from '../data/modules';
import { eventBus } from '../core/eventBus';

function createInitialModules(): ShipModule[] {
  const types: ModuleType[] = [
    ModuleType.Bridge,
    ModuleType.Engineering,
    ModuleType.Reactor,
    ModuleType.ShieldCore,
    ModuleType.Navigation,
    ModuleType.CargoBay,
    ModuleType.CrewQuarters,
    ModuleType.ScienceLab,
    ModuleType.LifeSupport,
    ModuleType.Engine,
    ModuleType.SensorArray,
    ModuleType.MiningModule,
    ModuleType.MedicalBay,
    ModuleType.CommRoom,
    ModuleType.ObservationDeck,
  ];

  return types.map((type, idx) => {
    const def = MODULE_DEFS[type];
    return {
      id: `MOD-${idx}-${type}`,
      type,
      name: def.name,
      level: type === ModuleType.Reactor ? 2 : type === ModuleType.Engine ? 2 : 1,
      maxLevel: def.maxLevel,
      powerConsumption: def.basePower,
      health: 92 + Math.random() * 8, // Lived-in, not perfect 100%
      efficiency: 0.95 + Math.random() * 0.1,
      description: def.description,
      upgradeCost: def.baseUpgradeCost,
    };
  });
}

export function createInitialShip(rng: SeededRNG, startingPos: { x: number; y: number }, startingSystemId: string): ShipState {
  const modules = createInitialModules();

  const reactorLevel = modules.find(m => m.type === ModuleType.Reactor)?.level || 1;
  const cargoLevel = modules.find(m => m.type === ModuleType.CargoBay)?.level || 1;
  const sensorLevel = modules.find(m => m.type === ModuleType.SensorArray)?.level || 1;
  const navLevel = modules.find(m => m.type === ModuleType.Navigation)?.level || 1;
  const engineLevel = modules.find(m => m.type === ModuleType.Engine)?.level || 1;

  return {
    name: 'AETHER-01  "Voyager"',
    position: { ...startingPos },
    currentSystemId: startingSystemId,
    targetSystemId: null,
    fuel: SHIP.BASE_FUEL,
    fuelCapacity: SHIP.BASE_FUEL_CAPACITY + cargoLevel * 50,
    hull: SHIP.HULL_MAX * 0.96, // Slight wear
    hullMax: SHIP.HULL_MAX,
    shield: SHIP.SHIELD_MAX,
    shieldMax: SHIP.SHIELD_MAX,
    power: 820,
    powerMax: SHIP.POWER_MAX + reactorLevel * 100,
    heat: 18,
    oxygen: 98,
    food: 100,
    supplies: 100,
    crewMorale: 84,
    cargoUsed: 0,
    cargoCapacity: 500 + cargoLevel * 150,
    modules,
    resources: {
      [ResourceType.Fuel]: 800,
      [ResourceType.Minerals]: 120,
      [ResourceType.Organics]: 40,
      [ResourceType.Exotic]: 5,
      [ResourceType.TechSalvage]: 3,
      [ResourceType.Water]: 100,
      [ResourceType.Food]: 80,
      [ResourceType.Supplies]: 60,
      [ResourceType.AlienArtifact]: 0,
      [ResourceType.DarkMatter]: 0,
    },
    sensorRange: SHIP.SCAN_RANGE_BASE + sensorLevel * 150,
    ftlRange: SHIP.FTL_BASE_RANGE + navLevel * 100 + engineLevel * 50,
    ftlCharge: 100,
    weaponPower: 50 + engineLevel * 10,
    armor: 30 + cargoLevel * 5,
    drones: 2,
    probes: 5,
  };
}

export class ShipManager {
  state: ShipState;
  private powerHistory: number[] = [];
  private heatHistory: number[] = [];

  constructor(state: ShipState) {
    this.state = state;
  }

  // Recalculate derived stats — interconnected, not isolated
  recalc() {
    const reactor = this.state.modules.find(m => m.type === ModuleType.Reactor);
    const cargo = this.state.modules.find(m => m.type === ModuleType.CargoBay);
    const sensor = this.state.modules.find(m => m.type === ModuleType.SensorArray);
    const nav = this.state.modules.find(m => m.type === ModuleType.Navigation);
    const engine = this.state.modules.find(m => m.type === ModuleType.Engine);
    const shield = this.state.modules.find(m => m.type === ModuleType.ShieldCore);
    const lifeSupport = this.state.modules.find(m => m.type === ModuleType.LifeSupport);
    const bridge = this.state.modules.find(m => m.type === ModuleType.Bridge);

    // Power Max — reactor level + health affects output
    const reactorHealthFactor = (reactor?.health || 100) / 100;
    const reactorEff = (reactor?.efficiency || 1) * reactorHealthFactor;
    this.state.powerMax = (SHIP.POWER_MAX + (reactor?.level || 1) * 120) * reactorEff;

    // Cargo — bay level + hull integrity (damaged hull = less capacity)
    const hullFactor = this.state.hull / this.state.hullMax;
    this.state.cargoCapacity = (500 + (cargo?.level || 1) * 180) * (0.7 + hullFactor * 0.3);

    // Sensor — array level * bridge efficiency * power availability
    const bridgeEff = (bridge?.efficiency || 1) * ((bridge?.health || 100) / 100);
    this.state.sensorRange = (SHIP.SCAN_RANGE_BASE + (sensor?.level || 1) * 180) * bridgeEff * (0.8 + reactorEff * 0.2);

    // FTL — nav + engine + reactor + power
    const navEff = (nav?.efficiency || 1) * ((nav?.health || 100) / 100);
    const engineEff = (engine?.efficiency || 1) * ((engine?.health || 100) / 100);
    this.state.ftlRange = (SHIP.FTL_BASE_RANGE + (nav?.level || 1) * 120 + (engine?.level || 1) * 60) * navEff * engineEff * (0.6 + reactorEff * 0.4);

    // Shield — shield core + reactor power + heat penalty
    const shieldEff = (shield?.efficiency || 1) * ((shield?.health || 100) / 100);
    const heatPenalty = Math.max(0, (this.state.heat - 70) / 30); // heat >70 reduces shield
    this.state.shieldMax = (SHIP.SHIELD_MAX + (shield?.level || 1) * 80) * shieldEff * (1 - heatPenalty * 0.3);

    // Hull max — cargo + engineering
    const eng = this.state.modules.find(m => m.type === ModuleType.Engineering);
    const engEff = (eng?.efficiency || 1) * ((eng?.health || 100) / 100);
    this.state.hullMax = (SHIP.HULL_MAX + (cargo?.level || 1) * 20 + (eng?.level || 1) * 15) * (0.9 + engEff * 0.1);

    // Power consumption — each module consumes based on level, health, efficiency
    let totalPowerConsumption = 0;
    let criticalModulesOffline = 0;
    for (const mod of this.state.modules) {
      const def = MODULE_DEFS[mod.type];
      if (def.basePower < 0) continue; // reactor generates
      const healthFactor = mod.health / 100;
      const effFactor = mod.efficiency;
      // Damaged modules consume more power (inefficient) or less if offline
      let consumption: number;
      if (mod.health < 20) {
        consumption = 0; // offline if critical damage
        criticalModulesOffline++;
      } else if (mod.health < 50) {
        consumption = (def.basePower + (mod.level - 1) * def.powerPerLevel) * (1.5 - healthFactor) * effFactor;
      } else {
        consumption = (def.basePower + (mod.level - 1) * def.powerPerLevel) * effFactor * healthFactor;
      }
      totalPowerConsumption += consumption;
    }

    // Reactor generation — affected by heat, fuel, health
    const fuelFactor = this.state.fuel / this.state.fuelCapacity;
    const heatGenPenalty = this.state.heat > 80 ? 0.7 : this.state.heat > 60 ? 0.85 : 1.0;
    const reactorGen = reactor ? (Math.abs(MODULE_DEFS[ModuleType.Reactor].basePower) + (reactor.level - 1) * 18) * reactorEff * heatGenPenalty * (0.7 + fuelFactor * 0.3) : 100;
    this.state.power = Math.max(0, reactorGen * 10 - totalPowerConsumption);

    // Power history for UI trend
    this.powerHistory.push(this.state.power);
    if (this.powerHistory.length > 20) this.powerHistory.shift();

    // Heat — from power usage + reactor + engine + shield + damaged modules
    const powerUsageRatio = totalPowerConsumption / Math.max(1, this.state.powerMax);
    let heatGen = powerUsageRatio * 45;
    heatGen += (engine?.level || 1) * 2;
    heatGen += (this.state.shield / this.state.shieldMax) * 8;
    // Damaged modules generate extra heat
    for (const mod of this.state.modules) {
      if (mod.health < 60) heatGen += (60 - mod.health) * 0.08;
    }
    // Life support cooling
    const lifeEff = (lifeSupport?.efficiency || 1) * ((lifeSupport?.health || 100) / 100);
    const cooling = 12 * lifeEff + (this.state.power > 300 ? 8 : 0);
    this.state.heat = Math.min(100, Math.max(0, this.state.heat * 0.92 + heatGen * 0.08 - cooling * 0.05));

    this.heatHistory.push(this.state.heat);
    if (this.heatHistory.length > 20) this.heatHistory.shift();

    // Cargo used — realistic weight
    let used = 0;
    for (const [res, amt] of Object.entries(this.state.resources)) {
      const weight = res === ResourceType.Minerals ? 1.1 : res === ResourceType.Fuel ? 0.6 : res === ResourceType.Water ? 1.0 : res === ResourceType.Food ? 0.9 : 0.75;
      used += amt * weight;
    }
    this.state.cargoUsed = used;

    // Morale affected by power, heat, critical modules
    if (criticalModulesOffline > 0) {
      this.state.crewMorale = Math.max(0, this.state.crewMorale - criticalModulesOffline * 0.08);
    }
    if (this.state.power < 100) {
      this.state.crewMorale = Math.max(0, this.state.crewMorale - 0.05);
    }
    if (this.state.heat > 85) {
      this.state.crewMorale = Math.max(0, this.state.crewMorale - 0.1);
    }

    // Events for critical states
    if (this.state.power < 50 && Math.random() < 0.02) {
      eventBus.emit('POWER_LOW', { power: this.state.power });
    }
    if (this.state.heat > 90 && Math.random() < 0.03) {
      eventBus.emit('HEAT_CRITICAL', { heat: this.state.heat });
    }
    if (this.state.oxygen < 30 && Math.random() < 0.02) {
      eventBus.emit('OXYGEN_LOW', { oxygen: this.state.oxygen });
    }
  }

  consumeFuel(amount: number): boolean {
    if (this.state.fuel < amount) {
      eventBus.emit('FUEL_LOW', { fuel: this.state.fuel, required: amount });
      return false;
    }
    this.state.fuel -= amount;
    this.state.resources[ResourceType.Fuel] = Math.max(0, (this.state.resources[ResourceType.Fuel] || 0) - amount * 0.12);
    // Fuel consumption increases heat slightly
    this.state.heat = Math.min(100, this.state.heat + amount * 0.02);
    return true;
  }

  addResource(type: ResourceType, amount: number): boolean {
    const current = this.state.resources[type] || 0;
    const weight = type === ResourceType.Minerals ? 1.1 : type === ResourceType.Fuel ? 0.6 : 0.8;
    const projectedUsed = this.state.cargoUsed + amount * weight;
    if (projectedUsed > this.state.cargoCapacity) {
      eventBus.emit('CARGO_FULL', { type, amount, capacity: this.state.cargoCapacity });
      return false;
    }
    this.state.resources[type] = current + amount;
    this.recalc();
    eventBus.emit('RESOURCE_COLLECTED', { type, amount });
    return true;
  }

  damageHull(amount: number, source: string = 'unknown') {
    // Shield absorbs first — but shield efficiency affected by power and heat
    const shieldEff = this.state.shield / this.state.shieldMax;
    const powerFactor = Math.min(1, this.state.power / 300);
    let shieldAbsorbRatio = 0.65 * shieldEff * powerFactor;
    if (this.state.heat > 75) shieldAbsorbRatio *= 0.7; // heat reduces shield efficiency

    if (this.state.shield > 0) {
      const shieldAbsorb = Math.min(this.state.shield, amount * shieldAbsorbRatio);
      this.state.shield -= shieldAbsorb;
      amount -= shieldAbsorb;
      eventBus.emit('SHIELD_HIT', { absorbed: shieldAbsorb, remaining: this.state.shield });
    }

    if (amount > 0) {
      this.state.hull = Math.max(0, this.state.hull - amount);
      eventBus.emit('HULL_DAMAGED', { amount, hull: this.state.hull, source });

      // Chance to damage modules — weighted by proximity to hull breach
      if (amount > 15) {
        const damageChance = Math.min(0.7, amount / 80);
        if (Math.random() < damageChance) {
          // Prefer damaging modules that are critical or already damaged
          const candidates = [...this.state.modules].sort((a, b) => a.health - b.health);
          const mod = candidates[Math.floor(Math.random() * Math.min(5, candidates.length))];
          const modDamage = amount * (0.15 + Math.random() * 0.15);
          mod.health = Math.max(0, mod.health - modDamage);
          mod.efficiency = Math.max(0.4, mod.efficiency - modDamage * 0.005);
          eventBus.emit('MODULE_DAMAGED', { module: mod, amount: modDamage, source });
        }
      }

      // Hull damage increases heat from friction/breach
      this.state.heat = Math.min(100, this.state.heat + amount * 0.08);
    }

    this.recalc();
  }

  repairModule(moduleId: string, amount: number): boolean {
    const mod = this.state.modules.find(m => m.id === moduleId);
    if (!mod) return false;
    const needed = 100 - mod.health;
    if (needed <= 0) return false;

    const costMinerals = Math.ceil(needed * 0.45);
    const costSupplies = Math.ceil(needed * 0.15);
    if ((this.state.resources[ResourceType.Minerals] || 0) < costMinerals * 0.12) return false;
    if ((this.state.resources[ResourceType.Supplies] || 0) < costSupplies * 0.1) return false;

    mod.health = Math.min(100, mod.health + amount);
    // Repair also restores some efficiency, but not fully — needs workshop
    mod.efficiency = Math.min(1, mod.efficiency + amount * 0.003);

    this.state.resources[ResourceType.Minerals] = (this.state.resources[ResourceType.Minerals] || 0) - costMinerals * 0.12;
    this.state.resources[ResourceType.Supplies] = (this.state.resources[ResourceType.Supplies] || 0) - costSupplies * 0.1;

    // Repair generates heat
    this.state.heat = Math.min(100, this.state.heat + 2);

    this.recalc();
    eventBus.emit('MODULE_REPAIRED', { module: mod, amount });
    return true;
  }

  upgradeModule(moduleId: string): boolean {
    const mod = this.state.modules.find(m => m.id === moduleId);
    if (!mod) return false;
    if (mod.level >= mod.maxLevel) return false;

    const def = MODULE_DEFS[mod.type];
    const nextLevel = mod.level + 1;

    // Check resources
    for (const [res, baseCost] of Object.entries(def.baseUpgradeCost)) {
      const cost = Math.ceil(baseCost * Math.pow(1.55, nextLevel - 1));
      const have = this.state.resources[res as ResourceType] || 0;
      if (have < cost) return false;
    }

    // Check if workshop required and health
    if (mod.health < 70) return false; // need to repair first

    // Deduct
    for (const [res, baseCost] of Object.entries(def.baseUpgradeCost)) {
      const cost = Math.ceil(baseCost * Math.pow(1.55, nextLevel - 1));
      this.state.resources[res as ResourceType]! -= cost;
    }

    mod.level = nextLevel;
    mod.efficiency = Math.min(1.2, 0.9 + nextLevel * 0.08 + Math.random() * 0.05);
    mod.powerConsumption = def.basePower + (nextLevel - 1) * def.powerPerLevel;
    mod.health = Math.min(100, mod.health + 10); // upgrade also repairs slightly

    this.recalc();
    eventBus.emit('MODULE_UPGRADED', { module: mod, level: nextLevel });
    return true;
  }

  getModule(type: ModuleType): ShipModule | undefined {
    return this.state.modules.find(m => m.type === type);
  }

  getPowerTrend(): 'rising' | 'falling' | 'stable' {
    if (this.powerHistory.length < 5) return 'stable';
    const recent = this.powerHistory.slice(-5);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = this.powerHistory.slice(-10, -5);
    const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
    if (avgRecent > avgOlder + 20) return 'rising';
    if (avgRecent < avgOlder - 20) return 'falling';
    return 'stable';
  }

  getHeatTrend(): 'rising' | 'falling' | 'stable' {
    if (this.heatHistory.length < 5) return 'stable';
    const recent = this.heatHistory.slice(-5);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
    const older = this.heatHistory.slice(-10, -5);
    const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
    if (avgRecent > avgOlder + 3) return 'rising';
    if (avgRecent < avgOlder - 3) return 'falling';
    return 'stable';
  }

  update(delta: number) {
    const dt = delta * 0.001;

    // Shield regen — needs power, low heat, healthy shield core
    const shieldMod = this.state.modules.find(m => m.type === ModuleType.ShieldCore);
    const shieldHealth = (shieldMod?.health || 100) / 100;
    if (this.state.power > 250 && this.state.shield < this.state.shieldMax && shieldHealth > 0.3 && this.state.heat < 80) {
      const regenRate = 0.025 * shieldHealth * (this.state.power / 500) * (1 - this.state.heat / 150);
      this.state.shield = Math.min(this.state.shieldMax, this.state.shield + delta * regenRate);
    }

    // Heat dissipation — life support + power availability
    const lifeSupport = this.state.modules.find(m => m.type === ModuleType.LifeSupport);
    const lifeHealth = (lifeSupport?.health || 100) / 100;
    const dissipation = (0.015 + lifeHealth * 0.02 + (this.state.power > 400 ? 0.01 : 0)) * (1 - this.state.heat / 200);
    this.state.heat = Math.max(0, this.state.heat - delta * dissipation);
    // Heat affects power max slightly
    if (this.state.heat > 85) {
      this.state.powerMax *= 0.995;
    }

    // Oxygen — consumption based on crew + life support health
    const crewCount = 5; // approximate
    const oxygenConsumption = 0.0012 * crewCount / Math.max(0.3, lifeHealth);
    this.state.oxygen = Math.max(0, this.state.oxygen - delta * oxygenConsumption);
    if (this.state.oxygen < 25) {
      this.state.crewMorale = Math.max(0, this.state.crewMorale - delta * 0.006);
      if (Math.random() < 0.005) eventBus.emit('OXYGEN_LOW', { oxygen: this.state.oxygen });
    } else if (this.state.oxygen > 90 && this.state.crewMorale < 90) {
      this.state.crewMorale = Math.min(100, this.state.crewMorale + delta * 0.001);
    }

    // Food and supplies — consumption + morale
    const foodConsumption = 0.0006 * crewCount;
    const supplyConsumption = 0.00035 * crewCount;
    this.state.food = Math.max(0, this.state.food - delta * foodConsumption);
    this.state.supplies = Math.max(0, this.state.supplies - delta * supplyConsumption);

    if (this.state.food < 25 || this.state.supplies < 25) {
      this.state.crewMorale = Math.max(0, this.state.crewMorale - delta * 0.004);
    }
    // Morale recovery if all good
    if (this.state.food > 70 && this.state.supplies > 70 && this.state.oxygen > 70 && this.state.power > 300 && this.state.heat < 50) {
      this.state.crewMorale = Math.min(100, this.state.crewMorale + delta * 0.0008);
    }

    // FTL charge — needs power and nav health
    const nav = this.state.modules.find(m => m.type === ModuleType.Navigation);
    const navHealth = (nav?.health || 100) / 100;
    if (this.state.power > 200 && this.state.ftlCharge < 100 && navHealth > 0.4) {
      this.state.ftlCharge = Math.min(100, this.state.ftlCharge + delta * 0.03 * navHealth * (this.state.power / 500));
    }

    // Weapon/armor from modules + drones + morale
    const weaponsMod = this.state.modules.find(m => m.type === ModuleType.Engine)?.level || 1;
    const moraleFactor = 0.7 + (this.state.crewMorale / 100) * 0.3;
    this.state.weaponPower = (50 + weaponsMod * 16 + this.state.drones * 12) * moraleFactor;
    this.state.armor = (30 + (this.state.modules.find(m => m.type === ModuleType.CargoBay)?.level || 1) * 8) * (0.8 + (this.state.hull / this.state.hullMax) * 0.2);

    // Random micro-events — makes ship feel alive
    if (Math.random() < 0.001) {
      // Random module efficiency fluctuation — lived-in feel
      const mod = this.state.modules[Math.floor(Math.random() * this.state.modules.length)];
      mod.efficiency = Math.max(0.7, Math.min(1.2, mod.efficiency + (Math.random() - 0.5) * 0.04));
    }

    this.recalc();
  }
}
