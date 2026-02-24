import { getServerSupabase } from "@/app/api/_helpers/supabase-helpers";
import type { Challenge, TruthSpec, AiBrief, ChallengeMeta } from "@/lib/types";
import { readFile, readdir } from "fs/promises";
import { join } from "path";

/**
 * Loads a challenge from Supabase DB, falling back to local filesystem.
 */
export async function loadChallenge(
  challengeId: string
): Promise<Challenge | null> {
  // Try DB first
  try {
    const challenge = await loadFromDB(challengeId);
    if (challenge) return challenge;
  } catch {
    // DB unavailable — fall through to filesystem
  }

  // Fallback to local filesystem
  return loadFromFilesystem(challengeId);
}

async function loadFromDB(challengeId: string): Promise<Challenge | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    difficulty: (data.difficulty ?? "medium") as Challenge["difficulty"],
    tags: data.tags ?? [],
    truthSpec: data.truth_spec as TruthSpec,
    aiBrief: data.ai_brief as AiBrief,
    starterCode: data.starter_code ?? {},
    meta: data.meta as ChallengeMeta,
  };
}

async function loadFromFilesystem(
  challengeId: string
): Promise<Challenge | null> {
  try {
    const challengeDir = join(
      process.cwd(),
      "src",
      "challenges",
      challengeId
    );
    const raw = await readFile(join(challengeDir, "challenge.json"), "utf-8");
    return JSON.parse(raw) as Challenge;
  } catch {
    return null;
  }
}

/**
 * Loads test files for a challenge from the filesystem.
 * Returns a map of filename → content.
 */
export async function loadChallengeTestFiles(
  challengeId: string
): Promise<Record<string, string>> {
  const testsDir = join(
    process.cwd(),
    "src",
    "challenges",
    challengeId,
    "tests"
  );
  try {
    const entries = await readdir(testsDir);
    const testFiles: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.endsWith(".ts") || entry.endsWith(".js")) {
        const content = await readFile(join(testsDir, entry), "utf-8");
        testFiles[entry] = content;
      }
    }
    return testFiles;
  } catch {
    return {};
  }
}
