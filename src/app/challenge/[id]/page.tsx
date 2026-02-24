"use client";

import { useEffect, useState, use } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useCodeStore } from "@/stores/codeStore";
import { useAuth } from "@/lib/auth-context";
import { TruthPanel } from "@/components/TruthPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { CodeViewer } from "@/components/CodeViewer";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { PostMortemForm } from "@/components/PostMortemForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, X, PanelLeftClose, PanelLeft, Send } from "lucide-react";

export default function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const {
    challenge,
    status,
    isLoading,
    score,
    error,
    createSession,
    completeSession,
    clearError,
  } = useSessionStore();
  const setFiles = useCodeStore((s) => s.setFiles);

  const [truthCollapsed, setTruthCollapsed] = useState(false);
  const [showPostMortem, setShowPostMortem] = useState(false);

  useEffect(() => {
    createSession(id, user?.id);
  }, [id, createSession, user]);

  // Load starter files into code store when session is created
  useEffect(() => {
    if (challenge?.starterFiles) {
      setFiles(challenge.starterFiles);
    }
  }, [challenge, setFiles]);

  if (!challenge) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} className="shrink-0 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {status === "completed" && score ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <ScoreDisplay score={score} challengeId={id} />
        </div>
      ) : status === "active" ? (
        <div
          className="grid flex-1 min-h-0 transition-[grid-template-columns] duration-300 ease-in-out"
          style={{
            gridTemplateColumns: truthCollapsed
              ? "0px 1fr 340px"
              : "280px 1fr 340px",
          }}
        >
          {/* Left — Truth Panel */}
          <div className="min-w-0 overflow-hidden border-r border-border/40 bg-card/30">
            <TruthPanel truthSpec={challenge.truthSpec} />
          </div>

          {/* Center — Code Editor */}
          <div className="flex min-w-0 flex-col border-r border-border/40">
            {/* Code toolbar */}
            <div className="flex h-10 items-center gap-2 border-b border-border/40 px-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTruthCollapsed((c) => !c)}
                className="h-7 w-7 p-0"
                title={truthCollapsed ? "Show truth panel" : "Hide truth panel"}
              >
                {truthCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
              <span className="text-xs text-muted-foreground truncate">
                {challenge.title}
              </span>
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowPostMortem(true)}
                  className="h-7 gap-1.5 px-3 text-xs"
                >
                  <Send className="h-3 w-3" />
                  Submit
                </Button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <CodeViewer />
            </div>
          </div>

          {/* Right — Chat Panel */}
          <div className="flex min-w-0 flex-col">
            <ChatPanel />
          </div>

          {/* Post-mortem dialog */}
          <Dialog open={showPostMortem} onOpenChange={setShowPostMortem}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Post-Mortem Analysis</DialogTitle>
              </DialogHeader>
              <PostMortemForm
                onSubmit={(text) => {
                  completeSession(text, user?.id);
                  setShowPostMortem(false);
                }}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
