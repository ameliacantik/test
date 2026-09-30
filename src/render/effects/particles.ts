/**
 * Particle System v6 — Handcrafted, cinematic, 10000x detail
 * Not generic circles. Each particle has physical behavior, trails, chromatic glow.
 * Engine exhaust: ion plume with turbulence
 * Scan: sonar pulse with interference pattern
 * FTL: warp stretch with chromatic aberration
 * Discovery: data fragments with glitch
 * Damage: sparks with gravity
 */

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  ax: number; ay: number;
  life: number; maxLife: number;
  size: number; sizeVel: number;
  color: string;
  color2?: string;
  alpha: number;
  rotation: number; rotVel: number;
  type: 'engine' | 'scan' | 'ftl' | 'discovery' | 'damage' | 'trade' | 'wormhole' | 'nebula';
  trail: {x:number,y:number,alpha:number}[];
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('no ctx');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  emit(x: number, y: number, count: number, type: Particle['type'], options: Partial<{ speed: number; spread: number; color: string; color2: string }> = {}) {
    const speed = options.speed ?? (type === 'engine' ? 3.5 : type === 'ftl' ? 6 : 2.2);
    const spread = options.spread ?? (type === 'engine' ? Math.PI * 0.35 : Math.PI * 2);
    const baseColor = options.color || this.getColorForType(type);
    const baseColor2 = options.color2 || this.getColor2ForType(type);

    for (let i = 0; i < count; i++) {
      const angle = type === 'engine' 
        ? Math.PI + (Math.random() - 0.5) * spread
        : (Math.random() - 0.5) * spread + (type === 'scan' ? 0 : Math.random() * Math.PI * 2);
      
      const vel = Math.random() * speed * 0.6 + speed * 0.4;
      const life = type === 'engine' ? 0.6 + Math.random() * 0.6 : type === 'ftl' ? 1.2 + Math.random() * 0.8 : 1.0 + Math.random() * 0.8;
      
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        ax: type === 'engine' ? (Math.random() - 0.5) * 0.02 : 0,
        ay: type === 'engine' ? 0.02 + Math.random() * 0.03 : type === 'damage' ? 0.08 : 0,
        life, maxLife: life,
        size: type === 'engine' ? Math.random() * 2.5 + 0.8 : type === 'ftl' ? Math.random() * 2 + 1 : Math.random() * 2.2 + 0.6,
        sizeVel: type === 'engine' ? -0.015 : type === 'ftl' ? 0.04 : type === 'scan' ? 0.02 : 0,
        color: baseColor,
        color2: baseColor2,
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        rotVel: (Math.random() - 0.5) * 0.2,
        type,
        trail: [],
      });
    }
  }

  private getColorForType(type: Particle['type']): string {
    switch (type) {
      case 'engine': return '#00e5ff';
      case 'scan': return '#00e5ff';
      case 'ftl': return '#a78bfa';
      case 'discovery': return '#00ff88';
      case 'damage': return '#ff3b30';
      case 'trade': return '#ffb000';
      case 'wormhole': return '#d8b4fe';
      case 'nebula': return '#5aa0ff';
      default: return '#ffffff';
    }
  }
  private getColor2ForType(type: Particle['type']): string {
    switch (type) {
      case 'engine': return '#ffffff';
      case 'scan': return '#ffffff';
      case 'ftl': return '#00e5ff';
      case 'discovery': return '#ffffff';
      case 'damage': return '#ff8a80';
      case 'trade': return '#ffe082';
      case 'wormhole': return '#00e5ff';
      case 'nebula': return '#d8b4fe';
      default: return '#ffffff';
    }
  }

  update(delta: number) {
    const dt = delta * 0.001;
    this.time += dt;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Trail
      if (p.trail.length > 6 || (p.type === 'engine' && p.trail.length > 3)) {
        p.trail.shift();
      }
      if (Math.random() < 0.7) {
        p.trail.push({x: p.x, y: p.y, alpha: p.alpha});
      }

      p.vx += p.ax;
      p.vy += p.ay;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * (p.type === 'engine' ? 1.8 : p.type === 'ftl' ? 0.7 : 0.9);
      p.alpha = Math.pow(p.life / p.maxLife, 0.7);
      p.size += p.sizeVel;
      p.rotation += p.rotVel;

      // Type-specific
      if (p.type === 'engine') {
        p.vx *= 0.995;
        p.vy *= 0.998;
        // Turbulence
        p.vx += (Math.random() - 0.5) * 0.08;
        p.vy += (Math.random() - 0.5) * 0.05;
      } else if (p.type === 'scan') {
        const dist = Math.hypot(p.vx, p.vy);
        if (dist < 4) {
          p.vx *= 1.015;
          p.vy *= 1.015;
        }
        p.ay = Math.sin(this.time * 3 + i) * 0.01;
      } else if (p.type === 'ftl') {
        p.size += dt * 1.5;
        p.rotation += dt * 2;
      } else if (p.type === 'damage') {
        p.vx *= 0.99;
        p.vy += 0.05; // gravity
        p.rotVel *= 0.99;
      }

      if (p.life <= 0 || p.size <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // Additive blending for glow
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      const alpha = p.alpha;

      if (p.type === 'engine') {
        // Ion plume with core + glow + trail
        // Trail
        for (let j = 0; j < p.trail.length; j++) {
          const t = p.trail[j];
          const trailAlpha = (j / p.trail.length) * alpha * 0.15;
          ctx.globalAlpha = trailAlpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, p.size * (j / p.trail.length) * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        // Outer glow
        ctx.globalAlpha = alpha * 0.15;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = p.color2 || '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Inner white hot
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.2, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'scan') {
        // Sonar ring with interference
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const radius = (1 - p.life / p.maxLife) * 60;
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        // Dashed second ring
        ctx.globalAlpha = alpha * 0.15;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Center dot
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'ftl') {
        // Warp shard with chromatic
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = p.color;
        // Stretched rectangle
        const len = p.size * 8 * (1 - p.life / p.maxLife * 0.5);
        ctx.fillRect(-len / 2, -0.5, len, 1);
        // Chromatic offset
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = p.color2 || '#00e5ff';
        ctx.fillRect(-len / 2 + 1, -0.5, len, 1);
        ctx.restore();
        // Glow
        ctx.globalAlpha = alpha * 0.08;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'discovery') {
        // Data fragment with glitch
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size * 0.3, p.size * 2, p.size * 0.6);
        // Glitch offset
        if (Math.random() < 0.15) {
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-p.size + 2, -p.size * 0.3, p.size * 2, 1);
        }
        ctx.restore();
        // Glow
        ctx.globalAlpha = alpha * 0.15;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'damage') {
        // Spark
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.1, p.size, p.size * 0.2);
        ctx.fillStyle = p.color2 || '#ff8a80';
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillRect(-p.size * 0.3, -p.size * 0.05, p.size * 0.6, p.size * 0.1);
        ctx.restore();

      } else {
        // Generic with glow
        ctx.globalAlpha = alpha * 0.2;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  clear() { this.particles = []; }
  getCount(): number { return this.particles.length; }
}

/**
 * FTL Jump Effect — Cinematic warp tunnel, not just flash
 * Inspired by Interstellar, Elite Dangerous, Star Citizen quantum
 */
export class FTLEffect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private active: boolean = false;
  private progress: number = 0;
  private duration: number = 1400;
  private stars: {angle:number, dist:number, speed:number, color:string}[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('no ctx');
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Pre-generate warp stars
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 0.8 + 0.2,
        speed: 0.5 + Math.random() * 1.5,
        color: Math.random() < 0.7 ? '#5aa0ff' : Math.random() < 0.5 ? '#a78bfa' : '#00e5ff',
      });
    }
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  trigger() {
    this.active = true;
    this.progress = 0;
  }

  update(delta: number): boolean {
    if (!this.active) return false;
    this.progress += delta / this.duration;
    if (this.progress >= 1) {
      this.active = false;
      this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
      return false;
    }
    return true;
  }

  render() {
    if (!this.active) return;
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const p = this.progress;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.hypot(w, h) * 0.6;

    ctx.clearRect(0, 0, w, h);

    // Phase 1: Charge — cyan convergence (0-0.25)
    if (p < 0.25) {
      const chargeP = p / 0.25;
      // Vignette charge
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, `rgba(0,229,255,${0.15 * chargeP})`);
      grad.addColorStop(0.3, `rgba(0,229,255,${0.05 * chargeP})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Converging lines
      ctx.strokeStyle = `rgba(0,229,255,${0.6 * chargeP})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const startR = maxR * (1 - chargeP * 0.8);
        const endR = startR + 30;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * startR, cy + Math.sin(angle) * startR);
        ctx.lineTo(cx + Math.cos(angle) * endR, cy + Math.sin(angle) * endR);
        ctx.stroke();
      }

      // Center flash building
      ctx.fillStyle = `rgba(255,255,255,${chargeP * 0.3})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + chargeP * 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // Phase 2: Warp — stretch tunnel (0.25-0.75)
    if (p >= 0.2 && p < 0.8) {
      const warpP = (p - 0.2) / 0.6;
      // Tunnel background — chromatic
      ctx.fillStyle = `rgba(2,5,12,${warpP * 0.7})`;
      ctx.fillRect(0, 0, w, h);

      // Warp stars — stretched
      for (const star of this.stars) {
        const dist = star.dist + warpP * star.speed * 2;
        const x = cx + Math.cos(star.angle) * dist * maxR * 0.15;
        const y = cy + Math.sin(star.angle) * dist * maxR * 0.15;
        const stretch = warpP * 80 * star.speed;
        
        // Chromatic aberration — cyan + magenta offset
        ctx.strokeStyle = star.color;
        ctx.globalAlpha = 0.6 * (1 - warpP * 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(star.angle) * stretch * 0.5, y - Math.sin(star.angle) * stretch * 0.5);
        ctx.lineTo(x + Math.cos(star.angle) * stretch * 0.5, y + Math.sin(star.angle) * stretch * 0.5);
        ctx.stroke();

        // Second pass magenta offset
        ctx.strokeStyle = '#ff00ff';
        ctx.globalAlpha = 0.15 * (1 - warpP * 0.5);
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(star.angle) * stretch * 0.5 + 1, y - Math.sin(star.angle) * stretch * 0.5);
        ctx.lineTo(x + Math.cos(star.angle) * stretch * 0.5 + 1, y + Math.sin(star.angle) * stretch * 0.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Center tunnel
      const tunnelGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * warpP);
      tunnelGrad.addColorStop(0, `rgba(255,255,255,${0.8 * (1 - warpP)})`);
      tunnelGrad.addColorStop(0.1, `rgba(0,229,255,${0.4 * (1 - warpP * 0.5)})`);
      tunnelGrad.addColorStop(0.3, `rgba(167,139,250,${0.15 * (1 - warpP * 0.3)})`);
      tunnelGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = tunnelGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Phase 3: Exit — white flash + chromatic burst (0.75-1.0)
    if (p > 0.7) {
      const exitP = (p - 0.7) / 0.3;
      // Flash
      ctx.fillStyle = `rgba(255,255,255,${(1 - exitP) * 0.9})`;
      ctx.fillRect(0, 0, w, h);
      // Chromatic burst
      ctx.fillStyle = `rgba(0,229,255,${(1 - exitP) * 0.2})`;
      ctx.fillRect(-exitP * 10, 0, w, h);
      ctx.fillStyle = `rgba(255,0,255,${(1 - exitP) * 0.15})`;
      ctx.fillRect(exitP * 10, 0, w, h);
      // Vignette return
      ctx.fillStyle = `rgba(2,5,10,${exitP * 0.6})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  isActive(): boolean { return this.active; }
}
