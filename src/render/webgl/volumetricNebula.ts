/**
 * Volumetric Nebula — True volumetric rendering with raymarching
 * For deep space immersion
 */

import * as THREE from 'three';

export class VolumetricNebula {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;

  constructor(position: THREE.Vector3, radius: number, color: THREE.Color, type: 'emission' | 'reflection' | 'dark' = 'emission') {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: color },
        time: { value: 0 },
        radius: { value: radius },
        type: { value: type === 'emission' ? 0 : type === 'reflection' ? 1 : 2 },
        cameraPos: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float radius;
        uniform int type;
        uniform vec3 cameraPos;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        // Noise functions
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                         mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                         mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for(int i = 0; i < 5; i++) {
            value += amplitude * noise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec3 pos = vPosition / radius;
          float dist = length(pos);
          
          // Raymarching-like density
          float density = 1.0 - dist;
          density = pow(density, 1.5);
          
          // Volumetric noise
          vec3 noisePos = pos * 2.0 + time * 0.00005;
          float n = fbm(noisePos);
          float n2 = fbm(noisePos * 2.0 + vec3(5.2, 1.3, 2.8));
          
          // Turbulence
          float turbulence = n * 0.6 + n2 * 0.4;
          density *= 0.5 + 0.5 * turbulence;
          
          // Edge softening
          density *= smoothstep(1.0, 0.0, dist);
          
          // Type variations
          vec3 finalColor = color;
          float alpha = density * 0.15;
          
          if (type == 0) {
            // Emission — brighter, more colorful
            finalColor += vec3(n * 0.2, n2 * 0.1, -n * 0.1);
            alpha *= 1.2;
            // Core brightening
            alpha += (1.0 - dist) * 0.1 * n;
          } else if (type == 1) {
            // Reflection — bluish, more uniform
            finalColor = mix(finalColor, vec3(0.6, 0.7, 1.0), 0.3);
            alpha *= 0.8;
          } else {
            // Dark — obscuring, lower alpha but blocks light
            finalColor *= 0.3;
            alpha *= 0.6;
          }
          
          // Fresnel for edge glow
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          alpha += fresnel * 0.05 * density;
          
          // Time-based pulsation for emission
          if (type == 0) {
            float pulse = 0.9 + 0.1 * sin(time * 0.001 + dist * 3.0);
            alpha *= pulse;
          }
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.copy(position);
  }

  update(time: number, cameraPos: THREE.Vector3) {
    this.material.uniforms.time.value = time;
    this.material.uniforms.cameraPos.value.copy(cameraPos);
    // Slow rotation
    this.mesh.rotation.y = time * 0.00002;
    this.mesh.rotation.x = Math.sin(time * 0.00001) * 0.1;
  }
}

export class VolumetricNebulaField {
  group: THREE.Group;
  nebulae: VolumetricNebula[] = [];

  constructor() {
    this.group = new THREE.Group();
  }

  addNebula(position: THREE.Vector3, radius: number, color: THREE.Color, type: 'emission' | 'reflection' | 'dark' = 'emission') {
    const nebula = new VolumetricNebula(position, radius, color, type);
    this.nebulae.push(nebula);
    this.group.add(nebula.mesh);
    return nebula;
  }

  generateRandom(count: number, galaxyRadius: number, rng: any) {
    const colors = [
      new THREE.Color(0x9660c8),
      new THREE.Color(0x5096c8),
      new THREE.Color(0xc85050),
      new THREE.Color(0x50c896),
      new THREE.Color(0xc89650),
      new THREE.Color(0xc85096),
    ];

    for (let i = 0; i < count; i++) {
      const angle = rng.range ? rng.range(0, Math.PI * 2) : Math.random() * Math.PI * 2;
      const dist = rng.range ? rng.range(5000, galaxyRadius * 0.8) : Math.random() * galaxyRadius * 0.8;
      const pos = new THREE.Vector3(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist * 0.6,
        rng.range ? rng.range(-1000, 1000) : (Math.random() - 0.5) * 2000
      );
      const radius = rng.range ? rng.range(2000, 8000) : Math.random() * 6000 + 2000;
      const color = rng.pick ? rng.pick(colors) : colors[Math.floor(Math.random() * colors.length)];
      const type = rng.pick ? rng.pick(['emission', 'reflection', 'dark'] as const) : 'emission';

      this.addNebula(pos, radius, color, type);
    }
  }

  update(time: number, cameraPos: THREE.Vector3) {
    for (const nebula of this.nebulae) {
      nebula.update(time, cameraPos);
    }
  }
}
