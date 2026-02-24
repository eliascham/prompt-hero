"use client";

import { useState } from "react";
import type { TruthSpec } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { RevealButton } from "./RevealButton";
import { Shield, AlertTriangle, FileCheck } from "lucide-react";

interface TruthPanelProps {
  truthSpec: TruthSpec;
  revealsUsed: number;
  maxReveals: number;
  onReveal: (snippet: string) => void;
  isLoading: boolean;
}

export function TruthPanel({
  truthSpec,
  revealsUsed,
  maxReveals,
  onReveal,
  isLoading,
}: TruthPanelProps) {
  const [selectedReq, setSelectedReq] = useState<string | null>(null);

  const handleReveal = () => {
    if (!selectedReq) return;
    onReveal(selectedReq);
    setSelectedReq(null);
  };

  return (
    <div
      className="flex h-full min-w-0 overflow-hidden flex-col"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold">Truth Specification</h2>
        </div>
        <RevealButton
          revealsUsed={revealsUsed}
          maxReveals={maxReveals}
          hasSelection={!!selectedReq}
          onReveal={handleReveal}
          isLoading={isLoading}
        />
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="select-none space-y-6" style={{ userSelect: "none" }}>
          {/* Title & Overview */}
          <div>
            <h3 className="mb-1 text-base font-semibold text-foreground">
              {truthSpec.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {truthSpec.overview}
            </p>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileCheck className="h-3.5 w-3.5" />
              Requirements
            </h4>
            <ul className="space-y-1.5">
              {truthSpec.requirements.map((req) => (
                <li
                  key={req.id}
                  onClick={() => {
                    if (revealsUsed < maxReveals) {
                      setSelectedReq(
                        selectedReq === req.text ? null : req.text
                      );
                    }
                  }}
                  className={`rounded-md border px-3 py-2 text-sm leading-relaxed transition-colors ${
                    selectedReq === req.text
                      ? "border-amber-500/50 bg-amber-500/10 text-foreground"
                      : revealsUsed < maxReveals
                        ? "cursor-pointer border-transparent hover:border-border hover:bg-muted/50"
                        : "border-transparent text-muted-foreground"
                  }`}
                >
                  {req.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Edge Cases */}
          {truthSpec.edgeCases.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" />
                Edge Cases
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {truthSpec.edgeCases.map((ec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    {ec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Test Summary */}
          {truthSpec.testSummary && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Test Summary
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {truthSpec.testSummary}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
