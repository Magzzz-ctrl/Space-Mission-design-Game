// I Am Astronut: Space Mission Design Game - LocalStorage Progression & State Manager
// Supports Cadet Profile (Boy / Girl), Full Account Authentication & Interplanetary Flag Records

class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'I_AM_ASTRONAUT_SPACE_MISSION_V4';
    this.ACCOUNTS_KEY = 'I_AM_ASTRONAUT_USER_ACCOUNTS_V1';
    this.accounts = this.loadAccounts();
    this.data = this.getDefaultState();
    this.load();
  }

  loadAccounts() {
    try {
      const raw = localStorage.getItem(this.ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  saveAccounts() {
    try {
      localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(this.accounts));
    } catch (e) {
      console.warn('Failed to save accounts:', e);
    }
  }

  getDefaultState() {
    return {
      // First rocket take off should strictly start from Earth (Requirement 1)
      currentPlanet: 'earth',
      unlockedPlanets: ['earth'],
      completedPlanets: [],

      // Cadet progression: starts as boy/girl cadet searching for hidden equipment on Earth! (Requirement 2)
      characterStage: 'cadet', // 'cadet' (before rocket build on Earth) -> 'astronaut' (after rocket built)
      characterGender: 'boy',  // 'boy' or 'girl'

      // Indian Flags planted on different planets (Requirement 6)
      plantedFlags: {
        earth: null,
        moon_south: null,
        moon: null,
        mars: null,
        europa: null,
        titan: null
      },

      // Authenticated user profile (Requirement 3)
      currentUser: {
        username: 'Cadet Orion',
        email: '',
        gender: 'boy',
        isGuest: true,
        isLoggedIn: false
      },

      partsCollected: {
        earth: [],
        moon_south: [],
        moon: [],
        mars: [],
        europa: [],
        titan: []
      },
      missionStars: {
        earth: 0,
        moon_south: 0,
        moon: 0,
        mars: 0,
        europa: 0,
        titan: 0
      },
      profile: {
        callsign: 'Cadet Orion',
        suitColor: 'white', // 'white', 'navy', 'orange', 'cyan', 'gold'
        visorTint: 'gold',  // 'gold', 'cyan', 'emerald', 'violet'
        patch: 'tiranga'    // Indian Mission Insignia
      },
      unlockedBadges: [],
      badges: [],
      totalStars: 0,
      audioMuted: false,
      gatewayDismissed: true,
      difficultyMode: 'moderate' // 'easy', 'moderate', 'difficult'
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.getDefaultState(),
          ...parsed,
          profile: { ...this.getDefaultState().profile, ...(parsed.profile || {}) },
          missionStars: { ...this.getDefaultState().missionStars, ...(parsed.missionStars || {}) },
          plantedFlags: { ...this.getDefaultState().plantedFlags, ...(parsed.plantedFlags || {}) },
          currentUser: { ...this.getDefaultState().currentUser, ...(parsed.currentUser || {}) }
        };
        // Guarantee Earth is always unlocked
        if (!this.data.unlockedPlanets.includes('earth')) {
          this.data.unlockedPlanets.unshift('earth');
        }
        this.data.badges = (this.data.unlockedBadges || []).map(b => b.id);
        this.data.totalStars = this.getTotalStars();
      }
    } catch (e) {
      console.warn('LocalStorage load failed, running in session memory:', e);
    }
  }

  save() {
    try {
      this.data.badges = (this.data.unlockedBadges || []).map(b => b.id);
      this.data.totalStars = this.getTotalStars();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // --- Authentication System (Pic 3 & Pic 4 Inspired) ---
  register(username, email, password, gender = 'boy') {
    const trimmedUser = (username || '').trim();
    if (!trimmedUser) return { success: false, error: 'Username is required.' };

    const existing = this.accounts.find(a => a.username.toLowerCase() === trimmedUser.toLowerCase());
    if (existing) {
      return { success: false, error: 'Username already registered. Please log in.' };
    }

    const newAcc = {
      id: 'usr_' + Date.now(),
      username: trimmedUser,
      email: (email || '').trim(),
      password: password || '123456',
      gender: gender === 'girl' ? 'girl' : 'boy',
      createdAt: new Date().toISOString()
    };
    this.accounts.push(newAcc);
    this.saveAccounts();

    // Log the user in
    this.data.currentUser = {
      username: newAcc.username,
      email: newAcc.email,
      gender: newAcc.gender,
      isGuest: false,
      isLoggedIn: true
    };
    this.data.characterGender = newAcc.gender;
    this.data.profile.callsign = newAcc.username;
    this.save();

    try { sessionStorage.setItem('I_AM_ASTRONAUT_SESSION_AUTH', 'true'); } catch (e) {}
    return { success: true, user: this.data.currentUser };
  }

  login(usernameOrEmail, password) {
    const query = (usernameOrEmail || '').trim().toLowerCase();
    if (!query) return { success: false, error: 'Please enter username or email.' };

    const acc = this.accounts.find(a => 
      a.username.toLowerCase() === query || (a.email && a.email.toLowerCase() === query)
    );

    if (!acc) {
      // Auto-register convenience if first time
      return this.register(usernameOrEmail, '', password, 'boy');
    }

    if (password && acc.password && acc.password !== password) {
      return { success: false, error: 'Incorrect password.' };
    }

    this.data.currentUser = {
      username: acc.username,
      email: acc.email,
      gender: acc.gender || 'boy',
      isGuest: false,
      isLoggedIn: true
    };
    this.data.characterGender = acc.gender || 'boy';
    this.data.profile.callsign = acc.username;
    this.save();

    try { sessionStorage.setItem('I_AM_ASTRONAUT_SESSION_AUTH', 'true'); } catch (e) {}
    return { success: true, user: this.data.currentUser };
  }

  loginGuest(username = 'Cadet Orion', gender = 'boy') {
    this.data.currentUser = {
      username: username || 'Cadet Orion',
      email: '',
      gender: gender || 'boy',
      isGuest: true,
      isLoggedIn: true
    };
    this.data.characterGender = gender || 'boy';
    this.data.profile.callsign = username || 'Cadet Orion';
    this.save();

    try { sessionStorage.setItem('I_AM_ASTRONAUT_SESSION_AUTH', 'true'); } catch (e) {}
    return { success: true, user: this.data.currentUser };
  }

  logout() {
    if (this.data.currentUser) {
      this.data.currentUser.isLoggedIn = false;
    }
    try { sessionStorage.removeItem('I_AM_ASTRONAUT_SESSION_AUTH'); } catch (e) {}
    this.save();
  }

  isLoggedIn() {
    let sessionOk = false;
    try { sessionOk = sessionStorage.getItem('I_AM_ASTRONAUT_SESSION_AUTH') === 'true'; } catch (e) {}
    const storedOk = !!(this.data && this.data.currentUser && this.data.currentUser.isLoggedIn);
    return sessionOk && storedOk;
  }

  setCadetGender(gender) {
    this.data.characterGender = gender === 'girl' ? 'girl' : 'boy';
    if (this.data.currentUser) {
      this.data.currentUser.gender = this.data.characterGender;
    }
    this.save();
  }

  promoteToAstronaut() {
    this.data.characterStage = 'astronaut';
    this.save();
  }

  // --- Game Difficulty Modes (Easy, Moderate, Difficult) ---
  setDifficulty(mode) {
    if (['easy', 'moderate', 'difficult'].includes(mode)) {
      this.data.difficultyMode = mode;
      this.save();
      return true;
    }
    return false;
  }

  getDifficulty() {
    return this.data.difficultyMode || 'moderate';
  }

  // --- Indian Flag Planting on Planets (Requirement 6) ---
  plantFlag(planetId, x, y) {
    if (!this.data.plantedFlags) this.data.plantedFlags = {};
    this.data.plantedFlags[planetId] = {
      x: x,
      y: y,
      plantedAt: new Date().toISOString()
    };
    this.save();
  }

  hasPlantedFlag(planetId) {
    return !!(this.data.plantedFlags && this.data.plantedFlags[planetId]);
  }

  getPlantedFlag(planetId) {
    return this.data.plantedFlags ? this.data.plantedFlags[planetId] : null;
  }

  // --- Profile & Gameplay Methods ---
  setProfile(profile) {
    this.data.profile = { ...this.data.profile, ...profile };
    this.save();
  }

  dismissGateway() {
    this.data.gatewayDismissed = true;
    this.save();
  }

  setCurrentPlanet(planetId) {
    this.data.currentPlanet = planetId;
    this.save();
  }

  unlockPlanet(planetId) {
    if (!this.data.unlockedPlanets.includes(planetId)) {
      this.data.unlockedPlanets.push(planetId);
      this.save();
    }
  }

  markPartCollected(planetId, partId) {
    if (!this.data.partsCollected[planetId]) {
      this.data.partsCollected[planetId] = [];
    }
    if (!this.data.partsCollected[planetId].includes(partId)) {
      this.data.partsCollected[planetId].push(partId);
      this.save();
    }
  }

  isPartCollected(planetId, partId) {
    if (!this.data.partsCollected[planetId]) return false;
    return this.data.partsCollected[planetId].includes(partId);
  }

  markPlanetCompleted(planetId) {
    if (!this.data.completedPlanets.includes(planetId)) {
      this.data.completedPlanets.push(planetId);
      this.save();
    }
  }

  awardStar(planetId, count) {
    if (!this.data.missionStars[planetId]) {
      this.data.missionStars[planetId] = 0;
    }
    if (count > this.data.missionStars[planetId]) {
      this.data.missionStars[planetId] = Math.min(3, count);
      this.save();
      return true;
    }
    return false;
  }

  getTotalStars() {
    return Object.values(this.data.missionStars || {}).reduce((acc, val) => acc + val, 0);
  }

  updateProfile(callsign, suitColor, visorTint) {
    this.data.profile.callsign = callsign || this.data.profile.callsign;
    this.data.profile.suitColor = suitColor || this.data.profile.suitColor;
    this.data.profile.visorTint = visorTint || this.data.profile.visorTint;
    this.save();
  }

  setGatewayDismissed(dismissed) {
    this.data.gatewayDismissed = !!dismissed;
    this.save();
  }

  unlockBadge(badgeId) {
    if (!this.data.unlockedBadges) this.data.unlockedBadges = [];
    const existing = this.data.unlockedBadges.find(b => b.id === badgeId);
    if (!existing) {
      const record = {
        id: badgeId,
        unlockedAt: new Date().toISOString()
      };
      this.data.unlockedBadges.push(record);
      this.save();
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  }

  hasBadge(badgeId) {
    return (this.data.unlockedBadges || []).some(b => b.id === badgeId);
  }

  // --- Reset Options (Preserving User Credentials & Login Authentication) ---
  // Reset current planet's equipment pieces so player can search and collect them fresh
  resetPlanetEquipments(planetId) {
    if (!this.data.partsCollected) this.data.partsCollected = {};
    this.data.partsCollected[planetId] = [];
    if (this.data.completedPlanets) {
      this.data.completedPlanets = this.data.completedPlanets.filter(p => p !== planetId);
    }
    if (this.data.missionStars) {
      this.data.missionStars[planetId] = 0;
    }
    if (planetId === 'earth') {
      this.data.characterStage = 'cadet';
    }
    this.data.totalStars = this.getTotalStars();
    this.save();
    return true;
  }

  // Full expedition reset keeping credentials & account authentication completely intact!
  resetAllProgressPreservingCredentials() {
    const savedUser = this.data.currentUser || { username: 'Cadet Orion', gender: 'boy', isLoggedIn: true };
    const savedProfile = this.data.profile || { callsign: savedUser.username, suitColor: 'white', visorTint: 'gold' };

    this.data.partsCollected = { earth: [], moon_south: [], moon: [], mars: [], europa: [], titan: [] };
    this.data.missionStars = { earth: 0, moon_south: 0, moon: 0, mars: 0, europa: 0, titan: 0 };
    this.data.completedPlanets = [];
    this.data.unlockedPlanets = ['earth'];
    this.data.characterStage = 'cadet';
    this.data.characterGender = savedUser.gender || 'boy';
    this.data.currentPlanet = 'earth';
    this.data.plantedFlags = { earth: null, moon_south: null, moon: null, mars: null, europa: null, titan: null };
    this.data.unlockedBadges = [];
    this.data.totalStars = 0;
    this.data.currentUser = savedUser;
    this.data.profile = savedProfile;
    this.data.gatewayDismissed = true;

    this.save();
    this.saveAccounts();
    return true;
  }
}

// Global storage singleton
window.storageManager = new StorageManager();
