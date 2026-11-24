/**
 * Web Audio API Sound System
 * - Traditional Thai Ranat Ek / Pentatonic Chime Music
 * - Riverside & Carnival Ambience (Water flow & temple bell chimes)
 * - Firework Launch & Explosive Burst Sound Synthesis
 * - Candle Sparkle / Match Ignite Sound
 * - Mini-game SFX: Dart throw, Balloon pop, Ball throw, Target bell, Dunk splash, Fanfare cheer!
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMusicPlaying = false;
    this.isAmbiancePlaying = true;

    this.masterGain = null;
    this.ambientGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.timerId = null;

    // Classic Loy Krathong melody notes
    this.notes = [
      { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'C5', dur: 0.75 }, { note: 'D5', dur: 0.25 },
      { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 1.0 },

      { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 0.5 },
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 1.0 },

      { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'A4', dur: 0.5 }, { note: 'C5', dur: 0.5 }, { note: 'D5', dur: 1.0 },

      { note: 'E5', dur: 0.5 }, { note: 'D5', dur: 0.5 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 0.5 },
      { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'C5', dur: 1.0 },

      { note: 'D5', dur: 0.5 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 },
      { note: 'C5', dur: 1.0 }, { note: 'rest', dur: 0.5 },

      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 },
      { note: 'C5', dur: 1.5 }, { note: 'rest', dur: 0.5 }
    ];

    this.frequencies = {
      'D4': 293.66,
      'E4': 329.63,
      'G4': 392.00,
      'A4': 440.00,
      'C5': 523.25,
      'D5': 587.33,
      'E5': 659.25,
      'G5': 783.99,
      'A5': 880.00
    };
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initRiverAmbiance();
      this.initCarnivalChimeAmbiance();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initRiverAmbiance() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.4, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);
    whiteNoise.start();
  }

  initCarnivalChimeAmbiance() {
    const playTempleChime = () => {
      if (!this.ctx || !this.isAmbiancePlaying) return;
      const chimeFreqs = [523.25, 659.25, 783.99, 1046.5];
      const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.2);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 3.3);

      setTimeout(playTempleChime, 4500 + Math.random() * 6000);
    };

    setTimeout(playTempleChime, 2000);
  }

  playRanatNote(freq, time, duration) {
    if (!this.ctx || !freq) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.01, time);

    const now = time;
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.2, now + 0.15);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.6);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.musicGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration * 1.8);
    osc2.stop(now + duration * 1.8);
  }

  playMelodyLoop() {
    if (!this.isMusicPlaying) return;

    let time = this.ctx.currentTime + 0.1;
    const tempo = 0.55;

    this.notes.forEach(item => {
      const duration = item.dur * tempo;
      if (item.note !== 'rest' && this.frequencies[item.note]) {
        this.playRanatNote(this.frequencies[item.note], time, duration);
      }
      time += duration;
    });

    const loopDuration = time - this.ctx.currentTime;
    this.timerId = setTimeout(() => {
      if (this.isMusicPlaying) {
        this.playMelodyLoop();
      }
    }, loopDuration * 1000);
  }

  toggleMusic() {
    this.ensureContext();
    this.isMusicPlaying = !this.isMusicPlaying;

    if (this.isMusicPlaying) {
      this.musicGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.5);
      this.playMelodyLoop();
    } else {
      if (this.timerId) clearTimeout(this.timerId);
      this.musicGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    }

    return this.isMusicPlaying;
  }

  toggleAmbiance() {
    this.ensureContext();
    this.isAmbiancePlaying = !this.isAmbiancePlaying;

    if (this.isAmbiancePlaying) {
      this.ambientGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.4);
    } else {
      this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    }

    return this.isAmbiancePlaying;
  }

  // --- Firework Launch Sound ---
  playFireworkLaunch() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(800 + Math.random() * 200, now + 0.9);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.0);
  }

  // --- Firework Explosion Burst Sound ---
  playFireworkBurst() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.8);

    const bufferSize = this.ctx.sampleRate * 0.8;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.22));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.Q.setValueAtTime(1.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
  }

  // --- Candle Ignition / Flare Sound ---
  playIgnite() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // --- Mini-game SFX ---

  // Dart Throw Whoosh
  playDartThrow() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.18);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Balloon Pop (Sharp Snap)
  playBalloonPop() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Pop thud
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // High frequency rubber snap noise
    const bufferSize = this.ctx.sampleRate * 0.12;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.02));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  // Ball Throw
  playBallThrow() {
    this.ensureContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // Target Hit Clack/Bell (โดนเป้า)
  playTargetHit() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Metallic gong bell ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.4);

    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Dunk Tank Water Splash (น้ำกระจาย)
  playDunkSplash() {
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Heavy water impact noise
    const bufferSize = this.ctx.sampleRate * 0.9;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.linearRampToValueAtTime(250, now + 0.8);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.88);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  // Fanfare / Reward Chime (ปลดล็อกของรางวัล)
  playCheerReward() {
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    let time = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time + idx * 0.1);

      gain.gain.setValueAtTime(0.001, time + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.45, time + idx * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + idx * 0.1 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time + idx * 0.1);
      osc.stop(time + idx * 0.1 + 0.65);
    });
  }
}
