// Project Horizons: NASA Odyssey - Web Audio API Sound Synthesizer
// Completely procedural - zero external audio asset dependencies!

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.thrusterNode = null;
    this.thrusterGain = null;
    this.ambientGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientFilter = null;
    this.currentPlanet = 'earth';
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.setupThruster();
      this.setupAmbient();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.muted = !this.muted;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(this.muted ? 0 : 0.08, this.ctx ? this.ctx.currentTime : 0);
    }
    if (this.thrusterGain && this.muted) {
      this.thrusterGain.gain.setValueAtTime(0, this.ctx ? this.ctx.currentTime : 0);
    }
    return this.muted;
  }

  // Setup continuous looping thruster noise buffer
  setupThruster() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 450;
    filter.Q.value = 3.0;

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.setValueAtTime(0, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.ctx.destination);
    whiteNoise.start(0);
    this.thrusterNode = filter;
  }

  setThruster(active, intensity = 1.0) {
    if (this.muted || !this.thrusterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (active) {
      const targetGain = Math.min(0.25, 0.2 * intensity);
      this.thrusterGain.gain.setTargetAtTime(targetGain, now, 0.05);
      if (this.thrusterNode) {
        this.thrusterNode.frequency.setTargetAtTime(400 + intensity * 500, now, 0.05);
      }
    } else {
      this.thrusterGain.gain.setTargetAtTime(0, now, 0.08);
    }
  }

  // Generative Sci-Fi Ambient Drone per Planet
  setupAmbient() {
    if (!this.ctx) return;
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientGain = this.ctx.createGain();

    this.ambientOsc1.type = 'sine';
    this.ambientOsc2.type = 'triangle';

    this.ambientOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
    this.ambientOsc2.frequency.setValueAtTime(82.5, this.ctx.currentTime); // E2 note

    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.ambientGain.gain.setValueAtTime(this.muted ? 0 : 0.06, this.ctx.currentTime);

    this.ambientOsc1.connect(this.ambientFilter);
    this.ambientOsc2.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
  }

  setPlanetAmbient(planetKey) {
    if (!this.ctx || !this.ambientFilter) return;
    this.currentPlanet = planetKey;
    const now = this.ctx.currentTime;
    switch (planetKey) {
      case 'earth':
        this.ambientFilter.frequency.setTargetAtTime(260, now, 1.5);
        this.ambientOsc1.frequency.setTargetAtTime(55, now, 1.5);
        this.ambientOsc2.frequency.setTargetAtTime(82.5, now, 1.5);
        break;
      case 'moon':
        this.ambientFilter.frequency.setTargetAtTime(90, now, 1.5);
        this.ambientOsc1.frequency.setTargetAtTime(45, now, 1.5);
        this.ambientOsc2.frequency.setTargetAtTime(67.5, now, 1.5);
        break;
      case 'mars':
        this.ambientFilter.frequency.setTargetAtTime(140, now, 1.5);
        this.ambientOsc1.frequency.setTargetAtTime(50, now, 1.5);
        this.ambientOsc2.frequency.setTargetAtTime(75, now, 1.5);
        break;
      case 'europa':
        this.ambientFilter.frequency.setTargetAtTime(220, now, 1.5);
        this.ambientOsc1.frequency.setTargetAtTime(65, now, 1.5);
        this.ambientOsc2.frequency.setTargetAtTime(130, now, 1.5);
        break;
      case 'titan':
        this.ambientFilter.frequency.setTargetAtTime(110, now, 1.5);
        this.ambientOsc1.frequency.setTargetAtTime(38, now, 1.5);
        this.ambientOsc2.frequency.setTargetAtTime(76, now, 1.5);
        break;
    }
  }

  // Footstep crunch tailored to planetary surface
  playFootstep(planetKey) {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    let freq = 120;
    let duration = 0.08;
    let baseGain = 0.08;

    if (planetKey === 'moon') {
      freq = 80; duration = 0.12; baseGain = 0.05; // soft regolith powder
    } else if (planetKey === 'mars') {
      freq = 140; duration = 0.09; baseGain = 0.07; // crunchy gravel
    } else if (planetKey === 'europa') {
      freq = 240; duration = 0.05; baseGain = 0.06; // ice click
    } else if (planetKey === 'titan') {
      freq = 95; duration = 0.11; baseGain = 0.06; // damp hydrocarbon sand
    }

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq + Math.random() * 20 - 10, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    gain.gain.setValueAtTime(baseGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Scientific Equipment Pickup Chime (Crystal Arpeggio)
  playPickup() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.42);
    });
  }

  // Rocket Assembly and Welding Completion SFX
  playAssembly() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Power-up hum
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);

    // Confirmation chord at end
    setTimeout(() => {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach(f => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(t);
        o.stop(t + 0.82);
      });
    }, 750);
  }

  // Rocket Liftoff Blastoff Sequence (Sub-bass rumble + rising noise explosion)
  playLaunch() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Sub-bass rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 2.5);

    subGain.gain.setValueAtTime(0.1, now);
    subGain.gain.linearRampToValueAtTime(0.3, now + 0.6);
    subGain.gain.linearRampToValueAtTime(0.2, now + 2.0);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 3.6);

    // Resonant rocket blast roar
    const bufferSize = this.ctx.sampleRate * 3.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(180, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 1.5);
    noiseFilter.Q.setValueAtTime(2.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, now);
    noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.8);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noiseSrc.start(now);
    noiseSrc.stop(now + 3.5);
  }

  // Free Fire Tactical Radar Ping
  playRadarPing() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1250, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Tactical Target Lock Beep
  playTargetLock() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    
    [0, 0.08].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + delay;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(idx === 0 ? 1760 : 2200, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.07);
    });
  }

  // Badge Unlock Victory Stinger
  playBadgeUnlock() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chords.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  // Rover Electric Motor Drive SFX (Apollo LRV electric DC motor)
  playRoverDrive(speed = 1.0) {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140 * speed, now);
    osc.frequency.linearRampToValueAtTime(180 * speed, now + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Asteroid Atmospheric Whoosh
  playAsteroidWhoosh() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.45);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.52);
  }

  // Asteroid Heavy Surface Impact Explosion
  playAsteroidExplosion() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Sub-bass thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.4);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);

    // Crackle noise
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noiseSrc.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseSrc.start(now);
    noiseSrc.stop(now + 0.42);
  }

  // NASA Tactical Emergency Siren
  playWarningSiren() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.28;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.linearRampToValueAtTime(980, t + 0.14);
      osc.frequency.linearRampToValueAtTime(750, t + 0.28);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.29);
    }
  }

  // Energy Deflector Shield Hum / Deflect
  playShieldDeflect() {
    if (this.muted || !this.ctx) return;
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(580, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }
}

// Global audio engine singleton
window.soundEngine = new SoundEngine();