/**
 * Cockpit HUD v6 — Handcrafted, physical, lived-in
 * Not generic overlay. Feels like you're inside AETHER-01.
 * Rivets, wear, segmented displays, amber monochrome for alerts.
 * Inspired by Apollo, Soyuz, Alien, Blade Runner.
 */

export class CockpitHUD {
  container: HTMLElement;
  enabled: boolean = false;
  private elements: Map<string, HTMLElement> = new Map();
  private time: number = 0;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'cockpit-hud';
    this.container.innerHTML = `
      <div class="cockpit-vignette"></div>
      <div class="cockpit-frame"></div>
      
      <!-- Top HUD — targeting computer -->
      <div style="position:absolute;top:14px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:16px;pointer-events:none;">
        <div style="width:32px;height:1px;background:linear-gradient(90deg, transparent, var(--cyan));opacity:0.6;"></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="width:24px;height:24px;border:1px solid rgba(0,229,255,0.3);display:flex;align-items:center;justify-content:center;position:relative;">
            <div style="position:absolute;width:100%;height:1px;background:rgba(0,229,255,0.3);top:50%;"></div>
            <div style="position:absolute;height:100%;width:1px;background:rgba(0,229,255,0.3);left:50%;"></div>
            <div style="width:6px;height:6px;border:1px solid var(--cyan);border-radius:50%;box-shadow:0 0 6px var(--cyan);"></div>
          </div>
          <div style="font-size:7px;letter-spacing:0.2em;color:var(--cyan);font-weight:700;" id="hud-target">NO TARGET LOCK</div>
        </div>
        <div style="width:32px;height:1px;background:linear-gradient(90deg, var(--cyan), transparent);opacity:0.6;"></div>
      </div>

      <!-- Bottom HUD — ship data, horizon -->
      <div style="position:absolute;bottom:14px;left:14px;right:14px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none;">
        <!-- Left: ship data -->
        <div style="display:flex;gap:12px;">
          <div style="background:linear-gradient(180deg, rgba(10,18,34,0.9), rgba(6,11,22,0.9));border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);min-width:80px;">
            <div style="font-size:6px;letter-spacing:0.2em;color:var(--text-3);">VELOCITY</div>
            <div style="font-size:11px;font-weight:700;color:var(--text-1);margin-top:2px;" id="hud-speed">0.00c</div>
            <div style="font-size:7px;color:var(--text-3);margin-top:2px;">HDG <span id="hud-heading">000°</span></div>
          </div>
          <div style="background:linear-gradient(180deg, rgba(10,18,34,0.9), rgba(6,11,22,0.9));border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);min-width:80px;">
            <div style="font-size:6px;letter-spacing:0.2em;color:var(--text-3);">RANGE TO TARGET</div>
            <div style="font-size:11px;font-weight:700;color:var(--cyan);margin-top:2px;" id="hud-range">--- LY</div>
            <div style="width:100%;height:2px;background:rgba(0,0,0,0.5);margin-top:4px;overflow:hidden;"><div style="width:30%;height:100%;background:var(--cyan);"></div></div>
          </div>
        </div>

        <!-- Center: artificial horizon -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <div style="width:120px;height:1px;background:linear-gradient(90deg, transparent, var(--cyan), transparent);opacity:0.5;"></div>
          <div style="display:flex;gap:8px;align-items:center;">
            <div style="width:20px;height:1px;background:var(--cyan);opacity:0.3;"></div>
            <div style="width:40px;height:20px;border:1px solid rgba(0,229,255,0.2);border-top:none;position:relative;">
              <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,229,255,0.3);"></div>
              <div style="position:absolute;top:0;left:50%;width:1px;height:6px;background:rgba(0,229,255,0.3);transform:translateX(-50%);"></div>
            </div>
            <div style="width:20px;height:1px;background:var(--cyan);opacity:0.3;"></div>
          </div>
          <div style="font-size:6px;letter-spacing:0.2em;color:var(--text-4);">AETHER-01 • ARTIFICIAL HORIZON</div>
        </div>

        <!-- Right: ship status -->
        <div style="display:flex;gap:12px;">
          <div style="background:linear-gradient(180deg, rgba(10,18,34,0.9), rgba(6,11,22,0.9));border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);min-width:80px;text-align:right;">
            <div style="font-size:6px;letter-spacing:0.2em;color:var(--text-3);">FUEL • SHIELD • HULL</div>
            <div style="font-size:10px;font-weight:700;color:var(--amber);margin-top:2px;" id="hud-fuel">100%</div>
            <div style="font-size:10px;font-weight:700;color:var(--cyan);margin-top:1px;" id="hud-shield">100%</div>
            <div style="font-size:10px;font-weight:700;color:var(--green);margin-top:1px;" id="hud-hull">100%</div>
          </div>
          <div style="background:linear-gradient(180deg, rgba(10,18,34,0.9), rgba(6,11,22,0.9));border:1px solid var(--border-1);padding:8px 10px;clip-path:var(--panel-cut-sm);display:flex;flex-direction:column;align-items:center;gap:4px;min-width:60px;">
            <div style="font-size:6px;letter-spacing:0.15em;color:var(--text-3);">COMPASS</div>
            <div style="width:36px;height:36px;border:1px solid var(--border-1);border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;">
              <div style="position:absolute;width:1px;height:100%;background:linear-gradient(180deg, transparent, rgba(0,229,255,0.2), transparent);"></div>
              <div style="position:absolute;height:1px;width:100%;background:linear-gradient(90deg, transparent, rgba(0,229,255,0.2), transparent);"></div>
              <div id="hud-compass-needle" style="width:2px;height:14px;background:var(--cyan);box-shadow:0 0 6px var(--cyan);transform-origin:bottom center;transform:rotate(0deg);position:absolute;bottom:50%;"></div>
              <div style="width:4px;height:4px;background:var(--cyan);border-radius:50%;box-shadow:0 0 6px var(--cyan);"></div>
            </div>
            <div style="font-size:8px;font-weight:700;color:var(--cyan);font-variant-numeric:tabular-nums;" id="hud-bearing">000°</div>
          </div>
        </div>
      </div>

      <!-- Side HUDs — sensor & FTL vertical bars -->
      <div style="position:absolute;left:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:12px;pointer-events:none;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <div style="font-size:6px;letter-spacing:0.18em;color:var(--text-3);writing-mode:vertical-rl;">SENSOR</div>
          <div style="width:4px;height:80px;background:rgba(0,0,0,0.5);border:1px solid var(--border-1);position:relative;overflow:hidden;">
            <div id="hud-sensor-bar" style="position:absolute;bottom:0;left:0;right:0;height:60%;background:linear-gradient(180deg, var(--cyan), var(--cyan-dim));box-shadow:0 0 6px var(--cyan);"></div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <div style="font-size:6px;letter-spacing:0.18em;color:var(--text-3);writing-mode:vertical-rl;">FTL CHARGE</div>
          <div style="width:4px;height:80px;background:rgba(0,0,0,0.5);border:1px solid var(--border-1);position:relative;overflow:hidden;">
            <div id="hud-ftl-bar" style="position:absolute;bottom:0;left:0;right:0;height:80%;background:linear-gradient(180deg, #a78bfa, #7c3aed);box-shadow:0 0 6px rgba(167,139,250,0.5);"></div>
          </div>
        </div>
      </div>

      <!-- Damage flash -->
      <div id="cockpit-damage" style="position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 0.2s;background:radial-gradient(ellipse at center, transparent 30%, rgba(255,59,48,0.15) 100%);"></div>

      <!-- Scanlines -->
      <div style="position:absolute;inset:0;pointer-events:none;opacity:0.04;background:repeating-linear-gradient(0deg, transparent 0 2px, white 3px);mix-blend-mode:screen;"></div>
    `;

    parent.appendChild(this.container);
    this.cacheElements();
    this.hide();
  }

  private cacheElements() {
    const ids = ['hud-target', 'hud-speed', 'hud-heading', 'hud-range', 'hud-fuel', 'hud-shield', 'hud-hull', 'hud-sensor-bar', 'hud-ftl-bar', 'hud-compass-needle', 'hud-bearing', 'cockpit-damage'];
    for (const id of ids) {
      const el = this.container.querySelector(`#${id}`) as HTMLElement;
      if (el) this.elements.set(id, el);
    }
  }

  show() {
    this.enabled = true;
    this.container.style.display = 'block';
    requestAnimationFrame(() => this.container.classList.add('active'));
  }

  hide() {
    this.enabled = false;
    this.container.classList.remove('active');
    setTimeout(() => {
      if (!this.enabled) this.container.style.display = 'none';
    }, 300);
  }

  toggle() {
    if (this.enabled) this.hide();
    else this.show();
  }

  update(data: {
    target?: string;
    speed?: number;
    heading?: number;
    range?: number;
    fuel?: number;
    shield?: number;
    hull?: number;
    sensorRange?: number;
    ftlRange?: number;
    ftlCharge?: number;
    bearing?: number;
  }) {
    if (!this.enabled) return;
    this.time += 0.016;

    if (data.target !== undefined) {
      const el = this.elements.get('hud-target');
      if (el) {
        el.textContent = data.target ? `LOCK: ${data.target.toUpperCase()}` : 'NO TARGET LOCK';
        el.style.color = data.target ? 'var(--cyan)' : 'var(--text-3)';
      }
    }

    if (data.speed !== undefined) {
      const el = this.elements.get('hud-speed');
      if (el) el.textContent = `${data.speed.toFixed(2)}c`;
    }

    if (data.heading !== undefined) {
      const el = this.elements.get('hud-heading');
      if (el) el.textContent = `${Math.floor(data.heading).toString().padStart(3, '0')}°`;
    }

    if (data.range !== undefined) {
      const el = this.elements.get('hud-range');
      if (el) el.textContent = data.range > 0 ? `${data.range.toFixed(0)} LY` : '--- LY';
    }

    if (data.fuel !== undefined) {
      const el = this.elements.get('hud-fuel');
      if (el) {
        el.textContent = `${Math.floor(data.fuel)}% FUEL`;
        el.style.color = data.fuel < 20 ? 'var(--red)' : data.fuel < 50 ? 'var(--amber)' : 'var(--amber)';
      }
    }

    if (data.shield !== undefined) {
      const el = this.elements.get('hud-shield');
      if (el) {
        el.textContent = `${Math.floor(data.shield)}% SHLD`;
        el.style.color = data.shield < 30 ? 'var(--red)' : 'var(--cyan)';
      }
    }

    if (data.hull !== undefined) {
      const el = this.elements.get('hud-hull');
      if (el) {
        el.textContent = `${Math.floor(data.hull)}% HULL`;
        el.style.color = data.hull < 30 ? 'var(--red)' : data.hull < 60 ? 'var(--amber)' : 'var(--green)';
      }
    }

    if (data.bearing !== undefined) {
      const needle = this.elements.get('hud-compass-needle');
      const bearing = this.elements.get('hud-bearing');
      if (needle) needle.style.transform = `rotate(${data.bearing}deg)`;
      if (bearing) bearing.textContent = `${Math.floor(data.bearing).toString().padStart(3, '0')}°`;
    }

    if (data.ftlCharge !== undefined) {
      const bar = this.elements.get('hud-ftl-bar');
      if (bar) bar.style.height = `${data.ftlCharge}%`;
    }

    // Subtle flicker for realism
    if (Math.random() < 0.02) {
      this.container.style.opacity = '0.92';
      setTimeout(() => this.container.style.opacity = '0.4', 50);
    }
  }

  flashDamage(intensity: number = 0.5) {
    const el = this.elements.get('cockpit-damage');
    if (!el || !this.enabled) return;
    el.style.opacity = intensity.toString();
    el.style.background = `radial-gradient(ellipse at center, transparent 30%, rgba(255,59,48,${intensity * 0.4}) 100%)`;
    // Shake
    this.container.style.transform = `translate(${ (Math.random()-0.5)*intensity*8 }px, ${ (Math.random()-0.5)*intensity*8 }px)`;
    setTimeout(() => {
      el.style.opacity = '0';
      this.container.style.transform = '';
    }, 180);
  }

  setFTLCharging(charging: boolean) {
    if (!this.enabled) return;
    if (charging) {
      this.container.classList.add('ftl-charging');
      this.container.style.filter = 'hue-rotate(10deg) saturate(1.2)';
    } else {
      this.container.classList.remove('ftl-charging');
      this.container.style.filter = '';
    }
  }
}
