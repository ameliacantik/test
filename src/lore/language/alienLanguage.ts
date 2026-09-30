/**
 * Alien Language System v6 — Decode alien language as puzzle
 * Ancient civilization language based on symbols
 */

import { SeededRNG } from '../../utils/seedRandom';
import type { AlienLanguagePuzzle } from '../../core/types';
import { FactionId } from '../../core/types';

const ALIEN_SYMBOLS = ['◈', '⬡', '⬔', '⬓', '◬', '◭', '⬙', '⬗', '⬖', '⬕', '⬔', '⬑', '⬐', '◫', '◧', '◨', '◩', '◪', '⬒', '⬓'];
const ANCIENT_WORDS = [
  { alien: 'KHEPRI-ANOM', human: 'Gateway', symbols: ['◈', '⬡', '◬'] },
  { alien: 'VAULT-SILENT', human: 'The Silent Planet', symbols: ['⬔', '⬓', '◭'] },
  { alien: 'ROAD-OPEN', human: 'Wormhole Network', symbols: ['⬙', '⬗', '⬖'] },
  { alien: 'LEFT-RETURN', human: 'The Ones Who Left', symbols: ['⬕', '⬔', '⬑'] },
  { alien: 'SIGNAL-COUNT', human: 'Countdown Signal', symbols: ['⬐', '◫', '◧'] },
  { alien: 'POD-SLEEP', human: 'Stasis Pods', symbols: ['◨', '◩', '◪'] },
  { alien: 'STAR-MAP', human: 'Star Map', symbols: ['⬒', '◈', '⬡'] },
  { alien: 'VOID-ECHO', human: 'Void Echo', symbols: ['◬', '⬔', '⬓'] },
  { alien: 'ANCIENT-HOME', human: 'Ancient Homeworld', symbols: ['◭', '⬙', '⬗'] },
  { alien: 'DARK-BETWEEN', human: 'Dark Matter', symbols: ['⬖', '⬕', '⬔'] },
  { alien: 'LIGHT-BEYOND', human: 'Beyond Light', symbols: ['⬑', '⬐', '◫'] },
  { alien: 'TIME-LOOP', human: 'Time Loop', symbols: ['◧', '◨', '◩'] },
  { alien: 'MEMORY-STONE', human: 'Memory Stone', symbols: ['◪', '⬒', '⬓'] },
  { alien: 'WATCHER-SEES', human: 'The Watcher', symbols: ['◈', '◬', '⬔'] },
  { alien: 'SING-WHEN', human: 'When It Sings', symbols: ['⬡', '◭', '⬙'] },
];

export class AlienLanguageManager {
  puzzles: Map<string, AlienLanguagePuzzle> = new Map();
  private rng: SeededRNG;
  solvedCount: number = 0;

  constructor(seed: string) {
    this.rng = new SeededRNG(seed + '-language');
    this.generatePuzzles();
  }

  private generatePuzzles() {
    for (let i = 0; i < ANCIENT_WORDS.length; i++) {
      const word = ANCIENT_WORDS[i];
      const difficulty = Math.floor(i / 3) + 1; // 1-5
      
      // Generate distractor symbols
      const allSymbols = [...ALIEN_SYMBOLS];
      const puzzleSymbols = [...word.symbols];
      while (puzzleSymbols.length < 6) {
        const sym = this.rng.pick(allSymbols);
        if (!puzzleSymbols.includes(sym)) puzzleSymbols.push(sym);
      }
      // Shuffle
      for (let j = puzzleSymbols.length - 1; j > 0; j--) {
        const k = Math.floor(this.rng.next() * (j + 1));
        [puzzleSymbols[j], puzzleSymbols[k]] = [puzzleSymbols[k], puzzleSymbols[j]];
      }

      const puzzle: AlienLanguagePuzzle = {
        id: `LANG-${i}-${word.alien}`,
        alienWord: word.alien,
        humanTranslation: word.human,
        symbols: puzzleSymbols,
        difficulty,
        solved: false,
        rewards: {
          codexEntry: `ancient_${word.alien.toLowerCase().replace('-', '_')}`,
          reputation: {
            [FactionId.ScientificCoalition]: difficulty * 5,
            [FactionId.Ancient]: difficulty * 2,
          }
        }
      };

      this.puzzles.set(puzzle.id, puzzle);
    }

    // Load save
    const saved = localStorage.getItem('aether_language');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.solvedCount = data.solvedCount || 0;
        for (const id of data.solved || []) {
          const puzzle = this.puzzles.get(id);
          if (puzzle) puzzle.solved = true;
        }
      } catch {}
    }
  }

  save() {
    localStorage.setItem('aether_language', JSON.stringify({
      solved: Array.from(this.puzzles.values()).filter(p => p.solved).map(p => p.id),
      solvedCount: this.solvedCount,
    }));
  }

  getPuzzle(id: string): AlienLanguagePuzzle | undefined {
    return this.puzzles.get(id);
  }

  getAllPuzzles(): AlienLanguagePuzzle[] {
    return Array.from(this.puzzles.values());
  }

  getUnsolvedPuzzles(): AlienLanguagePuzzle[] {
    return Array.from(this.puzzles.values()).filter(p => !p.solved);
  }

  getSolvedPuzzles(): AlienLanguagePuzzle[] {
    return Array.from(this.puzzles.values()).filter(p => p.solved);
  }

  getAvailablePuzzles(playerLevel: number, hasTranslator: boolean): AlienLanguagePuzzle[] {
    return Array.from(this.puzzles.values()).filter(p => {
      if (p.solved) return false;
      if (p.difficulty > playerLevel) return false;
      if (p.difficulty > 3 && !hasTranslator) return false;
      return true;
    });
  }

  attemptSolve(id: string, guessedSymbols: string[]): { success: boolean; message: string } {
    const puzzle = this.puzzles.get(id);
    if (!puzzle) return { success: false, message: 'Puzzle not found' };
    if (puzzle.solved) return { success: false, message: 'Already solved' };

    // Check if guessed symbols match the correct ones (order matters for Ancient language)
    const correct = ANCIENT_WORDS.find(w => w.alien === puzzle.alienWord);
    if (!correct) return { success: false, message: 'Ancient word not found' };

    // For difficulty 1-2: any order, just need correct symbols
    // For difficulty 3+: exact order
    let success = false;
    if (puzzle.difficulty <= 2) {
      success = correct.symbols.every(s => guessedSymbols.includes(s)) && guessedSymbols.length === correct.symbols.length;
    } else {
      success = guessedSymbols.length === correct.symbols.length && 
                guessedSymbols.every((s, i) => s === correct.symbols[i]);
    }

    if (success) {
      puzzle.solved = true;
      this.solvedCount++;
      this.save();
      return {
        success: true,
        message: `Decoded: ${puzzle.alienWord} = ${puzzle.humanTranslation}. The Ancient language reveals its secrets.`,
      };
    }

    return {
      success: false,
      message: `Incorrect. The symbols do not match. The Ancient language is complex — study the ruins more. Hint: ${correct.symbols.length} symbols, ${puzzle.difficulty <= 2 ? 'any order' : 'exact order required'}.`,
    };
  }

  getProgress(): { solved: number; total: number; percent: number } {
    const total = this.puzzles.size;
    const solved = this.getSolvedPuzzles().length;
    return {
      solved,
      total,
      percent: (solved / total) * 100,
    };
  }

  toJSON() {
    return {
      solved: Array.from(this.puzzles.values()).filter(p => p.solved).map(p => p.id),
      solvedCount: this.solvedCount,
    };
  }

  static fromJSON(data: any, seed: string): AlienLanguageManager {
    const mgr = new AlienLanguageManager(seed);
    if (data) {
      mgr.solvedCount = data.solvedCount || 0;
      for (const id of data.solved || []) {
        const puzzle = mgr.puzzles.get(id);
        if (puzzle) puzzle.solved = true;
      }
    }
    return mgr;
  }
}
