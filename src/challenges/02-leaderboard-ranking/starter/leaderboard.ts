export interface Player {
  name: string;
  score: number;
  gamesPlayed: number;
}

export interface RankedPlayer extends Player {
  rank: number;
}

/**
 * Ranks players according to the leaderboard rules.
 * @param players - Array of player objects
 * @returns Sorted array with rank field added
 */
export function rankPlayers(players: Player[]): RankedPlayer[] {
  // TODO: Implement ranking
  return [];
}
