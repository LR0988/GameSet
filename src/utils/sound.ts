// Web Audio API Synthesizer, Preloaded Audio Elements & Speech Synthesis for N-Back & Games

// Letter frequencies for distinct melodic pitch (C4 to G5)
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

// Generates an inline PCM WAV data URI (works 100% in all browsers via new Audio(uri).play())
function createWavUri(freq: number, duration: number = 0.25, volume: number = 0.75): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples);

  // RIFF header
  buffer.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  const fileLen = 36 + numSamples;
  buffer[4] = fileLen & 0xff;
  buffer[5] = (fileLen >> 8) & 0xff;
  buffer[6] = (fileLen >> 16) & 0xff;
  buffer[7] = (fileLen >> 24) & 0xff;
  buffer.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  buffer.set([16, 0, 0, 0], 16); // 16 bytes format chunk
  buffer.set([1, 0], 20); // format 1: PCM
  buffer.set([1, 0], 22); // 1 channel: mono
  // sample rate 22050 (0x5622)
  buffer[24] = 0x22;
  buffer[25] = 0x56;
  buffer[26] = 0;
  buffer[27] = 0;
  // byte rate 22050
  buffer[28] = 0x22;
  buffer[29] = 0x56;
  buffer[30] = 0;
  buffer[31] = 0;
  buffer.set([1, 0], 32); // block align
  buffer.set([8, 0], 34); // 8 bits per sample
  buffer.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  buffer[40] = numSamples & 0xff;
  buffer[41] = (numSamples >> 8) & 0xff;
  buffer[42] = (numSamples >> 16) & 0xff;
  buffer[43] = (numSamples >> 24) & 0xff;

  // Wave data (sine wave with linear fade-out)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const fade = 1 - (i / numSamples);
    const s = 128 + Math.round(120 * volume * fade * Math.sin(2 * Math.PI * freq * t));
    buffer[44 + i] = Math.max(0, Math.min(255, s));
  }

  // Convert binary to base64
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      // Preload recorded letter audios
      const letters = ['C', 'H', 'K', 'L', 'O', 'Q', 'R', 'T'];
      letters.forEach(letter => {
        try {
          const audio = new Audio(`/sounds/letter_${letter}.m4a`);
          audio.preload = 'auto';
          // Fallback to .wav if .m4a format fails on specific browser
          audio.addEventListener('error', () => {
            if (!audio.src.endsWith('.wav')) {
              audio.src = `/sounds/letter_${letter}.wav`;
              audio.load();
            }
          });
          this.audioCache.set(letter, audio);
        } catch {
          // Ignore
        }
      });

      // Load speech synthesis voices
      if ('speechSynthesis' in window) {
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }

      // Auto-unlock on first user interaction anywhere on the page
      const unlockHandler = () => {
        this.unlockAudio();
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      };
      window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
      window.addEventListener('click', unlockHandler, { once: true, passive: true });
      window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
      window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        this.voices = window.speechSynthesis.getVoices();
      } catch {
        // ignore
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Force-unlock audio on user click/interaction
  public unlockAudio() {
    this.isMuted = false;
    this.isUnlocked = true;

    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }

    // Warm up one audio element silently so mobile browsers grant full permission
    try {
      const sampleAudio = this.audioCache.get('C');
      if (sampleAudio) {
        sampleAudio.muted = true;
        sampleAudio.play().then(() => {
          sampleAudio.pause();
          sampleAudio.currentTime = 0;
          sampleAudio.muted = false;
        }).catch(() => {
          if (sampleAudio) sampleAudio.muted = false;
        });
      }
    } catch {
      // ignore
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Primary tone player with dual Web Audio & HTML5 Audio fallback
  public playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.25, volume: number = 0.6) {
    if (this.isMuted) return;

    let playedViaWebAudio = false;

    // 1. Try Web Audio API
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.linearRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
        playedViaWebAudio = true;
      }
    } catch {
      playedViaWebAudio = false;
    }

    // 2. Fallback to HTML5 Audio if Web Audio was not ready or failed
    if (!playedViaWebAudio || (this.ctx && this.ctx.state === 'suspended')) {
      try {
        const uri = createWavUri(freq, duration, volume);
        const audio = new Audio(uri);
        audio.volume = volume;
        audio.play().catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  // Position stimulus spatial tone (each grid square 0..8 has an ascending melodic tone)
  public playSpatialTone(posIndex: number) {
    if (this.isMuted) return;
    const baseFreq = 340;
    const freq = baseFreq + posIndex * 45;
    this.playTone(freq, 'sine', 0.2, 0.65);
  }

  // Auditory letter stimulus: Real recorded audio + speech synthesis + melodic pitch
  public speakLetter(letter: string) {
    if (this.isMuted) return;
    const cleanLetter = letter.toUpperCase();

    // 1. Always play musical pitch tone for immediate, crisp auditory stimulus
    const toneFreq = LETTER_FREQUENCIES[cleanLetter] || 440;
    this.playTone(toneFreq, 'triangle', 0.22, 0.55);

    // 2. Play high-fidelity human speech audio file
    let audioPlayed = false;
    const cached = this.audioCache.get(cleanLetter);
    if (cached) {
      try {
        cached.currentTime = 0;
        cached.volume = 1.0;
        const playPromise = cached.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              audioPlayed = true;
            })
            .catch(() => {
              // If audio element blocked or failed, trigger SpeechSynthesis
              if (!audioPlayed) {
                this.fallbackSpeech(cleanLetter);
              }
            });
        }
      } catch {
        this.fallbackSpeech(cleanLetter);
      }
    } else {
      this.fallbackSpeech(cleanLetter);
    }
  }

  // Fallback to browser SpeechSynthesis
  private fallbackSpeech(letter: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.lang = 'en-US';
        utterance.volume = 1.0;
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        if (this.voices.length > 0) {
          const enVoice = this.voices.find(v => v.lang.startsWith('en'));
          if (enVoice) utterance.voice = enVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // Tone was already played
      }
    }
  }

  // Instant test sound to verify audio output
  public testSound(): boolean {
    this.unlockAudio();

    // 1. Play an energetic 3-note melodic chime
    this.playTone(523.25, 'sine', 0.15, 0.7); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.7), 120); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.8), 240); // G5

    // 2. Play letter C speech
    setTimeout(() => {
      this.speakLetter('C');
    }, 400);

    return true;
  }

  // Game action feedback sounds
  public playCorrect() {
    if (this.isMuted) return;
    this.playTone(587.33, 'sine', 0.12, 0.6); // D5
    setTimeout(() => this.playTone(880, 'sine', 0.2, 0.7), 90); // A5
  }

  public playWrong() {
    if (this.isMuted) return;
    this.playTone(196, 'sawtooth', 0.25, 0.5); // G3 buzz
  }

  public playClick() {
    if (this.isMuted) return;
    this.playTone(520, 'sine', 0.08, 0.35);
  }

  public playLevelUp() {
    if (this.isMuted) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.2, 0.6), idx * 100);
    });
  }

  public playGameOver() {
    if (this.isMuted) return;
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sawtooth', 0.25, 0.4), idx * 120);
    });
  }
}

export const sound = new SoundEffects();
