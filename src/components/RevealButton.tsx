"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface RevealButtonProps {
  revealsUsed: number;
  maxReveals: number;
  hasSelection: boolean;
  onReveal: () => void;
  isLoading: boolean;
}

export function RevealButton({
  revealsUsed,
  maxReveals,
  hasSelection,
  onReveal,
  isLoading,
}: RevealButtonProps) {
  const remaining = maxReveals - revealsUsed;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {remaining}/{maxReveals} reveals
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={!hasSelection || remaining <= 0 || isLoading}
        onClick={onReveal}
        className="h-7 gap-1 text-xs"
      >
        <Eye className="h-3 w-3" />
        Reveal
      </Button>
    </div>
  );
}
