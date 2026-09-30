import { Galaxy } from '../galaxy/galaxy';
import { createInitialShip, ShipManager } from '../ship/ship';
import { SeededRNG } from '../utils/seedRandom';
import { GALAXY } from '../core/constants';
import { SaveSystem } from './saveSystem';
import { eventBus } from './eventBus';
import {
  SystemDiscoveryState, ResourceType, DiscoveryType, FactionId,
  type GameState, type DiscoveryData, type StarData, type StationData,
  type CrewMember, type QuestData, QuestStatus
} from './types';
import { calculateFTLCost, canFTLJump, executeFTLJump } from '../travel/ftl';
import { createDiscovery, DISCOVERY_TEMPLATES } from '../exploration/discovery';
import { RANDOM_EVENTS } from '../data/events';
import { generateStartingCrew, CrewManager } from '../crew/crew';
import { QuestManager, generateQuest } from '../quests/quest';
import { FactionManager, createInitialFactionStates } from '../factions/factionManager';
import { MarketManager } from '../economy/market';
import { CodexManager } from '../lore/codex';
import { StoryManager, generateMainQuest } from '../narrative/mainStory';
import { WorldMemory } from '../world/worldMemory';
import { audioManager } from '../audio/audioManager';
import { CombatManager, generateCombatEncounter } from '../combat/combat';
import { CraftingManager } from '../crafting/crafting';
import { ResearchManager } from '../research/research';
import { WormholeManager } from '../wormhole/wormhole';
import { AlienLanguageManager } from '../lore/language/alienLanguage';

export class GameEngine {
  galaxy: Galaxy;
  shipManager: ShipManager;
  crewManager: CrewManager;
  questManager: QuestManager;
  factionManager: FactionManager;
  codexManager: CodexManager;
  storyManager: StoryManager;
  worldMemory: WorldMemory;
  combatManager: CombatManager;
  craftingManager: CraftingManager;
  researchManager: ResearchManager;
  wormholeManager: WormholeManager;
  languageManager: AlienLanguageManager;
  rng: SeededRNG;
  state: GameState;
  isScanning: boolean = false;
  scanProgress: number = 0;
  scanTarget: { type: 'system' | 'planet', id: string } | null = null;
  lastTick: number = 0;
  eventCooldown: number = 0;
  dayTimer: number = 0;

  constructor() {
    const saved = SaveSystem.load();
    if (saved) {
      this.galaxy = Galaxy.fromJSON({ seed: saved.galaxySeed, systems: [], startingSystemId: '' });
      const galaxyData = localStorage.getItem('aether_voyager_galaxy_v1');
      if (galaxyData) {
        try {
          const parsed = JSON.parse(galaxyData);
          this.galaxy = Galaxy.fromJSON(parsed);
        } catch {
          this.galaxy = new Galaxy(saved.galaxySeed);
        }
      } else {
        this.galaxy = new Galaxy(saved.galaxySeed);
        for (const sysId of saved.galaxy.exploredSystems) {
          this.galaxy.revealSystem(sysId, SystemDiscoveryState.Visited);
        }
        for (const sysId of saved.galaxy.scannedSystems) {
          this.galaxy.revealSystem(sysId, SystemDiscoveryState.Scanned);
        }
      }

      this.state = this.migrateSave(saved);
      this.shipManager = new ShipManager(this.state.ship);
      this.crewManager = new CrewManager(this.state.crew);
      this.questManager = new QuestManager(this.state.quests.available, this.state.quests.active, this.state.quests.completed);
      this.factionManager = new FactionManager(this.state.factions);
      this.codexManager = CodexManager.fromJSON((this.state as any).codexData || { unlocked: this.state.codex.unlockedEntries });
      this.storyManager = StoryManager.fromJSON((this.state as any).story || { currentChapterIndex: 0, completedQuests: [] });
      this.worldMemory = WorldMemory.fromJSON((this.state as any).worldMemory || { events: [], systemChanges: [] }, () => this.rng.next());
      this.rng = new SeededRNG(saved.galaxySeed);
      this.combatManager = CombatManager.fromJSON((this.state as any).combat || null);
      this.craftingManager = CraftingManager.fromJSON((this.state as any).crafting || null);
      this.researchManager = ResearchManager.fromJSON((this.state as any).research || null);
      this.wormholeManager = WormholeManager.fromJSON((this.state as any).wormholes || { wormholes: [] }, saved.galaxySeed);
      this.languageManager = AlienLanguageManager.fromJSON((this.state as any).language || null, saved.galaxySeed);

      if (this.state.quests.available.length === 0 && this.state.quests.active.length === 0) {
        this.questManager.generateAvailableQuests(this.rng, this.galaxy, 5, this.state.player.level);
        this.state.quests.available = this.questManager.available;
      }

      // Ensure main story quests
      this.ensureMainStoryQuests();
    } else {
      this.galaxy = new Galaxy(GALAXY.SEED);
      this.rng = new SeededRNG(GALAXY.SEED);
      const startSys = this.galaxy.getSystem(this.galaxy.startingSystemId)!;
      const ship = createInitialShip(this.rng, startSys.position, startSys.id);
      this.shipManager = new ShipManager(ship);

      const crew = generateStartingCrew(this.rng);
      this.crewManager = new CrewManager(crew);

      const factions = createInitialFactionStates();
      this.factionManager = new FactionManager(factions);

      this.questManager = new QuestManager();
      this.questManager.generateAvailableQuests(this.rng, this.galaxy, 6, 1);

      this.codexManager = new CodexManager(['intro', 'stellar-red-dwarf']);
      this.storyManager = new StoryManager();
      this.worldMemory = new WorldMemory(() => this.rng.next());
      this.combatManager = new CombatManager();
      this.craftingManager = new CraftingManager();
      this.researchManager = new ResearchManager();
      this.wormholeManager = new WormholeManager(GALAXY.SEED);
      this.languageManager = new AlienLanguageManager(GALAXY.SEED);

      this.state = {
        version: 6,
        galaxySeed: GALAXY.SEED,
        player: {
          name: 'Captain',
          credits: 1500,
          discoveries: 0,
          systemsVisited: 1,
          distanceTraveled: 0,
          level: 1,
          xp: 0,
        },
        ship,
        galaxy: {
          exploredSystems: [startSys.id],
          scannedSystems: [],
          discoveredPlanets: [],
        },
        discoveries: [],
        codex: {
          unlockedEntries: ['intro', 'stellar-red-dwarf'],
        },
        crew,
        quests: {
          available: this.questManager.available,
          active: this.questManager.active,
          completed: this.questManager.completed,
        },
        factions,
        time: {
          startTime: Date.now(),
          playTime: 0,
          lastSave: Date.now(),
          day: 1,
        },
        flags: {
          tutorialDone: false,
        }
      } as any;

      // Add codexData, story, worldMemory to state for saving
      (this.state as any).codexData = this.codexManager.toJSON();
      (this.state as any).story = this.storyManager.toJSON();
      (this.state as any).worldMemory = this.worldMemory.toJSON();
      (this.state as any).wormholes = this.wormholeManager.toJSON();
      (this.state as any).combat = this.combatManager.toJSON();
      (this.state as any).crafting = this.craftingManager.toJSON();
      (this.state as any).research = this.researchManager.toJSON();
      (this.state as any).language = this.languageManager.toJSON();

      this.galaxy.revealSystem(startSys.id, SystemDiscoveryState.Visited);
      this.addDiscovery(DiscoveryType.StarSystem, startSys.id, DISCOVERY_TEMPLATES.newSystem(startSys.name));

      // Generate first main quest
      this.ensureMainStoryQuests();

      this.save();
    }

    this.lastTick = performance.now();

    // Listen to events for audio and world memory
    eventBus.onAny((ev) => {
      audioManager.onGameEvent(ev.type);
      if (ev.type === 'DISCOVERY_FOUND' && ev.data.type === 'structure') {
        this.worldMemory.onRuinsDiscovered(ev.data.location.systemId, ev.data.name);
      }
      if (ev.type === 'DISCOVERY_FOUND' && ev.data.type === 'technology') {
        this.worldMemory.onAncientTechRecovered(ev.data.location.systemId);
      }
    });
  }

  private migrateSave(saved: any): GameState {
    if (!saved.version || saved.version < 2) {
      console.log('Migrating save v1 -> v6');
      const rng = new SeededRNG(saved.galaxySeed || GALAXY.SEED);
      const crew = generateStartingCrew(rng);
      const factions = createInitialFactionStates();
      const codexManager = new CodexManager(saved.codex?.unlockedEntries || ['intro']);
      const storyManager = new StoryManager();
      const worldMemory = new WorldMemory(() => rng.next());

      return {
        version: 6,
        galaxySeed: saved.galaxySeed || GALAXY.SEED,
        player: {
          name: saved.player?.name || 'Captain',
          credits: saved.player?.credits ?? 500,
          discoveries: saved.player?.discoveries ?? 0,
          systemsVisited: saved.player?.systemsVisited ?? 1,
          distanceTraveled: saved.player?.distanceTraveled ?? 0,
          level: 1,
          xp: 0,
        },
        ship: saved.ship,
        galaxy: saved.galaxy,
        discoveries: saved.discoveries || [],
        codex: saved.codex || { unlockedEntries: ['intro'] },
        crew,
        quests: {
          available: [],
          active: [],
          completed: [],
        },
        factions,
        time: {
          startTime: saved.time?.startTime || Date.now(),
          playTime: saved.time?.playTime || 0,
          lastSave: Date.now(),
          day: 1,
        },
        flags: saved.flags || {},
      } as any;
    }
    if (saved.version < 6) {
      console.log(`Migrating save v${saved.version} -> v6`);
      const rng = new SeededRNG(saved.galaxySeed);
      const codexManager = new CodexManager(saved.codex?.unlockedEntries || ['intro']);
      const storyManager = saved.version >= 3 ? (this.storyManager || new StoryManager()) : new StoryManager();
      const worldMemory = saved.version >= 3 ? (this.worldMemory || new WorldMemory(() => rng.next())) : new WorldMemory(() => rng.next());
      // Ensure ship has v6 fields
      if (saved.ship && saved.ship.food === undefined) {
        saved.ship.food = 100;
        saved.ship.supplies = 100;
        saved.ship.weaponPower = 50;
        saved.ship.armor = 30;
        saved.ship.drones = 2;
        saved.ship.probes = 5;
      }
      if (saved.ship && saved.ship.resources) {
        if (saved.ship.resources.food === undefined) saved.ship.resources.food = 80;
        if (saved.ship.resources.supplies === undefined) saved.ship.resources.supplies = 60;
        if (saved.ship.resources.alien_artifact === undefined) saved.ship.resources.alien_artifact = 0;
        if (saved.ship.resources.dark_matter === undefined) saved.ship.resources.dark_matter = 0;
      }
      const newState = {
        ...saved,
        version: 6,
        codexData: codexManager.toJSON(),
        story: (saved as any).story || storyManager.toJSON(),
        worldMemory: (saved as any).worldMemory || worldMemory.toJSON(),
        wormholes: (saved as any).wormholes || { wormholes: [] },
        combat: (saved as any).combat || { currentEncounter: null, log: [] },
        crafting: (saved as any).crafting || { unlocked: ['repair_kit', 'food_supplies', 'ship_supplies', 'probe', 'fuel_synthesizer'], research: [] },
        research: (saved as any).research || { completed: [], inProgress: null, progress: 0, progressTimer: 0 },
        language: (saved as any).language || { solved: [], solvedCount: 0 },
      };
      return newState as any;
    }
    return saved as GameState;
  }

  private ensureMainStoryQuests() {
    const currentChapter = this.storyManager.getCurrentChapter();
    if (!currentChapter) return;

    const playerLevel = this.state.player.level;
    const discoveries = this.state.player.discoveries;
    const systems = this.state.player.systemsVisited;

    if (this.storyManager.canStartChapter(playerLevel, discoveries, systems)) {
      // Generate quests for current chapter if not already present
      for (const questId of currentChapter.quests) {
        const exists = [...this.questManager.available, ...this.questManager.active, ...this.questManager.completed].some(q => q.id === questId);
        if (!exists) {
          try {
            const quest = generateMainQuest(this.rng.fork(`main-${questId}`), this.galaxy, currentChapter.id, questId);
            this.questManager.available.push(quest);
          } catch (e) {
            console.warn(`Failed to generate main quest ${questId}`, e);
          }
        }
      }
      this.state.quests.available = this.questManager.available;
    }
  }

  save() {
    this.state.ship = this.shipManager.state;
    this.state.crew = this.crewManager.members;
    this.state.quests = {
      available: this.questManager.available,
      active: this.questManager.active,
      completed: this.questManager.completed,
    };
    this.state.factions = this.factionManager.states;
    this.state.time.lastSave = Date.now();
    (this.state as any).codexData = this.codexManager.toJSON();
    (this.state as any).story = this.storyManager.toJSON();
    (this.state as any).worldMemory = this.worldMemory.toJSON();
    (this.state as any).wormholes = this.wormholeManager.toJSON();
    (this.state as any).combat = this.combatManager.toJSON();
    (this.state as any).crafting = this.craftingManager.toJSON();
    (this.state as any).research = this.researchManager.toJSON();
    (this.state as any).language = this.languageManager.toJSON();
    this.state.codex.unlockedEntries = Array.from((this.codexManager as any).unlocked || []);

    SaveSystem.save(this.state);
    localStorage.setItem('aether_voyager_galaxy_v1', JSON.stringify(this.galaxy.toJSON()));
    eventBus.emit('SAVE_GAME', {});
  }

  addDiscovery(type: DiscoveryType, systemId: string, template: any, planetId?: string): DiscoveryData {
    const rng = this.rng.fork(`disc-${Date.now()}-${Math.random()}`);
    const disc = createDiscovery(rng, type, systemId, planetId, {
      name: template.name,
      description: template.description,
      scientificValue: template.scientificValue || 10,
      economicValue: template.economicValue || 20,
      rarity: template.rarity || 'common',
    });
    this.state.discoveries.unshift(disc);
    this.state.player.discoveries++;
    this.state.player.xp += disc.scientificValue;
    this.checkLevelUp();

    // Unlock codex based on discovery
    if (type === DiscoveryType.Structure) {
      this.codexManager.unlock('ancient-ruins');
      this.codexManager.unlock('ancient-overview');
    }
    if (type === DiscoveryType.Technology) {
      this.codexManager.unlock('ancient-tech');
    }
    if (type === DiscoveryType.Anomaly && disc.rarity === 'unique') {
      this.codexManager.unlock('silent-planet');
    }
    if (type === DiscoveryType.Planet) {
      const planet = this.getPlanetById(planetId!);
      if (planet) {
        if (planet.type === 'earth_like') this.codexManager.unlock('planet-earth-like');
        if (planet.hasLife) this.codexManager.unlock('phenomena-void-echo');
      }
    }

    eventBus.emit('DISCOVERY_FOUND', disc);
    return disc;
  }

  private checkLevelUp() {
    const needed = this.state.player.level * 200;
    if (this.state.player.xp >= needed) {
      this.state.player.level++;
      this.state.player.xp -= needed;
      this.state.player.credits += 200 * this.state.player.level;
      this.ensureMainStoryQuests();
    }
  }

  // Travel
  jumpToSystem(systemId: string): { success: boolean; message: string } {
    const target = this.galaxy.getSystem(systemId);
    if (!target) return { success: false, message: 'System not found' };

    const check = canFTLJump(this.shipManager.state, target);
    if (!check.can) return { success: false, message: check.reason! };

    const currentSystem = this.shipManager.state.currentSystemId ? this.galaxy.getSystem(this.shipManager.state.currentSystemId) : null;
    const result = executeFTLJump(this.shipManager.state, currentSystem || null, target, () => this.rng.next());

    this.shipManager.consumeFuel(result.fuelCost);
    this.shipManager.state.ftlCharge = Math.max(0, this.shipManager.state.ftlCharge - 30 - this.rng.range(0, 20));

    const prevPos = { ...this.shipManager.state.position };
    if (result.arrivalDeviation && result.arrivalDeviation > 0) {
      const angle = this.rng.range(0, Math.PI * 2);
      this.shipManager.state.position = {
        x: target.position.x + Math.cos(angle) * result.arrivalDeviation,
        y: target.position.y + Math.sin(angle) * result.arrivalDeviation,
      };
    } else {
      this.shipManager.state.position = { ...target.position };
    }

    const distance = Math.hypot(this.shipManager.state.position.x - prevPos.x, this.shipManager.state.position.y - prevPos.y);
    this.state.player.distanceTraveled += distance;

    this.shipManager.state.currentSystemId = target.id;
    this.galaxy.revealSystem(target.id, SystemDiscoveryState.Visited);

    if (!this.state.galaxy.exploredSystems.includes(target.id)) {
      this.state.galaxy.exploredSystems.push(target.id);
      this.state.player.systemsVisited++;
      this.addDiscovery(DiscoveryType.StarSystem, target.id, DISCOVERY_TEMPLATES.newSystem(target.name));
    }

    this.crewManager.onFTLJump();
    this.questManager.checkAutoObjectives(target.id, this.state.galaxy.scannedSystems, this.state.galaxy.discoveredPlanets, this.shipManager.state.resources as any);

    if (target.faction) {
      const attitude = this.factionManager.getAttitude(target.faction);
      if (attitude === 'hostile' && this.rng.bool(0.3)) {
        this.triggerRandomEvent();
      }
    }

    eventBus.emit('FTL_JUMP', { from: currentSystem?.id, to: target.id, result });
    eventBus.emit('SYSTEM_ENTERED', { system: target });

    if (this.rng.bool(0.25) && this.eventCooldown <= 0) {
      this.triggerRandomEvent();
      this.eventCooldown = 60;
    }

    this.ensureMainStoryQuests();
    this.save();
    return { success: result.success, message: result.message };
  }

  triggerRandomEvent() {
    const ev = this.rng.pick(RANDOM_EVENTS);
    this.addDiscovery(DiscoveryType.Anomaly, this.shipManager.state.currentSystemId!, {
      name: `Event: ${ev.title}`,
      description: `${ev.description} — ${ev.flavor}`,
      scientificValue: ev.rarity === 'unique' ? 500 : ev.rarity === 'legendary' ? 200 : 50,
      rarity: ev.rarity,
    });
    eventBus.emit('ANOMALY_DETECTED', ev);
  }

  // Scanning
  startSystemScan(systemId: string) {
    if (this.isScanning) return { success: false, message: 'Already scanning' };
    const sys = this.galaxy.getSystem(systemId);
    if (!sys) return { success: false, message: 'System not found' };
    if (sys.discoveryState === SystemDiscoveryState.FullySurveyed) {
      return { success: false, message: 'System already fully surveyed' };
    }
    this.isScanning = true;
    this.scanProgress = 0;
    this.scanTarget = { type: 'system', id: systemId };
    return { success: true, message: `Scanning ${sys.name}...` };
  }

  startPlanetScan(planetId: string) {
    if (this.isScanning) return { success: false, message: 'Already scanning' };
    const planet = this.getPlanetById(planetId);
    if (!planet) return { success: false, message: 'Planet not found' };
    if (planet.scanned) return { success: false, message: 'Planet already scanned' };
    this.isScanning = true;
    this.scanProgress = 0;
    this.scanTarget = { type: 'planet', id: planetId };
    return { success: true, message: `Scanning ${planet.name}...` };
  }

  getPlanetById(planetId: string) {
    for (const sys of this.galaxy.getAllSystems()) {
      const p = sys.planets.find(pl => pl.id === planetId);
      if (p) return p;
    }
    return null;
  }

  completeScan() {
    if (!this.scanTarget) return;
    if (this.scanTarget.type === 'system') {
      const sys = this.galaxy.getSystem(this.scanTarget.id);
      if (!sys) return;
      this.galaxy.revealSystem(sys.id, SystemDiscoveryState.Scanned);
      if (!this.state.galaxy.scannedSystems.includes(sys.id)) {
        this.state.galaxy.scannedSystems.push(sys.id);
      }
      for (const planet of sys.planets) {
        if (!this.state.galaxy.discoveredPlanets.includes(planet.id)) {
          this.state.galaxy.discoveredPlanets.push(planet.id);
          this.addDiscovery(DiscoveryType.Planet, sys.id, DISCOVERY_TEMPLATES.newPlanet(planet.name, planet.type), planet.id);
        }
        if (planet.hasRuins && this.rng.bool(0.8)) {
          this.addDiscovery(DiscoveryType.Structure, sys.id, DISCOVERY_TEMPLATES.ruins(planet.name), planet.id);
        }
        if (planet.hasLife && this.rng.bool(0.7)) {
          this.addDiscovery(DiscoveryType.Species, sys.id, DISCOVERY_TEMPLATES.life(planet.name), planet.id);
        }
        if (planet.resources.exotic && this.rng.bool(0.5)) {
          this.addDiscovery(DiscoveryType.Mineral, sys.id, DISCOVERY_TEMPLATES.exotic(), planet.id);
        }
      }
      if (sys.anomalies.length > 0) {
        for (const an of sys.anomalies) {
          this.addDiscovery(DiscoveryType.Anomaly, sys.id, DISCOVERY_TEMPLATES.anomaly(an.name));
        }
      }
      this.crewManager.onSystemScanned();
      eventBus.emit('SYSTEM_SCANNED', { system: sys });
    } else {
      const planet = this.getPlanetById(this.scanTarget.id);
      if (!planet) return;
      planet.scanned = true;
      for (const [resType, amount] of Object.entries(planet.resources)) {
        const sample = Math.floor((amount as number) * 0.15);
        if (sample > 0) {
          this.shipManager.addResource(resType as ResourceType, sample);
        }
      }
      if (planet.hasRuins) {
        this.addDiscovery(DiscoveryType.Technology, planet.parentSystemId, {
          name: `Ancient Tech: ${planet.name}`,
          description: `Recovered fragmentary data from ruins on ${planet.name}. Non-human script, advanced material science.`,
          scientificValue: 120,
          rarity: 'rare',
        }, planet.id);
      }
      this.crewManager.onPlanetScanned();
      eventBus.emit('PLANET_SCANNED', { planet });
    }

    this.questManager.checkAutoObjectives(
      this.shipManager.state.currentSystemId,
      this.state.galaxy.scannedSystems,
      this.state.galaxy.discoveredPlanets,
      this.shipManager.state.resources as any
    );

    this.isScanning = false;
    this.scanTarget = null;
    this.scanProgress = 0;
    this.save();
  }

  // Trading
  buyResource(stationId: string, resource: ResourceType, amount: number): { success: boolean; message: string } {
    const station = this.findStation(stationId);
    if (!station || !station.market) return { success: false, message: 'Station has no market' };

    const marketItem = station.market.find(m => m.resource === resource);
    if (!marketItem) return { success: false, message: 'Resource not available' };
    if (marketItem.stock < amount) return { success: false, message: `Only ${marketItem.stock} in stock` };

    const rep = station.faction ? this.factionManager.getReputation(station.faction) : 0;
    const pricePerUnit = MarketManager.getTradePrice(marketItem, true, rep, amount);
    const totalPrice = pricePerUnit * amount;

    if (this.state.player.credits < totalPrice) return { success: false, message: `Need ${totalPrice} credits, have ${this.state.player.credits}` };
    if (!this.shipManager.addResource(resource, amount)) return { success: false, message: 'Cargo full' };

    this.state.player.credits -= totalPrice;
    marketItem.stock -= amount;
    eventBus.emit('RESOURCE_TRADED', { type: 'buy', resource, amount, price: totalPrice, station: stationId });
    this.crewManager.onTrade();
    this.save();
    return { success: true, message: `Bought ${amount} ${resource} for ${totalPrice} credits` };
  }

  sellResource(stationId: string, resource: ResourceType, amount: number): { success: boolean; message: string } {
    const station = this.findStation(stationId);
    if (!station || !station.market) return { success: false, message: 'Station has no market' };

    const have = this.shipManager.state.resources[resource] || 0;
    if (have < amount) return { success: false, message: `Only have ${have}` };

    const marketItem = station.market.find(m => m.resource === resource);
    if (!marketItem) return { success: false, message: 'Station does not buy this' };

    const rep = station.faction ? this.factionManager.getReputation(station.faction) : 0;
    const pricePerUnit = MarketManager.getTradePrice(marketItem, false, rep, amount);
    const totalPrice = pricePerUnit * amount;

    this.shipManager.state.resources[resource] = have - amount;
    this.shipManager.recalc();
    this.state.player.credits += totalPrice;
    marketItem.stock += amount;

    eventBus.emit('RESOURCE_TRADED', { type: 'sell', resource, amount, price: totalPrice, station: stationId });
    this.crewManager.onTrade();

    if (station.faction) {
      this.factionManager.modifyReputation(station.faction, 0.5, 'trading');
    }

    this.save();
    return { success: true, message: `Sold ${amount} ${resource} for ${totalPrice} credits` };
  }

  findStation(stationId: string): StationData | null {
    for (const sys of this.galaxy.getAllSystems()) {
      const st = sys.stations.find(s => s.id === stationId);
      if (st) return st;
    }
    return null;
  }

  // Quests
  acceptQuest(questId: string): { success: boolean; message: string } {
    if (this.questManager.acceptQuest(questId)) {
      this.state.quests.available = this.questManager.available;
      this.state.quests.active = this.questManager.active;
      eventBus.emit('QUEST_STARTED', { questId });
      this.save();
      return { success: true, message: 'Quest accepted' };
    }
    return { success: false, message: 'Quest not found' };
  }

  completeQuest(questId: string, choiceId?: string): { success: boolean; message: string } {
    const quest = this.questManager.active.find(q => q.id === questId);
    if (!quest) return { success: false, message: 'Quest not active' };

    if (!quest.objectives.every(o => o.completed)) {
      return { success: false, message: 'Objectives not completed' };
    }

    if (choiceId) {
      quest.selectedChoice = choiceId;
      // Apply choice consequences
      this.applyQuestChoice(quest, choiceId);
    }

    this.state.player.credits += quest.rewards.credits;
    if (quest.rewards.resources) {
      for (const [res, amt] of Object.entries(quest.rewards.resources)) {
        this.shipManager.addResource(res as ResourceType, amt as number);
      }
    }
    if (quest.rewards.reputation) {
      for (const [factionId, rep] of Object.entries(quest.rewards.reputation)) {
        this.factionManager.modifyReputation(factionId as FactionId, rep as number, `quest ${quest.title}`);
      }
    }

    quest.status = QuestStatus.Completed;
    quest.completedAt = Date.now();
    this.questManager.completed.push(quest);
    this.questManager.active = this.questManager.active.filter(q => q.id !== questId);

    this.state.quests.active = this.questManager.active;
    this.state.quests.completed = this.questManager.completed;

    this.state.player.xp += quest.rarity === 'unique' ? 300 : quest.rarity === 'legendary' ? 200 : quest.rarity === 'rare' ? 100 : 50;
    this.checkLevelUp();

    // Story progression
    if (quest.id.startsWith('main-')) {
      const chapterCompleted = this.storyManager.completeQuest(quest.id);
      if (chapterCompleted) {
        const nextChapter = this.storyManager.getCurrentChapter();
        if (nextChapter) {
          // Unlock codex for chapter
          for (const unlock of nextChapter.rewards.unlocks || []) {
            this.codexManager.unlock(unlock);
          }
        }
      }
      this.ensureMainStoryQuests();
    }

    eventBus.emit('QUEST_COMPLETED', { quest });
    this.save();
    return { success: true, message: `Quest completed! +${quest.rewards.credits} credits` };
  }

  private applyQuestChoice(quest: QuestData, choiceId: string) {
    // Apply narrative consequences based on choice
    switch (choiceId) {
      case 'report-coalition':
        this.factionManager.modifyReputation(FactionId.ScientificCoalition, 10, 'reported signal');
        this.codexManager.unlock('ancient-signal');
        break;
      case 'keep-secret':
        this.state.player.credits += 500;
        break;
      case 'give-coalition':
        this.factionManager.modifyReputation(FactionId.ScientificCoalition, 15, 'gave ruins data');
        this.state.player.credits += 800;
        break;
      case 'keep-core':
        this.factionManager.modifyReputation(FactionId.ScientificCoalition, -5, 'kept data core');
        this.shipManager.addResource(ResourceType.Exotic, 5);
        this.shipManager.addResource(ResourceType.TechSalvage, 3);
        this.codexManager.unlock('ancient-tech');
        break;
      case 'land-immediately':
        this.codexManager.unlock('silent-planet');
        this.factionManager.modifyReputation(FactionId.Nomadic, 20, 'brave landing');
        break;
      case 'quarantine-report':
        this.factionManager.modifyReputation(FactionId.HumanFederation, 20, 'quarantine');
        break;
      case 'destroy-tower':
        this.worldMemory.addEvent({
          type: 'anomaly_contained',
          systemId: this.shipManager.state.currentSystemId || '',
          description: 'Destroyed Ancient tower on silent planet. Signal stopped.',
          consequences: [
            { type: 'danger', data: { danger: -0.3 } },
            { type: 'reputation', data: { faction: FactionId.HumanFederation, amount: 10 } },
          ],
          isPermanent: true,
        });
        break;
    }
  }

  // Station services
  refuelAtStation(stationId: string): { success: boolean; message: string } {
    const station = this.findStation(stationId);
    if (!station) return { success: false, message: 'Station not found' };
    if (!station.services?.includes('refuel')) return { success: false, message: 'No refuel service' };

    const needed = this.shipManager.state.fuelCapacity - this.shipManager.state.fuel;
    if (needed <= 0) return { success: false, message: 'Fuel already full' };

    const costPerUnit = station.faction ? 2 - (this.factionManager.getReputation(station.faction) / 100) : 2;
    const totalCost = Math.floor(needed * costPerUnit);

    if (this.state.player.credits < totalCost) return { success: false, message: `Need ${totalCost} credits` };

    this.state.player.credits -= totalCost;
    this.shipManager.state.fuel = this.shipManager.state.fuelCapacity;
    this.save();
    return { success: true, message: `Refueled ${needed.toFixed(0)} units for ${totalCost} credits` };
  }

  repairAtStation(stationId: string): { success: boolean; message: string } {
    const station = this.findStation(stationId);
    if (!station) return { success: false, message: 'Station not found' };
    if (!station.services?.includes('repair')) return { success: false, message: 'No repair service' };

    const hullNeeded = this.shipManager.state.hullMax - this.shipManager.state.hull;
    const modulesNeeded = this.shipManager.state.modules.filter(m => m.health < 100).length;

    if (hullNeeded <= 0 && modulesNeeded === 0) return { success: false, message: 'No damage' };

    const cost = Math.floor(hullNeeded * 0.5 + modulesNeeded * 100);
    if (this.state.player.credits < cost) return { success: false, message: `Need ${cost} credits` };

    this.state.player.credits -= cost;
    this.shipManager.state.hull = this.shipManager.state.hullMax;
    for (const mod of this.shipManager.state.modules) {
      mod.health = 100;
    }
    this.shipManager.recalc();
    this.save();
    return { success: true, message: `Repaired hull and ${modulesNeeded} modules for ${cost} credits` };
  }

  // v6 Wormhole travel
  travelThroughWormhole(wormholeId: string): { success: boolean; message: string } {
    const hasStabilizer = (this.shipManager.state.resources as any).wormhole_stabilizer > 0 || (this.shipManager.state.resources[ResourceType.DarkMatter] || 0) > 0;
    const result = this.wormholeManager.travelThrough(wormholeId, hasStabilizer);
    
    if (result.success && result.destination) {
      const prevPos = { ...this.shipManager.state.position };
      this.shipManager.state.position = { ...result.destination };
      const distance = Math.hypot(result.destination.x - prevPos.x, result.destination.y - prevPos.y);
      this.state.player.distanceTraveled += distance;
      
      if (result.damage > 0) {
        this.shipManager.damageHull(result.damage);
      }
      
      // Find nearest system at destination
      const nearby = this.galaxy.getSystemsInRange(result.destination, 500);
      if (nearby.length > 0) {
        const closest = nearby.reduce((a, b) => {
          const da = Math.hypot(a.position.x - result.destination!.x, a.position.y - result.destination!.y);
          const db = Math.hypot(b.position.x - result.destination!.x, b.position.y - result.destination!.y);
          return da < db ? a : b;
        });
        this.shipManager.state.currentSystemId = closest.id;
        this.galaxy.revealSystem(closest.id, SystemDiscoveryState.Visited);
      }
      
      if (hasStabilizer && (this.shipManager.state.resources as any).wormhole_stabilizer > 0) {
        (this.shipManager.state.resources as any).wormhole_stabilizer--;
      }
      
      this.addDiscovery(DiscoveryType.Wormhole, this.shipManager.state.currentSystemId || '', {
        name: `Wormhole Travel: ${wormholeId}`,
        description: `Traveled through ${this.wormholeManager.getWormhole(wormholeId)?.type} wormhole. Distance: ${distance.toFixed(0)} LY`,
        scientificValue: 100,
        rarity: 'rare',
      });
      
      eventBus.emit('FTL_JUMP', { from: 'wormhole', to: result.destination, result });
      this.save();
    } else if (!result.success && result.destination) {
      // Malfunction
      this.shipManager.state.position = { ...result.destination };
      this.shipManager.damageHull(result.damage);
      this.save();
    }
    
    return { success: result.success, message: result.message };
  }

  // v6 Combat
  startCombatEncounter(dangerLevel?: number): { success: boolean; encounter?: any; message: string } {
    const currentSys = this.getCurrentSystem();
    const danger = dangerLevel ?? currentSys?.dangerLevel ?? this.rng.range(0.2, 0.8);
    const encounter = generateCombatEncounter(this.rng.fork(`combat-${Date.now()}`), danger, currentSys?.faction);
    this.combatManager.startCombat(encounter);
    return { success: true, encounter, message: `Combat: ${encounter.enemyName} detected! Danger ${(danger * 100).toFixed(0)}%` };
  }

  update(delta: number) {
    this.shipManager.update(delta);
    this.state.time.playTime += delta;
    this.dayTimer += delta;

    // v6 Research update
    const completedResearch = this.researchManager.update(delta);
    if (completedResearch) {
      const node = this.researchManager.getNode(completedResearch);
      if (node) {
        this.addDiscovery(DiscoveryType.Technology, this.shipManager.state.currentSystemId || '', {
          name: `Research: ${node.name}`,
          description: node.description,
          scientificValue: 50,
          rarity: 'rare',
        });
        this.craftingManager.completeResearch(completedResearch);
        eventBus.emit('DISCOVERY_FOUND', { type: 'technology', name: node.name });
      }
    }

    if (this.dayTimer > 60000) {
      this.state.time.day++;
      this.dayTimer = 0;
      for (const sys of this.galaxy.getAllSystems()) {
        for (const station of sys.stations) {
          if (station.market) {
            const rng = this.rng.fork(`market-update-${station.id}-${this.state.time.day}`);
            station.market = MarketManager.updateMarket(station.market, rng, 1);
          }
        }
      }
      if (this.rng.bool(0.3)) {
        const newQuest = generateQuest(this.rng.fork(`new-quest-${Date.now()}`), this.galaxy, undefined, this.state.player.level);
        this.questManager.available.push(newQuest);
        this.state.quests.available = this.questManager.available;
        eventBus.emit('MISSION_AVAILABLE', newQuest);
      }
      this.factionManager.simulateFactionDynamics(() => this.rng.next());
      this.worldMemory.simulateTimePassage(1, this.galaxy, () => this.rng.next());
      this.ensureMainStoryQuests();

      // v6: Random combat encounter
      if (this.rng.bool(0.15)) {
        const currentSys = this.getCurrentSystem();
        if (currentSys && currentSys.dangerLevel > 0.4) {
          // Trigger combat event
          eventBus.emit('ANOMALY_DETECTED', {
            title: 'Hostile Contact',
            description: 'Sensors detect hostile vessel on intercept course!',
            flavor: 'It is not here to talk.',
          });
        }
      }

      // v6: Discover wormholes
      const nearbyWormholes = this.wormholeManager.getWormholesInRange(this.shipManager.state.position, this.shipManager.state.sensorRange);
      for (const wh of nearbyWormholes) {
        if (!wh.discovered && this.rng.bool(0.5)) {
          this.wormholeManager.discoverWormhole(wh.id);
          this.addDiscovery(DiscoveryType.Wormhole, this.shipManager.state.currentSystemId || '', {
            name: `Wormhole: ${wh.id}`,
            description: `${wh.type} wormhole detected. Stability ${(wh.stability * 100).toFixed(0)}%. Linked to ${wh.linkedTo?.x.toFixed(0)}, ${wh.linkedTo?.y.toFixed(0)}`,
            scientificValue: wh.type === 'ancient_gate' ? 200 : 80,
            rarity: wh.type === 'ancient_gate' ? 'legendary' : 'rare',
          });
        }
      }
    }

    if (this.isScanning) {
      const scanSpeed = this.shipManager.state.modules.find(m => m.type === 'science_lab')?.level || 1;
      const scientistBonus = this.crewManager.getSkillBonus('science');
      this.scanProgress += delta * 0.05 * scanSpeed * (1 + scientistBonus);
      if (this.scanProgress >= 100) {
        this.completeScan();
      }
    }

    if (this.shipManager.state.ftlCharge < 100) {
      this.shipManager.state.ftlCharge = Math.min(100, this.shipManager.state.ftlCharge + delta * 0.02 * (1 + this.crewManager.getSkillBonus('engineering')));
    }

    if (this.eventCooldown > 0) this.eventCooldown -= delta * 0.001;

    this.shipManager.state.crewMorale = this.crewManager.getAverageMorale();

    if (Date.now() - this.state.time.lastSave > 30000) {
      this.save();
    }
  }

  getCurrentSystem(): StarData | null {
    if (!this.shipManager.state.currentSystemId) return null;
    return this.galaxy.getSystem(this.shipManager.state.currentSystemId) || null;
  }

  getNearbySystems(): StarData[] {
    return this.galaxy.getSystemsInRange(this.shipManager.state.position, this.shipManager.state.sensorRange);
  }

  resetGame() {
    SaveSystem.delete();
    localStorage.removeItem('aether_voyager_galaxy_v1');
    localStorage.removeItem('aether_mute');
    location.reload();
  }
}
