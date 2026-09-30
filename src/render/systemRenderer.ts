import type { StarData, PlanetData } from '../core/types';
import { PLANET_TYPES } from '../data/planetTypes';
import { STAR_TYPES } from '../data/starTypes';

export class SystemRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  system: StarData | null = null;
  time: number = 0;
  selectedPlanetId: string | null = null;
  onPlanetSelect?: (id: string) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('no ctx');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setSystem(sys: StarData | null) {
    this.system = sys;
    this.selectedPlanetId = null;
  }

  private handleClick(e: MouseEvent) {
    if (!this.system) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const center = { x: this.canvas.clientWidth / 2, y: this.canvas.clientHeight / 2 };

    for (const planet of this.system.planets) {
      const orbitR = planet.orbitRadius;
      const angle = planet.orbitAngle + this.time * 0.0002 * (1 / (orbitR * 0.01 + 1));
      const px = center.x + Math.cos(angle) * orbitR;
      const py = center.y + Math.sin(angle) * orbitR;
      const dx = x - px;
      const dy = y - py;
      if (Math.hypot(dx, dy) < planet.radius + 10) {
        this.selectedPlanetId = planet.id;
        this.onPlanetSelect?.(planet.id);
        break;
      }
    }
  }

  render(time: number) {
    this.time = time;
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    if (!this.system) {
      ctx.fillStyle = 'rgba(138,155,184,0.5)';
      ctx.font = '12px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('No system selected', w / 2, h / 2);
      return;
    }

    const center = { x: w / 2, y: h / 2 };
    const starDef = STAR_TYPES[this.system.starType];

    // Star glow
    const starGlow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 80);
    starGlow.addColorStop(0, starDef.color + '88');
    starGlow.addColorStop(0.3, starDef.color + '22');
    starGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = starGlow;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 80, 0, Math.PI * 2);
    ctx.fill();

    // Star core
    ctx.fillStyle = starDef.color;
    ctx.shadowColor = starDef.color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(center.x, center.y, this.system.starType === 'blue_giant' ? 22 : this.system.starType === 'black_hole' ? 18 : 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Black hole accretion disk
    if (this.system.starType === 'black_hole') {
      ctx.strokeStyle = 'rgba(160,160,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, 28, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(100,100,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, 36, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Orbits and planets
    for (const planet of this.system.planets) {
      const orbitR = planet.orbitRadius;

      // Orbit path
      ctx.strokeStyle = this.selectedPlanetId === planet.id ? 'rgba(90,160,255,0.3)' : 'rgba(100,140,200,0.08)';
      ctx.lineWidth = this.selectedPlanetId === planet.id ? 1.5 : 0.5;
      ctx.setLineDash(this.selectedPlanetId === planet.id ? [] : [2, 6]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, orbitR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Planet position
      const angle = planet.orbitAngle + time * 0.0002 * (1 / (orbitR * 0.01 + 1));
      const px = center.x + Math.cos(angle) * orbitR;
      const py = center.y + Math.sin(angle) * orbitR;

      const planetDef = PLANET_TYPES[planet.type];

      // Planet shadow / glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, planet.radius * 2.5);
      glow.addColorStop(0, planetDef.color + '66');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, planet.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Planet body with gradient
      const grad = ctx.createRadialGradient(px - planet.radius * 0.3, py - planet.radius * 0.3, 0, px, py, planet.radius);
      grad.addColorStop(0, planetDef.color);
      grad.addColorStop(0.7, planetDef.secondaryColor);
      grad.addColorStop(1, '#000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, planet.radius, 0, Math.PI * 2);
      ctx.fill();

      // Atmosphere if has
      if (planet.attributes.atmosphere > 0.3) {
        ctx.strokeStyle = planetDef.color + '88';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, planet.radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rings for gas giants
      if (planet.type === 'gas_giant') {
        ctx.strokeStyle = planetDef.secondaryColor + '66';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(px, py, planet.radius * 1.8, planet.radius * 0.6, angle, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Selection indicator
      if (this.selectedPlanetId === planet.id) {
        ctx.strokeStyle = '#5aa0ff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(px, py, planet.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Life indicator
      if (planet.hasLife) {
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(px + planet.radius, py - planet.radius, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ruins indicator
      if (planet.hasRuins) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px monospace';
        ctx.fillText('◈', px + planet.radius + 2, py - planet.radius - 2);
      }

      // Name label
      ctx.fillStyle = this.selectedPlanetId === planet.id ? '#9ef0ff' : 'rgba(230,238,252,0.6)';
      ctx.font = `${this.selectedPlanetId === planet.id ? 'bold ' : ''}10px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.fillText(planet.name, px, py + planet.radius + 14);
    }

    // Anomalies
    for (const anomaly of this.system.anomalies) {
      const angle = (this.time * 0.0001 + Math.random()) % (Math.PI * 2);
      const r = 150 + Math.random() * 100;
      const ax = center.x + Math.cos(angle) * r;
      const ay = center.y + Math.sin(angle) * r;
      ctx.fillStyle = '#d8b4fe';
      ctx.beginPath();
      ctx.arc(ax, ay, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(216,180,254,0.6)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText('⚠ ' + anomaly.type, ax + 6, ay + 2);
    }

    // System info overlay
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(138,155,184,0.8)';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${this.system.planets.length} PLANETS • ${this.system.anomalies.length} ANOMALIES • ${this.system.stations.length} STATIONS`, 16, h - 16);
  }
}
