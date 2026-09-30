export type CodexCategory = 'stellar' | 'planetary' | 'species' | 'technology' | 'faction' | 'anomaly' | 'ancient' | 'history' | 'phenomena';

export interface CodexEntry {
  id: string;
  title: string;
  category: CodexCategory;
  description: string;
  longDescription: string;
  image?: string;
  discoveredAt?: number;
  discoveryLocation?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'unique';
  relatedEntries?: string[];
  unlocks?: string[]; // quest IDs, tech, etc.
  data?: Record<string, any>;
}

export const CODEX_ENTRIES: Record<string, CodexEntry> = {
  // Stellar
  'stellar-red-dwarf': {
    id: 'stellar-red-dwarf',
    title: 'Red Dwarf Stars',
    category: 'stellar',
    description: 'Most common stars in the galaxy. Cool, dim, long-lived.',
    longDescription: `Red dwarfs make up 70% of all stars in the galaxy. Despite their dimness, their extreme longevity (trillions of years) makes them stable hosts for planetary systems. Many harbor rocky planets in close orbits. Their frequent flares can be dangerous to unshielded vessels, but their abundance makes them reliable navigation markers.

The AETHER-01's sensors can detect red dwarfs at long range due to their distinct infrared signature. Early explorers called them "the streetlights of the galaxy" — not bright, but always there, guiding the way.`,
    rarity: 'common',
  },
  'stellar-black-hole': {
    id: 'stellar-black-hole',
    title: 'Black Holes',
    category: 'stellar',
    description: 'Singularities where gravity is so strong that light cannot escape.',
    longDescription: `Black holes are the corpses of massive stars, compressed into a point of infinite density. The boundary where escape becomes impossible is called the event horizon. Beyond it, our physics breaks down.

What makes black holes fascinating to explorers is not just their danger, but their utility. Their accretion disks are rich in exotic matter, and their gravitational lensing can reveal distant objects. Some nomad factions use black holes as navigation beacons, and rumors persist of ancient civilizations that learned to extract energy from them.

The AETHER-01's navigation system automatically plots avoidance courses around known black holes, but the truly dangerous ones are those not yet charted.`,
    rarity: 'rare',
  },

  // Planetary
  'planet-earth-like': {
    id: 'planet-earth-like',
    title: 'Earth-like Worlds',
    category: 'planetary',
    description: 'Rare jewels: temperate, breathable, alive.',
    longDescription: `Only 3% of surveyed planets are Earth-like. They require a precise balance: right distance from star, magnetic field, plate tectonics, water, and a stable atmosphere. Finding one is cause for celebration — and careful documentation.

Federation law protects Earth-like worlds from uncontrolled colonization, but enforcement is thin beyond core sectors. Independent colonies, scientific outposts, and sometimes less savory operations spring up quickly once a world is logged.

The presence of an Earth-like world often indicates a stable stellar neighborhood, making nearby systems more likely to harbor interesting phenomena.`,
    rarity: 'rare',
  },

  // Ancient Civilization - Core Mystery
  'ancient-overview': {
    id: 'ancient-overview',
    title: 'The Ancient Civilization',
    category: 'ancient',
    description: 'A precursor civilization that vanished 12,000 years ago. Who were they?',
    longDescription: `We call them "The Ancients" because we have no better name. Their ruins are found on dozens of worlds, their artifacts in debris fields, their signals in the void. Carbon dating and stellar drift analysis suggests they peaked around 12,000 years ago — then disappeared, almost simultaneously, across a region spanning 400 light years.

What we know:
- They were not human, but humanoid. Skeletal remains suggest 2.5m height, elongated limbs, large cranial capacity.
- Their technology was based on exotic matter manipulation and gravitational engineering.
- They built on a scale that dwarfs our own: artificial planets, Dyson swarms (now decayed), and what appears to be a network of wormhole gates.
- Their disappearance was sudden. No signs of war, plague, or natural disaster. One day they were there, the next, gone. Cities left powered, meals left uneaten.

The Scientific Coalition has a standing bounty for any intact Ancient data core. The Nomads whisper that the Ancients didn't disappear — they ascended, or fled, or were taken.

The truth is out there, in the silent places between stars.`,
    rarity: 'legendary',
    relatedEntries: ['ancient-ruins', 'ancient-tech', 'ancient-signal', 'silent-planet'],
  },
  'ancient-ruins': {
    id: 'ancient-ruins',
    title: 'Ancient Ruins',
    category: 'ancient',
    description: 'Non-human structures, 3,000-12,000 years old. Purpose unknown.',
    longDescription: `Ancient ruins share common architectural traits: smooth, seamless construction (no joints or fasteners), materials that resist analysis, and a tendency to be larger inside than outside — suggesting spatial manipulation.

Common features:
- Central chambers with star maps (often pointing to now-empty space)
- Inactive portals (circular, 3-10m diameter, exotic matter residue)
- Data storage in crystalline matrices (mostly unreadable)
- No signs of living quarters, food production, or waste management — as if these were not cities, but machines.

The most disturbing trait: many ruins show signs of sudden abandonment. Tools dropped mid-use, vehicles left powered, doors left open. Whatever happened, it happened fast, and it affected the entire civilization at once.

Your Science Lab can analyze ruin data for research value, but some crew report unease when spending too long in the data.`,
    rarity: 'rare',
    relatedEntries: ['ancient-overview', 'ancient-tech'],
  },
  'ancient-tech': {
    id: 'ancient-tech',
    title: 'Ancient Technology',
    category: 'technology',
    description: 'Fragments of technology far beyond our own. Exotic matter, gravity manipulation.',
    longDescription: `Ancient tech operates on principles we barely understand. Where our FTL drives brute-force space with exotic matter, their gates seem to have negotiated with it. Where our reactors contain fusion, theirs seem to have convinced matter to be energy.

Recovered fragments include:
- **Exotic Matter Lattice:** Self-repairing, negative mass. A single kilogram could power AETHER-01 for a year. Highly unstable outside containment.
- **Gravitational Lens:** Can bend light and, it seems, time. One recovered lens shows star positions from 12,000 years ago.
- **Memory Crystal:** Data storage with capacity in yottabytes. Most are encrypted or corrupted. The few readable fragments contain star charts of regions that don't exist — or don't exist yet.
- **Portal Frame:** Inactive, but still emits low-level exotic particles. The Coalition believes a network of these once connected Ancient space.

Every fragment recovered increases our understanding, but also raises more questions. Who were they? Where did they go? And why do some of their star maps point to your current location?`,
    rarity: 'very_rare',
    relatedEntries: ['ancient-overview', 'ancient-ruins'],
    unlocks: ['tech-exotic-manipulation'],
  },
  'ancient-signal': {
    id: 'ancient-signal',
    title: 'The Ancient Signal',
    category: 'anomaly',
    description: 'Narrow-band transmission with mathematical structure. 12,000 years old, still broadcasting.',
    longDescription: `The signal was first detected by an automated listening post in 2147. It has been broadcasting, without interruption, for at least 12,000 years. That alone is impossible — no known power source lasts that long.

The signal structure:
1. Prime numbers (2, 3, 5, 7, 11, 13...) — universal greeting
2. Mathematical constants (π, e, φ) — confirms intelligence
3. Star map — points to a region in the galactic halo, 400 LY beyond charted space
4. A countdown — currently at 73.2% and decreasing. At current rate, reaches zero in ~47 years.
5. A warning? Or an invitation? The final segment is untranslatable. Xenolinguists describe it as "a feeling of falling, and of being watched, and of something vast waking up."

The signal's origin is a rogue planet, no star, designated LV-426? No, that's from old fiction. Official designation: ANOM-8472, "The Silent Planet."

You have not been to ANOM-8472. But your navigation system has started plotting courses that pass near it, even when you don't ask it to.`,
    rarity: 'unique',
    relatedEntries: ['ancient-overview', 'silent-planet', 'wormhole-network'],
    unlocks: ['quest-silent-planet'],
  },
  'silent-planet': {
    id: 'silent-planet',
    title: 'The Silent Planet — ANOM-8472',
    category: 'anomaly',
    description: 'Planet shows active technology, cities, power grid... but zero radio traffic. Complete EM silence.',
    longDescription: `From orbit, ANOM-8472 looks alive. City lights on the night side, power grid active, atmospheric composition suggests industry. But the radio spectrum is dead silent. No broadcasts, no radar, no leakage. Deliberate? Or something else?

Orbital scans reveal:
- Cities are intact, but no movement. No vehicles, no aircraft, no people visible at this resolution.
- Power consumption is constant, not diurnal. As if something is running, but not inhabited.
- The Ancient signal originates from a structure at the south pole — a tower, 2km tall, emitting the 12,000-year broadcast.
- Surrounding the tower: a field of what appear to be... pods? Or eggs? Or ships? 3,000+ identical objects, each 10m long, arranged in concentric circles.
- The planet's magnetic field is artificial, generated by a network of satellites. It's containing something. Or protecting something.

Every faction wants to know what's down there. Federation wants to quarantine, Coalition wants to study, Empire wants to secure, Traders want to loot, Nomads... Nomads avoid the system entirely. They say it's a graveyard, and graveyards should not be disturbed.

Your crew is split. Science wants to land. Security wants to nuke from orbit. Engineering wants to salvage the power grid. The choice is yours, Captain. But choose quickly — the countdown is at 73.2%.

And something on the surface just powered on. It noticed your scan.`,
    rarity: 'unique',
    relatedEntries: ['ancient-signal', 'ancient-overview'],
    unlocks: ['quest-silent-planet-landing', 'quest-silent-planet-quarantine', 'quest-silent-planet-study'],
  },
  'wormhole-network': {
    id: 'wormhole-network',
    title: 'The Wormhole Network',
    category: 'phenomena',
    description: 'Evidence of an ancient network of artificial wormholes. Most are collapsed.',
    longDescription: `The Ancients didn't just use wormholes — they built them. Analysis of gravitational anomalies suggests a network of at least 50 gates once connected their territory, allowing instantaneous travel across hundreds of light years.

Most gates are now dead, their exotic matter decayed, their frames cold. But a few show residual energy. One, in particular, near ANOM-8472, shows increasing activity correlated with the signal countdown.

If the network could be reactivated... The implications are staggering. Instant travel across the galaxy. Or instant invasion, if something is on the other side.

The Nomads have a legend: "When the silent planet sings, the roads will open again. And what left will return."

Your Navigation officer has started having dreams about roads in the void. You should probably talk to Medical.`,
    rarity: 'legendary',
    relatedEntries: ['ancient-signal', 'ancient-tech'],
  },

  // Factions deep lore
  'faction-nomad-secret': {
    id: 'faction-nomad-secret',
    title: 'The Nomad Secret',
    category: 'faction',
    description: 'Void Nomads know more about the Ancients than they admit.',
    longDescription: `The Nomads are not just wanderers. They are custodians.

Their generation ships are old — some predate the Federation. Their oral history contains star charts that match Ancient maps, and their language contains loanwords from Ancient script.

What they know, and won't say:
- The Ancients didn't disappear. They left. Deliberately.
- The wormhole network wasn't just transport. It was an escape route.
- Something was coming. Something that hunts civilizations that grow too loud, too bright, too networked.
- The Nomads' endless wandering is not tradition. It's survival strategy. Keep moving, stay quiet, don't build anything that can be seen from far away.

One Nomad elder, when asked about ANOM-8472, said: "We do not go there because we remember what happened the last time someone answered the signal."

When pressed, she showed a scar on her forearm: a perfect circle, 3cm diameter, with symbols around the edge. "My grandmother went to the silent planet. She came back without her ship, without her crew, and without 12 years of memory. She had this. She never spoke again."

The scar is warm to the touch, and sometimes, faintly, it pulses in time with the Ancient signal.`,
    rarity: 'very_rare',
    relatedEntries: ['ancient-overview', 'faction-nomad'],
  },

  // Phenomena
  'phenomena-void-echo': {
    id: 'phenomena-void-echo',
    title: 'Void Echoes',
    category: 'phenomena',
    description: 'Energy-based entities that live in vacuum. Migrating, possibly intelligent.',
    longDescription: `Void Echoes are not life as we know it. They are coherent energy patterns, kilometers across, that drift between stars. They seem to feed on stellar radiation and exotic matter fluctuations.

They are usually harmless, even beautiful — auroras in deep space. But they react to FTL jumps and active scans. Some explorers report that Echoes follow ships, or that they change course to intercept.

The Scientific Coalition classifies them as "potentially intelligent, non-communicative." The Nomads call them "the Shepherds" and say they are drawn to civilizations that are about to... change.

One Echo was observed near ANOM-8472. It was larger than any previously recorded — 400km across — and it was stationary, facing the planet, as if watching. Or waiting.

Your Comms officer reports hearing whispers on empty channels. Static that almost sounds like voices. Almost.`,
    rarity: 'rare',
  },
};

export class CodexManager {
  private entries: Map<string, CodexEntry> = new Map();
  private unlocked: Set<string> = new Set();

  constructor(initialUnlocked: string[] = []) {
    // Load all entries
    for (const entry of Object.values(CODEX_ENTRIES)) {
      this.entries.set(entry.id, entry);
    }
    for (const id of initialUnlocked) {
      this.unlocked.add(id);
    }
  }

  unlock(id: string): boolean {
    if (this.entries.has(id) && !this.unlocked.has(id)) {
      const entry = this.entries.get(id)!;
      entry.discoveredAt = Date.now();
      this.unlocked.add(id);
      // Unlock related if common
      if (entry.relatedEntries) {
        for (const relatedId of entry.relatedEntries) {
          const related = this.entries.get(relatedId);
          if (related && related.rarity === 'common' && !this.unlocked.has(relatedId)) {
            this.unlock(relatedId);
          }
        }
      }
      return true;
    }
    return false;
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  getEntry(id: string): CodexEntry | undefined {
    return this.entries.get(id);
  }

  getUnlockedEntries(): CodexEntry[] {
    return Array.from(this.unlocked).map(id => this.entries.get(id)!).filter(Boolean);
  }

  getByCategory(category: CodexCategory): CodexEntry[] {
    return this.getUnlockedEntries().filter(e => e.category === category);
  }

  getAllCategories(): CodexCategory[] {
    return [...new Set(this.getUnlockedEntries().map(e => e.category))];
  }

  search(query: string): CodexEntry[] {
    const q = query.toLowerCase();
    return this.getUnlockedEntries().filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  }

  getProgress(): { unlocked: number; total: number; percent: number } {
    const total = this.entries.size;
    const unlocked = this.unlocked.size;
    return { unlocked, total, percent: (unlocked / total) * 100 };
  }

  toJSON() {
    return {
      unlocked: Array.from(this.unlocked),
    };
  }

  static fromJSON(data: any): CodexManager {
    const manager = new CodexManager();
    manager.unlocked = new Set(data.unlocked || []);
    // Ensure all entries loaded
    for (const entry of Object.values(CODEX_ENTRIES)) {
      manager.entries.set(entry.id, entry);
    }
    return manager;
  }
}
