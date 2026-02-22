"use client";

import { useCallback, useEffect } from "react";
import { useCodeStore } from "@/stores/codeStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitCompareArrows, FileCode } from "lucide-react";

export function CodeViewer() {
  const files = useCodeStore((s) => s.files);
  const activeFile = useCodeStore((s) => s.activeFile);
  const diffMode = useCodeStore((s) => s.diffMode);
  const originalFiles = useCodeStore((s) => s.originalFiles);
  const setActiveFile = useCodeStore((s) => s.setActiveFile);
  const toggleDiffMode = useCodeStore((s) => s.toggleDiffMode);
  const updateFile = useCodeStore((s) => s.updateFile);

  const filePaths = Object.keys(files);
  const currentContent = activeFile ? files[activeFile] ?? "" : "";
  const originalContent = activeFile ? originalFiles[activeFile] ?? "" : "";
  const hasChanges = currentContent !== originalContent;

  // Listen for code updates from SSE
  const handleCodeUpdate = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        path: string;
        content: string;
      };
      updateFile(detail.path, detail.content);
    },
    [updateFile]
  );

  useEffect(() => {
    window.addEventListener("code-update", handleCodeUpdate);
    return () => window.removeEventListener("code-update", handleCodeUpdate);
  }, [handleCodeUpdate]);

  return (
    <div className="flex h-full flex-col">
      {/* File tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border/40 px-2 py-1">
        {filePaths.map((path) => {
          const filename = path.split("/").pop() || path;
          return (
            <button
              key={path}
              onClick={() => setActiveFile(path)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                activeFile === path
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCode className="h-3 w-3" />
              {filename}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          {hasChanges && (
            <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">
              modified
            </Badge>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleDiffMode}
            className="h-6 gap-1 px-2 text-[10px]"
          >
            <GitCompareArrows className="h-3 w-3" />
            {diffMode ? "Code" : "Diff"}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <ScrollArea className="flex-1">
        {activeFile ? (
          <pre className="p-4 text-xs leading-relaxed">
            <code>
              {diffMode && hasChanges
                ? renderSimpleDiff(originalContent, currentContent)
                : currentContent}
            </code>
          </pre>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No files loaded yet
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function renderSimpleDiff(original: string, modified: string) {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");
  const maxLen = Math.max(origLines.length, modLines.length);
  const parts: { text: string; type: "same" | "add" | "remove" }[] = [];

  for (let i = 0; i < maxLen; i++) {
    const oLine = origLines[i];
    const mLine = modLines[i];
    if (oLine === mLine) {
      parts.push({ text: `  ${mLine ?? ""}`, type: "same" });
    } else {
      if (oLine !== undefined) {
        parts.push({ text: `- ${oLine}`, type: "remove" });
      }
      if (mLine !== undefined) {
        parts.push({ text: `+ ${mLine}`, type: "add" });
      }
    }
  }

  return parts.map((p, i) => (
    <span
      key={i}
      className={
        p.type === "add"
          ? "bg-emerald-500/15 text-emerald-400"
          : p.type === "remove"
            ? "bg-red-500/15 text-red-400"
            : ""
      }
    >
      {p.text}
      {"\n"}
    </span>
  ));
}
