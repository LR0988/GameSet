import { NBackSessionStats, NBackSettings, SavedUser, GameHistoryEntry, GameId } from '../types';

const NBACK_SETTINGS_KEY = 'gameset_nback_settings';
const NBACK_HISTORY_KEY = 'gameset_nback_history';
const HIGHSCORES_KEY = 'gameset_highscores';
const SAVED_USERS_KEY = 'gameset_saved_users';
const ACTIVE_USER_ID_KEY = 'gameset_active_user_id';
const GAME_HISTORY_KEY = 'gameset_all_game_history';

export const defaultNBackSettings: NBackSettings = {
  nLevel: 2,
  mode: 'dual',
  trials: 20,
  stimulusDuration: 500,
  intervalDuration: 1800,
  matchProbability: 0.35,
  adaptiveDifficulty: true,
  soundEnabled: true,
};

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-indigo-600',
];

export const storage = {
  // --- N-Back Settings ---
  getNBackSettings(): NBackSettings {
    try {
      const data = localStorage.getItem(NBACK_SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.intervalDuration === 2500) {
          parsed.intervalDuration = 1800;
        }
        if (parsed.stimulusDuration === 600) {
          parsed.stimulusDuration = 500;
        }
        return { ...defaultNBackSettings, ...parsed };
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

  // --- N-Back Specific Sessions ---
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
      if (history.length > 50) history.pop();
      localStorage.setItem(NBACK_HISTORY_KEY, JSON.stringify(history));

      // Also record into unified game history
      this.saveGameRecord({
        gameId: 'nback',
        score: session.score,
        details: {
          nLevel: session.nLevel,
          mode: session.mode,
          accuracy: session.overallAccuracy,
        },
      });
    } catch {
      // Ignore
    }
  },

  // --- High Scores ---
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
  },

  // --- Saved Free Users / Quick Profiles ---
  getSavedUsers(): SavedUser[] {
    try {
      const data = localStorage.getItem(SAVED_USERS_KEY);
      let list: SavedUser[] = data ? JSON.parse(data) : [];

      // Auto-detect previous Supabase user logins from browser localStorage
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
            try {
              const sessionVal = JSON.parse(localStorage.getItem(k) || '{}');
              const sbUser = sessionVal?.user;
              if (sbUser) {
                const name = sbUser.user_metadata?.display_name || sbUser.email?.split('@')[0] || '會員玩家';
                const exists = list.some(u => u.id === sbUser.id || u.email === sbUser.email);
                if (!exists) {
                  list.unshift({
                    id: sbUser.id,
                    displayName: name,
                    email: sbUser.email || '',
                    isGuest: false,
                    avatarColor: 'from-indigo-500 to-purple-600',
                    lastLoginAt: Date.now(),
                  });
                }
              }
            } catch {
              // ignore
            }
          }
        }
      }

      // If still empty, provide friendly preset free users ready for instant 1-click play
      if (list.length === 0) {
        list = [
          {
            id: 'preset_challenger',
            displayName: '大腦挑戰者 (免費玩家)',
            email: 'challenger@gameset.local',
            isGuest: true,
            avatarColor: 'from-indigo-500 to-purple-600',
            lastLoginAt: Date.now(),
          },
          {
            id: 'preset_memory',
            displayName: '記憶大師 (免費玩家)',
            email: 'memory@gameset.local',
            isGuest: true,
            avatarColor: 'from-cyan-500 to-blue-600',
            lastLoginAt: Date.now() - 3600000,
          },
          {
            id: 'preset_speed',
            displayName: '極限神經元 (免費玩家)',
            email: 'speed@gameset.local',
            isGuest: true,
            avatarColor: 'from-emerald-400 to-teal-600',
            lastLoginAt: Date.now() - 7200000,
          },
        ];
        localStorage.setItem(SAVED_USERS_KEY, JSON.stringify(list));
      }

      return list.sort((a, b) => b.lastLoginAt - a.lastLoginAt);
    } catch {
      return [];
    }
  },

  saveUser(user: SavedUser) {
    try {
      const users = this.getSavedUsers().filter(u => u.id !== user.id && u.email !== user.email);
      users.unshift(user);
      if (users.length > 15) users.pop();
      localStorage.setItem(SAVED_USERS_KEY, JSON.stringify(users));
      this.setActiveUserId(user.id);
    } catch {
      // Ignore
    }
  },

  removeSavedUser(id: string) {
    try {
      const users = this.getSavedUsers().filter(u => u.id !== id);
      localStorage.setItem(SAVED_USERS_KEY, JSON.stringify(users));
      if (this.getActiveUserId() === id) {
        this.setActiveUserId(null);
      }
    } catch {
      // Ignore
    }
  },

  getActiveUserId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_USER_ID_KEY);
    } catch {
      return null;
    }
  },

  setActiveUserId(id: string | null) {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_USER_ID_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_USER_ID_KEY);
      }
    } catch {
      // Ignore
    }
  },

  getRandomAvatarGradient(): string {
    return AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
  },

  // --- Unified Game History & Score Trends ---
  getGameHistory(
    gameId?: GameId,
    userId?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): GameHistoryEntry[] {
    try {
      const data = localStorage.getItem(GAME_HISTORY_KEY);
      let list: GameHistoryEntry[] = data ? JSON.parse(data) : [];

      // If empty, generate some initial sample data so charts & history look great immediately
      if (list.length === 0) {
        list = this.generateInitialSampleHistory();
        localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(list));
      }

      let filtered = [...list];
      if (gameId) {
        filtered = filtered.filter(item => item.gameId === gameId);
      }

      if (userId) {
        const userSpecific = filtered.filter(item => item.userId === userId);
        if (userSpecific.length > 0) {
          filtered = userSpecific;
        } else {
          // If this user has no played games yet, provide sample games tagged as demo
          // so the user can immediately preview and interact with the history selector
          filtered = filtered.filter(item => item.isSample || !item.userId);
        }
      }

      filtered.sort((a, b) => (sortOrder === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp));
      return filtered;
    } catch {
      return [];
    }
  },

  getUserHighScore(gameId: GameId, userId?: string): number {
    try {
      const targetUserId = userId || this.getActiveUserId();
      if (targetUserId) {
        const users = this.getSavedUsers();
        const u = users.find(user => user.id === targetUserId);
        if (u?.highScores?.[gameId]) {
          return u.highScores[gameId]!;
        }
        const userRecords = this.getGameHistory(gameId, targetUserId);
        if (userRecords.length > 0) {
          const userMax = Math.max(...userRecords.map(r => r.score));
          if (userMax > 0) return userMax;
        }
      }
      return this.getHighScore(gameId);
    } catch {
      return 0;
    }
  },

  saveGameRecord(entry: {
    gameId: GameId;
    score: number;
    details?: Record<string, any>;
    date?: string;
    timestamp?: number;
    userId?: string;
    userName?: string;
  }): GameHistoryEntry {
    try {
      const activeId = entry.userId || this.getActiveUserId() || 'guest_user';
      const users = this.getSavedUsers();
      const activeUser = users.find(u => u.id === activeId);
      const userName = entry.userName || activeUser?.displayName || '玩家';

      const data = localStorage.getItem(GAME_HISTORY_KEY);
      const list: GameHistoryEntry[] = data ? JSON.parse(data) : [];

      const record: GameHistoryEntry = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        gameId: entry.gameId,
        score: entry.score,
        date: entry.date || new Date().toLocaleString('zh-TW', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: entry.timestamp || Date.now(),
        details: entry.details,
        userId: activeId,
        userName: userName,
        isSample: false,
      };

      list.push(record);

      // Keep max 300 records to prevent memory bloat
      if (list.length > 300) list.shift();

      localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(list));
      this.saveHighScore(entry.gameId, entry.score);

      // Also update SavedUser high score & games count
      if (activeUser) {
        const curHigh = activeUser.highScores?.[entry.gameId] || 0;
        const updatedUser: SavedUser = {
          ...activeUser,
          totalGamesPlayed: (activeUser.totalGamesPlayed || 0) + 1,
          highScores: {
            ...activeUser.highScores,
            [entry.gameId]: Math.max(curHigh, entry.score),
          },
        };
        this.saveUser(updatedUser);
      }

      return record;
    } catch {
      return {
        id: 'tmp',
        gameId: entry.gameId,
        score: entry.score,
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
      };
    }
  },

  generateInitialSampleHistory(): GameHistoryEntry[] {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const hour = 60 * 60 * 1000;

    return [
      // N-Back progressive learning curve
      { id: 'sample_nb_1', gameId: 'nback', score: 120, timestamp: now - 3 * day - 4 * hour, date: '3天前 10:20', details: { nLevel: 2, accuracy: 60 }, userId: 'preset_challenger', userName: '大腦挑戰者', isSample: true },
      { id: 'sample_nb_2', gameId: 'nback', score: 150, timestamp: now - 3 * day, date: '3天前 14:15', details: { nLevel: 2, accuracy: 75 }, userId: 'preset_challenger', userName: '大腦挑戰者', isSample: true },
      { id: 'sample_nb_3', gameId: 'nback', score: 170, timestamp: now - 2 * day - 2 * hour, date: '2天前 11:30', details: { nLevel: 2, accuracy: 85 }, userId: 'preset_memory', userName: '記憶大師', isSample: true },
      { id: 'sample_nb_4', gameId: 'nback', score: 210, timestamp: now - 2 * day, date: '2天前 16:45', details: { nLevel: 3, accuracy: 70 }, userId: 'preset_memory', userName: '記憶大師', isSample: true },
      { id: 'sample_nb_5', gameId: 'nback', score: 240, timestamp: now - 1 * day - 3 * hour, date: '昨天 09:10', details: { nLevel: 3, accuracy: 80 }, userId: 'preset_speed', userName: '極限神經元', isSample: true },
      { id: 'sample_nb_6', gameId: 'nback', score: 280, timestamp: now - 4 * hour, date: '今天 08:30', details: { nLevel: 3, accuracy: 93 }, userId: 'preset_speed', userName: '極限神經元', isSample: true },

      // Stroop Effect
      { id: 'sample_st_1', gameId: 'stroop', score: 140, timestamp: now - 3 * day, date: '3天前 11:00', details: { streak: 6 }, userId: 'preset_challenger', userName: '大腦挑戰者', isSample: true },
      { id: 'sample_st_2', gameId: 'stroop', score: 190, timestamp: now - 2 * day, date: '2天前 15:20', details: { streak: 9 }, userId: 'preset_challenger', userName: '大腦挑戰者', isSample: true },
      { id: 'sample_st_3', gameId: 'stroop', score: 230, timestamp: now - 1 * day, date: '昨天 14:05', details: { streak: 12 }, userId: 'preset_speed', userName: '極限神經元', isSample: true },
      { id: 'sample_st_4', gameId: 'stroop', score: 280, timestamp: now - 3 * hour, date: '今天 09:20', details: { streak: 16 }, userId: 'preset_speed', userName: '極限神經元', isSample: true },

      // 2048
      { id: 'sample_2048_1', gameId: 'game2048', score: 1840, timestamp: now - 2 * day, date: '2天前 18:00', details: { maxTile: 512 }, userId: 'preset_challenger', userName: '大腦挑戰者', isSample: true },
      { id: 'sample_2048_2', gameId: 'game2048', score: 3260, timestamp: now - 1 * day, date: '昨天 20:30', details: { maxTile: 1024 }, userId: 'preset_memory', userName: '記憶大師', isSample: true },
      { id: 'sample_2048_3', gameId: 'game2048', score: 5880, timestamp: now - 2 * hour, date: '今天 10:15', details: { maxTile: 2048 }, userId: 'preset_speed', userName: '極限神經元', isSample: true },

      // Snake
      { id: 'sample_snk_1', gameId: 'snake', score: 80, timestamp: now - 3 * day, date: '3天前 16:00', details: { length: 11 }, userId: 'preset_challenger', userName: '大腦挑戰者', isSample: true },
      { id: 'sample_snk_2', gameId: 'snake', score: 140, timestamp: now - 2 * day, date: '2天前 17:30', details: { length: 17 }, userId: 'preset_memory', userName: '記憶大師', isSample: true },
      { id: 'sample_snk_3', gameId: 'snake', score: 210, timestamp: now - 1 * hour, date: '今天 11:00', details: { length: 24 }, userId: 'preset_speed', userName: '極限神經元', isSample: true },
    ];
  },
};
