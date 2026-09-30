import { SAVE_KEY } from './constants';
import type { GameState } from './types';

export class SaveSystem {
  static save(state: GameState): boolean {
    try {
      const data = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, data);
      return true;
    } catch (e) {
      console.error('Save failed', e);
      return false;
    }
  }

  static load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as GameState;
      // basic version check
      if (!parsed.version) return null;
      return parsed;
    } catch (e) {
      console.error('Load failed', e);
      return null;
    }
  }

  static exists(): boolean {
    return !!localStorage.getItem(SAVE_KEY);
  }

  static delete(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  static export(state: GameState): string {
    return btoa(JSON.stringify(state));
  }

  static import(encoded: string): GameState | null {
    try {
      return JSON.parse(atob(encoded));
    } catch {
      return null;
    }
  }
}
