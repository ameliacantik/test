/**
 * Audio Manager — Ambient, SFX, Music
 * Uses Web Audio API with graceful fallback
 * Design: silence as atmosphere, subtle changes on discovery
 */

export type SoundType = 'ambient' | 'sfx' | 'music';

export interface SoundDef {
  id: string;
  type: SoundType;
  description: string;
  volume: number;
  loop?: boolean;
}

export const SOUNDS: Record<string, SoundDef> = {
  // Ambient
  'engine-hum': { id: 'engine-hum', type: 'ambient', description: 'Low engine hum in deep space', volume: 0.3, loop: true },
  'reactor': { id: 'reactor', type: 'ambient', description: 'Reactor core sound', volume: 0.2, loop: true },
  'life-support': { id: 'life-support', type: 'ambient', description: 'Life support hum', volume: 0.15, loop: true },
  'cosmic-ambience': { id: 'cosmic-ambience', type: 'ambient', description: 'Distant cosmic ambience', volume: 0.1, loop: true },

  // SFX
  'nav-beep': { id: 'nav-beep', type: 'sfx', description: 'Navigation beep', volume: 0.5 },
  'scan-start': { id: 'scan-start', type: 'sfx', description: 'Scan initiation', volume: 0.6 },
  'scan-complete': { id: 'scan-complete', type: 'sfx', description: 'Scan complete', volume: 0.7 },
  'discovery': { id: 'discovery', type: 'sfx', description: 'Discovery found', volume: 0.8 },
  'ftl-charge': { id: 'ftl-charge', type: 'sfx', description: 'FTL charging', volume: 0.6 },
  'ftl-jump': { id: 'ftl-jump', type: 'sfx', description: 'FTL jump', volume: 0.9 },
  'hull-damage': { id: 'hull-damage', type: 'sfx', description: 'Hull damage', volume: 0.8 },
  'trade': { id: 'trade', type: 'sfx', description: 'Trade complete', volume: 0.5 },
  'quest-complete': { id: 'quest-complete', type: 'sfx', description: 'Quest completed', volume: 0.7 },
  'anomaly': { id: 'anomaly', type: 'sfx', description: 'Anomaly detected', volume: 0.6 },

  // Music (stingers, not constant)
  'music-discovery': { id: 'music-discovery', type: 'music', description: 'Discovery stinger', volume: 0.4 },
  'music-mystery': { id: 'music-mystery', type: 'music', description: 'Mystery theme', volume: 0.3 },
  'music-silent-planet': { id: 'music-silent-planet', type: 'music', description: 'Silent planet theme', volume: 0.5 },
};

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private oscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for user interaction
    const savedMute = localStorage.getItem('aether_mute');
    this.isMuted = savedMute === 'true';
  }

  private init() {
    if (this.isInitialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.7;

      this.ambientGain = this.audioContext.createGain();
      this.ambientGain.connect(this.masterGain);
      this.ambientGain.gain.value = 0.5;

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = 0.8;

      this.musicGain = this.audioContext.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = 0.4;

      this.isInitialized = true;
      console.log('Audio initialized');
    } catch (e) {
      console.warn('Web Audio not supported', e);
    }
  }

  // Call on first user interaction
  enable() {
    this.init();
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  mute() {
    this.isMuted = true;
    if (this.masterGain) this.masterGain.gain.value = 0;
    localStorage.setItem('aether_mute', 'true');
  }

  unmute() {
    this.isMuted = false;
    if (this.masterGain) this.masterGain.gain.value = 0.7;
    localStorage.setItem('aether_mute', 'false');
    this.enable();
  }

  toggleMute(): boolean {
    if (this.isMuted) this.unmute();
    else this.mute();
    return this.isMuted;
  }

  // Procedural audio generation (no external files needed for MVP)
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.5, targetGain: GainNode | null = null) {
    if (!this.audioContext || this.isMuted) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;

    osc.connect(gain);
    gain.connect(targetGain || this.sfxGain || this.masterGain!);

    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playAmbientTone(id: string, frequency: number, volume: number = 0.2) {
    if (!this.audioContext || this.isMuted || this.oscillators.has(id)) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(this.ambientGain || this.masterGain!);

    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 2);

    osc.start();
    this.oscillators.set(id, { osc, gain });
  }

  private stopAmbientTone(id: string) {
    const existing = this.oscillators.get(id);
    if (existing && this.audioContext) {
      existing.gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
      setTimeout(() => {
        try { existing.osc.stop(); } catch {}
      }, 1000);
      this.oscillators.delete(id);
    }
  }

  // Public API
  startAmbient() {
    this.enable();
    // Deep space ambience: low hums
    this.playAmbientTone('engine-hum', 55, 0.15); // A1
    setTimeout(() => this.playAmbientTone('reactor', 110, 0.08), 500);
    setTimeout(() => this.playAmbientTone('life-support', 220, 0.05), 1000);
  }

  stopAmbient() {
    this.stopAmbientTone('engine-hum');
    this.stopAmbientTone('reactor');
    this.stopAmbientTone('life-support');
  }

  playSFX(id: string) {
    this.enable();
    if (this.isMuted || !this.audioContext) return;

    switch (id) {
      case 'nav-beep':
        this.playTone(800, 0.1, 'sine', 0.3);
        break;
      case 'scan-start':
        this.playTone(400, 0.3, 'sine', 0.4);
        setTimeout(() => this.playTone(600, 0.3, 'sine', 0.4), 150);
        break;
      case 'scan-complete':
        this.playTone(600, 0.2, 'sine', 0.5);
        setTimeout(() => this.playTone(900, 0.4, 'sine', 0.6), 150);
        break;
      case 'discovery':
        this.playTone(500, 0.2, 'sine', 0.5);
        setTimeout(() => this.playTone(700, 0.2, 'sine', 0.5), 150);
        setTimeout(() => this.playTone(1000, 0.5, 'sine', 0.7), 300);
        break;
      case 'ftl-charge':
        this.playTone(200, 1.0, 'sawtooth', 0.2);
        break;
      case 'ftl-jump':
        this.playTone(100, 0.5, 'sawtooth', 0.8);
        setTimeout(() => this.playTone(800, 1.0, 'sine', 0.6), 200);
        break;
      case 'hull-damage':
        this.playTone(150, 0.8, 'square', 0.7);
        break;
      case 'trade':
        this.playTone(600, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(800, 0.1, 'sine', 0.4), 100);
        break;
      case 'quest-complete':
        this.playTone(400, 0.2, 'sine', 0.5);
        setTimeout(() => this.playTone(600, 0.2, 'sine', 0.5), 200);
        setTimeout(() => this.playTone(800, 0.6, 'sine', 0.7), 400);
        break;
      case 'anomaly':
        this.playTone(300, 0.5, 'sine', 0.4);
        setTimeout(() => this.playTone(350, 0.5, 'sine', 0.3), 250);
        break;
      default:
        this.playTone(440, 0.2, 'sine', 0.3);
    }
  }

  playMusic(id: string) {
    this.enable();
    if (this.isMuted) return;
    // For MVP, music is just special SFX with longer tones
    switch (id) {
      case 'music-discovery':
        this.playTone(300, 2.0, 'sine', 0.2, this.musicGain);
        setTimeout(() => this.playTone(400, 2.0, 'sine', 0.15, this.musicGain), 500);
        setTimeout(() => this.playTone(500, 3.0, 'sine', 0.1, this.musicGain), 1000);
        break;
      case 'music-mystery':
        this.playTone(200, 3.0, 'sine', 0.15, this.musicGain);
        setTimeout(() => this.playTone(210, 3.0, 'sine', 0.12, this.musicGain), 1000);
        setTimeout(() => this.playTone(300, 4.0, 'triangle', 0.08, this.musicGain), 2000);
        break;
      case 'music-silent-planet':
        this.playTone(55, 5.0, 'sine', 0.2, this.musicGain);
        setTimeout(() => this.playTone(110, 5.0, 'sine', 0.1, this.musicGain), 1000);
        setTimeout(() => this.playTone(165, 6.0, 'triangle', 0.08, this.musicGain), 2000);
        break;
    }
  }

  // React to game events
  onGameEvent(type: string) {
    switch (type) {
      case 'DISCOVERY_FOUND':
        this.playSFX('discovery');
        setTimeout(() => this.playMusic('music-discovery'), 500);
        break;
      case 'SYSTEM_SCANNED':
      case 'PLANET_SCANNED':
        this.playSFX('scan-complete');
        break;
      case 'FTL_JUMP':
        this.playSFX('ftl-jump');
        break;
      case 'HULL_DAMAGED':
        this.playSFX('hull-damage');
        break;
      case 'RESOURCE_TRADED':
        this.playSFX('trade');
        break;
      case 'QUEST_COMPLETED':
        this.playSFX('quest-complete');
        break;
      case 'ANOMALY_DETECTED':
        this.playSFX('anomaly');
        this.playMusic('music-mystery');
        break;
    }
  }
}

export const audioManager = new AudioManager();
