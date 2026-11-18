// Project Horizons: Space Mission Design Game - Astronaut & Rover System

class Astronaut {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 28;
    this.height = 54;
    this.facing = 1; // 1 = right, -1 = left
    this.isGrounded = false;
    this.walkCycle = 0;
    this.walkSpeed = 4.2;

    // Rover Vehicle System (Pic 1 Inspired)
    this.inRover = false;
    this.roverWheelRotation = 0;
    this.roverSpeed = 7.5;

    // Jetpack system
    this.jetpackFuel = 100;
    this.maxJetpackFuel = 100;
    this.isJetpacking = false;
    this.consecutiveFlightTimer = 0;

    // Footstep timer
    this.stepTimer = 0;

    // Profile Customization (Cadet Boy/Girl & Astronaut Modes)
    this.stage = 'cadet'; // 'cadet' (on Earth before rocket build) or 'astronaut'
    this.gender = 'boy';  // 'boy' or 'girl'
    this.suitColor = 'white';
    this.visorTint = 'gold';
    this.callsign = 'Cadet Orion';

    // Control inputs
    this.keys = {
      left: false,
      right: false,
      jump: false,
      interact: false
    };

    // Vitals & Health System (100 HP, Damage on asteroid strikes, Death & Restart)
    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
    this.deathTimer = 0;
    this.invulnerableTimer = 0;
    this.damageFlashTimer = 0;

    // Movement Trigger tracking (User requirement: asteroids should only fall after player start to move)
    this.hasStartedMoving = false;

    // Multi-Astronaut Crew Attributes (Up to 4 Players)
    this.playerId = 'p1'; // 'p1', 'p2', 'p3', 'p4'
    this.role = 'Commander';
    this.playerRolePrefix = 'P1';
    this.crewColor = '#00e5ff';

    // Interaction target
    this.nearInteractable = null;
  }

  setProfile(profile) {
    if (!profile) return;
    this.suitColor = profile.suitColor || 'white';
    this.visorTint = profile.visorTint || 'gold';
    this.callsign = profile.callsign || 'Cadet Orion';
    if (window.storageManager && window.storageManager.data) {
      this.stage = window.storageManager.data.characterStage || 'cadet';
      this.gender = window.storageManager.data.characterGender || 'boy';
    }
  }

  takeDamage(amount, source = 'asteroid') {
    if (this.isDead || this.invulnerableTimer > 0) return false;

    const diffMode = window.storageManager?.getDifficulty?.() || 'moderate';
    const cfg = window.GAME_DIFFICULTY_MODES?.[diffMode] || { asteroidDamageMultiplier: 1.0 };
    const scaledDamage = Math.max(1, Math.round(amount * (cfg.asteroidDamageMultiplier || 1.0)));

    this.health = Math.max(0, this.health - scaledDamage);
    this.invulnerableTimer = 45; // ~0.75s invulnerability i-frames
    this.damageFlashTimer = 18;

    if (this.health <= 0) {
      this.die(source);
    }
    return true;
  }

  applyDifficulty(mode = null) {
    const diffMode = mode || window.storageManager?.getDifficulty?.() || 'moderate';
    const cfg = window.GAME_DIFFICULTY_MODES?.[diffMode] || { maxHealth: 100 };
    this.maxHealth = cfg.maxHealth || 100;
    if (this.health > this.maxHealth || this.health <= 0) {
      this.health = this.maxHealth;
    }
  }

  die(source = 'asteroid') {
    this.health = 0;
    this.isDead = true;
    this.deathTimer = 0;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
    this.isJetpacking = false;

    if (window.soundEngine && typeof window.soundEngine.playWarningSiren === 'function') {
      window.soundEngine.playWarningSiren();
    }

    if (window.gameEngine && typeof window.gameEngine.handlePlayerDeath === 'function') {
      window.gameEngine.handlePlayerDeath(source);
    }
  }

  revive(x, y) {
    this.applyDifficulty();
    this.health = this.maxHealth;
    this.isDead = false;
    this.deathTimer = 0;
    this.invulnerableTimer = 60;
    this.damageFlashTimer = 0;
    this.reset(x, y);
  }

  reset(x, y) {
    this.applyDifficulty();
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.jetpackFuel = 100;
    this.isGrounded = false;
    this.inRover = false;
    this.hasStartedMoving = false;
    this.nearInteractable = null;
  }

  mountRover() {
    this.inRover = true;
    this.isJetpacking = false;
  }

  dismountRover() {
    this.inRover = false;
    this.vy = -4; // slight hop off
  }

  update(world, planetData, particleSystem) {
    const gravity = planetData.gravity * 0.052;
    const airDrag = planetData.airDrag || 0.98;

    // Decrement i-frames and damage flash timers
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.damageFlashTimer > 0) this.damageFlashTimer--;

    // Handle Astronaut Death State
    if (this.isDead) {
      this.deathTimer++;
      this.vx *= 0.82;
      this.vy += gravity;
      this.y += this.vy;
      const groundY = world.getGroundY(this.x);
      if (this.y >= groundY) {
        this.y = groundY;
        this.vy = 0;
        this.isGrounded = true;
      }
      // Emit occasional emergency distress sparks and smoke while collapsed
      if (Math.random() < 0.25) {
        particleSystem.emit('sparks', this.x + (Math.random() - 0.5) * 16, this.y - 8, {
          count: 2,
          color: '#ef4444',
          gravity: 0.12
        });
      }
      if (Math.random() < 0.15) {
        particleSystem.emit('smoke', this.x, this.y - 10, {
          count: 1,
          color: 'rgba(239, 68, 68, 0.4)',
          size: 8,
          gravity: -0.02
        });
      }
      return;
    }

    const currentMaxSpeed = this.inRover ? this.roverSpeed : this.walkSpeed;
    const accel = this.inRover ? 0.85 : 0.65;

    // Movement Trigger: Asteroids only fall after player starts moving (User Requirement)
    if (this.keys.left || this.keys.right || this.keys.jump || Math.abs(this.vx) > 0.1 || this.inRover) {
      this.hasStartedMoving = true;
    }

    // Horizontal Movement
    if (this.keys.left) {
      this.vx -= accel;
      this.facing = -1;
      if (this.inRover) this.roverWheelRotation -= 0.3;
    } else if (this.keys.right) {
      this.vx += accel;
      this.facing = 1;
      if (this.inRover) this.roverWheelRotation += 0.3;
    } else {
      // Friction
      this.vx *= this.isGrounded ? (this.inRover ? 0.90 : 0.82) : 0.96;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }

    // Clamp horizontal speed
    if (this.vx > currentMaxSpeed) this.vx = currentMaxSpeed;
    if (this.vx < -currentMaxSpeed) this.vx = -currentMaxSpeed;

    // Vertical Movement & Jetpack / Rover Suspension
    if (this.keys.jump) {
      if (this.isGrounded) {
        if (this.inRover) {
          // Rover Suspension Hop
          this.vy = -planetData.jumpForce * 0.85;
          this.isGrounded = false;
          particleSystem.emit('dust', this.x, this.y, {
            count: 10,
            spreadX: 18,
            color: planetData.groundColors.surface,
            gravity: 0.1
          });
        } else {
          // Astronaut Ground Leap
          this.vy = -planetData.jumpForce;
          this.isGrounded = false;
          particleSystem.emit('dust', this.x, this.y, {
            count: 6,
            color: planetData.groundColors.surface,
            gravity: 0.1
          });
        }
      } else if (!this.inRover && this.jetpackFuel > 0) {
        // Sustained Jetpack Thrust (only on foot)
        this.isJetpacking = true;
        const thrustForce = gravity * 1.58;
        this.vy -= thrustForce;
        this.jetpackFuel = Math.max(0, this.jetpackFuel - 0.7);
        this.consecutiveFlightTimer += 1 / 60;

        const thrusterX = this.x - this.facing * 10;
        const thrusterY = this.y - 22;
        particleSystem.emit('thruster', thrusterX, thrusterY, {
          count: 2,
          spreadX: 3,
          spreadY: 2,
          vx: -this.vx * 0.2 + (Math.random() * 2 - 1) * 0.5,
          vy: 3.5 + Math.random() * 2,
          color: planetData.id === 'europa' ? '#06b6d4' : '#38bdf8',
          size: 3,
          gravity: 0.05
        });

        if (window.soundEngine) {
          window.soundEngine.setThruster(true, 1.0);
        }
      } else {
        this.isJetpacking = false;
        if (window.soundEngine) window.soundEngine.setThruster(false);
      }
    } else {
      this.isJetpacking = false;
      if (window.soundEngine) window.soundEngine.setThruster(false);
    }

    // Apply Gravity and Air Resistance
    this.vy += gravity;
    this.vy *= airDrag;

    // Apply Velocity
    this.x += this.vx;
    this.y += this.vy;

    // Terrain Collision
    const groundY = world.getGroundY(this.x);
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.isGrounded = true;

      // Recharge Jetpack on Ground
      if (this.jetpackFuel < this.maxJetpackFuel) {
        this.jetpackFuel = Math.min(this.maxJetpackFuel, this.jetpackFuel + 1.2);
      }
      this.consecutiveFlightTimer = 0;
    } else {
      this.isGrounded = false;
    }

    // World Boundary Clamping
    if (this.x < 30) {
      this.x = 30;
      this.vx = 0;
    }
    if (this.x > world.worldWidth - 30) {
      this.x = world.worldWidth - 30;
      this.vx = 0;
    }

    // Walking Cycle / Rover Driving Trails
    if (this.isGrounded && Math.abs(this.vx) > 0.2) {
      if (this.inRover) {
        // Rover tire dust trail & electric motor audio
        if (Math.random() < 0.4) {
          particleSystem.emit('dust', this.x - this.facing * 20, this.y, {
            count: 3,
            spreadX: 8,
            color: planetData.groundColors.surface,
            gravity: 0.08
          });
          if (window.soundEngine && Math.random() < 0.3) {
            window.soundEngine.playRoverDrive(Math.abs(this.vx) / 5.0);
          }
        }
      } else {
        this.walkCycle += Math.abs(this.vx) * 0.25;
        this.stepTimer++;
        if (this.stepTimer > 18) {
          this.stepTimer = 0;
          if (window.soundEngine) {
            window.soundEngine.playFootstep(planetData.id);
          }
          particleSystem.emit('dust', this.x, this.y, {
            count: 2,
            spreadX: 4,
            spreadY: 1,
            color: planetData.groundColors.surface,
            gravity: 0.08
          });
          world.addFootprint(this.x, this.y, this.facing);
        }
      }
    } else if (this.isGrounded) {
      this.walkCycle = 0;
      this.stepTimer = 0;
    }
  }

  getSuitPalette() {
    switch (this.suitColor) {
      case 'navy':
        return { body: '#1e3a8a', stroke: '#3b82f6', trim: '#60a5fa', boots: '#0f172a' };
      case 'orange':
        return { body: '#ea580c', stroke: '#c2410c', trim: '#fed7aa', boots: '#431407' };
      case 'cyan':
        return { body: '#0891b2', stroke: '#06b6d4', trim: '#a5f3fc', boots: '#164e63' };
      case 'gold':
        return { body: '#ca8a04', stroke: '#eab308', trim: '#fef08a', boots: '#713f12' };
      case 'white':
      default:
        return { body: '#ffffff', stroke: '#94a3b8', trim: '#e2e8f0', boots: '#334155' };
    }
  }

  getVisorGradient(ctx) {
    const grad = ctx.createLinearGradient(0, -52, 8, -42);
    switch (this.visorTint) {
      case 'cyan':
        grad.addColorStop(0, '#a5f3fc');
        grad.addColorStop(0.5, '#06b6d4');
        grad.addColorStop(1, '#0e7490');
        break;
      case 'emerald':
        grad.addColorStop(0, '#a7f3d0');
        grad.addColorStop(0.5, '#10b981');
        grad.addColorStop(1, '#047857');
        break;
      case 'violet':
        grad.addColorStop(0, '#ddd6fe');
        grad.addColorStop(0.5, '#8b5cf6');
        grad.addColorStop(1, '#6d28d9');
        break;
      case 'gold':
      default:
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#f59e0b');
        grad.addColorStop(1, '#b45309');
        break;
    }
    return grad;
  }

  render(ctx, cameraOffsetX, cameraOffsetY, planetData) {
    const screenX = this.x - cameraOffsetX;
    const screenY = this.y - cameraOffsetY;

    ctx.save();
    ctx.translate(screenX, screenY);

    // Damage flash or invulnerability flicker
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    if (this.isDead) {
      // Fallen Astronaut Posture (Rotated horizontally on the ground)
      ctx.save();
      ctx.rotate((this.facing >= 0 ? 1 : -1) * 1.35); // Fallen on side
      ctx.translate(0, 10);
      if (this.stage === 'cadet' && planetData.id === 'earth') {
        this.renderCadetOnFoot(ctx, planetData);
      } else {
        this.renderAstronautOnFoot(ctx, planetData);
      }
      ctx.restore();

      // Red flashing emergency distress tag
      const blink = Math.sin(Date.now() * 0.015) > 0;
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.strokeStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-45, -35, 90, 16, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = blink ? '#f87171' : '#fca5a5';
      ctx.font = 'bold 8px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💀 SUIT BREACH // KIA', 0, -24);
      ctx.restore();
      return;
    }

    // Damage Flash Aura
    if (this.damageFlashTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, this.inRover ? -25 : -28, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.inRover) {
      this.renderRoverWithAstronaut(ctx, planetData);
    } else if (this.stage === 'cadet' && planetData.id === 'earth') {
      this.renderCadetOnFoot(ctx, planetData);
    } else {
      this.renderAstronautOnFoot(ctx, planetData);
    }

    // Render Astronaut Callsign & Health Tag (Single Player Hero)
    const tagColor = '#00e5ff';
    const tagY = this.inRover ? -68 : -72;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-36, tagY, 72, 15, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 8px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.callsign.substring(0, 12).toUpperCase(), 0, tagY + 10.5);

    // Mini Health Vital bar above tag if damaged
    if (this.health < this.maxHealth) {
      const hpW = 50;
      const hpH = 3;
      const hpPct = Math.max(0, this.health / this.maxHealth);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-hpW / 2, tagY - 5, hpW, hpH);
      ctx.fillStyle = hpPct > 0.5 ? '#10b981' : (hpPct > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(-hpW / 2, tagY - 5, hpW * hpPct, hpH);
    }

    ctx.restore();
  }

  renderRoverWithAstronaut(ctx, planetData) {
    ctx.scale(this.facing, 1);
    const palette = this.getSuitPalette();

    // 1. Rover Cast Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rover Wheels (Mesh Apollo Tires)
    const wheelOffset = 22;
    [-wheelOffset, wheelOffset].forEach(wx => {
      ctx.save();
      ctx.translate(wx, -6);
      ctx.rotate(this.roverWheelRotation);

      // Outer Tire
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tire Spokes
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
      ctx.moveTo(0, -10); ctx.lineTo(0, 10);
      ctx.stroke();

      // Hubcap
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 3. Rover Chassis & Suspension Frame
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, -14);
    ctx.lineTo(24, -14);
    ctx.stroke();

    // 4. Rover Body & Solar/Battery Tub
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-26, -26, 52, 14, 3);
    ctx.fill();
    ctx.stroke();

    // High-Gain Dish Antenna
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, -26);
    ctx.lineTo(24, -42);
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(24, -42, 4, 0, Math.PI * 2);
    ctx.fill();

    // Headlight Beam
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.beginPath();
    ctx.moveTo(26, -22);
    ctx.lineTo(85, -34);
    ctx.lineTo(85, -10);
    ctx.closePath();
    ctx.fill();

    // 5. Astronaut Seated in Rover
    ctx.save();
    ctx.translate(-2, -18);

    // Seated Torso
    ctx.fillStyle = palette.body;
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-6, -20, 14, 18, 3);
    ctx.fill();
    ctx.stroke();

    // Helmet Dome
    ctx.beginPath();
    ctx.arc(1, -26, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Visor
    ctx.fillStyle = this.getVisorGradient(ctx);
    ctx.beginPath();
    ctx.ellipse(3, -26, 5, 6, Math.PI / 12, 0, Math.PI * 2);
    ctx.fill();

    // Steering Hand
    ctx.strokeStyle = palette.body;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(2, -14);
    ctx.lineTo(10, -10);
    ctx.stroke();

    ctx.restore();
  }

  renderAstronautOnFoot(ctx, planetData) {
    const palette = this.getSuitPalette();

    // 1. Cast Shadow
    const shadowScale = Math.max(0.3, 1 - (this.isGrounded ? 0 : 0.4));
    ctx.save();
    ctx.scale(shadowScale, 0.25);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Astronaut Body (Flip for facing)
    ctx.scale(this.facing, 1);

    const legSwing = this.isGrounded ? Math.sin(this.walkCycle) * 12 : 6;
    const legBend = this.isGrounded ? Math.abs(Math.cos(this.walkCycle)) * 4 : 2;

    // Back Leg
    ctx.strokeStyle = palette.trim;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-legSwing * 0.8, -10 + legBend);
    ctx.lineTo(-legSwing, 0);
    ctx.stroke();

    // Back Foot Boot
    ctx.fillStyle = palette.boots;
    ctx.beginPath();
    ctx.roundRect(-legSwing - 3, -4, 8, 5, 2);
    ctx.fill();

    // Life Support Backpack (PLSS)
    ctx.fillStyle = palette.trim;
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-18, -44, 12, 26, 3);
    ctx.fill();
    ctx.stroke();

    // Backpack Oxygen Cylinders & Thruster Nozzle
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-15, -40, 6, 4);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-14, -18, 5, 5);

    // Front Leg
    ctx.strokeStyle = palette.body;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(legSwing * 0.8, -10 - legBend);
    ctx.lineTo(legSwing, 0);
    ctx.stroke();

    // Front Foot Boot
    ctx.fillStyle = palette.boots;
    ctx.beginPath();
    ctx.roundRect(legSwing - 2, -4, 9, 5, 2);
    ctx.fill();

    // Torso Spacesuit
    ctx.fillStyle = palette.body;
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-8, -42, 16, 23, 4);
    ctx.fill();
    ctx.stroke();

    // Indian National Flag (Tiranga) Mission Insignia on Astronaut Chest
    ctx.save();
    ctx.translate(-4, -34);
    ctx.fillStyle = '#FF9933'; ctx.fillRect(0, 0, 8, 2.2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 2.2, 8, 2.2);
    ctx.fillStyle = '#138808'; ctx.fillRect(0, 4.4, 8, 2.2);
    // Ashoka Chakra Navy Dot
    ctx.fillStyle = '#000080';
    ctx.beginPath();
    ctx.arc(4, 3.3, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#334155';
    ctx.fillRect(-4, -26, 8, 3); // Utility chest buckle

    // Helmet Dome
    ctx.fillStyle = palette.body;
    ctx.strokeStyle = palette.stroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(2, -47, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Reflective Gold/Cyan/Emerald Solar Visor
    ctx.fillStyle = this.getVisorGradient(ctx);
    ctx.beginPath();
    ctx.ellipse(5, -47, 6, 7.5, Math.PI / 12, 0, Math.PI * 2);
    ctx.fill();

    // Visor Glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(4, -49, 2.5, 4, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    const armSwing = this.isGrounded ? -Math.sin(this.walkCycle) * 10 : -4;
    ctx.strokeStyle = palette.body;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(armSwing * 0.7 + 2, -26);
    ctx.lineTo(armSwing + 5, -20);
    ctx.stroke();

    // Glove
    ctx.fillStyle = palette.boots;
    ctx.beginPath();
    ctx.arc(armSwing + 5, -19, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // =========================================================================
  // Cadet On Foot System (Boy or Girl Explorer before Rocket Flight!)
  // =========================================================================
  renderCadetOnFoot(ctx, planetData) {
    // 1. Cast Ground Shadow
    const shadowScale = Math.max(0.3, 1 - (this.isGrounded ? 0 : 0.4));
    ctx.save();
    ctx.scale(shadowScale, 0.25);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Flip for facing direction
    ctx.scale(this.facing, 1);

    const legSwing = this.isGrounded ? Math.sin(this.walkCycle) * 11 : 5;
    const legBend = this.isGrounded ? Math.abs(Math.cos(this.walkCycle)) * 3.5 : 2;
    const isGirl = this.gender === 'girl';

    // Cadet Styling
    const jacketColor = isGirl ? '#ec4899' : '#2563eb';
    const jacketTrim = isGirl ? '#fbcfe8' : '#60a5fa';
    const pantsColor = isGirl ? '#1e293b' : '#334155';
    const shoeColor = isGirl ? '#f43f5e' : '#ea580c';
    const hairColor = isGirl ? '#7c2d12' : '#451a03';
    const skinTone = '#fed7aa';

    // Back Leg
    ctx.strokeStyle = pantsColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-legSwing * 0.7, -9 + legBend);
    ctx.lineTo(-legSwing, 0);
    ctx.stroke();

    // Back Sneaker
    ctx.fillStyle = shoeColor;
    ctx.beginPath();
    ctx.roundRect(-legSwing - 3, -4, 8, 4.5, 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-legSwing - 1, -2, 4, 1.5);

    // Front Leg
    ctx.strokeStyle = pantsColor;
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(legSwing * 0.7, -9 - legBend);
    ctx.lineTo(legSwing, 0);
    ctx.stroke();

    // Front Sneaker
    ctx.fillStyle = shoeColor;
    ctx.beginPath();
    ctx.roundRect(legSwing - 2, -4, 9, 4.5, 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(legSwing, -2, 5, 1.5);

    // Torso: Cadet Jacket
    ctx.fillStyle = jacketColor;
    ctx.strokeStyle = jacketTrim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-7, -38, 14, 20, 3);
    ctx.fill();
    ctx.stroke();

    // Inner White Tee & Collar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-3, -38);
    ctx.lineTo(3, -38);
    ctx.lineTo(0, -32);
    ctx.closePath();
    ctx.fill();

    // Indian Flag Insignia on Cadet Shoulder
    ctx.save();
    ctx.translate(-4, -34);
    ctx.fillStyle = '#FF9933'; ctx.fillRect(0, 0, 5, 1.2);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 1.2, 5, 1.2);
    ctx.fillStyle = '#138808'; ctx.fillRect(0, 2.4, 5, 1.2);
    ctx.restore();

    // Head & Neck
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(1, -44, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Face Eyes & Smile
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(3.5, -45, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(3, -42, 2.5, 0.1 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    // Hair & Headgear
    if (isGirl) {
      // Girl Cadet: Stylish Ponytail & Starlight Ribbon + Explorer Goggles
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(0, -45, 8, -Math.PI * 0.8, Math.PI * 0.4);
      ctx.fill();
      // Ponytail hanging back
      ctx.beginPath();
      ctx.moveTo(-5, -44);
      ctx.quadraticCurveTo(-14, -38, -12, -26);
      ctx.quadraticCurveTo(-9, -28, -5, -40);
      ctx.closePath();
      ctx.fill();
      // Ribbon
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(-6, -42, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Explorer Goggles on Forehead
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2, -51, 9, 3.5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, -50, 6, 2);
    } else {
      // Boy Cadet: Spiky Adventure Hair + Explorer Headband
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(0, -45, 8, -Math.PI * 0.85, Math.PI * 0.35);
      ctx.lineTo(2, -54);
      ctx.lineTo(4, -51);
      ctx.lineTo(7, -53);
      ctx.lineTo(6, -46);
      ctx.fill();
      // Explorer Headband
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(1, -45, 7.8, -Math.PI * 0.6, Math.PI * 0.1);
      ctx.stroke();
    }

    // Arms & Handheld Equipment Radar Scanner Device
    const armSwing = this.isGrounded ? -Math.sin(this.walkCycle) * 9 : -3;
    ctx.strokeStyle = jacketColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(armSwing * 0.6 + 3, -26);
    ctx.lineTo(armSwing + 6, -24);
    ctx.stroke();

    // Handheld Equipment Detector
    const deviceX = armSwing + 8;
    const deviceY = -24;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(deviceX - 2, deviceY - 4, 7, 6);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(deviceX, deviceY - 3, 4, 4);

    // Dynamic Scanner Radar Ping
    const pulseR = (Date.now() % 1200) / 1200 * 10;
    const pulseAlpha = Math.max(0, 1 - pulseR / 10);
    ctx.strokeStyle = `rgba(0, 229, 255, ${pulseAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(deviceX + 2, deviceY - 1, pulseR, 0, Math.PI * 2);
    ctx.stroke();
  }
}