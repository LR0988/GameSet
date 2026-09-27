// Web Audio API Synthesizer and Speech Synthesis for N-Back & Games

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.15, gainVal: number = 0.15) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore audio context autoplay errors
    }
  }

  // Pre-configured game sound effects
  public playCorrect() {
    if (this.isMuted) return;
    this.playTone(587.33, 'sine', 0.12, 0.15); // D5
    setTimeout(() => this.playTone(880, 'sine', 0.18, 0.15), 80); // A5
  }

  public playWrong() {
    if (this.isMuted) return;
    this.playTone(196, 'sawtooth', 0.25, 0.15); // G3 buzz
  }

  public playClick() {
    if (this.isMuted) return;
    this.playTone(440, 'triangle', 0.05, 0.08);
  }

  public playLevelUp() {
    if (this.isMuted) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.2), idx * 100);
    });
  }

  public playGameOver() {
    if (this.isMuted) return;
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.25, 0.12), idx * 120);
    });
  }

  // Speak letter using SpeechSynthesis with fallback tone
  public speakLetter(letter: string) {
    if (this.isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel pending utterances
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback tone for the letter
      const letterCode = letter.charCodeAt(0);
      const freq = 300 + (letterCode % 10) * 80;
      this.playTone(freq, 'sine', 0.3, 0.2);
    }
  }
}

export const sound = new SoundEffects();
