import { GameEngine } from '../core/engine';
import { GalaxyRenderer } from '../render/galaxyRenderer';
import { GalaxyWebGLRenderer } from '../render/webgl/galaxyWebGL';
import { SystemRenderer } from '../render/systemRenderer';
import { StarfieldRenderer } from '../render/starfield';
import { ParticleSystem, FTLEffect } from '../render/effects/particles';
import { PlanetSurfaceRenderer } from '../render/planet/planetSurface';
import { CockpitHUD } from '../render/cockpit/cockpit';
import { eventBus } from '../core/eventBus';
import { SystemDiscoveryState, ResourceType, ModuleType, QuestStatus } from '../core/types';
import { STAR_TYPES } from '../data/starTypes';
import { PLANET_TYPES } from '../data/planetTypes';
import { FACTIONS } from '../data/factions';
import { RESOURCES } from '../data/resources';
import { MODULE_DEFS } from '../data/modules';
import { audioManager } from '../audio/audioManager';
import { CODEX_ENTRIES } from '../lore/codex';

export class App {
  engine: GameEngine;
  galaxyRenderer!: GalaxyRenderer;
  galaxyWebGLRenderer!: GalaxyWebGLRenderer;
  systemRenderer!: SystemRenderer;
  starfieldRenderer!: StarfieldRenderer;
  particleSystem!: ParticleSystem;
  ftlEffect!: FTLEffect;
  planetSurfaceRenderer!: PlanetSurfaceRenderer;
  cockpitHUD!: CockpitHUD;

  root: HTMLElement;
  galaxyCanvas!: HTMLCanvasElement;
  galaxyWebGLCanvas!: HTMLCanvasElement;
  systemCanvas!: HTMLCanvasElement;
  starfieldCanvas!: HTMLCanvasElement;
  particleCanvas!: HTMLCanvasElement;
  ftlCanvas!: HTMLCanvasElement;
  planetSurfaceCanvas!: HTMLCanvasElement;
  overlayCanvas!: HTMLCanvasElement;

  useWebGL: boolean = true;
  cockpitEnabled: boolean = false;
  planetSurfaceActive: boolean = false;

  currentView: 'galaxy' | 'system' | 'ship' | 'crew' | 'quests' | 'story' | 'combat' | 'crafting' | 'research' | 'wormhole' | 'language' = 'galaxy';
  rightView: 'details' | 'market' | 'factions' | 'discoveries' | 'lore' | 'resources' | 'log' | 'world' | 'combat' | 'crafting' | 'research' | 'wormhole' | 'language' = 'details';
  selectedSystemId: string | null = null;
  selectedPlanetId: string | null = null;
  selectedStationId: string | null = null;
  selectedCodexId: string | null = null;

  private tooltipEl!: HTMLElement;
  private scanOverlay: HTMLElement | null = null;
  private rendererOverlayCanvas!: HTMLCanvasElement;

  constructor(root: HTMLElement) {
    this.root = root;
    this.engine = new GameEngine();
    this.selectedSystemId = this.engine.shipManager.state.currentSystemId;

    this.buildDOM();
    this.initRenderers();
    this.bindEvents();
    this.startLoop();
    this.updateAll();
  }

  private buildDOM() {
    const storyProgress = this.engine.storyManager.getProgress();
    this.root.innerHTML = `
      <canvas class="starfield" id="starfield"></canvas>
      <canvas class="particle-canvas" id="particle-canvas" style="position:absolute;inset:0;z-index:2;pointer-events:none;"></canvas>
      <canvas class="ftl-canvas" id="ftl-canvas" style="position:absolute;inset:0;z-index:30;pointer-events:none;"></canvas>

      <div class="intro-screen" id="intro" style="background:radial-gradient(ellipse at 30% 20%, rgba(0,229,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(255,176,0,0.06) 0%, transparent 50%), var(--bg-0);position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,229,255,0.015) 3px);pointer-events:none;"></div>
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.8) 100%);pointer-events:none;"></div>
        <div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;max-width:720px;padding:40px 24px;text-align:center;">
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
            <div class="logo-mark" style="width:56px;height:56px;"></div>
            <div style="text-align:left;">
              <div style="font-family:'Space Grotesk', sans-serif;font-weight:700;font-size:11px;letter-spacing:0.35em;color:var(--cyan);">DEEP SPACE EXPLORATION VESSEL</div>
              <div style="font-family:'Space Grotesk', sans-serif;font-weight:700;font-size:28px;letter-spacing:-0.02em;color:var(--text-1);line-height:1;text-shadow:0 0 30px rgba(0,229,255,0.2);">AETHER VOYAGER</div>
              <div style="font-size:8px;letter-spacing:0.25em;color:var(--text-3);margin-top:4px;">CLASS-7 • TRUE SCALE 50,000 LY • SEED ${this.engine.galaxy.seed}</div>
            </div>
          </div>
          <div style="width:100%;height:1px;background:linear-gradient(90deg, transparent, var(--border-2), transparent);margin-bottom:24px;"></div>
          <div style="font-family:'Share Tech Mono', monospace;font-size:10px;letter-spacing:0.15em;color:var(--amber);margin-bottom:12px;">MISSION LOG • DAY ${this.engine.state.time.day} • ${storyProgress.currentTitle}</div>
          <div style="font-size:13px;line-height:1.8;color:var(--text-2);margin-bottom:28px;text-align:left;background:linear-gradient(180deg, rgba(255,255,255,0.02), transparent);border:1px solid var(--border-1);border-left:2px solid var(--cyan);padding:16px 18px;clip-path:var(--panel-cut-sm);">
            <div style="color:var(--cyan);font-weight:700;font-size:9px;letter-spacing:0.2em;margin-bottom:8px;">CAPTAIN'S BRIEFING</div>
            Kamu mengendalikan <span style="color:var(--text-1);font-weight:700;">AETHER-01</span>, kapal eksplorasi deep-space besar — rumah, lab, markas, dan karakter kedua dalam cerita.<br><br>
            Galaxy ini <span style="color:var(--amber);">50.000 tahun cahaya</span> diameter, seperti Milky Way asli. 10.000 sectors, ~20.000 sistem, tapi hanya generate di sekitarmu. 70-90% void kosong — seperti luar angkasa sungguhan.<br><br>
            <span style="color:#d8b4fe;font-style:italic;">"Di sini saya berada di ujung galaksi. Saya melihat kehampaan luas, dan di dalamnya, cahaya kecil yang belum pernah saya datangi. Saya tidak tahu apa itu. Keputusan saya mungkin mengubah sesuatu."</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;width:100%;margin-bottom:24px;">
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);text-align:left;">
              <div style="font-size:7px;letter-spacing:0.18em;color:var(--text-3);">SYSTEMS MAPPED</div>
              <div style="font-size:14px;font-weight:700;color:var(--text-1);font-variant-numeric:tabular-nums;">${this.engine.state.player.systemsVisited}</div>
            </div>
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);text-align:left;">
              <div style="font-size:7px;letter-spacing:0.18em;color:var(--text-3);">DISCOVERIES</div>
              <div style="font-size:14px;font-weight:700;color:var(--cyan);font-variant-numeric:tabular-nums;">${this.engine.state.player.discoveries}</div>
            </div>
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);text-align:left;">
              <div style="font-size:7px;letter-spacing:0.18em;color:var(--text-3);">CHAPTER</div>
              <div style="font-size:14px;font-weight:700;color:#d8b4fe;">${storyProgress.chapter}/${storyProgress.total}</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
            <button class="btn btn-primary" id="btn-start" style="padding:12px 24px;font-size:10px;">▶ BEGIN VOYAGE — ENTER THE VOID</button>
            <button class="btn" id="btn-load" style="display:none;padding:12px 20px;">CONTINUE LAST VOYAGE</button>
            <button class="btn" id="btn-audio-toggle" style="padding:12px 16px;">🔊 Audio: ${localStorage.getItem('aether_mute') === 'true' ? 'OFF' : 'ON'}</button>
          </div>
          <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;font-size:8px;color:var(--text-4);letter-spacing:0.12em;">
            <span>SEED: ${this.engine.galaxy.seed}</span>
            <span>•</span>
            <span>${this.engine.galaxy.getAllSystems().length} SYSTEMS IN MEMORY</span>
            <span>•</span>
            <span>${this.engine.galaxy.getAllSectors().length} SECTORS</span>
            <span>•</span>
            <span>LVL ${this.engine.state.player.level}</span>
          </div>
        </div>
        </div>
      </div>

      <div class="topbar">
        <div class="logo">
          <div class="logo-mark"></div>
          <div>
            <div class="logo-text">AETHER VOYAGER</div>
            <div class="logo-sub">DEEP SPACE EXPLORATION • V6</div>
          </div>
          <div style="margin-left:14px;display:flex;gap:6px;align-items:center;">
            <span style="font-size:7px;background:rgba(0,229,255,0.12);border:1px solid rgba(0,229,255,0.25);color:var(--cyan);padding:2px 5px;letter-spacing:0.15em;">CLASS-7</span>
            <span style="font-size:7px;background:rgba(216,180,254,0.12);border:1px solid rgba(216,180,254,0.25);color:#d8b4fe;padding:2px 5px;letter-spacing:0.15em;">STORY MODE</span>
          </div>
        </div>
        <div style="display:flex;gap:0;align-items:stretch;height:100%;border-left:1px solid var(--border-1);margin-left:18px;">
          <div style="padding:0 14px;display:flex;flex-direction:column;justify-content:center;gap:2px;border-right:1px solid var(--border-1);">
            <div style="font-size:7px;letter-spacing:0.2em;color:var(--text-3);text-transform:uppercase;">Vessel</div>
            <div style="font-size:10px;font-weight:700;color:var(--text-1);letter-spacing:0.04em;">${this.engine.shipManager.state.name}</div>
          </div>
          <div style="padding:0 12px;display:flex;flex-direction:column;justify-content:center;gap:2px;border-right:1px solid var(--border-1);background:linear-gradient(180deg, rgba(0,229,255,0.03), transparent);">
            <div style="font-size:7px;letter-spacing:0.2em;color:var(--text-3);">Level • Credits • Day</div>
            <div style="font-size:10px;font-weight:700;color:var(--cyan);">LVL ${this.engine.state.player.level} • ${this.engine.state.player.credits.toLocaleString()} CR • DAY ${this.engine.state.time.day}</div>
          </div>
          <div style="padding:0 12px;display:flex;flex-direction:column;justify-content:center;gap:2px;max-width:280px;overflow:hidden;">
            <div style="font-size:7px;letter-spacing:0.2em;color:#d8b4fe;text-transform:uppercase;">Chapter ${storyProgress.chapter}/${storyProgress.total}</div>
            <div style="font-size:9px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:0.02em;">${storyProgress.currentTitle}</div>
          </div>
        </div>
        <div class="ship-status">
          <div class="status-item" id="status-hull"><span class="status-label">Hull Integrity</span><div class="status-bar"><div class="status-bar-fill hull" id="bar-hull" style="width:100%"></div></div><span class="status-value" id="val-hull">100%</span></div>
          <div class="status-item" id="status-shield"><span class="status-label">Shield Core</span><div class="status-bar"><div class="status-bar-fill shield" id="bar-shield" style="width:100%"></div></div><span class="status-value" id="val-shield">100%</span></div>
          <div class="status-item" id="status-fuel"><span class="status-label">Fuel Reserve</span><div class="status-bar"><div class="status-bar-fill fuel" id="bar-fuel" style="width:80%"></div></div><span class="status-value" id="val-fuel">800</span></div>
          <div class="status-item" id="status-power"><span class="status-label">Reactor Power</span><div class="status-bar"><div class="status-bar-fill power" id="bar-power" style="width:80%"></div></div><span class="status-value" id="val-power">800</span></div>
          <div class="status-item"><span class="status-label">FTL Charge</span><span class="status-value" id="val-ftl" style="color:var(--cyan)">100%</span></div>
          <div class="status-item"><span class="status-label">Location</span><span class="status-value" id="val-loc" style="font-size:9px;">—</span></div>
          <div class="status-item" style="min-width:56px;justify-content:center;align-items:center;padding:0 8px;">
            <button class="btn btn-small" id="btn-mute" style="padding:5px 8px;min-width:32px;">${localStorage.getItem('aether_mute') === 'true' ? '🔇' : '🔊'}</button>
          </div>
        </div>
      </div>

      <div class="main">
        <div class="sidebar-left">
          <div class="tabs">
            <div class="tab active" data-view="galaxy">Galaxy</div>
            <div class="tab" data-view="system">System</div>
            <div class="tab" data-view="ship">Ship</div>
            <div class="tab" data-view="crew">Crew</div>
            <div class="tab" data-view="quests">Quests</div>
            <div class="tab" data-view="story">Story</div>
            <div class="tab" data-view="combat">Combat</div>
            <div class="tab" data-view="crafting">Craft</div>
            <div class="tab" data-view="research">Research</div>
            <div class="tab" data-view="wormhole">Wormhole</div>
            <div class="tab" data-view="language">Lang</div>
          </div>
          <div class="panel" id="panel-left"></div>
          <div class="action-bar" id="action-bar-left"></div>
        </div>

        <div class="center-view" id="center-view">
          <div class="galaxy-map-container" id="galaxy-map-container" style="display:block;">
            <canvas class="galaxy-canvas" id="galaxy-canvas"></canvas>
            <div class="cockpit-hud">
              <div class="cockpit-frame"></div>
              <div class="cockpit-vignette"></div>
            </div>
            <div class="ftl-overlay" id="ftl-overlay"></div>
            <div id="scan-pulse-container" style="position:absolute;inset:0;pointer-events:none;z-index:11;"></div>
            <div class="map-controls">
              <button class="map-btn" id="btn-zoom-in" title="Zoom In">+</button>
              <button class="map-btn" id="btn-zoom-out" title="Zoom Out">−</button>
              <button class="map-btn" id="btn-center" title="Center Ship">◉</button>
              <button class="map-btn" id="btn-particles" title="Toggle particles">✦</button>
            </div>
            <div class="map-legend">
              <div style="font-weight:700;margin-bottom:8px;letter-spacing:0.18em;font-size:8px;color:var(--cyan);">NAVIGATION LEGEND</div>
              <div class="legend-item"><div class="legend-dot" style="background:#ffdd55"></div> Yellow Sequence</div>
              <div class="legend-item"><div class="legend-dot" style="background:#ff6b4a"></div> Red Dwarf • M-Type</div>
              <div class="legend-item"><div class="legend-dot" style="background:#5aa0ff"></div> Blue Giant • O-Type</div>
              <div class="legend-item"><div class="legend-dot" style="background:#000;border:1px solid #a0a0ff"></div> Black Hole • Singularity</div>
              <div class="legend-item"><div class="legend-dot" style="background:#fff;box-shadow:0 0 8px white;"></div> AETHER-01 • Your Position</div>
              <div class="legend-item"><div class="legend-dot" style="background:#d8b4fe;"></div> Wormhole • Ancient Gate</div>
              <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-1);color:var(--text-3);font-size:8px;line-height:1.5;letter-spacing:0.06em;">
                DRAG PAN • SCROLL ZOOM<br>
                CLICK SYSTEM → INSPECT<br>
                SCAN REVEALS HIDDEN<br>
                TRUE SCALE 50k LY
              </div>
            </div>
            <div style="position:absolute;top:14px;right:14px;background:linear-gradient(180deg, rgba(10,18,34,0.92), rgba(6,11,22,0.92));border:1px solid var(--border-1);padding:10px 12px;clip-path:var(--panel-cut-sm);font-size:9px;z-index:10;min-width:200px;backdrop-filter:blur(8px);box-shadow:0 4px 20px rgba(0,0,0,0.5);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-weight:700;letter-spacing:0.18em;font-size:8px;color:#d8b4fe;">MAIN SEQUENCE</div>
                <div style="font-size:7px;background:rgba(216,180,254,0.15);border:1px solid rgba(216,180,254,0.25);padding:1px 4px;color:#d8b4fe;">CH ${storyProgress.chapter}/${storyProgress.total}</div>
              </div>
              <div style="font-size:10px;font-weight:600;color:var(--text-1);margin-bottom:6px;letter-spacing:0.02em;line-height:1.3;">${storyProgress.currentTitle}</div>
              <div style="width:100%;height:2px;background:rgba(255,255,255,0.06);overflow:hidden;margin-bottom:8px;position:relative;"><div style="width:${storyProgress.percent}%;height:100%;background:linear-gradient(90deg, #d8b4fe, var(--cyan));box-shadow:0 0 6px rgba(216,180,254,0.4);"></div></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:8px;color:var(--text-3);letter-spacing:0.06em;">
                <div>DISC: ${this.engine.state.player.discoveries}</div>
                <div>SYS: ${this.engine.state.player.systemsVisited}</div>
                <div>CODEX: ${this.engine.codexManager.getProgress().unlocked}</div>
                <div>DAY: ${this.engine.state.time.day}</div>
              </div>
            </div>
          </div>
          <div class="system-view" id="system-view-container" style="display:none;">
            <div class="system-header">
              <div class="system-name" id="system-name">—</div>
              <div class="system-meta" id="system-meta"></div>
            </div>
            <div class="system-canvas-container">
              <canvas class="system-canvas" id="system-canvas"></canvas>
              <div class="cockpit-hud" style="opacity:0.2;">
                <div class="cockpit-frame"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar-right">
          <div class="tabs">
            <div class="tab active" data-rview="details">Details</div>
            <div class="tab" data-rview="market">Market</div>
            <div class="tab" data-rview="factions">Factions</div>
            <div class="tab" data-rview="lore">Lore</div>
            <div class="tab" data-rview="discoveries">Codex</div>
            <div class="tab" data-rview="world">World</div>
            <div class="tab" data-rview="resources">Cargo</div>
            <div class="tab" data-rview="log">Log</div>
            <div class="tab" data-rview="combat">Combat</div>
            <div class="tab" data-rview="crafting">Craft</div>
            <div class="tab" data-rview="research">Research</div>
            <div class="tab" data-rview="wormhole">Wormhole</div>
            <div class="tab" data-rview="language">Lang</div>
          </div>
          <div class="panel" id="panel-right"></div>
          <div class="action-bar" id="action-bar-right"></div>
        </div>
      </div>

      <div class="tooltip" id="tooltip"></div>

      <div class="modal-overlay" id="modal-overlay">
        <div class="modal" style="max-width:640px;">
          <div class="modal-header"><div class="modal-title" id="modal-title">Title</div><div class="modal-close" id="modal-close">✕</div></div>
          <div class="modal-body" id="modal-body"></div>
          <div class="modal-footer" id="modal-footer"></div>
        </div>
      </div>
    `;

    this.galaxyCanvas = this.root.querySelector('#galaxy-canvas') as HTMLCanvasElement;
    this.systemCanvas = this.root.querySelector('#system-canvas') as HTMLCanvasElement;
    this.starfieldCanvas = this.root.querySelector('#starfield') as HTMLCanvasElement;
    this.particleCanvas = this.root.querySelector('#particle-canvas') as HTMLCanvasElement;
    this.ftlCanvas = this.root.querySelector('#ftl-canvas') as HTMLCanvasElement;
    this.tooltipEl = this.root.querySelector('#tooltip') as HTMLElement;

    // v5: Create WebGL canvas dynamically
    const galaxyContainer = this.root.querySelector('#galaxy-map-container') as HTMLElement;
    this.galaxyWebGLCanvas = document.createElement('canvas');
    this.galaxyWebGLCanvas.id = 'galaxy-webgl-canvas';
    this.galaxyWebGLCanvas.className = 'galaxy-webgl-canvas';
    galaxyContainer.insertBefore(this.galaxyWebGLCanvas, this.galaxyCanvas);

    // Overlay canvas for WebGL scale bar + stats
    this.rendererOverlayCanvas = document.createElement('canvas');
    this.rendererOverlayCanvas.id = 'renderer-overlay';
    this.rendererOverlayCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:12;';
    galaxyContainer.appendChild(this.rendererOverlayCanvas);

    // Planet surface overlay
    const planetOverlay = document.createElement('div');
    planetOverlay.id = 'planet-surface-overlay';
    planetOverlay.className = 'planet-surface-overlay';
    planetOverlay.innerHTML = `
      <div class="planet-surface-header">
        <div class="planet-surface-info">
          <div class="planet-surface-title" id="planet-surface-title">Planet Surface</div>
          <div class="planet-surface-meta" id="planet-surface-meta">3D Landing View</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-small" id="btn-planet-surface-close">✕ Close</button>
        </div>
      </div>
      <canvas class="planet-surface-canvas" id="planet-surface-canvas"></canvas>
      <div class="planet-surface-hud">
        <div style="font-size:11px;color:var(--text-dim);">WASD to look around • Mouse drag to orbit • Scroll to zoom • ESC to exit</div>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <button class="btn btn-small" id="btn-collect-samples">🧪 Collect Samples</button>
          <button class="btn btn-primary btn-small" id="btn-return-orbit">🚀 Return to Orbit</button>
        </div>
      </div>
    `;
    document.body.appendChild(planetOverlay);
    this.planetSurfaceCanvas = planetOverlay.querySelector('#planet-surface-canvas') as HTMLCanvasElement;

    // Renderer toggle
    const rendererToggle = document.createElement('div');
    rendererToggle.className = 'renderer-toggle';
    rendererToggle.innerHTML = `
      <button class="renderer-btn ${this.useWebGL ? 'active' : ''}" id="btn-renderer-webgl">WEBGL 100K STARS</button>
      <button class="renderer-btn ${!this.useWebGL ? 'active' : ''}" id="btn-renderer-canvas">CANVAS2D</button>
      <button class="renderer-btn" id="btn-cockpit-toggle">COCKPIT</button>
      <button class="renderer-btn" id="btn-star-count">1M STARS</button>
    `;
    galaxyContainer.appendChild(rendererToggle);

    // Load saved renderer preference
    const savedRenderer = localStorage.getItem('aether_renderer');
    if (savedRenderer) {
      this.useWebGL = savedRenderer === 'webgl';
    }
    const savedStars = localStorage.getItem('aether_starcount');
    const initialStarCount = savedStars === '1m' ? 1000000 : 100000;

    // Update intro for v5
    const intro = this.root.querySelector('#intro') as HTMLElement;
    const introTitle = intro.querySelector('.intro-subtitle') as HTMLElement;
    if (introTitle) {
      introTitle.textContent = `v5.0 — WEBGL 100K STARS • VOLUMETRIC NEBULAE • COCKPIT • PLANET LANDING 3D • TRUE SCALE 50K LY`;
    }
    const introText = intro.querySelector('.intro-text') as HTMLElement;
    if (introText) {
      introText.innerHTML = `
        <strong style="color:#5aa0ff">NEW IN v5 — WEBGL:</strong> 100.000 bintang dengan shader twinkle + additive blending, volumetric nebulae dengan noise FBM, black hole dengan photon ring lensing, ship dengan engine trail particles. Semua di-render dengan Three.js OrthographicCamera untuk performa 60fps.<br><br>
        <strong style="color:#d8b4fe">COCKPIT:</strong> HUD immersive seperti di dalam kapal — crosshair, horizon, compass, fuel/shield/hull bars, sensor/FTL indicators. Rasakan menjadi pilot, bukan hanya observer.<br><br>
        <strong style="color:#4ade80">PLANET LANDING 3D:</strong> Saat landing, lihat permukaan planet dalam 3D — terrain procedural berdasarkan tipe planet (desert dunes, ice cracks, volcanic craters, crystal spikes, ancient ruins), atmosphere shader, dust particles, life forms. Setiap planet unik.<br><br>
        <strong style="color:var(--accent-2)">TRUE SCALE v4 tetap ada:</strong> 50k LY, infinite streaming, 70-90% void kosong, spiral arms, sector LOD. WebGL membuatnya terasa lebih nyata — 1px = LY, kamu adalah titik kecil di lautan bintang.<br><br>
        <em>"Luar angkasa bukan peta. Ini adalah tempat. Dan kamu ada di dalamnya."</em>
      `;
    }

    const btnStart = this.root.querySelector('#btn-start') as HTMLElement;
    const btnLoad = this.root.querySelector('#btn-load') as HTMLElement;
    const hasSave = localStorage.getItem('aether_voyager_save_v1');
    if (hasSave) btnLoad.style.display = 'inline-flex';
    const hideIntro = () => {
      intro.classList.add('hidden');
      audioManager.enable();
      audioManager.startAmbient();
    };
    btnStart.addEventListener('click', hideIntro);
    btnLoad.addEventListener('click', hideIntro);
    this.root.querySelector('#btn-audio-toggle')?.addEventListener('click', () => {
      const muted = audioManager.toggleMute();
      (this.root.querySelector('#btn-audio-toggle') as HTMLElement).textContent = `🔊 Audio: ${muted ? 'OFF' : 'ON'}`;
      (this.root.querySelector('#btn-mute') as HTMLElement).textContent = muted ? '🔇' : '🔊';
    });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !intro.classList.contains('hidden')) hideIntro();
      if (e.code === 'Escape' && this.planetSurfaceActive) this.closePlanetSurface();
    });

    // Planet surface close handlers
    planetOverlay.querySelector('#btn-planet-surface-close')?.addEventListener('click', () => this.closePlanetSurface());
    planetOverlay.querySelector('#btn-return-orbit')?.addEventListener('click', () => this.closePlanetSurface());
    planetOverlay.querySelector('#btn-collect-samples')?.addEventListener('click', () => {
      this.showToast('Samples collected! +Resources', 'success');
      if (this.selectedPlanetId) {
        const planet = this.engine.getPlanetById(this.selectedPlanetId);
        if (planet) {
          for (const [resType, amt] of Object.entries(planet.resources)) {
            this.engine.shipManager.addResource(resType as any, Math.floor((amt as number) * 0.3));
          }
        }
      }
    });
  }

  private initRenderers() {
    this.starfieldRenderer = new StarfieldRenderer(this.starfieldCanvas);
    this.starfieldRenderer.start();

    this.particleSystem = new ParticleSystem(this.particleCanvas);
    this.ftlEffect = new FTLEffect(this.ftlCanvas);

    // Canvas2D renderer (fallback)
    this.galaxyRenderer = new GalaxyRenderer(this.galaxyCanvas, this.engine.galaxy);
    this.galaxyRenderer.onSystemHover = (id) => this.showSystemTooltip(id);
    this.galaxyRenderer.onSystemSelect = (id) => {
      this.selectedSystemId = id;
      this.selectedStationId = null;
      this.currentView = 'galaxy';
      this.updateLeftPanel();
      this.updateRightPanel();
    };
    this.galaxyRenderer.setShipPosition(this.engine.shipManager.state.position, this.engine.shipManager.state.sensorRange, this.engine.shipManager.state.ftlRange);
    this.galaxyRenderer.focusOn(this.engine.shipManager.state.position);

    // WebGL renderer v5 — 100k stars
    const savedStars = localStorage.getItem('aether_starcount');
    const starCount = savedStars === '1m' ? 500000 : 100000; // 500k for 1M mode to keep perf, can go to 1M
    try {
      this.galaxyWebGLRenderer = new GalaxyWebGLRenderer(this.galaxyWebGLCanvas, this.engine.galaxy, starCount);
      this.galaxyWebGLRenderer.onSystemHover = (id) => this.showSystemTooltip(id);
      this.galaxyWebGLRenderer.onSystemSelect = (id) => {
        this.selectedSystemId = id;
        this.selectedStationId = null;
        this.currentView = 'galaxy';
        this.updateLeftPanel();
        this.updateRightPanel();
      };
      this.galaxyWebGLRenderer.setShipPosition(this.engine.shipManager.state.position, this.engine.shipManager.state.sensorRange, this.engine.shipManager.state.ftlRange);
      this.galaxyWebGLRenderer.focusOn(this.engine.shipManager.state.position);
      console.log(`WebGL renderer initialized with ${starCount.toLocaleString()} stars`);
    } catch (e) {
      console.warn('WebGL renderer failed, falling back to Canvas2D', e);
      this.useWebGL = false;
    }

    // Apply renderer mode
    this.applyRendererMode();

    // System renderer
    this.systemRenderer = new SystemRenderer(this.systemCanvas);
    this.systemRenderer.onPlanetSelect = (id) => {
      this.selectedPlanetId = id;
      this.selectedStationId = null;
      this.updateRightPanel();
    };

    // Planet surface 3D
    try {
      this.planetSurfaceRenderer = new PlanetSurfaceRenderer(this.planetSurfaceCanvas);
      this.planetSurfaceRenderer.start();
    } catch (e) {
      console.warn('Planet surface renderer failed', e);
    }

    // Cockpit HUD
    const galaxyContainer = this.root.querySelector('#galaxy-map-container') as HTMLElement;
    this.cockpitHUD = new CockpitHUD(galaxyContainer);
    const savedCockpit = localStorage.getItem('aether_cockpit');
    if (savedCockpit === 'true') {
      this.cockpitEnabled = true;
      this.cockpitHUD.show();
    }

    // Overlay canvas for scale bar
    const overlayCtx = this.rendererOverlayCanvas.getContext('2d');
    if (overlayCtx) {
      this.overlayCanvas = this.rendererOverlayCanvas;
    }
  }

  private applyRendererMode() {
    if (this.useWebGL && this.galaxyWebGLRenderer) {
      this.galaxyCanvas.style.display = 'none';
      this.galaxyWebGLCanvas.style.display = 'block';
      this.rendererOverlayCanvas.style.display = 'block';
    } else {
      this.galaxyCanvas.style.display = 'block';
      if (this.galaxyWebGLCanvas) this.galaxyWebGLCanvas.style.display = 'none';
      this.rendererOverlayCanvas.style.display = 'none';
    }
    localStorage.setItem('aether_renderer', this.useWebGL ? 'webgl' : 'canvas2d');
    
    // Update toggle buttons
    const webglBtn = this.root.querySelector('#btn-renderer-webgl') as HTMLElement;
    const canvasBtn = this.root.querySelector('#btn-renderer-canvas') as HTMLElement;
    if (webglBtn && canvasBtn) {
      webglBtn.classList.toggle('active', this.useWebGL);
      canvasBtn.classList.toggle('active', !this.useWebGL);
    }
  }

  private getActiveRenderer(): GalaxyRenderer | GalaxyWebGLRenderer {
    return this.useWebGL && this.galaxyWebGLRenderer ? this.galaxyWebGLRenderer : this.galaxyRenderer;
  }

  private bindEvents() {
    this.root.querySelectorAll('.tab[data-view]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.root.querySelectorAll('.tab[data-view]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentView = (tab as HTMLElement).dataset.view as any;
        this.updateCenterView();
        this.updateLeftPanel();
      });
    });
    this.root.querySelectorAll('.tab[data-rview]').forEach(tab => {
      tab.addEventListener('click', () => {
        this.root.querySelectorAll('.tab[data-rview]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.rightView = (tab as HTMLElement).dataset.rview as any;
        this.updateRightPanel();
      });
    });

    this.root.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
      const active = this.getActiveRenderer();
      active.targetScale = Math.min(2.0, active.targetScale * 1.3);
    });
    this.root.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
      const active = this.getActiveRenderer();
      active.targetScale = Math.max(0.01, active.targetScale * 0.7);
    });
    this.root.querySelector('#btn-center')?.addEventListener('click', () => {
      const active = this.getActiveRenderer();
      active.focusOn(this.engine.shipManager.state.position);
    });
    this.root.querySelector('#btn-particles')?.addEventListener('click', () => {
      this.particleSystem.clear();
      this.showToast('Particles cleared', 'info');
    });
    this.root.querySelector('#btn-mute')?.addEventListener('click', () => {
      const muted = audioManager.toggleMute();
      (this.root.querySelector('#btn-mute') as HTMLElement).textContent = muted ? '🔇' : '🔊';
      (this.root.querySelector('#btn-audio-toggle') as HTMLElement).textContent = `🔊 Audio: ${muted ? 'OFF' : 'ON'}`;
      this.showToast(muted ? 'Audio muted' : 'Audio enabled', 'info');
    });

    // v5 renderer toggles
    this.root.querySelector('#btn-renderer-webgl')?.addEventListener('click', () => {
      this.useWebGL = true;
      this.applyRendererMode();
      this.showToast('WebGL renderer: 100k stars, volumetric nebulae, black hole lensing', 'success');
    });
    this.root.querySelector('#btn-renderer-canvas')?.addEventListener('click', () => {
      this.useWebGL = false;
      this.applyRendererMode();
      this.showToast('Canvas2D renderer: lightweight fallback', 'info');
    });
    this.root.querySelector('#btn-cockpit-toggle')?.addEventListener('click', () => {
      this.cockpitEnabled = !this.cockpitEnabled;
      if (this.cockpitEnabled) {
        this.cockpitHUD.show();
        localStorage.setItem('aether_cockpit', 'true');
        this.showToast('Cockpit HUD enabled — feel inside the ship', 'success');
      } else {
        this.cockpitHUD.hide();
        localStorage.setItem('aether_cockpit', 'false');
        this.showToast('Cockpit HUD disabled', 'info');
      }
      (this.root.querySelector('#btn-cockpit-toggle') as HTMLElement).classList.toggle('active', this.cockpitEnabled);
    });
    this.root.querySelector('#btn-star-count')?.addEventListener('click', () => {
      const current = localStorage.getItem('aether_starcount');
      const is1M = current === '1m';
      if (is1M) {
        localStorage.setItem('aether_starcount', '100k');
        if (this.galaxyWebGLRenderer) this.galaxyWebGLRenderer.setStarCount(100000);
        (this.root.querySelector('#btn-star-count') as HTMLElement).textContent = '1M STARS';
        this.showToast('100k stars — balanced performance', 'info');
      } else {
        localStorage.setItem('aether_starcount', '1m');
        if (this.galaxyWebGLRenderer) this.galaxyWebGLRenderer.setStarCount(500000);
        (this.root.querySelector('#btn-star-count') as HTMLElement).textContent = '100K STARS';
        this.showToast('500k stars — high density! (1M mode)', 'success');
      }
    });

    this.root.querySelector('#modal-close')?.addEventListener('click', () => this.hideModal());
    this.root.querySelector('#modal-overlay')?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).id === 'modal-overlay') this.hideModal();
    });

    eventBus.on('DISCOVERY_FOUND', (ev) => {
      this.updateRightPanel();
      // Particle effect at ship position
      const active = this.getActiveRenderer();
      const shipScreen = active.worldToScreen(this.engine.shipManager.state.position);
      this.particleSystem.emit(shipScreen.x, shipScreen.y, 20, 'discovery', { speed: 3, spread: Math.PI * 2, color: '#4ade80' });
    });
    eventBus.on('SYSTEM_SCANNED', () => { 
      this.updateLeftPanel(); 
      this.updateRightPanel();
      const active = this.getActiveRenderer();
      const shipScreen = active.worldToScreen(this.engine.shipManager.state.position);
      this.particleSystem.emit(shipScreen.x, shipScreen.y, 15, 'scan', { color: '#9ef0ff' });
    });
    eventBus.on('PLANET_SCANNED', () => { 
      this.updateLeftPanel(); 
      this.updateRightPanel();
      const active = this.getActiveRenderer();
      const shipScreen = active.worldToScreen(this.engine.shipManager.state.position);
      this.particleSystem.emit(shipScreen.x, shipScreen.y, 10, 'scan', { color: '#5aa0ff' });
    });
    eventBus.on('FTL_JUMP', () => {
      const active = this.getActiveRenderer();
      active.setShipPosition(this.engine.shipManager.state.position, this.engine.shipManager.state.sensorRange, this.engine.shipManager.state.ftlRange);
      if (this.galaxyRenderer) this.galaxyRenderer.setShipPosition(this.engine.shipManager.state.position, this.engine.shipManager.state.sensorRange, this.engine.shipManager.state.ftlRange);
      if (this.galaxyWebGLRenderer) this.galaxyWebGLRenderer.setShipPosition(this.engine.shipManager.state.position, this.engine.shipManager.state.sensorRange, this.engine.shipManager.state.ftlRange);
      this.ftlEffect.trigger();
      this.triggerFTLAnimation();
      if (this.cockpitHUD) this.cockpitHUD.setFTLCharging(true);
      setTimeout(() => { if (this.cockpitHUD) this.cockpitHUD.setFTLCharging(false); }, 1000);
      const shipScreen = active.worldToScreen(this.engine.shipManager.state.position);
      this.particleSystem.emit(shipScreen.x, shipScreen.y, 30, 'ftl', { speed: 4, color: '#a78bfa' });
      this.triggerScreenShake(12, 600);
      this.updateAll();
    });
    eventBus.on('ANOMALY_DETECTED', (ev) => {
      this.showModal('Anomaly Detected', `<div style="color:var(--accent-2);font-weight:700;margin-bottom:12px;">${(ev.data as any).title}</div><div style="line-height:1.6;color:var(--text-dim);">${(ev.data as any).description}<br><br><em>${(ev.data as any).flavor}</em></div>`, [{ label: 'Acknowledge', primary: true, action: () => this.hideModal() }]);
    });
    eventBus.on('QUEST_COMPLETED', (ev) => {
      const q = ev.data.quest;
      this.showModal('Quest Completed', `<div style="text-align:center;padding:10px;"><div style="font-size:32px;margin-bottom:12px;">✓</div><div style="font-weight:700;font-size:16px;margin-bottom:8px;">${q.title}</div><div style="color:var(--text-dim);font-size:12px;margin-bottom:16px;">${q.description}</div><div style="background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.3);border-radius:6px;padding:12px;font-size:12px;">Reward: ${q.rewards.credits} credits${q.rewards.resources ? ' + resources' : ''}</div>${q.selectedChoice ? `<div style="margin-top:12px;font-size:11px;color:var(--text-faint)">Choice: ${q.selectedChoice}</div>` : ''}</div>`, [{ label: 'Continue', primary: true, action: () => this.hideModal() }]);
    });
    eventBus.on('MISSION_AVAILABLE', (ev) => {
      this.showToast(`New mission: ${(ev.data as any).title}`, 'info');
    });
    eventBus.on('HULL_DAMAGED', () => {
      const active = this.getActiveRenderer();
      const shipScreen = active.worldToScreen(this.engine.shipManager.state.position);
      this.particleSystem.emit(shipScreen.x, shipScreen.y, 15, 'damage', { color: '#ff4d6a' });
      if (this.cockpitHUD) this.cockpitHUD.flashDamage(0.6);
    });
    eventBus.on('RESOURCE_TRADED', () => {
      const active = this.getActiveRenderer();
      const shipScreen = active.worldToScreen(this.engine.shipManager.state.position);
      this.particleSystem.emit(shipScreen.x, shipScreen.y, 8, 'trade', { color: '#fbbf24' });
    });
  }

  private startLoop() {
    let last = performance.now();
    const loop = (now: number) => {
      const delta = now - last;
      last = now;
      this.engine.update(delta);
      
      // Update both renderers
      this.galaxyRenderer.update();
      if (this.galaxyWebGLRenderer) {
        this.galaxyWebGLRenderer.update();
      }
      // v6 wormhole markers — both renderers
      try {
        const wormholes = this.engine.wormholeManager.getAllWormholes();
        (this.galaxyRenderer as any).updateWormholes(wormholes);
        (this.galaxyWebGLRenderer as any)?.updateWormholes(wormholes);
      } catch {}

      // Render active
      if (this.useWebGL && this.galaxyWebGLRenderer) {
        this.galaxyWebGLRenderer.render();
        // Overlay scale bar
        const ctx = this.overlayCanvas?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
          const dpr = window.devicePixelRatio || 1;
          this.overlayCanvas.width = this.overlayCanvas.clientWidth * dpr;
          this.overlayCanvas.height = this.overlayCanvas.clientHeight * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          this.galaxyWebGLRenderer.renderOverlay(ctx);
        }
      } else {
        this.galaxyRenderer.render();
      }

      if (this.currentView === 'system' || this.selectedSystemId) {
        const sys = this.engine.galaxy.getSystem(this.selectedSystemId!);
        if (sys && this.systemRenderer.system?.id !== sys.id) {
          this.systemRenderer.setSystem(sys);
        }
        this.systemRenderer.render(now);
      }
      this.particleSystem.update(delta);
      this.particleSystem.render();
      this.ftlEffect.update(delta);
      this.ftlEffect.render();

      // Engine trail particles (subtle)
      if (Math.random() < 0.3) {
        const active = this.getActiveRenderer();
        const shipScreen = active.worldToScreen(this.engine.shipManager.state.position);
        this.particleSystem.emit(shipScreen.x, shipScreen.y, 1, 'engine', { speed: 1, spread: 0.5, color: '#5aa0ff' });
      }

      // Cockpit HUD update
      if (this.cockpitEnabled && this.cockpitHUD) {
        const ship = this.engine.shipManager.state;
        const currentSys = this.engine.getCurrentSystem();
        const targetSys = this.selectedSystemId ? this.engine.galaxy.getSystem(this.selectedSystemId) : null;
        const dist = targetSys ? Math.hypot(targetSys.position.x - ship.position.x, targetSys.position.y - ship.position.y) : 0;
        const heading = targetSys ? Math.atan2(targetSys.position.y - ship.position.y, targetSys.position.x - ship.position.x) * 180 / Math.PI : 0;
        
        this.cockpitHUD.update({
          target: targetSys ? targetSys.name : currentSys ? currentSys.name : 'DEEP SPACE',
          speed: ship.ftlCharge / 100,
          heading: heading < 0 ? heading + 360 : heading,
          range: dist,
          fuel: (ship.fuel / ship.fuelCapacity) * 100,
          shield: (ship.shield / ship.shieldMax) * 100,
          hull: (ship.hull / ship.hullMax) * 100,
          bearing: (now * 0.01) % 360,
        });
      }

      this.updateTopBar();
      this.updateScanOverlay();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // Planet surface methods
  openPlanetSurface(planetId: string) {
    const planet = this.engine.getPlanetById(planetId);
    if (!planet) return;

    this.planetSurfaceActive = true;
    const overlay = document.getElementById('planet-surface-overlay') as HTMLElement;
    const titleEl = document.getElementById('planet-surface-title') as HTMLElement;
    const metaEl = document.getElementById('planet-surface-meta') as HTMLElement;

    if (titleEl) titleEl.textContent = planet.name;
    if (metaEl) {
      const def = PLANET_TYPES[planet.type];
      metaEl.textContent = `${def.name} • ${planet.attributes.temperature.toFixed(0)}°C • ${planet.attributes.gravity.toFixed(1)}G • ${planet.isLandable ? 'Landable' : 'No landing'}`;
    }

    overlay.classList.add('active');
    this.planetSurfaceRenderer.setPlanet(planet);
    this.planetSurfaceRenderer.resize();

    this.showToast(`Landing on ${planet.name} — 3D surface view`, 'success');
  }

  closePlanetSurface() {
    this.planetSurfaceActive = false;
    const overlay = document.getElementById('planet-surface-overlay') as HTMLElement;
    if (overlay) overlay.classList.remove('active');
  }

  private updateTopBar() {
    const ship = this.engine.shipManager.state;
    const hullPct = (ship.hull / ship.hullMax) * 100;
    const shieldPct = (ship.shield / ship.shieldMax) * 100;
    const fuelPct = (ship.fuel / ship.fuelCapacity) * 100;
    const powerPct = (ship.power / ship.powerMax) * 100;
    (this.root.querySelector('#bar-hull') as HTMLElement).style.width = `${hullPct}%`;
    (this.root.querySelector('#bar-shield') as HTMLElement).style.width = `${shieldPct}%`;
    (this.root.querySelector('#bar-fuel') as HTMLElement).style.width = `${fuelPct}%`;
    (this.root.querySelector('#bar-power') as HTMLElement).style.width = `${powerPct}%`;
    (this.root.querySelector('#val-hull') as HTMLElement).textContent = `${Math.floor(hullPct)}%`;
    (this.root.querySelector('#val-shield') as HTMLElement).textContent = `${Math.floor(shieldPct)}%`;
    (this.root.querySelector('#val-fuel') as HTMLElement).textContent = `${Math.floor(ship.fuel)}`;
    (this.root.querySelector('#val-power') as HTMLElement).textContent = `${Math.floor(ship.power)}`;
    (this.root.querySelector('#val-ftl') as HTMLElement).textContent = `${Math.floor(ship.ftlCharge)}%`;
    const currentSys = this.engine.getCurrentSystem();
    (this.root.querySelector('#val-loc') as HTMLElement).textContent = currentSys ? currentSys.name.split(' ')[0] : 'DEEP SPACE';
    const storyProgress = this.engine.storyManager.getProgress();
    const topbarExtra = this.root.querySelector('.topbar div:nth-child(2)') as HTMLElement;
    if (topbarExtra) {
      topbarExtra.innerHTML = `<span>${this.engine.shipManager.state.name}</span><span style="background:rgba(90,160,255,0.15);border:1px solid var(--border);padding:2px 6px;border-radius:3px;">LVL ${this.engine.state.player.level} • ${this.engine.state.player.credits} CR</span><span style="color:var(--text-faint)">DAY ${this.engine.state.time.day}</span><span style="background:rgba(216,180,254,0.15);border:1px solid rgba(216,180,254,0.3);padding:2px 6px;border-radius:3px;color:#d8b4fe;">CH ${storyProgress.chapter}: ${storyProgress.currentTitle.split(':')[1] || storyProgress.currentTitle}</span>`;
    }
  }

  private updateCenterView() {
    const galaxyContainer = this.root.querySelector('#galaxy-map-container') as HTMLElement;
    const systemContainer = this.root.querySelector('#system-view-container') as HTMLElement;
    if (this.currentView === 'system') {
      galaxyContainer.style.display = 'none';
      systemContainer.style.display = 'flex';
      if (this.selectedSystemId) {
        const sys = this.engine.galaxy.getSystem(this.selectedSystemId);
        if (sys) {
          this.systemRenderer.setSystem(sys);
          (this.root.querySelector('#system-name') as HTMLElement).textContent = sys.name;
          const starDef = STAR_TYPES[sys.starType];
          const faction = sys.faction ? FACTIONS[sys.faction] : null;
          (this.root.querySelector('#system-meta') as HTMLElement).innerHTML = `
            <span>${starDef.name} • ${Math.floor(sys.temperature)}K • L ${sys.luminosity.toFixed(2)}</span>
            <span>${sys.planets.length} planets • ${sys.stations.length} stations</span>
            ${faction ? `<span class="faction-badge" style="color:${(faction as any).color}">${(faction as any).shortName}</span>` : ''}
            <span style="color:${sys.dangerLevel > 0.7 ? 'var(--danger)' : sys.dangerLevel > 0.4 ? 'var(--warning)' : 'var(--success)'}">Danger ${(sys.dangerLevel * 100).toFixed(0)}%</span>
          `;
        }
      }
    } else {
      galaxyContainer.style.display = 'block';
      systemContainer.style.display = 'none';
    }
  }

  private updateLeftPanel() {
    const panel = this.root.querySelector('#panel-left') as HTMLElement;
    const actionBar = this.root.querySelector('#action-bar-left') as HTMLElement;

    if (this.currentView === 'galaxy') {
      if (!this.selectedSystemId) {
        const storyProgress = this.engine.storyManager.getProgress();
        const codexProgress = this.engine.codexManager.getProgress();
        const galaxyStats = (this.engine.galaxy as any).getStats ? (this.engine.galaxy as any).getStats() : { discovered: this.engine.state.galaxy.exploredSystems.length, estimatedTotal: 20000, exploredPercent: 0.1, sectorsGenerated: 9 };
        const currentSector = (this.engine.galaxy as any).worldToSector ? (this.engine.galaxy as any).worldToSector(this.engine.shipManager.state.position) : { x: 0, y: 0 };
        const currentRegion = (this.engine.galaxy as any).structure?.getRegionName ? (this.engine.galaxy as any).structure.getRegionName(this.engine.shipManager.state.position) : 'Unknown Region';
        panel.innerHTML = `
          <div class="section-title">Navigation Computer — True Scale 50k LY</div>
          <div style="background:linear-gradient(180deg, rgba(0,229,255,0.06) 0%, rgba(255,255,255,0.01) 100%);border:1px solid var(--border-1);border-left:2px solid var(--cyan);clip-path:var(--panel-cut-sm);padding:12px;margin-bottom:14px;position:relative;">
            <div style="position:absolute;top:6px;right:10px;font-size:6px;letter-spacing:0.2em;color:var(--text-4);border:1px solid var(--border-1);padding:1px 4px;">NAV-COM v6.4</div>
            <div style="font-size:9px;letter-spacing:0.18em;color:var(--cyan);font-weight:700;margin-bottom:8px;">GALAXY RENDERER • ${this.useWebGL ? `WEBGL ${this.galaxyWebGLRenderer?.['starCount']?.toLocaleString() || '100k'} STARS` : 'CANVAS2D FALLBACK'} • ${this.cockpitEnabled ? 'COCKPIT ON' : 'COCKPIT OFF'}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:8px;line-height:1.6;color:var(--text-2);">
              <div>
                <div style="color:var(--text-3);font-size:7px;letter-spacing:0.15em;">DIAMETER</div>
                <div style="font-weight:700;color:var(--text-1);">50,000 LY</div>
              </div>
              <div>
                <div style="color:var(--text-3);font-size:7px;letter-spacing:0.15em;">SECTORS</div>
                <div style="font-weight:700;color:var(--text-1);">100×100 = 10,000</div>
              </div>
              <div>
                <div style="color:var(--text-3);font-size:7px;letter-spacing:0.15em;">EST SYSTEMS</div>
                <div style="font-weight:700;color:var(--amber);">~20,000</div>
              </div>
              <div>
                <div style="color:var(--text-3);font-size:7px;letter-spacing:0.15em;">VOID RATIO</div>
                <div style="font-weight:700;color:var(--text-1);">70-90% EMPTY</div>
              </div>
            </div>
            <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-1);display:flex;gap:12px;font-size:8px;color:var(--text-3);">
              <span>GEN: ${galaxyStats.sectorsGenerated} SEC</span>
              <span>DISC: ${galaxyStats.discovered} SYS</span>
              <span>EXP: ${galaxyStats.exploredPercent.toFixed(3)}%</span>
            </div>
            <div style="width:100%;height:2px;background:rgba(0,0,0,0.5);margin-top:8px;position:relative;overflow:hidden;border:1px solid var(--border-1);"><div style="width:${Math.min(100, galaxyStats.exploredPercent * 500)}%;height:100%;background:linear-gradient(90deg, var(--cyan), #d8b4fe);box-shadow:0 0 6px var(--cyan);"></div></div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;">
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);">
              <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">CURRENT SECTOR</div>
              <div style="font-size:10px;font-weight:700;color:var(--text-1);margin-top:2px;">${currentSector.x}, ${currentSector.y}</div>
              <div style="font-size:8px;color:var(--cyan);margin-top:2px;">${currentRegion}</div>
            </div>
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);">
              <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">GALACTIC POSITION</div>
              <div style="font-size:9px;font-weight:700;color:var(--text-1);margin-top:2px;font-variant-numeric:tabular-nums;">${this.engine.shipManager.state.position.x.toFixed(0)}, ${this.engine.shipManager.state.position.y.toFixed(0)} LY</div>
              <div style="font-size:8px;color:var(--text-3);margin-top:2px;">CORE DIST: ${Math.hypot(this.engine.shipManager.state.position.x, this.engine.shipManager.state.position.y).toFixed(0)} LY</div>
            </div>
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);">
              <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">EXPLORATION</div>
              <div style="font-size:9px;color:var(--text-2);margin-top:2px;line-height:1.4;">EXP ${this.engine.state.galaxy.exploredSystems.length} • SCN ${this.engine.state.galaxy.scannedSystems.length}<br>DISC ${this.engine.state.discoveries.length} • DIST ${this.engine.state.player.distanceTraveled.toFixed(0)} LY</div>
            </div>
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);">
              <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">VESSEL STATUS</div>
              <div style="font-size:9px;color:var(--text-2);margin-top:2px;line-height:1.4;">CR ${this.engine.state.player.credits.toLocaleString()} • LVL ${this.engine.state.player.level}<br>CREW ${this.engine.state.crew.length} • CODEX ${codexProgress.unlocked}/${codexProgress.total}</div>
            </div>
          </div>

          <div style="background:linear-gradient(90deg, rgba(216,180,254,0.08), transparent);border:1px solid rgba(216,180,254,0.15);border-left:2px solid #d8b4fe;padding:8px 10px;margin-bottom:14px;clip-path:var(--panel-cut-sm);">
            <div style="font-size:7px;letter-spacing:0.18em;color:#d8b4fe;font-weight:700;">STORY PROGRESS • CH ${storyProgress.chapter}/${storyProgress.total}</div>
            <div style="font-size:9px;color:var(--text-1);margin-top:4px;font-weight:600;">${storyProgress.currentTitle}</div>
            <div style="width:100%;height:2px;background:rgba(0,0,0,0.4);margin-top:6px;overflow:hidden;"><div style="width:${storyProgress.percent}%;height:100%;background:linear-gradient(90deg, #d8b4fe, var(--cyan));"></div></div>
          </div>
          
          <div class="section-title amber">Galactic Structure — Navigation Data</div>
          <div style="font-size:9px;color:var(--text-2);line-height:1.6;background:rgba(255,255,255,0.01);border:1px solid var(--border-1);padding:10px;clip-path:var(--panel-cut-sm);font-variant-numeric:tabular-nums;">
            <div style="display:grid;grid-template-columns:80px 1fr;gap:4px 8px;">
              <span style="color:var(--red);font-weight:700;">CORE 0-5k</span><span>Dense, black hole, ancient — EXTREME DANGER</span>
              <span style="color:var(--amber);font-weight:700;">INNER 5-10k</span><span>Moderate, factions, trade routes</span>
              <span style="color:var(--green);font-weight:700;">HAB 10-25k</span><span>Best for life — YOU ARE HERE • ${currentRegion}</span>
              <span style="color:var(--cyan);font-weight:700;">OUTER 25-40k</span><span>Sparse, nomads, secrets, derelicts</span>
              <span style="color:var(--text-3);font-weight:700;">HALO 40k+</span><span>Deep void, rogue planets, unknown entities</span>
            </div>
            <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border-1);font-size:8px;color:var(--text-3);">
              ZOOM &lt;0.03: SECTOR LOD • 0.03-0.15: STARS+NEBULAE • &gt;0.15: NAMES • &gt;0.3: DETAILS
            </div>
          </div>

          <div class="section-title" style="margin-top:20px;">Current System</div>
          ${this.renderCurrentSystemMini()}
          <div class="section-title" style="margin-top:20px;">Nearby Systems (in sensor range)</div>
          <div style="display:flex;flex-direction:column;gap:6px;">${this.renderNearbySystems()}</div>
          <div class="section-title" style="margin-top:20px;">Deep Space POIs Near You</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${(this.engine.galaxy as any).getPOIsInRange ? ((this.engine.galaxy as any).getPOIsInRange(this.engine.shipManager.state.position, this.engine.shipManager.state.sensorRange).slice(0, 3).map((poi: any) => `
              <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:4px;padding:6px;font-size:10px;">
                <div style="font-weight:600;">${poi.type === 'rogue_planet' ? '●' : '◈'} ${poi.name}</div>
                <div style="color:var(--text-dim);font-size:9px;">${poi.type} • ${poi.rarity} • ${Math.hypot(poi.position.x - this.engine.shipManager.state.position.x, poi.position.y - this.engine.shipManager.state.position.y).toFixed(0)} LY</div>
              </div>
            `).join('') || '<div style="font-size:10px;color:var(--text-faint)">No POIs in range — void is empty, as real space is (70% empty)</div>') : '<div style="font-size:10px;color:var(--text-faint)">No POIs — true emptiness of space</div>'}
          </div>
          <div class="section-title" style="margin-top:20px;">Active Quests (${this.engine.questManager.active.length})</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${this.engine.questManager.active.slice(0, 3).map(q => `
              <div style="background:rgba(90,160,255,0.06);border:1px solid var(--border);border-radius:4px;padding:8px;font-size:11px;">
                <div style="font-weight:700;">${q.title} ${q.id.startsWith('main-') ? '<span style="background:rgba(216,180,254,0.2);color:#d8b4fe;padding:1px 4px;border-radius:3px;font-size:9px;">MAIN</span>' : ''}</div>
                <div style="color:var(--text-dim);font-size:10px;">${q.objectives.filter(o => !o.completed).length} objectives left</div>
              </div>
            `).join('') || '<div style="font-size:11px;color:var(--text-faint)">No active quests</div>'}
          </div>
        `;
        actionBar.innerHTML = `
          <button class="btn btn-small" id="btn-save">💾 Save</button>
          <button class="btn btn-small" id="btn-scan-long">📡 Long Scan</button>
          <button class="btn btn-small btn-danger" id="btn-reset">Reset</button>
        `;
        panel.querySelectorAll('.system-mini').forEach(el => {
          el.addEventListener('click', () => {
            this.selectedSystemId = (el as HTMLElement).dataset.id!;
            this.updateLeftPanel();
            this.updateRightPanel();
          });
        });
        actionBar.querySelector('#btn-save')?.addEventListener('click', () => { this.engine.save(); this.showToast('Game saved'); });
        actionBar.querySelector('#btn-scan-long')?.addEventListener('click', () => this.doLongRangeScan());
        actionBar.querySelector('#btn-reset')?.addEventListener('click', () => {
          if (confirm('Reset game? All progress lost.')) this.engine.resetGame();
        });
      } else {
        const sys = this.engine.galaxy.getSystem(this.selectedSystemId!);
        if (!sys) return;
        const isCurrent = sys.id === this.engine.shipManager.state.currentSystemId;
        const dist = Math.hypot(sys.position.x - this.engine.shipManager.state.position.x, sys.position.y - this.engine.shipManager.state.position.y);
        const canJump = dist <= this.engine.shipManager.state.ftlRange && !isCurrent;

        const worldEvents = this.engine.worldMemory.getEventsForSystem(sys.id);

        panel.innerHTML = `
          <div class="section-title">System Details</div>
          <div style="margin-bottom:12px;">
            <div style="font-size:16px;font-weight:700;">${sys.name}</div>
            <div style="font-size:11px;color:var(--text-dim);">${STAR_TYPES[sys.starType].name} • ${sys.starClass}</div>
            ${sys.faction ? `<div style="margin-top:6px;"><span class="faction-badge" style="color:${(FACTIONS as any)[sys.faction].color}">${(FACTIONS as any)[sys.faction].name} • Rep ${this.engine.factionManager.getReputation(sys.faction)}</span></div>` : ''}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;margin-bottom:16px;">
            <div>State: <span style="color:var(--accent-2)">${sys.discoveryState}</span></div>
            <div>Danger: <span style="color:${sys.dangerLevel > 0.6 ? 'var(--danger)' : 'var(--success)'}">${(sys.dangerLevel * 100).toFixed(0)}%</span></div>
            <div>Planets: ${sys.planets.length}</div>
            <div>Stations: ${sys.stations.length}</div>
          </div>
          ${worldEvents.length ? `
            <div class="section-title">World Memory</div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
              ${worldEvents.slice(0, 3).map(e => `<div style="font-size:10px;background:rgba(216,180,254,0.08);border:1px solid rgba(216,180,254,0.15);border-radius:4px;padding:6px;color:var(--text-dim);">${e.description}</div>`).join('')}
            </div>
          ` : ''}
          ${sys.stations.length ? `
            <div class="section-title">Stations</div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
              ${sys.stations.map(st => `
                <div class="station-card ${this.selectedStationId === st.id ? 'selected' : ''}" data-station="${st.id}" style="background:rgba(255,255,255,0.03);border:1px solid ${this.selectedStationId === st.id ? 'var(--accent)' : 'var(--border)'};border-radius:6px;padding:10px;cursor:pointer;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div><div style="font-weight:700;font-size:12px;">${st.name}</div><div style="font-size:10px;color:var(--text-dim);">${st.type} • ${(FACTIONS as any)[st.faction].shortName} • Pop ${st.population || '?'}</div></div>
                    <div style="font-size:10px;color:var(--text-faint);">${st.services?.join(', ') || 'No services'}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div class="section-title">Planets</div>
          <div class="planet-list">
            ${sys.planets.map(p => `
              <div class="planet-card ${this.selectedPlanetId === p.id ? 'selected' : ''}" data-planet="${p.id}">
                <div class="planet-card-header">
                  <div><div class="planet-name">${p.name}</div><div class="planet-type">${PLANET_TYPES[p.type].name}</div></div>
                  <div class="planet-dot" style="background:${PLANET_TYPES[p.type].color};color:${PLANET_TYPES[p.type].color}"></div>
                </div>
                <div class="planet-stats">
                  <span>${p.attributes.temperature.toFixed(0)}°C</span>
                  <span>${p.attributes.gravity.toFixed(1)}G</span>
                  <span>${p.isLandable ? 'Landable' : 'No landing'}</span>
                  ${p.hasLife ? '<span style="color:var(--success)">● Life</span>' : ''}
                  ${p.hasRuins ? '<span style="color:var(--warning)">◈ Ruins</span>' : ''}
                </div>
              </div>
            `).join('')}
          </div>
          ${sys.anomalies.length ? `<div class="section-title" style="margin-top:16px;">Anomalies</div><div style="font-size:11px;color:var(--text-dim);">${sys.anomalies.map(a => `⚠ ${a.name} (${a.rarity})`).join('<br>')}</div>` : ''}
        `;
        actionBar.innerHTML = `
          <button class="btn btn-small" id="btn-back-galaxy">← Galaxy</button>
          ${!isCurrent ? `<button class="btn btn-primary btn-small" id="btn-jump" ${!canJump ? 'disabled' : ''}>FTL Jump ${dist.toFixed(0)} LY</button>` : `<button class="btn btn-small" id="btn-view-system">View System</button>`}
          <button class="btn btn-small" id="btn-scan-system" ${sys.discoveryState === SystemDiscoveryState.FullySurveyed ? 'disabled' : ''}>🔍 Scan</button>
        `;

        panel.querySelectorAll('.planet-card').forEach(el => {
          el.addEventListener('click', () => {
            this.selectedPlanetId = (el as HTMLElement).dataset.planet!;
            this.selectedStationId = null;
            this.updateLeftPanel();
            this.updateRightPanel();
          });
        });
        panel.querySelectorAll('.station-card').forEach(el => {
          el.addEventListener('click', () => {
            this.selectedStationId = (el as HTMLElement).dataset.station!;
            this.selectedPlanetId = null;
            this.rightView = 'market';
            this.root.querySelectorAll('.tab[data-rview]').forEach(t => t.classList.remove('active'));
            this.root.querySelector('.tab[data-rview="market"]')?.classList.add('active');
            this.updateLeftPanel();
            this.updateRightPanel();
          });
        });

        actionBar.querySelector('#btn-back-galaxy')?.addEventListener('click', () => {
          this.selectedSystemId = null;
          this.updateLeftPanel();
          this.updateRightPanel();
        });
        actionBar.querySelector('#btn-view-system')?.addEventListener('click', () => {
          this.currentView = 'system';
          this.root.querySelectorAll('.tab[data-view]').forEach(t => t.classList.remove('active'));
          this.root.querySelector('.tab[data-view="system"]')?.classList.add('active');
          this.updateCenterView();
        });
        actionBar.querySelector('#btn-jump')?.addEventListener('click', () => {
          const res = this.engine.jumpToSystem(sys.id);
          this.showToast(res.message, res.success ? 'success' : 'danger');
          if (res.success) {
            this.currentView = 'system';
            this.root.querySelectorAll('.tab[data-view]').forEach(t => t.classList.remove('active'));
            this.root.querySelector('.tab[data-view="system"]')?.classList.add('active');
            this.updateCenterView();
          }
        });
        actionBar.querySelector('#btn-scan-system')?.addEventListener('click', () => {
          const res = this.engine.startSystemScan(sys.id);
          this.showToast(res.message, res.success ? 'success' : 'warning');
        });
      }
    } else if (this.currentView === 'system') {
      const sys = this.selectedSystemId ? this.engine.galaxy.getSystem(this.selectedSystemId) : this.engine.getCurrentSystem();
      if (!sys) {
        panel.innerHTML = `<div style="color:var(--text-dim)">No system selected</div>`;
        actionBar.innerHTML = '';
        return;
      }
      panel.innerHTML = `
        <div class="section-title">System Map</div>
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">${sys.name}</div>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.6;margin-bottom:16px;">
          ${STAR_TYPES[sys.starType].description}<br><br>
          ${sys.planets.length} planets • ${sys.stations.length} stations<br>
          ${sys.anomalies.length ? `${sys.anomalies.length} anomalies detected` : 'No anomalies'}
        </div>
        ${sys.stations.length ? `
          <div class="section-title">Stations in System</div>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
            ${sys.stations.map(st => `
              <div class="station-card ${this.selectedStationId === st.id ? 'selected' : ''}" data-station="${st.id}" style="background:rgba(255,255,255,0.03);border:1px solid ${this.selectedStationId === st.id ? 'var(--accent)' : 'var(--border)'};border-radius:6px;padding:8px;cursor:pointer;">
                <div style="font-weight:600;font-size:11px;">${st.name}</div>
                <div style="font-size:10px;color:var(--text-dim);">${st.type} • ${st.services?.join(', ')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="section-title">Planet List</div>
        <div class="planet-list">
          ${sys.planets.map(p => `
            <div class="planet-card ${this.selectedPlanetId === p.id ? 'selected' : ''}" data-planet="${p.id}">
              <div class="planet-card-header">
                <div><div class="planet-name">${p.name}</div><div class="planet-type">${PLANET_TYPES[p.type].name} • ${p.scanned ? 'Scanned' : 'Unscanned'}</div></div>
                <div class="planet-dot" style="background:${PLANET_TYPES[p.type].color};color:${PLANET_TYPES[p.type].color}"></div>
              </div>
              <div class="planet-stats">
                <span>T ${p.attributes.temperature.toFixed(0)}°C</span>
                <span>G ${p.attributes.gravity.toFixed(1)}</span>
                <span>Atm ${(p.attributes.atmosphere * 100).toFixed(0)}%</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      actionBar.innerHTML = `
        <button class="btn btn-small" id="btn-back-to-galaxy">← Galaxy Map</button>
        <button class="btn btn-small" id="btn-scan-current" ${sys.discoveryState === SystemDiscoveryState.Scanned ? 'disabled' : ''}>Scan System</button>
      `;
      panel.querySelectorAll('.planet-card').forEach(el => {
        el.addEventListener('click', () => {
          this.selectedPlanetId = (el as HTMLElement).dataset.planet!;
          this.selectedStationId = null;
          this.updateLeftPanel();
          this.updateRightPanel();
        });
      });
      panel.querySelectorAll('.station-card').forEach(el => {
        el.addEventListener('click', () => {
          this.selectedStationId = (el as HTMLElement).dataset.station!;
          this.selectedPlanetId = null;
          this.rightView = 'market';
          this.root.querySelectorAll('.tab[data-rview]').forEach(t => t.classList.remove('active'));
          this.root.querySelector('.tab[data-rview="market"]')?.classList.add('active');
          this.updateLeftPanel();
          this.updateRightPanel();
        });
      });
      actionBar.querySelector('#btn-back-to-galaxy')?.addEventListener('click', () => {
        this.currentView = 'galaxy';
        this.root.querySelectorAll('.tab[data-view]').forEach(t => t.classList.remove('active'));
        this.root.querySelector('.tab[data-view="galaxy"]')?.classList.add('active');
        this.updateCenterView();
        this.updateLeftPanel();
      });
      actionBar.querySelector('#btn-scan-current')?.addEventListener('click', () => {
        const res = this.engine.startSystemScan(sys.id);
        this.showToast(res.message, res.success ? 'success' : 'warning');
      });
    } else if (this.currentView === 'ship') {
      const ship = this.engine.shipManager.state;
      const powerTrend = (this.engine.shipManager as any).getPowerTrend?.() || 'stable';
      const heatTrend = (this.engine.shipManager as any).getHeatTrend?.() || 'stable';
      const powerTrendIcon = powerTrend === 'rising' ? '↗' : powerTrend === 'falling' ? '↘' : '→';
      const heatTrendIcon = heatTrend === 'rising' ? '↗' : heatTrend === 'falling' ? '↘' : '→';
      panel.innerHTML = `
        <div class="ship-schematic">
          <div class="ship-hull"></div>
          <div style="position:absolute;bottom:8px;left:12px;right:12px;display:flex;justify-content:space-between;font-size:7px;color:var(--text-3);letter-spacing:0.12em;">
            <span>HULL ${(ship.hull/ship.hullMax*100).toFixed(0)}% • SHIELD ${(ship.shield/ship.shieldMax*100).toFixed(0)}%</span>
            <span style="color:${ship.heat > 80 ? 'var(--red)' : ship.heat > 60 ? 'var(--amber)' : 'var(--cyan)'};">HEAT ${ship.heat.toFixed(0)}% ${heatTrendIcon}</span>
          </div>
        </div>

        <div class="section-title">Interconnected Systems — Lived-In Vessel</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;">
          <div style="background:linear-gradient(180deg, rgba(0,255,136,0.06), transparent);border:1px solid var(--border-1);border-left:2px solid var(--green);padding:8px 10px;clip-path:var(--panel-cut-sm);">
            <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">HULL INTEGRITY</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <div style="flex:1;height:3px;background:rgba(0,0,0,0.5);border:1px solid var(--border-1);overflow:hidden;"><div style="width:${(ship.hull/ship.hullMax*100).toFixed(0)}%;height:100%;background:var(--green);box-shadow:0 0 6px var(--green);"></div></div>
              <div style="font-size:10px;font-weight:700;color:var(--text-1);font-variant-numeric:tabular-nums;">${ship.hull.toFixed(0)}/${ship.hullMax}</div>
            </div>
            <div style="font-size:8px;color:var(--text-3);margin-top:3px;">Armor ${ship.armor.toFixed(0)} • Cargo affects hull stress</div>
          </div>
          <div style="background:linear-gradient(180deg, rgba(0,229,255,0.06), transparent);border:1px solid var(--border-1);border-left:2px solid var(--cyan);padding:8px 10px;clip-path:var(--panel-cut-sm);">
            <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">SHIELD CORE</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <div style="flex:1;height:3px;background:rgba(0,0,0,0.5);border:1px solid var(--border-1);overflow:hidden;"><div style="width:${(ship.shield/ship.shieldMax*100).toFixed(0)}%;height:100%;background:var(--cyan);box-shadow:0 0 6px var(--cyan);"></div></div>
              <div style="font-size:10px;font-weight:700;color:var(--text-1);font-variant-numeric:tabular-nums;">${ship.shield.toFixed(0)}/${ship.shieldMax}</div>
            </div>
            <div style="font-size:8px;color:var(--text-3);margin-top:3px;">Heat & power affect shield • Regen ${ship.power > 250 ? 'ON' : 'OFF'}</div>
          </div>
          <div style="background:linear-gradient(180deg, rgba(255,176,0,0.06), transparent);border:1px solid var(--border-1);border-left:2px solid var(--amber);padding:8px 10px;clip-path:var(--panel-cut-sm);">
            <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">FUEL RESERVE</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <div style="flex:1;height:3px;background:rgba(0,0,0,0.5);border:1px solid var(--border-1);overflow:hidden;"><div style="width:${(ship.fuel/ship.fuelCapacity*100).toFixed(0)}%;height:100%;background:var(--amber);box-shadow:0 0 6px var(--amber);"></div></div>
              <div style="font-size:10px;font-weight:700;color:var(--text-1);font-variant-numeric:tabular-nums;">${ship.fuel.toFixed(0)}/${ship.fuelCapacity}</div>
            </div>
            <div style="font-size:8px;color:var(--text-3);margin-top:3px;">Consumption ↑ heat • Low fuel = morale ↓</div>
          </div>
          <div style="background:linear-gradient(180deg, rgba(167,139,250,0.06), transparent);border:1px solid var(--border-1);border-left:2px solid #a78bfa;padding:8px 10px;clip-path:var(--panel-cut-sm);">
            <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">REACTOR POWER ${powerTrendIcon}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <div style="flex:1;height:3px;background:rgba(0,0,0,0.5);border:1px solid var(--border-1);overflow:hidden;"><div style="width:${(ship.power/ship.powerMax*100).toFixed(0)}%;height:100%;background:#a78bfa;box-shadow:0 0 6px #a78bfa;"></div></div>
              <div style="font-size:10px;font-weight:700;color:var(--text-1);font-variant-numeric:tabular-nums;">${ship.power.toFixed(0)}/${ship.powerMax}</div>
            </div>
            <div style="font-size:8px;color:${powerTrend === 'falling' ? 'var(--red)' : 'var(--text-3)'};margin-top:3px;">${powerTrend.toUpperCase()} • ${ship.power < 100 ? 'CRITICAL — modules offline' : ship.power < 250 ? 'LOW — shield regen off' : 'NOMINAL'}</div>
          </div>
          <div style="background:rgba(255,255,255,0.01);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);">
            <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">LIFE SUPPORT</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px;font-size:9px;">
              <div>O₂ <span style="color:${ship.oxygen < 30 ? 'var(--red)' : 'var(--text-1)'};font-weight:700;">${ship.oxygen.toFixed(0)}%</span></div>
              <div>FOOD <span style="color:${ship.food < 30 ? 'var(--red)' : 'var(--text-1)'};font-weight:700;">${ship.food.toFixed(0)}%</span></div>
              <div>SUP <span style="color:${ship.supplies < 30 ? 'var(--red)' : 'var(--text-1)'};font-weight:700;">${ship.supplies.toFixed(0)}%</span></div>
              <div>MOR <span style="color:${ship.crewMorale < 40 ? 'var(--red)' : ship.crewMorale < 70 ? 'var(--amber)' : 'var(--green)'};font-weight:700;">${ship.crewMorale.toFixed(0)}%</span></div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.01);border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);">
            <div style="font-size:7px;letter-spacing:0.15em;color:var(--text-3);">NAVIGATION & CARGO</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px;font-size:9px;">
              <div>SENS <span style="color:var(--cyan);font-weight:700;">${ship.sensorRange.toFixed(0)} LY</span></div>
              <div>FTL <span style="color:#a78bfa;font-weight:700;">${ship.ftlRange.toFixed(0)} LY</span></div>
              <div>CARGO <span style="color:var(--text-1);font-weight:700;">${ship.cargoUsed.toFixed(0)}/${ship.cargoCapacity}</span></div>
              <div>FTL CHG <span style="color:var(--cyan);font-weight:700;">${ship.ftlCharge.toFixed(0)}%</span></div>
            </div>
          </div>
        </div>

        <div class="section-title amber">Modules — Each Affects Others • Click for Details</div>
        <div class="module-list">
          ${ship.modules.map(m => {
            const isCritical = m.health < 30;
            const isWarning = m.health < 70 && m.health >= 30;
            return `
            <div class="module-row ${isCritical ? 'critical' : ''}" data-module="${m.id}" style="${isCritical ? 'border-left-color:var(--red);background:linear-gradient(90deg, rgba(255,59,48,0.08), transparent);' : isWarning ? 'border-left-color:var(--amber);' : ''}">
              <div class="module-icon" style="${isCritical ? 'border-color:var(--red);color:var(--red);' : ''}">${MODULE_DEFS[m.type].icon}</div>
              <div class="module-info">
                <div class="module-name" style="display:flex;gap:6px;align-items:center;">
                  ${m.name}
                  ${isCritical ? '<span style="font-size:6px;background:var(--red);color:white;padding:1px 3px;letter-spacing:0.1em;">CRITICAL</span>' : isWarning ? '<span style="font-size:6px;background:var(--amber);color:black;padding:1px 3px;">WARN</span>' : ''}
                  <span style="font-size:7px;color:var(--text-4);">LVL ${m.level}/${m.maxLevel}</span>
                </div>
                <div class="module-level">Eff ${(m.efficiency * 100).toFixed(0)}% • Pwr ${m.powerConsumption.toFixed(0)} • Health ${m.health.toFixed(0)}%</div>
              </div>
              <div class="module-health"><div class="module-health-fill" style="width:${m.health}%;background:${m.health < 30 ? 'var(--red)' : m.health < 70 ? 'var(--amber)' : 'var(--green)'}"></div></div>
            </div>
          `}).join('')}
        </div>
      `;
      actionBar.innerHTML = `
        <button class="btn btn-small" id="btn-repair-all">🔧 Repair All Critical</button>
        <button class="btn btn-small" id="btn-power-dist">⚡ Power Dist</button>
        <button class="btn btn-small" id="btn-ship-details">Details</button>
      `;
      panel.querySelectorAll('.module-row').forEach(el => {
        el.addEventListener('click', () => {
          const modId = (el as HTMLElement).dataset.module!;
          const mod = ship.modules.find(m => m.id === modId);
          if (mod) this.showModuleModal(mod);
        });
      });
      actionBar.querySelector('#btn-repair-all')?.addEventListener('click', () => {
        let repaired = 0;
        for (const m of ship.modules) {
          if (m.health < 100) {
            if (this.engine.shipManager.repairModule(m.id, 100)) repaired++;
          }
        }
        this.showToast(`Repaired ${repaired} modules — heat +2%`);
        this.updateLeftPanel();
      });
      actionBar.querySelector('#btn-power-dist')?.addEventListener('click', () => {
        this.showModal('Power Distribution — Reactor Control', `
          <div style="font-size:10px;color:var(--text-2);margin-bottom:12px;">Power is generated by reactor, consumed by modules. Low power → shield offline, modules offline, morale ↓. Heat ↑ reduces efficiency.</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${ship.modules.map(m => {
              const def = MODULE_DEFS[m.type];
              const cons = def.basePower + (m.level-1)*def.powerPerLevel;
              const isOffline = m.health < 20;
              return `<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-1);border-left:2px solid ${isOffline ? 'var(--red)' : 'var(--border-1)'};padding:6px 8px;font-size:9px;">
                <div style="display:flex;justify-content:space-between;"><span style="font-weight:700;">${m.name}</span><span style="color:${isOffline ? 'var(--red)' : 'var(--text-2)'}">${isOffline ? 'OFFLINE' : cons.toFixed(0)+' PWR'}</span></div>
                <div style="font-size:8px;color:var(--text-3);">Health ${m.health.toFixed(0)}% • Eff ${(m.efficiency*100).toFixed(0)}%</div>
              </div>`;
            }).join('')}
          </div>
          <div style="margin-top:12px;padding:8px;background:rgba(0,229,255,0.06);border:1px solid rgba(0,229,255,0.15);font-size:9px;color:var(--text-2);">
            Total consumption affects heat. Reactor health ${(ship.modules.find(mm=>mm.type==='reactor' as any)?.health || 100).toFixed(0)}% directly affects power max. Damaged modules consume more.
          </div>
        `, [{ label: 'Close', action: () => this.hideModal() }]);
      });
      actionBar.querySelector('#btn-ship-details')?.addEventListener('click', () => {
        this.showModal('AETHER-01 Technical Readout', `
          <div style="font-family:'Share Tech Mono', monospace;font-size:9px;line-height:1.6;color:var(--text-2);">
            <div style="display:grid;grid-template-columns:100px 1fr;gap:4px 12px;">
              <span style="color:var(--text-3);">VESSEL</span><span style="color:var(--text-1);font-weight:700;">${ship.name}</span>
              <span style="color:var(--text-3);">CLASS</span><span>Deep Space Exploration • Class-7 • 180m • 12 decks</span>
              <span style="color:var(--text-3);">POWER TREND</span><span style="color:${powerTrend === 'falling' ? 'var(--red)' : 'var(--green)'};">${powerTrend.toUpperCase()} ${powerTrendIcon}</span>
              <span style="color:var(--text-3);">HEAT TREND</span><span style="color:${heatTrend === 'rising' ? 'var(--red)' : 'var(--cyan)'};">${heatTrend.toUpperCase()} ${heatTrendIcon} • ${ship.heat.toFixed(0)}%</span>
              <span style="color:var(--text-3);">INTERCONNECTION</span><span>Power → Shield, Sensors, FTL • Heat → Shield penalty • Fuel → Heat • Hull → Cargo • Morale → Weapon • Oxygen → Morale</span>
            </div>
          </div>
        `, [{ label: 'Close', action: () => this.hideModal() }]);
      });
    } else if (this.currentView === 'crew') {
      const crew = this.engine.state.crew;
      panel.innerHTML = `
        <div class="section-title">Crew Manifest — ${crew.length} Members</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">Average Morale: ${this.engine.crewManager.getAverageMorale().toFixed(0)}% • Total Salary: ${crew.reduce((s, c) => s + c.salary, 0)} CR/day</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${crew.map(member => `
            <div class="crew-card" data-crew="${member.id}" style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;padding:12px;cursor:pointer;">
              <div style="display:flex;gap:12px;align-items:flex-start;">
                <div style="width:40px;height:40px;background:linear-gradient(135deg, ${(Object.values(FACTIONS)[member.level % Object.values(FACTIONS).length] as any)?.color || '#5aa0ff'} 0%, #1a2a4a 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${member.name.split(' ').map(n => n[0]).join('')}</div>
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:700;font-size:13px;">${member.name}</div>
                    <div style="font-size:10px;background:rgba(90,160,255,0.15);padding:2px 6px;border-radius:10px;">LVL ${member.level}</div>
                  </div>
                  <div style="font-size:11px;color:var(--accent-2);text-transform:uppercase;letter-spacing:0.05em;">${member.role} • ${member.origin}</div>
                  <div style="font-size:10px;color:var(--text-dim);margin-top:4px;">${member.personality} • ${member.traits.join(', ')}</div>
                  <div style="display:flex;gap:8px;margin-top:8px;font-size:10px;">
                    <span style="color:${member.morale < 40 ? 'var(--danger)' : member.morale < 70 ? 'var(--warning)' : 'var(--success)'}">Morale ${member.morale.toFixed(0)}%</span>
                    <span>Health ${member.health.toFixed(0)}%</span>
                    <span>Loyalty ${member.loyalty}%</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      actionBar.innerHTML = `
        <button class="btn btn-small" id="btn-recruit">👤 Recruit (500 CR)</button>
        <button class="btn btn-small" id="btn-crew-bonus">Boost Morale</button>
      `;
      panel.querySelectorAll('.crew-card').forEach(el => {
        el.addEventListener('click', () => {
          const crewId = (el as HTMLElement).dataset.crew!;
          const member = crew.find(c => c.id === crewId);
          if (member) this.showCrewModal(member);
        });
      });
      actionBar.querySelector('#btn-recruit')?.addEventListener('click', () => {
        if (this.engine.state.player.credits < 500) {
          this.showToast('Need 500 credits', 'danger');
          return;
        }
        this.engine.state.player.credits -= 500;
        const rng = this.engine.rng.fork(`recruit-${Date.now()}`);
        import('../crew/crew').then(mod => {
          const m = mod.generateCrewMember(rng);
          this.engine.crewManager.addMember(m);
          this.engine.save();
          this.updateLeftPanel();
          this.showToast(`Recruited ${m.name}`, 'success');
        });
      });
      actionBar.querySelector('#btn-crew-bonus')?.addEventListener('click', () => {
        this.engine.crewManager.updateMorale(10, 'bonus');
        this.engine.save();
        this.updateLeftPanel();
        this.showToast('Morale boosted!', 'success');
      });
    } else if (this.currentView === 'quests') {
      const available = this.engine.questManager.available;
      const active = this.engine.questManager.active;
      const completed = this.engine.questManager.completed;

      panel.innerHTML = `
        <div class="section-title">Active Quests (${active.length})</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
          ${active.length ? active.map(q => `
            <div class="quest-card active" data-quest="${q.id}" style="background:linear-gradient(135deg, rgba(90,160,255,0.08), rgba(255,255,255,0.02));border:1px solid var(--border);border-left:3px solid ${q.id.startsWith('main-') ? '#d8b4fe' : 'var(--accent)'};border-radius:4px;padding:12px;cursor:pointer;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-weight:700;font-size:12px;">${q.title} ${q.id.startsWith('main-') ? '<span style="background:rgba(216,180,254,0.2);color:#d8b4fe;padding:1px 4px;border-radius:3px;font-size:9px;">MAIN</span>' : ''}</div>
                <div style="font-size:10px;background:rgba(90,160,255,0.15);padding:2px 6px;border-radius:10px;">${q.type}</div>
              </div>
              <div style="font-size:11px;color:var(--text-dim);line-height:1.4;margin-bottom:8px;">${q.description}</div>
              <div style="font-size:10px;">
                ${q.objectives.map(o => `<div style="display:flex;gap:6px;align-items:center;padding:2px 0;"><span style="color:${o.completed ? 'var(--success)' : 'var(--text-faint)'}">${o.completed ? '✓' : '○'}</span><span style="color:${o.completed ? 'var(--text-faint)' : 'var(--text)'};text-decoration:${o.completed ? 'line-through' : 'none'}">${o.description}</span></div>`).join('')}
              </div>
            </div>
          `).join('') : '<div style="font-size:11px;color:var(--text-faint)">No active quests</div>'}
        </div>

        <div class="section-title">Available Missions (${available.length})</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
          ${available.map(q => `
            <div class="quest-card" data-quest="${q.id}" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-left:3px solid ${q.id.startsWith('main-') ? '#d8b4fe' : 'transparent'};border-radius:4px;padding:10px;cursor:pointer;">
              <div style="display:flex;justify-content:space-between;">
                <div style="font-weight:600;font-size:11px;">${q.title} ${q.id.startsWith('main-') ? '<span style="color:#d8b4fe">★</span>' : ''}</div>
                <div style="font-size:9px;padding:2px 6px;border-radius:10px;background:${q.rarity === 'legendary' || q.rarity === 'unique' ? 'rgba(216,180,254,0.2)' : q.rarity === 'rare' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)'};color:${q.rarity === 'legendary' || q.rarity === 'unique' ? '#d8b4fe' : q.rarity === 'rare' ? '#fbbf24' : 'var(--text-dim)'}">${q.rarity}</div>
              </div>
              <div style="font-size:10px;color:var(--text-dim);margin-top:4px;">${q.type} • ${q.giver.name} • ${q.rewards.credits} CR</div>
            </div>
          `).join('')}
        </div>

        <div class="section-title">Completed (${completed.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${completed.slice(0, 5).map(q => `
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:4px;padding:8px;font-size:10px;opacity:0.6;">
              <div style="font-weight:600;">✓ ${q.title} ${q.selectedChoice ? `(${q.selectedChoice})` : ''}</div>
              <div style="color:var(--text-faint);">Completed • ${q.rewards.credits} CR</div>
            </div>
          `).join('') || '<div style="font-size:11px;color:var(--text-faint)">None yet</div>'}
        </div>
      `;
      actionBar.innerHTML = `
        <button class="btn btn-small" id="btn-gen-quests">Generate Missions</button>
      `;

      panel.querySelectorAll('.quest-card').forEach(el => {
        el.addEventListener('click', () => {
          const questId = (el as HTMLElement).dataset.quest!;
          const quest = [...available, ...active, ...completed].find(q => q.id === questId);
          if (quest) this.showQuestModal(quest);
        });
      });

      actionBar.querySelector('#btn-gen-quests')?.addEventListener('click', () => {
        this.engine.questManager.generateAvailableQuests(this.engine.rng, this.engine.galaxy, 3, this.engine.state.player.level);
        this.engine.state.quests.available = this.engine.questManager.available;
        this.engine.save();
        this.updateLeftPanel();
        this.showToast('Generated 3 new missions');
      });
    } else if (this.currentView === 'story') {
      const progress = this.engine.storyManager.getProgress();
      const currentChapter = this.engine.storyManager.getCurrentChapter();
      panel.innerHTML = `
        <div class="section-title">Main Story — ${progress.chapter}/${progress.total}</div>
        <div style="margin-bottom:16px;">
          <div style="font-size:14px;font-weight:700;color:#d8b4fe;margin-bottom:4px;">${progress.currentTitle}</div>
          <div style="width:100%;height:6px;background:rgba(216,180,254,0.15);border-radius:3px;overflow:hidden;margin-bottom:8px;"><div style="width:${progress.percent}%;height:100%;background:linear-gradient(90deg, #d8b4fe, #5aa0ff);"></div></div>
          <div style="font-size:10px;color:var(--text-faint);">${progress.percent.toFixed(0)}% complete • ${this.engine.state.player.discoveries} discoveries • ${this.engine.state.player.systemsVisited} systems</div>
        </div>

        ${currentChapter ? `
          <div style="background:linear-gradient(135deg, rgba(216,180,254,0.08), rgba(90,160,255,0.06));border:1px solid rgba(216,180,254,0.2);border-radius:8px;padding:16px;margin-bottom:20px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#d8b4fe;">${currentChapter.title}</div>
            <div style="font-size:11px;color:var(--text-dim);line-height:1.6;margin-bottom:12px;">${currentChapter.description}</div>
            <div style="font-size:10px;color:var(--text-faint);">Requires: Level ${currentChapter.requiredLevel} • ${currentChapter.requiredDiscoveries} discoveries • ${currentChapter.requiredSystems} systems</div>
            <div style="margin-top:12px;font-size:10px;">
              Quests in chapter: ${currentChapter.quests.join(', ')}
            </div>
          </div>
        ` : '<div style="font-size:12px;color:var(--success);text-align:center;padding:20px;">★ Story Complete — You have unraveled the mystery. But the galaxy is vast, and more stories await.</div>'}

        <div class="section-title">All Chapters</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${this.engine.storyManager.chapters.map((ch, idx) => `
            <div style="background:${ch.isCompleted ? 'rgba(74,222,128,0.06)' : idx === this.engine.storyManager.currentChapterIndex ? 'rgba(216,180,254,0.08)' : 'rgba(255,255,255,0.02)'};border:1px solid ${ch.isCompleted ? 'rgba(74,222,128,0.2)' : idx === this.engine.storyManager.currentChapterIndex ? 'rgba(216,180,254,0.3)' : 'var(--border)'};border-radius:6px;padding:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-weight:700;font-size:12px;color:${ch.isCompleted ? 'var(--success)' : idx === this.engine.storyManager.currentChapterIndex ? '#d8b4fe' : 'var(--text-dim)'}">${ch.isCompleted ? '✓' : idx === this.engine.storyManager.currentChapterIndex ? '▶' : '○'} ${ch.title}</div>
                <div style="font-size:10px;color:var(--text-faint);">LVL ${ch.requiredLevel}</div>
              </div>
              <div style="font-size:11px;color:var(--text-dim);margin-top:6px;line-height:1.4;">${ch.description}</div>
              <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                ${ch.quests.map(qId => `<span style="font-size:9px;background:${this.engine.storyManager.completedQuests.has(qId) ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)'};border:1px solid ${this.engine.storyManager.completedQuests.has(qId) ? 'rgba(74,222,128,0.2)' : 'var(--border)'};padding:2px 6px;border-radius:3px;">${qId}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="section-title" style="margin-top:20px;">Lore Progress</div>
        <div style="font-size:11px;color:var(--text-dim);">
          Codex: ${this.engine.codexManager.getProgress().unlocked}/${this.engine.codexManager.getProgress().total} entries<br>
          Categories: ${this.engine.codexManager.getAllCategories().join(', ') || 'None yet'}<br><br>
          The Ancient signal countdown: 68.4% and accelerating. What happens at zero?
        </div>
      `;
      actionBar.innerHTML = `
        <button class="btn btn-small" id="btn-story-refresh">Check Progress</button>
      `;
      actionBar.querySelector('#btn-story-refresh')?.addEventListener('click', () => {
        this.engine.save();
        this.updateLeftPanel();
        this.showToast('Story progress checked');
      });
    } else if (this.currentView === 'combat') {
      const encounter = this.engine.combatManager.currentEncounter;
      const combatLog = this.engine.combatManager.getLog();
      const ship = this.engine.shipManager.state;
      panel.innerHTML = `
        <div class="section-title">Combat — Ship Tactical</div>
        ${encounter ? `
          <div style="background:linear-gradient(135deg, rgba(255,77,106,0.1), rgba(255,255,255,0.02));border:1px solid rgba(255,77,106,0.3);border-radius:6px;padding:12px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <div style="font-weight:700;font-size:14px;color:var(--danger);">${encounter.enemyName}</div>
              <div style="font-size:10px;padding:2px 6px;border-radius:10px;background:rgba(255,77,106,0.2);">${encounter.enemyType} • Danger ${(encounter.danger * 100).toFixed(0)}%</div>
            </div>
            <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">${encounter.description}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
              <div>Enemy Hull: ${encounter.enemyHull.toFixed(0)}/${encounter.enemyHullMax}</div>
              <div>Enemy Shield: ${encounter.enemyShield.toFixed(0)}</div>
              <div>Enemy Weapon: ${encounter.enemyWeapon.toFixed(0)}</div>
              <div>Rewards: ${encounter.rewards.credits} CR</div>
            </div>
            <div style="margin-top:12px;">
              <div style="font-size:10px;color:var(--text-faint);margin-bottom:4px;">Enemy Hull</div>
              <div style="width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;"><div style="width:${(encounter.enemyHull / encounter.enemyHullMax) * 100}%;height:100%;background:linear-gradient(90deg, #ff4d6a, #ff8a8a);"></div></div>
            </div>
            <div style="margin-top:8px;">
              <div style="font-size:10px;color:var(--text-faint);margin-bottom:4px;">Enemy Shield</div>
              <div style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;"><div style="width:${Math.min(100, encounter.enemyShield)}%;height:100%;background:linear-gradient(90deg, #5aa0ff, #9ef0ff);"></div></div>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;padding:10px;margin-bottom:12px;max-height:150px;overflow-y:auto;font-size:10px;line-height:1.5;">
            ${combatLog.map(l => `<div style="padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.03);">${l}</div>`).join('') || '<div style="color:var(--text-faint);">Combat log empty</div>'}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <button class="btn btn-primary btn-small" id="btn-combat-attack">⚔ Attack (${ship.weaponPower.toFixed(0)} dmg)</button>
            <button class="btn btn-small" id="btn-combat-escape">🏃 Escape</button>
            ${encounter.canNegotiate ? `<button class="btn btn-small" id="btn-combat-negotiate">💬 Negotiate</button>` : ''}
            ${encounter.canHack ? `<button class="btn btn-small" id="btn-combat-hack">💻 Hack</button>` : ''}
            <button class="btn btn-small" id="btn-combat-distract">✦ Distract</button>
          </div>
        ` : `
          <div style="font-size:12px;color:var(--text-dim);line-height:1.6;margin-bottom:16px;">
            No active combat. Travel to dangerous systems (danger >40%) to encounter enemies.<br><br>
            <strong>Enemy Types:</strong><br>
            • Pirate — common, can negotiate, weak<br>
            • Military — disciplined, strong armor<br>
            • Drone — no crew, can hack<br>
            • Alien — bio-ship, unpredictable<br>
            • Ancient Machine — far beyond us, can hack, legendary loot<br>
            • Unknown Entity — reality bends, high risk<br><br>
            <strong>Tactics:</strong> Fight, Escape, Negotiate, Hack, Distract, Hide — choose wisely.
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;margin-bottom:16px;">
            <div>Hull: ${ship.hull.toFixed(0)}/${ship.hullMax}</div>
            <div>Shield: ${ship.shield.toFixed(0)}/${ship.shieldMax}</div>
            <div>Weapon: ${ship.weaponPower.toFixed(0)}</div>
            <div>Armor: ${ship.armor.toFixed(0)}</div>
            <div>Drones: ${ship.drones}</div>
            <div>Probes: ${ship.probes}</div>
          </div>
        `}
      `;
      actionBar.innerHTML = `
        <button class="btn btn-small" id="btn-combat-new">⚔ New Encounter</button>
        <button class="btn btn-small" id="btn-combat-clear">Clear</button>
      `;

      if (encounter) {
        panel.querySelector('#btn-combat-attack')?.addEventListener('click', () => {
          const result = this.engine.combatManager.attack(ship.weaponPower, ship.shield);
          if (result.playerDamage > 0) this.engine.shipManager.damageHull(result.playerDamage);
          const over = this.engine.combatManager.isCombatOver();
          if (over.over) {
            if (over.victory) {
              this.showToast(`Victory! +${encounter.rewards.credits} CR`, 'success');
              this.engine.state.player.credits += encounter.rewards.credits;
              if (encounter.rewards.resources) {
                for (const [res, amt] of Object.entries(encounter.rewards.resources)) {
                  this.engine.shipManager.addResource(res as any, amt as number);
                }
              }
              if (encounter.rewards.reputation) {
                for (const [fac, rep] of Object.entries(encounter.rewards.reputation)) {
                  this.engine.factionManager.modifyReputation(fac as any, rep as number, 'combat victory');
                }
              }
              this.engine.combatManager.endCombat();
              this.engine.save();
            } else {
              this.showToast('Defeated...', 'danger');
            }
          }
          this.updateLeftPanel();
          this.updateRightPanel();
          this.updateTopBar();
        });
        panel.querySelector('#btn-combat-escape')?.addEventListener('click', () => {
          const res = this.engine.combatManager.attemptEscape(ship.ftlRange);
          this.showToast(res.log, res.success ? 'success' : 'danger');
          if (res.success) {
            this.engine.combatManager.endCombat();
          }
          this.updateLeftPanel();
        });
        panel.querySelector('#btn-combat-negotiate')?.addEventListener('click', () => {
          const rep = encounter.enemyFaction ? this.engine.factionManager.getReputation(encounter.enemyFaction) : 0;
          const res = this.engine.combatManager.attemptNegotiate(this.engine.state.player.credits, rep);
          this.showToast(res.log, res.success ? 'success' : 'warning');
          if (res.success) {
            this.engine.state.player.credits -= res.cost;
            this.engine.combatManager.endCombat();
            this.engine.save();
          }
          this.updateLeftPanel();
        });
        panel.querySelector('#btn-combat-hack')?.addEventListener('click', () => {
          const tech = this.engine.shipManager.state.modules.find(m => m.type === 'science_lab')?.level || 1;
          const res = this.engine.combatManager.attemptHack(tech);
          this.showToast(res.log, res.success ? 'success' : 'danger');
          this.updateLeftPanel();
        });
        panel.querySelector('#btn-combat-distract')?.addEventListener('click', () => {
          const res = this.engine.combatManager.attemptDistract();
          this.showToast(res.log, res.success ? 'success' : 'warning');
          this.updateLeftPanel();
        });
      }

      actionBar.querySelector('#btn-combat-new')?.addEventListener('click', () => {
        const res = this.engine.startCombatEncounter();
        this.showToast(res.message, 'warning');
        this.updateLeftPanel();
      });
      actionBar.querySelector('#btn-combat-clear')?.addEventListener('click', () => {
        this.engine.combatManager.endCombat();
        this.updateLeftPanel();
      });
    } else if (this.currentView === 'crafting') {
      const recipes = this.engine.craftingManager.getAvailableRecipes(this.engine.state.player.level, this.engine.shipManager.state.modules, Array.from(this.engine.researchManager.completed));
      const resources = this.engine.shipManager.state.resources;
      panel.innerHTML = `
        <div class="section-title">Crafting — Ship Workshop</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:16px;">
          Craft modules, drones, probes, repair kits, supplies, equipment.<br>
          Unlocked: ${this.engine.craftingManager.unlockedRecipes.size}/${recipes.length + 3} recipes
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${recipes.map(r => {
            const canCraft = this.engine.craftingManager.canCraft(r.id, resources as any);
            const inputs = Object.entries(r.inputs).map(([res, amt]) => {
              const have = (resources as any)[res] || 0;
              return `<span style="color:${have >= (amt as number) ? 'var(--success)' : 'var(--danger)'};">${have}/${amt} ${res}</span>`;
            }).join(', ');
            return `
              <div style="background:${canCraft ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)'};border:1px solid ${canCraft ? 'rgba(74,222,128,0.2)' : 'var(--border)'};border-radius:6px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <div style="font-weight:700;font-size:12px;">${r.name} ${canCraft ? '<span style="color:var(--success);">●</span>' : '<span style="color:var(--text-faint);">○</span>'}</div>
                  <div style="font-size:9px;padding:2px 6px;border-radius:10px;background:rgba(255,255,255,0.05);">${r.category} • Lvl ${r.requiredLevel}</div>
                </div>
                <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;">${r.description}</div>
                <div style="font-size:10px;color:var(--text-faint);margin-bottom:8px;">Needs: ${inputs}</div>
                <div style="font-size:10px;margin-bottom:8px;">Outputs: ${r.outputs.map(o => `${o.amount} ${o.id}`).join(', ')}</div>
                <button class="btn btn-small ${canCraft ? 'btn-primary' : ''}" data-craft="${r.id}" ${!canCraft ? 'disabled' : ''}>Craft</button>
              </div>
            `;
          }).join('') || '<div style="font-size:11px;color:var(--text-faint);">No recipes available — level up and research</div>'}
        </div>
      `;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint);">Drones: ${this.engine.shipManager.state.drones} • Probes: ${this.engine.shipManager.state.probes} • Cargo: ${this.engine.shipManager.state.cargoUsed.toFixed(0)}/${this.engine.shipManager.state.cargoCapacity}</div>`;

      panel.querySelectorAll('[data-craft]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = (btn as HTMLElement).dataset.craft!;
          const res = this.engine.craftingManager.craft(id, resources as any);
          this.showToast(res.message, res.success ? 'success' : 'danger');
          if (res.success && res.outputs) {
            for (const out of res.outputs) {
              if (out.type === 'drone') this.engine.shipManager.state.drones += out.amount;
              if (out.type === 'probe') this.engine.shipManager.state.probes += out.amount;
              if (out.type === 'resource') {
                const resType = out.id as any;
                if ((this.engine.shipManager.state.resources as any)[resType] !== undefined) {
                  (this.engine.shipManager.state.resources as any)[resType] += out.amount;
                } else {
                  (this.engine.shipManager.state.resources as any)[resType] = ((this.engine.shipManager.state.resources as any)[resType] || 0) + out.amount;
                }
              }
            }
            this.engine.shipManager.recalc();
            this.engine.save();
          }
          this.updateLeftPanel();
          this.updateRightPanel();
        });
      });
    } else if (this.currentView === 'research') {
      const available = this.engine.researchManager.getAvailableNodes();
      const completed = this.engine.researchManager.getCompletedNodes();
      const progress = this.engine.researchManager.getProgress();
      const inProgressId = this.engine.researchManager.inProgress;
      const inProgressNode = inProgressId ? this.engine.researchManager.getNode(inProgressId) : null;
      
      panel.innerHTML = `
        <div class="section-title">Research — Science Lab</div>
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;font-weight:700;margin-bottom:4px;">Progress: ${progress.completed}/${progress.total} (${progress.percent.toFixed(0)}%)</div>
          <div style="width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:8px;"><div style="width:${progress.percent}%;height:100%;background:linear-gradient(90deg, #5aa0ff, #d8b4fe);"></div></div>
          ${inProgressNode ? `
            <div style="background:rgba(90,160,255,0.1);border:1px solid var(--border);border-radius:6px;padding:10px;">
              <div style="font-weight:700;font-size:12px;color:var(--accent-2);">Researching: ${inProgressNode.name} ${inProgressNode.progress.toFixed(0)}%</div>
              <div style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:6px;overflow:hidden;"><div style="width:${inProgressNode.progress}%;height:100%;background:var(--accent);transition:width 0.3s;"></div></div>
              <div style="font-size:10px;color:var(--text-dim);margin-top:4px;">${inProgressNode.description}</div>
            </div>
          ` : '<div style="font-size:11px;color:var(--text-faint);">No research in progress</div>'}
        </div>

        <div class="section-title">Available Research (${available.length})</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
          ${available.map(node => {
            const canAfford = this.engine.researchManager.canAfford(node.id, this.engine.shipManager.state.resources as any, this.engine.state.discoveries.length, this.engine.state.crew.length);
            return `
              <div style="background:${canAfford ? 'rgba(90,160,255,0.06)' : 'rgba(255,255,255,0.02)'};border:1px solid ${canAfford ? 'var(--border-strong)' : 'var(--border)'};border-left:3px solid ${node.category === 'ancient' ? '#d8b4fe' : node.category === 'propulsion' ? '#5aa0ff' : node.category === 'weapons' ? '#ff4d6a' : node.category === 'shields' ? '#4ade80' : '#fbbf24'};border-radius:4px;padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <div style="font-weight:700;font-size:12px;">${node.name}</div>
                  <div style="font-size:9px;padding:2px 6px;border-radius:10px;background:rgba(255,255,255,0.05);">${node.category} • ${node.time}s</div>
                </div>
                <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;">${node.description}</div>
                <div style="font-size:10px;color:var(--text-faint);">Cost: ${Object.entries(node.cost).map(([k,v]) => `${v} ${k}`).join(', ')} • Data ${node.requiredData} • Samples ${node.requiredSamples}</div>
                ${node.prerequisites.length ? `<div style="font-size:9px;color:var(--text-faint);margin-top:4px;">Requires: ${node.prerequisites.join(', ')}</div>` : ''}
                <button class="btn btn-small ${canAfford ? 'btn-primary' : ''}" data-research="${node.id}" ${!canAfford || !!inProgressId ? 'disabled' : ''} style="margin-top:8px;">${canAfford ? 'Start Research' : 'Insufficient'}</button>
              </div>
            `;
          }).join('') || '<div style="font-size:11px;color:var(--text-faint);">No available research — complete prerequisites</div>'}
        </div>

        <div class="section-title">Completed (${completed.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${completed.slice(0, 10).map(n => `
            <div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.2);border-radius:4px;padding:8px;font-size:10px;">
              <div style="font-weight:600;">✓ ${n.name} (${n.category})</div>
              <div style="color:var(--text-faint);">Unlocks: ${n.unlocks.join(', ') || 'None'}</div>
            </div>
          `).join('') || '<div style="font-size:11px;color:var(--text-faint);">None yet</div>'}
        </div>
      `;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint);">Data: ${this.engine.state.discoveries.length} discoveries • Samples: ${this.engine.state.crew.length} crew • Time speeds up research</div>`;

      panel.querySelectorAll('[data-research]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = (btn as HTMLElement).dataset.research!;
          const res = this.engine.researchManager.startResearch(id, this.engine.shipManager.state.resources as any);
          this.showToast(res.message, res.success ? 'success' : 'danger');
          if (res.success) this.engine.save();
          this.updateLeftPanel();
        });
      });
    } else if (this.currentView === 'wormhole') {
      const wormholes = this.engine.wormholeManager.getAllWormholes();
      const discovered = this.engine.wormholeManager.getDiscoveredWormholes();
      const inRange = this.engine.wormholeManager.getWormholesInRange(this.engine.shipManager.state.position, this.engine.shipManager.state.sensorRange * 2);
      
      panel.innerHTML = `
        <div class="section-title">Wormhole Network — Ancient Gates</div>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.6;margin-bottom:16px;">
          Ancient civilization built wormhole network. 8 pairs = 16 wormholes across galaxy.<br>
          Stable: safe, 0-20% risk. Unstable: 30-70% risk, needs stabilizer (crafted from Exotic+DarkMatter). Ancient gates: 0% risk, 0 fuel.<br>
          Travel is instant, no fuel cost, but risk of damage or misjump.
        </div>

        <div style="background:linear-gradient(90deg, rgba(216,180,254,0.1), rgba(90,160,255,0.1));border:1px solid rgba(216,180,254,0.15);border-radius:6px;padding:10px;margin-bottom:16px;">
          <div style="font-weight:700;color:#d8b4fe;font-size:12px;margin-bottom:6px;">Network Stats</div>
          <div style="font-size:10px;line-height:1.5;">
            Total: ${wormholes.length} wormholes (${wormholes.length / 2} pairs)<br>
            Discovered: ${discovered.length} • In Range: ${inRange.length}<br>
            Types: Stable ${wormholes.filter(w => w.type === 'stable').length}, Unstable ${wormholes.filter(w => w.type === 'unstable').length}, Ancient Gate ${wormholes.filter(w => w.type === 'ancient_gate').length}
          </div>
        </div>

        <div class="section-title">Wormholes In Range (${inRange.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px;">
          ${inRange.map(wh => {
            const dist = Math.hypot(wh.position.x - this.engine.shipManager.state.position.x, wh.position.y - this.engine.shipManager.state.position.y);
            const hasStab = (this.engine.shipManager.state.resources as any).wormhole_stabilizer > 0;
            return `
              <div style="background:rgba(255,255,255,0.03);border:1px solid ${wh.type === 'ancient_gate' ? 'rgba(216,180,254,0.3)' : wh.type === 'stable' ? 'rgba(90,160,255,0.3)' : 'rgba(255,77,106,0.3)'};border-radius:6px;padding:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <div style="font-weight:700;font-size:12px;color:${wh.type === 'ancient_gate' ? '#d8b4fe' : wh.type === 'stable' ? '#5aa0ff' : '#ff4d6a'};">🌀 ${wh.id} • ${wh.type} • ${(wh.stability * 100).toFixed(0)}% stable</div>
                  <div style="font-size:10px;color:var(--text-faint);">${dist.toFixed(0)} LY</div>
                </div>
                <div style="font-size:10px;color:var(--text-dim);">Pos: ${wh.position.x.toFixed(0)}, ${wh.position.y.toFixed(0)} → Linked: ${wh.linkedTo?.x.toFixed(0)}, ${wh.linkedTo?.y.toFixed(0)}</div>
                <div style="display:flex;gap:6px;margin-top:8px;">
                  <button class="btn btn-small btn-primary" data-wormhole="${wh.id}">Travel Through</button>
                  <span style="font-size:9px;color:var(--text-faint);align-self:center;">${hasStab ? 'Stabilizer available' : 'No stabilizer'}</span>
                </div>
              </div>
            `;
          }).join('') || '<div style="font-size:11px;color:var(--text-faint);">No wormholes in range — explore deeper, sensor range matters</div>'}
        </div>

        <div class="section-title">All Discovered Wormholes (${discovered.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${discovered.slice(0, 10).map(wh => `
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:4px;padding:8px;font-size:10px;">
              <div style="font-weight:600;">${wh.id} • ${wh.type} • ${(wh.stability * 100).toFixed(0)}%</div>
              <div style="color:var(--text-dim);">${wh.position.x.toFixed(0)}, ${wh.position.y.toFixed(0)} → ${wh.linkedTo?.x.toFixed(0)}, ${wh.linkedTo?.y.toFixed(0)}</div>
            </div>
          `).join('') || '<div style="font-size:11px;color:var(--text-faint);">None discovered yet — random discovery when in range</div>'}
        </div>
      `;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint);">Fuel cost: 0 • Risk depends on stability • Ancient gates safest • Craft stabilizer in Crafting tab</div>`;

      panel.querySelectorAll('[data-wormhole]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = (btn as HTMLElement).dataset.wormhole!;
          const res = this.engine.travelThroughWormhole(id);
          this.showToast(res.message, res.success ? 'success' : 'danger');
          this.updateAll();
        });
      });
    } else if (this.currentView === 'language') {
      const progress = this.engine.languageManager.getProgress();
      const available = this.engine.languageManager.getAvailablePuzzles(this.engine.state.player.level, (this.engine.shipManager.state.resources as any).alien_translator > 0);
      const solved = this.engine.languageManager.getSolvedPuzzles();
      
      panel.innerHTML = `
        <div class="section-title">Alien Language — Decode the Ancient</div>
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;font-weight:700;margin-bottom:4px;">Progress: ${progress.solved}/${progress.total} (${progress.percent.toFixed(0)}%)</div>
          <div style="width:100%;height:6px;background:rgba(216,180,254,0.15);border-radius:3px;overflow:hidden;margin-bottom:8px;"><div style="width:${progress.percent}%;height:100%;background:linear-gradient(90deg, #d8b4fe, #5aa0ff);"></div></div>
          <div style="font-size:11px;color:var(--text-dim);line-height:1.6;">
            Ancient language based on symbols ◈⬡⬔⬓◬◭⬙⬗⬖⬕⬑⬐◫◧◨◩◪⬒⬓.<br>
            Difficulty 1-2: any order. Difficulty 3+: exact order required.<br>
            Needs translator for difficulty >3 (craft in Crafting). Rewards: Codex + Rep Scientific Coalition + Ancient.
          </div>
        </div>

        <div class="section-title">Available Puzzles (${available.length})</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
          ${available.map(puzzle => `
            <div style="background:rgba(216,180,254,0.06);border:1px solid rgba(216,180,254,0.2);border-left:3px solid #d8b4fe;border-radius:4px;padding:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-weight:700;font-size:12px;color:#d8b4fe;">${puzzle.alienWord}</div>
                <div style="font-size:9px;padding:2px 6px;border-radius:10px;background:rgba(216,180,254,0.2);">Difficulty ${puzzle.difficulty}</div>
              </div>
              <div style="font-size:10px;color:var(--text-faint);margin-bottom:8px;">Hint: ${puzzle.humanTranslation ? `${puzzle.humanTranslation.length} chars` : 'Ancient word'} • ${puzzle.symbols.length} symbols given, ${puzzle.difficulty <= 2 ? 'any order' : 'exact order'}</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
                ${puzzle.symbols.map(s => `<span style="width:32px;height:32px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;" data-symbol="${s}" data-puzzle="${puzzle.id}">${s}</span>`).join('')}
              </div>
              <div style="font-size:10px;margin-bottom:6px;">Your guess: <span id="guess-${puzzle.id}" style="letter-spacing:0.2em;color:var(--accent-2);">—</span></div>
              <div style="display:flex;gap:6px;">
                <button class="btn btn-small" data-clear="${puzzle.id}">Clear</button>
                <button class="btn btn-primary btn-small" data-solve="${puzzle.id}">Decode</button>
              </div>
            </div>
          `).join('') || '<div style="font-size:11px;color:var(--text-faint);">No puzzles available — level up, get translator, explore ruins for Ancient data</div>'}
        </div>

        <div class="section-title">Solved (${solved.length})</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${solved.slice(0, 10).map(p => `
            <div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.2);border-radius:4px;padding:8px;font-size:10px;">
              <div style="font-weight:600;">✓ ${p.alienWord} = ${p.humanTranslation}</div>
              <div style="color:var(--text-faint);">Symbols: ${p.symbols.slice(0, 3).join(' ')} • Difficulty ${p.difficulty}</div>
            </div>
          `).join('') || '<div style="font-size:11px;color:var(--text-faint);">None yet</div>'}
        </div>
      `;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint);">Translator: ${(this.engine.shipManager.state.resources as any).alien_translator > 0 ? 'YES' : 'NO'} • Scientific Coalition Rep: ${this.engine.factionManager.getReputation('scientific_coalition' as any)}</div>`;

      // Language puzzle interaction
      const guesses: Record<string, string[]> = {};
      panel.querySelectorAll('[data-symbol]').forEach(el => {
        el.addEventListener('click', () => {
          const puzzleId = (el as HTMLElement).dataset.puzzle!;
          const symbol = (el as HTMLElement).dataset.symbol!;
          if (!guesses[puzzleId]) guesses[puzzleId] = [];
          if (guesses[puzzleId].length < 3) {
            guesses[puzzleId].push(symbol);
            const guessEl = panel.querySelector(`#guess-${puzzleId}`) as HTMLElement;
            if (guessEl) guessEl.textContent = guesses[puzzleId].join(' ');
          }
        });
      });
      panel.querySelectorAll('[data-clear]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = (btn as HTMLElement).dataset.clear!;
          guesses[id] = [];
          const guessEl = panel.querySelector(`#guess-${id}`) as HTMLElement;
          if (guessEl) guessEl.textContent = '—';
        });
      });
      panel.querySelectorAll('[data-solve]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = (btn as HTMLElement).dataset.solve!;
          const guess = guesses[id] || [];
          if (guess.length === 0) {
            this.showToast('Select symbols first', 'warning');
            return;
          }
          const res = this.engine.languageManager.attemptSolve(id, guess);
          this.showToast(res.message, res.success ? 'success' : 'danger');
          if (res.success) {
            const puzzle = this.engine.languageManager.getPuzzle(id);
            if (puzzle?.rewards?.codexEntry) this.engine.codexManager.unlock(puzzle.rewards.codexEntry);
            if (puzzle?.rewards?.reputation) {
              for (const [fac, rep] of Object.entries(puzzle.rewards.reputation)) {
                this.engine.factionManager.modifyReputation(fac as any, rep as number, 'decoded language');
              }
            }
            this.engine.save();
          }
          this.updateLeftPanel();
          this.updateRightPanel();
        });
      });
    }
  }

  private renderCurrentSystemMini(): string {
    const sys = this.engine.getCurrentSystem();
    if (!sys) return '<div style="color:var(--text-dim)">No current system</div>';
    return `
      <div class="system-mini" data-id="${sys.id}" style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;padding:10px;cursor:pointer;">
        <div style="font-weight:700;font-size:13px;">${sys.name}</div>
        <div style="font-size:10px;color:var(--text-dim);">${STAR_TYPES[sys.starType].name} • ${sys.planets.length} planets • ${sys.stations.length} stations</div>
      </div>
    `;
  }

  private renderNearbySystems(): string {
    const nearby = this.engine.getNearbySystems().filter(s => s.id !== this.engine.shipManager.state.currentSystemId).slice(0, 8);
    if (nearby.length === 0) return '<div style="font-size:11px;color:var(--text-dim)">No nearby systems in sensor range</div>';
    return nearby.map(sys => {
      const dist = Math.hypot(sys.position.x - this.engine.shipManager.state.position.x, sys.position.y - this.engine.shipManager.state.position.y);
      const canJump = dist <= this.engine.shipManager.state.ftlRange;
      return `
        <div class="system-mini" data-id="${sys.id}" style="background:rgba(255,255,255,0.02);border:1px solid ${canJump ? 'rgba(90,160,255,0.3)' : 'var(--border)'};border-radius:4px;padding:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-size:12px;font-weight:600;">${sys.name}</div><div style="font-size:10px;color:var(--text-dim);">${STAR_TYPES[sys.starType].name} • ${dist.toFixed(0)} LY</div></div>
          <div style="font-size:10px;color:${canJump ? 'var(--success)' : 'var(--text-faint)'}">${canJump ? 'IN RANGE' : 'OUT OF RANGE'}</div>
        </div>
      `;
    }).join('');
  }

  private updateRightPanel() {
    const panel = this.root.querySelector('#panel-right') as HTMLElement;
    const actionBar = this.root.querySelector('#action-bar-right') as HTMLElement;

    if (this.rightView === 'details') {
      if (this.selectedStationId) {
        const station = this.engine.findStation(this.selectedStationId);
        if (!station) return;
        const faction = (FACTIONS as any)[station.faction];
        panel.innerHTML = `
          <div class="section-title">Station Details</div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">
            <div style="width:48px;height:48px;background:linear-gradient(135deg, ${faction.color}22, ${faction.color}55);border:1px solid ${faction.color};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;">${station.type === 'colony' ? '🏙' : station.type === 'station' ? '🛰' : station.type === 'outpost' ? '📡' : station.type === 'gate' ? '🌀' : '💀'}</div>
            <div><div style="font-size:16px;font-weight:700;">${station.name}</div><div style="font-size:11px;color:var(--text-dim);">${station.type} • ${faction.name}</div></div>
          </div>
          <div style="font-size:11px;line-height:1.6;color:var(--text-dim);margin-bottom:16px;">${station.description || 'No description'}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;margin-bottom:16px;">
            <div>Wealth: ${(station.wealth! * 100).toFixed(0)}%</div>
            <div>Pop: ${station.population?.toLocaleString() || 'Unknown'}</div>
            <div>Services: ${station.services?.length || 0}</div>
            <div>Faction: ${faction.shortName}</div>
          </div>
        `;
        actionBar.innerHTML = `
          <button class="btn btn-small" id="btn-clear-station">Clear</button>
          ${station.services?.includes('refuel') ? `<button class="btn btn-small" id="btn-refuel">⛽ Refuel</button>` : ''}
          ${station.services?.includes('repair') ? `<button class="btn btn-small" id="btn-repair">🔧 Repair</button>` : ''}
          ${station.services?.includes('trade') ? `<button class="btn btn-primary btn-small" id="btn-trade">Trade</button>` : ''}
        `;
        actionBar.querySelector('#btn-clear-station')?.addEventListener('click', () => { this.selectedStationId = null; this.updateRightPanel(); });
        actionBar.querySelector('#btn-refuel')?.addEventListener('click', () => {
          const res = this.engine.refuelAtStation(station.id);
          this.showToast(res.message, res.success ? 'success' : 'danger');
          this.updateRightPanel();
        });
        actionBar.querySelector('#btn-repair')?.addEventListener('click', () => {
          const res = this.engine.repairAtStation(station.id);
          this.showToast(res.message, res.success ? 'success' : 'danger');
          this.updateRightPanel();
        });
        actionBar.querySelector('#btn-trade')?.addEventListener('click', () => {
          this.rightView = 'market';
          this.root.querySelectorAll('.tab[data-rview]').forEach(t => t.classList.remove('active'));
          this.root.querySelector('.tab[data-rview="market"]')?.classList.add('active');
          this.updateRightPanel();
        });
      } else if (this.selectedPlanetId) {
        const planet = this.engine.getPlanetById(this.selectedPlanetId);
        if (!planet) return;
        const def = PLANET_TYPES[planet.type];
        const parentSys = this.engine.galaxy.getSystem(planet.parentSystemId);
        const weatherIcon: Record<string, string> = { clear: '☀️', dust_storm: '🌪️', rain: '🌧️', snow: '❄️', lightning: '⚡', meteor_shower: '☄️', aurora: '🌌', toxic_clouds: '☠️', radiation_storm: '☢️' };
        panel.innerHTML = `
          <div class="section-title">Planet Details — v6 Expanded</div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;">
            <div style="width:48px;height:48px;border-radius:50%;background:${def.color};box-shadow:0 0 20px ${def.color};"></div>
            <div><div style="font-size:16px;font-weight:700;">${planet.name}</div><div style="font-size:11px;color:var(--text-dim);">${def.name} • ${parentSys?.name || ''} • ${(planet as any).landingCategory || 'orbital'}</div></div>
          </div>
          <div style="font-size:11px;line-height:1.6;color:var(--text-dim);margin-bottom:16px;">${planet.description}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;margin-bottom:16px;">
            <div>Temp: ${planet.attributes.temperature.toFixed(0)}°C</div>
            <div>Gravity: ${planet.attributes.gravity.toFixed(1)} G</div>
            <div>Atmosphere: ${(planet.attributes.atmosphere * 100).toFixed(0)}%</div>
            <div>Radiation: ${(planet.attributes.radiation * 100).toFixed(0)}%</div>
            <div>Weather: ${(weatherIcon[(planet as any).weather] || '')} ${(planet as any).weather || 'clear'}</div>
            <div>Landing: ${(planet as any).landingCategory || (planet.isLandable ? 'landing' : 'flyby')}</div>
          </div>
          <div style="font-size:10px;color:var(--text-faint);margin-bottom:12px;">Resources: ${Object.entries(planet.resources).map(([k, v]) => `${k} ${v}`).join(' • ') || 'None'}</div>
          ${planet.hasLife ? `<div style="background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.3);border-radius:4px;padding:8px;font-size:11px;margin-bottom:12px;">🧬 Life detected</div>` : ''}
          ${planet.hasRuins ? `<div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:4px;padding:8px;font-size:11px;margin-bottom:12px;">◈ Ruins detected — Ancient origin</div>` : ''}
          ${(planet as any).moons && (planet as any).moons.length ? `
            <div class="section-title">Moons (${(planet as any).moons.length})</div>
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
              ${(planet as any).moons.map((m: any) => `
                <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:4px;padding:8px;font-size:10px;">
                  <div style="font-weight:600;">${m.name} • ${PLANET_TYPES[m.type as keyof typeof PLANET_TYPES]?.name || m.type} • R ${m.radius}</div>
                  <div style="color:var(--text-dim);">T ${m.attributes.temperature.toFixed(0)}°C • G ${m.attributes.gravity.toFixed(1)} • Water ${(m.attributes.water * 100).toFixed(0)}% ${m.hasLife ? '• 🧬 Life' : ''} ${m.hasRuins ? '• ◈ Ruins' : ''}</div>
                  <div style="color:var(--text-faint);">Resources: ${Object.entries(m.resources).map(([k, v]) => `${k} ${v}`).join(', ')}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        `;
        actionBar.innerHTML = `
          <button class="btn btn-small" id="btn-clear-planet">Clear</button>
          <button class="btn btn-primary btn-small" id="btn-scan-planet" ${planet.scanned ? 'disabled' : ''}>${planet.scanned ? 'Scanned' : '🔍 Scan'}</button>
          ${planet.isLandable ? `<button class="btn btn-small" id="btn-land" ${!planet.scanned ? 'disabled' : ''}>🚀 Land</button>` : ''}
        `;
        actionBar.querySelector('#btn-clear-planet')?.addEventListener('click', () => { this.selectedPlanetId = null; this.updateRightPanel(); this.updateLeftPanel(); });
        actionBar.querySelector('#btn-scan-planet')?.addEventListener('click', () => {
          const res = this.engine.startPlanetScan(planet.id);
          this.showToast(res.message, res.success ? 'success' : 'warning');
        });
        actionBar.querySelector('#btn-land')?.addEventListener('click', () => {
          // v5: Open 3D planet surface
          this.openPlanetSurface(planet.id);
          for (const [resType, amt] of Object.entries(planet.resources)) {
            this.engine.shipManager.addResource(resType as ResourceType, Math.floor((amt as number) * 0.25));
          }
          this.engine.crewManager.gainXP('explorer' as any, 25);
          this.updateLeftPanel();
          this.updateRightPanel();
        });
      } else if (this.selectedSystemId) {
        const sys = this.engine.galaxy.getSystem(this.selectedSystemId);
        if (!sys) return;
        panel.innerHTML = `
          <div class="section-title">System Intel</div>
          <div style="font-size:12px;line-height:1.6;color:var(--text-dim);margin-bottom:16px;">
            ${STAR_TYPES[sys.starType].description}<br><br>
            <strong>Danger:</strong> ${(sys.dangerLevel * 100).toFixed(0)}%<br>
            <strong>Discovery:</strong> ${sys.discoveryState}<br>
            ${sys.faction ? `<strong>Faction:</strong> ${(FACTIONS as any)[sys.faction].name}<br>` : ''}
          </div>
        `;
        actionBar.innerHTML = `<button class="btn btn-small" id="btn-focus">◉ Focus Map</button><button class="btn btn-small" id="btn-details-clear">Clear</button>`;
        actionBar.querySelector('#btn-focus')?.addEventListener('click', () => this.getActiveRenderer().focusOn(sys.position));
        actionBar.querySelector('#btn-details-clear')?.addEventListener('click', () => { this.selectedSystemId = null; this.updateLeftPanel(); this.updateRightPanel(); });
      } else {
        panel.innerHTML = `
          <div class="section-title">Captain's Log</div>
          <div style="font-size:11px;line-height:1.7;color:var(--text-dim);">
            Welcome aboard AETHER-01 v5 — WebGL 100k stars.<br><br>
            Level ${this.engine.state.player.level} • ${this.engine.state.player.systemsVisited} systems<br>
            ${this.engine.state.discoveries.length} discoveries • ${this.engine.state.player.distanceTraveled.toFixed(0)} LY<br>
            ${this.engine.state.player.credits} credits • ${this.engine.state.crew.length} crew<br>
            Chapter ${this.engine.storyManager.getProgress().chapter}/${this.engine.storyManager.getProgress().total}: ${this.engine.storyManager.getProgress().currentTitle}<br><br>
            <strong style="color:#d8b4fe">Main Mystery:</strong> The Ancient signal counts down. The silent planet waits. Your choices matter.<br><br>
            <strong>New in v5:</strong> WebGL 100k stars with twinkle shader, volumetric nebulae, black hole lensing, cockpit HUD, planet landing 3D with procedural terrain.
          </div>
        `;
        actionBar.innerHTML = `<button class="btn btn-small" id="btn-center-ship">◉ Center on Ship</button>`;
        actionBar.querySelector('#btn-center-ship')?.addEventListener('click', () => this.getActiveRenderer().focusOn(this.engine.shipManager.state.position));
      }
    } else if (this.rightView === 'market') {
      if (!this.selectedStationId) {
        const currentSys = this.engine.getCurrentSystem();
        const stations = currentSys?.stations.filter(s => s.market) || [];
        if (stations.length === 0) {
          panel.innerHTML = `<div class="section-title">Market</div><div style="font-size:11px;color:var(--text-faint)">No market in current system.</div>`;
          actionBar.innerHTML = '';
        } else {
          panel.innerHTML = `
            <div class="section-title">Markets in ${currentSys?.name}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${stations.map(st => `
                <div class="station-card" data-station="${st.id}" style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;padding:10px;cursor:pointer;">
                  <div style="font-weight:700;font-size:12px;">${st.name}</div>
                  <div style="font-size:10px;color:var(--text-dim);">${st.type} • ${(FACTIONS as any)[st.faction].name}</div>
                </div>
              `).join('')}
            </div>
          `;
          actionBar.innerHTML = '';
          panel.querySelectorAll('.station-card').forEach(el => {
            el.addEventListener('click', () => {
              this.selectedStationId = (el as HTMLElement).dataset.station!;
              this.updateRightPanel();
            });
          });
        }
      } else {
        const station = this.engine.findStation(this.selectedStationId);
        if (!station || !station.market) {
          panel.innerHTML = `<div style="color:var(--text-dim)">No market data</div>`;
          return;
        }
        panel.innerHTML = `
          <div class="section-title">Market — ${station.name}</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${station.market.map(item => {
              const def = RESOURCES[item.resource];
              const have = this.engine.shipManager.state.resources[item.resource] || 0;
              return `
                <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;padding:10px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:14px;">${def.icon}</span>
                      <div><div style="font-weight:600;font-size:11px;">${def.name}</div><div style="font-size:10px;color:var(--text-dim);">Stock ${item.stock} • Have ${have}</div></div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:11px;font-weight:700;">Buy ${item.sellPrice} CR</div>
                      <div style="font-size:10px;color:var(--text-dim);">Sell ${item.buyPrice} CR</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;margin-top:8px;">
                    <button class="btn btn-small" data-buy="${item.resource}" data-amount="1">Buy 1</button>
                    <button class="btn btn-small" data-buy="${item.resource}" data-amount="10">Buy 10</button>
                    <button class="btn btn-small" data-sell="${item.resource}" data-amount="1">Sell 1</button>
                    <button class="btn btn-small" data-sell="${item.resource}" data-amount="10">Sell 10</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        actionBar.innerHTML = `<button class="btn btn-small" id="btn-back-markets">← Markets</button><div style="font-size:10px;color:var(--text-faint);margin-left:auto;">Credits: ${this.engine.state.player.credits} CR</div>`;
        actionBar.querySelector('#btn-back-markets')?.addEventListener('click', () => { this.selectedStationId = null; this.updateRightPanel(); });
        panel.querySelectorAll('[data-buy]').forEach(btn => {
          btn.addEventListener('click', () => {
            const res = (btn as HTMLElement).dataset.buy as ResourceType;
            const amt = parseInt((btn as HTMLElement).dataset.amount!);
            const result = this.engine.buyResource(station.id, res, amt);
            this.showToast(result.message, result.success ? 'success' : 'danger');
            this.updateRightPanel();
            this.updateLeftPanel();
          });
        });
        panel.querySelectorAll('[data-sell]').forEach(btn => {
          btn.addEventListener('click', () => {
            const res = (btn as HTMLElement).dataset.sell as ResourceType;
            const amt = parseInt((btn as HTMLElement).dataset.amount!);
            const result = this.engine.sellResource(station.id, res, amt);
            this.showToast(result.message, result.success ? 'success' : 'danger');
            this.updateRightPanel();
            this.updateLeftPanel();
          });
        });
      }
    } else if (this.rightView === 'factions') {
      const summary = this.engine.factionManager.getSummary();
      panel.innerHTML = `
        <div class="section-title">Factions — Reputation</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${summary.map(f => `
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-left:3px solid ${f.color};border-radius:4px;padding:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-weight:700;font-size:12px;color:${f.color}">${f.name}</div>
                <div style="font-size:10px;padding:2px 8px;border-radius:10px;background:${f.attitude === 'hostile' ? 'rgba(255,77,106,0.2)' : f.attitude === 'friendly' || f.attitude === 'allied' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)'}">${f.attitude.toUpperCase()}</div>
              </div>
              <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;">${(FACTIONS as any)[f.id].description}</div>
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;"><span>Reputation</span><span style="font-weight:700;">${f.reputation}/100</span></div>
              <div style="width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;"><div style="width:${((f.reputation + 100) / 2)}%;height:100%;background:${f.color};"></div></div>
            </div>
          `).join('')}
        </div>
      `;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint)">Day ${this.engine.state.time.day}</div>`;
    } else if (this.rightView === 'lore') {
      const progress = this.engine.codexManager.getProgress();
      const categories = this.engine.codexManager.getAllCategories();
      const unlocked = this.engine.codexManager.getUnlockedEntries();
      const selectedEntry = this.selectedCodexId ? this.engine.codexManager.getEntry(this.selectedCodexId) : null;

      if (selectedEntry) {
        panel.innerHTML = `
          <div class="section-title"><span style="cursor:pointer;color:var(--accent);" id="back-lore">← Lore</span> • ${selectedEntry.category.toUpperCase()}</div>
          <div style="margin-bottom:16px;">
            <div style="font-size:18px;font-weight:700;margin-bottom:4px;">${selectedEntry.title}</div>
            <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;">${selectedEntry.description} • ${selectedEntry.rarity}</div>
            <div style="font-size:10px;color:var(--text-faint);">${selectedEntry.discoveredAt ? `Discovered ${new Date(selectedEntry.discoveredAt).toLocaleDateString()}` : 'Ancient knowledge'}</div>
          </div>
          <div style="font-size:12px;line-height:1.7;color:var(--text-dim);white-space:pre-wrap;">${selectedEntry.longDescription}</div>
          ${selectedEntry.relatedEntries?.length ? `
            <div class="section-title" style="margin-top:20px;">Related Entries</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${selectedEntry.relatedEntries.map(id => {
                const rel = this.engine.codexManager.getEntry(id);
                const isUnlocked = this.engine.codexManager.isUnlocked(id);
                return `<span class="codex-related" data-codex="${id}" style="background:${isUnlocked ? 'rgba(90,160,255,0.1)' : 'rgba(255,255,255,0.03)'};border:1px solid ${isUnlocked ? 'var(--border-strong)' : 'var(--border)'};border-radius:10px;padding:4px 8px;font-size:10px;cursor:${isUnlocked ? 'pointer' : 'default'};color:${isUnlocked ? 'var(--accent-2)' : 'var(--text-faint)'}">${rel?.title || id} ${isUnlocked ? '' : '🔒'}</span>`;
              }).join('')}
            </div>
          ` : ''}
          ${selectedEntry.unlocks?.length ? `
            <div class="section-title" style="margin-top:16px;">Unlocks</div>
            <div style="font-size:11px;color:var(--text-dim);">${selectedEntry.unlocks.join(', ')}</div>
          ` : ''}
        `;
        actionBar.innerHTML = `<button class="btn btn-small" id="btn-back-lore-2">← Back to Lore</button>`;
        panel.querySelectorAll('.codex-related').forEach(el => {
          el.addEventListener('click', () => {
            const id = (el as HTMLElement).dataset.codex!;
            if (this.engine.codexManager.isUnlocked(id)) {
              this.selectedCodexId = id;
              this.updateRightPanel();
            }
          });
        });
        panel.querySelector('#back-lore')?.addEventListener('click', () => { this.selectedCodexId = null; this.updateRightPanel(); });
        actionBar.querySelector('#btn-back-lore-2')?.addEventListener('click', () => { this.selectedCodexId = null; this.updateRightPanel(); });
      } else {
        panel.innerHTML = `
          <div class="section-title">Ancient Lore — ${progress.unlocked}/${progress.total} Entries (${progress.percent.toFixed(0)}%)</div>
          <div style="width:100%;height:4px;background:rgba(216,180,254,0.15);border-radius:2px;overflow:hidden;margin-bottom:16px;"><div style="width:${progress.percent}%;height:100%;background:linear-gradient(90deg, #d8b4fe, #5aa0ff);"></div></div>
          
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
            ${categories.map(cat => `<span style="background:rgba(216,180,254,0.1);border:1px solid rgba(216,180,254,0.2);border-radius:10px;padding:3px 8px;font-size:10px;text-transform:uppercase;color:#d8b4fe;">${cat}</span>`).join('') || '<span style="font-size:11px;color:var(--text-faint)">No categories yet — explore!</span>'}
          </div>

          ${['ancient', 'anomaly', 'technology', 'stellar', 'planetary', 'faction', 'phenomena', 'history'].map(cat => {
            const entries = unlocked.filter(e => e.category === cat);
            if (entries.length === 0) return '';
            return `
              <div class="section-title" style="margin-top:16px;">${cat.toUpperCase()} (${entries.length})</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${entries.map(entry => `
                  <div class="codex-entry" data-codex="${entry.id}" style="background:linear-gradient(135deg, ${entry.rarity === 'unique' ? 'rgba(216,180,254,0.08)' : entry.rarity === 'legendary' ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)'} 0%, rgba(255,255,255,0.02) 100%);border:1px solid ${entry.rarity === 'unique' ? 'rgba(216,180,254,0.3)' : entry.rarity === 'legendary' ? 'rgba(251,191,36,0.2)' : 'var(--border)'};border-left:3px solid ${entry.rarity === 'unique' ? '#d8b4fe' : entry.rarity === 'legendary' ? '#fbbf24' : entry.rarity === 'rare' ? '#5aa0ff' : 'var(--border)'};border-radius:4px;padding:10px;cursor:pointer;transition:all 0.2s;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <div style="font-weight:700;font-size:11px;">${entry.title}</div>
                      <div style="font-size:9px;padding:2px 6px;border-radius:10px;background:${entry.rarity === 'unique' ? 'rgba(216,180,254,0.2)' : 'rgba(255,255,255,0.05)'};color:${entry.rarity === 'unique' ? '#d8b4fe' : 'var(--text-faint)'}">${entry.rarity}</div>
                    </div>
                    <div style="font-size:10px;color:var(--text-dim);margin-top:4px;line-height:1.4;">${entry.description}</div>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}

          <div class="section-title" style="margin-top:20px;">Locked Entries — Hints</div>
          <div style="font-size:10px;color:var(--text-faint);line-height:1.6;">
            ${Object.values(CODEX_ENTRIES).filter(e => !this.engine.codexManager.isUnlocked(e.id)).slice(0, 5).map(e => `🔒 ${e.title} — ${e.category} • ${e.rarity} • Hint: ${e.description}`).join('<br>') || 'All discovered!'}
          </div>
        `;
        actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint)">Explore ruins, scan anomalies, and complete main story to unlock lore</div>`;

        panel.querySelectorAll('.codex-entry').forEach(el => {
          el.addEventListener('click', () => {
            this.selectedCodexId = (el as HTMLElement).dataset.codex!;
            this.updateRightPanel();
          });
        });
      }
    } else if (this.rightView === 'discoveries') {
      const discs = this.engine.state.discoveries;
      panel.innerHTML = `
        <div class="section-title">Codex — ${discs.length} Discoveries</div>
        <div class="discovery-list">
          ${discs.length === 0 ? '<div style="font-size:11px;color:var(--text-faint)">No discoveries yet</div>' : discs.map(d => `
            <div class="discovery-card ${d.rarity === 'rare' || d.rarity === 'very_rare' ? 'rare' : ''} ${d.rarity === 'legendary' || d.rarity === 'unique' ? 'legendary' : ''}">
              <div class="discovery-title">${d.name}</div>
              <div class="discovery-desc">${d.description}</div>
              <div class="discovery-meta">
                <span>${d.type}</span>
                <span>${d.rarity}</span>
                <span>Sci ${d.scientificValue}</span>
                <span>${new Date(d.discoveredAt).toLocaleTimeString()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint)">Total Sci: ${discs.reduce((s, d) => s + d.scientificValue, 0)} • Lore: ${this.engine.codexManager.getProgress().unlocked} entries</div>`;
    } else if (this.rightView === 'world') {
      const events = this.engine.worldMemory.getRecentEvents(20);
      const systemChanges = Array.from(this.engine.worldMemory.systemChanges.entries()).slice(0, 5);
      panel.innerHTML = `
        <div class="section-title">World Memory — Galaxy Remembers</div>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.6;margin-bottom:16px;">
          Your actions have consequences. The galaxy is not static — colonies grow, pirates move, factions react, stations are built. This is your legacy.
        </div>

        <div class="section-title">Recent Events (${events.length})</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
          ${events.length ? events.map(e => `
            <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-left:3px solid ${e.type === 'colony_helped' ? 'var(--success)' : e.type === 'pirate_destroyed' ? 'var(--warning)' : e.type === 'ruins_discovered' ? '#d8b4fe' : 'var(--accent)'};border-radius:4px;padding:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <div style="font-weight:700;font-size:11px;">${e.type.replace('_', ' ').toUpperCase()}</div>
                <div style="font-size:9px;color:var(--text-faint);">${new Date(e.timestamp).toLocaleDateString()}</div>
              </div>
              <div style="font-size:11px;color:var(--text-dim);line-height:1.4;">${e.description}</div>
              <div style="font-size:10px;color:var(--text-faint);margin-top:4px;">System: ${e.systemId} • ${e.isPermanent ? 'Permanent' : 'Temporary'} • ${e.consequences.length} consequences</div>
            </div>
          `).join('') : '<div style="font-size:11px;color:var(--text-faint)">No events yet — explore and make choices!</div>'}
        </div>

        <div class="section-title">System Changes</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          ${systemChanges.length ? systemChanges.map(([sysId, changes]) => `
            <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:4px;padding:8px;font-size:10px;">
              <div style="font-weight:600;">${sysId} — ${changes.length} changes</div>
              <div style="color:var(--text-dim);margin-top:4px;">${changes.slice(0, 2).map(c => `${c.reason} (${Object.keys(c.changes).join(', ')})`).join('<br>')}</div>
            </div>
          `).join('') : '<div style="font-size:11px;color:var(--text-faint)">No system changes yet</div>'}
        </div>

        <div class="section-title">How World Memory Works</div>
        <div style="font-size:11px;color:var(--text-dim);line-height:1.6;">
          • Help colony → wealth + pop growth<br>
          • Destroy pirates → danger -20%, traders +10 rep<br>
          • Find ruins → triggers investigation quest<br>
          • Recover Ancient tech → Coalition +15 rep<br>
          • Over time: new stations built, faction wars change danger, trade routes shift<br>
          • Your choices in main story have permanent consequences (e.g., destroying tower stops signal)
        </div>
      `;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint)">Events: ${events.length} • System changes: ${this.engine.worldMemory.systemChanges.size} • Day ${this.engine.state.time.day}</div>`;
    } else if (this.rightView === 'resources') {
      const res = this.engine.shipManager.state.resources;
      panel.innerHTML = `
        <div class="section-title">Cargo Bay</div>
        <div class="resource-grid">
          ${Object.entries(res).map(([type, amount]) => {
            const def = RESOURCES[type as ResourceType];
            return `<div class="resource-item"><div class="resource-icon">${def.icon}</div><div><div style="font-size:11px;font-weight:600;">${def.name}</div><div class="resource-name">${type}</div></div><div class="resource-amount">${amount}</div></div>`;
          }).join('')}
        </div>
        <div class="section-title" style="margin-top:16px;">Capacity</div>
        <div style="font-size:11px;color:var(--text-dim);">
          Used: ${this.engine.shipManager.state.cargoUsed.toFixed(0)} / ${this.engine.shipManager.state.cargoCapacity}<br>
          <div style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin-top:6px;overflow:hidden;"><div style="width:${Math.min(100, (this.engine.shipManager.state.cargoUsed / this.engine.shipManager.state.cargoCapacity) * 100)}%;height:100%;background:var(--accent);"></div></div>
        </div>
      `;
      actionBar.innerHTML = `<button class="btn btn-small" id="btn-dump-cargo">Dump 10% Cargo</button>`;
      actionBar.querySelector('#btn-dump-cargo')?.addEventListener('click', () => {
        for (const k of Object.keys(res)) {
          res[k as ResourceType] = Math.floor(res[k as ResourceType]! * 0.9);
        }
        this.engine.shipManager.recalc();
        this.updateRightPanel();
        this.showToast('Dumped 10% cargo');
      });
    } else if (this.rightView === 'log') {
      const history = eventBus.getHistory().slice(0, 50);
      panel.innerHTML = `
        <div class="section-title">Event Log</div>
        <div class="log-container">
          ${history.map(ev => `
            <div class="log-entry">
              <span class="log-time">${new Date(ev.timestamp).toLocaleTimeString()}</span>
              <span class="log-type ${ev.type.includes('DISCOVERY') ? 'discovery' : ev.type.includes('DAMAGED') || ev.type.includes('LOW') ? 'danger' : 'system'}">${ev.type}</span>
              <span>${JSON.stringify(ev.data).substring(0, 80)}</span>
            </div>
          `).join('')}
        </div>
      `;
      actionBar.innerHTML = `<button class="btn btn-small" id="btn-clear-log">Clear Log</button>`;
      actionBar.querySelector('#btn-clear-log')?.addEventListener('click', () => { eventBus.getHistory().length = 0; this.updateRightPanel(); });
    } else if (this.rightView === 'combat') {
      this.currentView = 'combat';
      this.updateLeftPanel();
      panel.innerHTML = `<div style="font-size:11px;color:var(--text-dim);">Combat view moved to left panel — see left for tactical combat. Right panel shows log.</div>`;
      actionBar.innerHTML = `<button class="btn btn-small" id="btn-combat-right-new">New Encounter</button>`;
      actionBar.querySelector('#btn-combat-right-new')?.addEventListener('click', () => {
        const res = this.engine.startCombatEncounter();
        this.showToast(res.message, 'warning');
        this.updateLeftPanel();
        this.updateRightPanel();
      });
    } else if (this.rightView === 'crafting') {
      this.currentView = 'crafting';
      this.updateLeftPanel();
      panel.innerHTML = `<div style="font-size:11px;color:var(--text-dim);">Crafting moved to left panel — see left for recipes. Right shows cargo.</div>`;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint);">Craft from left, cargo here</div>`;
    } else if (this.rightView === 'research') {
      this.currentView = 'research';
      this.updateLeftPanel();
      panel.innerHTML = `<div style="font-size:11px;color:var(--text-dim);">Research moved to left — see left for tree. Progress: ${this.engine.researchManager.getProgress().percent.toFixed(0)}%</div>`;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint);">Research from left</div>`;
    } else if (this.rightView === 'wormhole') {
      this.currentView = 'wormhole';
      this.updateLeftPanel();
      panel.innerHTML = `<div style="font-size:11px;color:var(--text-dim);">Wormhole network — see left for travel. Discovered: ${this.engine.wormholeManager.getDiscoveredWormholes().length}</div>`;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint);">Wormhole travel from left</div>`;
    } else if (this.rightView === 'language') {
      this.currentView = 'language';
      this.updateLeftPanel();
      panel.innerHTML = `<div style="font-size:11px;color:var(--text-dim);">Alien language puzzles — see left. Solved: ${this.engine.languageManager.getProgress().solved}/${this.engine.languageManager.getProgress().total}</div>`;
      actionBar.innerHTML = `<div style="font-size:10px;color:var(--text-faint);">Decode Ancient language</div>`;
    }
  }

  private showSystemTooltip(id: string | null) {
    if (!id) {
      this.tooltipEl.classList.remove('visible');
      return;
    }
    const sys = this.engine.galaxy.getSystem(id);
    if (!sys) return;
    if (sys.discoveryState === SystemDiscoveryState.Unknown) {
      this.tooltipEl.innerHTML = `<div style="color:var(--text-faint)">Unknown System</div>`;
    } else {
      const starDef = STAR_TYPES[sys.starType];
      this.tooltipEl.innerHTML = `
        <div style="font-weight:700;">${sys.name}</div>
        <div style="color:var(--text-dim);font-size:10px;">${starDef.name} • ${sys.planets.length} planets • ${sys.stations.length} stations</div>
        <div style="font-size:10px;margin-top:4px;">${sys.discoveryState} • Danger ${(sys.dangerLevel * 100).toFixed(0)}%</div>
        ${sys.faction ? `<div style="font-size:10px;color:${(FACTIONS as any)[sys.faction].color}">${(FACTIONS as any)[sys.faction].name} • Rep ${this.engine.factionManager.getReputation(sys.faction)}</div>` : ''}
        ${this.engine.worldMemory.getEventsForSystem(sys.id).length ? `<div style="font-size:9px;color:#d8b4fe;margin-top:4px;">${this.engine.worldMemory.getEventsForSystem(sys.id).length} world events</div>` : ''}
      `;
    }
    const rect = this.galaxyCanvas.getBoundingClientRect();
    this.tooltipEl.style.left = `${rect.left + 20}px`;
    this.tooltipEl.style.top = `${rect.top + 20}px`;
    this.tooltipEl.classList.add('visible');
  }

  private doLongRangeScan() {
    const nearby = this.engine.galaxy.getSystemsInRange(this.engine.shipManager.state.position, this.engine.shipManager.state.sensorRange * 1.5);
    let revealed = 0;
    for (const sys of nearby) {
      if (sys.discoveryState === SystemDiscoveryState.Unknown) {
        this.engine.galaxy.revealSystem(sys.id, SystemDiscoveryState.Detected);
        revealed++;
      }
    }
    this.engine.save();
    // Premium scan pulse effect
    const active = this.getActiveRenderer();
    const shipScreen = active.worldToScreen(this.engine.shipManager.state.position);
    this.triggerScanPulse(shipScreen.x, shipScreen.y);
    this.showToast(`Long range scan: ${revealed} new systems`, 'success');
    this.updateLeftPanel();
  }

  private triggerFTLAnimation() {
    const overlay = this.root.querySelector('#ftl-overlay') as HTMLElement;
    if (!overlay) return;
    overlay.classList.add('active');
    // Chromatic aberration + stretch
    document.body.style.filter = 'contrast(1.2) saturate(1.3)';
    setTimeout(() => {
      overlay.classList.remove('active');
      document.body.style.filter = '';
    }, 1200);
  }

  private triggerScanPulse(x: number, y: number) {
    const container = this.root.querySelector('#scan-pulse-container') as HTMLElement;
    if (!container) return;
    const pulse = document.createElement('div');
    pulse.className = 'scan-pulse';
    pulse.style.left = `${x}px`;
    pulse.style.top = `${y}px`;
    container.appendChild(pulse);
    setTimeout(() => pulse.remove(), 2000);
    // Also emit 3 pulses staggered
    for (let i = 1; i < 3; i++) {
      setTimeout(() => {
        const p2 = document.createElement('div');
        p2.className = 'scan-pulse';
        p2.style.left = `${x}px`;
        p2.style.top = `${y}px`;
        p2.style.animationDelay = `${i * 0.3}s`;
        container.appendChild(p2);
        setTimeout(() => p2.remove(), 2000);
      }, i * 300);
    }
  }

  private triggerScreenShake(intensity: number = 8, duration: number = 400) {
    const center = this.root.querySelector('#center-view') as HTMLElement;
    if (!center) return;
    center.style.animation = `shake ${duration}ms cubic-bezier(.36,.07,.19,.97) both`;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shake {
        10%, 90% { transform: translate3d(-${intensity * 0.1}px, 0, 0); }
        20%, 80% { transform: translate3d(${intensity * 0.2}px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-${intensity * 0.4}px, 0, 0); }
        40%, 60% { transform: translate3d(${intensity * 0.4}px, 0, 0); }
      }
    `;
    document.head.appendChild(style);
    setTimeout(() => {
      center.style.animation = '';
      style.remove();
    }, duration);
  }

  private triggerDiscoveryGlitch(title: string) {
    // Typewriter + glitch effect for important discoveries
    this.showToast(`◈ DISCOVERY: ${title}`, 'success');
    const panel = this.root.querySelector('#panel-right') as HTMLElement;
    if (panel) {
      panel.style.animation = 'flicker 0.3s ease-in-out 3';
      setTimeout(() => panel.style.animation = '', 1000);
    }
  }

  private showModuleModal(mod: any) {
    const def = MODULE_DEFS[mod.type as ModuleType];
    const nextLevel = mod.level + 1;
    const canUpgrade = mod.level < mod.maxLevel;
    let costStr = '';
    if (canUpgrade) {
      costStr = Object.entries(def.baseUpgradeCost).map(([res, base]) => {
        const cost = Math.ceil((base as number) * Math.pow(1.5, nextLevel - 1));
        const have = this.engine.shipManager.state.resources[res as ResourceType] || 0;
        return `<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><span>${res}</span><span style="color:${have >= cost ? 'var(--success)' : 'var(--danger)'}">${have}/${cost}</span></div>`;
      }).join('');
    }
    this.showModal(`${def.name} — Level ${mod.level}`, `
      <div style="display:flex;gap:16px;margin-bottom:16px;">
        <div style="width:48px;height:48px;background:rgba(90,160,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">${def.icon}</div>
        <div style="flex:1;"><div style="font-size:12px;color:var(--text-dim);">${def.description}</div><div style="margin-top:8px;font-size:11px;">Health: ${mod.health.toFixed(0)}% • Eff: ${(mod.efficiency * 100).toFixed(0)}% • Power: ${mod.powerConsumption.toFixed(0)}</div></div>
      </div>
      ${canUpgrade ? `<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;padding:12px;"><div style="font-size:11px;font-weight:700;margin-bottom:8px;">Upgrade to ${nextLevel}</div>${costStr}</div>` : `<div style="color:var(--text-dim);font-size:11px;">Max level</div>`}
    `, [
      { label: 'Close', action: () => this.hideModal() },
      ...(canUpgrade ? [{ label: `Upgrade to ${nextLevel}`, primary: true, action: () => { if (this.engine.shipManager.upgradeModule(mod.id)) { this.showToast(`${def.name} upgraded`, 'success'); this.hideModal(); this.updateLeftPanel(); } else { this.showToast('Insufficient resources', 'danger'); } } }] : []),
      { label: 'Repair', action: () => { if (this.engine.shipManager.repairModule(mod.id, 25)) { this.showToast('Repaired'); this.updateLeftPanel(); this.hideModal(); } else { this.showToast('Not enough minerals', 'danger'); } } }
    ]);
  }

  private showCrewModal(member: any) {
    this.showModal(`${member.name} — ${member.role}`, `
      <div style="display:flex;gap:16px;margin-bottom:16px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg, #5aa0ff22, #1a2a4a);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;">${member.name.split(' ').map((n: string) => n[0]).join('')}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;">${member.name}</div>
          <div style="font-size:11px;color:var(--accent-2);text-transform:uppercase;">${member.role} • LVL ${member.level} • ${member.origin}</div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:8px;font-style:italic;">"${member.bio}"</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;margin-bottom:16px;">
        <div>Morale: ${member.morale.toFixed(0)}%</div><div>Health: ${member.health.toFixed(0)}%</div><div>Loyalty: ${member.loyalty}%</div><div>Salary: ${member.salary} CR/day</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
        ${Object.entries(member.skills).map(([k, v]) => `<div style="display:flex;justify-content:space-between;background:rgba(255,255,255,0.03);padding:4px 8px;border-radius:3px;"><span>${k}</span><span style="font-weight:700;">${v}/10</span></div>`).join('')}
      </div>
    `, [
      { label: 'Close', action: () => this.hideModal() },
      { label: 'Rest (+10 morale)', action: () => { member.morale = Math.min(100, member.morale + 10); member.status = 'resting'; this.engine.save(); this.updateLeftPanel(); this.hideModal(); } },
    ]);
  }

  private showQuestModal(quest: any) {
    const isActive = quest.status === 'active';
    const isAvailable = quest.status === 'available';
    const canComplete = isActive && quest.objectives.every((o: any) => o.completed);

    this.showModal(quest.title, `
      <div style="margin-bottom:16px;">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <span style="background:rgba(90,160,255,0.15);padding:2px 8px;border-radius:10px;font-size:10px;text-transform:uppercase;">${quest.type}</span>
          <span style="background:${quest.rarity === 'unique' ? 'rgba(216,180,254,0.2)' : 'rgba(255,255,255,0.05)'};padding:2px 8px;border-radius:10px;font-size:10px;">${quest.rarity}</span>
          <span style="font-size:10px;color:var(--text-faint);">${quest.status}</span>
          ${quest.id.startsWith('main-') ? '<span style="background:rgba(216,180,254,0.2);color:#d8b4fe;padding:2px 8px;border-radius:10px;font-size:10px;">MAIN STORY</span>' : ''}
        </div>
        <div style="font-size:12px;line-height:1.6;color:var(--text-dim);margin-bottom:16px;">${quest.description}</div>
      </div>
      <div class="section-title">Objectives</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
        ${quest.objectives.map((o: any) => `
          <div style="display:flex;gap:8px;background:${o.completed ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)'};border:1px solid ${o.completed ? 'rgba(74,222,128,0.2)' : 'var(--border)'};border-radius:4px;padding:8px;font-size:11px;">
            <span style="color:${o.completed ? 'var(--success)' : 'var(--text-faint)'}">${o.completed ? '✓' : '○'}</span>
            <div style="flex:1;"><div style="font-weight:600;">${o.description}</div><div style="font-size:10px;color:var(--text-faint);">${o.type} ${o.targetSystemId || ''}</div></div>
          </div>
        `).join('')}
      </div>
      <div class="section-title">Rewards</div>
      <div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.2);border-radius:6px;padding:12px;font-size:11px;margin-bottom:16px;">
        <div>Credits: <strong>${quest.rewards.credits}</strong></div>
        ${quest.rewards.resources ? `<div>Resources: ${Object.entries(quest.rewards.resources).map(([k, v]) => `${v} ${k}`).join(', ')}</div>` : ''}
        ${quest.rewards.reputation ? `<div>Rep: ${Object.entries(quest.rewards.reputation).map(([k, v]) => `${(FACTIONS as any)[k].shortName} +${v}`).join(', ')}</div>` : ''}
      </div>
      ${quest.branchingChoices ? `
        <div class="section-title">Choices — Choose wisely, consequences are permanent</div>
        <div style="display:flex;flex-direction:column;gap:6px;" id="choice-container">
          ${quest.branchingChoices.map((c: any) => `
            <div class="choice-card" data-choice="${c.id}" style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;padding:10px;cursor:pointer;transition:all 0.2s;">
              <div style="font-weight:700;font-size:11px;margin-bottom:4px;">${c.label}</div>
              <div style="font-size:10px;color:var(--text-dim);">${c.description}</div>
              <div style="font-size:10px;color:#d8b4fe;margin-top:4px;">→ ${c.consequences}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `, [
      { label: 'Close', action: () => this.hideModal() },
      ...(isAvailable ? [{ label: 'Accept Quest', primary: true, action: () => { const res = this.engine.acceptQuest(quest.id); this.showToast(res.message, res.success ? 'success' : 'danger'); this.hideModal(); this.updateLeftPanel(); } }] : []),
      ...(canComplete && !quest.branchingChoices ? [{ label: 'Complete Quest', primary: true, action: () => { const res = this.engine.completeQuest(quest.id); this.showToast(res.message, res.success ? 'success' : 'danger'); this.hideModal(); this.updateLeftPanel(); this.updateRightPanel(); } }] : []),
      ...(canComplete && quest.branchingChoices ? [{ label: 'Complete with Choice', primary: true, action: () => {
        const selected = (this.root.querySelector('.choice-card.selected') as HTMLElement)?.dataset.choice;
        if (!selected) { this.showToast('Select a choice first', 'warning'); return; }
        const res = this.engine.completeQuest(quest.id, selected);
        this.showToast(res.message, res.success ? 'success' : 'danger');
        this.hideModal();
        this.updateLeftPanel();
        this.updateRightPanel();
      }}] : []),
    ]);

    // Choice selection
    setTimeout(() => {
      this.root.querySelectorAll('.choice-card').forEach(el => {
        el.addEventListener('click', () => {
          this.root.querySelectorAll('.choice-card').forEach(c => c.classList.remove('selected'));
          (el as HTMLElement).classList.add('selected');
          (el as HTMLElement).style.borderColor = '#d8b4fe';
          (el as HTMLElement).style.background = 'rgba(216,180,254,0.1)';
        });
      });
    }, 100);
  }

  private showModal(title: string, body: string, actions: { label: string; primary?: boolean; action: () => void }[] = []) {
    const overlay = this.root.querySelector('#modal-overlay') as HTMLElement;
    (this.root.querySelector('#modal-title') as HTMLElement).textContent = title;
    (this.root.querySelector('#modal-body') as HTMLElement).innerHTML = body;
    const footer = this.root.querySelector('#modal-footer') as HTMLElement;
    footer.innerHTML = '';
    for (const act of actions) {
      const btn = document.createElement('button');
      btn.className = `btn ${act.primary ? 'btn-primary' : ''} btn-small`;
      btn.textContent = act.label;
      btn.addEventListener('click', act.action);
      footer.appendChild(btn);
    }
    overlay.classList.add('active');
  }

  private hideModal() {
    (this.root.querySelector('#modal-overlay') as HTMLElement).classList.remove('active');
  }

  private showToast(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info') {
    // Ensure toast container exists
    let container = document.querySelector('.toast-container') as HTMLElement;
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Add icon based on type
    const icons: Record<string, string> = { success: '✓', danger: '⚠', warning: '◈', info: '●' };
    toast.innerHTML = `<span style="margin-right:8px;opacity:0.8;">${icons[type] || '●'}</span>${message}`;
    container.appendChild(toast);
    // Subtle sound
    try { (this.engine as any).audioManager?.playSFX?.(type === 'danger' ? 'alert' : type === 'success' ? 'discovery' : 'click'); } catch {}
    setTimeout(() => { 
      toast.style.opacity = '0'; 
      toast.style.transform = 'translateX(20px) scale(0.98)'; 
      toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => toast.remove(), 300); 
    }, 3200);
  }

  private updateScanOverlay() {
    if (this.engine.isScanning) {
      if (!this.scanOverlay) {
        this.scanOverlay = document.createElement('div');
        this.scanOverlay.className = 'scan-overlay';
        this.scanOverlay.innerHTML = `
          <div class="scan-circle"></div>
          <div class="scan-text" id="scan-text">Scanning...</div>
          <div class="scan-progress-bar"><div class="scan-progress-fill" id="scan-fill" style="width:0%"></div></div>
        `;
        this.root.querySelector('#center-view')?.appendChild(this.scanOverlay);
      }
      const fill = this.scanOverlay.querySelector('#scan-fill') as HTMLElement;
      const text = this.scanOverlay.querySelector('#scan-text') as HTMLElement;
      if (fill) fill.style.width = `${this.engine.scanProgress}%`;
      if (text) text.textContent = `${this.engine.scanTarget?.type.toUpperCase()} SCAN ${this.engine.scanProgress.toFixed(0)}%`;
    } else {
      if (this.scanOverlay) {
        this.scanOverlay.remove();
        this.scanOverlay = null;
      }
    }
  }

  private updateAll() {
    this.updateTopBar();
    this.updateCenterView();
    this.updateLeftPanel();
    this.updateRightPanel();
  }
}
