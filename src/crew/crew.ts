import { SeededRNG } from '../utils/seedRandom';
import { CrewRole, type CrewMember } from '../core/types';

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Avery', 'Quinn',
  'Sasha', 'Kai', 'Zara', 'Luna', 'Orion', 'Nova', 'Jax', 'Eris', 'Vex', 'Kira',
  'Mira', 'Elian', 'Soren', 'Ilya', 'Asha', 'Ren', 'Hana', 'Emir', 'Yara', 'Dax',
  'Sol', 'Lyra', 'Vega', 'Altair', 'Cass', 'Rex', 'Juno', 'Mara', 'Tess', 'Finn'
];

const LAST_NAMES = [
  'Chen', 'Okafor', 'Petrov', 'Sato', 'Al-Rashid', 'Kim', 'Nakamura', 'Singh',
  'Vance', 'Sterling', 'Quill', 'Wren', 'Hawke', 'Stone', 'Reyes', 'Kovacs',
  'Yamato', 'Volkov', 'Sanchez', 'Okoro', 'Zhang', 'Mbeki', 'Larson', 'Ito',
  'Nova', 'Void', 'Starling', 'Drifter', 'Wanderer', 'Echo', 'Silva', 'Kade'
];

const ORIGINS = [
  'Earth - Luna Colony', 'Mars - Olympus', 'Europa Station', 'Titan Outpost',
  'Kepler-442b', 'Proxima Centauri', 'Vega Prime', 'Ross 128 Habitat',
  'Void Born (Generation Ship)', 'Federation Academy', 'Independent Freighter',
  'Helian Military', 'Scientific Coalition Lab', 'Nomad Fleet'
];

const PERSONALITIES = [
  'Optimistic', 'Pragmatic', 'Curious', 'Stoic', 'Witty', 'Empathetic',
  'Analytical', 'Adventurous', 'Cautious', 'Bold', 'Quiet', 'Charismatic',
  'Loyal', 'Independent', 'Idealistic', 'Cynical'
];

const TRAIT_POOL = [
  'Efficient', 'Lucky', 'Tough', 'Brilliant', 'Quick Learner', 'Resilient',
  'Calm Under Pressure', 'Inspiring', 'Meticulous', 'Resourceful',
  'Xenolinguist', 'Zero-G Expert', 'Botanist', 'Mechanic', 'Medic', 'Survivor',
  'Navigator', 'Diplomat', 'Scavenger', 'Veteran'
];

const BIOS = [
  'Grew up on a mining station. Knows how to fix anything with spare parts and optimism.',
  'Former Federation pilot. Left after seeing what was beyond the border.',
  'Exobiologist who spent 5 years studying void lifeforms. Still hears them sometimes.',
  'Engineer from a generation ship. Can hear when a reactor is unhappy.',
  'Military washout with a conscience. Best shot on the ship, worst at following orders.',
  'Trader who lost everything in a market crash. Now trades in stories and secrets.',
  'Scientist who discovered something she was not supposed to. Now she is here.',
  'Doctor who worked in plague colonies. Nothing shocks them anymore.',
  'Explorer who mapped 3 systems alone. Came back different. Better.',
  'Technician who talks to machines. Machines talk back. It is fine.',
];

function randomSkills(rng: SeededRNG, role: CrewRole) {
  const base = {
    piloting: rng.int(1, 5),
    engineering: rng.int(1, 5),
    science: rng.int(1, 5),
    medical: rng.int(1, 5),
    combat: rng.int(1, 5),
    trading: rng.int(1, 5),
    exploration: rng.int(1, 5),
  };

  // Role bonuses
  switch (role) {
    case CrewRole.Pilot: base.piloting += 4; base.exploration += 2; break;
    case CrewRole.Engineer: base.engineering += 4; base.medical += 1; break;
    case CrewRole.Scientist: base.science += 4; base.exploration += 2; break;
    case CrewRole.Doctor: base.medical += 4; base.science += 2; break;
    case CrewRole.Navigator: base.piloting += 3; base.exploration += 3; break;
    case CrewRole.Security: base.combat += 4; base.piloting += 1; break;
    case CrewRole.Trader: base.trading += 4; base.piloting += 1; break;
    case CrewRole.Explorer: base.exploration += 4; base.science += 2; break;
    case CrewRole.Technician: base.engineering += 3; base.science += 2; break;
    case CrewRole.Captain: base.piloting += 2; base.trading += 2; base.exploration += 2; break;
  }

  // Clamp 1-10
  for (const k of Object.keys(base) as (keyof typeof base)[]) {
    base[k] = Math.min(10, base[k]);
  }

  return base;
}

export function generateCrewMember(rng: SeededRNG, role?: CrewRole, level: number = 1): CrewMember {
  const finalRole = role || rng.pick(Object.values(CrewRole).filter(r => r !== CrewRole.Captain));
  const firstName = rng.pick(FIRST_NAMES);
  const lastName = rng.pick(LAST_NAMES);
  const name = `${firstName} ${lastName}`;

  const skills = randomSkills(rng, finalRole);
  const traits = rng.shuffle(TRAIT_POOL).slice(0, rng.int(1, 3));

  return {
    id: `CREW-${Date.now()}-${rng.int(1000, 9999)}`,
    name,
    role: finalRole,
    level,
    xp: rng.int(0, level * 100),
    skills,
    morale: rng.int(60, 95),
    health: rng.int(80, 100),
    traits,
    personality: rng.pick(PERSONALITIES),
    origin: rng.pick(ORIGINS),
    loyalty: rng.int(40, 90),
    salary: rng.int(50, 200) + level * 20,
    status: 'active',
    bio: rng.pick(BIOS),
  };
}

export function generateStartingCrew(rng: SeededRNG): CrewMember[] {
  const roles: CrewRole[] = [CrewRole.Pilot, CrewRole.Engineer, CrewRole.Scientist, CrewRole.Doctor, CrewRole.Navigator];
  return roles.map(role => generateCrewMember(rng.fork(`crew-${role}`), role, rng.int(2, 4)));
}

export class CrewManager {
  members: CrewMember[];

  constructor(members: CrewMember[]) {
    this.members = members;
  }

  getByRole(role: CrewRole): CrewMember[] {
    return this.members.filter(m => m.role === role);
  }

  getAverageMorale(): number {
    if (this.members.length === 0) return 100;
    return this.members.reduce((s, m) => s + m.morale, 0) / this.members.length;
  }

  getSkillBonus(skill: keyof CrewMember['skills']): number {
    // Sum of top 2 members in that skill, scaled
    const sorted = [...this.members].sort((a, b) => b.skills[skill] - a.skills[skill]);
    const top = sorted.slice(0, 2);
    return top.reduce((s, m) => s + m.skills[skill] * 0.05, 0); // 5% per skill point
  }

  addMember(member: CrewMember) {
    this.members.push(member);
  }

  removeMember(id: string): boolean {
    const idx = this.members.findIndex(m => m.id === id);
    if (idx >= 0) {
      this.members.splice(idx, 1);
      return true;
    }
    return false;
  }

  updateMorale(delta: number, reason: string) {
    for (const member of this.members) {
      member.morale = Math.max(0, Math.min(100, member.morale + delta + (Math.random() - 0.5) * 10));
    }
  }

  injureRandom(rng: SeededRNG, amount: number): CrewMember | null {
    if (this.members.length === 0) return null;
    const member = rng.pick(this.members);
    member.health = Math.max(0, member.health - amount);
    member.status = member.health < 30 ? 'injured' : 'active';
    member.morale = Math.max(0, member.morale - amount * 0.3);
    return member;
  }

  gainXP(role: CrewRole, amount: number) {
    for (const member of this.members.filter(m => m.role === role)) {
      member.xp += amount;
      const needed = member.level * 100;
      if (member.xp >= needed) {
        member.level++;
        member.xp -= needed;
        // Increase random skill
        const skillKeys = Object.keys(member.skills) as (keyof typeof member.skills)[];
        const skill = skillKeys[Math.floor(Math.random() * skillKeys.length)];
        member.skills[skill] = Math.min(10, member.skills[skill] + 1);
      }
    }
  }

  // Event responses
  onSystemScanned() {
    this.gainXP(CrewRole.Scientist, 20);
    this.gainXP(CrewRole.Explorer, 15);
  }

  onPlanetScanned() {
    this.gainXP(CrewRole.Scientist, 25);
    this.gainXP(CrewRole.Explorer, 20);
  }

  onFTLJump() {
    this.gainXP(CrewRole.Pilot, 10);
    this.gainXP(CrewRole.Navigator, 15);
  }

  onTrade() {
    this.gainXP(CrewRole.Trader, 15);
  }

  onRepair() {
    this.gainXP(CrewRole.Engineer, 15);
    this.gainXP(CrewRole.Technician, 10);
  }
}
