// Project Horizons: NASA Odyssey - Physics, Camera & Particle Engine

// Universal Polyfill for CanvasRenderingContext2D.prototype.roundRect
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (!radii) radii = 0;
    let r = 0;
    if (typeof radii === 'number') {
      r = Math.min(Math.abs(w) / 2, Math.abs(h) / 2, Math.max(0, radii));
    } else if (Array.isArray(radii)) {
      r = Math.min(Math.abs(w) / 2, Math.abs(h) / 2, Math.max(0, radii[0] || 0));
    }
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.viewportWidth = 800;
    this.viewportHeight = 600;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;
    this.lookAheadX = 0;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  follow(targetX, targetY, facing = 1, worldWidth = 3200) {
    if (isNaN(targetX) || !isFinite(targetX)) targetX = 1005;
    if (isNaN(targetY) || !isFinite(targetY)) targetY = 520;

    this.lookAheadX += ((facing * 80) - this.lookAheadX) * 0.05;
    this.targetX = targetX + this.lookAheadX - this.viewportWidth / 2;
    this.targetY = targetY - this.viewportHeight * 0.58;

    // Smooth lerp
    this.x += (this.targetX - this.x) * 0.08;
    this.y += (this.targetY - this.y) * 0.08;

    if (isNaN(this.x) || !isFinite(this.x)) this.x = 0;
    if (isNaN(this.y) || !isFinite(this.y)) this.y = 0;

    // Clamp camera within world bounds
    if (this.x < 0) this.x = 0;
    if (this.x > worldWidth - this.viewportWidth) this.x = Math.max(0, worldWidth - this.viewportWidth);
  }

  addShake(intensity) {
    this.shakeIntensity = Math.min(30, this.shakeIntensity + intensity);
  }

  update() {
    if (this.shakeIntensity > 0.05) {
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }
  }

  getOffsetX() {
    return this.x + (Math.random() * 2 - 1) * this.shakeIntensity;
  }

  getOffsetY() {
    return this.y + (Math.random() * 2 - 1) * this.shakeIntensity;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(type, x, y, options = {}) {
    const count = options.count || 1;
    for (let i = 0; i < count; i++) {
      const p = {
        type: type,
        x: x + (options.spreadX ? (Math.random() * 2 - 1) * options.spreadX : 0),
        y: y + (options.spreadY ? (Math.random() * 2 - 1) * options.spreadY : 0),
        vx: options.vx !== undefined ? options.vx + (Math.random() * 2 - 1) * (options.spreadVx || 0) : (Math.random() * 2 - 1) * 2,
        vy: options.vy !== undefined ? options.vy + (Math.random() * 2 - 1) * (options.spreadVy || 0) : (Math.random() * 2 - 1) * 2,
        color: options.color || '#38bdf8',
        size: options.size || (Math.random() * 3 + 2),
        life: 1.0,
        decay: options.decay || (0.015 + Math.random() * 0.02),
        gravity: options.gravity !== undefined ? options.gravity : 0.05,
        targetX: options.targetX,
        targetY: options.targetY
      };
      this.particles.push(p);
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Special pickup sparkle logic (converge to target)
      if (p.type === 'pickup_sparkle' && p.targetX !== undefined && p.targetY !== undefined) {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.vx += dx * 0.04;
        p.vy += dy * 0.04;
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else {
        p.vy += p.gravity;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx, cameraOffsetX, cameraOffsetY) {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const screenX = p.x - cameraOffsetX;
      const screenY = p.y - cameraOffsetY;

      // Skip offscreen particles
      if (screenX < -20 || screenX > ctx.canvas.width + 20 || screenY < -20 || screenY > ctx.canvas.height + 20) {
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'smoke') {
        const rad = p.size * (2 - p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, rad, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'thruster' || p.type === 'rocket_fire') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (p.type === 'sparks') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX - p.vx * 2, screenY - p.vy * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

// Terrain elevation function per world
function calculateTerrainHeight(worldX, worldWidth, planetKey, groundBaseY) {
  const normX = worldX / worldWidth;

  // Earth: Flat launchpad concrete center with gentle green berms
  if (planetKey === 'earth') {
    if (worldX > 700 && worldX < 1400) {
      return groundBaseY; // Flat concrete pad for LC-39A
    }
    return groundBaseY + Math.sin(normX * 12) * 20 + Math.cos(normX * 4) * 15;
  }

  // Moon South Pole: Artemis & Malapert A (extreme shadowy crater terrain, ice basins & high rims)
  if (planetKey === 'moon_south') {
    if (worldX > 750 && worldX < 1150) {
      return groundBaseY; // Flat plateau landing zone near Malapert A rim
    }
    const deepShackleton = Math.exp(-Math.pow((worldX - 520) / 160, 2)) * 65; // deep permanently shadowed crater basin
    const malapertBasin = Math.exp(-Math.pow((worldX - 1850) / 220, 2)) * 75; // volatile-rich depression
    const iceRidge = Math.sin(normX * 22) * 26 + Math.cos(normX * 8) * 32;
    return groundBaseY + iceRidge + deepShackleton + malapertBasin;
  }

  // Moon: Apollo 11 Sea of Tranquility (rolling crater basins & subtle rims)
  if (planetKey === 'moon') {
    if (worldX > 750 && worldX < 1150) {
      return groundBaseY; // Flat landing zone for Eagle LM
    }
    const crater1 = Math.exp(-Math.pow((worldX - 500) / 120, 2)) * -40; // crater dip
    const crater2 = Math.exp(-Math.pow((worldX - 1800) / 180, 2)) * -55; // large crater
    const crater3 = Math.exp(-Math.pow((worldX - 2500) / 90, 2)) * -30;
    const rolling = Math.sin(normX * 16) * 18 + Math.cos(normX * 6) * 25;
    return groundBaseY + rolling + crater1 + crater2 + crater3;
  }

  // Mars: Jezero Crater delta ridges and iron dunes
  if (planetKey === 'mars') {
    if (worldX > 750 && worldX < 1150) {
      return groundBaseY; // Flat delta landing apron
    }
    const deltaRim = Math.sin(normX * 20) * 22 + Math.cos(normX * 7) * 35;
    const rockyMesa = (worldX > 1500 && worldX < 2100) ? -35 * Math.sin((worldX - 1500) / 600 * Math.PI) : 0;
    return groundBaseY + deltaRim + rockyMesa;
  }

  // Europa: Jagged chaos terrain with deep ice fissures and uplifted ice blocks
  if (planetKey === 'europa') {
    if (worldX > 750 && worldX < 1150) {
      return groundBaseY; // Ice landing plane
    }
    const chaosIce = Math.sin(normX * 30) * 16 + Math.cos(normX * 14) * 20;
    const fissure = (worldX > 1650 && worldX < 1850) ? 45 : 0; // deep fracture
    return groundBaseY + chaosIce + fissure;
  }

  // Titan: Kraken Mare shoreline and methane-sculpted pebbles
  if (planetKey === 'titan') {
    if (worldX > 750 && worldX < 1150) {
      return groundBaseY; // Huygens beacon pad
    }
    // Gradual slope toward methane sea on the right
    const beachSlope = normX > 0.65 ? (normX - 0.65) * 60 : 0;
    const dunes = Math.sin(normX * 18) * 24;
    return groundBaseY + dunes + beachSlope;
  }

  return groundBaseY + Math.sin(normX * 10) * 20;
}