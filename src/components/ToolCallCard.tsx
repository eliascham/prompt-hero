"use client";

import { useState } from "react";
import type { ToolCallRecord } from "@/lib/types";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";

interface ToolCallCardProps {
  toolCall: ToolCallRecord;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mx-4 my-1 rounded-md border border-border/50 bg-muted/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <Terminal className="h-3 w-3 text-muted-foreground" />
        <span className="font-mono font-medium text-muted-foreground">
          {toolCall.name}
        </span>
        {toolCall.output && (
          <span className="ml-auto text-[10px] text-muted-foreground/60">
            completed
          </span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-border/30 px-3 py-2">
          <pre className="overflow-x-auto text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(toolCall.input, null, 2)}
          </pre>
          {toolCall.output && (
            <>
              <div className="my-1.5 border-t border-border/20" />
              <pre className="max-h-40 overflow-y-auto text-[11px] leading-relaxed text-muted-foreground/80">
                {toolCall.output}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}
