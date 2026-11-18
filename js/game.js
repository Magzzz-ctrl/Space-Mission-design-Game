// Project Horizons: Space Mission Design Game - Coordinator & Game Engine

// =========================================================================
// ASTEROID STORM & METEOR SHOWER HAZARD SYSTEM
// Astronaut must evade falling asteroids to lower rocket deflector shield!
// =========================================================================
class AsteroidStormManager {
  constructor(game) {
    this.game = game;
    this.isActive = false;
    this.isCleared = false;
    this.asteroids = [];
    this.totalAsteroids = 8;
    this.spawnedCount = 0;
    this.evadedCount = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 75;
    this.scorchMarks = [];
  }

  reset() {
    this.isActive = false;
    this.isCleared = false;
    this.asteroids = [];
    this.spawnedCount = 0;
    this.evadedCount = 0;
    this.spawnTimer = 0;
    this.scorchMarks = [];
    if (this.game.world) this.game.world.rocketShieldActive = false;
  }

  start(count = 8) {
    const diffMode = this.game.storage?.getDifficulty?.() || 'moderate';
    const diffCfg = (window.GAME_DIFFICULTY_MODES && window.GAME_DIFFICULTY_MODES[diffMode]) || { asteroidCountMultiplier: 1.0 };
    const scaledCount = Math.max(3, Math.round(count * (diffCfg.asteroidCountMultiplier || 1.0)));

    this.isActive = true;
    this.isCleared = false;
    this.totalAsteroids = scaledCount;
    this.spawnedCount = 0;
    this.evadedCount = 0;
    this.asteroids = [];
    this.spawnTimer = 25;
    if (this.game.world) this.game.world.rocketShieldActive = true;

    if (window.soundEngine && typeof window.soundEngine.playWarningSiren === 'function') {
      window.soundEngine.playWarningSiren();
    }
    this.game.showToast('☄️ METEOR SHOWER DETECTED!', `Falling asteroids incoming! [${diffMode.toUpperCase()} MODE] Dodge and escape all to access the rocket.`);
  }

  addWave(count = 3, targetXOverride = null) {
    this.isActive = true;
    this.isCleared = false;
    this.totalAsteroids = (this.spawnedCount >= this.totalAsteroids) 
      ? this.evadedCount + count 
      : this.totalAsteroids + count;
    this.spawnTimer = 10;
    if (this.game.world) this.game.world.rocketShieldActive = true;

    if (window.soundEngine && typeof window.soundEngine.playWarningSiren === 'function') {
      window.soundEngine.playWarningSiren();
    }

    // Spawn first asteroid immediately
    this.spawnAsteroid(targetXOverride);
  }

  spawnAsteroid(targetXOverride = null) {
    this.spawnedCount++;
    const playerX = (this.game.player && !isNaN(this.game.player.x)) ? this.game.player.x : 1005;

    // Angle of arrival towards astronaut's sector or specified part location
    let targetX;
    if (targetXOverride !== null && !isNaN(targetXOverride)) {
      targetX = targetXOverride + (Math.random() * 2 - 1) * 35;
    } else {
      const offset = (Math.random() * 2 - 1) * 120 + (Math.random() < 0.5 ? 30 : -30);
      targetX = playerX + offset;
    }

    const worldW = (this.game.world && this.game.world.worldWidth) ? this.game.world.worldWidth : 3200;
    targetX = Math.max(80, Math.min(worldW - 80, targetX));
    const targetY = (this.game.world && typeof this.game.world.getGroundY === 'function') 
      ? this.game.world.getGroundY(targetX) 
      : 520;

    const spawnHeight = 580;
    const spawnAngle = (Math.random() - 0.5) * 180;
    const spawnX = targetX + spawnAngle;
    const spawnY = targetY - spawnHeight;

    const diffMode = this.game.storage?.getDifficulty?.() || 'moderate';
    const diffCfg = (window.GAME_DIFFICULTY_MODES && window.GAME_DIFFICULTY_MODES[diffMode]) || { asteroidSpeedMultiplier: 1.0 };
    const baseSpeed = 8.5 + Math.random() * 3.5;
    const speed = baseSpeed * (diffCfg.asteroidSpeedMultiplier || 1.0);

    const rawDist = Math.hypot(targetX - spawnX, targetY - spawnY);
    const dist = (rawDist && !isNaN(rawDist)) ? rawDist : 500;
    const vx = ((targetX - spawnX) / dist) * speed;
    const vy = ((targetY - spawnY) / dist) * speed;

    this.asteroids.push({
      id: 'ast_' + Date.now() + '_' + Math.random(),
      x: spawnX,
      y: spawnY,
      vx: isNaN(vx) ? 0 : vx,
      vy: isNaN(vy) ? speed : vy,
      targetX: targetX,
      targetY: targetY,
      radius: 14 + Math.random() * 12,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.16
    });

    if (window.soundEngine && typeof window.soundEngine.playAsteroidWhoosh === 'function') {
      window.soundEngine.playAsteroidWhoosh();
    }
  }

  update(dt) {
    if (!this.isActive) return;

    // Movement Gating: Asteroids ONLY fall after player starts to move!
    if (this.game.player && !this.game.player.hasStartedMoving) return;

    // Fade scorch marks
    for (let i = this.scorchMarks.length - 1; i >= 0; i--) {
      this.scorchMarks[i].alpha -= 0.0012;
      if (this.scorchMarks[i].alpha <= 0) {
        this.scorchMarks.splice(i, 1);
      }
    }

    // Spawning timer
    if (this.spawnedCount < this.totalAsteroids) {
      this.spawnTimer--;
      if (this.spawnTimer <= 0) {
        this.spawnAsteroid();
        this.spawnTimer = this.spawnInterval + Math.floor(Math.random() * 40 - 20);
      }
    }

    // Update active asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.x += ast.vx;
      ast.y += ast.vy;
      ast.rot += ast.rotSpeed;

      // Particle tail
      if (Math.random() < 0.85) {
        this.game.particles.emit('rocket_fire', ast.x, ast.y, {
          count: 2,
          spreadX: 8,
          spreadY: 8,
          vy: -ast.vy * 0.25,
          color: Math.random() > 0.4 ? '#f97316' : '#facc15',
          size: 7
        });
      }

      // Ground collision
      const groundY = this.game.world.getGroundY(ast.x);
      if (ast.y >= groundY - 4) {
        this.impactGround(ast, groundY);
        this.asteroids.splice(i, 1);
        continue;
      }

      // Check collision with player
      const px = this.game.player.x;
      const py = this.game.player.y - 25;
      const dist = Math.hypot(ast.x - px, ast.y - py);
      if (dist < ast.radius + 18) {
        this.hitPlayer(ast);
        this.impactGround(ast, groundY);
        this.asteroids.splice(i, 1);
        continue;
      }
    }

    // Check storm complete
    if (this.spawnedCount >= this.totalAsteroids && this.asteroids.length === 0) {
      this.completeStorm();
    }
  }

  hitPlayer(ast) {
    const pushDir = this.game.player.x >= ast.x ? 1 : -1;
    this.game.player.vx = pushDir * 9.5;
    this.game.player.vy = -7.5;
    this.game.player.isGrounded = false;

    // Apply Direct Asteroid Kinetic Damage (35 HP)
    this.game.player.takeDamage(35, 'direct_asteroid_hit');

    this.game.camera.addShake(22);
    if (window.soundEngine && typeof window.soundEngine.playAsteroidExplosion === 'function') {
      window.soundEngine.playAsteroidExplosion();
    }
    this.game.showToast('⚠️ DIRECT ASTEROID HIT!', 'Suit shields absorbed blast impact! [-35 HP] Keep moving to survive!');
    this.game.updateHUD();
  }

  impactGround(ast, groundY) {
    this.game.camera.addShake(12);

    if (window.soundEngine && typeof window.soundEngine.playAsteroidExplosion === 'function') {
      window.soundEngine.playAsteroidExplosion();
    }

    this.game.particles.emit('rocket_fire', ast.x, groundY, {
      count: 12,
      spreadX: 18,
      spreadY: 8,
      vy: -5 - Math.random() * 4,
      color: '#f97316',
      size: 10
    });
    this.game.particles.emit('smoke', ast.x, groundY, {
      count: 10,
      spreadX: 24,
      spreadY: 10,
      vy: -2 - Math.random() * 3,
      color: 'rgba(100, 116, 139, 0.6)',
      size: 16
    });
    this.game.particles.emit('sparks', ast.x, groundY, {
      count: 20,
      color: '#facc15',
      gravity: 0.15
    });

    this.scorchMarks.push({
      x: ast.x,
      y: groundY,
      radius: ast.radius * 1.4,
      alpha: 0.95
    });

    // Check shockwave proximity blast damage to player (within 85px radius)
    if (this.game.player && !this.game.player.isDead) {
      const px = this.game.player.x;
      const py = this.game.player.y - 20;
      const dist = Math.hypot(ast.x - px, groundY - py);
      if (dist < 85) {
        this.game.player.takeDamage(15, 'asteroid_shockwave');
        this.game.showToast('⚠️ METEOR BLAST SHOCKWAVE!', 'Nearby ground detonation ruptured outer thermal layer! [-15 HP]');
        this.game.updateHUD();
      }
    }

    this.evadedCount++;
    this.game.showToast('☄️ ASTEROID EVADED!', `Dodged falling meteor! [${this.evadedCount}/${this.totalAsteroids} Evaded]`);
  }

  completeStorm() {
    this.isActive = false;
    this.isCleared = true;
    if (this.game.world) {
      this.game.world.rocketShieldActive = false;
      const rx = this.game.world.rocket.x;
      const ry = this.game.world.rocket.y - 75;
      this.game.particles.emit('pickup_sparkle', rx, ry, {
        count: 45,
        color: '#00e5ff',
        size: 5
      });
    }

    if (window.soundEngine && typeof window.soundEngine.playBadgeUnlock === 'function') {
      window.soundEngine.playBadgeUnlock();
    }

    if (this.game.storage.unlockBadge('badge_asteroid_evader')) {
      this.game.showBadgeNotification('badge_asteroid_evader');
    }

    this.game.showToast('🎉 ASTEROID STORM ESCAPED!', 'Rocket deflector shield dropped. Boarding hatch is now 100% accessible!');
    this.game.updateHUD();
  }
}

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.asteroidStorm = new AsteroidStormManager(this);
    this.storage = window.storageManager || {
      data: {
        currentPlanet: 'earth',
        unlockedPlanets: ['earth', 'moon_south'],
        completedPlanets: [],
        characterStage: 'cadet',
        characterGender: 'boy',
        plantedFlags: {},
        partsCollected: { earth: [], moon_south: [], moon: [], mars: [], europa: [], titan: [] },
        missionStars: { earth: 0, moon_south: 0, moon: 0, mars: 0, europa: 0, titan: 0 },
        profile: { callsign: 'Cadet Orion', suitColor: 'white', visorTint: 'gold' },
        unlockedBadges: [],
        totalStars: 0,
        gatewayDismissed: true
      },
      setCurrentPlanet: () => {},
      markPartCollected: () => {},
      markPlanetCompleted: () => {},
      awardStar: () => false,
      getTotalStars: () => 0,
      unlockBadge: () => false,
      updateProfile: () => {},
      setProfile: () => {},
      dismissGateway: () => {},
      hasPlantedFlag: () => false,
      plantFlag: () => {},
      isLoggedIn: () => true,
      promoteToAstronaut: () => {}
    };
    this.currentPlanetId = (this.storage.data && this.storage.data.currentPlanet) || 'earth';
    this.planetData = PLANETARY_DESTINATIONS[this.currentPlanetId] || PLANETARY_DESTINATIONS.earth;

    this.world = null;
    this.player = null;
    this.camera = new Camera();
    this.particles = new ParticleSystem();
    this.starMap = null;
    this.realisticEnv = null;

    this.gameState = 'EXPLORING'; // 'EXPLORING', 'REPAIRING', 'LAUNCHING', 'LANDING'
    this.landingAltitude = 0;
    this.landingSpeed = 0;
    this.missionStartTime = Date.now();

    // Interaction Prompt state
    this.activePrompt = null;

    // Toast Queue
    this.toastTimeout = null;

    // Animation Loop
    this.lastTime = 0;
    this.rafId = null;
  }

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Handle high DPI
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Initialize Star Map
    this.starMap = new StarMapOverlay(this);
    this.starMap.init();

    // Initialize Realistic Planetary 3D Environment Visualizer
    if (typeof RealisticPlanetaryEnvironment !== 'undefined') {
      this.realisticEnv = new RealisticPlanetaryEnvironment(this);
    }

    // Load Initial World & Player
    this.loadPlanet(this.currentPlanetId, false);

    // Setup User Controls & Modals
    this.bindKeyboardControls();
    this.bindTouchControls();
    this.bindDashboardButtons();
    this.bindModalCloseHandlers();
    this.bindAudioToggle();
    this.bindProfileCustomizer();
    this.bindGatewayModal();

    // Audio context warmup on first interaction
    const warmupAudio = () => {
      if (window.soundEngine) {
        window.soundEngine.ensureContext();
        window.soundEngine.setPlanetAmbient(this.currentPlanetId);
      }
      window.removeEventListener('keydown', warmupAudio);
      window.removeEventListener('click', warmupAudio);
      window.removeEventListener('touchstart', warmupAudio);
    };
    window.addEventListener('keydown', warmupAudio);
    window.addEventListener('click', warmupAudio);
    window.addEventListener('touchstart', warmupAudio);

    // Start Game Loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);

    // Startup Login Modal (User Requirement: "to get into the website first user has to login so open a login page")
    let hasEntered = false;
    try { hasEntered = sessionStorage.getItem('I_AM_ASTRONAUT_ENTERED') === 'true'; } catch (e) {}
    if (!hasEntered) {
      setTimeout(() => {
        this.openGatewayModal();
      }, 200);
    } else {
      setTimeout(() => {
        this.showToast(`MISSION DISPATCH: ${this.planetData.bodyName.toUpperCase()}`, 'NASA Ground Telemetry Active');
      }, 400);
    }
  }

  resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.camera.resize(w, h);
  }

  loadPlanet(planetId, isLandingAnimation = true) {
    if (!planetId || !PLANETARY_DESTINATIONS[planetId]) {
      planetId = 'earth';
    }
    this.currentPlanetId = planetId;
    this.planetData = PLANETARY_DESTINATIONS[planetId];
    if (this.storage && typeof this.storage.setCurrentPlanet === 'function') {
      this.storage.setCurrentPlanet(planetId);
    }
    this.missionStartTime = Date.now();

    // Create World
    this.world = new World(this.planetData);

    // Check saved collected parts for this planet
    const savedParts = this.storage.data.partsCollected[planetId] || [];
    this.world.equipmentPieces.forEach(item => {
      if (savedParts.includes(item.id)) {
        item.found = true;
      }
    });

    // Check if planet was already completed
    if (this.storage.data.completedPlanets.includes(planetId) || savedParts.length >= 3) {
      this.world.rocket.state = 'READY';
      this.world.rocket.repairedPartsCount = 3;
    }

    // Spawn player at rocket location
    const spawnX = this.world.rocket.x + 55;
    const spawnY = this.world.getGroundY(spawnX);
    if (!this.player) {
      this.player = new Astronaut(spawnX, spawnY);
    } else {
      this.player.reset(spawnX, spawnY);
    }

    // Set player stage based on progression
    if (this.currentPlanetId !== 'earth') {
      this.player.stage = 'astronaut';
    } else {
      this.player.stage = this.storage.data.characterStage || 'cadet';
    }

    // Immediately snap camera to player and rocket on initial frame
    this.camera.x = Math.max(0, spawnX - this.camera.viewportWidth / 2);
    this.camera.y = spawnY - this.camera.viewportHeight * 0.58;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;

    // Apply Profile Customization
    this.player.setProfile(this.storage.data.profile);

    // Automated Asteroids Tracking State
    this.hasTriggeredAutoAsteroids = false;
    this.nearPartAttackCooldown = 0;
    this.autoAsteroidTimer = 240;
    if (this.asteroidStorm) this.asteroidStorm.reset();

    if (window.soundEngine) {
      window.soundEngine.setPlanetAmbient(planetId);
    }

    // Update HUD
    this.updateHUD();

    if (isLandingAnimation) {
      this.gameState = 'LANDING';
      this.landingAltitude = 400;
      this.landingSpeed = 8;
      this.world.rocket.launchAltitude = this.landingAltitude;
      if (window.soundEngine) window.soundEngine.playLaunch();
    } else {
      this.gameState = 'EXPLORING';
      this.checkPlanetArrivalBadge(planetId);
    }

    // Special NASA Lunar South Pole Flagship Mission Highlight
    if (planetId === 'moon_south') {
      setTimeout(() => {
        this.showToast('🌕 NASA FLAGSHIP // LUNAR SOUTH POLE', 'Historic Landing at Malapert A (80°S)! Explore permanently shadowed craters for cryogenic water ice!');
      }, 1400);
    }
  }

  setDifficulty(mode) {
    if (this.storage && typeof this.storage.setDifficulty === 'function') {
      this.storage.setDifficulty(mode);
    }
    if (this.player && typeof this.player.applyDifficulty === 'function') {
      this.player.applyDifficulty(mode);
    }
    const diffCfg = window.GAME_DIFFICULTY_MODES?.[mode] || { name: mode.toUpperCase(), icon: '⚡' };
    this.showToast(`DIFFICULTY: ${diffCfg.name}`, `${diffCfg.icon} ${diffCfg.subtitle}: Max Health ${diffCfg.maxHealth} HP.`);
    this.updateHUD();
  }

  triggerAsteroidStorm(count = 8) {
    if (this.asteroidStorm) {
      this.asteroidStorm.start(count);
    }
  }

  bindKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.player.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.player.keys.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        this.player.keys.jump = true;
        e.preventDefault();
      }
      if (e.code === 'KeyE' || e.code === 'Enter') {
        this.triggerInteraction();
        e.preventDefault();
      }
      if (e.code === 'KeyR') {
        if (this.player && this.player.isDead) {
          this.restartGame();
        } else {
          this.toggleRover();
        }
        e.preventDefault();
      }
      if (e.code === 'KeyF') {
        this.plantIndianFlag();
        e.preventDefault();
      }
      if (e.code === 'KeyX') {
        this.resetCurrentMission(false);
        e.preventDefault();
      }
      if (e.code === 'KeyT') {
        this.triggerAsteroidStorm(8);
        e.preventDefault();
      }
      if (e.code === 'KeyV') {
        if (this.realisticEnv) {
          this.realisticEnv.toggle(this.currentPlanetId);
        }
        e.preventDefault();
      }
      if (e.code === 'Escape') {
        this.closeAllModals();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.player.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.player.keys.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') this.player.keys.jump = false;
    });
  }

  bindTouchControls() {
    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');
    const btnJump = document.getElementById('touch-jump');
    const btnAction = document.getElementById('touch-action');

    const addTouchListeners = (el, onDown, onUp) => {
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
      el.addEventListener('mousedown', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('mouseup', (e) => { e.preventDefault(); onUp(); });
      el.addEventListener('mouseleave', (e) => { onUp(); });
    };

    addTouchListeners(btnLeft, () => { this.player.keys.left = true; }, () => { this.player.keys.left = false; });
    addTouchListeners(btnRight, () => { this.player.keys.right = true; }, () => { this.player.keys.right = false; });
    addTouchListeners(btnJump, () => { this.player.keys.jump = true; }, () => { this.player.keys.jump = false; });

    if (btnAction) {
      btnAction.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerInteraction();
      });
      btnAction.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.triggerInteraction();
      });
    }
  }

  setActiveNav(activeId) {
    ['nav-starmap', 'nav-badges', 'nav-mission'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === activeId) el.classList.add('active');
        else el.classList.remove('active');
      }
    });
  }

  toggleDifficulty() {
    const modes = ['easy', 'moderate', 'difficult'];
    const current = (this.storage && this.storage.getDifficulty) ? this.storage.getDifficulty() : 'moderate';
    const nextIdx = (modes.indexOf(current) + 1) % modes.length;
    this.setDifficulty(modes[nextIdx]);
  }

  bindDashboardButtons() {
    // Primary navigation buttons
    const btnStarMap = document.getElementById('nav-starmap');
    const btnBadges = document.getElementById('nav-badges');
    const btnMission = document.getElementById('nav-mission');
    const btnNavReset = document.getElementById('nav-reset');

    // Header HUD action buttons
    const hudDiffBtn = document.getElementById('hud-difficulty-btn');
    const hudResetBtn = document.getElementById('hud-reset-btn');
    const hudLoginBtn = document.getElementById('hud-login-btn');
    const hudGatewayBtn = document.getElementById('hud-gateway-btn');

    if (btnStarMap) {
      btnStarMap.addEventListener('click', () => {
        this.openStarMap();
      });
    }

    if (btnBadges) {
      btnBadges.addEventListener('click', () => {
        this.openBadgesModal();
      });
    }

    if (btnMission) {
      btnMission.addEventListener('click', () => {
        this.openMissionBriefModal();
      });
    }

    // Reset Options in Dashboard & Navigation
    if (btnNavReset) {
      btnNavReset.addEventListener('click', () => {
        this.resetCurrentMission(false);
      });
    }

    if (hudResetBtn) {
      hudResetBtn.addEventListener('click', () => {
        this.resetCurrentMission(false);
      });
    }

    // Difficulty Level Toggle Button in Dashboard HUD
    if (hudDiffBtn) {
      hudDiffBtn.addEventListener('click', () => {
        this.toggleDifficulty();
      });
    }

    // Cadet Login & Account Portal
    if (hudLoginBtn) {
      hudLoginBtn.addEventListener('click', () => {
        this.openGatewayModal();
      });
    }

    if (hudGatewayBtn) {
      hudGatewayBtn.addEventListener('click', () => {
        this.openGatewayModal();
      });
    }
  }

  bindModalCloseHandlers() {
    // Badges Modal Close
    const closeBadgesBtn = document.getElementById('badges-close-btn');
    const badgesModal = document.getElementById('badges-modal');
    if (closeBadgesBtn) {
      closeBadgesBtn.addEventListener('click', () => {
        if (badgesModal) badgesModal.classList.remove('open');
        this.setActiveNav(null);
      });
    }
    if (badgesModal) {
      badgesModal.addEventListener('click', (e) => {
        if (e.target === badgesModal) {
          badgesModal.classList.remove('open');
          this.setActiveNav(null);
        }
      });
    }

    // Mission Brief Modal Close
    const closeBriefBtn = document.getElementById('brief-close-btn');
    const briefModal = document.getElementById('brief-modal');
    if (closeBriefBtn) {
      closeBriefBtn.addEventListener('click', () => {
        if (briefModal) briefModal.classList.remove('open');
        this.setActiveNav(null);
      });
    }
    if (briefModal) {
      briefModal.addEventListener('click', (e) => {
        if (e.target === briefModal) {
          briefModal.classList.remove('open');
          this.setActiveNav(null);
        }
      });
    }

    // Collectible Card Modal Close
    const closeCardBtn = document.getElementById('card-modal-close-btn');
    const cardModal = document.getElementById('collectible-card-modal');
    if (closeCardBtn && cardModal) {
      closeCardBtn.addEventListener('click', () => cardModal.classList.remove('open'));
      cardModal.addEventListener('click', (e) => {
        if (e.target === cardModal) cardModal.classList.remove('open');
      });
    }
  }

  closeAllModals() {
    if (this.starMap && this.starMap.isOpen) this.starMap.close();
    ['badges-modal', 'brief-modal', 'gateway-modal', 'profile-modal', 'collectible-card-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('open');
    });
    this.setActiveNav(null);
  }

  // Cadet Login & Mission Portal Authentication (User Requirement 3 & 10)
  bindGatewayModal() {
    const gatewayModal = document.getElementById('gateway-modal');
    if (!gatewayModal) return;

    let selectedAuthTab = 'login'; // 'login', 'signup', 'reset'
    let selectedGender = this.storage?.data?.characterGender || 'boy';
    let selectedDiff = (this.storage && this.storage.getDifficulty) ? this.storage.getDifficulty() : 'moderate';

    const tabLogin = document.getElementById('tab-auth-login');
    const tabSignup = document.getElementById('tab-auth-signup');
    const tabReset = document.getElementById('tab-auth-reset');
    const btnGenderBoy = document.getElementById('auth-gender-boy');
    const btnGenderGirl = document.getElementById('auth-gender-girl');
    const btnDiffEasy = document.getElementById('auth-diff-easy');
    const btnDiffMod = document.getElementById('auth-diff-moderate');
    const btnDiffDiff = document.getElementById('auth-diff-difficult');
    const inputUser = document.getElementById('gateway-input-user');
    const inputPass = document.getElementById('gateway-input-pass');
    const btnSubmit = document.getElementById('gateway-btn-submit');
    const btnPlayGuest = document.getElementById('gateway-btn-play');
    const btnClose = document.getElementById('gateway-btn-close');
    const btnResetSector = document.getElementById('gateway-btn-reset-sector');
    const btnResetAll = document.getElementById('gateway-btn-reset-all');
    const errBox = document.getElementById('gateway-auth-error');
    const resetSection = document.getElementById('auth-reset-section');

    const updateTabs = () => {
      if (tabLogin) tabLogin.className = selectedAuthTab === 'login' ? 'flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)] cursor-pointer' : 'flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs text-slate-400 hover:text-white cursor-pointer';
      if (tabSignup) tabSignup.className = selectedAuthTab === 'signup' ? 'flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs bg-cyan-500 text-slate-950 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.6)] cursor-pointer' : 'flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs text-slate-400 hover:text-white cursor-pointer';
      if (tabReset) tabReset.className = selectedAuthTab === 'reset' ? 'flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs bg-slate-700 text-cyan-300 cursor-pointer' : 'flex-1 py-1.5 rounded-lg font-orbitron font-bold text-xs text-slate-400 hover:text-white cursor-pointer';

      if (btnSubmit) {
        btnSubmit.textContent = selectedAuthTab === 'signup' ? '✨ CREATE ACCOUNT & LAUNCH' : (selectedAuthTab === 'reset' ? '🔄 SAVE PREFERENCES' : '🚀 LOGIN & COMMENCE MISSION');
      }
      if (resetSection) {
        if (selectedAuthTab === 'reset') resetSection.scrollIntoView({ behavior: 'smooth' });
      }
      if (errBox) errBox.classList.add('hidden');
    };

    if (tabLogin) tabLogin.addEventListener('click', () => { selectedAuthTab = 'login'; updateTabs(); });
    if (tabSignup) tabSignup.addEventListener('click', () => { selectedAuthTab = 'signup'; updateTabs(); });
    if (tabReset) tabReset.addEventListener('click', () => { selectedAuthTab = 'reset'; updateTabs(); });

    // Gender selection
    const updateGenderUI = () => {
      if (btnGenderBoy) {
        btnGenderBoy.className = selectedGender === 'boy' 
          ? 'p-2.5 rounded-xl border border-cyan-400 bg-cyan-950/40 text-left flex items-center gap-2.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]'
          : 'p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-left flex items-center gap-2.5 cursor-pointer';
      }
      if (btnGenderGirl) {
        btnGenderGirl.className = selectedGender === 'girl'
          ? 'p-2.5 rounded-xl border border-pink-400 bg-pink-950/40 text-left flex items-center gap-2.5 cursor-pointer shadow-[0_0_12px_rgba(244,114,182,0.3)]'
          : 'p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-left flex items-center gap-2.5 cursor-pointer';
      }
    };
    if (btnGenderBoy) btnGenderBoy.addEventListener('click', () => { selectedGender = 'boy'; updateGenderUI(); });
    if (btnGenderGirl) btnGenderGirl.addEventListener('click', () => { selectedGender = 'girl'; updateGenderUI(); });

    // Difficulty selection
    const updateDiffUI = () => {
      if (btnDiffEasy) btnDiffEasy.className = selectedDiff === 'easy' ? 'py-2 px-1 rounded-lg border border-emerald-400 bg-emerald-950/40 text-emerald-300 font-orbitron text-[10px] font-bold text-center cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'py-2 px-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 font-orbitron text-[10px] font-bold text-center cursor-pointer';
      if (btnDiffMod) btnDiffMod.className = selectedDiff === 'moderate' ? 'py-2 px-1 rounded-lg border border-amber-400 bg-amber-950/40 text-amber-300 font-orbitron text-[10px] font-bold text-center cursor-pointer shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'py-2 px-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 font-orbitron text-[10px] font-bold text-center cursor-pointer';
      if (btnDiffDiff) btnDiffDiff.className = selectedDiff === 'difficult' ? 'py-2 px-1 rounded-lg border border-red-500 bg-red-950/40 text-red-300 font-orbitron text-[10px] font-bold text-center cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'py-2 px-1 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 font-orbitron text-[10px] font-bold text-center cursor-pointer';
    };
    if (btnDiffEasy) btnDiffEasy.addEventListener('click', () => { selectedDiff = 'easy'; updateDiffUI(); this.setDifficulty('easy'); });
    if (btnDiffMod) btnDiffMod.addEventListener('click', () => { selectedDiff = 'moderate'; updateDiffUI(); this.setDifficulty('moderate'); });
    if (btnDiffDiff) btnDiffDiff.addEventListener('click', () => { selectedDiff = 'difficult'; updateDiffUI(); this.setDifficulty('difficult'); });

    // Submit handler (Login or Register)
    const executeAuth = () => {
      const uName = (inputUser && inputUser.value.trim()) || (this.storage?.data?.profile?.callsign) || 'Cadet Orion';
      const uPass = (inputPass && inputPass.value) || '123456';

      let result;
      if (selectedAuthTab === 'signup') {
        result = this.storage.register(uName, '', uPass, selectedGender);
      } else {
        result = this.storage.login(uName, uPass);
      }

      if (!result.success) {
        if (errBox) {
          errBox.textContent = result.error || 'Authentication error. Please check credentials.';
          errBox.classList.remove('hidden');
        }
        return;
      }

      this.storage.setCadetGender(selectedGender);
      this.setDifficulty(selectedDiff);
      if (this.player) {
        this.player.callsign = uName;
        this.player.gender = selectedGender;
      }
      try { sessionStorage.setItem('I_AM_ASTRONAUT_ENTERED', 'true'); } catch (e) {}

      gatewayModal.classList.remove('open');
      if (window.soundEngine) window.soundEngine.playTargetLock();
      this.showToast(`WELCOME CADET ${uName.toUpperCase()}!`, `Starting on Earth foot EVA. Locate 3 rocket equipment pieces!`);
      this.updateHUD();
    };

    if (btnSubmit) btnSubmit.addEventListener('click', executeAuth);

    // Instant Guest Pass
    const executeGuest = () => {
      const uName = (inputUser && inputUser.value.trim()) || (this.storage?.data?.profile?.callsign) || 'Cadet Orion';
      this.storage.loginGuest(uName, selectedGender);
      this.setDifficulty(selectedDiff);
      if (this.player) {
        this.player.callsign = uName;
        this.player.gender = selectedGender;
      }
      try { sessionStorage.setItem('I_AM_ASTRONAUT_ENTERED', 'true'); } catch (e) {}

      gatewayModal.classList.remove('open');
      if (window.soundEngine) window.soundEngine.playTargetLock();
      this.showToast(`CADET ${uName.toUpperCase()}: GUEST PASS`, 'Telemetry nominal. Recover the 3 hidden rocket parts!');
      this.updateHUD();
    };

    if (btnPlayGuest) btnPlayGuest.addEventListener('click', executeGuest);
    if (btnClose) btnClose.addEventListener('click', executeGuest);

    // Reset Buttons inside Modal
    if (btnResetSector) {
      btnResetSector.addEventListener('click', () => {
        this.resetCurrentMission(false);
        gatewayModal.classList.remove('open');
      });
    }
    if (btnResetAll) {
      btnResetAll.addEventListener('click', () => {
        this.resetCurrentMission(true);
        gatewayModal.classList.remove('open');
      });
    }
  }

  // Profile Customizer (Pic 5 Inspired)
  bindProfileCustomizer() {
    const profileModal = document.getElementById('profile-modal');
    const closeBtn = document.getElementById('profile-close-btn');
    const saveBtn = document.getElementById('profile-save-btn');
    const callsignInput = document.getElementById('profile-callsign-input');
    const hudProfileBtn = document.getElementById('hud-profile-btn');

    if (hudProfileBtn) {
      hudProfileBtn.addEventListener('click', () => {
        this.openProfileModal();
      });
    }

    if (closeBtn && profileModal) {
      closeBtn.addEventListener('click', () => profileModal.classList.remove('open'));
    }

    // Color Swatches
    document.querySelectorAll('.profile-suit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        document.querySelectorAll('.profile-suit-btn').forEach(b => b.classList.remove('ring-2', 'ring-cyan-400'));
        btn.classList.add('ring-2', 'ring-cyan-400');
        this.player.suitColor = color;
        this.renderProfilePreview();
      });
    });

    // Visor Tint Swatches
    document.querySelectorAll('.profile-visor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tint = btn.getAttribute('data-tint');
        document.querySelectorAll('.profile-visor-btn').forEach(b => b.classList.remove('ring-2', 'ring-cyan-400'));
        btn.classList.add('ring-2', 'ring-cyan-400');
        this.player.visorTint = tint;
        this.renderProfilePreview();
      });
    });

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const name = (callsignInput && callsignInput.value.trim()) ? callsignInput.value.trim() : 'Cmdr. Orion';
        this.storage.updateProfile(name, this.player.suitColor, this.player.visorTint);
        this.player.callsign = name;
        if (profileModal) profileModal.classList.remove('open');
        this.updateHUD();
        this.showToast('PROFILE RECONFIGURED', `Astronaut suit & callsign updated to ${name}.`);
        if (window.soundEngine) window.soundEngine.playTargetLock();
      });
    }
  }

  openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    const input = document.getElementById('profile-callsign-input');
    if (input) input.value = this.player.callsign || 'Cmdr. Orion';

    // Highlight current colors
    document.querySelectorAll('.profile-suit-btn').forEach(b => {
      if (b.getAttribute('data-color') === this.player.suitColor) b.classList.add('ring-2', 'ring-cyan-400');
      else b.classList.remove('ring-2', 'ring-cyan-400');
    });

    document.querySelectorAll('.profile-visor-btn').forEach(b => {
      if (b.getAttribute('data-tint') === this.player.visorTint) b.classList.add('ring-2', 'ring-cyan-400');
      else b.classList.remove('ring-2', 'ring-cyan-400');
    });

    this.renderProfilePreview();
    modal.classList.add('open');
    if (window.soundEngine) window.soundEngine.playRadarPing();
  }

  renderProfilePreview() {
    const canvas = document.getElementById('profile-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height * 0.82);
    ctx.scale(1.5, 1.5);
    this.player.renderAstronautOnFoot(ctx, this.planetData);
    ctx.restore();
  }

  bindAudioToggle() {
    const audioBtn = document.getElementById('hud-audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        if (window.soundEngine) {
          const muted = window.soundEngine.toggleMute();
          audioBtn.innerHTML = muted ? `
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ` : `
            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          `;
        }
      });
    }
  }

  openStarMap() {
    if (window.reactDashboard) {
      window.reactDashboard.openStarMap();
      return;
    }
    this.setActiveNav('nav-starmap');
    this.starMap.open(this.currentPlanetId);
  }

  openBadgesModal() {
    if (window.reactDashboard) {
      window.reactDashboard.openBadges();
      return;
    }
    const modal = document.getElementById('badges-modal');
    if (!modal) return;

    this.setActiveNav('nav-badges');
    this.renderBadgesGrid();
    modal.classList.add('open');
    if (window.soundEngine) window.soundEngine.playRadarPing();
  }

  openMissionBriefModal() {
    if (window.reactDashboard) {
      window.reactDashboard.openMissionBrief();
      return;
    }
    const modal = document.getElementById('brief-modal');
    if (!modal) return;

    this.setActiveNav('nav-mission');
    this.populateMissionBrief();
    modal.classList.add('open');
    if (window.soundEngine) window.soundEngine.playRadarPing();
  }

  populateMissionBrief() {
    const planet = this.planetData;
    const titleEl = document.getElementById('brief-title');
    const subtitleEl = document.getElementById('brief-subtitle');
    const directiveEl = document.getElementById('brief-directive');
    const historyEl = document.getElementById('brief-history');
    const scienceEl = document.getElementById('brief-science');
    const partsContainer = document.getElementById('brief-parts-list');

    if (titleEl) titleEl.textContent = planet.name;
    if (subtitleEl) subtitleEl.textContent = `${planet.historicalProgram} • ${planet.coordinates}`;
    if (directiveEl) directiveEl.textContent = planet.missionBrief.directive;
    if (historyEl) historyEl.textContent = planet.missionBrief.historicalRecord;
    if (scienceEl) scienceEl.textContent = planet.missionBrief.scientificTarget;

    if (partsContainer && this.world) {
      partsContainer.innerHTML = '';
      this.world.equipmentPieces.forEach((part, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = `p-3 rounded-lg border flex items-center gap-3 ${
          part.found ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-slate-900/60 border-slate-800'
        }`;
        itemEl.innerHTML = `
          <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
            part.found ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
          }">
            ${part.found ? '✓' : index + 1}
          </div>
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-orbitron font-bold ${part.found ? 'text-emerald-300' : 'text-slate-200'}">${part.name}</h5>
            <p class="text-[11px] text-slate-400 truncate">${part.desc}</p>
          </div>
          <span class="text-[10px] font-mono font-bold ${part.found ? 'text-emerald-400' : 'text-amber-500'}">
            ${part.found ? 'SECURED' : 'LOCATE'}
          </span>
        `;
        partsContainer.appendChild(itemEl);
      });
    }
  }

  openProfileModal() {
    if (window.reactDashboard) {
      window.reactDashboard.openProfile();
      return;
    }
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    modal.classList.add('open');
    this.renderProfilePreview();
  }

  openGatewayModal() {
    if (window.reactDashboard) {
      window.reactDashboard.openGateway();
      return;
    }
    const modal = document.getElementById('gateway-modal');
    if (modal) {
      modal.classList.add('open');
      if (window.soundEngine) window.soundEngine.playRadarPing();
    }
  }

  renderBadgesGrid() {
    const grid = document.getElementById('badges-grid-container');
    if (!grid) return;

    grid.innerHTML = '';
    const unlockedIds = (this.storage.data.unlockedBadges || []).map(b => b.id);

    Object.values(NASA_BADGES).forEach(badge => {
      const isUnlocked = unlockedIds.includes(badge.id);
      const record = (this.storage.data.unlockedBadges || []).find(b => b.id === badge.id);
      const unlockDateStr = record ? new Date(record.unlockedAt).toLocaleDateString() : 'CLASSIFIED';

      const card = document.createElement('div');
      card.className = `p-4 rounded-xl border transition-all duration-200 ${
        isUnlocked
          ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
          : 'bg-slate-950/60 border-slate-800 opacity-55'
      }`;

      card.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 flex-shrink-0 relative">
            ${badge.iconSvg}
            ${!isUnlocked ? '<div class="absolute inset-0 bg-slate-950/80 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">🔒</div>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-orbitron font-semibold tracking-wider ${isUnlocked ? 'text-cyan-400' : 'text-slate-500'} uppercase">
                ${badge.program}
              </span>
              <span class="text-[10px] font-mono text-slate-400">${isUnlocked ? `UNLOCKED: ${unlockDateStr}` : 'LOCKED'}</span>
            </div>
            <h4 class="font-orbitron font-bold text-sm text-slate-100 truncate">${badge.title}</h4>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">${badge.desc}</p>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  showToast(title, message) {
    const toast = document.getElementById('game-toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');

    if (!toast || !toastTitle || !toastMessage) return;

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    toast.classList.remove('translate-x-full', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('translate-x-0', 'opacity-100');
      toast.classList.add('translate-x-full', 'opacity-0');
    }, 3800);
  }

  toggleRover() {
    if (this.player.inRover) {
      this.dismountRover();
    } else if (this.world.rover && this.world.rover.parked) {
      const roverDist = Math.hypot(this.player.x - this.world.rover.x, this.player.y - this.world.rover.y);
      if (roverDist < 80) {
        this.mountRover();
      }
    }
  }

  mountRover() {
    this.player.mountRover();
    if (this.world.rover) this.world.rover.parked = false;
    if (window.soundEngine) window.soundEngine.playTargetLock();

    // Award Rover Pilot Badge
    if (this.storage.unlockBadge('badge_rover_driver')) {
      this.showBadgeNotification('badge_rover_driver');
    }

    this.showToast('ROVER BOARDED', 'Navigating surface terrain at high velocity.');
    this.updateHUD();
  }

  dismountRover() {
    if (this.world.rover) {
      this.world.rover.x = this.player.x;
      this.world.rover.y = this.player.y;
      this.world.rover.parked = true;
    }
    this.player.dismountRover();
    if (window.soundEngine) window.soundEngine.playFootstep(this.currentPlanetId);
    this.showToast('ROVER PARKED', 'Disembarked vehicle. Astronaut foot EVA active.');
    this.updateHUD();
  }

  triggerInteraction() {
    if (!this.activePrompt) return;

    if (this.activePrompt.type === 'PART') {
      this.collectPart(this.activePrompt.item);
    } else if (this.activePrompt.type === 'REPAIR') {
      this.initiateRocketRepair();
    } else if (this.activePrompt.type === 'LAUNCH') {
      this.initiateLaunchSequence();
    } else if (this.activePrompt.type === 'ROVER_MOUNT') {
      this.mountRover();
    } else if (this.activePrompt.type === 'ROVER_DISMOUNT') {
      this.dismountRover();
    } else if (this.activePrompt.type === 'FLAG') {
      this.plantIndianFlag();
    } else if (this.activePrompt.type === 'ASTEROID_HAZARD') {
      if (window.soundEngine && typeof window.soundEngine.playShieldDeflect === 'function') {
        window.soundEngine.playShieldDeflect();
      }
      this.camera.addShake(8);
      this.showToast('⚠️ DEFLECTOR SHIELD LOCKED', 'Planetary defense shields engaged against asteroid shower! Evade all falling meteors to access rocket hatch!');
    }
  }

  collectPart(item) {
    if (item.found) return;

    item.found = true;
    this.storage.markPartCollected(this.currentPlanetId, item.id);

    // Audio chime
    if (window.soundEngine) window.soundEngine.playPickup();

    // Particle Burst converging to astronaut
    this.particles.emit('pickup_sparkle', item.x, item.y - 20, {
      count: 24,
      targetX: this.player.x,
      targetY: this.player.y - 30,
      color: '#38bdf8',
      size: 4
    });

    const partsRemaining = this.world.equipmentPieces.filter(p => !p.found).length;
    this.showToast('EQUIPMENT SECURED', `${item.name} acquired. [${3 - partsRemaining}/3 Parts]`);

    // Automatic retaliatory asteroid wave to stop player securing parts!
    if (this.asteroidStorm) {
      this.asteroidStorm.addWave(3, this.player.x);
      this.showToast('⚠️ METEORS INCOMING!', `${item.name.toUpperCase()} secured! Evade falling asteroids to reach the rocket!`);
    }

    // Award Star 1 if all parts secured! (Pic 5 Stars Progression)
    if (partsRemaining === 0) {
      if (this.storage.awardStar(this.currentPlanetId, 1)) {
        this.showToast('⭐ MISSION STAR EARNED', 'Surface Payload Recovery Completed!');
      }
      const elapsedSec = (Date.now() - this.missionStartTime) / 1000;
      if (elapsedSec < 60) {
        if (this.storage.unlockBadge('badge_speedy_repair')) {
          this.showBadgeNotification('badge_speedy_repair');
        }
      }
    }

    this.updateHUD();
  }

  initiateRocketRepair() {
    this.gameState = 'REPAIRING';
    if (window.soundEngine) window.soundEngine.playAssembly();

    // Welding sparks and repair particles around rocket
    const rx = this.world.rocket.x;
    const ry = this.world.rocket.y;

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        this.camera.addShake(4);
        this.particles.emit('sparks', rx + (Math.random() * 2 - 1) * 25, ry - 30 - Math.random() * 50, {
          count: 20,
          color: '#facc15',
          gravity: 0.12
        });
      }, i * 250);
    }

    setTimeout(() => {
      this.world.rocket.state = 'READY';
      this.world.rocket.repairedPartsCount = 3;
      this.storage.markPlanetCompleted(this.currentPlanetId);

      // On Earth: Promote Cadet to Flight Astronaut! (Requirement 2 & 5)
      if (this.currentPlanetId === 'earth') {
        this.storage.promoteToAstronaut();
        this.player.stage = 'astronaut';
        if (this.storage.unlockBadge('badge_rocket_builder')) {
          this.showBadgeNotification('badge_rocket_builder');
        }
        if (this.storage.unlockBadge('badge_cadet_promoted')) {
          setTimeout(() => this.showBadgeNotification('badge_cadet_promoted'), 1800);
        }
        this.showToast('CADET PROMOTED: I AM ASTRONAUT!', 'Golden Flight Suit Equipped! Rocket assembled for orbital takeoff.');
      } else {
        this.showToast('ROCKET REFURBISHED', 'All propulsion & telemetry diagnostics GREEN. Ready for launch!');
      }

      // Award Star 2 for rocket refurbishment! (Pic 5 Stars Progression)
      if (this.storage.awardStar(this.currentPlanetId, 2)) {
        this.showToast('⭐⭐ MISSION STAR EARNED', 'Rocket Staging & Diagnostics 100% Operational!');
      }

      // Award Planet Badge
      const badgeId = this.planetData.badgeReward;
      if (this.storage.unlockBadge(badgeId)) {
        this.showBadgeNotification(badgeId);
      }

      // Check Master Explorer Badge (all 6 completed)
      const allCompleted = Object.keys(PLANETARY_DESTINATIONS).every(pid => 
        this.storage.data.completedPlanets.includes(pid) || pid === this.currentPlanetId
      );
      if (allCompleted) {
        if (this.storage.unlockBadge('badge_master_explorer')) {
          setTimeout(() => this.showBadgeNotification('badge_master_explorer'), 3500);
        }
      }

      this.gameState = 'EXPLORING';
      this.updateHUD();
    }, 1300);
  }

  // Award Achievement Badge whenever user reaches different planets (Requirement 4)
  checkPlanetArrivalBadge(planetId) {
    const badgeMap = {
      earth: 'badge_earth_ignition',
      moon_south: 'badge_south_pole_ice',
      moon: 'badge_moon_landing',
      mars: 'badge_mars_pathfinder',
      europa: 'badge_europa_abyss',
      titan: 'badge_titan_voyager'
    };
    const bId = badgeMap[planetId];
    if (bId && this.storage.unlockBadge(bId)) {
      this.showBadgeNotification(bId);
    }
  }

  // Plant the Indian National Flag (Tiranga) on any planet! (Requirement 6)
  plantIndianFlag() {
    if (this.player.inRover) {
      this.showToast('DISMOUNT ROVER', 'Must be on foot to plant the Indian Flag.');
      return;
    }
    const px = Math.round(this.player.x);
    const py = Math.round(this.world.getGroundY(px));
    this.storage.plantFlag(this.currentPlanetId, px, py);

    // Audio chime & dual saffron/green particle burst
    if (window.soundEngine) window.soundEngine.playPickup();
    this.particles.emit('pickup_sparkle', px, py - 30, { count: 18, color: '#FF9933' });
    this.particles.emit('pickup_sparkle', px, py - 30, { count: 18, color: '#138808' });

    if (this.storage.unlockBadge('badge_tiranga_planted')) {
      this.showBadgeNotification('badge_tiranga_planted');
    }

    this.showToast('🇮🇳 TIRANGA PLANTED!', `Indian National Flag proudly planted on ${this.planetData.bodyName.toUpperCase()}!`);
    this.updateHUD();
  }

  showBadgeNotification(badgeId) {
    const badge = NASA_BADGES[badgeId];
    if (!badge) return;
    if (window.soundEngine) window.soundEngine.playBadgeUnlock();
    this.showToast(`🎖️ NASA BADGE EARNED!`, `${badge.title} — ${badge.program}`);
  }

  // Astronaut Health Depletion & Death State (User Requirement: once health is lost he has to die and restart the game)
  handlePlayerDeath(source = 'asteroid') {
    this.camera.addShake(28);
    if (window.soundEngine && typeof window.soundEngine.playAsteroidExplosion === 'function') {
      window.soundEngine.playAsteroidExplosion();
    }
    // Heavy emergency distress smoke & plasma sparks
    this.particles.emit('smoke', this.player.x, this.player.y - 15, {
      count: 24,
      spreadX: 25,
      spreadY: 15,
      vy: -3,
      color: 'rgba(239, 68, 68, 0.6)',
      size: 15
    });
    this.particles.emit('sparks', this.player.x, this.player.y - 10, {
      count: 30,
      color: '#facc15',
      gravity: 0.15
    });

    const causeText = source === 'direct_asteroid_hit' 
      ? 'Direct kinetic meteor impact breached environmental life support.'
      : (source === 'asteroid_shockwave' 
        ? 'High-energy detonation shockwave ruptured oxygen regulator.' 
        : 'Surface meteor bombardment caused critical suit decompression.');

    this.showToast('💀 ASTRONAUT KIA // CRITICAL FAILURE', causeText);

    if (window.reactDashboard && typeof window.reactDashboard.openGameOver === 'function') {
      window.reactDashboard.openGameOver(source, causeText);
    }
    this.updateHUD();
  }

  // Respawn & Restart Expedition (User Requirement: restart the game)
  restartGame() {
    if (!this.player || !this.world) return;
    const spawnX = this.world.rocket.x + 55;
    const spawnY = this.world.getGroundY(spawnX);
    this.player.revive(spawnX, spawnY);

    if (this.asteroidStorm) {
      this.asteroidStorm.reset();
    }

    this.camera.x = Math.max(0, spawnX - this.camera.viewportWidth / 2);
    this.camera.y = spawnY - this.camera.viewportHeight * 0.58;
    this.camera.targetX = this.camera.x;
    this.camera.targetY = this.camera.y;

    if (window.soundEngine && typeof window.soundEngine.playTargetLock === 'function') {
      window.soundEngine.playTargetLock();
    }

    if (window.reactDashboard && typeof window.reactDashboard.closeGameOver === 'function') {
      window.reactDashboard.closeGameOver();
    }

    this.showToast('🔄 MISSION RESUMED', 'Astronaut respawned at Launch Base. Life support 100% nominal.');
    this.updateHUD();
  }

  // Reset Mission & Equipment Pieces (User Requirement: give a reset option, keep credentials saved, automatic falling asteroids during equipment exploration)
  resetCurrentMission(isFullReset = false) {
    if (isFullReset) {
      if (this.storage && typeof this.storage.resetAllProgressPreservingCredentials === 'function') {
        this.storage.resetAllProgressPreservingCredentials();
      }
      this.currentPlanetId = 'earth';
      this.loadPlanet('earth', false);
      this.showToast('🔄 FULL EXPEDITION RESET', 'All planets relocked & equipments respawned! User login credentials preserved.');
    } else {
      if (this.storage && typeof this.storage.resetPlanetEquipments === 'function') {
        this.storage.resetPlanetEquipments(this.currentPlanetId);
      }
      this.loadPlanet(this.currentPlanetId, false);
      this.showToast('🔄 SECTOR EQUIPMENTS RESET', 'Rocket equipment pieces respawned! Dodge falling asteroids to recover them.');
    }

    if (this.player) {
      this.player.health = 100;
      this.player.maxHealth = 100;
      this.player.isDead = false;
      this.player.damageFlashTimer = 0;
      this.player.invulnerableTimer = 60;
    }

    if (this.asteroidStorm) {
      this.asteroidStorm.reset();
    }
    this.hasTriggeredAutoAsteroids = false;
    this.nearPartAttackCooldown = 0;
    this.autoAsteroidTimer = 90; // Drops start shortly after moving

    if (window.soundEngine && typeof window.soundEngine.playTargetLock === 'function') {
      window.soundEngine.playTargetLock();
    }

    if (window.reactDashboard && typeof window.reactDashboard.closeAll === 'function') {
      window.reactDashboard.closeAll();
    }

    this.updateHUD();
  }

  initiateLaunchSequence() {
    this.gameState = 'LAUNCHING';
    this.world.rocket.state = 'LAUNCHING';
    this.world.rocket.launchSpeed = 0.5;

    // Astronaut enters rocket
    this.player.x = this.world.rocket.x;
    this.player.y = this.world.rocket.y - 100;

    // Award Star 3 for successful orbital ascent! (Pic 5 Stars Progression)
    if (this.storage.awardStar(this.currentPlanetId, 3)) {
      this.showToast('⭐⭐⭐ 3 STARS EARNED!', 'Orbital Trajectory Injection Completed!');
    }

    if (window.soundEngine) window.soundEngine.playLaunch();
    this.camera.addShake(18);

    this.showToast('ORBITAL LIFTOFF', 'Main Engines Ignited. Accelerating through atmospheric envelope.');

    // Unlock next planet in order
    const nextOrder = this.planetData.order + 1;
    const nextPlanet = Object.values(PLANETARY_DESTINATIONS).find(p => p.order === nextOrder);
    if (nextPlanet) {
      this.storage.unlockPlanet(nextPlanet.id);
    }

    // After 3.2 seconds of vertical ascent, transition to Star Map
    setTimeout(() => {
      this.openStarMap();
    }, 3200);
  }

  startLandingSequence(targetPlanetId) {
    this.loadPlanet(targetPlanetId, true);
  }

  updateHUD() {
    // Current Planet Name
    const hudPlanet = document.getElementById('hud-planet-name');
    if (hudPlanet) {
      hudPlanet.textContent = this.planetData.name.toUpperCase();
    }

    // Telemetry Pill
    const hudTelemetry = document.getElementById('hud-telemetry');
    const gNorm = (this.planetData.gravity / 9.8).toFixed(2);
    const telemText = `${this.planetData.gravity} m/s² [${gNorm}G] • JETPACK: ${Math.round(this.player.jetpackFuel)}%`;
    if (hudTelemetry) {
      hudTelemetry.textContent = telemText;
    }

    // Callsign in HUD
    const hudCallsign = document.getElementById('hud-commander-callsign');
    if (hudCallsign) {
      hudCallsign.textContent = this.player.callsign || 'Cmdr. Orion';
    }

    // Stars Count (Pic 5)
    const hudStars = document.getElementById('hud-stars-count');
    if (hudStars) {
      hudStars.textContent = `${this.storage.getTotalStars()}/18`;
    }

    // Compute navigation radar compass data
    let nearestPart = null;
    let nearestDist = Infinity;
    let nearestDirection = 1;

    if (this.world && this.world.equipmentPieces && this.player) {
      this.world.equipmentPieces.forEach(p => {
        if (!p.found) {
          const dx = p.x - this.player.x;
          const dist = Math.abs(dx);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestDirection = dx >= 0 ? 1 : -1;
            nearestPart = p;
          }
        }
      });
    }

    // Sync with React Dashboard
    if (window.reactDashboard) {
      window.reactDashboard.setTelemetry(telemText);
      window.reactDashboard.setPlanet(this.currentPlanetId);
      window.reactDashboard.updateStars(this.storage.getTotalStars());
      const foundCount = this.world.equipmentPieces.filter(p => p.found).length;
      window.reactDashboard.updateParts(foundCount);
      if (this.player) {
        window.reactDashboard.updateHealth(this.player.health, this.player.maxHealth, this.player.isDead);
      }
      window.reactDashboard.updateRadar({
        nearestPartName: nearestPart ? nearestPart.name : null,
        distanceM: nearestPart ? Math.round(nearestDist * 0.5) : null,
        direction: nearestDirection,
        remainingCount: this.world.equipmentPieces.filter(p => !p.found).length
      });
    }

    // Parts Progress Dots
    const dotsContainer = document.getElementById('hud-parts-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      this.world.equipmentPieces.forEach(p => {
        const dot = document.createElement('div');
        dot.className = `w-2.5 h-2.5 rounded-full border transition-all ${
          p.found ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-slate-800 border-slate-600'
        }`;
        dotsContainer.appendChild(dot);
      });
    }

    // Difficulty pill in static HUD
    const diffMode = this.storage?.getDifficulty?.() || 'moderate';
    const diffCfg = window.GAME_DIFFICULTY_MODES?.[diffMode] || { name: 'MODERATE', icon: '🟡', maxHealth: 100 };
    const diffIcon = document.getElementById('hud-difficulty-icon');
    const diffLabel = document.getElementById('hud-difficulty-label');
    const diffBtn = document.getElementById('hud-difficulty-btn');
    if (diffIcon) diffIcon.textContent = diffCfg.icon;
    if (diffLabel) diffLabel.textContent = diffCfg.name;
    if (diffBtn) {
      diffBtn.title = `Difficulty: ${diffCfg.name} (${diffCfg.maxHealth || 100} HP) - Click to toggle`;
      if (diffMode === 'easy') {
        diffBtn.className = 'flex items-center gap-1 px-2.5 py-1.5 rounded-full tactical-glass border border-emerald-400/60 bg-emerald-950/30 text-emerald-300 font-orbitron font-extrabold text-[10px] tracking-wider cursor-pointer transition-colors shadow-md';
      } else if (diffMode === 'difficult') {
        diffBtn.className = 'flex items-center gap-1 px-2.5 py-1.5 rounded-full tactical-glass border border-red-500/60 bg-red-950/30 text-red-300 font-orbitron font-extrabold text-[10px] tracking-wider cursor-pointer transition-colors shadow-md';
      } else {
        diffBtn.className = 'flex items-center gap-1 px-2.5 py-1.5 rounded-full tactical-glass border border-amber-400/60 bg-amber-950/30 text-amber-300 font-orbitron font-extrabold text-[10px] tracking-wider cursor-pointer transition-colors shadow-md';
      }
    }

    // Mobile Action Button State
    const touchAction = document.getElementById('touch-action');
    if (touchAction) {
      if (this.activePrompt) {
        touchAction.classList.remove('opacity-40');
        touchAction.classList.add('opacity-100', 'bg-cyan-500/30', 'border-cyan-400');
      } else {
        touchAction.classList.remove('opacity-100', 'bg-cyan-500/30', 'border-cyan-400');
        touchAction.classList.add('opacity-40');
      }
    }
  }

  checkInteractions() {
    this.activePrompt = null;
    const px = this.player.x;
    const py = this.player.y;

    // 1. Rover Interaction Check (Pic 1 Inspired)
    if (this.player.inRover) {
      this.activePrompt = {
        type: 'ROVER_DISMOUNT',
        text: `[R] / [TAP] DISMOUNT ROVER (FOOT EVA)`
      };
      return;
    } else if (this.world.rover && this.world.rover.parked) {
      const roverDist = Math.hypot(px - this.world.rover.x, py - this.world.rover.y);
      if (roverDist < 70) {
        this.activePrompt = {
          type: 'ROVER_MOUNT',
          text: `[R] / [TAP] DRIVE ${this.world.rover.name.toUpperCase()}`
        };
        return;
      }
    }

    // 2. Check Equipment Pieces (Dynamic radius based on difficulty mode: Easy 100px, Moderate 85px, Difficult 70px)
    const diffMode = this.storage?.getDifficulty?.() || 'moderate';
    const diffCfg = window.GAME_DIFFICULTY_MODES?.[diffMode] || { interactionRadius: 85 };
    const interactRadius = diffCfg.interactionRadius || 85;

    for (const item of this.world.equipmentPieces) {
      if (!item.found) {
        const dist = Math.hypot(px - item.x, (py - 20) - item.y);
        if (dist < interactRadius) {
          this.activePrompt = {
            type: 'PART',
            item: item,
            text: `[E] / [TAP] SECURE ${item.name.toUpperCase()}`
          };
          return;
        }
      }
    }

    // 3. Check Rocket Proximity
    const rocketDist = Math.abs(px - this.world.rocket.x);
    if (rocketDist < 95 && Math.abs(py - this.world.rocket.y) < 70) {
      // Deflector Shield Lockout during Asteroid Storm (User Requirement: "once after escaping from falling asteroids then only user can reach to the rocket")
      if (this.asteroidStorm && this.asteroidStorm.isActive && !this.asteroidStorm.isCleared) {
        const remaining = this.asteroidStorm.totalAsteroids - this.asteroidStorm.evadedCount;
        this.activePrompt = {
          type: 'ASTEROID_HAZARD',
          text: `⚠️ DEFLECTOR SHIELD ENGAGED // DODGE ${remaining} MORE ASTEROID(S) TO BOARD ROCKET!`
        };
        return;
      }

      const partsRemaining = this.world.equipmentPieces.filter(p => !p.found).length;

      if (partsRemaining === 0 && this.world.rocket.state === 'DISABLED') {
        const isEarth = this.currentPlanetId === 'earth';
        this.activePrompt = {
          type: 'REPAIR',
          text: isEarth 
            ? `[E] / [TAP] ASSEMBLE ROCKET & PROCLAIM: I AM ASTRONAUT!` 
            : `[E] / [TAP] ASSEMBLE ROCKET & PREPARE LAUNCH`
        };
      } else if (this.world.rocket.state === 'READY') {
        this.activePrompt = {
          type: 'LAUNCH',
          text: `[E] / [TAP] BOARD ROCKET FOR ORBITAL TAKEOFF`
        };
      } else if (partsRemaining > 0) {
        this.activePrompt = {
          type: 'INFO',
          text: `EQUIPMENT MISSING // ${partsRemaining} PART(S) REQUIRED`
        };
      }
      return;
    }

    // 4. Offer Indian Flag planting if on foot and not yet planted on this planet
    if (!this.player.inRover && !this.storage.hasPlantedFlag(this.currentPlanetId)) {
      this.activePrompt = {
        type: 'FLAG',
        text: `[F] / [TAP] PLANT INDIAN FLAG (TIRANGA 🇮🇳)`
      };
    }
  }

  // Tactical In-World Asteroid Shower Danger Banner
  renderAsteroidStormHUD(ctx) {
    const w = window.innerWidth;
    const remaining = this.asteroidStorm.totalAsteroids - this.asteroidStorm.evadedCount;
    const pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.01);

    ctx.save();
    ctx.translate(w / 2, 70);

    // Hazard Banner Glass Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-175, 0, 350, 36, 8);
    ctx.fill();
    ctx.stroke();

    // Pulse red beacon
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-150, 18, 5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Banner Text
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 10px Orbitron, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('☄️ METEOR SHOWER IN PROGRESS', -135, 15);

    ctx.fillStyle = '#facc15';
    ctx.font = '9px Orbitron, monospace';
    ctx.fillText(`EVADED: ${this.asteroidStorm.evadedCount}/${this.asteroidStorm.totalAsteroids} // ESCAPE ${remaining} MORE TO UNLOCK ROCKET`, -135, 28);

    ctx.restore();
  }

  loop(currentTime) {
    // Request next frame at the very start so the loop cannot permanently crash
    this.rafId = requestAnimationFrame(this.loop);

    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Guaranteed fallbacks for world, player and planetData
    if (!this.world || !this.player || !this.planetData) {
      if (!this.planetData) this.planetData = PLANETARY_DESTINATIONS[this.currentPlanetId] || PLANETARY_DESTINATIONS.earth;
      if (!this.world) this.world = new World(this.planetData);
      if (!this.player) this.player = new Astronaut(1005, 520);
    }

    // 1. Update Game State (Safe Protected Execution)
    try {
      this.camera.update();
      this.particles.update();
      this.world.update(this.particles);

      // Update active asteroid storm physics and evasion tracking
      if (this.asteroidStorm) {
        this.asteroidStorm.update(dt);
      }

      if (this.gameState === 'EXPLORING' || this.gameState === 'REPAIRING') {
        this.player.update(this.world, this.planetData, this.particles);
        this.camera.follow(this.player.x, this.player.y, this.player.facing, this.world.worldWidth);
        this.checkInteractions();

        // Automatic Asteroid Storm Defense - drops asteroids automatically to stop player securing parts!
        // ONLY triggers after player has started to move!
        if (this.player && this.player.hasStartedMoving && this.world && this.world.equipmentPieces && this.asteroidStorm) {
          const uncollectedParts = this.world.equipmentPieces.filter(p => !p.found);
          if (uncollectedParts.length > 0 && this.world.rocket.state === 'DISABLED') {
            // Trigger 1: Player walks out from the rocket launch pad to retrieve parts
            const distFromRocket = Math.abs(this.player.x - this.world.rocket.x);
            if (!this.hasTriggeredAutoAsteroids && distFromRocket > 40) {
              this.hasTriggeredAutoAsteroids = true;
              this.asteroidStorm.start(6);
              this.showToast('☄️ METEOR SHOWER DETECTED!', 'Falling asteroids incoming to stop equipment recovery! Dodge and evade!');
            }

            // Trigger 2: Player approaches near any uncollected rocket part (< 200px)
            if (this.nearPartAttackCooldown > 0) {
              this.nearPartAttackCooldown--;
            } else {
              for (const part of uncollectedParts) {
                const distToPart = Math.hypot(this.player.x - part.x, this.player.y - part.y);
                if (distToPart < 200) {
                  this.nearPartAttackCooldown = 160;
                  this.asteroidStorm.addWave(2, part.x);
                  this.showToast('⚠️ METEOR DEFENSE INTERCEPT!', 'Falling asteroid strike targeting equipment zone! Evade impact!');
                  break;
                }
              }
            }

            // Trigger 3: Continuous relentless automatic pressure while player explores for equipments!
            this.autoAsteroidTimer = (this.autoAsteroidTimer || 180) - 1;
            if (this.autoAsteroidTimer <= 0) {
              this.autoAsteroidTimer = 180 + Math.floor(Math.random() * 60);
              if (this.asteroidStorm.asteroids.length < 3) {
                this.asteroidStorm.addWave(1, this.player.x + (Math.random() * 2 - 1) * 60);
              }
            }
          }
        }

        // Check Jetpack Ace Badge (8 seconds sustained on foot)
        if (!this.player.inRover && this.player.consecutiveFlightTimer >= 8) {
          if (this.storage.unlockBadge('badge_jetpack_ace')) {
            this.showBadgeNotification('badge_jetpack_ace');
          }
        }
      } else if (this.gameState === 'LAUNCHING') {
        const rocketY = this.world.rocket.y - this.world.rocket.launchAltitude;
        this.camera.follow(this.world.rocket.x, rocketY, 0, this.world.worldWidth);
        this.camera.addShake(4);
      } else if (this.gameState === 'LANDING') {
        this.landingAltitude -= this.landingSpeed;
        this.world.rocket.launchAltitude = Math.max(0, this.landingAltitude);
        this.camera.follow(this.world.rocket.x, this.world.rocket.y - this.landingAltitude, 0, this.world.worldWidth);

        this.particles.emit('thruster', this.world.rocket.x, this.world.rocket.y - this.landingAltitude, {
          count: 3,
          spreadX: 12,
          vy: 6,
          color: '#38bdf8'
        });

        if (this.landingAltitude <= 0) {
          this.landingAltitude = 0;
          this.world.rocket.launchAltitude = 0;
          this.gameState = 'EXPLORING';
          this.camera.addShake(12);
          this.showToast('TOUCHDOWN CONFIRMED', `Surface EVA commenced on ${this.planetData.bodyName}.`);
          this.checkPlanetArrivalBadge(this.currentPlanetId);
        }
      }
    } catch (updateErr) {
      console.warn('[Game Update Protected]:', updateErr);
    }

    // 2. Render Canvas Frame
    // Coordinate Sanitation: Protect canvas from NaN rendering failure
    if (isNaN(this.player.x) || !isFinite(this.player.x)) this.player.x = 1005;
    if (isNaN(this.player.y) || !isFinite(this.player.y)) this.player.y = 520;
    if (isNaN(this.camera.x) || !isFinite(this.camera.x)) this.camera.x = 0;
    if (isNaN(this.camera.y) || !isFinite(this.camera.y)) this.camera.y = 0;

    const camX = this.camera.getOffsetX();
    const camY = this.camera.getOffsetY();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Guaranteed base sky color gradient so viewport is never pitch black
    const w = window.innerWidth;
    const h = window.innerHeight;
    const skyTop = (this.planetData && this.planetData.skyColors && this.planetData.skyColors.top) || '#0284c7';
    const skyBottom = (this.planetData && this.planetData.skyColors && this.planetData.skyColors.bottom) || '#bae6fd';
    try {
      const baseGrad = this.ctx.createLinearGradient(0, 0, 0, h);
      baseGrad.addColorStop(0, skyTop);
      baseGrad.addColorStop(1, skyBottom);
      this.ctx.fillStyle = baseGrad;
      this.ctx.fillRect(0, 0, w, h);
    } catch (baseErr) {
      this.ctx.fillStyle = skyTop;
      this.ctx.fillRect(0, 0, w, h);
    }

    // Isolated render stages to ensure Rocket, Astronaut and Terrain ALWAYS render!
    try {
      this.world.renderBackground(this.ctx, camX, camY);
    } catch (bgErr) {
      console.warn('[Game Render Background Guarded]:', bgErr);
    }

    try {
      this.particles.render(this.ctx, camX, camY);
    } catch (pErr) {
      console.warn('[Game Render Particles Guarded]:', pErr);
    }

    try {
      this.world.renderForeground(this.ctx, camX, camY);
    } catch (fgErr) {
      console.error('[Game Render Foreground Guarded]:', fgErr);
    }

    try {
      if (this.gameState === 'EXPLORING' || this.gameState === 'REPAIRING') {
        this.player.render(this.ctx, camX, camY, this.planetData);
      }
    } catch (plErr) {
      console.error('[Game Render Player Guarded]:', plErr);
    }

    try {
      // Render Asteroid Storm Tactical Danger Banner
      if (this.asteroidStorm && this.asteroidStorm.isActive) {
        this.renderAsteroidStormHUD(this.ctx);
      }
    } catch (hudErr) {
      console.warn('[Game Render Asteroid HUD Guarded]:', hudErr);
    }
    this.ctx.restore();

    // 3. Render In-World Interaction Prompt
    const promptContainer = document.getElementById('game-prompt-container');
    if (promptContainer) {
      if (this.activePrompt) {
        promptContainer.classList.remove('hidden');
        promptContainer.textContent = this.activePrompt.text;
        const screenPx = this.player.x - camX;
        const screenPy = (this.player.y - (this.player.inRover ? 55 : 68)) - camY;
        promptContainer.style.left = `${screenPx}px`;
        promptContainer.style.top = `${screenPy}px`;
      } else {
        promptContainer.classList.add('hidden');
      }
    }

    // Update Telemetry in HUD periodically
    if (Math.random() < 0.2) {
      this.updateHUD();
    }
  }
}

// Start game reliably when DOM is ready
function bootGame() {
  if (window.gameEngine) return;
  try {
    window.gameEngine = new GameEngine();
    window.gameEngine.init();
    console.log('[I Am Astronut] Game Engine booted nominal.');
  } catch (err) {
    console.error('[I Am Astronut] Fatal error booting Game Engine:', err);
  }

  // Register Service Worker for Offline PWA Support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('NASA Odyssey PWA ServiceWorker Registered'))
      .catch(err => console.warn('ServiceWorker registration error:', err));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}