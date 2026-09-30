import type { GameEvent, GameEventType } from './types';

type Listener = (event: GameEvent) => void;

export class EventBus {
  private listeners: Map<GameEventType, Set<Listener>> = new Map();
  private globalListeners: Set<Listener> = new Set();
  private history: GameEvent[] = [];
  private maxHistory = 200;

  on(type: GameEventType, fn: Listener): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return () => this.listeners.get(type)!.delete(fn);
  }

  onAny(fn: Listener): () => void {
    this.globalListeners.add(fn);
    return () => this.globalListeners.delete(fn);
  }

  emit(type: GameEventType, data: any = {}): GameEvent {
    const ev: GameEvent = { type, timestamp: Date.now(), data };
    this.history.unshift(ev);
    if (this.history.length > this.maxHistory) this.history.pop();

    this.listeners.get(type)?.forEach(fn => {
      try { fn(ev); } catch (e) { console.error('Event listener error', e); }
    });
    this.globalListeners.forEach(fn => {
      try { fn(ev); } catch (e) { console.error('Global listener error', e); }
    });
    return ev;
  }

  getHistory(): GameEvent[] {
    return [...this.history];
  }

  clear() {
    this.listeners.clear();
    this.globalListeners.clear();
    this.history = [];
  }
}

export const eventBus = new EventBus();
