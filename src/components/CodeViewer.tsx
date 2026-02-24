"use client";

import { useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useCodeStore } from "@/stores/codeStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompareArrows, FileCode, Loader2 } from "lucide-react";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "css":
      return "css";
    case "html":
      return "html";
    case "py":
      return "python";
    case "yaml":
    case "yml":
      return "yaml";
    default:
      return "plaintext";
  }
}

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  wordWrap: "on",
  renderLineHighlight: "line",
  cursorStyle: "line",
  cursorBlinking: "smooth",
  smoothScrolling: true,
  selectionHighlight: true,
  occurrencesHighlight: "singleFile",
  folding: true,
  padding: { top: 8, bottom: 8 },
  guides: { indentation: true },
};

const diffOptions: editor.IDiffEditorConstructionOptions = {
  readOnly: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  renderSideBySide: true,
  padding: { top: 8, bottom: 8 },
};

export function CodeViewer() {
  const files = useCodeStore((s) => s.files);
  const activeFile = useCodeStore((s) => s.activeFile);
  const diffMode = useCodeStore((s) => s.diffMode);
  const originalFiles = useCodeStore((s) => s.originalFiles);
  const setActiveFile = useCodeStore((s) => s.setActiveFile);
  const toggleDiffMode = useCodeStore((s) => s.toggleDiffMode);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filePaths = Object.keys(files);
  const currentContent = activeFile ? files[activeFile] ?? "" : "";
  const originalContent = activeFile ? originalFiles[activeFile] ?? "" : "";
  const hasChanges = currentContent !== originalContent;
  const language = activeFile ? detectLanguage(activeFile) : "plaintext";

  const handleEditorMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  }, []);

  // ResizeObserver to reflow Monaco when panel resizes (e.g. truth collapse)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      editorRef.current?.layout();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      <div ref={containerRef} className="flex-1 min-h-0">
        {activeFile ? (
          diffMode && hasChanges ? (
            <MonacoDiffEditor
              original={originalContent}
              modified={currentContent}
              language={language}
              theme="vs-dark"
              options={diffOptions}
            />
          ) : (
            <MonacoEditor
              value={currentContent}
              language={language}
              theme="vs-dark"
              options={editorOptions}
              onMount={handleEditorMount}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No files loaded yet
          </div>
        )}
      </div>
    </div>
  );
}
