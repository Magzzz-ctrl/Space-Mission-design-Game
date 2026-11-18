// Project Horizons: NASA Odyssey - Planetary Environments, Landmarks & Rocket

class World {
  constructor(planetData) {
    this.planetData = planetData;
    this.worldWidth = 3200;
    this.groundBaseY = 520;
    this.footprints = [];
    this.equipmentPieces = [];
    this.geyserTimer = 0;
    this.methaneRain = [];

    // Rocket State
    this.rocket = {
      x: 950,
      y: 0,
      width: 60,
      height: 140,
      state: 'DISABLED', // 'DISABLED', 'READY', 'LAUNCHING'
      launchAltitude: 0,
      launchSpeed: 0,
      repairedPartsCount: 0,
      beaconTimer: 0
    };
    this.rocketShieldActive = false;

    this.initMethaneRain();
    this.loadPlanet(planetData);
  }

  loadPlanet(planetData) {
    this.planetData = planetData;
    this.footprints = [];
    this.rocketShieldActive = false;
    this.rocket.state = 'DISABLED';
    this.rocket.launchAltitude = 0;
    this.rocket.launchSpeed = 0;
    this.rocket.repairedPartsCount = 0;
    this.rocket.y = this.getGroundY(this.rocket.x);

    // Deep clone parts so we can mutate `found` state
    this.equipmentPieces = planetData.parts.map(p => {
      const px = p.xRatio * this.worldWidth;
      const py = this.getGroundY(px) + p.yOffset;
      return {
        ...p,
        x: px,
        y: py,
        found: false,
        pulseAngle: Math.random() * Math.PI * 2
      };
    });

    // Parked Rover Vehicle (Pic 1 Lunar Rover Game inspired)
    if (planetData.id === 'moon_south') {
      this.rover = { x: 1380, y: this.getGroundY(1380), parked: true, type: 'VIPER_ROVER', name: 'NASA VIPER Polar Ice Rover' };
    } else if (planetData.id === 'moon') {
      this.rover = { x: 1380, y: this.getGroundY(1380), parked: true, type: 'LUNAR_ROVER', name: 'Apollo Lunar Roving Vehicle (LRV)' };
    } else if (planetData.id === 'mars') {
      this.rover = { x: 1420, y: this.getGroundY(1420), parked: true, type: 'MARS_ROVER', name: 'Perseverance Robotic Rover' };
    } else {
      this.rover = null;
    }
  }

  initMethaneRain() {
    this.methaneRain = [];
    for (let i = 0; i < 40; i++) {
      this.methaneRain.push({
        x: Math.random() * 1200,
        y: Math.random() * 800,
        speed: 2 + Math.random() * 3,
        length: 8 + Math.random() * 10
      });
    }
  }

  getGroundY(worldX) {
    return calculateTerrainHeight(worldX, this.worldWidth, this.planetData.id, this.groundBaseY);
  }

  addFootprint(x, y, facing) {
    this.footprints.push({
      x: x,
      y: y,
      facing: facing,
      alpha: 0.65
    });
    // Keep max 50 footprints to optimize canvas rendering
    if (this.footprints.length > 50) {
      this.footprints.shift();
    }
  }

  update(particleSystem) {
    // 1. Footprint fade
    for (let i = this.footprints.length - 1; i >= 0; i--) {
      this.footprints[i].alpha -= 0.0008;
      if (this.footprints[i].alpha <= 0) {
        this.footprints.splice(i, 1);
      }
    }

    // 2. Equipment piece pulse
    this.equipmentPieces.forEach(item => {
      if (!item.found) {
        item.pulseAngle += 0.05;
      }
    });

    // 3. Rocket beacon timer
    this.rocket.beaconTimer += 0.06;

    // 4. Cryogeyser active on Europa
    if (this.planetData.id === 'europa') {
      this.geyserTimer++;
      if (this.geyserTimer > 180) { // burst every ~3 seconds
        const geyserX = 2200;
        const geyserY = this.getGroundY(geyserX);
        particleSystem.emit('thruster', geyserX, geyserY, {
          count: 5,
          spreadX: 8,
          spreadY: 2,
          vx: (Math.random() * 2 - 1) * 1.5,
          vy: -10 - Math.random() * 6,
          color: '#e0f2fe',
          size: 4,
          gravity: 0.08
        });
        if (this.geyserTimer > 230) {
          this.geyserTimer = 0;
        }
      }
    }

    // 5. Methane rain on Titan
    if (this.planetData.id === 'titan') {
      this.methaneRain.forEach(drop => {
        drop.y += drop.speed;
        drop.x -= 0.5; // gentle wind
        if (drop.y > 700) {
          drop.y = -20;
          drop.x = Math.random() * 1200;
        }
      });
    }

    // 6. Rocket Launch Animation
    if (this.rocket.state === 'LAUNCHING') {
      this.rocket.launchSpeed += 0.18;
      this.rocket.launchAltitude += this.rocket.launchSpeed;

      // Heavy liftoff fire & smoke
      const engineX = this.rocket.x;
      const engineY = this.rocket.y - this.rocket.launchAltitude;

      particleSystem.emit('rocket_fire', engineX, engineY, {
        count: 4,
        spreadX: 14,
        spreadY: 4,
        vx: (Math.random() * 2 - 1) * 3,
        vy: 8 + Math.random() * 6,
        color: Math.random() > 0.4 ? '#f97316' : '#facc15',
        size: 8,
        gravity: 0.1
      });

      particleSystem.emit('smoke', engineX, engineY, {
        count: 5,
        spreadX: 20,
        spreadY: 6,
        vx: (Math.random() * 2 - 1) * 5,
        vy: 2 + Math.random() * 3,
        color: 'rgba(203, 213, 225, 0.4)',
        size: 16,
        gravity: -0.02
      });
    }
  }

  renderBackground(ctx, cameraOffsetX, cameraOffsetY) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth || Math.round(ctx.canvas.width / dpr);
    const h = window.innerHeight || Math.round(ctx.canvas.height / dpr);
    const pId = this.planetData.id;

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, this.planetData.skyColors.top);
    skyGrad.addColorStop(1, this.planetData.skyColors.bottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Parallax Celestial Objects & Stars
    ctx.save();

    if (pId === 'moon' || pId === 'europa') {
      // Brilliant Starfield in vacuum
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 75; i++) {
        const sx = ((i * 137.5) - cameraOffsetX * 0.05) % w;
        const sy = (i * 93.3) % (h * 0.65);
        const starX = sx < 0 ? sx + w : sx;
        const starSize = (i % 3 === 0) ? 2 : 1;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.003 + i);
        ctx.fillRect(starX, sy, starSize, starSize);
      }
      ctx.globalAlpha = 1.0;
    }

    // Specific Celestial Body in Sky
    if (pId === 'earth') {
      // Cumulus Clouds over Florida Atlantic Coast
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 320) - cameraOffsetX * 0.15) % (w + 400) - 200;
        ctx.beginPath();
        ctx.arc(cx, 120 + i * 20, 50, 0, Math.PI * 2);
        ctx.arc(cx + 40, 110 + i * 20, 65, 0, Math.PI * 2);
        ctx.arc(cx + 80, 125 + i * 20, 45, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pId === 'moon_south') {
      // Lunar South Pole: Low-angle polar Earth hovering right along the crater horizon
      const earthScreenX = 460 - cameraOffsetX * 0.03;
      const earthScreenY = 220; // Low on horizon as seen from 80°S latitude!
      
      // Low Grazing Solar Beam (Peaks of Eternal Light)
      ctx.save();
      const beamGrad = ctx.createLinearGradient(0, 0, w, 280);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      beamGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.06)');
      beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 240);
      ctx.lineTo(w, 320);
      ctx.lineTo(0, 80);
      ctx.fill();
      ctx.restore();

      // Earth Low on Horizon
      const glow = ctx.createRadialGradient(earthScreenX, earthScreenY, 28, earthScreenX, earthScreenY, 55);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
      glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(earthScreenX, earthScreenY, 55, 0, Math.PI * 2);
      ctx.fill();

      // Earth Crescent (grazing phase)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(earthScreenX, earthScreenY, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(earthScreenX - 6, earthScreenY - 4, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(earthScreenX, earthScreenY - 10, 20, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pId === 'moon') {
      // The Blue Marble (Earth) hanging in the black lunar sky
      const earthScreenX = 480 - cameraOffsetX * 0.03;
      const earthScreenY = 130;
      
      // Earth Atmosphere Glow
      const glow = ctx.createRadialGradient(earthScreenX, earthScreenY, 35, earthScreenX, earthScreenY, 60);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(earthScreenX, earthScreenY, 60, 0, Math.PI * 2);
      ctx.fill();

      // Earth Disk
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(earthScreenX, earthScreenY, 36, 0, Math.PI * 2);
      ctx.fill();

      // Earth Continents (Green/Brown)
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(earthScreenX - 8, earthScreenY - 6, 16, 0, Math.PI * 2);
      ctx.arc(earthScreenX + 12, earthScreenY + 10, 14, 0, Math.PI * 2);
      ctx.fill();

      // White Swirling Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(earthScreenX - 4, earthScreenY - 14, 22, 6, -0.3, 0, Math.PI * 2);
      ctx.ellipse(earthScreenX + 8, earthScreenY + 6, 18, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (pId === 'mars') {
      // Distant Martian Moons (Phobos & Deimos) + Dust Haze
      const phobosX = 280 - cameraOffsetX * 0.04;
      ctx.fillStyle = '#d4d4d8';
      ctx.beginPath();
      ctx.arc(phobosX, 100, 5, 0, Math.PI * 2);
      ctx.fill();

      const deimosX = 580 - cameraOffsetX * 0.03;
      ctx.fillStyle = '#a1a1aa';
      ctx.beginPath();
      ctx.arc(deimosX, 70, 3, 0, Math.PI * 2);
      ctx.fill();

      // Distant Red Mountain Silhouettes (Jezero Delta rim)
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      for (let x = 0; x <= w; x += 60) {
        const mx = x + cameraOffsetX * 0.2;
        const my = h * 0.52 + Math.sin(mx * 0.005) * 45 + Math.cos(mx * 0.012) * 25;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
    } else if (pId === 'europa') {
      // Colossal Jupiter Looming in the Sky
      const jupX = 520 - cameraOffsetX * 0.02;
      const jupY = 160;
      const jupRadius = 110;

      // Outer Glow
      const jupGlow = ctx.createRadialGradient(jupX, jupY, jupRadius * 0.9, jupX, jupY, jupRadius * 1.3);
      jupGlow.addColorStop(0, 'rgba(234, 179, 8, 0.25)');
      jupGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = jupGlow;
      ctx.beginPath();
      ctx.arc(jupX, jupY, jupRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Jupiter Sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(jupX, jupY, jupRadius, 0, Math.PI * 2);
      ctx.clip();

      // Base Amber Gas
      ctx.fillStyle = '#eab308';
      ctx.fillRect(jupX - jupRadius, jupY - jupRadius, jupRadius * 2, jupRadius * 2);

      // Atmospheric Bands
      const bands = [
        { y: -80, h: 22, color: '#ca8a04' },
        { y: -50, h: 28, color: '#92400e' },
        { y: -15, h: 24, color: '#d97706' },
        { y: 15, h: 32, color: '#78350f' },
        { y: 55, h: 26, color: '#a16207' },
        { y: 85, h: 20, color: '#713f12' }
      ];
      bands.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(jupX - jupRadius, jupY + b.y, jupRadius * 2, b.h);
      });

      // Great Red Spot
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(jupX + 35, jupY + 30, 24, 15, -0.08, 0, Math.PI * 2);
      ctx.fill();

      // Jovian Aurora Crown on North Pole
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(jupX, jupY - jupRadius + 8, 30, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    } else if (pId === 'titan') {
      // Ringed Saturn emerging through thick gold haze
      const satX = 480 - cameraOffsetX * 0.02;
      const satY = 140;

      // Faint Golden Silhouette
      ctx.save();
      ctx.globalAlpha = 0.45;
      
      // Saturn Rings
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.ellipse(satX, satY, 130, 28, -0.28, 0, Math.PI * 2);
      ctx.stroke();

      // Saturn Planet Body
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(satX, satY, 52, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Methane Rain streaks
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.2;
      this.methaneRain.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.length);
        ctx.stroke();
      });
    }

    ctx.restore();
  }

  renderForeground(ctx, cameraOffsetX, cameraOffsetY) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth || Math.round(ctx.canvas.width / dpr);
    const h = window.innerHeight || Math.round(ctx.canvas.height / dpr);
    const pId = this.planetData.id;

    ctx.save();

    // 1. Footprints
    this.footprints.forEach(fp => {
      const sx = fp.x - cameraOffsetX;
      const sy = fp.y - cameraOffsetY;
      if (sx > -20 && sx < w + 20) {
        ctx.fillStyle = `rgba(0, 0, 0, ${fp.alpha * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 5, 2.5, fp.facing === 1 ? 0.2 : -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 2. Continuous Planetary Terrain
    ctx.beginPath();
    ctx.moveTo(-10, h + 10);

    const step = 20;
    const startX = Math.floor(cameraOffsetX / step) * step - step;
    const endX = startX + w + step * 3;

    for (let x = startX; x <= endX; x += step) {
      const gy = this.getGroundY(x);
      ctx.lineTo(x - cameraOffsetX, gy - cameraOffsetY);
    }

    ctx.lineTo(w + 10, h + 10);
    ctx.closePath();

    // Terrain Gradient Fill
    const groundGrad = ctx.createLinearGradient(0, this.groundBaseY - cameraOffsetY, 0, h);
    groundGrad.addColorStop(0, this.planetData.groundColors.surface);
    groundGrad.addColorStop(0.3, this.planetData.groundColors.subsurface);
    groundGrad.addColorStop(1, '#020617');

    ctx.fillStyle = groundGrad;
    ctx.fill();

    // Glowing Terrain Crest Line
    ctx.strokeStyle = this.planetData.groundColors.line;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Historical NASA Landmarks & Terrain Props
    this.renderLandmarks(ctx, cameraOffsetX, cameraOffsetY);

    // 3.5 Parked Rover (if deployed on surface)
    if (this.rover && this.rover.parked) {
      this.renderParkedRover(ctx, cameraOffsetX, cameraOffsetY);
    }

    // 4. Interactive Rocket
    this.renderRocket(ctx, cameraOffsetX, cameraOffsetY);

    // 5. Hidden Equipment Pieces
    this.renderEquipmentPieces(ctx, cameraOffsetX, cameraOffsetY);

    // 6. Indian National Flag (Tiranga) Planted Records
    this.renderPlantedIndianFlags(ctx, cameraOffsetX, cameraOffsetY);

    // 7. Ground Impact Scorch Decals
    this.renderImpactScorches(ctx, cameraOffsetX, cameraOffsetY);

    // 8. Active Falling Asteroids & Warning Reticles
    this.renderAsteroids(ctx, cameraOffsetX, cameraOffsetY);

    // 9. Rocket Deflector Shield (Locks rocket until asteroids are escaped!)
    if (this.rocketShieldActive) {
      this.renderRocketDeflectorShield(ctx, cameraOffsetX, cameraOffsetY);
    }

    ctx.restore();
  }

  renderLandmarks(ctx, cameraOffsetX, cameraOffsetY) {
    const pId = this.planetData.id;

    if (pId === 'earth') {
      // KSC Gantry Tower (WorldX = 1180)
      const gx = 1180 - cameraOffsetX;
      const gy = this.getGroundY(1180) - cameraOffsetY;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      // Tower lattice
      ctx.strokeRect(gx - 20, gy - 180, 40, 180);
      for (let y = gy - 180; y < gy; y += 30) {
        ctx.beginPath();
        ctx.moveTo(gx - 20, y);
        ctx.lineTo(gx + 20, y + 30);
        ctx.moveTo(gx + 20, y);
        ctx.lineTo(gx - 20, y + 30);
        ctx.stroke();
      }
      // Gantry Crane arm
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(gx - 20, gy - 190, 80, 10);
      // Lightning Mast
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 190);
      ctx.lineTo(gx, gy - 230);
      ctx.stroke();
    } else if (pId === 'moon_south') {
      // NASA CLPS IM-1 "Odysseus" Lander & Polar Water-Ice Core Rig (WorldX = 1200)
      const odyX = 1200 - cameraOffsetX;
      const odyY = this.getGroundY(1200) - cameraOffsetY;

      // Hexagonal High-Tech Lander Body (Carbon composite & gold insulation)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(odyX - 18, odyY - 15);
      ctx.lineTo(odyX - 14, odyY - 55);
      ctx.lineTo(odyX + 14, odyY - 55);
      ctx.lineTo(odyX + 18, odyY - 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Reflective Insulation Panels
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(odyX - 10, odyY - 50, 20, 25);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(odyX - 8, odyY - 22, 16, 7);

      // NASA Meatball & Artemis Insignia
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(odyX, odyY - 38, 5, 0, Math.PI * 2);
      ctx.fill();

      // Top Solar Array Panel & High-Gain Dish
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(odyX - 22, odyY - 60, 44, 5);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(odyX + 8, odyY - 60);
      ctx.lineTo(odyX + 16, odyY - 74);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(odyX + 16, odyY - 74, 4, 0, Math.PI * 2);
      ctx.stroke();

      // 6 Articulated Landing Struts with Cryo Footpads
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      [-28, 28].forEach(lx => {
        ctx.beginPath();
        ctx.moveTo(odyX + lx * 0.35, odyY - 25);
        ctx.lineTo(odyX + lx, odyY);
        ctx.stroke();
        // Wide snow-shoe style polar footpad
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.ellipse(odyX + lx, odyY, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Permanently Shadowed Region (PSR) Ice Deposit Outcrop (WorldX = 1270)
      const iceX = 1270 - cameraOffsetX;
      const iceY = this.getGroundY(1270) - cameraOffsetY;

      // Deep Shadow Pool
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.beginPath();
      ctx.ellipse(iceX + 10, iceY, 35, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Cryogenic Water Ice Shards (40 Kelvin)
      ctx.fillStyle = '#a5f3fc';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      const shards = [
        { x: -8, y: -24, w: 10 },
        { x: 4, y: -32, w: 12 },
        { x: 18, y: -18, w: 9 },
        { x: 28, y: -26, w: 11 }
      ];
      shards.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(iceX + s.x, iceY);
        ctx.lineTo(iceX + s.x + s.w / 2, iceY + s.y);
        ctx.lineTo(iceX + s.x + s.w, iceY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // Ice Sublimation Glow Halo
      const iceGlow = ctx.createRadialGradient(iceX + 10, iceY - 15, 5, iceX + 10, iceY - 15, 45);
      iceGlow.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
      iceGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = iceGlow;
      ctx.beginPath();
      ctx.arc(iceX + 10, iceY - 15, 45, 0, Math.PI * 2);
      ctx.fill();

      // TRIDENT Drill Rig Antenna & Telemetry Beacon
      const drillX = 1140 - cameraOffsetX;
      const drillY = this.getGroundY(1140) - cameraOffsetY;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(drillX, drillY);
      ctx.lineTo(drillX, drillY - 45);
      ctx.stroke();
      // Flashing neutron spectrometer status light
      const pingAlpha = (Math.sin(Date.now() * 0.006) + 1) / 2;
      ctx.fillStyle = `rgba(0, 229, 255, ${pingAlpha})`;
      ctx.beginPath();
      ctx.arc(drillX, drillY - 45, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Indian National Flag (Tiranga) planted at Lunar South Pole (Shiv Shakti Point - WorldX = 1330)
      const southFlagX = 1330 - cameraOffsetX;
      const southFlagY = this.getGroundY(1330) - cameraOffsetY;
      this.drawIndianFlag(ctx, southFlagX, southFlagY, 1.0, true);

    } else if (pId === 'moon') {
      // Apollo 11 Lunar Module Eagle Descent Stage (WorldX = 1200)
      const lmX = 1200 - cameraOffsetX;
      const lmY = this.getGroundY(1200) - cameraOffsetY;

      // Gold Foil Descent Stage Octagon
      ctx.fillStyle = '#d97706';
      ctx.fillRect(lmX - 25, lmY - 35, 50, 24);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lmX - 25, lmY - 35, 50, 24);

      // Gold Foil Textures
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(lmX - 20, lmY - 30, 18, 14);
      ctx.fillRect(lmX + 4, lmY - 30, 18, 14);

      // Four Strut Landing Legs with Footpads
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      [-35, 35].forEach(xOff => {
        ctx.beginPath();
        ctx.moveTo(lmX + xOff * 0.4, lmY - 20);
        ctx.lineTo(lmX + xOff, lmY);
        ctx.stroke();
        // Footpad
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(lmX + xOff, lmY, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Historic Lunar Plaque
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(lmX - 8, lmY - 22, 16, 10);

      // Indian National Flag (Tiranga) planted in lunar regolith (WorldX = 1260)
      const flagX = 1260 - cameraOffsetX;
      const flagY = this.getGroundY(1260) - cameraOffsetY;
      this.drawIndianFlag(ctx, flagX, flagY, 1.0, true);
    } else if (pId === 'mars') {
      // Perseverance Rover Landmark (WorldX = 1200)
      const rovX = 1200 - cameraOffsetX;
      const rovY = this.getGroundY(1200) - cameraOffsetY;

      // Rover Body
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(rovX - 24, rovY - 26, 48, 16, 3);
      ctx.fill();
      ctx.stroke();

      // Mastcam Remote Sensing Mast
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rovX - 12, rovY - 26);
      ctx.lineTo(rovX - 12, rovY - 46);
      ctx.stroke();
      // Mastcam head
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(rovX - 16, rovY - 51, 10, 6);

      // Rocker-Bogie Wheels (6 wheels)
      ctx.fillStyle = '#334155';
      [-18, 0, 18].forEach(wx => {
        ctx.beginPath();
        ctx.arc(rovX + wx, rovY - 4, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ingenuity Scout Helicopter (WorldX = 1310)
      const ingX = 1310 - cameraOffsetX;
      const ingY = this.getGroundY(1310) - cameraOffsetY;
      ctx.fillStyle = '#eab308';
      ctx.fillRect(ingX - 6, ingY - 20, 12, 10);
      // Rotor Mast
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ingX, ingY - 20);
      ctx.lineTo(ingX, ingY - 28);
      ctx.moveTo(ingX - 18, ingY - 28);
      ctx.lineTo(ingX + 18, ingY - 28); // upper blade
      ctx.moveTo(ingX - 16, ingY - 25);
      ctx.lineTo(ingX + 16, ingY - 25); // lower counter-rotating blade
      ctx.stroke();
      // Solar panel top
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(ingX - 7, ingY - 32, 14, 4);
      // 4 carbon legs
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(ingX - 5, ingY - 10);
      ctx.lineTo(ingX - 12, ingY);
      ctx.moveTo(ingX + 5, ingY - 10);
      ctx.lineTo(ingX + 12, ingY);
      ctx.stroke();
    } else if (pId === 'europa') {
      // Subsurface ocean thermal fissure (WorldX = 1750)
      const fisX = 1750 - cameraOffsetX;
      const fisY = this.getGroundY(1750) - cameraOffsetY;
      const fisGlow = ctx.createRadialGradient(fisX, fisY + 10, 5, fisX, fisY + 10, 60);
      fisGlow.addColorStop(0, 'rgba(6, 182, 212, 0.9)');
      fisGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
      fisGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = fisGlow;
      ctx.beginPath();
      ctx.ellipse(fisX, fisY + 10, 80, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pId === 'titan') {
      // Historical Huygens Probe Landing Capsule (WorldX = 1200)
      const huyX = 1200 - cameraOffsetX;
      const huyY = this.getGroundY(1200) - cameraOffsetY;

      // Conical Heat Shield Base
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(huyX - 22, huyY);
      ctx.lineTo(huyX + 22, huyY);
      ctx.lineTo(huyX + 14, huyY - 22);
      ctx.lineTo(huyX - 14, huyY - 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Science Instrument Bay & Antenna
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(huyX - 8, huyY - 30, 16, 9);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(huyX, huyY - 30);
      ctx.lineTo(huyX, huyY - 45);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(huyX, huyY - 45, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderParkedRover(ctx, cameraOffsetX, cameraOffsetY) {
    if (!this.rover) return;
    const rx = this.rover.x - cameraOffsetX;
    const ry = this.rover.y - cameraOffsetY;

    ctx.save();
    ctx.translate(rx, ry);

    // Cast Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    const wheelOffset = 20;
    [-wheelOffset, wheelOffset].forEach(wx => {
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wx, -6, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(wx, -6, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Rover Chassis
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-22, -14);
    ctx.lineTo(22, -14);
    ctx.stroke();

    // Body Tub
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-24, -26, 48, 14, 3);
    ctx.fill();
    ctx.stroke();

    // Dish Antenna
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, -26);
    ctx.lineTo(20, -42);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(20, -42, 4, 0, Math.PI * 2);
    ctx.fill();

    // Rover Beacon & Label
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-30, -56, 60, 14, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NASA ROVER', 0, -46);

    ctx.restore();
  }

  renderRocket(ctx, cameraOffsetX, cameraOffsetY) {
    const rx = this.rocket.x - cameraOffsetX;
    const ry = (this.rocket.y - this.rocket.launchAltitude) - cameraOffsetY;

    ctx.save();
    ctx.translate(rx, ry);

    const partsFound = this.equipmentPieces.filter(p => p.found).length;
    const isUnderConstruction = this.planetData.id === 'earth' && this.rocket.state === 'DISABLED' && partsFound < 3;

    // 0. Launch Pad Staging Framework & Hydraulic Clamps
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-35, 0, 70, 8);
    // Yellow Caution Chevrons
    ctx.fillStyle = '#facc15';
    for (let cx = -30; cx < 30; cx += 12) {
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx + 6, 0); ctx.lineTo(cx + 2, 8); ctx.lineTo(cx - 4, 8);
      ctx.fill();
    }

    // Scaffolding Lattice Tower when under construction
    if (isUnderConstruction) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      [-28, 28].forEach(sx => {
        ctx.strokeRect(sx - 4, -160, 8, 160);
        for (let sy = -160; sy < 0; sy += 24) {
          ctx.beginPath();
          ctx.moveTo(sx - 4, sy); ctx.lineTo(sx + 4, sy + 24);
          ctx.moveTo(sx + 4, sy); ctx.lineTo(sx - 4, sy + 24);
          ctx.stroke();
        }
      });

      // Construction Staging Banner
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-65, -195, 130, 24, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 8px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`BUILD ROCKET: ${partsFound}/3 PARTS FOUND`, 0, -183);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '7px Orbitron, monospace';
      ctx.fillText('LOCATE HIDDEN EQUIPMENT', 0, -173);
    }

    // 1. Heavy Titanium Landing Struts & Pad Clamps
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3.5;
    [-24, 24].forEach(legX => {
      ctx.beginPath();
      ctx.moveTo(legX * 0.4, -20);
      ctx.lineTo(legX, 0);
      ctx.stroke();
      // Footpad
      ctx.fillStyle = '#334155';
      ctx.fillRect(legX - 6, -2, 12, 4);
    });

    // 2. Rocket Engine Propulsion Unit (Nozzle Bell)
    // Solid high-temp alloy bell always visible, with diagnostic bay lights if under repair
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14, -14);
    ctx.lineTo(14, -14);
    ctx.lineTo(18, 0);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High-energy manifold ring
    ctx.fillStyle = (isUnderConstruction && partsFound < 2) ? '#f59e0b' : '#0284c7';
    ctx.fillRect(-12, -13, 24, 2.5);

    if (isUnderConstruction && partsFound < 2) {
      // Amber Warning strobe during installation
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
      ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-16, -15, 32, 16);
    }

    // Engine Glow when Ready or Launching
    if (this.rocket.state === 'READY' || this.rocket.state === 'LAUNCHING') {
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 3. Multi-Stage Rocket Fuselage (Saturn V / SLS Aero Hull)
    // Always solidly drawn in metallic aerospace ceramic white & slate
    const bodyGrad = ctx.createLinearGradient(-20, 0, 20, 0);
    bodyGrad.addColorStop(0, '#94a3b8');
    bodyGrad.addColorStop(0.25, '#f8fafc');
    bodyGrad.addColorStop(0.7, '#ffffff');
    bodyGrad.addColorStop(1, '#64748b');

    // First Stage Tank Core (Solid hull always present)
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-20, -75, 40, 62, 3);
    ctx.fill();
    ctx.stroke();

    // Dark Interstage Separation Collar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-20, -82, 40, 7);

    // Roll-control checkered markings (Saturn V heritage)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-20, -75, 10, 10);
    ctx.fillRect(10, -75, 10, 10);
    ctx.fillRect(-10, -65, 10, 10);
    ctx.fillRect(0, -65, 10, 10);

    // If part 1 missing, show illuminated access panel on stage 1
    if (isUnderConstruction && partsFound < 1) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-14, -52, 28, 22, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 6px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BAY: CRYOTANK', 0, -42);
      ctx.fillStyle = '#facc15';
      ctx.fillText('AWAITING PART', 0, -34);
    }

    // Second Stage / Crew Module (Solid hull always present)
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-18, -125, 36, 43, 3);
    ctx.fill();
    ctx.stroke();

    // Aerodynamic Nosecone & Command Module
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-18, -125);
    ctx.lineTo(18, -125);
    ctx.lineTo(0, -155);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Launch Abort System (LAS) Tower with Escape Thrusters
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -155);
    ctx.lineTo(0, -178);
    ctx.stroke();
    // LAS Jettison Nozzle
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, -178, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Crew Capsule Window (Deep reflective blue glass)
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -112, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Glass highlight glare
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-1.5, -113.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Indian National Flag (Tiranga) Decal proudly mounted on Rocket Hull (Requirement 6)
    ctx.save();
    ctx.translate(-10, -58);
    ctx.fillStyle = '#FF9933'; ctx.fillRect(0, 0, 20, 5);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 5, 20, 5);
    ctx.fillStyle = '#138808'; ctx.fillRect(0, 10, 20, 5);
    // Ashoka Chakra (Navy Blue)
    ctx.fillStyle = '#000080';
    ctx.beginPath();
    ctx.arc(10, 7.5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Aerodynamic Lower Fins (Triangular stabilizers)
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1;
    // Left Fin
    ctx.beginPath();
    ctx.moveTo(-20, -42);
    ctx.lineTo(-32, -14);
    ctx.lineTo(-20, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right Fin
    ctx.beginPath();
    ctx.moveTo(20, -42);
    ctx.lineTo(32, -14);
    ctx.lineTo(20, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Status Indicator Light
    const isFlashing = Math.sin(this.rocket.beaconTimer) > 0;
    if (this.rocket.state === 'READY') {
      ctx.fillStyle = isFlashing ? '#22c55e' : '#15803d'; // Green when ready
    } else {
      ctx.fillStyle = isFlashing ? '#f59e0b' : '#b45309'; // Amber warning when disabled
    }
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -135, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  renderEquipmentPieces(ctx, cameraOffsetX, cameraOffsetY) {
    const playerX = (window.gameEngine && window.gameEngine.player) ? window.gameEngine.player.x : 1005;

    this.equipmentPieces.forEach((item, index) => {
      if (item.found) return;

      const ix = item.x - cameraOffsetX;
      const iy = item.y - cameraOffsetY;

      // Skip offscreen parts with generous margin
      if (ix < -200 || ix > ctx.canvas.width + 200) return;

      ctx.save();
      ctx.translate(ix, iy);

      const pulse = 0.5 + 0.5 * Math.sin(item.pulseAngle);
      const distM = Math.round(Math.abs(item.x - playerX) * 0.5);

      // 1. Sky-High Holographic Light Pillar (Visible hundreds of meters away!)
      const beamGrad = ctx.createLinearGradient(0, -380, 0, 0);
      beamGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      beamGrad.addColorStop(0.3, 'rgba(0, 229, 255, 0.15)');
      beamGrad.addColorStop(0.7, `rgba(56, 189, 248, ${0.4 + pulse * 0.25})`);
      beamGrad.addColorStop(1, 'rgba(0, 229, 255, 0.85)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(-10, -380, 20, 380);

      // Central Starlight Core Laser
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + pulse * 0.35})`;
      ctx.fillRect(-2, -380, 4, 380);

      // 2. Ground Pulsing Concentric Sensor Rings
      const ringR = 18 + pulse * 8;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, ringR, ringR * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, ringR * 1.5, ringR * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Floating 3D Equipment Hardware (Distinct models for Fuselage, Engine & Guidance)
      const floatY = -34 + Math.sin(item.pulseAngle * 1.6) * 5;
      ctx.translate(0, floatY);

      // Halo Glow
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 18;

      const partKey = item.id.toLowerCase();

      if (partKey.includes('fuselage') || partKey.includes('tank') || partKey.includes('part_1')) {
        // --- HARDWARE MODEL 1: ROCKET FUSELAGE & CRYOGENIC TANK ---
        // Metallic Titanium Tank Body
        const tankGrad = ctx.createLinearGradient(-18, 0, 18, 0);
        tankGrad.addColorStop(0, '#64748b');
        tankGrad.addColorStop(0.3, '#f1f5f9');
        tankGrad.addColorStop(0.7, '#ffffff');
        tankGrad.addColorStop(1, '#475569');
        ctx.fillStyle = tankGrad;
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-16, -26, 32, 52, 6);
        ctx.fill();
        ctx.stroke();

        // Stiffener Rings & Cryo Valve Couplers
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-16, -14, 32, 4);
        ctx.fillRect(-16, 10, 32, 4);

        // Liquid Hydrogen Cryo Level Gauge
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-4, -20, 8, 40);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -18, 4, 36);

      } else if (partKey.includes('engine') || partKey.includes('propulsion') || partKey.includes('bell') || partKey.includes('part_2')) {
        // --- HARDWARE MODEL 2: ROCKET ENGINE BELL & PROPULSION NOZZLE ---
        // High-Temp Inconel Bell Nozzle
        const bellGrad = ctx.createLinearGradient(-22, 0, 22, 0);
        bellGrad.addColorStop(0, '#334155');
        bellGrad.addColorStop(0.4, '#f59e0b');
        bellGrad.addColorStop(0.7, '#fbbf24');
        bellGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = bellGrad;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -26);
        ctx.lineTo(10, -26);
        ctx.lineTo(22, 18);
        ctx.lineTo(-22, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Copper Turbopump Manifold Coils
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-14, -14); ctx.lineTo(14, -14);
        ctx.moveTo(-17, -2); ctx.lineTo(17, -2);
        ctx.moveTo(-20, 10); ctx.lineTo(20, 10);
        ctx.stroke();

        // Glowing Thruster Throat
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 18, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // --- HARDWARE MODEL 3: GUIDANCE AVIONICS & AERODYNAMIC NOSE CONE ---
        // Sleek Aerodynamic Nosecone
        const coneGrad = ctx.createLinearGradient(-18, 0, 18, 0);
        coneGrad.addColorStop(0, '#991b1b');
        coneGrad.addColorStop(0.35, '#ef4444');
        coneGrad.addColorStop(0.7, '#f87171');
        coneGrad.addColorStop(1, '#7f1d1d');
        ctx.fillStyle = coneGrad;
        ctx.strokeStyle = '#fee2e2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, 18);
        ctx.lineTo(16, 18);
        ctx.lineTo(0, -32);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glass Avionics Sensor & Navigation Star-Tracker
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(0, -4, 6, 0, Math.PI * 2);
        ctx.fill();

        // Holographic Gyro Navigation Ring
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -4, 20, 7, item.pulseAngle, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // 4. Floating Holographic Equipment Billboard Nameplate
      ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-65, -62, 130, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 8px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`▼ ${item.name.toUpperCase()}`, 0, -50);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 7px Orbitron, monospace';
      ctx.fillText(`LOCATED: ${distM}m // [E] TO SECURE`, 0, -40);

      ctx.restore();
    });
  }

  // =========================================================================
  // Indian National Flag (Tiranga) Drawing System (Requirement 6)
  // =========================================================================
  drawIndianFlag(ctx, x, y, size = 1.0, isWaving = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);

    // Silver Flagpole with golden finial
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -55);
    ctx.stroke();

    // Top horizontal crossbar stiffener (keeps flag unfurled in vacuum / low atmosphere)
    ctx.beginPath();
    ctx.moveTo(0, -55);
    ctx.lineTo(36, -55);
    ctx.stroke();

    // Golden Finial Sphere
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, -56, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Wave oscillation
    const wave = isWaving ? Math.sin(Date.now() * 0.004) * 2.5 : 0;

    const fw = 34;
    const fh = 7.5;

    // 1. Saffron Band (Top)
    ctx.fillStyle = '#FF9933';
    ctx.beginPath();
    ctx.moveTo(0, -55);
    ctx.lineTo(fw, -55 + wave);
    ctx.lineTo(fw, -55 + fh + wave);
    ctx.lineTo(0, -55 + fh);
    ctx.closePath();
    ctx.fill();

    // 2. White Band (Middle)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -55 + fh);
    ctx.lineTo(fw, -55 + fh + wave);
    ctx.lineTo(fw, -55 + fh * 2 + wave);
    ctx.lineTo(0, -55 + fh * 2);
    ctx.closePath();
    ctx.fill();

    // 3. Green Band (Bottom)
    ctx.fillStyle = '#138808';
    ctx.beginPath();
    ctx.moveTo(0, -55 + fh * 2);
    ctx.lineTo(fw, -55 + fh * 2 + wave);
    ctx.lineTo(fw, -55 + fh * 3 + wave);
    ctx.lineTo(0, -55 + fh * 3);
    ctx.closePath();
    ctx.fill();

    // 4. Ashoka Chakra (Navy Blue 24-Spoke Wheel in center of white band)
    const cx = fw / 2;
    const cy = -55 + fh * 1.5 + wave * 0.5;
    const cr = 3.2;
    ctx.strokeStyle = '#000080';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#000080';
    ctx.beginPath();
    ctx.arc(cx, cy, 0.8, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 8;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(angle) * cr, cy - Math.sin(angle) * cr);
      ctx.lineTo(cx + Math.cos(angle) * cr, cy + Math.sin(angle) * cr);
      ctx.stroke();
    }

    // Ground Base Mount Footpad
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderPlantedIndianFlags(ctx, cameraOffsetX, cameraOffsetY) {
    if (!window.storageManager || !window.storageManager.data) return;
    const planted = window.storageManager.data.plantedFlags;
    if (!planted) return;

    const currentFlag = planted[this.planetData.id];
    if (currentFlag && currentFlag.x !== undefined && currentFlag.y !== undefined) {
      const fx = currentFlag.x - cameraOffsetX;
      const fy = currentFlag.y - cameraOffsetY;
      this.drawIndianFlag(ctx, fx, fy, 1.05, true);

      // Inscription label
      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(fx - 24, fy - 68, 48, 12, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 7px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('INDIA 🇮🇳', fx, fy - 60);
    }
  }

  // Planetary Deflector Shield over Rocket during Asteroid Storm
  renderRocketDeflectorShield(ctx, cameraOffsetX, cameraOffsetY) {
    const rx = this.rocket.x - cameraOffsetX;
    const ry = (this.rocket.y - this.rocket.launchAltitude) - cameraOffsetY;

    ctx.save();
    ctx.translate(rx, ry);

    const time = Date.now() * 0.003;
    const shieldRadius = 105;

    // Outer Glow Dome
    const glow = ctx.createRadialGradient(0, -75, shieldRadius * 0.7, 0, -75, shieldRadius * 1.15);
    glow.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
    glow.addColorStop(0.7, 'rgba(0, 229, 255, 0.28)');
    glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -75, shieldRadius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Force Field Perimeter
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, -75, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Hexagonal Grid Lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI / 3) + time * 0.15;
      const hx = Math.cos(angle) * (shieldRadius * 0.85);
      const hy = -75 + Math.sin(angle) * (shieldRadius * 0.85);
      ctx.beginPath();
      ctx.arc(hx, hy, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Floating Caution Hologram Banner
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-95, -225, 190, 30, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 8px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️ DEFLECTOR SHIELD ENGAGED', 0, -213);
    ctx.fillStyle = '#facc15';
    ctx.font = '7px Orbitron, monospace';
    ctx.fillText('ESCAPE ASTEROIDS TO UNLOCK BOARDING', 0, -202);

    ctx.restore();
  }

  // Active Falling Asteroids & Warning Reticles
  renderAsteroids(ctx, cameraOffsetX, cameraOffsetY) {
    if (!window.gameEngine || !window.gameEngine.asteroidStorm) return;
    const storm = window.gameEngine.asteroidStorm;
    const asteroids = storm.asteroids || [];

    asteroids.forEach(ast => {
      // 1. Ground Impact Warning Target Reticle
      const screenTargetX = ast.targetX - cameraOffsetX;
      const screenTargetY = ast.targetY - cameraOffsetY;

      const pulse = 0.8 + 0.2 * Math.sin(Date.now() * 0.015);
      const reticleRadius = Math.max(12, ast.radius * 1.5 * pulse);

      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenTargetX, screenTargetY, reticleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(screenTargetX - reticleRadius - 6, screenTargetY);
      ctx.lineTo(screenTargetX + reticleRadius + 6, screenTargetY);
      ctx.moveTo(screenTargetX, screenTargetY - reticleRadius - 6);
      ctx.lineTo(screenTargetX, screenTargetY + reticleRadius + 6);
      ctx.stroke();

      // Warning Label
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 7px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ DANGER // IMPACT', screenTargetX, screenTargetY - reticleRadius - 8);
      ctx.restore();

      // 2. Asteroid Body in Flight
      const ax = ast.x - cameraOffsetX;
      const ay = ast.y - cameraOffsetY;

      ctx.save();
      ctx.translate(ax, ay);

      // Re-entry Flame Tail
      const tailLength = Math.hypot(ast.vx, ast.vy) * 6;
      const tailAngle = Math.atan2(ast.vy, ast.vx);

      const fireGrad = ctx.createLinearGradient(0, 0, -Math.cos(tailAngle) * tailLength, -Math.sin(tailAngle) * tailLength);
      fireGrad.addColorStop(0, '#facc15');
      fireGrad.addColorStop(0.3, '#f97316');
      fireGrad.addColorStop(0.7, '#ea580c');
      fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.moveTo(Math.cos(tailAngle + Math.PI / 2) * ast.radius * 0.9, Math.sin(tailAngle + Math.PI / 2) * ast.radius * 0.9);
      ctx.lineTo(-Math.cos(tailAngle) * tailLength, -Math.sin(tailAngle) * tailLength);
      ctx.lineTo(Math.cos(tailAngle - Math.PI / 2) * ast.radius * 0.9, Math.sin(tailAngle - Math.PI / 2) * ast.radius * 0.9);
      ctx.closePath();
      ctx.fill();

      // Asteroid Rock Body (Jagged 3D Spherical Rock)
      ctx.rotate(ast.rot);

      const rockGrad = ctx.createRadialGradient(-ast.radius * 0.3, -ast.radius * 0.3, 2, 0, 0, ast.radius);
      rockGrad.addColorStop(0, '#fbbf24');
      rockGrad.addColorStop(0.3, '#78350f');
      rockGrad.addColorStop(0.8, '#292524');
      rockGrad.addColorStop(1, '#0c0a09');

      ctx.fillStyle = rockGrad;
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      const points = 8;
      for (let p = 0; p < points; p++) {
        const pAngle = (p * Math.PI * 2) / points;
        const jagged = ast.radius * (0.82 + ((p % 2 === 0) ? 0.22 : -0.12));
        const px = Math.cos(pAngle) * jagged;
        const py = Math.sin(pAngle) * jagged;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Molten Cracks
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-ast.radius * 0.4, -ast.radius * 0.2);
      ctx.lineTo(ast.radius * 0.1, ast.radius * 0.3);
      ctx.lineTo(ast.radius * 0.4, 0);
      ctx.stroke();

      ctx.restore();
    });
  }

  // Ground Impact Scorches & Craters
  renderImpactScorches(ctx, cameraOffsetX, cameraOffsetY) {
    if (!window.gameEngine || !window.gameEngine.asteroidStorm) return;
    const scorches = window.gameEngine.asteroidStorm.scorchMarks || [];

    scorches.forEach(sc => {
      const sx = sc.x - cameraOffsetX;
      const sy = sc.y - cameraOffsetY;

      ctx.save();
      ctx.globalAlpha = sc.alpha;
      const grad = ctx.createRadialGradient(sx, sy, 2, sx, sy, sc.radius);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.6, '#451a03');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sc.radius, sc.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Molten Ember Rim
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
  }
}