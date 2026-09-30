export class StarfieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: { x: number; y: number; size: number; brightness: number; color: string; twinkle: number }[] = [];
  private animationId: number = 0;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('No 2d context');
    this.ctx = ctx;
    this.resize();
    this.generateStars(400);
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private generateStars(count: number) {
    const colors = ['#ffffff', '#aaccff', '#ffddaa', '#ffaaaa', '#aaffff'];
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.2,
        brightness: Math.random() * 0.8 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  render(time: number) {
    this.time = time;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Background gradient
    const grad = this.ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, Math.max(w, h));
    grad.addColorStop(0, 'rgba(20, 30, 60, 0.15)');
    grad.addColorStop(0.5, 'rgba(10, 15, 30, 0.05)');
    grad.addColorStop(1, 'rgba(2, 4, 10, 1)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    // Nebula blobs
    this.ctx.globalCompositeOperation = 'screen';
    this.drawNebula(w * 0.2, h * 0.3, w * 0.4, 'rgba(90, 60, 150, 0.04)');
    this.drawNebula(w * 0.8, h * 0.7, w * 0.3, 'rgba(60, 120, 180, 0.05)');
    this.drawNebula(w * 0.5, h * 0.1, w * 0.5, 'rgba(180, 80, 40, 0.03)');
    this.ctx.globalCompositeOperation = 'source-over';

    // Stars
    for (const star of this.stars) {
      const twinkle = Math.sin(time * 0.001 * (0.5 + star.brightness) + star.twinkle) * 0.3 + 0.7;
      const alpha = star.brightness * twinkle;
      this.ctx.fillStyle = star.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;

    // Occasional shooting star
    if (Math.random() < 0.002) {
      this.drawShootingStar(w, h);
    }
  }

  private drawNebula(x: number, y: number, radius: number, color: string) {
    const grad = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawShootingStar(w: number, h: number) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.5;
    const len = 80 + Math.random() * 120;
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    this.ctx.stroke();
    // glow
    this.ctx.strokeStyle = 'rgba(158,240,255,0.3)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + Math.cos(angle) * len * 0.5, y + Math.sin(angle) * len * 0.5);
    this.ctx.stroke();
  }

  start() {
    const loop = (t: number) => {
      this.render(t);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.animationId);
  }
}
