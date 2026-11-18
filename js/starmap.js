// Project Horizons: Space Mission Design Game - Tactical Star Map & Trajectory Visualizer
// Seamlessly integrates:
// 1. Free Fire-Style Tactical Drop Zone
// 2. 4-Pillars Orbital Trajectory Design (Pic 2: Concept, Trajectory, Timeline, 3D Visualization)
// 3. Solar System Collectibles System (Pic 1: Planetary Cards & Facts)

class StarMapOverlay {
  constructor(game) {
    this.game = game;
    this.selectedPlanetId = 'earth';
    this.activeTab = 'drop'; // 'drop', 'trajectory', 'collectibles'
    this.previewAngle = 0;
    this.trajectoryProgress = 0; // 0 to 1 along transfer orbit
    this.trajectoryPlaying = true;

    // Canvases
    this.previewCanvas = null;
    this.previewCtx = null;
    this.trajectoryCanvas = null;
    this.trajectoryCtx = null;

    this.animFrameId = null;
    this.isOpen = false;
  }

  init() {
    this.previewCanvas = document.getElementById('starmap-planet-canvas');
    if (this.previewCanvas) this.previewCtx = this.previewCanvas.getContext('2d');

    this.trajectoryCanvas = document.getElementById('trajectory-orbit-canvas');
    if (this.trajectoryCanvas) this.trajectoryCtx = this.trajectoryCanvas.getContext('2d');

    this.bindEvents();
    this.renderCollectiblesCards();
  }

  bindEvents() {
    // Mode Switcher Tabs (Tactical Drop vs Trajectory Design vs Collectibles)
    const tabBtns = document.querySelectorAll('.starmap-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Planet Node Click Handlers (Tactical Drop)
    const nodes = document.querySelectorAll('.starmap-node');
    nodes.forEach(node => {
      node.addEventListener('click', () => {
        const planetId = node.getAttribute('data-planet');
        this.selectPlanet(planetId);
      });
    });

    // Trajectory Target Selector dropdown
    const trajSelect = document.getElementById('trajectory-target-select');
    if (trajSelect) {
      trajSelect.addEventListener('change', (e) => {
        this.selectPlanet(e.target.value);
      });
    }

    // Trajectory Play / Pause Button
    const trajPlayBtn = document.getElementById('trajectory-play-btn');
    if (trajPlayBtn) {
      trajPlayBtn.addEventListener('click', () => {
        this.trajectoryPlaying = !this.trajectoryPlaying;
        trajPlayBtn.textContent = this.trajectoryPlaying ? 'PAUSE TRAJECTORY' : 'PLAY TRAJECTORY';
      });
    }

    // Tactical Drop Button
    const dropBtn = document.getElementById('starmap-drop-btn');
    if (dropBtn) {
      dropBtn.addEventListener('click', () => {
        this.executeTacticalDrop();
      });
    }

    // Trajectory Launch Button
    const trajDropBtn = document.getElementById('trajectory-launch-btn');
    if (trajDropBtn) {
      trajDropBtn.addEventListener('click', () => {
        this.executeTacticalDrop();
      });
    }

    // Close Star Map button
    const closeBtn = document.getElementById('starmap-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }
  }

  switchTab(tab) {
    this.activeTab = tab;

    // Update Tab Buttons UI
    document.querySelectorAll('.starmap-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-400');
        btn.classList.remove('text-slate-400', 'border-transparent');
      } else {
        btn.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-400');
        btn.classList.add('text-slate-400', 'border-transparent');
      }
    });

    // Toggle Content Views
    const viewDrop = document.getElementById('starmap-view-drop');
    const viewTraj = document.getElementById('starmap-view-trajectory');
    const viewColl = document.getElementById('starmap-view-collectibles');

    if (viewDrop) viewDrop.classList.toggle('hidden', tab !== 'drop');
    if (viewTraj) viewTraj.classList.toggle('hidden', tab !== 'trajectory');
    if (viewColl) viewColl.classList.toggle('hidden', tab !== 'collectibles');

    if (window.soundEngine) window.soundEngine.playTargetLock();

    // Trigger canvas resize/render
    if (tab === 'trajectory') {
      this.resizeTrajectoryCanvas();
      this.updateTrajectoryDesignPanels();
    }
  }

  resizeTrajectoryCanvas() {
    if (!this.trajectoryCanvas) return;
    const parent = this.trajectoryCanvas.parentElement;
    if (parent) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.trajectoryCanvas.width = parent.clientWidth * dpr;
      this.trajectoryCanvas.height = Math.max(340, parent.clientHeight) * dpr;
      this.trajectoryCanvas.style.width = `${parent.clientWidth}px`;
      this.trajectoryCanvas.style.height = `${Math.max(340, parent.clientHeight)}px`;
      this.trajectoryCtx.resetTransform();
      this.trajectoryCtx.scale(dpr, dpr);
    }
  }

  open(defaultPlanetId = null) {
    this.isOpen = true;
    const modal = document.getElementById('starmap-modal');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }

    if (window.soundEngine) {
      window.soundEngine.playRadarPing();
    }

    const targetId = defaultPlanetId || this.game.currentPlanetId;
    this.selectPlanet(targetId);
    this.startAnimationLoop();
    this.updateNodesStatus();
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('starmap-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (this.game && this.game.setActiveNav) {
      this.game.setActiveNav(null);
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  selectPlanet(planetId) {
    const planet = PLANETARY_DESTINATIONS[planetId];
    if (!planet) return;

    this.selectedPlanetId = planetId;
    this.trajectoryProgress = 0; // reset flight path

    if (window.soundEngine) {
      window.soundEngine.playTargetLock();
    }

    // Highlight active node in tactical drop view
    document.querySelectorAll('.starmap-node').forEach(node => {
      if (node.getAttribute('data-planet') === planetId) {
        node.classList.add('tactical-glass-active');
        node.classList.remove('opacity-60');
      } else {
        node.classList.remove('tactical-glass-active');
        node.classList.add('opacity-60');
      }
    });

    // Update Dropdown in trajectory view
    const trajSelect = document.getElementById('trajectory-target-select');
    if (trajSelect) trajSelect.value = planetId;

    // Update Telemetry Cards
    this.updateTelemetryCard(planet);
    this.updateTrajectoryDesignPanels();
  }

  updateNodesStatus() {
    const unlocked = this.game.storage.data.unlockedPlanets || ['earth'];
    document.querySelectorAll('.starmap-node').forEach(node => {
      const pId = node.getAttribute('data-planet');
      const lockIcon = node.querySelector('.node-lock-status');
      const isUnlocked = unlocked.includes(pId);

      if (isUnlocked) {
        node.classList.remove('pointer-events-none', 'grayscale');
        if (lockIcon) lockIcon.innerHTML = `<span class="text-xs text-emerald-400 font-bold">READY</span>`;
      } else {
        node.classList.add('pointer-events-none', 'grayscale');
        if (lockIcon) lockIcon.innerHTML = `<span class="text-xs text-slate-500 font-bold">LOCKED</span>`;
      }
    });
  }

  updateTelemetryCard(planet) {
    const titleEl = document.getElementById('telemetry-planet-title');
    const progEl = document.getElementById('telemetry-program');
    const gravEl = document.getElementById('telemetry-gravity');
    const atmEl = document.getElementById('telemetry-atmosphere');
    const tempEl = document.getElementById('telemetry-temp');
    const distEl = document.getElementById('telemetry-distance');
    const dirEl = document.getElementById('telemetry-directive');
    const dropBtn = document.getElementById('starmap-drop-btn');

    if (titleEl) titleEl.textContent = planet.name;
    if (progEl) progEl.textContent = `${planet.historicalProgram} (${planet.historicalYear})`;
    if (gravEl) gravEl.textContent = `${planet.gravity} m/s² (${(planet.gravity / 9.8).toFixed(2)}g)`;
    if (atmEl) atmEl.textContent = planet.atmosphere;
    if (tempEl) tempEl.textContent = planet.surfaceTemp;
    if (distEl) distEl.textContent = planet.distanceFromSun;
    if (dirEl) dirEl.textContent = planet.missionBrief.directive;

    const isUnlocked = (this.game.storage.data.unlockedPlanets || ['earth']).includes(planet.id);
    const isCurrent = this.game.currentPlanetId === planet.id;

    if (dropBtn) {
      if (!isUnlocked) {
        dropBtn.disabled = true;
        dropBtn.textContent = 'RESTRICTED // CLEAR PRIOR OBJECTIVES';
        dropBtn.className = 'w-full py-3.5 px-6 rounded-xl font-orbitron font-bold text-sm tracking-wider bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed';
      } else if (isCurrent) {
        dropBtn.disabled = false;
        dropBtn.textContent = 'RE-ENTER PLANETARY DROP ZONE';
        dropBtn.className = 'w-full py-3.5 px-6 rounded-xl font-orbitron font-bold text-sm tracking-wider text-white btn-tactical-drop cursor-pointer';
      } else {
        dropBtn.disabled = false;
        dropBtn.textContent = 'INITIATE TACTICAL DROP // COMMENCE DESCENT';
        dropBtn.className = 'w-full py-3.5 px-6 rounded-xl font-orbitron font-bold text-sm tracking-wider text-white btn-tactical-drop cursor-pointer animate-pulse-glow';
      }
    }
  }

  // Update The 4-Pillars panels (Pic 2 Specification)
  updateTrajectoryDesignPanels() {
    const planet = PLANETARY_DESTINATIONS[this.selectedPlanetId];
    if (!planet || !planet.missionDesign) return;

    const md = planet.missionDesign;

    // Pillar 1: Mission Concept
    const conceptTitle = document.getElementById('td-concept-title');
    const conceptObj = document.getElementById('td-concept-obj');
    const conceptPayload = document.getElementById('td-concept-payload');
    const conceptOrbit = document.getElementById('td-concept-orbit');

    if (conceptTitle) conceptTitle.textContent = md.concept.title;
    if (conceptObj) conceptObj.textContent = md.concept.objective;
    if (conceptPayload) conceptPayload.textContent = md.concept.payload;
    if (conceptOrbit) conceptOrbit.textContent = md.concept.targetOrbit;

    // Pillar 2: Orbital Trajectories
    const trajType = document.getElementById('td-traj-type');
    const trajDeltaV = document.getElementById('td-traj-deltav');
    const trajBurn = document.getElementById('td-traj-burn');
    const trajTransit = document.getElementById('td-traj-transit');

    if (trajType) trajType.textContent = md.trajectory.type;
    if (trajDeltaV) trajDeltaV.textContent = md.trajectory.deltaVRequired;
    if (trajBurn) trajBurn.textContent = md.trajectory.burnDuration || md.trajectory.orbitalVelocity;
    if (trajTransit) trajTransit.textContent = md.trajectory.transitTime || 'N/A (Direct Insertion)';

    // Pillar 3: Mission Timeline Milestones
    const timelineContainer = document.getElementById('td-timeline-list');
    if (timelineContainer) {
      timelineContainer.innerHTML = '';
      md.timeline.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'p-2 rounded bg-slate-900/70 border border-slate-800 flex items-start gap-2.5 text-xs';
        row.innerHTML = `
          <div class="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center font-bold text-[10px] text-cyan-300 flex-shrink-0 mt-0.5">
            ${idx + 1}
          </div>
          <div class="flex-1 min-w-0">
            <span class="font-mono text-[10px] text-cyan-400 font-bold block">${item.time}</span>
            <span class="text-slate-200 text-xs">${item.event}</span>
          </div>
        `;
        timelineContainer.appendChild(row);
      });
    }
  }

  executeTacticalDrop() {
    const targetPlanetId = this.selectedPlanetId;
    const isUnlocked = (this.game.storage.data.unlockedPlanets || ['earth']).includes(targetPlanetId);
    if (!isUnlocked) return;

    this.close();
    this.game.startLandingSequence(targetPlanetId);
  }

  // Collectibles Cards Grid (Pic 1 Inspired)
  renderCollectiblesCards() {
    const grid = document.getElementById('collectibles-grid-container');
    if (!grid) return;

    grid.innerHTML = '';

    SOLAR_SYSTEM_COLLECTIBLES.forEach(c => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl tactical-glass cursor-pointer hover:border-cyan-400 transition-all duration-200 group flex flex-col justify-between';
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-orbitron font-bold text-cyan-400 uppercase tracking-wider">${c.type}</span>
            <span class="text-[10px] font-mono text-slate-400">${c.distanceAU}</span>
          </div>
          <div class="flex items-center gap-3 my-2">
            <div class="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center border border-slate-700 shadow-md" style="background: radial-gradient(circle, ${c.color} 30%, #020617 90%)"></div>
            <div>
              <h4 class="font-orbitron font-extrabold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">${c.name}</h4>
              <p class="text-xs text-slate-400 mt-0.5">Diameter: ${c.diameterKm}</p>
            </div>
          </div>
          <div class="mt-2 text-[11px] text-slate-300 leading-relaxed line-clamp-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
            ${c.funFact}
          </div>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>NASA: ${c.nasaMissions.split(',')[0]}</span>
          <span class="text-cyan-400 font-bold">INSPECT CARD →</span>
        </div>
      `;

      card.addEventListener('click', () => {
        this.openCollectibleDetails(c);
      });

      grid.appendChild(card);
    });
  }

  openCollectibleDetails(c) {
    const titleEl = document.getElementById('card-modal-title');
    const typeEl = document.getElementById('card-modal-type');
    const distEl = document.getElementById('card-modal-dist');
    const diamEl = document.getElementById('card-modal-diam');
    const massEl = document.getElementById('card-modal-mass');
    const tempEl = document.getElementById('card-modal-temp');
    const missionsEl = document.getElementById('card-modal-missions');
    const factEl = document.getElementById('card-modal-fact');
    const sphereEl = document.getElementById('card-modal-sphere');

    if (titleEl) titleEl.textContent = c.name;
    if (typeEl) typeEl.textContent = c.type;
    if (distEl) distEl.textContent = c.distanceAU;
    if (diamEl) diamEl.textContent = c.diameterKm;
    if (massEl) massEl.textContent = c.mass;
    if (tempEl) tempEl.textContent = c.surfaceTemp;
    if (missionsEl) missionsEl.textContent = c.nasaMissions;
    if (factEl) factEl.textContent = c.funFact;
    if (sphereEl) {
      sphereEl.style.background = `radial-gradient(circle, ${c.color} 40%, #030712 95%)`;
      sphereEl.style.boxShadow = `0 0 35px ${c.glowColor}`;
    }

    const modal = document.getElementById('collectible-card-modal');
    if (modal) modal.classList.add('open');
  }

  startAnimationLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const render = () => {
      if (!this.isOpen) return;
      this.previewAngle += 0.015;

      if (this.activeTab === 'drop') {
        this.drawPlanetSpherePreview();
      } else if (this.activeTab === 'trajectory') {
        if (this.trajectoryPlaying) {
          this.trajectoryProgress = (this.trajectoryProgress + 0.0035) % 1.0;
        }
        this.drawOrbitalTrajectoryVisualizer();
      }

      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  // 3D Sphere Rotating Preview
  drawPlanetSpherePreview() {
    if (!this.previewCtx || !this.previewCanvas) return;
    const ctx = this.previewCtx;
    const w = this.previewCanvas.width;
    const h = this.previewCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.36;

    ctx.clearRect(0, 0, w, h);

    // Tactical Target Reticle
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 9, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.moveTo(cx - r - 16, cy); ctx.lineTo(cx - r - 4, cy);
    ctx.moveTo(cx + r + 4, cy); ctx.lineTo(cx + r + 16, cy);
    ctx.moveTo(cx, cy - r - 16); ctx.lineTo(cx, cy - r - 4);
    ctx.moveTo(cx, cy + r + 4); ctx.lineTo(cx, cy + r + 16);
    ctx.stroke();

    // Atmosphere Glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.3);
    const pId = this.selectedPlanetId;

    if (pId === 'earth') {
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (pId === 'moon_south') {
      glow.addColorStop(0, 'rgba(0, 229, 255, 0.65)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (pId === 'moon') {
      glow.addColorStop(0, 'rgba(148, 163, 184, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (pId === 'mars') {
      glow.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (pId === 'europa') {
      glow.addColorStop(0, 'rgba(6, 182, 212, 0.5)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (pId === 'titan') {
      glow.addColorStop(0, 'rgba(245, 158, 11, 0.55)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Clip to Planet Disk
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Base Planet Color
    if (pId === 'earth') ctx.fillStyle = '#0284c7';
    else if (pId === 'moon_south') ctx.fillStyle = '#334155';
    else if (pId === 'moon') ctx.fillStyle = '#475569';
    else if (pId === 'mars') ctx.fillStyle = '#c2410c';
    else if (pId === 'europa') ctx.fillStyle = '#38bdf8';
    else if (pId === 'titan') ctx.fillStyle = '#d97706';
    ctx.fill();

    // Rotating Features
    const rot = this.previewAngle;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';

    for (let i = 0; i < 4; i++) {
      const offsetX = ((i * 55 + rot * 40) % (r * 2.8)) - r * 1.4;
      const py = cy + (i - 1.5) * 26;

      ctx.beginPath();
      if (pId === 'earth') {
        ctx.fillStyle = '#22c55e';
        ctx.ellipse(cx + offsetX, py, 32, 18, 0.2, 0, Math.PI * 2);
      } else if (pId === 'moon_south') {
        ctx.fillStyle = '#0f172a';
        ctx.arc(cx + offsetX, py, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00e5ff';
        ctx.arc(cx + offsetX, py, 4, 0, Math.PI * 2);
      } else if (pId === 'moon') {
        ctx.fillStyle = '#334155';
        ctx.arc(cx + offsetX, py, 12, 0, Math.PI * 2);
      } else if (pId === 'mars') {
        ctx.fillStyle = '#7c2d12';
        ctx.ellipse(cx + offsetX, py, 28, 14, -0.15, 0, Math.PI * 2);
      } else if (pId === 'europa') {
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + offsetX - 20, py - 10);
        ctx.lineTo(cx + offsetX + 20, py + 10);
        ctx.stroke();
      } else if (pId === 'titan') {
        ctx.fillStyle = '#92400e';
        ctx.ellipse(cx + offsetX, py, 34, 16, 0.1, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // 3D Spherical Shadow Shading
    const shadowGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.2, cx, cy, r);
    shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    ctx.fillStyle = shadowGrad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    ctx.restore();
  }

  // Draw Interactive Solar System & Trajectory Transfer (Pic 1 & Pic 2 Integrated!)
  drawOrbitalTrajectoryVisualizer() {
    if (!this.trajectoryCtx || !this.trajectoryCanvas) return;
    const ctx = this.trajectoryCtx;
    const w = this.trajectoryCanvas.width / (window.devicePixelRatio || 1);
    const h = this.trajectoryCanvas.height / (window.devicePixelRatio || 1);
    const cx = w * 0.42;
    const cy = h * 0.52;

    ctx.clearRect(0, 0, w, h);

    // Deep Space Background Starfield
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % w;
      const sy = (i * 63) % h;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // 1. The Sun (Central Star)
    const sunGlow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 28);
    sunGlow.addColorStop(0, '#facc15');
    sunGlow.addColorStop(0.4, '#f59e0b');
    sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // 2. Concentric Planetary Orbits
    const orbits = [
      { name: 'Mercury', r: 38, color: '#a3a3a3' },
      { name: 'Venus', r: 58, color: '#facc15' },
      { name: 'Earth', r: 85, color: '#0284c7' },
      { name: 'Mars', r: 118, color: '#ea580c' },
      { name: 'Asteroid Belt', r: 145, color: '#71717a', isBelt: true },
      { name: 'Jupiter', r: 185, color: '#ca8a04' },
      { name: 'Saturn', r: 235, color: '#facc15' }
    ];

    orbits.forEach(orb => {
      ctx.save();
      ctx.strokeStyle = orb.isBelt ? 'rgba(113, 113, 122, 0.25)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = orb.isBelt ? 8 : 1;
      if (!orb.isBelt) ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.ellipse(cx, cy, orb.r * 1.15, orb.r * 0.72, -0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // 3. Earth Starting Position
    const earthOrbitX = cx + 85 * 1.15 * Math.cos(-0.15);
    const earthOrbitY = cy + 85 * 0.72 * Math.sin(-0.15);

    ctx.fillStyle = '#0284c7';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(earthOrbitX, earthOrbitY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px Orbitron, monospace';
    ctx.fillText('EARTH [DEPARTURE]', earthOrbitX + 8, earthOrbitY + 3);

    // 4. Target Body Position
    let targetX = earthOrbitX;
    let targetY = earthOrbitY;
    const pId = this.selectedPlanetId;

    if (pId === 'moon_south') {
      targetX = earthOrbitX + 28;
      targetY = earthOrbitY - 22;
    } else if (pId === 'moon') {
      targetX = earthOrbitX + 24;
      targetY = earthOrbitY - 18;
    } else if (pId === 'mars') {
      targetX = cx - 118 * 1.15 * 0.8;
      targetY = cy - 118 * 0.72 * 0.9;
    } else if (pId === 'europa') {
      targetX = cx - 185 * 1.15 * 0.6;
      targetY = cy + 185 * 0.72 * 0.7;
    } else if (pId === 'titan') {
      targetX = cx + 235 * 1.15 * 0.4;
      targetY = cy - 235 * 0.72 * 0.85;
    }

    if (pId !== 'earth') {
      // Draw Target Planet Dot
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#fb923c';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px Orbitron, monospace';
      ctx.fillText(`${PLANETARY_DESTINATIONS[pId].bodyName.toUpperCase()} [ARRIVAL]`, targetX + 10, targetY + 3);

      // 5. Transfer Trajectory Arc (Hohmann / Gravity Assist Transfer Curve)
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);

      ctx.beginPath();
      ctx.moveTo(earthOrbitX, earthOrbitY);
      // Quadratic or Bezier control point depending on target
      const ctrlX = (earthOrbitX + targetX) / 2 + (pId === 'europa' || pId === 'titan' ? -60 : 30);
      const ctrlY = Math.min(earthOrbitY, targetY) - 50;
      ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
      ctx.stroke();
      ctx.restore();

      // 6. Spacecraft Travelling Along Trajectory Curve
      const t = this.trajectoryProgress;
      const shipX = (1 - t) * (1 - t) * earthOrbitX + 2 * (1 - t) * t * ctrlX + t * t * targetX;
      const shipY = (1 - t) * (1 - t) * earthOrbitY + 2 * (1 - t) * t * ctrlY + t * t * targetY;

      // Draw Spacecraft Sprite
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(shipX, shipY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Solar Panels
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(shipX - 8, shipY - 1.5, 5, 3);
      ctx.fillRect(shipX + 3, shipY - 1.5, 5, 3);

      // Trajectory Flight Progress Label
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(`SPACECRAFT T+${Math.round(t * 100)}%`, shipX - 25, shipY - 8);
    }
  }
}