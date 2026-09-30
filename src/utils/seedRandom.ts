/**
 * Deterministic seeded RNG - Mulberry32 + string hash
 * Critical for procedural galaxy generation that must be reproducible.
 */

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SeededRNG {
  private rng: () => number;
  public seed: number;
  public seedStr: string;

  constructor(seedStr: string) {
    this.seedStr = seedStr;
    this.seed = hashString(seedStr);
    this.rng = mulberry32(this.seed);
  }

  // 0..1
  next(): number {
    return this.rng();
  }

  // min inclusive, max exclusive
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    // min inclusive, max inclusive
    return Math.floor(this.range(min, max + 1));
  }

  bool(prob = 0.5): boolean {
    return this.next() < prob;
  }

  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Fork with derived seed - deterministic child RNG
  fork(suffix: string): SeededRNG {
    return new SeededRNG(`${this.seedStr}::${suffix}`);
  }
}
