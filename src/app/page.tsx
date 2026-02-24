import { ChallengeCard } from "@/components/ChallengeCard";
import { listChallenges } from "@/challenges/loader";
import { Zap } from "lucide-react";

export default async function Home() {
  const challenges = await listChallenges();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {/* Hero */}
      <div className="mb-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">
            AI-in-the-Middle Challenges
          </span>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Prompt Hero
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          The AI has a flawed brief. You have the truth. Guide the AI to the
          correct solution through conversation alone.
        </p>
      </div>

      {/* Challenge Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {challenges.map((c) => (
          <ChallengeCard key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}
