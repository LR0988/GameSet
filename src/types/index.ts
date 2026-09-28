export type GameId = 'nback' | 'stroop' | 'game2048' | 'snake' | 'minesweeper';

export type NBackMode = 'dual' | 'position' | 'audio' | 'color';

export interface NBackSettings {
  nLevel: number;
  mode: NBackMode;
  trials: number;
  stimulusDuration: number; // ms to show stimulus (e.g. 600ms)
  intervalDuration: number; // total trial time ms (e.g. 2500ms)
  matchProbability: number; // probability of match (e.g. 0.3)
  adaptiveDifficulty: boolean; // auto level up/down
  soundEnabled: boolean;
}

export interface NBackTrial {
  position: number; // 0 to 8 in a 3x3 grid
  letter: string; // 'A', 'C', 'H', 'K', 'L', 'O', 'Q', 'T'
  color?: string; // hex or color name
  isPositionMatch: boolean;
  isAudioMatch: boolean;
  isColorMatch?: boolean;
}

export interface NBackResponse {
  positionPressed: boolean;
  audioPressed: boolean;
  colorPressed?: boolean;
}

export interface NBackTrialResult {
  trialIndex: number;
  trial: NBackTrial;
  response: NBackResponse;
  positionResult: 'hit' | 'miss' | 'false_alarm' | 'correct_rejection' | 'not_applicable';
  audioResult: 'hit' | 'miss' | 'false_alarm' | 'correct_rejection' | 'not_applicable';
}

export interface NBackSessionStats {
  date: string;
  nLevel: number;
  mode: NBackMode;
  totalTrials: number;
  positionHits: number;
  positionMisses: number;
  positionFalseAlarms: number;
  positionCorrectRejections: number;
  positionAccuracy: number;
  audioHits: number;
  audioMisses: number;
  audioFalseAlarms: number;
  audioCorrectRejections: number;
  audioAccuracy: number;
  overallAccuracy: number;
  score: number;
}

export interface SavedUser {
  id: string;
  displayName: string;
  email: string;
  isGuest: boolean;
  avatarColor: string;
  lastLoginAt: number;
  totalGamesPlayed?: number;
  highScores?: Partial<Record<GameId, number>>;
}

export interface GameHistoryEntry {
  id: string;
  gameId: GameId;
  score: number;
  date: string;
  timestamp: number;
  details?: Record<string, any>;
  userId?: string;
  userName?: string;
  isSample?: boolean;
}
