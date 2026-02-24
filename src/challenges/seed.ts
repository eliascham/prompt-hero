/**
 * Seed script: inserts all challenges into Supabase.
 * Run with: npx tsx src/challenges/seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import { loadAllChallenges } from "./loader";

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const challenges = await loadAllChallenges();

  if (challenges.length === 0) {
    console.error("No challenges found in src/challenges/");
    process.exit(1);
  }

  console.log(`Seeding ${challenges.length} challenges...`);

  for (const c of challenges) {
    const { error } = await supabase.from("challenges").upsert(
      {
        id: c.id,
        title: c.title,
        difficulty: c.difficulty,
        tags: c.tags,
        truth_spec: c.truthSpec as unknown as Record<string, unknown>,
        ai_brief: c.aiBrief as unknown as Record<string, unknown>,
        starter_code: c.starterCode,
        meta: c.meta as unknown as Record<string, unknown>,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error(`Failed to seed ${c.id}:`, error.message);
    } else {
      console.log(`  ✓ ${c.id} — ${c.title}`);
    }
  }

  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
