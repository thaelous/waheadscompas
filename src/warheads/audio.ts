/**
 * Web Audio API Procedural Sound Synthesizer for WarHeads (1997)
 * Pure procedural audio generation without external sound files
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.generateNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2.0;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  public unlock() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Retro metallic chime for collecting gold coins
   */
  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Dual-tone high pitch chime
    osc1.frequency.setValueAtTime(1320, t);
    osc1.frequency.setValueAtTime(1760, t + 0.08);

    osc2.frequency.setValueAtTime(2640, t);
    osc2.frequency.setValueAtTime(3520, t + 0.08);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  /**
   * Orbital Thruster Roar for Hyper-Jump
   */
  public playHyperJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.noiseBuffer) return;

    const t = this.ctx.currentTime;
    const dur = 0.85;

    // Heavy rocket thruster noise
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.linearRampToValueAtTime(750, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(90, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    // Deep low sub engine rumble
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(80, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + dur);

    subGain.gain.setValueAtTime(0.3, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);

    noise.start(t);
    sub.start(t);
    noise.stop(t + dur);
    sub.stop(t + dur);
  }

  /**
   * FM synthesized whistle / launch whine
   */
  public playLaunch(weaponSpeed = 1.0, isMega = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.45 / weaponSpeed;

    // Carrier oscillator
    const carrier = this.ctx.createOscillator();
    const carrierGain = this.ctx.createGain();

    // Modulator oscillator for FM
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();

    carrier.type = isMega ? 'sawtooth' : 'triangle';
    mod.type = 'sine';

    const startFreq = isMega ? 220 : 440;
    const endFreq = isMega ? 90 : 180;
    carrier.frequency.setValueAtTime(startFreq, t);
    carrier.frequency.exponentialRampToValueAtTime(endFreq, t + dur);

    mod.frequency.setValueAtTime(140, t);
    mod.frequency.linearRampToValueAtTime(40, t + dur);

    modGain.gain.setValueAtTime(160, t);
    modGain.gain.exponentialRampToValueAtTime(10, t + dur);

    mod.connect(carrier.frequency);

    carrierGain.gain.setValueAtTime(0.01, t);
    carrierGain.gain.linearRampToValueAtTime(0.28, t + 0.04);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    carrier.connect(carrierGain);
    carrierGain.connect(this.ctx.destination);

    carrier.start(t);
    mod.start(t);
    carrier.stop(t + dur);
    mod.stop(t + dur);
  }

  /**
   * Low-pass filtered noise burst + sub-bass punch for explosions
   */
  public playExplosion(radius = 32, isSpecial = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.noiseBuffer) return;

    const t = this.ctx.currentTime;
    const scale = Math.min(2.5, Math.max(0.6, radius / 35));
    const dur = 0.5 * scale;

    // Sub-bass thud
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + dur * 0.7);

    subGain.gain.setValueAtTime(0.4 * scale, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + dur * 0.7);

    // Noise blast with swept lowpass filter
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isSpecial ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(isSpecial ? 1600 : 800 * scale, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + dur);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55 * scale, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + dur);
  }

  /**
   * Crunchy rock crumbling sound when asteroid/planet terrain is carved
   */
  public playRockCrumble() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.noiseBuffer) return;

    const t = this.ctx.currentTime;
    const dur = 0.35;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, t);
    filter.Q.setValueAtTime(3.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + dur);
  }

  /**
   * Mechanical tactile tick for dial rotation & power adjustment
   */
  public playDialTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.setValueAtTime(520, t + 0.008);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.02);
  }

  /**
   * Retro terminal confirmation beep
   */
  public playBeep(freq = 880, dur = 0.06) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + dur);
  }

  /**
   * Retro 1997 Victory Synth Fanfare (ascending arpeggiated chords)
   */
  public playVictory() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const noteTime = t + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === notes.length - 1 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq, noteTime);

      const dur = idx === notes.length - 1 ? 0.8 : 0.22;
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });
  }

  /**
   * Tactical military planetary scanner chirp and resonant sweep
   */
  public playScanner() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    subOsc.type = 'triangle';

    // Rapid tactical telemetry pitch sweep
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(1480, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.25);

    subOsc.frequency.setValueAtTime(310, t);
    subOsc.frequency.exponentialRampToValueAtTime(740, t + 0.12);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    subOsc.start(t);
    osc.stop(t + 0.28);
    subOsc.stop(t + 0.28);
  }
}

export const sound = new SoundEngine();
