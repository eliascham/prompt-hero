"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <span className="text-lg font-bold tracking-tight">Prompt Hero</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Challenges
          </Link>
          <Link
            href="/leaderboard"
            className="hover:text-foreground transition-colors"
          >
            Leaderboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
