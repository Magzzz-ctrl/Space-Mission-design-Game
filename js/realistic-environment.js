// Project Horizons: I Am Astronut - Realistic Planetary Environment Simulation
// Photorealistic 3D Surface Visualizer & NASA PDS Geological Planetary Explorer
// Powered by Three.js (WebGL 3D) with Volumetric Lighting, Atmospheric Shaders & Procedural Geometry

class RealisticPlanetaryEnvironment {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.container = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.animId = null;
    this.planetId = 'earth';

    // 3D Orbit Camera Control States
    this.cameraDistance = 55;
    this.targetDistance = 55;
    this.theta = 0.4;
    this.phi = 0.35;
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.centerTarget = { x: 0, y: 4, z: 0 };
    this.spectrometerData = null;

    // Animated Scene Entities
    this.animatedObjects = [];
    this.laserBeam = null;
    this.laserPulseTimer = 0;

    // Authentic NASA Research Centers Scientific Data
    this.planetSpecs = {
      earth: {
        center: 'NASA Kennedy Space Center (KSC) & Goddard (GSFC)',
        facility: 'Launch Complex 39A (28.6083° N, 80.6043° W)',
        atmosphere: '1.00 atm (78.08% N₂, 20.95% O₂, 0.93% Ar)',
        temperature: '288 K (15°C)',
        gravity: '9.80 m/s² (1.00g)',
        pressure: '101.3 kPa',
        features: 'Atlantic Ocean shoreline, LC-39A gantry tower, flame trench, Apollo & Artemis launch pad.'
      },
      moon_south: {
        center: 'NASA Ames Research Center (ARC) & Jet Propulsion Laboratory (JPL)',
        facility: 'Malapert A / Shackleton Rim (80.13° S, 1.44° E)',
        atmosphere: '3 × 10⁻¹⁵ atm (Ultra-high lunar vacuum)',
        temperature: '40 K to 220 K (-233°C in shadows, -53°C on rims)',
        gravity: '1.62 m/s² (0.165g)',
        pressure: '10⁻¹⁰ Pa',
        features: 'Low-grazing 1.5° solar beam, permanently shadowed cryogenic water-ice traps, rising blue Earth, VIPER rover & Artemis lander.'
      },
      moon: {
        center: 'NASA Johnson Space Center (JSC, Houston) & Goddard (GSFC)',
        facility: 'Tranquility Base (0.67408° N, 23.47297° E)',
        atmosphere: 'Vacuum (< 10⁻¹² torr)',
        temperature: '100 K to 390 K (-173°C to 117°C)',
        gravity: '1.62 m/s² (0.165g)',
        pressure: '0.00 kPa',
        features: 'Apollo 11 Lunar Module (Eagle) descent stage with gold foil, laser retroreflector, ALSEP package, pristine regolith.'
      },
      mars: {
        center: 'NASA Jet Propulsion Laboratory (JPL, Pasadena, CA)',
        facility: 'Jezero Crater Delta (18.38° N, 77.58° E)',
        atmosphere: '0.006 atm (95.3% CO₂, 2.6% N₂, 1.9% Ar)',
        temperature: '210 K (-63°C)',
        gravity: '3.72 m/s² (0.38g)',
        pressure: '0.61 kPa',
        features: 'Perseverance Rover & Ingenuity helicopter, terraced river delta clays, dust devils, blue sunset Mie halo, Phobos/Deimos.'
      },
      europa: {
        center: 'NASA Jet Propulsion Laboratory (JPL) & Goddard (GSFC)',
        facility: 'Conamara Chaos Fractured Ice Sheet (9° N, 274° W)',
        atmosphere: '10⁻¹¹ atm (Tenuous molecular oxygen exosphere)',
        temperature: '102 K (-171°C)',
        gravity: '1.315 m/s² (0.134g)',
        pressure: '0.10 μPa',
        features: 'Vast ice ridges with dark tholin cracks, 100km cryovolcanic vapor geysers, giant 3D banded Jupiter with Great Red Spot.'
      },
      titan: {
        center: 'NASA Jet Propulsion Laboratory (JPL) & Johns Hopkins APL',
        facility: 'Kraken Mare Shoreline (68° N, 310° W)',
        atmosphere: '1.45 atm (98.4% N₂, 1.4% CH₄, organic tholin haze)',
        temperature: '94 K (-179°C)',
        gravity: '1.352 m/s² (0.14g)',
        pressure: '146.7 kPa',
        features: 'Liquid methane & ethane reflective ripples, golden nitrogen smog, Dragonfly nuclear octocopter, Saturn with ring system.'
      }
    };
  }

  open(planetId) {
    this.planetId = planetId || this.game.currentPlanetId || 'earth';
    this.isOpen = true;
    this.spectrometerData = null;
    this.createDOM();
    this.init3DScene();

    if (window.soundEngine && typeof window.soundEngine.playTargetLock === 'function') {
      window.soundEngine.playTargetLock();
    }
  }

  toggle(planetId) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(planetId);
    }
  }

  close() {
    this.isOpen = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.renderer && this.renderer.dispose) {
      try { this.renderer.dispose(); } catch (e) {}
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animatedObjects = [];
    this.laserBeam = null;
  }

  createDOM() {
    if (this.container) return;

    const specs = this.planetSpecs[this.planetId] || this.planetSpecs.earth;
    const isSouthPole = this.planetId === 'moon_south';
    const planetName = (this.game.planetData ? this.game.planetData.name : this.planetId).toUpperCase();

    const overlay = document.createElement('div');
    overlay.id = 'realistic-env-modal';
    overlay.className = 'fixed inset-0 z-50 flex flex-col bg-slate-950 text-white font-rajdhani select-none overflow-hidden';
    overlay.innerHTML = `
      <!-- Top Sci-Fi Header Telemetry Bar (100% Fully Responsive Layout) -->
      <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-5 md:py-3 bg-slate-950/95 border-b border-cyan-500/40 backdrop-blur-xl z-20 flex-shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-full ${isSouthPole ? 'bg-cyan-500/30 border-2 border-cyan-300 shadow-[0_0_15px_#00e5ff]' : 'bg-blue-600/30 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]'} flex items-center justify-center text-sm flex-shrink-0">
            ${isSouthPole ? '🌕' : '🪐'}
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="font-orbitron font-black text-xs md:text-sm text-cyan-300 tracking-wider truncate">
                ${isSouthPole ? '⭐ NASA FLAGSHIP: MOON SOUTH POLE // 80°S MALAPERT A' : `REALISTIC 3D SURFACE // ${planetName}`}
              </span>
              <span class="text-[9px] px-2 py-0.5 rounded-full ${isSouthPole ? 'bg-cyan-950 text-cyan-200 border border-cyan-400 font-bold animate-pulse' : 'bg-blue-950/80 text-blue-300 border border-blue-500/50'} font-mono whitespace-nowrap">
                ${isSouthPole ? 'NASA ARTEMIS WATER-ICE FOCUS' : 'NASA PDS ARCHIVES'}
              </span>
            </div>
            <div class="text-[10px] md:text-[11px] font-mono text-slate-400 truncate">
              FACILITY: <span class="text-slate-200 font-bold">${specs.facility}</span> • CENTER: <span class="text-amber-400 font-bold">${specs.center}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button id="btn-env-scan" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400 text-cyan-300 font-orbitron text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer">
            <span>🔬</span>
            <span class="hidden sm:inline">PIXL LASER SCAN</span>
          </button>
          <button id="btn-env-close" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-orbitron text-xs font-bold cursor-pointer border border-slate-700 transition-colors">
            ✕ CLOSE [ESC]
          </button>
        </div>
      </div>

      <!-- Main 3D Canvas Viewport Container -->
      <div id="env-canvas-container" class="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-slate-950">
        <canvas id="env-3d-canvas" class="w-full h-full block"></canvas>

        <!-- NASA Moon South Pole Special Mission Callout Banner -->
        ${isSouthPole ? `
          <div class="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-200 font-orbitron text-[11px] font-bold shadow-[0_0_20px_rgba(0,229,255,0.4)] z-20 pointer-events-none flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>NASA ARTEMIS & VIPER: PERMANENTLY SHADOWED CRYOGENIC WATER-ICE DISCOVERY [40 KELVIN]</span>
          </div>
        ` : ''}

        <!-- Spectrometer Scan Result Card -->
        <div id="env-spectrometer-card" class="hidden absolute top-4 left-4 max-w-sm tactical-glass rounded-xl p-4 border border-cyan-400 shadow-2xl z-20 space-y-2">
          <div class="flex items-center justify-between pb-1 border-b border-cyan-500/30">
            <span class="text-[10px] font-orbitron font-bold text-cyan-300 uppercase tracking-wider">NASA PIXL/SHERLOC LASER SCAN</span>
            <span id="env-spec-time" class="text-[9px] font-mono text-slate-400">0.00s</span>
          </div>
          <div id="env-spec-target" class="font-orbitron font-bold text-xs text-white">Target: Surface Regolith</div>
          <div id="env-spec-bars" class="space-y-1.5 text-[10px] font-mono"></div>
        </div>

        <!-- Interactive Hint Toast -->
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/85 border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none shadow-lg z-20 text-center whitespace-nowrap">
          🖱️ Drag to rotate 360° • Scroll to zoom • Click ground to fire NASA PIXL Laser Spectrometer
        </div>
      </div>

      <!-- Bottom Atmospheric & Geological Telemetry Strip (Responsive Grid) -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 md:gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-slate-950 border-t border-cyan-500/30 text-xs font-mono z-20 flex-shrink-0">
        <div class="p-1.5 rounded bg-slate-900/90 border border-slate-800">
          <span class="text-[9px] text-slate-400 block uppercase">ATMOSPHERIC PRESSURE</span>
          <span class="text-cyan-300 font-bold text-xs truncate block">${specs.pressure}</span>
        </div>
        <div class="p-1.5 rounded bg-slate-900/90 border border-slate-800">
          <span class="text-[9px] text-slate-400 block uppercase">SURFACE TEMPERATURE</span>
          <span class="text-amber-400 font-bold text-xs truncate block">${specs.temperature}</span>
        </div>
        <div class="p-1.5 rounded bg-slate-900/90 border border-slate-800">
          <span class="text-[9px] text-slate-400 block uppercase">SURFACE GRAVITY</span>
          <span class="text-emerald-400 font-bold text-xs truncate block">${specs.gravity}</span>
        </div>
        <div class="p-1.5 rounded bg-slate-900/90 border border-slate-800">
          <span class="text-[9px] text-slate-400 block uppercase">ATMOSPHERE MIX</span>
          <span class="text-slate-200 font-bold text-xs truncate block">${specs.atmosphere}</span>
        </div>
        <div class="col-span-2 sm:col-span-1 p-1.5 rounded bg-slate-900/90 border border-slate-800">
          <span class="text-[9px] text-slate-400 block uppercase">NASA SCIENTIFIC TARGET</span>
          <span class="text-cyan-400 font-bold text-xs truncate block">${specs.features}</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.container = overlay;

    // Bind UI Event Listeners
    document.getElementById('btn-env-close').addEventListener('click', () => this.close());
    document.getElementById('btn-env-scan').addEventListener('click', () => this.triggerLaserScan());

    const cContainer = document.getElementById('env-canvas-container');
    cContainer.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => { this.isDragging = false; });
    window.addEventListener('mousemove', (e) => {
      if (!this.isOpen || !this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.theta -= dx * 0.007;
      this.phi = Math.max(0.08, Math.min(1.45, this.phi + dy * 0.005));
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    // Touch controls for mobile 3D inspection
    let touchStart = { x: 0, y: 0 };
    cContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });
    cContainer.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStart.x;
        const dy = e.touches[0].clientY - touchStart.y;
        this.theta -= dx * 0.008;
        this.phi = Math.max(0.08, Math.min(1.45, this.phi + dy * 0.006));
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    cContainer.addEventListener('wheel', (e) => {
      this.cameraDistance = Math.max(18, Math.min(140, this.cameraDistance + (e.deltaY > 0 ? 4 : -4)));
      e.preventDefault();
    }, { passive: false });

    cContainer.addEventListener('click', (e) => {
      if (e.target.id === 'env-3d-canvas') {
        this.triggerLaserScan(e.clientX, e.clientY);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.code === 'Escape') {
        this.close();
      }
    });
  }

  triggerLaserScan(screenX, screenY) {
    const card = document.getElementById('env-spectrometer-card');
    const targetEl = document.getElementById('env-spec-target');
    const barsEl = document.getElementById('env-spec-bars');
    const timeEl = document.getElementById('env-spec-time');

    if (!card) return;

    card.classList.remove('hidden');
    timeEl.textContent = new Date().toLocaleTimeString();

    if (window.soundEngine && typeof window.soundEngine.playTargetLock === 'function') {
      window.soundEngine.playTargetLock();
    }

    // Trigger visual 3D Laser Beam in scene
    this.laserPulseTimer = 45;

    let mineralData = [];
    if (this.planetId === 'earth') {
      targetEl.textContent = 'Target: KSC Launch Pad 39A Quartz Sand & Basalt';
      mineralData = [
        { name: 'Quartz / Silicon Dioxide (SiO₂)', pct: 88, color: '#38bdf8' },
        { name: 'Calcium Carbonate Shell Fragments', pct: 8, color: '#f8fafc' },
        { name: 'Heavy Mineral Ilmenite/Rutile', pct: 4, color: '#facc15' }
      ];
    } else if (this.planetId === 'moon_south') {
      targetEl.textContent = 'Target: Malapert A Crater Cryogenic Water-Ice Trap (40 K)';
      mineralData = [
        { name: 'Cryogenic Subsurface Water Ice (H₂O)', pct: 42, color: '#00e5ff' },
        { name: 'Volatile Hydrocarbons & Carbon Dioxide (CO₂)', pct: 18, color: '#38bdf8' },
        { name: 'Anorthositic Plagioclase Feldspar', pct: 26, color: '#e2e8f0' },
        { name: 'Titanium-Rich Ilmenite (FeTiO₃)', pct: 14, color: '#facc15' }
      ];
    } else if (this.planetId === 'moon') {
      targetEl.textContent = 'Target: Apollo 11 Sea of Tranquility Regolith';
      mineralData = [
        { name: 'Pyroxene & Olivine Silicates', pct: 54, color: '#a3e635' },
        { name: 'High-Titanium Ilmenite (FeTiO₃)', pct: 28, color: '#facc15' },
        { name: 'Impact Glass & Spherules', pct: 18, color: '#94a3b8' }
      ];
    } else if (this.planetId === 'mars') {
      targetEl.textContent = 'Target: Jezero Delta Smectite Clay & Carbonates';
      mineralData = [
        { name: 'Hydrated Magnesium Smectite Clays', pct: 48, color: '#f97316' },
        { name: 'Iron-Oxide Hematite & Magnetite', pct: 36, color: '#ef4444' },
        { name: 'Astrobiological Organic Biosignature Residue', pct: 16, color: '#10b981' }
      ];
    } else if (this.planetId === 'europa') {
      targetEl.textContent = 'Target: Conamara Chaos Fractured Cryo-Crust';
      mineralData = [
        { name: 'Amorphous & Crystalline Water Ice (H₂O)', pct: 82, color: '#38bdf8' },
        { name: 'Hydrated Magnesium Sulfate (Epsomite)', pct: 12, color: '#fde047' },
        { name: 'Sulfuric Acid Hydrates & Tholins', pct: 6, color: '#ea580c' }
      ];
    } else {
      targetEl.textContent = 'Target: Kraken Mare Evaporite Basin & Tholin Dune';
      mineralData = [
        { name: 'Liquid/Frozen Methane & Ethane', pct: 64, color: '#f59e0b' },
        { name: 'Complex Macromolecular Tholins', pct: 28, color: '#b45309' },
        { name: 'Acetylene & Hydrogen Cyanide Ice', pct: 8, color: '#06b6d4' }
      ];
    }

    barsEl.innerHTML = mineralData.map(m => `
      <div>
        <div class="flex justify-between mb-0.5">
          <span class="text-slate-300 font-bold">${m.name}</span>
          <span class="text-cyan-400 font-bold">${m.pct}%</span>
        </div>
        <div class="w-full h-1.5 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
          <div class="h-full rounded-full" style="width: ${m.pct}%; background-color: ${m.color}"></div>
        </div>
      </div>
    `).join('');
  }

  init3DScene() {
    this.canvas = document.getElementById('env-3d-canvas');
    if (!this.canvas) return;

    const container = this.canvas.parentElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 120);

    // Verify Three.js Availability
    if (typeof THREE !== 'undefined') {
      this.buildThreeJSScene(width, height);
    } else {
      this.buildCanvasFallback(width, height);
    }
  }

  buildThreeJSScene(width, height) {
    try {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 2500);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true
      });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const resize = () => {
        if (!this.isOpen || !this.canvas || !this.canvas.parentElement) return;
        const w = this.canvas.parentElement.clientWidth;
        const h = this.canvas.parentElement.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      };
      window.addEventListener('resize', resize);

      // Build Planetary Environment Scene
      this.populatePlanetaryScene(this.planetId);

      // Animation & Render Loop
      let clock = new THREE.Clock();
      const render = () => {
        if (!this.isOpen) return;
        this.animId = requestAnimationFrame(render);
        const dt = clock.getDelta();
        const time = clock.getElapsedTime();

        // Orbit Camera Position around target
        this.camera.position.x = this.centerTarget.x + this.cameraDistance * Math.sin(this.theta) * Math.cos(this.phi);
        this.camera.position.y = this.centerTarget.y + this.cameraDistance * Math.sin(this.phi);
        this.camera.position.z = this.centerTarget.z + this.cameraDistance * Math.cos(this.theta) * Math.cos(this.phi);
        this.camera.lookAt(this.centerTarget.x, this.centerTarget.y, this.centerTarget.z);

        // Update animated 3D meshes (Earth rotation, geyser particles, laser)
        this.animatedObjects.forEach(obj => {
          if (obj.update) obj.update(time, dt);
        });

        // Laser Spectrometer Beam Pulse
        if (this.laserBeam) {
          if (this.laserPulseTimer > 0) {
            this.laserPulseTimer--;
            this.laserBeam.visible = true;
            this.laserBeam.material.opacity = Math.min(1.0, this.laserPulseTimer / 20);
          } else {
            this.laserBeam.visible = false;
          }
        }

        this.renderer.render(this.scene, this.camera);
      };

      render();

    } catch (e) {
      console.warn('[RealisticEnv] Three.js WebGL error, loading rich perspective fallback:', e);
      this.buildCanvasFallback(width, height);
    }
  }

  populatePlanetaryScene(pId) {
    const scene = this.scene;

    // 1. Sky & Deep Space Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2400;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 600 + Math.random() * 400;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = Math.abs(radius * Math.cos(phi)) + 20; // Above horizon
      starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, transparent: true, opacity: 0.85 });
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // 2. Realistic 3D Displaced Terrain Mesh
    const terrainSize = 260;
    const terrainSegs = 75;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.hypot(x, z);

      let y = 0;
      if (pId === 'moon_south') {
        // Malapert A / Shackleton Crater Basin: Deep depression in the center with jagged crater rims
        const rimElev = Math.sin(distFromCenter * 0.05) * 8 + Math.cos(x * 0.1) * 3;
        const craterBowl = -12 * Math.exp(-(distFromCenter * distFromCenter) / (45 * 45));
        y = rimElev + craterBowl;
      } else if (pId === 'earth') {
        // Coastal dunes & ocean shore
        y = Math.sin(x * 0.04) * 3 + Math.cos(z * 0.05) * 2;
        if (x < -30) y = Math.min(0.2, y); // Ocean flat
      } else if (pId === 'mars') {
        // Jezero layered river delta terraces
        y = Math.sin(x * 0.05 + z * 0.03) * 6 + Math.sin(distFromCenter * 0.08) * 4;
      } else if (pId === 'europa') {
        // Chaos terrain with sharp fractured ice ridges
        y = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 4.5 + Math.abs(Math.sin(x * 0.04)) * 3;
      } else {
        // Titan & Moon
        y = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 5;
      }
      pos.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    // Terrain Material
    let terrainMat;
    if (pId === 'moon_south') {
      terrainMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.85,
        metalness: 0.15,
        flatShading: true
      });
    } else if (pId === 'earth') {
      terrainMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.9,
        flatShading: true
      });
    } else if (pId === 'mars') {
      terrainMat = new THREE.MeshStandardMaterial({
        color: 0x9a3412,
        roughness: 0.85,
        flatShading: true
      });
    } else if (pId === 'europa') {
      terrainMat = new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        roughness: 0.25,
        metalness: 0.2,
        flatShading: true
      });
    } else {
      terrainMat = new THREE.MeshStandardMaterial({
        color: 0x78350f,
        roughness: 0.8,
        flatShading: true
      });
    }

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 3. Volumetric Atmospheric Fog & Solar Lighting
    if (pId === 'moon_south' || pId === 'moon') {
      scene.fog = new THREE.FogExp2(0x020617, 0.0025);
    } else if (pId === 'mars') {
      scene.fog = new THREE.FogExp2(0x9a3412, 0.0055);
    } else if (pId === 'titan') {
      scene.fog = new THREE.FogExp2(0xb45309, 0.008);
    } else if (pId === 'earth') {
      scene.fog = new THREE.FogExp2(0x0284c7, 0.003);
    }

    // Directional Sunlight (Low-grazing 1.5° on Moon South Pole!)
    const sunLight = new THREE.DirectionalLight(0xffffff, pId === 'moon_south' ? 1.8 : 1.3);
    if (pId === 'moon_south') {
      // Extremely low solar angle (Peaks of Eternal Light)
      sunLight.position.set(-150, 22, 100);
    } else if (pId === 'mars') {
      sunLight.color.setHex(0xffedd5);
      sunLight.position.set(80, 110, 60);
    } else {
      sunLight.position.set(70, 130, 80);
    }
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const ambLight = new THREE.AmbientLight(pId === 'moon_south' ? 0x0c4a6e : (pId === 'mars' ? 0x7c2d12 : 0x1e293b), 0.65);
    scene.add(ambLight);

    // 4. Special Destination Artifacts & NASA Achievements
    if (pId === 'moon_south') {
      // =======================================================================
      // NASA MOON SOUTH POLE HIGHLIGHT: ARTEMIS LANDER, VIPER ROVER & CRYOGENIC ICE
      // =======================================================================

      // 4A. Luminous 3D Blue Earth hanging right above the southern horizon!
      const earthGeo = new THREE.SphereGeometry(18, 32, 32);
      const earthMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.4,
        metalness: 0.1,
        emissive: 0x0369a1,
        emissiveIntensity: 0.35
      });
      const earthMesh = new THREE.Mesh(earthGeo, earthMat);
      earthMesh.position.set(110, 55, -280);
      scene.add(earthMesh);

      // Clouds sphere around Earth
      const cloudGeo = new THREE.SphereGeometry(18.4, 24, 24);
      const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      earthMesh.add(cloudMesh);
      this.animatedObjects.push({
        update: (time) => {
          earthMesh.rotation.y = time * 0.05;
          cloudMesh.rotation.y = time * 0.07;
        }
      });

      // 4B. Permanently Shadowed Cryogenic Water-Ice Crystals (Reflective Cyan Ice Patches)
      const iceGroup = new THREE.Group();
      for (let i = 0; i < 35; i++) {
        const iceGeo = new THREE.DodecahedronGeometry(1.2 + Math.random() * 2.5);
        const iceMat = new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.45,
          roughness: 0.1,
          metalness: 0.7
        });
        const iceCrystal = new THREE.Mesh(iceGeo, iceMat);
        const angle = Math.random() * Math.PI * 2;
        const rad = 15 + Math.random() * 40;
        iceCrystal.position.set(Math.cos(angle) * rad, -7 + Math.random() * 2, Math.sin(angle) * rad);
        iceCrystal.rotation.set(Math.random(), Math.random(), Math.random());
        iceGroup.add(iceCrystal);
      }
      scene.add(iceGroup);

      // 4C. NASA Artemis Human Landing System (HLS Starship / Lander)
      const landerGroup = new THREE.Group();
      landerGroup.position.set(22, 0, -18);

      // Rocket Hull
      const hullGeo = new THREE.CylinderGeometry(4.2, 5.0, 32, 24);
      const hullMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.7 });
      const hull = new THREE.Mesh(hullGeo, hullMat);
      hull.position.y = 16;
      hull.castShadow = true;
      landerGroup.add(hull);

      // Conical Nosecone
      const noseGeo = new THREE.ConeGeometry(4.2, 8, 24);
      const noseMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.8 });
      const nose = new THREE.Mesh(noseGeo, noseMat);
      nose.position.y = 36;
      nose.castShadow = true;
      landerGroup.add(nose);

      // 4 Outrigger Landing Legs with Footpads
      for (let leg = 0; leg < 4; leg++) {
        const legAngle = (leg * Math.PI) / 2;
        const legBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 14),
          new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 })
        );
        legBar.position.set(Math.cos(legAngle) * 6, 6, Math.sin(legAngle) * 6);
        legBar.rotation.z = Math.cos(legAngle) * 0.4;
        legBar.rotation.x = Math.sin(legAngle) * 0.4;
        legBar.castShadow = true;
        landerGroup.add(legBar);

        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(2.0, 2.0, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9 })
        );
        pad.position.set(Math.cos(legAngle) * 9, 0.3, Math.sin(legAngle) * 9);
        landerGroup.add(pad);
      }

      // NASA Solar Arrays & Communications Dish
      const solarPanel = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 16, 5),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 })
      );
      solarPanel.position.set(6, 22, 0);
      landerGroup.add(solarPanel);

      scene.add(landerGroup);

      // 4D. NASA VIPER Polar Exploration Rover
      const viperGroup = new THREE.Group();
      viperGroup.position.set(-14, 0, 8);

      const viperBody = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3.2, 7.5),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4, metalness: 0.6 })
      );
      viperBody.position.y = 3.4;
      viperBody.castShadow = true;
      viperGroup.add(viperBody);

      // Rover Solar Top Panel
      const viperSolar = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 0.3, 7.0),
        new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.9, roughness: 0.1 })
      );
      viperSolar.position.y = 5.1;
      viperGroup.add(viperSolar);

      // Rover Mast & Navcams
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 5),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      mast.position.set(0, 7.5, 2.5);
      viperGroup.add(mast);

      // TRIDENT Cryogenic Ice Drill Assembly
      const drill = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 4.5),
        new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9 })
      );
      drill.position.set(2.8, 1.8, -2.5);
      viperGroup.add(drill);

      // 4 Rocker-Bogie Wheels
      [[-3.4, -2.8], [-3.4, 2.8], [3.4, -2.8], [3.4, 2.8]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(1.3, 1.3, 1.0, 16),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 1.3, wz);
        wheel.castShadow = true;
        viperGroup.add(wheel);
      });

      scene.add(viperGroup);

      // 4E. 3D Laser Spectrometer Beam (Shoots from VIPER Rover to Cryo-Ice Basin)
      const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 28, 8);
      const laserMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0 });
      this.laserBeam = new THREE.Mesh(laserGeo, laserMat);
      this.laserBeam.position.set(-8, 3, -4);
      this.laserBeam.rotation.z = -Math.PI / 4;
      this.laserBeam.visible = false;
      scene.add(this.laserBeam);

    } else if (pId === 'earth') {
      // NASA KSC Launch Complex 39A Launch Gantry Tower & SLS Rocket
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, 0);

      const towerGeo = new THREE.BoxGeometry(6, 44, 6);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, wireframe: false });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.y = 22;
      gantryGroup.add(tower);

      // Rocket Stack
      const rStack = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 36, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6 })
      );
      rStack.position.set(6, 18, 0);
      gantryGroup.add(rStack);

      scene.add(gantryGroup);

    } else if (pId === 'moon') {
      // Apollo 11 Lunar Module (Eagle)
      const lmGroup = new THREE.Group();
      lmGroup.position.set(0, 0, 0);

      // Gold Descent Stage
      const descentStage = new THREE.Mesh(
        new THREE.CylinderGeometry(4.5, 5.5, 4.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 })
      );
      descentStage.position.y = 3.5;
      lmGroup.add(descentStage);

      // Silver Ascent Stage Cabin
      const ascentStage = new THREE.Mesh(
        new THREE.BoxGeometry(5.0, 4.5, 4.8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
      );
      ascentStage.position.y = 7.5;
      lmGroup.add(ascentStage);

      scene.add(lmGroup);

    } else if (pId === 'mars') {
      // NASA Perseverance Rover & Ingenuity Helicopter
      const roverGroup = new THREE.Group();
      roverGroup.position.set(0, 0, 0);

      const roverBody = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 3.5, 8.5),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
      );
      roverBody.position.y = 3.5;
      roverGroup.add(roverBody);

      // Ingenuity Helicopter
      const heli = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8 })
      );
      heli.position.set(16, 2, 8);
      roverGroup.add(heli);

      scene.add(roverGroup);

    } else if (pId === 'europa') {
      // Giant 3D Banded Jupiter in the sky!
      const jupGeo = new THREE.SphereGeometry(65, 36, 36);
      const jupMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.6,
        emissive: 0x78350f,
        emissiveIntensity: 0.3
      });
      const jupMesh = new THREE.Mesh(jupGeo, jupMat);
      jupMesh.position.set(-180, 110, -320);
      scene.add(jupMesh);

      this.animatedObjects.push({
        update: (time) => { jupMesh.rotation.y = time * 0.03; }
      });

    } else if (pId === 'titan') {
      // 3D Saturn with Ring System in golden haze
      const satGeo = new THREE.SphereGeometry(45, 32, 32);
      const satMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.position.set(140, 90, -300);

      const ringGeo = new THREE.RingGeometry(55, 95, 48);
      ringGeo.rotateX(Math.PI / 2.4);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xd97706, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      satMesh.add(ringMesh);
      scene.add(satMesh);
    }
  }

  // High-Quality Multi-Layered 2D Canvas 3D Perspective Fallback
  buildCanvasFallback(w, h) {
    const ctx = this.canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    const renderFallback = () => {
      if (!this.isOpen) return;
      frame++;
      ctx.clearRect(0, 0, w, h);
      this.drawCanvasPerspectiveScene(ctx, w, h, frame);
      this.animId = requestAnimationFrame(renderFallback);
    };
    renderFallback();
  }

  drawCanvasPerspectiveScene(ctx, w, h, frame) {
    const pId = this.planetId;
    const cx = w / 2;
    const cy = h * 0.52 + this.phi * 40;

    // Sky Dome
    const skyGrad = ctx.createLinearGradient(0, 0, 0, cy);
    if (pId === 'moon_south') {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.8, '#080c1a');
      skyGrad.addColorStop(1, '#0e2439');
    } else if (pId === 'mars') {
      skyGrad.addColorStop(0, '#7c2d12');
      skyGrad.addColorStop(0.8, '#c2410c');
      skyGrad.addColorStop(1, '#fed7aa');
    } else {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(1, '#bae6fd');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, cy + 20);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      const sx = (i * 91 + this.theta * 200) % w;
      const sy = (i * 47) % (cy - 10);
      ctx.fillRect(sx < 0 ? sx + w : sx, sy, 1.5, 1.5);
    }

    // Moon South Pole Blue Earth in the sky
    if (pId === 'moon_south') {
      const earthX = cx + Math.sin(this.theta) * 160;
      const earthY = cy - 65;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(earthX, earthY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(earthX - 4, earthY - 3, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Terrain Surface
    const terrainGrad = ctx.createLinearGradient(0, cy, 0, h);
    terrainGrad.addColorStop(0, pId === 'moon_south' ? '#334155' : (pId === 'mars' ? '#9a3412' : '#1e293b'));
    terrainGrad.addColorStop(1, '#020617');
    ctx.fillStyle = terrainGrad;

    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.bezierCurveTo(w * 0.25, cy - 18, w * 0.75, cy + 22, w, cy);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Central NASA Spacecraft / Artemis Lander Silhouette
    ctx.save();
    ctx.translate(cx, cy - 2);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-14, -75, 28, 75, 5);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-14, -75);
    ctx.lineTo(0, -95);
    ctx.lineTo(14, -75);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

window.RealisticPlanetaryEnvironment = RealisticPlanetaryEnvironment;
