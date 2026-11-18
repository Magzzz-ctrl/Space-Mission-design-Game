// Project Horizons: I Am Astronut - Multi-Astronaut Crew System (1 to 4 Players)
// Real-time Instant Co-op: Shared Single-Screen Keyboard Controls & Cross-Tab/Cross-Device Web Broadcast Sync

class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.crewSize = 1; // 1 to 4 active astronauts
    this.localPlayerSlot = 'p1'; // 'p1', 'p2', 'p3', 'p4'
    this.crew = {};
    this.channel = null;
    this.lastBroadcastTime = 0;
    this.reviveRadius = 65;

    // Crew Roles Definition & Colors (NASA Mission Roles)
    this.roles = {
      p1: {
        id: 'p1',
        title: 'Commander',
        prefix: 'P1',
        defaultCallsign: 'Cmdr. Orion',
        suitColor: 'cyan',
        visorTint: 'gold',
        crewColor: '#00e5ff',
        badge: 'MISSION COMMANDER',
        controls: 'WASD + Space + E (Interact) + F (Flag)'
      },
      p2: {
        id: 'p2',
        title: 'Mission Specialist',
        prefix: 'P2',
        defaultCallsign: 'Spec. Nova',
        suitColor: 'gold',
        visorTint: 'cyan',
        crewColor: '#facc15',
        badge: 'EVA SPECIALIST',
        controls: 'Arrow Keys + Enter + / (Interact) + . (Flag)'
      },
      p3: {
        id: 'p3',
        title: 'Flight Pilot',
        prefix: 'P3',
        defaultCallsign: 'Pilot Vega',
        suitColor: 'emerald',
        visorTint: 'emerald',
        crewColor: '#10b981',
        badge: 'PROPULSION PILOT',
        controls: 'IJKL + U (Jump) + O (Interact) + P (Flag)'
      },
      p4: {
        id: 'p4',
        title: 'Science Officer',
        prefix: 'P4',
        defaultCallsign: 'Sci. Cosmo',
        suitColor: 'violet',
        visorTint: 'violet',
        crewColor: '#c084fc',
        badge: 'ASTROPHYSICIST',
        controls: 'NumPad 8456 / TFGH + Y (Jump) + R/G (Interact) + B (Flag)'
      }
    };

    this.initBroadcastChannel();
    this.bindMultiplayerKeyboard();
  }

  initBroadcastChannel() {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('i_am_astronut_crew_channel');
        this.channel.onmessage = (event) => this.handleNetworkMessage(event.data);

        // Ping network to discover existing crew and claim an unoccupied slot
        this.channel.postMessage({
          type: 'CREW_HELLO',
          time: Date.now()
        });
      }
    } catch (e) {
      console.warn('[Multiplayer] BroadcastChannel not supported:', e);
    }
  }

  handleNetworkMessage(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'CREW_HELLO') {
      // Respond with our presence so new window knows which slots are taken
      if (this.channel) {
        this.channel.postMessage({
          type: 'CREW_HEARTBEAT',
          slot: this.localPlayerSlot,
          state: this.getLocalPlayerState()
        });
      }
    } else if (msg.type === 'CREW_HEARTBEAT' || msg.type === 'PLAYER_SYNC') {
      if (msg.slot && msg.slot !== this.localPlayerSlot) {
        this.syncRemoteAstronaut(msg.slot, msg.state);
      }
    } else if (msg.type === 'CREW_PART_COLLECTED') {
      if (this.game && this.game.world) {
        const item = this.game.world.equipmentPieces.find(p => p.id === msg.partId);
        if (item && !item.found) {
          item.found = true;
          if (this.game.storage) {
            this.game.storage.markPartCollected(this.game.currentPlanetId, msg.partId);
          }
          if (this.game.showToast) {
            this.game.showToast('CO-OP PAYLOAD SECURED', `${msg.slot.toUpperCase()} acquired ${item.name}!`);
          }
          this.game.updateHUD();
        }
      }
    } else if (msg.type === 'CREW_REVIVE') {
      if (msg.targetSlot === this.localPlayerSlot && this.game && this.game.player) {
        this.game.player.revive(this.game.player.x, this.game.player.y);
        this.game.showToast('💖 TEAM REVIVAL!', `${msg.reviverSlot.toUpperCase()} revived your life support!`);
      }
    } else if (msg.type === 'CREW_FLAG_PLANTED') {
      if (this.game && this.game.storage) {
        this.game.storage.plantFlag(msg.planetId, msg.x, msg.y);
        this.game.updateHUD();
      }
    }
  }

  getLocalPlayerState() {
    const p = this.game.player;
    if (!p) return null;
    return {
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      facing: p.facing,
      health: p.health,
      maxHealth: p.maxHealth,
      isDead: p.isDead,
      inRover: p.inRover,
      stage: p.stage,
      gender: p.gender,
      callsign: p.callsign,
      suitColor: p.suitColor,
      hasStartedMoving: p.hasStartedMoving
    };
  }

  setCrewSize(size) {
    this.crewSize = Math.max(1, Math.min(4, size));
    this.refreshCrewMembers();
    if (this.game.showToast) {
      this.game.showToast(`CREW EXPANDED // ${this.crewSize} ASTRONAUTS`, `NASA Expedition Roster Active: 1-${this.crewSize} Co-op Mode Enabled.`);
    }
    this.game.updateHUD();
  }

  refreshCrewMembers() {
    const spawnX = (this.game.world && this.game.world.rocket) ? this.game.world.rocket.x + 55 : 1005;
    const groundY = (this.game.world && typeof this.game.world.getGroundY === 'function') ? this.game.world.getGroundY(spawnX) : 520;

    // Ensure local player (P1) is properly configured
    if (this.game.player) {
      this.game.player.playerId = 'p1';
      this.game.player.role = this.roles.p1.title;
      this.game.player.playerRolePrefix = this.roles.p1.prefix;
      this.game.player.crewColor = this.roles.p1.crewColor;
      this.game.player.suitColor = this.roles.p1.suitColor;
      this.game.player.visorTint = this.roles.p1.visorTint;
    }

    // Spawn / Activate additional crew slots based on crewSize
    ['p2', 'p3', 'p4'].forEach((slotId, index) => {
      const targetActive = (index + 2) <= this.crewSize;
      if (targetActive) {
        if (!this.crew[slotId]) {
          const cfg = this.roles[slotId];
          const astro = new Astronaut(spawnX + (index + 1) * 35, groundY);
          astro.playerId = slotId;
          astro.role = cfg.title;
          astro.playerRolePrefix = cfg.prefix;
          astro.crewColor = cfg.crewColor;
          astro.suitColor = cfg.suitColor;
          astro.visorTint = cfg.visorTint;
          astro.callsign = cfg.defaultCallsign;
          astro.stage = this.game.player ? this.game.player.stage : 'cadet';
          this.crew[slotId] = astro;
        }
      } else {
        delete this.crew[slotId];
      }
    });
  }

  syncRemoteAstronaut(slotId, state) {
    if (!state) return;
    if (!this.crew[slotId]) {
      const cfg = this.roles[slotId] || this.roles.p2;
      const astro = new Astronaut(state.x || 1005, state.y || 520);
      astro.playerId = slotId;
      astro.role = cfg.title;
      astro.playerRolePrefix = cfg.prefix;
      astro.crewColor = cfg.crewColor;
      astro.suitColor = cfg.suitColor;
      astro.visorTint = cfg.visorTint;
      astro.callsign = state.callsign || cfg.defaultCallsign;
      this.crew[slotId] = astro;
      this.crewSize = Math.max(this.crewSize, Object.keys(this.crew).length + 1);
    }

    const member = this.crew[slotId];
    if (member) {
      member.x = state.x;
      member.y = state.y;
      member.vx = state.vx;
      member.vy = state.vy;
      member.facing = state.facing;
      member.health = state.health;
      member.maxHealth = state.maxHealth;
      member.isDead = state.isDead;
      member.inRover = state.inRover;
      member.stage = state.stage;
      member.callsign = state.callsign;
      member.hasStartedMoving = state.hasStartedMoving;
      if (state.hasStartedMoving && this.game.player) {
        this.game.player.hasStartedMoving = true;
      }
    }
  }

  bindMultiplayerKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Player 2 Controls (Arrow Keys, Enter/Slash, Period)
      if (this.crew.p2) {
        const p2 = this.crew.p2;
        if (e.code === 'ArrowLeft') { p2.keys.left = true; p2.hasStartedMoving = true; }
        if (e.code === 'ArrowRight') { p2.keys.right = true; p2.hasStartedMoving = true; }
        if (e.code === 'ArrowUp' || e.code === 'Numpad0') { p2.keys.jump = true; p2.hasStartedMoving = true; e.preventDefault(); }
        if (e.code === 'Slash' || e.code === 'Enter' || e.code === 'KeyM') {
          this.triggerCrewInteraction('p2');
          e.preventDefault();
        }
        if (e.code === 'Period') {
          this.triggerCrewPlantFlag('p2');
          e.preventDefault();
        }
      }

      // Player 3 Controls (I, J, K, L, U, O, P)
      if (this.crew.p3) {
        const p3 = this.crew.p3;
        if (e.code === 'KeyJ') { p3.keys.left = true; p3.hasStartedMoving = true; }
        if (e.code === 'KeyL') { p3.keys.right = true; p3.hasStartedMoving = true; }
        if (e.code === 'KeyI' || e.code === 'KeyU') { p3.keys.jump = true; p3.hasStartedMoving = true; }
        if (e.code === 'KeyO') {
          this.triggerCrewInteraction('p3');
        }
        if (e.code === 'KeyP') {
          this.triggerCrewPlantFlag('p3');
        }
      }

      // Player 4 Controls (NumPad 4, 6, 8, 5 or TFGH)
      if (this.crew.p4) {
        const p4 = this.crew.p4;
        if (e.code === 'Numpad4' || (!this.game.player.keys.left && e.code === 'KeyH')) { p4.keys.left = true; p4.hasStartedMoving = true; }
        if (e.code === 'Numpad6' || (!this.game.player.keys.right && e.code === 'KeyK')) { p4.keys.right = true; p4.hasStartedMoving = true; }
        if (e.code === 'Numpad8' || e.code === 'KeyY') { p4.keys.jump = true; p4.hasStartedMoving = true; }
        if (e.code === 'Numpad5' || e.code === 'KeyG') {
          this.triggerCrewInteraction('p4');
        }
        if (e.code === 'KeyB') {
          this.triggerCrewPlantFlag('p4');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.crew.p2) {
        const p2 = this.crew.p2;
        if (e.code === 'ArrowLeft') p2.keys.left = false;
        if (e.code === 'ArrowRight') p2.keys.right = false;
        if (e.code === 'ArrowUp' || e.code === 'Numpad0') p2.keys.jump = false;
      }
      if (this.crew.p3) {
        const p3 = this.crew.p3;
        if (e.code === 'KeyJ') p3.keys.left = false;
        if (e.code === 'KeyL') p3.keys.right = false;
        if (e.code === 'KeyI' || e.code === 'KeyU') p3.keys.jump = false;
      }
      if (this.crew.p4) {
        const p4 = this.crew.p4;
        if (e.code === 'Numpad4' || e.code === 'KeyH') p4.keys.left = false;
        if (e.code === 'Numpad6' || e.code === 'KeyK') p4.keys.right = false;
        if (e.code === 'Numpad8' || e.code === 'KeyY') p4.keys.jump = false;
      }
    });
  }

  triggerCrewInteraction(slotId) {
    const member = this.crew[slotId];
    if (!member || member.isDead) return;

    // 1. Check if standing near a fallen teammate to revive them!
    const allMembers = [this.game.player, ...Object.values(this.crew)];
    for (const mate of allMembers) {
      if (mate && mate !== member && mate.isDead) {
        const dist = Math.hypot(member.x - mate.x, member.y - mate.y);
        if (dist < this.reviveRadius) {
          mate.revive(mate.x, mate.y);
          if (this.game.soundEngine) this.game.soundEngine.playPickup();
          this.game.particles.emit('pickup_sparkle', mate.x, mate.y - 20, { count: 25, color: '#10b981' });
          this.game.showToast('💖 CO-OP REVIVAL!', `${member.callsign} revived ${mate.callsign}! Vital shields restored.`);
          if (this.channel) {
            this.channel.postMessage({
              type: 'CREW_REVIVE',
              reviverSlot: slotId,
              targetSlot: mate.playerId || 'p1'
            });
          }
          return;
        }
      }
    }

    // 2. Check if standing near uncollected equipment parts
    if (this.game.world && this.game.world.equipmentPieces) {
      for (const item of this.game.world.equipmentPieces) {
        if (!item.found) {
          const dist = Math.hypot(member.x - item.x, (member.y - 20) - item.y);
          if (dist < 85) {
            this.game.collectPart(item);
            if (this.channel) {
              this.channel.postMessage({
                type: 'CREW_PART_COLLECTED',
                slot: slotId,
                partId: item.id
              });
            }
            return;
          }
        }
      }
    }

    // 3. Check rocket interaction
    if (this.game.world && this.game.world.rocket) {
      const rx = this.game.world.rocket.x;
      const ry = this.game.world.rocket.y;
      if (Math.abs(member.x - rx) < 95 && Math.abs(member.y - ry) < 70) {
        const remaining = this.game.world.equipmentPieces.filter(p => !p.found).length;
        if (remaining === 0) {
          this.game.initiateLaunchSequence();
        }
      }
    }
  }

  triggerCrewPlantFlag(slotId) {
    const member = this.crew[slotId];
    if (!member || member.isDead) return;
    const px = Math.round(member.x);
    const py = Math.round(this.game.world.getGroundY(px));
    this.game.storage.plantFlag(this.game.currentPlanetId, px, py);
    this.game.particles.emit('pickup_sparkle', px, py - 30, { count: 18, color: '#FF9933' });
    this.game.particles.emit('pickup_sparkle', px, py - 30, { count: 18, color: '#138808' });
    this.game.showToast('🇮🇳 TIRANGA PLANTED!', `${member.callsign} planted Indian Flag on ${this.game.planetData.bodyName.toUpperCase()}!`);
    if (this.channel) {
      this.channel.postMessage({
        type: 'CREW_FLAG_PLANTED',
        slot: slotId,
        planetId: this.game.currentPlanetId,
        x: px,
        y: py
      });
    }
    this.game.updateHUD();
  }

  update(world, planetData, particles) {
    const now = performance.now();

    // Broadcast local player state to network peers (every 50ms)
    if (this.channel && now - this.lastBroadcastTime > 50) {
      this.lastBroadcastTime = now;
      this.channel.postMessage({
        type: 'PLAYER_SYNC',
        slot: this.localPlayerSlot,
        state: this.getLocalPlayerState()
      });
    }

    // Update active crew members physics
    Object.values(this.crew).forEach(member => {
      if (member) {
        member.update(world, planetData, particles);
        // If any teammate moves, set hasStartedMoving on game
        if (member.hasStartedMoving && this.game.player) {
          this.game.player.hasStartedMoving = true;
        }
      }
    });
  }

  render(ctx, camX, camY, planetData) {
    Object.values(this.crew).forEach(member => {
      if (member) {
        member.render(ctx, camX, camY, planetData);
      }
    });
  }

  // Returns list of all active astronauts for HUD
  getActiveRoster() {
    const roster = [
      {
        slot: 'p1',
        name: this.game.player ? this.game.player.callsign : 'Cmdr. Orion',
        role: 'Commander',
        color: this.roles.p1.crewColor,
        health: this.game.player ? this.game.player.health : 100,
        isDead: this.game.player ? this.game.player.isDead : false,
        isActive: true
      }
    ];

    ['p2', 'p3', 'p4'].forEach(slotId => {
      const active = !!this.crew[slotId];
      const m = this.crew[slotId];
      const cfg = this.roles[slotId];
      roster.push({
        slot: slotId,
        name: m ? m.callsign : cfg.defaultCallsign,
        role: cfg.title,
        color: cfg.crewColor,
        health: m ? m.health : 100,
        isDead: m ? m.isDead : false,
        isActive: active,
        controls: cfg.controls
      });
    });

    return roster;
  }
}

window.MultiplayerManager = MultiplayerManager;
