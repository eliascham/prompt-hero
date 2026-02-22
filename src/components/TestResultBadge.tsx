"use client";

import type { TestResult } from "@/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";

interface TestResultBadgeProps {
  result: TestResult;
}

export function TestResultBadge({ result }: TestResultBadgeProps) {
  return (
    <div
      className={`mx-4 my-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs ${
        result.passed
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {result.passed ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      <span className="font-medium">{result.testName}</span>
      <span className="text-muted-foreground">
        {result.category}
        {result.rawOutput && ` — ${result.rawOutput}`}
      </span>
    </div>
  );
}
