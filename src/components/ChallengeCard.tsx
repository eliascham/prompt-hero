"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight } from "lucide-react";

interface ChallengeCardProps {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  estimatedMinutes: number;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function ChallengeCard({
  id,
  title,
  difficulty,
  tags,
  estimatedMinutes,
}: ChallengeCardProps) {
  return (
    <Link href={`/challenge/${id}`}>
      <Card className="group cursor-pointer border-border/50 bg-card/50 transition-all hover:border-border hover:bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={difficultyColors[difficulty]}
            >
              {difficulty}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <CardTitle className="text-base leading-snug">{title}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            ~{estimatedMinutes} min
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
