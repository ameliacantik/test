/**
 * Planet Surface 3D — Landing view with terrain, atmosphere, weather
 * For true immersion when landing on planets
 */

import * as THREE from 'three';
import { PlanetType, type PlanetData } from '../../core/types';
import { PLANET_TYPES } from '../../data/planetTypes';

export class PlanetSurfaceRenderer {
  canvas: HTMLCanvasElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  planet: PlanetData | null = null;
  private animationId: number = 0;
  private time: number = 0;

  // Terrain
  private terrainMesh!: THREE.Mesh;
  private atmosphereMesh!: THREE.Mesh;
  private skyColor: THREE.Color;

  // Effects
  private dustParticles!: THREE.Points;
  private ruinsGroup: THREE.Group;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 10, 30);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.skyColor = new THREE.Color(0x02040a);
    this.ruinsGroup = new THREE.Group();
    this.scene.add(this.ruinsGroup);

    this.setupLights();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(50, 50, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    this.scene.add(sun);

    // Planet-specific light
    const planetLight = new THREE.PointLight(0x5aa0ff, 0.3, 100);
    planetLight.position.set(0, 5, 0);
    this.scene.add(planetLight);
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  setPlanet(planet: PlanetData | null) {
    this.planet = planet;
    this.ruinsGroup.clear();

    if (!planet) {
      this.scene.background = new THREE.Color(0x02040a);
      return;
    }

    const def = PLANET_TYPES[planet.type];
    this.skyColor = new THREE.Color(def.color).multiplyScalar(0.15);
    this.scene.background = this.skyColor;
    this.scene.fog = new THREE.Fog(this.skyColor, 30, 150);

    this.generateTerrain(planet);
    this.generateAtmosphere(planet);
    this.generateDust(planet);
    if (planet.hasRuins) this.generateRuins(planet);
    if (planet.hasLife) this.generateLife(planet);
  }

  private generateTerrain(planet: PlanetData) {
    if (this.terrainMesh) this.scene.remove(this.terrainMesh);

    const def = PLANET_TYPES[planet.type];
    const size = 200;
    const segments = 64;

    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);

    // Displace vertices based on planet type — v6 includes forest, artificial, weather
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);

      let height = 0;
      const dist = Math.hypot(x, y);

      switch (planet.type) {
        case 'barren':
          height = Math.sin(x * 0.1) * 2 + Math.cos(y * 0.1) * 2 + Math.random() * 0.5;
          break;
        case 'desert':
          height = Math.sin(x * 0.05) * 3 + Math.sin(y * 0.05 + x * 0.03) * 2;
          // Dunes
          height += Math.sin(x * 0.02) * 2;
          break;
        case 'ice':
          height = Math.sin(x * 0.08) * 1.5 + Math.cos(y * 0.08) * 1.5 + Math.random() * 0.3;
          // Ice cracks
          if (Math.random() < 0.05) height -= 1;
          break;
        case 'volcanic':
          height = Math.sin(x * 0.1) * 4 + Math.cos(y * 0.12) * 3 + Math.random() * 2;
          if (Math.random() < 0.02) height -= 5;
          break;
        case 'crystal':
          height = Math.sin(x * 0.2) * 2 + Math.cos(y * 0.2) * 2;
          if (Math.random() < 0.1) height += 3;
          break;
        case 'ancient':
          height = Math.sin(x * 0.05) * 1 + Math.random() * 0.2;
          if (dist < 20) height *= 0.2;
          break;
        case 'forest':
          height = Math.sin(x * 0.06) * 2 + Math.cos(y * 0.06) * 2 + Math.random() * 0.5;
          // Hills for forest
          height += Math.sin(x * 0.03 + y * 0.02) * 1.5;
          break;
        case 'artificial':
          // Geometric, flat with patterns
          height = Math.floor(x / 10) % 2 === 0 ? 0.5 : 0;
          height += Math.floor(y / 10) % 2 === 0 ? 0.3 : 0;
          if (dist < 15) height = 0; // landing pad flat
          break;
        case 'ocean':
          height = Math.sin(x * 0.03) * 0.5 + Math.cos(y * 0.03) * 0.5;
          break;
        case 'toxic':
          height = Math.sin(x * 0.07) * 2 + Math.cos(y * 0.07) * 2 + Math.random() * 1;
          break;
        case 'radioactive':
          height = Math.sin(x * 0.1) * 3 + Math.random() * 2;
          if (Math.random() < 0.03) height -= 4; // craters
          break;
        case 'earth_like':
          height = Math.sin(x * 0.05) * 2 + Math.cos(y * 0.05) * 2 + Math.random() * 0.3;
          break;
        case 'unknown':
          height = Math.sin(x * 0.2) * 5 + Math.cos(y * 0.2) * 5 + Math.random() * 3;
          // Impossible geometry
          if (Math.random() < 0.1) height = -height;
          break;
        default:
          height = Math.sin(x * 0.07) * 2 + Math.cos(y * 0.07) * 2;
      }

      // Weather influence
      if (planet.weather === 'dust_storm') height += Math.random() * 0.3;
      if (planet.weather === 'snow') height += Math.random() * 0.2;

      positions.setZ(i, height);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(def.color),
      emissive: new THREE.Color(def.secondaryColor).multiplyScalar(0.1),
      roughness: planet.type === 'ice' ? 0.3 : planet.type === 'desert' ? 0.9 : 0.7,
      metalness: planet.type === 'crystal' ? 0.8 : 0.1,
      wireframe: false,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.rotation.x = -Math.PI / 2;
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  private generateAtmosphere(planet: PlanetData) {
    if (this.atmosphereMesh) this.scene.remove(this.atmosphereMesh);

    if (planet.attributes.atmosphere < 0.1) return;

    const def = PLANET_TYPES[planet.type];
    const geometry = new THREE.SphereGeometry(80, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(def.color) },
        opacity: { value: planet.attributes.atmosphere * 0.3 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(color, opacity * intensity);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });

    this.atmosphereMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.atmosphereMesh);
  }

  private generateDust(planet: PlanetData) {
    if (this.dustParticles) this.scene.remove(this.dustParticles);

    const weather = (planet as any).weather || 'clear';
    let count = 200;
    let color = PLANET_TYPES[planet.type].color;
    let size = 0.3;
    let opacity = 0.4;

    if (planet.type === 'desert' || weather === 'dust_storm') {
      count = 1500;
      size = 0.6;
      opacity = 0.6;
      color = '#d9a05b';
    } else if (planet.type === 'volcanic') {
      count = 800;
      size = 0.4;
      color = '#ff4d4d';
    } else if (weather === 'rain') {
      count = 2000;
      size = 0.15;
      opacity = 0.5;
      color = '#5aa0ff';
    } else if (weather === 'snow') {
      count = 1200;
      size = 0.4;
      opacity = 0.7;
      color = '#ffffff';
    } else if (weather === 'toxic_clouds') {
      count = 1000;
      size = 0.5;
      opacity = 0.4;
      color = '#4ade80';
    } else if (weather === 'radiation_storm') {
      count = 800;
      size = 0.3;
      opacity = 0.6;
      color = '#fbbf24';
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color as any),
      size,
      transparent: true,
      opacity,
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  private generateRuins(planet: PlanetData) {
    this.ruinsGroup.clear();

    const count = planet.type === 'ancient' ? 20 : planet.type === 'artificial' ? 40 : 5;
    for (let i = 0; i < count; i++) {
      let geo: THREE.BufferGeometry;
      if (planet.type === 'artificial') {
        // Geometric city structures
        const type = Math.random();
        if (type < 0.4) geo = new THREE.BoxGeometry(Math.random() * 6 + 3, Math.random() * 20 + 10, Math.random() * 6 + 3);
        else if (type < 0.7) geo = new THREE.CylinderGeometry(2, 2, Math.random() * 15 + 5, 12);
        else geo = new THREE.BoxGeometry(20, 1, 20); // platform
      } else {
        geo = new THREE.BoxGeometry(
          Math.random() * 4 + 2,
          Math.random() * 8 + 4,
          Math.random() * 4 + 2
        );
      }
      const mat = new THREE.MeshStandardMaterial({
        color: planet.type === 'artificial' ? 0x444455 : 0x888899,
        emissive: planet.type === 'artificial' ? 0x111122 : 0x222233,
        emissiveIntensity: planet.type === 'artificial' ? 0.3 : 0.1,
        roughness: 0.8,
        metalness: planet.type === 'artificial' ? 0.6 : 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const height = (geo as any).parameters?.height || 2;
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        height / 2,
        (Math.random() - 0.5) * 80
      );
      mesh.rotation.y = planet.type === 'artificial' ? 0 : Math.random() * Math.PI * 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.ruinsGroup.add(mesh);

      // Glow for ancient tech or artificial city lights
      if ((planet.type === 'ancient' || planet.type === 'artificial') && Math.random() < 0.4) {
        const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: planet.type === 'artificial' ? 0x5aa0ff : 0xd8b4fe, transparent: true, opacity: 0.7 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(
          mesh.position.x,
          mesh.position.y + height / 2 + 2,
          mesh.position.z
        );
        this.ruinsGroup.add(glow);
      }
    }
  }

  private generateLife(planet: PlanetData) {
    if (!planet.hasLife && planet.type !== 'forest' && planet.type !== 'earth_like') return;

    const count = planet.type === 'forest' ? 60 : planet.type === 'earth_like' ? 30 : planet.type === 'ocean' ? 20 : 10;
    for (let i = 0; i < count; i++) {
      let geo: THREE.BufferGeometry;
      let color = 0x4ade80;
      if (planet.type === 'forest') {
        // Forest: tall trees with trunk + canopy
        const isTree = Math.random() < 0.7;
        if (isTree) {
          geo = new THREE.ConeGeometry(Math.random() * 0.8 + 0.4, Math.random() * 6 + 2, 8);
          color = 0x22c55e;
        } else {
          geo = new THREE.SphereGeometry(Math.random() * 1 + 0.5, 8, 8);
          color = 0x4ade80;
        }
      } else {
        geo = new THREE.ConeGeometry(Math.random() * 0.5 + 0.2, Math.random() * 2 + 1, 6);
        color = planet.type === 'earth_like' ? 0x4ade80 : 0x60a5fa;
      }
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 100,
        planet.type === 'forest' ? geo instanceof THREE.ConeGeometry ? (geo as any).parameters.height / 2 : 0.5 : 0.5,
        (Math.random() - 0.5) * 100
      );
      mesh.castShadow = true;
      this.ruinsGroup.add(mesh);
    }

    // Forest canopy fog
    if (planet.type === 'forest') {
      const fogGeo = new THREE.SphereGeometry(100, 16, 16);
      const fogMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.05, side: THREE.BackSide });
      const fog = new THREE.Mesh(fogGeo, fogMat);
      fog.position.set(0, 20, 0);
      this.ruinsGroup.add(fog);
    }
  }

  render(time: number) {
    this.time = time;

    if (this.dustParticles) {
      this.dustParticles.rotation.y = time * 0.00005;
      const positions = this.dustParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        positions.setY(i, y + Math.sin(time * 0.001 + i) * 0.01);
      }
      positions.needsUpdate = true;
    }

    if (this.atmosphereMesh) {
      this.atmosphereMesh.rotation.y = time * 0.00002;
    }

    // Camera subtle movement
    this.camera.position.x = Math.sin(time * 0.0001) * 2;
    this.camera.position.y = 10 + Math.sin(time * 0.00007) * 0.5;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
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
