import { NBackSessionStats, NBackSettings } from '../types';

const NBACK_SETTINGS_KEY = 'gameset_nback_settings';
const NBACK_HISTORY_KEY = 'gameset_nback_history';
const HIGHSCORES_KEY = 'gameset_highscores';

export const defaultNBackSettings: NBackSettings = {
  nLevel: 2,
  mode: 'dual',
  trials: 20,
  stimulusDuration: 600,
  intervalDuration: 2500,
  matchProbability: 0.35,
  adaptiveDifficulty: true,
  soundEnabled: true,
};

export const storage = {
  getNBackSettings(): NBackSettings {
    try {
      const data = localStorage.getItem(NBACK_SETTINGS_KEY);
      if (data) {
        return { ...defaultNBackSettings, ...JSON.parse(data) };
      }
    } catch {
      // fallback
    }
    return defaultNBackSettings;
  },

  saveNBackSettings(settings: NBackSettings) {
    try {
      localStorage.setItem(NBACK_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  },

  getNBackHistory(): NBackSessionStats[] {
    try {
      const data = localStorage.getItem(NBACK_HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return [];
  },

  saveNBackSession(session: NBackSessionStats) {
    try {
      const history = this.getNBackHistory();
      history.unshift(session);
      // Keep last 50 sessions
      if (history.length > 50) history.pop();
      localStorage.setItem(NBACK_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore
    }
  },

  getHighScore(gameId: string): number {
    try {
      const data = localStorage.getItem(HIGHSCORES_KEY);
      if (data) {
        const scores = JSON.parse(data);
        return scores[gameId] || 0;
      }
    } catch {
      // fallback
    }
    return 0;
  },

  saveHighScore(gameId: string, score: number) {
    try {
      const data = localStorage.getItem(HIGHSCORES_KEY);
      const scores = data ? JSON.parse(data) : {};
      if ((scores[gameId] || 0) < score) {
        scores[gameId] = score;
        localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(scores));
      }
    } catch {
      // Ignore
    }
  }
};
