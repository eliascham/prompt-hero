import { readFile, readdir } from "fs/promises";
import { join } from "path";
import type { Challenge, TruthSpec, AiBrief, ChallengeMeta } from "@/lib/types";

const CHALLENGES_DIR = join(process.cwd(), "src", "challenges");

/**
 * Loads a single challenge by ID from the filesystem.
 * Reads from the structured folder format: truth.md, ai-brief.md, meta.json, challenge.json
 */
export async function loadChallenge(
  id: string
): Promise<Challenge | null> {
  try {
    const dir = join(CHALLENGES_DIR, id);
    const raw = await readFile(join(dir, "challenge.json"), "utf-8");
    return JSON.parse(raw) as Challenge;
  } catch {
    return null;
  }
}

/**
 * Lists all available challenges with basic info.
 */
export async function listChallenges(): Promise<
  Array<{ id: string; title: string; difficulty: string; tags: string[] }>
> {
  const entries = await readdir(CHALLENGES_DIR, { withFileTypes: true });
  const challengeDirs = entries
    .filter((e) => e.isDirectory() && /^\d{2}-/.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const summaries: Array<{
    id: string;
    title: string;
    difficulty: string;
    tags: string[];
  }> = [];

  for (const dir of challengeDirs) {
    try {
      const metaRaw = await readFile(
        join(CHALLENGES_DIR, dir.name, "meta.json"),
        "utf-8"
      );
      const meta = JSON.parse(metaRaw) as {
        id: string;
        title: string;
        difficulty: string;
        tags: string[];
      };
      summaries.push({
        id: meta.id,
        title: meta.title,
        difficulty: meta.difficulty,
        tags: meta.tags,
      });
    } catch {
      // Skip malformed challenge directories
    }
  }

  return summaries;
}

/**
 * Loads all challenges fully (for seeding or bulk operations).
 */
export async function loadAllChallenges(): Promise<Challenge[]> {
  const entries = await readdir(CHALLENGES_DIR, { withFileTypes: true });
  const challengeDirs = entries
    .filter((e) => e.isDirectory() && /^\d{2}-/.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const challenges: Challenge[] = [];
  for (const dir of challengeDirs) {
    const challenge = await loadChallenge(dir.name);
    if (challenge) challenges.push(challenge);
  }
  return challenges;
}
