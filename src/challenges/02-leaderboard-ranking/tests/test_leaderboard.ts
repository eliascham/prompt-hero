import { rankPlayers, Player } from "../starter/leaderboard";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

// Test 1: Basic score sorting
const basicPlayers: Player[] = [
  { name: "Charlie", score: 100, gamesPlayed: 10 },
  { name: "Alice", score: 300, gamesPlayed: 15 },
  { name: "Bob", score: 200, gamesPlayed: 8 },
];
const basicResult = rankPlayers(basicPlayers);
assert(basicResult[0].name === "Alice", "basic sorting - highest score first");
assert(basicResult[1].name === "Bob", "basic sorting - second highest score second");
assert(basicResult[2].name === "Charlie", "basic sorting - lowest score last");

// Test 2: Efficiency tiebreaker (fewest games played wins)
const tiedPlayers: Player[] = [
  { name: "Dan", score: 250, gamesPlayed: 20 },
  { name: "Eve", score: 250, gamesPlayed: 10 },
  { name: "Frank", score: 250, gamesPlayed: 15 },
];
const tiedResult = rankPlayers(tiedPlayers);
assert(
  tiedResult[0].name === "Eve",
  "efficiency tiebreaker - fewest games wins tie - tiebreaker order incorrect"
);
assert(
  tiedResult[1].name === "Frank",
  "efficiency tiebreaker - second fewest games second"
);
assert(
  tiedResult[2].name === "Dan",
  "efficiency tiebreaker - most games last"
);

// Test 3: Alphabetical tiebreaker (when score AND games tied)
const fullTie: Player[] = [
  { name: "Charlie", score: 200, gamesPlayed: 10 },
  { name: "Alice", score: 200, gamesPlayed: 10 },
  { name: "Bob", score: 200, gamesPlayed: 10 },
];
const alphaResult = rankPlayers(fullTie);
assert(
  alphaResult[0].name === "Alice",
  "alphabetical tiebreaker - alphabetical when all else tied - sort order incorrect"
);
assert(alphaResult[1].name === "Bob", "alphabetical tiebreaker - B before C");
assert(alphaResult[2].name === "Charlie", "alphabetical tiebreaker - C last");

// Test 4: Rank numbering with skips
const mixedPlayers: Player[] = [
  { name: "Alice", score: 300, gamesPlayed: 10 },
  { name: "Bob", score: 200, gamesPlayed: 5 },
  { name: "Charlie", score: 200, gamesPlayed: 8 },
  { name: "Dan", score: 100, gamesPlayed: 3 },
];
const rankedResult = rankPlayers(mixedPlayers);
assert(rankedResult[0].rank === 1, "rank numbers - first place gets rank 1");
assert(
  rankedResult[1].rank === 2 && rankedResult[2].rank === 2,
  "rank numbers - tied players share same rank - rank assignment incorrect"
);
assert(rankedResult[3].rank === 4, "rank numbers - rank skips after tie (2,2 -> 4)");

// Test 5: Empty input
const emptyResult = rankPlayers([]);
assert(emptyResult.length === 0, "empty input - returns empty array");

console.log("All tests passed!");
