# Leaderboard Ranking

## Overview
Implement a leaderboard ranking system that sorts players by score with specific tiebreaking rules.

## Requirements
1. Accept an array of player objects with: name, score, gamesPlayed
2. Sort players by score in descending order (highest first)
3. For tied scores, rank by **fewest games played** first (efficiency tiebreaker)
4. For ties in both score and games, sort **alphabetically** by name
5. Assign rank numbers (1-based) — tied players get the same rank, next rank skips
6. Return sorted array with rank field added

## Edge Cases
- Empty input returns empty array
- Single player gets rank 1
- All players tied: rank by games, then alphabetically
- Multiple ties at different score levels

## Test Summary
5 tests covering: basic sorting, efficiency tiebreaker, alphabetical tiebreaker, rank numbering with skips, and empty input.
