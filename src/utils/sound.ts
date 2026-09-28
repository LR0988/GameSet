// Web Audio API Synthesizer and Speech Synthesis for N-Back & Games

// Letter to distinct musical pitch mapping for auditory stimulus
const LETTER_FREQUENCIES: Record<string, number> = {
  'C': 261.63, // C4
  'H': 329.63, // E4
  'K': 392.00, // G4
  'L': 440.00, // A4
  'O': 523.25, // C5
  'Q': 587.33, // D5
  'R': 659.25, // E5
  'T': 783.99, // G5
};

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public initCtx() {
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

  // Must be called on user interaction (e.g. clicking Start Game) to unlock browser audio policy
  public unlockAudio() {
    this.initCtx();
    this.isUnlocked = true;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.2, gainVal: number = 0.25) {
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

  // Spatial ping for grid positions (N-Back position stimulus)
  public playSpatialTone(posIndex: number) {
    if (this.isMuted) return;
    // Ascending melodic scale depending on position (0 to 8)
    const baseFreq = 350;
    const freq = baseFreq + posIndex * 40;
    this.playTone(freq, 'sine', 0.18, 0.28);
  }

  // Auditory letter tone + Speech Synthesis
  public speakLetter(letter: string) {
    if (this.isMuted) return;

    // 1. Always play the unique pitch for this letter (guarantees audible sound even if TTS fails)
    const toneFreq = LETTER_FREQUENCIES[letter.toUpperCase()] || 440;
    this.playTone(toneFreq, 'triangle', 0.25, 0.35);

    // 2. Play spoken English letter via SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.lang = 'en-US';
        utterance.volume = 1.0;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Try to pick an English voice if available
        if (this.voices.length > 0) {
          const enVoice = this.voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Siri')));
          if (enVoice) utterance.voice = enVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback tone already played above
      }
    }
  }

  // Correct match chime
  public playCorrect() {
    if (this.isMuted) return;
    this.playTone(587.33, 'sine', 0.12, 0.25); // D5
    setTimeout(() => this.playTone(880, 'sine', 0.18, 0.25), 80); // A5
  }

  // Wrong match buzz
  public playWrong() {
    if (this.isMuted) return;
    this.playTone(196, 'sawtooth', 0.22, 0.2); // G3 buzz
  }

  // Button click
  public playClick() {
    if (this.isMuted) return;
    this.playTone(520, 'sine', 0.08, 0.15);
  }

  // Level up celebration
  public playLevelUp() {
    if (this.isMuted) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.25), idx * 100);
    });
  }

  // Game over
  public playGameOver() {
    if (this.isMuted) return;
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.25, 0.15), idx * 120);
    });
  }
}

export const sound = new SoundEffects();
