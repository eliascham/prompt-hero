"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Zap, LogOut, User } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  function navClass(href: string) {
    const active = pathname === href;
    return `transition-colors ${active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <span className="text-lg font-bold tracking-tight">Prompt Hero</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className={navClass("/")}>
            Campaign
          </Link>
          <Link href="/leaderboard" className={navClass("/leaderboard")}>
            Leaderboard
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/profile" className={navClass("/profile")}>
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      Profile
                    </span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                    Sign in
                  </Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
