import type { Galaxy } from '../galaxy/galaxy';
import { SystemDiscoveryState } from '../core/types';
import { STAR_TYPES } from '../data/starTypes';
import type { Vec2 } from '../utils/math';

export class GalaxyRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  galaxy: Galaxy;
  offset: Vec2 = { x: 0, y: 0 };
  scale: number = 0.15;
  targetOffset: Vec2 = { x: 0, y: 0 };
  targetScale: number = 0.15;
  isDragging: boolean = false;
  lastMouse: Vec2 = { x: 0, y: 0 };
  hoveredSystemId: string | null = null;
  selectedSystemId: string | null = null;
  shipPos: Vec2 = { x: 0, y: 0 };
  sensorRange: number = 500;
  ftlRange: number = 600;
  showSectorGrid: boolean = true;
  showNebulae: boolean = true;
  showDeepSpacePOIs: boolean = true;
  wormholes: any[] = [];

  onSystemHover?: (id: string | null) => void;
  onSystemSelect?: (id: string) => void;
  onSectorHover?: (coord: Vec2 | null) => void;

  // Background cache
  private backgroundCanvas: HTMLCanvasElement;
  private backgroundCtx: CanvasRenderingContext2D;
  private nebulae: { pos: Vec2; radius: number; color: string }[] = [];
  private lastBackgroundScale: number = 0;
  private lastBackgroundOffset: Vec2 = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement, galaxy: Galaxy) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('no ctx');
    this.ctx = ctx;
    this.galaxy = galaxy;

    // Background canvas for nebulae and Milky Way (offscreen for performance)
    this.backgroundCanvas = document.createElement('canvas');
    const bgCtx = this.backgroundCanvas.getContext('2d', { alpha: true });
    if (!bgCtx) throw new Error('no bg ctx');
    this.backgroundCtx = bgCtx;

    // Generate nebulae from galactic structure
    this.nebulae = (galaxy as any).structure?.generateNebulae?.(25) || this.generateFallbackNebulae();

    this.setupEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private generateFallbackNebulae() {
    const nebulae = [];
    const colors = ['rgba(150,80,200,0.08)', 'rgba(80,150,200,0.06)', 'rgba(200,80,80,0.07)'];
    for (let i = 0; i < 15; i++) {
      nebulae.push({
        pos: { x: (Math.random() - 0.5) * 20000, y: (Math.random() - 0.5) * 10000 },
        radius: Math.random() * 5000 + 1000,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return nebulae;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.backgroundCanvas.width = this.canvas.clientWidth * dpr;
    this.backgroundCanvas.height = this.canvas.clientHeight * dpr;
    this.backgroundCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.lastBackgroundScale = 0; // force redraw
  }

  setupEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMouse.x;
        const dy = e.clientY - this.lastMouse.y;
        this.targetOffset.x += dx / this.targetScale;
        this.targetOffset.y += dy / this.targetScale;
        this.lastMouse = { x: e.clientX, y: e.clientY };
      } else {
        this.checkHover(e.clientX, e.clientY);
      }
    });
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      // v4: larger zoom range for true scale — from 0.01 (galaxy view) to 2.0 (system view)
      this.targetScale = Math.min(2.0, Math.max(0.01, this.targetScale + delta * this.targetScale));
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      if (this.isDragging) return;
      const id = this.getSystemAt(e.clientX, e.clientY);
      if (id) {
        this.selectedSystemId = id;
        this.onSystemSelect?.(id);
      }
    });

    // Double click to focus
    this.canvas.addEventListener('dblclick', (e) => {
      const world = this.screenToWorld(e.clientX, e.clientY);
      this.focusOn(world);
    });
  }

  worldToScreen(world: Vec2): Vec2 {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    return {
      x: (world.x + this.offset.x) * this.scale + w / 2,
      y: (world.y + this.offset.y) * this.scale + h / 2,
    };
  }

  screenToWorld(screenX: number, screenY: number): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    return {
      x: (x - w / 2) / this.scale - this.offset.x,
      y: (y - h / 2) / this.scale - this.offset.y,
    };
  }

  getSystemAt(screenX: number, screenY: number): string | null {
    const world = this.screenToWorld(screenX, screenY);
    let closest: string | null = null;
    let minDist = 30 / this.scale;
    for (const sys of this.galaxy.getAllSystems()) {
      if (sys.discoveryState === SystemDiscoveryState.Unknown) continue;
      const dx = sys.position.x - world.x;
      const dy = sys.position.y - world.y;
      const d = Math.hypot(dx, dy);
      if (d < minDist) {
        minDist = d;
        closest = sys.id;
      }
    }
    return closest;
  }

  checkHover(screenX: number, screenY: number) {
    const id = this.getSystemAt(screenX, screenY);
    if (id !== this.hoveredSystemId) {
      this.hoveredSystemId = id;
      this.onSystemHover?.(id);
    }

    // Sector hover for LOD view
    if (this.scale < 0.05) {
      const world = this.screenToWorld(screenX, screenY);
      const sectorCoord = (this.galaxy as any).worldToSector?.(world) || { x: Math.floor(world.x / 1000), y: Math.floor(world.y / 1000) };
      this.onSectorHover?.(sectorCoord);
    } else {
      this.onSectorHover?.(null);
    }
  }

  setShipPosition(pos: Vec2, sensorRange: number, ftlRange: number) {
    this.shipPos = pos;
    this.sensorRange = sensorRange;
    this.ftlRange = ftlRange;
  }

  focusOn(pos: Vec2) {
    this.targetOffset = { x: -pos.x, y: -pos.y };
  }

  update() {
    this.offset.x += (this.targetOffset.x - this.offset.x) * 0.1;
    this.offset.y += (this.targetOffset.y - this.offset.y) * 0.1;
    this.scale += (this.targetScale - this.scale) * 0.1;
  }

  updateWormholes(wormholes: any[]) {
    this.wormholes = wormholes;
  }

  private renderBackground() {
    const ctx = this.backgroundCtx;
    const w = this.backgroundCanvas.clientWidth / (window.devicePixelRatio || 1);
    const h = this.backgroundCanvas.clientHeight / (window.devicePixelRatio || 1);

    // Only redraw background if scale/offset changed significantly
    const scaleDiff = Math.abs(this.scale - this.lastBackgroundScale);
    const offsetDiff = Math.hypot(this.offset.x - this.lastBackgroundOffset.x, this.offset.y - this.lastBackgroundOffset.y);
    if (scaleDiff < 0.005 && offsetDiff < 50 && this.lastBackgroundScale !== 0) {
      return; // use cached
    }

    this.lastBackgroundScale = this.scale;
    this.lastBackgroundOffset = { ...this.offset };

    ctx.clearRect(0, 0, w, h);

    // Milky Way band — dense star field in galactic plane
    if (this.scale < 0.2) {
      const bandY = this.worldToScreen({ x: 0, y: 0 }).y;
      const bandHeight = 200 * this.scale + 50;

      const grad = ctx.createLinearGradient(0, bandY - bandHeight, 0, bandY + bandHeight);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.3, 'rgba(100, 140, 200, 0.03)');
      grad.addColorStop(0.5, 'rgba(150, 180, 220, 0.06)');
      grad.addColorStop(0.7, 'rgba(100, 140, 200, 0.03)');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.fillRect(0, bandY - bandHeight, w, bandHeight * 2);

      // Core glow
      const coreScreen = this.worldToScreen({ x: 0, y: 0 });
      const coreGrad = ctx.createRadialGradient(coreScreen.x, coreScreen.y, 0, coreScreen.x, coreScreen.y, 300 * this.scale);
      coreGrad.addColorStop(0, 'rgba(255, 220, 150, 0.15)');
      coreGrad.addColorStop(0.3, 'rgba(200, 150, 100, 0.08)');
      coreGrad.addColorStop(0.6, 'rgba(100, 80, 60, 0.03)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(coreScreen.x, coreScreen.y, 300 * this.scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nebulae
    if (this.showNebulae) {
      ctx.globalCompositeOperation = 'screen';
      for (const neb of this.nebulae) {
        const screen = this.worldToScreen(neb.pos);
        const radius = neb.radius * this.scale;
        if (radius < 2) continue;
        if (screen.x < -radius || screen.x > w + radius || screen.y < -radius || screen.y > h + radius) continue;

        const grad = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(0.5, neb.color.replace(/0\.\d+\)/, '0.02)'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // Sector grid for LOD and to show emptiness
    if (this.showSectorGrid && this.scale < 0.15) {
      ctx.strokeStyle = 'rgba(100,140,200,0.03)';
      ctx.lineWidth = 1;
      const sectorSizeScreen = 1000 * this.scale;
      if (sectorSizeScreen > 5) {
        const offsetX = (this.offset.x * this.scale + w / 2) % sectorSizeScreen;
        const offsetY = (this.offset.y * this.scale + h / 2) % sectorSizeScreen;
        for (let x = offsetX; x < w; x += sectorSizeScreen) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = offsetY; y < h; y += sectorSizeScreen) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Render background to offscreen canvas
    this.renderBackground();
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(this.backgroundCanvas, 0, 0, w, h);

    // LOD: if zoomed out far, show sectors as density heatmap
    if (this.scale < 0.03) {
      this.renderSectorLOD();
      // Still show ship
      this.renderShip();
      return;
    }

    // FTL range circle
    const shipScreen = this.worldToScreen(this.shipPos);
    ctx.beginPath();
    ctx.arc(shipScreen.x, shipScreen.y, this.ftlRange * this.scale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(90,160,255,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sensor range
    ctx.beginPath();
    ctx.arc(shipScreen.x, shipScreen.y, this.sensorRange * this.scale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90,160,255,0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,160,255,0.08)';
    ctx.stroke();

    // Trade routes / connections
    if (this.scale > 0.05) {
      ctx.strokeStyle = 'rgba(100,140,200,0.06)';
      ctx.lineWidth = 1;
      const systems = this.galaxy.getAllSystems().filter(s => s.discoveryState !== SystemDiscoveryState.Unknown);
      // Only connect nearby systems to avoid O(n^2) for large galaxy
      // Use spatial: for each system, check neighbors within 500 LY
      for (let i = 0; i < Math.min(systems.length, 200); i++) {
        const a = systems[i];
        for (let j = i + 1; j < Math.min(systems.length, 200); j++) {
          const b = systems[j];
          const dx = a.position.x - b.position.x;
          const dy = a.position.y - b.position.y;
          const d = Math.hypot(dx, dy);
          if (d < 400 && a.faction && a.faction === b.faction) {
            const sa = this.worldToScreen(a.position);
            const sb = this.worldToScreen(b.position);
            // Only draw if both on screen
            if (sa.x < -100 || sa.x > w + 100 || sa.y < -100 || sa.y > h + 100) continue;
            if (sb.x < -100 || sb.x > w + 100 || sb.y < -100 || sb.y > h + 100) continue;
            ctx.beginPath();
            ctx.moveTo(sa.x, sa.y);
            ctx.lineTo(sb.x, sb.y);
            ctx.stroke();
          }
        }
      }
    }

    // Deep space POIs
    if (this.showDeepSpacePOIs && this.scale > 0.08) {
      const pois = (this.galaxy as any).getPOIsInRange?.(this.shipPos, this.sensorRange * 2) || [];
      for (const poi of pois.slice(0, 50)) {
        const screen = this.worldToScreen(poi.position);
        if (screen.x < -20 || screen.x > w + 20 || screen.y < -20 || screen.y > h + 20) continue;

        ctx.fillStyle = poi.rarity === 'legendary' || poi.rarity === 'unique' ? '#d8b4fe' : poi.rarity === 'rare' ? '#fbbf24' : 'rgba(138,155,184,0.6)';
        ctx.font = '10px monospace';
        ctx.fillText(poi.type === 'rogue_planet' ? '●' : poi.type === 'asteroid_field' ? '◈' : '⚠', screen.x, screen.y);

        if (this.scale > 0.3) {
          ctx.fillStyle = 'rgba(138,155,184,0.5)';
          ctx.font = '9px JetBrains Mono';
          ctx.fillText(poi.name, screen.x + 8, screen.y + 2);
        }
      }
    }

    // v6 Wormholes — render discovered wormholes
    if ((this as any).wormholes && this.scale > 0.05) {
      for (const wh of (this as any).wormholes) {
        if (!wh.discovered) continue;
        const screen = this.worldToScreen(wh.position);
        if (screen.x < -20 || screen.x > w + 20 || screen.y < -20 || screen.y > h + 20) continue;
        ctx.fillStyle = wh.type === 'ancient_gate' ? '#d8b4fe' : wh.type === 'stable' ? '#5aa0ff' : '#ff4d6a';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, wh.type === 'ancient_gate' ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, wh.type === 'ancient_gate' ? 10 : 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (this.scale > 0.2) {
          ctx.fillStyle = 'rgba(216,180,254,0.6)';
          ctx.font = '8px JetBrains Mono';
          ctx.fillText(`🌀 ${wh.id}`, screen.x + 8, screen.y);
        }
        // Link line
        if (wh.linkedTo) {
          const linkedScreen = this.worldToScreen(wh.linkedTo);
          ctx.strokeStyle = wh.type === 'ancient_gate' ? 'rgba(216,180,254,0.15)' : 'rgba(90,160,255,0.15)';
          ctx.setLineDash([8, 12]);
          ctx.beginPath();
          ctx.moveTo(screen.x, screen.y);
          ctx.lineTo(linkedScreen.x, linkedScreen.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Systems — with LOD and culling
    const systems = this.galaxy.getAllSystems();
    let renderedCount = 0;

    for (const sys of systems) {
      if (sys.discoveryState === SystemDiscoveryState.Unknown) continue;

      const screen = this.worldToScreen(sys.position);
      if (screen.x < -50 || screen.x > w + 50 || screen.y < -50 || screen.y > h + 50) continue;

      renderedCount++;
      if (renderedCount > 500 && this.scale < 0.1) continue; // LOD: limit rendered stars when zoomed out

      const isHovered = sys.id === this.hoveredSystemId;
      const isSelected = sys.id === this.selectedSystemId;

      const starDef = STAR_TYPES[sys.starType];
      let radius = 3;
      if (sys.starType === 'blue_giant') radius = 6;
      else if (sys.starType === 'black_hole') radius = 7;
      else if (sys.starType === 'neutron_star') radius = 4;

      if (isHovered || isSelected) radius += 2;

      let alpha = 1;
      let color = starDef.color;
      if (sys.discoveryState === SystemDiscoveryState.Detected) {
        alpha = 0.5;
      }

      // Glow
      if (this.scale > 0.05) {
        const glow = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius * 4);
        glow.addColorStop(0, color + '66');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (sys.starType === 'black_hole') {
        ctx.strokeStyle = '#a0a0ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (sys.faction && this.scale > 0.1) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '8px JetBrains Mono';
        ctx.fillText(sys.faction.substring(0, 3).toUpperCase(), screen.x + radius + 3, screen.y - radius - 2);
      }

      if (isHovered || isSelected || this.scale > 0.3) {
        ctx.fillStyle = isSelected ? '#9ef0ff' : 'rgba(230,238,252,0.8)';
        ctx.font = `${isSelected ? 'bold ' : ''}${isHovered ? 11 : 10}px JetBrains Mono`;
        ctx.fillText(sys.name, screen.x + radius + 6, screen.y + 3);
      }

      ctx.globalAlpha = 1;

      if (isSelected) {
        ctx.strokeStyle = '#5aa0ff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    this.renderShip();

    // Scale indicator
    this.renderScaleIndicator();

    // Stats
    if (this.scale < 0.05) {
      ctx.fillStyle = 'rgba(138,155,184,0.6)';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`Rendering ${renderedCount}/${systems.length} systems • Scale ${(this.scale * 100).toFixed(1)}% • True scale: 1px = ${(1 / this.scale).toFixed(0)} LY`, 16, h - 32);
      const stats = (this.galaxy as any).getStats?.();
      if (stats) {
        ctx.fillText(`Galaxy: ${stats.discovered}/${stats.estimatedTotal} (${stats.exploredPercent.toFixed(4)}%) • Sectors: ${stats.sectorsGenerated} • Seed: ${stats.seed}`, 16, h - 16);
      }
    }
  }

  private renderSectorLOD() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Show sectors as colored by density and region
    const sectors = (this.galaxy as any).getAllSectors?.() || [];

    for (const sector of sectors) {
      const screen = this.worldToScreen(sector.worldPos);
      const size = 1000 * this.scale;

      if (size < 2) continue;
      if (screen.x < -size || screen.x > w + size || screen.y < -size || screen.y > h + size) continue;

      // Color by density and region
      let color: string;
      if (sector.density > 0.6) color = `rgba(150, 180, 255, ${sector.density * 0.3})`;
      else if (sector.density > 0.3) color = `rgba(100, 140, 200, ${sector.density * 0.2})`;
      else if (sector.density > 0.05) color = `rgba(80, 100, 150, ${sector.density * 0.15})`;
      else color = `rgba(40, 50, 80, 0.05)`;

      ctx.fillStyle = color;
      ctx.fillRect(screen.x - size / 2, screen.y - size / 2, size, size);

      // Show system count
      if (size > 10) {
        ctx.fillStyle = sector.systems.length > 0 ? 'rgba(230,238,252,0.8)' : 'rgba(138,155,184,0.3)';
        ctx.font = `${Math.max(8, size * 0.15)}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.fillText(`${sector.systems.length}`, screen.x, screen.y + 3);
      }

      // Region name when zoomed in a bit
      if (size > 30 && sector.systems.length > 0) {
        ctx.fillStyle = 'rgba(138,155,184,0.4)';
        ctx.font = '8px JetBrains Mono';
        ctx.fillText(sector.regionName.split('—')[0].trim().substring(0, 20), screen.x, screen.y + size / 2 + 10);
      }
    }

    // Draw spiral arm guides (faint)
    ctx.strokeStyle = 'rgba(100,140,200,0.04)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 20]);
    for (let arm = 0; arm < 4; arm++) {
      ctx.beginPath();
      for (let r = 0; r < 50000; r += 500) {
        const angle = (arm / 4) * Math.PI * 2 + r * 0.00025;
        const pos: Vec2 = { x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.6 };
        const screen = this.worldToScreen(pos);
        if (r === 0) ctx.moveTo(screen.x, screen.y);
        else ctx.lineTo(screen.x, screen.y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  private renderShip() {
    const ctx = this.ctx;
    const shipScreen = this.worldToScreen(this.shipPos);

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#5aa0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const angle = -Math.PI / 2;
    const size = Math.max(4, 8 * Math.min(1, this.scale * 2));
    ctx.moveTo(shipScreen.x + Math.cos(angle) * size, shipScreen.y + Math.sin(angle) * size);
    ctx.lineTo(shipScreen.x + Math.cos(angle + 2.5) * size * 0.7, shipScreen.y + Math.sin(angle + 2.5) * size * 0.7);
    ctx.lineTo(shipScreen.x + Math.cos(angle - 2.5) * size * 0.7, shipScreen.y + Math.sin(angle - 2.5) * size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const glowGrad = ctx.createRadialGradient(shipScreen.x, shipScreen.y, 0, shipScreen.x, shipScreen.y, 20);
    glowGrad.addColorStop(0, 'rgba(90,160,255,0.4)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(shipScreen.x, shipScreen.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Ship label at high zoom
    if (this.scale > 0.2) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px JetBrains Mono';
      ctx.fillText('AETHER-01', shipScreen.x + 12, shipScreen.y - 12);
    }
  }

  private renderScaleIndicator() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Scale bar: show LY
    const barLengthLY = this.scale < 0.05 ? 5000 : this.scale < 0.15 ? 1000 : 200;
    const barLengthPx = barLengthLY * this.scale;

    const x = w - 20 - barLengthPx;
    const y = h - 20;

    ctx.fillStyle = 'rgba(230,238,252,0.8)';
    ctx.strokeStyle = 'rgba(230,238,252,0.8)';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';

    // Bar
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + barLengthPx, y);
    ctx.stroke();
    // Ticks
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.moveTo(x + barLengthPx, y - 4);
    ctx.lineTo(x + barLengthPx, y + 4);
    ctx.stroke();

    ctx.fillText(`${barLengthLY} LY`, x + barLengthPx, y - 8);
    ctx.textAlign = 'left';
  }
}
