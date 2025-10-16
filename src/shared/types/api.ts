export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
  personalBest: number;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type LeaderboardEntry = {
  username: string;
  score: number;
  timestamp: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
};

export type SubmitScoreRequest = {
  score: number;
};

export type SubmitScoreResponse = {
  success: boolean;
  rank?: number;
};
