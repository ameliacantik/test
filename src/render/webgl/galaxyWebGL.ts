/**
 * Galaxy WebGL Renderer v5 — 100k Stars (scalable to 1M), Volumetric Nebulae, Black Hole Lensing
 * True scale 50k LY, infinite streaming, feels like real outer space
 * 
 * Architecture:
 * - Three.js OrthographicCamera for galaxy map (2D-like but WebGL powered)
 * - BufferGeometry Points for background stars (100k default, 1M if high perf)
 * - ShaderMaterials for twinkle, glow, nebulae noise, black hole lensing
 * - LOD: sector heatmap when zoomed out, star systems when zoomed in
 * - Raycaster for system picking
 */

import * as THREE from 'three';
import type { Galaxy } from '../../galaxy/galaxy';
import { SystemDiscoveryState, StarType } from '../../core/types';
import { STAR_TYPES } from '../../data/starTypes';
import type { Vec2 } from '../../utils/math';
import { SeededRNG } from '../../utils/seedRandom';

export class GalaxyWebGLRenderer {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  galaxy: Galaxy;

  // Star field — 100k background stars for true scale feeling
  private starGeometry!: THREE.BufferGeometry;
  private starMaterial!: THREE.ShaderMaterial;
  private starPoints!: THREE.Points;
  private starCount: number = 100000;
  private starPositions: Float32Array;
  private starColors: Float32Array;
  private starSizes: Float32Array;
  private starAlphas: Float32Array;

  // Groups
  private backgroundGroup: THREE.Group;
  private nebulaGroup: THREE.Group;
  private sectorGroup: THREE.Group;
  private systemGroup: THREE.Group;
  private poiGroup: THREE.Group;
  private wormholeGroup: THREE.Group;
  private rangeGroup: THREE.Group;
  private shipGroup: THREE.Group;

  private systemMeshes: Map<string, THREE.Mesh> = new Map();
  private systemGlows: Map<string, THREE.Mesh> = new Map();
  private sectorMeshes: Map<string, THREE.Mesh> = new Map();

  // Ship
  private shipMesh!: THREE.Mesh;
  private shipGlow!: THREE.Mesh;
  private shipTrail!: THREE.Points;

  // Ranges
  private ftlRangeMesh!: THREE.Mesh;
  private sensorRangeMesh!: THREE.Mesh;
  private sensorFillMesh!: THREE.Mesh;

  // Interaction — same API as Canvas2D renderer for drop-in replacement
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

  onSystemHover?: (id: string | null) => void;
  onSystemSelect?: (id: string) => void;
  onSectorHover?: (coord: Vec2 | null) => void;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private clock = new THREE.Clock();

  constructor(canvas: HTMLCanvasElement, galaxy: Galaxy, starCount = 100000) {
    this.canvas = canvas;
    this.galaxy = galaxy;
    this.starCount = starCount;
    this.starPositions = new Float32Array(0);
    this.starColors = new Float32Array(0);
    this.starSizes = new Float32Array(0);
    this.starAlphas = new Float32Array(0);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02040a);
    this.scene.fog = new THREE.Fog(0x02040a, 5000, 50000);

    // Camera — orthographic for 2D-like galaxy map but with WebGL power
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const frustumSize = 10000;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100000
    );
    this.camera.position.set(0, 0, 1000);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.sortObjects = false;

    // Groups
    this.backgroundGroup = new THREE.Group();
    this.nebulaGroup = new THREE.Group();
    this.sectorGroup = new THREE.Group();
    this.systemGroup = new THREE.Group();
    this.poiGroup = new THREE.Group();
    this.wormholeGroup = new THREE.Group();
    this.rangeGroup = new THREE.Group();
    this.shipGroup = new THREE.Group();

    this.scene.add(this.backgroundGroup);
    this.scene.add(this.nebulaGroup);
    this.scene.add(this.sectorGroup);
    this.scene.add(this.poiGroup);
    this.scene.add(this.wormholeGroup);
    this.scene.add(this.systemGroup);
    this.scene.add(this.rangeGroup);
    this.scene.add(this.shipGroup);

    // Generate
    this.generateBackgroundStars(this.starCount);
    this.generateNebulae();
    this.createShip();
    this.createRanges();
    this.updateSystems();
    this.updateSectors();
    this.updatePOIs();

    this.setupEvents();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private getRNG(): SeededRNG {
    const anyGalaxy = this.galaxy as any;
    if (anyGalaxy.rng && anyGalaxy.rng.fork) {
      return anyGalaxy.rng.fork('webgl-stars');
    }
    return new SeededRNG(this.galaxy.seed + '-webgl');
  }

  private generateBackgroundStars(count: number) {
    this.starCount = count;
    this.starPositions = new Float32Array(count * 3);
    this.starColors = new Float32Array(count * 3);
    this.starSizes = new Float32Array(count);
    this.starAlphas = new Float32Array(count);

    const rng = this.getRNG();
    const structure = (this.galaxy as any).structure;

    for (let i = 0; i < count; i++) {
      // Galactic distribution with spiral arms
      const angle = rng.range(0, Math.PI * 2);
      // Power law: more stars near center, but also spread out to 50k LY
      const distRand = Math.pow(rng.next(), 0.6); // bias to center
      const dist = distRand * 50000;
      
      // Spiral arm calculation
      const armCount = 4;
      const armIndex = Math.floor((angle / (Math.PI * 2)) * armCount);
      const armOffset = (armIndex / armCount) * Math.PI * 2;
      const spiralTightness = 0.00025;
      const spiralAngle = armOffset + dist * spiralTightness + rng.range(-0.3, 0.3);
      
      // Add arm width noise
      const armWidthNoise = rng.range(-500, 500) * (1 + dist / 10000);
      const x = Math.cos(spiralAngle) * dist + armWidthNoise;
      const y = Math.sin(spiralAngle) * dist * 0.6 + rng.range(-300, 300) * (1 + dist / 20000);
      const z = rng.range(-150, 150) + (dist > 40000 ? rng.range(-500, 500) : 0); // thicker in halo

      // Density check: use structure if available to make voids truly empty
      if (structure) {
        const density = structure.getDensityAtDeterministic({ x, y }, rng.fork(`density-${i}`));
        if (density < 0.02 && rng.bool(0.7)) {
          // Skip star in void to create emptiness
          this.starPositions[i * 3] = x + rng.range(-2000, 2000);
          this.starPositions[i * 3 + 1] = y + rng.range(-2000, 2000);
          this.starPositions[i * 3 + 2] = z;
          this.starColors[i * 3] = 0.1;
          this.starColors[i * 3 + 1] = 0.1;
          this.starColors[i * 3 + 2] = 0.15;
          this.starSizes[i] = 0.1;
          this.starAlphas[i] = 0.05;
          continue;
        }
      }

      this.starPositions[i * 3] = x;
      this.starPositions[i * 3 + 1] = y;
      this.starPositions[i * 3 + 2] = z;

      // Color based on realistic stellar distribution
      const colorRand = rng.next();
      let r, g, b;
      if (colorRand < 0.6) {
        // Red dwarf — 60% (most common)
        r = 1.0; g = 0.5 + rng.range(0, 0.2); b = 0.35 + rng.range(0, 0.15);
      } else if (colorRand < 0.8) {
        // Yellow — 20%
        r = 1.0; g = 0.9 + rng.range(-0.1, 0.1); b = 0.6 + rng.range(-0.1, 0.2);
      } else if (colorRand < 0.9) {
        // White — 10%
        r = 0.95 + rng.range(0, 0.05); g = 0.95 + rng.range(0, 0.05); b = 1.0;
      } else if (colorRand < 0.96) {
        // Blue giant — 6%
        r = 0.5 + rng.range(0, 0.2); g = 0.7 + rng.range(0, 0.2); b = 1.0;
      } else {
        // Red giant / special — 4%
        r = 1.0; g = 0.6 + rng.range(-0.1, 0.2); b = 0.3 + rng.range(0, 0.2);
      }

      this.starColors[i * 3] = r;
      this.starColors[i * 3 + 1] = g;
      this.starColors[i * 3 + 2] = b;

      // Size: most stars tiny, few larger (realistic)
      const sizeRand = rng.next();
      if (sizeRand < 0.7) this.starSizes[i] = rng.range(0.3, 0.8);
      else if (sizeRand < 0.9) this.starSizes[i] = rng.range(0.8, 1.5);
      else if (sizeRand < 0.98) this.starSizes[i] = rng.range(1.5, 2.5);
      else this.starSizes[i] = rng.range(2.5, 4.0); // bright giants

      this.starAlphas[i] = rng.range(0.15, 1.0);
      // Dim distant stars more
      if (dist > 30000) this.starAlphas[i] *= 0.6;
      if (dist > 40000) this.starAlphas[i] *= 0.5;
    }

    this.starGeometry = new THREE.BufferGeometry();
    this.starGeometry.setAttribute('position', new THREE.BufferAttribute(this.starPositions, 3));
    this.starGeometry.setAttribute('color', new THREE.BufferAttribute(this.starColors, 3));
    this.starGeometry.setAttribute('size', new THREE.BufferAttribute(this.starSizes, 1));
    this.starGeometry.setAttribute('alpha', new THREE.BufferAttribute(this.starAlphas, 1));

    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        scale: { value: this.scale },
        opacity: { value: 1.0 },
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float time;
        uniform float scale;

        void main() {
          vColor = color;
          // Twinkle based on position and time
          float twinkle = 0.7 + 0.3 * sin(time * 0.001 + position.x * 0.01 + position.y * 0.008);
          // Parallax twinkle for depth
          float depthTwinkle = 0.8 + 0.2 * sin(time * 0.0005 + position.z * 0.02);
          vAlpha = alpha * twinkle * depthTwinkle;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Size attenuation with distance and scale
          float sizeScale = scale * 0.8 + 0.2;
          gl_PointSize = size * (400.0 / -mvPosition.z) * sizeScale;
          gl_PointSize = clamp(gl_PointSize, 0.5, 12.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          // Soft glow falloff
          float glow = 1.0 - dist * 2.0;
          glow = pow(glow, 1.8);
          
          // Core bright + halo
          float core = 1.0 - smoothstep(0.0, 0.3, dist);
          float finalGlow = mix(glow * 0.5, core, 0.6);
          
          gl_FragColor = vec4(vColor, vAlpha * finalGlow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    this.starPoints = new THREE.Points(this.starGeometry, this.starMaterial);
    this.starPoints.frustumCulled = false;
    this.backgroundGroup.add(this.starPoints);
  }

  private generateNebulae() {
    const structure = (this.galaxy as any).structure;
    const nebulaeData = structure?.generateNebulae?.(30) || this.generateFallbackNebulae();

    for (const neb of nebulaeData) {
      const geometry = new THREE.CircleGeometry(neb.radius, 32);

      // Parse color
      let r = 0.5, g = 0.5, b = 0.8, a = 0.05;
      const rgbaMatch = neb.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        r = parseInt(rgbaMatch[1]) / 255;
        g = parseInt(rgbaMatch[2]) / 255;
        b = parseInt(rgbaMatch[3]) / 255;
        a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 0.05;
      }

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(r, g, b) },
          alpha: { value: a * 1.5 },
          time: { value: 0 },
          type: { value: neb.type === 'emission' ? 0 : neb.type === 'reflection' ? 1 : 2 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float alpha;
          uniform float time;
          uniform int type;
          varying vec2 vUv;
          varying vec3 vPosition;

          // 2D noise
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }

          float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            for(int i = 0; i < 4; i++) {
              value += amplitude * noise(p);
              p *= 2.0;
              amplitude *= 0.5;
            }
            return value;
          }

          void main() {
            vec2 uv = vUv * 2.0 - 1.0;
            float dist = length(uv);
            if (dist > 1.0) discard;

            // Volumetric noise
            vec2 noiseUv = vUv * 3.0 + time * 0.00005;
            float n = fbm(noiseUv * 2.0);
            float n2 = fbm(noiseUv * 4.0 + 10.0);
            
            // Radial falloff with noise
            float radial = 1.0 - dist;
            radial = pow(radial, 1.2);
            
            // Nebula shape with turbulence
            float turbulence = n * 0.6 + n2 * 0.4;
            float alphaFactor = radial * (0.4 + 0.6 * turbulence);
            
            // Different types
            if (type == 0) {
              // Emission — brighter center
              alphaFactor *= 1.0 + 0.5 * (1.0 - dist);
            } else if (type == 1) {
              // Reflection — more uniform
              alphaFactor *= 0.8 + 0.2 * sin(time * 0.0003 + dist * 5.0);
            } else {
              // Dark — subtractive look with lower alpha
              alphaFactor *= 0.5;
            }
            
            alphaFactor = pow(alphaFactor, 1.5);
            
            // Color variation
            vec3 finalColor = color;
            finalColor += vec3(n * 0.1, n2 * 0.05, -n * 0.05);
            
            gl_FragColor = vec4(finalColor, alpha * alphaFactor);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(neb.pos.x, neb.pos.y, -100);
      mesh.rotation.z = Math.random() * Math.PI * 2;
      mesh.userData = { radius: neb.radius, type: neb.type };
      this.nebulaGroup.add(mesh);
    }
  }

  private generateFallbackNebulae() {
    const nebulae = [];
    const colors = [
      'rgba(150,80,200,0.08)',
      'rgba(80,150,200,0.06)',
      'rgba(200,80,80,0.07)',
      'rgba(80,200,150,0.05)',
    ];
    for (let i = 0; i < 20; i++) {
      nebulae.push({
        pos: { x: (Math.random() - 0.5) * 40000, y: (Math.random() - 0.5) * 20000 },
        radius: Math.random() * 5000 + 1000,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: ['emission', 'reflection', 'dark'][Math.floor(Math.random() * 3)] as any,
      });
    }
    return nebulae;
  }

  private createShip() {
    // Ship body — cone pointing up
    const geometry = new THREE.ConeGeometry(18, 36, 3);
    geometry.rotateZ(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.shipMesh = new THREE.Mesh(geometry, material);
    this.shipMesh.position.set(0, 0, 30);
    this.shipGroup.add(this.shipMesh);

    // Ship glow — pulsing
    const glowGeo = new THREE.CircleGeometry(36, 24);
    const glowMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          float dist = length(uv);
          if (dist > 1.0) discard;
          float glow = 1.0 - dist;
          glow = pow(glow, 2.2);
          float pulse = 0.7 + 0.3 * sin(time * 0.003);
          gl_FragColor = vec4(0.35, 0.6, 1.0, glow * 0.5 * pulse);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shipGlow = new THREE.Mesh(glowGeo, glowMat);
    this.shipGlow.position.set(0, 0, 25);
    this.shipGroup.add(this.shipGlow);

    // Engine trail particles
    const trailCount = 100;
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(trailCount * 3);
    const trailAlpha = new Float32Array(trailCount);
    for (let i = 0; i < trailCount; i++) {
      trailPos[i * 3] = 0;
      trailPos[i * 3 + 1] = 0;
      trailPos[i * 3 + 2] = 20;
      trailAlpha[i] = Math.random();
    }
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailAlpha, 1));

    const trailMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_PointSize = 3.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(0.4, 0.7, 1.0, vAlpha * (1.0 - dist * 2.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.shipTrail = new THREE.Points(trailGeo, trailMat);
    this.shipGroup.add(this.shipTrail);
  }

  private createRanges() {
    // FTL range
    const ftlGeo = new THREE.RingGeometry(this.ftlRange - 2, this.ftlRange + 2, 128);
    const ftlMat = new THREE.MeshBasicMaterial({
      color: 0x5aa0ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ftlRangeMesh = new THREE.Mesh(ftlGeo, ftlMat);
    this.ftlRangeMesh.position.set(0, 0, 1);
    this.rangeGroup.add(this.ftlRangeMesh);

    // Sensor range ring
    const sensorGeo = new THREE.RingGeometry(this.sensorRange - 1, this.sensorRange + 1, 128);
    const sensorMat = new THREE.MeshBasicMaterial({
      color: 0x5aa0ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sensorRangeMesh = new THREE.Mesh(sensorGeo, sensorMat);
    this.sensorRangeMesh.position.set(0, 0, 1);
    this.rangeGroup.add(this.sensorRangeMesh);

    // Sensor fill
    const sensorFillGeo = new THREE.CircleGeometry(this.sensorRange, 64);
    const sensorFillMat = new THREE.MeshBasicMaterial({
      color: 0x5aa0ff,
      transparent: true,
      opacity: 0.025,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sensorFillMesh = new THREE.Mesh(sensorFillGeo, sensorFillMat);
    this.sensorFillMesh.position.set(0, 0, 0);
    this.sensorFillMesh.name = 'sensorFill';
    this.rangeGroup.add(this.sensorFillMesh);
  }

  updateSectors() {
    // Clear
    for (const mesh of this.sectorMeshes.values()) {
      this.sectorGroup.remove(mesh);
    }
    this.sectorMeshes.clear();

    const anyGalaxy = this.galaxy as any;
    const sectors = anyGalaxy.getAllSectors?.() || [];
    
    // Only show sector LOD when zoomed out
    // But create meshes anyway, visibility controlled in update()
    for (const sector of sectors) {
      const size = 1000;
      const geometry = new THREE.PlaneGeometry(size * 0.95, size * 0.95);
      
      let color = new THREE.Color(0x0a1428);
      let opacity = 0.15;
      
      if (sector.density > 0.6) {
        color = new THREE.Color(0x2a4a8a);
        opacity = sector.density * 0.25;
      } else if (sector.density > 0.3) {
        color = new THREE.Color(0x1a3a6a);
        opacity = sector.density * 0.18;
      } else if (sector.density > 0.05) {
        color = new THREE.Color(0x101a30);
        opacity = sector.density * 0.12;
      } else {
        color = new THREE.Color(0x080c18);
        opacity = 0.04;
      }

      // Empty sectors darker
      if (sector.systems.length === 0) {
        opacity *= 0.5;
      }

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(sector.worldPos.x, sector.worldPos.y, -10);
      mesh.userData = { sector, density: sector.density };

      this.sectorGroup.add(mesh);
      this.sectorMeshes.set(sector.id, mesh);

      // System count label — will be rendered as sprite if needed
      if (sector.systems.length > 0) {
        const countGeo = new THREE.CircleGeometry(20, 8);
        const countMat = new THREE.MeshBasicMaterial({
          color: sector.systems.length > 3 ? 0x5aa0ff : 0x8a9bb8,
          transparent: true,
          opacity: 0.6,
        });
        const countMesh = new THREE.Mesh(countGeo, countMat);
        countMesh.position.set(sector.worldPos.x, sector.worldPos.y, -5);
        countMesh.userData = { isCount: true, sectorId: sector.id };
        this.sectorGroup.add(countMesh);
      }
    }
  }

  updateSystems() {
    // Clear existing
    for (const mesh of this.systemMeshes.values()) {
      this.systemGroup.remove(mesh);
    }
    for (const mesh of this.systemGlows.values()) {
      this.systemGroup.remove(mesh);
    }
    this.systemMeshes.clear();
    this.systemGlows.clear();

    const allSystems = this.galaxy.getAllSystems().filter(s => s.discoveryState !== SystemDiscoveryState.Unknown);
    
    // LOD: limit to 1000 nearest to ship when zoomed out, or all when zoomed in
    // For performance, sort by distance to ship and take closest
    const sorted = allSystems.sort((a, b) => {
      const da = Math.hypot(a.position.x - this.shipPos.x, a.position.y - this.shipPos.y);
      const db = Math.hypot(b.position.x - this.shipPos.x, b.position.y - this.shipPos.y);
      return da - db;
    });

    const maxSystems = this.scale < 0.05 ? 200 : this.scale < 0.15 ? 500 : 1500;
    const systems = sorted.slice(0, maxSystems);

    for (const sys of systems) {
      const starDef = STAR_TYPES[sys.starType];
      const color = new THREE.Color(starDef.color);

      let radius = 8;
      if (sys.starType === StarType.BlueGiant) radius = 14;
      else if (sys.starType === StarType.BlackHole) radius = 16;
      else if (sys.starType === StarType.NeutronStar) radius = 10;
      else if (sys.starType === StarType.BinaryStar) radius = 12;
      else if (sys.starType === StarType.YellowStar) radius = 9;

      // Adjust radius by scale for visibility
      const displayRadius = radius * (0.5 + this.scale * 0.5);

      const geometry = new THREE.CircleGeometry(displayRadius, sys.starType === StarType.BlackHole ? 24 : 16);
      let material: THREE.Material;

      if (sys.starType === StarType.BlackHole) {
        // Black hole with lensing ring shader
        material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            color: { value: color },
            isSelected: { value: 0 },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform float time;
            uniform float isSelected;
            varying vec2 vUv;
            void main() {
              vec2 uv = vUv * 2.0 - 1.0;
              float dist = length(uv);
              if (dist > 1.0) discard;
              
              // Event horizon
              if (dist < 0.45) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                return;
              }
              
              // Photon ring — lensing
              float ring = 0.0;
              if (dist > 0.45 && dist < 0.55) {
                ring = 1.0 - smoothstep(0.45, 0.55, dist);
                ring *= 0.8 + 0.2 * sin(time * 0.002 + dist * 10.0);
              }
              
              // Outer glow
              float glow = 1.0 - dist;
              glow = pow(glow, 2.0) * 0.6;
              
              // Accretion disk shimmer
              float angle = atan(uv.y, uv.x);
              float disk = sin(angle * 3.0 + time * 0.001) * 0.1 + 0.9;
              disk *= smoothstep(0.5, 0.7, dist) * (1.0 - smoothstep(0.7, 1.0, dist));
              
              vec3 finalColor = color * (ring * 1.5 + glow * 0.5 + disk * 0.3);
              float alpha = ring + glow * 0.5 + (isSelected > 0.5 ? 0.3 : 0.0);
              
              gl_FragColor = vec4(finalColor, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
        });
      } else {
        // Regular star with glow and pulsation
        material = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: color },
            time: { value: 0 },
            isSelected: { value: 0 },
            isHovered: { value: 0 },
            discoveryState: { value: sys.discoveryState === SystemDiscoveryState.Detected ? 0 : 1 },
          },
          vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `
            uniform vec3 color;
            uniform float time;
            uniform float isSelected;
            uniform float isHovered;
            uniform float discoveryState;
            varying vec2 vUv;
            void main() {
              vec2 uv = vUv * 2.0 - 1.0;
              float dist = length(uv);
              if (dist > 1.0) discard;
              
              float glow = 1.0 - dist;
              glow = pow(glow, 1.5);
              
              // Pulsation for giants
              float pulse = 0.9 + 0.1 * sin(time * 0.001 + length(vUv));
              
              vec3 finalColor = color * pulse;
              if (isHovered > 0.5) finalColor += vec3(0.2);
              if (isSelected > 0.5) finalColor += vec3(0.15, 0.15, 0.3);
              
              float alpha = (0.8 + 0.2 * glow) * discoveryState;
              if (discoveryState < 0.5) alpha *= 0.5; // detected but not scanned
              
              gl_FragColor = vec4(finalColor, alpha);
            }
          `,
          transparent: true,
          depthWrite: false,
        });
      }

      const mesh = new THREE.Mesh(geometry, material as any);
      mesh.position.set(sys.position.x, sys.position.y, 10);
      mesh.userData = { systemId: sys.id, system: sys, radius: displayRadius, isSystem: true };

      this.systemGroup.add(mesh);
      this.systemMeshes.set(sys.id, mesh);

      // Glow — only for close or bright stars, LOD
      if (this.scale > 0.03 || sys.starType === StarType.BlueGiant || sys.starType === StarType.BlackHole) {
        const glowGeo = new THREE.CircleGeometry(displayRadius * 3.5, 16);
        const glowMat = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: color },
            time: { value: 0 },
            alpha: { value: sys.discoveryState === SystemDiscoveryState.Detected ? 0.08 : 0.18 },
          },
          vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `
            uniform vec3 color;
            uniform float time;
            uniform float alpha;
            varying vec2 vUv;
            void main() {
              vec2 uv = vUv * 2.0 - 1.0;
              float dist = length(uv);
              float glow = 1.0 - dist;
              glow = pow(glow, 2.5);
              float pulse = 0.8 + 0.2 * sin(time * 0.001);
              gl_FragColor = vec4(color, alpha * glow * pulse);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(sys.position.x, sys.position.y, 5);
        glow.userData = { systemId: sys.id, isGlow: true };
        this.systemGroup.add(glow);
        this.systemGlows.set(sys.id, glow);
      }
    }
  }

  updatePOIs() {
    // Clear
    this.poiGroup.clear();

    const anyGalaxy = this.galaxy as any;
    if (!anyGalaxy.getPOIsInRange) return;

    const pois = anyGalaxy.getPOIsInRange(this.shipPos, this.sensorRange * 3).slice(0, 100);

    for (const poi of pois) {
      const color = poi.rarity === 'legendary' || poi.rarity === 'unique' ? 0xd8b4fe : poi.rarity === 'rare' ? 0xfbbf24 : 0x8a9bb8;
      
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      if (poi.type === 'rogue_planet') {
        geometry = new THREE.CircleGeometry(6, 12);
        material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
      } else if (poi.type === 'asteroid_field') {
        geometry = new THREE.RingGeometry(4, 8, 8);
        material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      } else {
        geometry = new THREE.CircleGeometry(5, 6);
        material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
      }

      const mesh = new THREE.Mesh(geometry as any, material as any);
      mesh.position.set(poi.position.x, poi.position.y, 8);
      mesh.userData = { poi, isPOI: true };
      this.poiGroup.add(mesh);
    }
  }

  updateWormholes(wormholes: any[]) {
    this.wormholeGroup.clear();
    if (!wormholes || wormholes.length === 0) return;

    for (const wh of wormholes) {
      if (!wh.discovered) continue;

      const color = wh.type === 'ancient_gate' ? 0xd8b4fe : wh.type === 'stable' ? 0x5aa0ff : 0xff4d6a;
      const geometry = new THREE.RingGeometry(8, 14, 16);
      const material = new THREE.MeshBasicMaterial({ 
        color, 
        transparent: true, 
        opacity: wh.type === 'ancient_gate' ? 0.9 : 0.6,
        side: THREE.DoubleSide 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(wh.position.x, wh.position.y, 9);
      mesh.userData = { wormhole: wh, isWormhole: true };
      this.wormholeGroup.add(mesh);

      // Inner glow
      const innerGeo = new THREE.CircleGeometry(6, 12);
      const innerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      inner.position.set(wh.position.x, wh.position.y, 9.1);
      this.wormholeGroup.add(inner);

      // Link line to paired wormhole (dashed visual)
      if (wh.linkedTo) {
        const points = [
          new THREE.Vector3(wh.position.x, wh.position.y, 8.5),
          new THREE.Vector3(wh.linkedTo.x, wh.linkedTo.y, 8.5)
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineDashedMaterial({ 
          color, 
          transparent: true, 
          opacity: 0.15,
          dashSize: 20,
          gapSize: 30,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        this.wormholeGroup.add(line);
      }
    }
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(dpr);

    const aspect = w / h;
    const frustumSize = 10000 / this.scale;
    this.camera.left = -frustumSize * aspect / 2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();
  }

  setupEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
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
      this.targetScale = Math.min(2.0, Math.max(0.01, this.targetScale + delta * this.targetScale));
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      // Prevent click after drag
      if (Math.hypot(e.clientX - this.lastMouse.x, e.clientY - this.lastMouse.y) > 5 && this.isDragging) return;
      const id = this.getSystemAt(e.clientX, e.clientY);
      if (id) {
        this.selectedSystemId = id;
        this.onSystemSelect?.(id);
      }
    });

    this.canvas.addEventListener('dblclick', (e) => {
      const world = this.screenToWorld(e.clientX, e.clientY);
      this.focusOn(world);
    });
  }

  worldToScreen(world: Vec2): Vec2 {
    const vector = new THREE.Vector3(world.x, world.y, 0);
    vector.project(this.camera);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    return {
      x: (vector.x * 0.5 + 0.5) * w,
      y: (-vector.y * 0.5 + 0.5) * h,
    };
  }

  screenToWorld(screenX: number, screenY: number): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((screenX - rect.left) / this.canvas.clientWidth) * 2 - 1;
    const y = -((screenY - rect.top) / this.canvas.clientHeight) * 2 + 1;

    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(this.camera);

    return { x: vector.x, y: vector.y };
  }

  getSystemAt(screenX: number, screenY: number): string | null {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((screenX - rect.left) / this.canvas.clientWidth) * 2 - 1;
    this.mouse.y = -((screenY - rect.top) / this.canvas.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const systemMeshes = Array.from(this.systemMeshes.values());
    const intersects = this.raycaster.intersectObjects(systemMeshes, false);
    
    if (intersects.length > 0) {
      return (intersects[0].object as any).userData.systemId;
    }

    // Fallback: distance check for small systems
    const world = this.screenToWorld(screenX, screenY);
    let closest: string | null = null;
    let minDist = 50 / this.scale;
    for (const [id, mesh] of this.systemMeshes) {
      const dx = mesh.position.x - world.x;
      const dy = mesh.position.y - world.y;
      const d = Math.hypot(dx, dy);
      if (d < minDist) {
        minDist = d;
        closest = id;
      }
    }

    return closest;
  }

  checkHover(screenX: number, screenY: number) {
    const id = this.getSystemAt(screenX, screenY);
    if (id !== this.hoveredSystemId) {
      // Update hover uniforms
      if (this.hoveredSystemId) {
        const prev = this.systemMeshes.get(this.hoveredSystemId);
        if (prev && (prev.material as any).uniforms?.isHovered) {
          (prev.material as any).uniforms.isHovered.value = 0;
        }
      }
      if (id) {
        const next = this.systemMeshes.get(id);
        if (next && (next.material as any).uniforms?.isHovered) {
          (next.material as any).uniforms.isHovered.value = 1;
        }
      }

      this.hoveredSystemId = id;
      this.onSystemHover?.(id);
    }

    // Sector hover for LOD
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

    if (this.shipMesh) {
      this.shipMesh.position.set(pos.x, pos.y, 30);
      this.shipGlow.position.set(pos.x, pos.y, 25);
      this.shipTrail.position.set(pos.x, pos.y, 20);
    }

    if (this.ftlRangeMesh) {
      this.ftlRangeMesh.position.set(pos.x, pos.y, 1);
      const scale = ftlRange / 600;
      this.ftlRangeMesh.scale.set(scale, scale, 1);
    }

    if (this.sensorRangeMesh) {
      this.sensorRangeMesh.position.set(pos.x, pos.y, 1);
      const scale = sensorRange / 500;
      this.sensorRangeMesh.scale.set(scale, scale, 1);
    }

    if (this.sensorFillMesh) {
      this.sensorFillMesh.position.set(pos.x, pos.y, 0);
      const scale = sensorRange / 500;
      this.sensorFillMesh.scale.set(scale, scale, 1);
    }
  }

  focusOn(pos: Vec2) {
    this.targetOffset = { x: -pos.x, y: -pos.y };
  }

  update() {
    this.offset.x += (this.targetOffset.x - this.offset.x) * 0.1;
    this.offset.y += (this.targetOffset.y - this.offset.y) * 0.1;
    this.scale += (this.targetScale - this.scale) * 0.1;

    // Update camera
    this.camera.position.x = -this.offset.x;
    this.camera.position.y = -this.offset.y;

    const frustumSize = 10000 / this.scale;
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.left = -frustumSize * aspect / 2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();

    // Update shader uniforms
    const time = performance.now();
    const elapsed = this.clock.getElapsedTime() * 1000;

    if (this.starMaterial) {
      this.starMaterial.uniforms.time.value = time;
      this.starMaterial.uniforms.scale.value = this.scale;
    }

    // Nebulae time
    this.nebulaGroup.children.forEach((child: any) => {
      if (child.material?.uniforms?.time) {
        child.material.uniforms.time.value = time;
      }
    });

    // Ship glow
    if (this.shipGlow) {
      const mat = this.shipGlow.material as THREE.ShaderMaterial;
      if (mat.uniforms?.time) mat.uniforms.time.value = time;
    }

    // System shaders
    this.systemMeshes.forEach((mesh: any) => {
      if (mesh.material?.uniforms?.time) {
        mesh.material.uniforms.time.value = time;
      }
      // Update selection
      const isSelected = mesh.userData.systemId === this.selectedSystemId;
      if (mesh.material?.uniforms?.isSelected) {
        mesh.material.uniforms.isSelected.value = isSelected ? 1 : 0;
      }
    });

    this.systemGlows.forEach((glow: any) => {
      if (glow.material?.uniforms?.time) {
        glow.material.uniforms.time.value = time;
      }
    });

    // Sector visibility based on scale (LOD)
    const showSectors = this.scale < 0.08;
    this.sectorGroup.visible = showSectors;
    
    // Nebulae visible always but more when zoomed out
    this.nebulaGroup.visible = this.showNebulae;
    
    // Background stars fade when zoomed in close
    if (this.starPoints) {
      this.starPoints.visible = true;
      if (this.starMaterial) {
        this.starMaterial.uniforms.opacity.value = this.scale < 0.5 ? 1.0 : Math.max(0.1, 1.0 - (this.scale - 0.5) * 1.5);
      }
    }

    // Ship trail animation
    if (this.shipTrail) {
      const posAttr = this.shipTrail.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        // Simple drift
        posAttr.setX(i, x + (Math.random() - 0.5) * 0.5);
        posAttr.setY(i, y + (Math.random() - 0.5) * 0.5);
      }
      posAttr.needsUpdate = true;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // For compatibility with Canvas2D renderer — scale indicator, stats
  renderOverlay(ctx: CanvasRenderingContext2D) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Scale bar
    const barLengthLY = this.scale < 0.05 ? 5000 : this.scale < 0.15 ? 1000 : 200;
    const barLengthPx = barLengthLY * this.scale;

    const x = w - 20 - barLengthPx;
    const y = h - 20;

    ctx.fillStyle = 'rgba(230,238,252,0.8)';
    ctx.strokeStyle = 'rgba(230,238,252,0.8)';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'right';

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + barLengthPx, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.moveTo(x + barLengthPx, y - 4);
    ctx.lineTo(x + barLengthPx, y + 4);
    ctx.stroke();

    ctx.fillText(`${barLengthLY} LY`, x + barLengthPx, y - 8);
    ctx.textAlign = 'left';

    // Stats when zoomed out
    if (this.scale < 0.05) {
      ctx.fillStyle = 'rgba(138,155,184,0.6)';
      ctx.font = '10px JetBrains Mono';
      const all = this.galaxy.getAllSystems();
      const rendered = this.systemMeshes.size;
      ctx.fillText(`WebGL • ${this.starCount.toLocaleString()} background stars • Rendering ${rendered}/${all.length} systems • Scale ${(this.scale * 100).toFixed(1)}% • 1px = ${(1 / this.scale).toFixed(0)} LY`, 16, h - 32);
      const stats = (this.galaxy as any).getStats?.();
      if (stats) {
        ctx.fillText(`Galaxy: ${stats.discovered}/${stats.estimatedTotal} (${stats.exploredPercent.toFixed(4)}%) • Sectors: ${stats.sectorsGenerated} • Seed: ${stats.seed}`, 16, h - 16);
      }
    }
  }

  dispose() {
    this.renderer.dispose();
    this.starGeometry?.dispose();
    this.starMaterial?.dispose();
  }

  // Public method to change star count (for performance toggle)
  setStarCount(count: number) {
    if (count === this.starCount) return;
    
    // Remove old
    this.backgroundGroup.remove(this.starPoints);
    this.starGeometry.dispose();
    this.starMaterial.dispose();
    
    // Generate new
    this.generateBackgroundStars(count);
  }
}
