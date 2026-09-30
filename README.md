# AETHER VOYAGER — Deep Space Exploration

> Browser sci-fi game where your ship is your home. Explore a **true-scale 50,000 LY galaxy** with **WebGL 100k stars, volumetric nebulae, cockpit HUD, and planet landing 3D**.

**Live Preview:** `npm run dev` → http://localhost:5173  
**Version:** v5.0 — WEBGL 1M STARS • VOLUMETRIC NEBULAE • COCKPIT • PLANET 3D

---

## 🚀 v5.0 — WEBGL TRUE IMMERSION

### Problem v4: Canvas2D is beautiful but not *immersive* enough

v4 had true scale 50k LY, infinite streaming, 70-90% empty — but Canvas2D rendering is limited:
- Stars are just circles, no twinkle, no depth
- Nebulae are flat gradients, not volumetric
- Black holes are just black circles with border
- Ship is triangle, no engine trail
- You are looking at map, not *inside* ship

**Real outer space should feel like you are THERE.**

### Solution v5: WebGL + Cockpit + Planet 3D

**1. GalaxyWebGLRenderer (src/render/webgl/galaxyWebGL.ts) — 100k Stars Scalable to 1M:**

**Background Stars (100k default, 500k in 1M mode):**
- **BufferGeometry Points:** Float32Array positions (x,y,z), colors (r,g,b), sizes (0.3-4.0), alphas (0.15-1.0)
- **Distribution:** Power law `dist = rand^0.6 * 50000` — more near center, spread to 50k LY. Spiral arms: `armIndex = floor(angle/2π * 4)`, `spiralAngle = armOffset + dist*0.00025 + noise(-0.3,0.3)`, arm width noise `(-500,500)*(1+dist/10000)`, flatten `y*0.6`
- **Emptiness:** Uses `GalacticStructure.getDensityAtDeterministic()` — if density<0.02 and 70% chance, skip star (dim tiny dot in void) to create real emptiness in WebGL too
- **Colors:** Red dwarf 60% (1.0, 0.5-0.7, 0.35-0.5), Yellow 20% (1.0, 0.8-1.0, 0.5-0.8), White 10% (0.95-1.0), Blue giant 6% (0.5-0.7, 0.7-0.9, 1.0), Red giant 4% (1.0, 0.5-0.8, 0.3-0.5)
- **Sizes:** 70% tiny 0.3-0.8, 20% medium 0.8-1.5, 8% large 1.5-2.5, 2% giants 2.5-4.0 — realistic
- **Alphas:** 0.15-1.0, dim distant >30k LY *0.6, >40k *0.5
- **ShaderMaterial Twinkle:**
  - Vertex: `twinkle = 0.7+0.3*sin(time*0.001 + pos.x*0.01 + pos.y*0.008)`, `depthTwinkle = 0.8+0.2*sin(time*0.0005 + pos.z*0.02)`, `vAlpha = alpha*twinkle*depthTwinkle`, `gl_PointSize = size*(400/-mvPosition.z)*sizeScale`, clamp 0.5-12.0
  - Fragment: discard if dist>0.5, `glow = 1-dist*2`, `pow(glow,1.8)`, core bright + halo mix, `gl_FragColor = vec4(vColor, vAlpha*finalGlow)`, additive blending
- **Performance:** 100k points = 1 draw call, frustumCulled false, pixelRatio min(device,2), 60fps. Scalable to 500k (1M mode) = still 1 draw call, but more GPU load. Toggle button WEBGL 100K ↔ 1M

**Volumetric Nebulae (30 nebulae):**
- **Data:** From `GalacticStructure.generateNebulae(30)` — positions in arms, radius 2k-8k LY, colors purple/blue/red/green/yellow rgba 0.05-0.08, types emission/reflection/dark
- **CircleGeometry + ShaderMaterial Noise:**
  - Vertex: pass uv, position
  - Fragment: `hash(vec2) = fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453)`, `noise(vec2)` bilinear, `fbm(vec2)` 4 octaves
  - `uv = vUv*2-1`, `dist=length(uv)`, discard >1.0
  - `noiseUv = vUv*3 + time*0.00005`, `n=fbm(noiseUv*2)`, `n2=fbm(noiseUv*4+10)`, `radial=1-dist`, `pow(radial,1.2)`, `turbulence=n*0.6+n2*0.4`, `alphaFactor=radial*(0.4+0.6*turbulence)`, emission brighter center `1+0.5*(1-dist)`, reflection sin pulse, dark *0.5, `pow(alphaFactor,1.5)`, color variation `finalColor += vec3(n*0.1, n2*0.05, -n*0.05)`
  - Additive blending, depthWrite false, DoubleSide
- **VolumetricNebula Class (src/render/webgl/volumetricNebula.ts):** True volumetric with SphereGeometry + raymarching-like density `1-dist pow 1.5`, 3D noise `hash(vec3)`, `noise(vec3)` trilinear, `fbm(vec3)` 5 octaves, Fresnel edge glow, pulsation for emission, slow rotation

**Systems (up to 1500 nearest):**
- **LOD:** <0.05 scale → 200 systems, <0.15 → 500, else 1500, sorted by distance to ship
- **Meshes:** CircleGeometry radius 8-16 based on StarType (BlueGiant 14, BlackHole 16, Neutron 10, Binary 12, Yellow 9), displayRadius = radius*(0.5+scale*0.5)
- **Shaders:**
  - Regular: `glow=1-dist pow1.5`, `pulse=0.9+0.1*sin(time*0.001)`, `finalColor=color*pulse + hover/selected boost`, `alpha=0.8+0.2*glow * discoveryState`
  - Black Hole: event horizon dist<0.45 black, photon ring 0.45-0.55 `1-smoothstep* (0.8+0.2*sin(time*0.002+dist*10))`, outer glow `1-dist pow2*0.6`, accretion disk shimmer `sin(angle*3+time*0.001)*0.1+0.9 * smoothstep(0.5,0.7,dist)*(1-smoothstep(0.7,1.0,dist))`, final `color*(ring*1.5+glow*0.5+disk*0.3)`, isSelected uniform
- **Glows:** CircleGeometry *3.5, ShaderMaterial with `alpha=0.08 detected else 0.18`, `glow=1-dist pow2.5`, pulse sin, additive
- **Raycaster:** For picking, fallback distance check 50/scale

**Sectors LOD (<0.08):**
- PlaneGeometry 1000*0.95, color by density: >0.6 blue 0.25 alpha, >0.3 darker 0.18, >0.05 darkest 0.12, void 0.04, empty *0.5, meshes in sectorGroup, visibility controlled by scale, count circles for systems

**Ship:**
- ConeGeometry 18x36 3 sides rotateZ -90°, MeshBasicMaterial white, position 30 z
- Glow CircleGeometry 36, ShaderMaterial `glow=1-dist pow2.2`, `pulse=0.7+0.3*sin(time*0.003)`, `vec4(0.35,0.6,1.0, glow*0.5*pulse)`, additive
- Trail Points 100, BufferGeometry positions, alphas random, ShaderMaterial points 3px `vec4(0.4,0.7,1.0, vAlpha*(1-dist*2))`, drift (rand-0.5)*0.5

**Ranges:**
- FTL RingGeometry 600-2/600+2 128 segments, MeshBasicMaterial 0x5aa0ff 0.18 alpha
- Sensor Ring 500-1/500+1 128, 0.1 alpha
- Sensor Fill CircleGeometry 500 64, 0.025 alpha
- Scale by ftlRange/600, sensorRange/500

**Camera:**
- OrthographicCamera frustum 10000/scale, aspect w/h, left/right/top/bottom, position -offset, updateProjectionMatrix, lerp offset/scale 0.1
- worldToScreen via project, screenToWorld via unproject
- Resize: setSize w/h false, pixelRatio min(dpr,2), update frustum

**2. Cockpit HUD (src/render/cockpit/cockpit.ts + styles.css):**

**Visual:**
- Vignette radial transparent 50% → black 0.4 100%
- Frame top/bottom/left/right with clip-path polygon, gradient 20,30,60 0.9 → 10,15,28 0.8, border
- Top HUD: brackets left/right 40x20 border accent 0.5, center crosshair 40x40 with h/v 1px accent 0.6, circle border 1px accent 0.4 inset 8, target info 10px accent-2 bg black 0.5 border
- Bottom HUD: left/right ship data bg black 0.5 border 1px, 8x12 padding, 100px min-width, data row label faint 35px min-width + value bold mono, center horizon 200x20 border-top accent 0.3, line accent 0.6, ticks 1x8 accent 0.4
- Side HUDs: left/right 50px from edge, top 50% translateY -50%, vertical bars 6x80 bg white 0.05 border, fill gradient accent→accent-2, label vertical-rl 8px faint, compass 80x80 bg black 0.5 border circle, ring 60x60 border, ticks N/E/S/W, needle 2x25 accent shadow 0 0 5px, bearing 9px dim
- Damage overlay radial transparent 30% → red 0.2 100%, opacity 0→0.6 flash 200ms
- Scanlines repeating-linear-gradient 0deg transparent 2px, accent 0.03 2-3px, opacity 0.5
- FTL charging: crosshair pulse scale 1→1.2 0.5s infinite, circle expand 1→1.5 opacity 0.4→0 1s infinite

**Logic:**
- enabled bool, container div cockpit-hud, cache elements by id
- show/hide/toggle with display block/none + active class opacity 0→1 0.3s
- update(data: target, speed, heading, range, fuel, shield, hull, bearing): textContent, color red if <20/30 else success/text, needle rotate bearing deg
- flashDamage(intensity 0.5): opacity intensity, bg radial red intensity*0.3, timeout 200ms opacity 0
- setFTLCharging(charging bool): add/remove ftl-charging class

**3. Planet Surface 3D (src/render/planet/planetSurface.ts):**

**Renderer:**
- PerspectiveCamera 60deg, aspect w/h, 0.1-1000, position 0,10,30 lookAt 0,0,0
- WebGLRenderer antialias alpha, pixelRatio device, size w/h false, shadowMap enabled PCFSoft
- Lights: Ambient 0x404060 0.4, Directional white 1.0 pos 50,50,25 castShadow 1024, Point 0x5aa0ff 0.3 100 pos 0,5,0
- Groups: terrainMesh, atmosphereMesh, dustParticles, ruinsGroup

**Terrain Generation by PlanetType:**
- PlaneGeometry 200x200 64x64 segments, displace z:
  - barren: sin(x*0.1)*2 + cos(y*0.1)*2 + rand*0.5
  - desert: sin(x*0.05)*3 + sin(y*0.05+x*0.03)*2
  - ice: sin(x*0.08)*1.5 + cos(y*0.08)*1.5 + rand*0.3
  - volcanic: sin(x*0.1)*4 + cos(y*0.12)*3 + rand*2, 2% chance crater -5
  - crystal: sin(x*0.2)*2 + cos(y*0.2)*2, 10% chance spike +3
  - ancient: sin(x*0.05)*1 + rand*0.2, flat if dist<20 *0.2 for ruins
  - default: sin(x*0.07)*2 + cos(y*0.07)*2
- computeVertexNormals
- Material MeshStandardMaterial color def.color, emissive def.secondaryColor*0.1, roughness ice 0.3 desert 0.9 else 0.7, metalness crystal 0.8 else 0.1

**Atmosphere:**
- If atmosphere attr <0.1 skip
- SphereGeometry 80 32x32, ShaderMaterial uniforms color def.color, opacity attr*0.3, vertex vNormal = normalMatrix*normal, fragment `intensity = pow(0.7-dot(vNormal, vec3(0,0,1)),2)`, `vec4(color, opacity*intensity)`, transparent BackSide Additive

**Dust:**
- Count desert 1000 volcanic 800 else 200, BufferGeometry positions random 200x50x200, PointsMaterial color def.color size desert 0.5 else 0.3 opacity 0.4

**Ruins:**
- Count ancient 20 else 5, BoxGeometry rand 2-6 x 4-12 y 2-6 z, MeshStandardMaterial 0x888899 emissive 0x222233 roughness 0.8 metalness 0.2, pos random 80, height/2, 80, rot y rand, cast/receive shadow, ancient 30% glow Sphere 0.5 MeshBasicMaterial 0x5aa0ff opacity 0.6 at y+2

**Life:**
- Count earth_like 30 ocean 20 else 10, ConeGeometry 0.2-0.7 radius 1-3 height 6 sides, MeshStandardMaterial earth_like 0x4ade80 else 0x60a5fa roughness 0.8, pos random 100, 0.5, 100, cast shadow

**Render Loop:**
- dust rotation y time*0.00005, pos y + sin(time*0.001+i)*0.01
- atmosphere rotation y time*0.00002
- camera pos x sin(time*0.0001)*2, y 10+sin(time*0.00007)*0.5, lookAt 0,0,0
- renderer.render

**Integration (app.ts):**
- planetSurfaceCanvas in overlay div planet-surface-overlay fixed inset 0 z100 bg 02,04,0a 0.95 flex column opacity 0 pointer-events none transition 0.5s, active opacity1 pointer-events all
- Header 56px gradient 12,18,32 0.95 → 8,12,22 0.9 border, title 18 bold, meta 11 dim
- Canvas flex1 100% height calc(100vh-56-80)
- HUD 80px bg-panel-strong border-top, info 11 dim, buttons collect samples + return orbit
- openPlanetSurface(planetId): getPlanetById, set title/meta, overlay active, setPlanet, resize, toast
- closePlanetSurface: remove active
- Land button now calls openPlanetSurface instead of modal, collects resources 0.3* + crew XP 25

**4. Renderer Toggle & Performance:**
- galaxy-webgl-canvas + galaxy-canvas both in galaxy-map-container, only one display block
- overlay canvas for scale bar WebGL
- renderer-toggle div absolute top 16 right 16 z20 flex gap6 bg-panel-strong border padding6 radius6, buttons 6x12 10px transparent border transparent dim hover white 0.05 text, active bg accent white border accent shadow 0 0 10px accent 0.3
- Buttons: WEBGL 100K STARS, CANVAS2D, COCKPIT, 1M STARS
- Logic: useWebGL bool, saved in localStorage aether_renderer, starCount saved aether_starcount 100k/1m, cockpit saved aether_cockpit true/false
- applyRendererMode: display none/block, localStorage, toggle active class
- getActiveRenderer: return webgl if useWebGL else canvas
- All galaxyRenderer. references replaced with getActiveRenderer() for zoom/center/focus/worldToScreen
- FTL_JUMP sets both renderers ship pos, cockpit setFTLCharging true timeout 1s false, particles via active renderer
- HULL_DAMAGED flash cockpit damage 0.6
- startLoop updates both renderers, renders active, overlay scale bar via renderOverlay(ctx) clearing and dpr transform
- Cockpit update each frame if enabled: target name, speed ftlCharge/100, heading atan2 target-ship, range dist, fuel/shield/hull %, bearing now*0.01%360

**Bundle:**
- Before v5: 228kB (63kB gz) Canvas2D only
- After v5: 276kB main (74kB gz) + 527kB three chunk (131kB gz) = 206kB gz total — 3x larger but with 100k stars, volumetric nebulae, planet 3D, cockpit. Code-split via vite.config.ts manualChunks three
- Performance: 100k stars 1 draw call, sector LOD, culling 500-1500 systems, offscreen cache for Canvas2D, WebGL additive blending

---

## 🌌 v4 — TRUE SCALE (still included)

- InfiniteGalaxy 50k LY, 100x100 sectors 10k, ~20k systems estimated, streaming on demand, cache 150, prune far unvisited, deterministic seed+fork, emptiness 70-90% void, DeepSpacePOI rogue planets etc.
- GalacticStructure spiral math, density core+arm+disk*noise, clumps 5% 2.5x, region names, danger modifier, nebulae 25
- GalaxyRenderer LOD <0.03 sector heatmap + spiral guides + stats, 0.03-0.15 stars+nebulae+Milky Way+core glow, 0.08+ POIs, 0.05+ FTL/sensor ranges+trade routes, >0.1 faction badges, >0.2 ship label, >0.3 names, background cache offscreen, culling 500, scale bar LY, zoom 0.01-2.0
- UI true scale panel, sector, region, position, distance core, structure explanation, zoom LOD, POIs near you, active quests

---

## 🎮 Gameplay Loop v5

```
Spawn Habitable Zone → Galaxy Map WebGL 100k stars twinkle + volumetric nebulae + Milky Way band + core glow + sector LOD heatmap
→ Toggle Cockpit HUD → Feel inside ship: crosshair, horizon, compass, fuel/shield/hull, sensor/FTL bars
→ See emptiness: 70% void empty, 1px=100 LY, scale bar 5000 LY tiny, you are dot
→ Plan route via density → FTL Jump (warp effect + cockpit charging pulse + particles + generates sectors)
→ Arrive → System View → Scan → Discover → Planet with Life/Ruins → Land → Planet Surface 3D: terrain by type, atmosphere shader, dust, ruins, life, WASD look, collect samples + resources
→ Station (rare) → Trade → Quests main story branching permanent consequences
→ World Memory galaxy remembers → Save only discovered → Explore Outer Arms, Halo, Core → Repeat, 0.01% → 1% never 100%
```

---

## 🏗 Architecture v5

```
/src
  /render
    /webgl
      galaxyWebGL.ts — 100k stars BufferGeometry Points shader twinkle, volumetric nebulae Circle shader FBM noise, black hole lensing, ship cone+glow+trail, ranges RingGeometry, sectors Plane LOD, raycaster, LOD 200/500/1500 systems, worldToScreen/project, screenToWorld/unproject, update lerp 0.1, renderOverlay scale bar
      volumetricNebula.ts — VolumetricNebula Sphere shader raymarching density + 3D noise + Fresnel + pulsation, Field group add/generateRandom/update
    /planet
      planetSurface.ts — PerspectiveCamera, WebGLRenderer shadow PCFSoft, lights Ambient+Directional+Point, terrain PlaneGeometry displace by type, atmosphere Sphere shader, dust Points, ruins Box+glow, life Cone, render loop camera sin movement
    /cockpit
      cockpit.ts — CockpitHUD container vignette+frame+brackets+crosshair+target+horizon+shipData+verticalBars+compass+damage+scanlines, show/hide/toggle, update fuel/shield/hull/target/speed/heading/range/bearing, flashDamage, setFTLCharging
    galaxyRenderer.ts — Canvas2D fallback with background cache, LOD, spiral guides, POIs, culling
  /galaxy/v4 — InfiniteGalaxy streaming, GalacticStructure spiral
  /ui
    app.ts — Dual renderer Canvas2D+WebGL, applyRendererMode, getActiveRenderer, planet surface overlay, cockpit HUD, renderer toggle, star count toggle 100k/500k, FTL_JUMP both renderers, cockpit flash, startLoop both update + active render + overlay + cockpit update
    styles.css — galaxy-webgl-canvas absolute inset 100%, cockpit-hud absolute inset z15 pointer-events none display none opacity 0 active 1, vignette radial, frame clip-path, top/bottom/side HUDs, crosshair, horizon, vertical bars, compass, damage, scanlines, ftl-charging pulse+expand keyframes, planet-surface-overlay fixed inset z100 bg 02,04,0a 0.95 flex column opacity 0→1, header 56px, canvas flex1, hud 80px, renderer-toggle absolute top16 right16 z20 flex gap6 bg-panel-strong border padding6 radius6, renderer-btn 6x12 10px transparent active accent shadow
  vite.config.ts — manualChunks three
```

---

## 🛠 Tech Stack v5

- TypeScript 5.5 + Vite 5.4 + Three.js 0.186.1
- WebGL (Three.js) + Canvas2D fallback
- BufferGeometry 100k Points, ShaderMaterial twinkle+noise+lensing
- Vanilla (no framework) for performance
- Deterministic RNG Mulberry32
- LOD, culling, streaming, cache, code-split

---

## 🚀 Running v5

```bash
npm install
npm run dev    # → http://localhost:5173, WebGL 100k stars default, toggle Canvas2D/Cockpit/1M
npm run build  # → dist: 276kB main (74kB gz) + 527kB three (131kB gz) = 206kB gz
```

**Controls v5:**
- Galaxy Map: Drag pan, Scroll zoom 0.01 galaxy → 2.0 system, Double click focus, Click system, + - ◉ ✦, 🔊 mute, WEBGL/CANVAS2D toggle, COCKPIT toggle, 1M STARS toggle 100k↔500k
- Cockpit: Crosshair center, target info, horizon, ship data left/right fuel/shield/hull/speed/heading/range, sensor/FTL vertical bars left, compass right bearing, damage flash red, FTL charging pulse+expand, scanlines
- Planet Surface 3D: Landing view with terrain by type (barren rocks, desert dunes, ice cracks, volcanic craters+lava, crystal spikes, ancient flat ruins), atmosphere shader, dust particles, ruins boxes+glow, life cones, camera sin movement, WASD (future), mouse drag orbit, scroll zoom, ESC close, Collect Samples + Resources, Return to Orbit
- System View: Star with glow, black hole accretion, planets gradient+atmosphere+rings+life/ruins, orbits dashed
- Left: Galaxy v5 WebGL 100k + cockpit + true scale + region + POIs / System / Ship / Crew / Quests / Story
- Right: Details (Land opens 3D) / Market / Factions / Lore / Codex / World / Cargo / Log

---

## 🎨 Visual v5

- **WebGL Galaxy:** 100k stars twinkle sin(time*0.001+pos*0.01) + depthTwinkle sin(time*0.0005+pos.z*0.02), size 400/-mvPosition.z*scale clamp 0.5-12, glow pow1.8 core+halo mix additive. Volumetric nebulae with FBM noise 4 octaves turbulence 0.6+0.4, radial pow1.2, alpha pow1.5, color variation. Black hole event horizon <0.45 black, photon ring 0.45-0.55 shimmer sin(time*0.002), accretion disk sin(angle*3+time*0.001). Ship cone white + glow pulse 0.7+0.3*sin(0.003) + trail 100 points drift. Ranges ring 128 segments 0.18/0.1/0.025 alpha. Sectors plane density color blue high 0.25 → void 0.04. Scale bar LY overlay.
- **Cockpit:** Vignette, frame clip-path, brackets, crosshair h/v 1px accent 0.6 + circle 0.4, target bg black 0.5, bottom ship data bg black 0.5, horizon 200x20 border-top 0.3 + line 0.6 + ticks 0.4, vertical bars 6x80 bg white 0.05 border fill gradient, compass 80x80 bg black 0.5 circle 60 border + N/E/S/W ticks + needle 2x25 accent shadow, damage radial red flash, scanlines repeating 2px transparent + 1px accent 0.03, FTL charging pulse scale 1→1.2 + expand 1→1.5 opacity 0.
- **Planet 3D:** Terrain 200x200 64x64 displace by type, MeshStandardMaterial color secondary*0.1 roughness/metalness, atmosphere Sphere 80 shader Fresnel pow(0.7-dot)2 opacity attr*0.3 BackSide Additive, dust 200-1000 Points color size 0.3-0.5 opacity 0.4 rotation y 0.00005 + sin y, ruins Box 2-6x4-12x2-6 0x888899 emissive 0x222233 + glow Sphere 0.5 0x5aa0ff 0.6, life Cone 0.2-0.7x1-3 6 sides 0x4ade80/0x60a5fa, shadows PCFSoft, camera sin x*0.0001*2 y 10+sin*0.5.

---

## 📝 Save v5

Same as v4 + renderer prefs in localStorage: aether_renderer webgl/canvas2d, aether_starcount 100k/1m, aether_cockpit true/false. Galaxy JSON only discovered. Version 4.

---

## 🧪 Testing v5 Fun

> "Luar angkasa bukan peta. Ini adalah tempat. Dan kamu ada di dalamnya."

1. Spawn → Intro v5 WEBGL 100K STARS • VOLUMETRIC NEBULAE • COCKPIT • PLANET LANDING 3D • TRUE SCALE 50K LY
2. Galaxy Map WebGL 100k stars twinkle, volumetric nebulae noise, Milky Way band, core glow, sector LOD heatmap <0.03 spiral arms dashed, stats WebGL • 100,000 stars • Rendering 200/500 • Scale 1% • 1px=100 LY
3. Toggle COCKPIT → HUD appears: vignette, crosshair, horizon, fuel/shield/hull bars, sensor/FTL vertical, compass bearing, target info
4. Pan in void → mostly empty, 70% void, fuel matters, isolation
5. Toggle 1M STARS → 500k stars high density, more GPU, toggle back 100k balanced
6. Zoom 0.1 → stars + nebulae + FTL/sensor ranges tiny vs galaxy, trade routes faint, POIs
7. Select system → Focus Map → getActiveRenderer focus, worldToScreen via Three.js project
8. Jump → FTL warp effect + cockpit charging pulse+expand + particles purple + both renderers ship pos update
9. Arrive → System View → Planet with Life/Ruins → Details → Land → Planet Surface 3D overlay: terrain by type, atmosphere, dust, ruins, life, camera sin movement, Collect Samples +25 XP +0.3 resources, Return to Orbit
10. Damage event → cockpit flash red radial 0.6 200ms + particles
11. Lore/Story/World tabs same v4 but with WebGL feeling
12. Save → reload → discovered only, renderer prefs saved, deterministic

**You are dot in 100k stars, inside cockpit, landing on 3D planets. And galaxy remembers.**

---

## 📜 License MIT

Built as foundation growing from small prototype (75 systems) → true-scale infinite (50k LY, 20k systems, streaming) → WebGL immersion (100k stars, volumetric, cockpit, planet 3D) without rebuilding.

*When the silent planet sings, the roads will open again. And what left will return. And you will be there, in your big ship that is your home, in the void that is mostly empty but full of 100k stars twinkling, with cockpit HUD glowing, landing on 3D planets no one has visited, deciding what to do. And the galaxy will remember.*

---

## 🔮 Roadmap v6

- [x] v5 WebGL 100k stars, volumetric nebulae, black hole lensing, cockpit, planet 3D
- **v6 Ideas:** Relativistic effects, time dilation, fuel scooping from stars (StarfieldRenderer scoop), sublight travel within system orbital mechanics, EVA first-person, VR, multiplayer share discoveries, fleet system, player-owned station build in empty sector, procedural civ sim wars/colonization, 1M stars true with instancing + LOD clusters
