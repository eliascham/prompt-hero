import { ChallengeCard } from "@/components/ChallengeCard";
import { Zap } from "lucide-react";

const challenges = [
  {
    id: "01-invoice-parser",
    title: "Invoice Line Item Parser",
    difficulty: "easy" as const,
    tags: ["CTX", "MFEED"],
    estimatedMinutes: 15,
  },
  {
    id: "02-leaderboard-ranking",
    title: "Leaderboard Ranking",
    difficulty: "easy" as const,
    tags: ["CTX", "AMB"],
    estimatedMinutes: 15,
  },
  {
    id: "03-rate-limiter",
    title: "Rate Limiter",
    difficulty: "medium" as const,
    tags: ["CTX", "ARCH"],
    estimatedMinutes: 20,
  },
  {
    id: "04-config-migration",
    title: "Config File Migration",
    difficulty: "medium" as const,
    tags: ["CTX", "HALL", "ENV"],
    estimatedMinutes: 25,
  },
  {
    id: "05-pii-redaction",
    title: "PII Redaction",
    difficulty: "medium" as const,
    tags: ["CTX", "MFEED"],
    estimatedMinutes: 20,
  },
  {
    id: "06-event-deduplicator",
    title: "Event Deduplicator",
    difficulty: "hard" as const,
    tags: ["RED", "MFEED", "TRAP"],
    estimatedMinutes: 30,
  },
  {
    id: "07-notification-router",
    title: "Notification Router",
    difficulty: "hard" as const,
    tags: ["CONTRA", "OBFIX", "AMB"],
    estimatedMinutes: 30,
  },
  {
    id: "08-log-aggregator",
    title: "Log Aggregator",
    difficulty: "hard" as const,
    tags: ["ARCH", "ENV", "OBFIX"],
    estimatedMinutes: 30,
  },
];

export default function Home() {
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
