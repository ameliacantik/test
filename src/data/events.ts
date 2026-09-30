export interface RandomEventDef {
  id: string;
  title: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'unique';
  flavor: string;
  choices?: { label: string; effect: string }[];
}

export const RANDOM_EVENTS: RandomEventDef[] = [
  {
    id: 'distress_signal',
    title: 'Distress Signal',
    description: 'Faint SOS on emergency band. Source: drifting escape pod, 0.3 LY off your route.',
    rarity: 'common',
    flavor: 'The voice is automated, repeating in three languages. One of them is 200 years out of date.',
    choices: [
      { label: 'Investigate', effect: 'May rescue survivor, gain intel' },
      { label: 'Ignore', effect: 'Conserve fuel and time' },
      { label: 'Scan from distance', effect: 'Low risk, low reward' },
    ]
  },
  {
    id: 'pirate_ambush',
    title: 'Pirate Ambush',
    description: 'Three small signatures decloak. Ion weapons charging. They want your cargo.',
    rarity: 'uncommon',
    flavor: 'Their ships are patched together from a dozen different hulls. Desperation makes them dangerous.',
    choices: [
      { label: 'Evasive maneuvers', effect: 'Uses fuel, may avoid combat' },
      { label: 'Stand your ground', effect: 'Risk hull damage, gain reputation' },
      { label: 'Negotiate', effect: 'Lose resources, keep hull intact' },
    ]
  },
  {
    id: 'unknown_transmission',
    title: 'Unknown Transmission',
    description: 'Tight-beam transmission in non-human language. Mathematical structure, prime sequence, then star map fragment.',
    rarity: 'rare',
    flavor: 'The map points to a system that should not exist. According to charts, there is nothing there.',
    choices: [
      { label: 'Follow coordinates', effect: 'Unlock hidden system' },
      { label: 'Send to Coalition', effect: 'Gain science rep and credits' },
      { label: 'Archive', effect: 'Add to Codex, future opportunity' },
    ]
  },
  {
    id: 'space_storm',
    title: 'Ion Storm',
    description: 'Magnetar flare. Sensor blackout. Navigation systems failing. Shield holding at 60%.',
    rarity: 'common',
    flavor: 'Outside, the void lights up like aurora. Beautiful and deadly.',
    choices: [
      { label: 'Ride it out', effect: 'Shield damage, possible sensor upgrade data' },
      { label: 'Emergency FTL', effect: 'High fuel cost, random destination' },
    ]
  },
  {
    id: 'drifting_survivor',
    title: 'Drifting Survivor',
    description: 'Single life sign in a damaged EVA suit, 12 hours of oxygen left. No ship nearby.',
    rarity: 'uncommon',
    flavor: 'How long has this person been out here?',
    choices: [
      { label: 'Rescue', effect: 'Gain crew member, moral choice' },
      { label: 'Provide supplies', effect: 'Small resource cost, reputation' },
    ]
  },
  {
    id: 'derelict_ship',
    title: 'Derelict Vessel',
    description: 'Helian cruiser, dark, power core cold. Hull markings suggest it has been here for 40 years.',
    rarity: 'rare',
    flavor: 'Logs show the crew abandoned ship in an orderly fashion. No distress call was ever sent.',
    choices: [
      { label: 'Board and investigate', effect: 'Tech salvage, possible danger' },
      { label: 'Salvage from distance', effect: 'Small mineral gain, safe' },
      { label: 'Report location', effect: 'Faction reputation' },
    ]
  },
  {
    id: 'ancient_probe',
    title: 'Ancient Probe',
    description: 'Object of clearly artificial origin, but not human. Carbon dating suggests 12,000 years old.',
    rarity: 'very_rare',
    flavor: 'It is still active. It is watching you. It has not decided if you are interesting yet.',
    choices: [
      { label: 'Attempt contact', effect: 'Major discovery, unknown risk' },
      { label: 'Scan passively', effect: 'Safe discovery' },
      { label: 'Leave it', effect: 'No consequences' },
    ]
  },
  {
    id: 'resource_anomaly',
    title: 'Exotic Resource Anomaly',
    description: 'Sensor spike: dense exotic matter cluster inside asteroid. Unstable but valuable.',
    rarity: 'uncommon',
    flavor: 'The asteroid is singing. Literally. Low-frequency vibration in exotic matter lattice.',
    choices: [
      { label: 'Extract carefully', effect: 'High exotic gain, low risk' },
      { label: 'Extract aggressively', effect: 'Very high gain, risk of explosion' },
    ]
  },
  {
    id: 'faction_patrol',
    title: 'Faction Patrol',
    description: 'Federation patrol requests identification and cargo manifest. Standard procedure.',
    rarity: 'common',
    flavor: 'They are bored. You can tell. This is the most exciting thing to happen on their shift in weeks.',
    choices: [
      { label: 'Comply', effect: 'No effect, maintain reputation' },
      { label: 'Bribe', effect: 'Lose credits, avoid scan' },
    ]
  },
  {
    id: 'wormhole_opening',
    title: 'Wormhole Fluctuation',
    description: 'Temporary Einstein-Rosen bridge. Stable for estimated 4 minutes. Destination unknown.',
    rarity: 'legendary',
    flavor: 'Your science officer is both terrified and ecstatic. This should not be possible here.',
    choices: [
      { label: 'Enter', effect: 'Jump to unknown distant sector, high risk/reward' },
      { label: 'Scan and record', effect: 'Major scientific discovery' },
      { label: 'Avoid', effect: 'Safe' },
    ]
  },
  {
    id: 'strange_biological',
    title: 'Biological Signal',
    description: 'Non-carbon lifeform detected in vacuum. Energy-based entity, size of a shuttle, migrating.',
    rarity: 'very_rare',
    flavor: 'It is not aware of you. Or it is pretending not to be.',
    choices: [
      { label: 'Follow', effect: 'Discovery chain' },
      { label: 'Sample field', effect: 'Organic + research data' },
    ]
  },
  {
    id: 'silent_planet',
    title: 'THE SILENT PLANET',
    description: 'Planet shows active technology, cities, power grid... but zero radio traffic. Complete EM silence. Deliberate?',
    rarity: 'unique',
    flavor: 'From orbit, you can see the lights of cities. All of them on. No movement. No signals. Waiting.',
    choices: [
      { label: 'Land immediately', effect: 'Unique quest chain' },
      { label: 'Orbital scan', effect: 'Begin investigation' },
      { label: 'Quarantine and report', effect: 'Faction response, safe route' },
    ]
  },
];
