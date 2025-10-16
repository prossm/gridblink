export type GameState = 'intro' | 'playing' | 'computer-turn' | 'player-turn' | 'game-over';

export interface GameData {
  state: GameState;
  sequence: number[];
  playerSequence: number[];
  score: number;
  currentLevel: number;
  isFlashing: boolean;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  timestamp: number;
  rank?: number;
}

export type LeaderboardType = 'daily' | 'weekly' | 'alltime';
