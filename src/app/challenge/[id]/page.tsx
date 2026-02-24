"use client";

import { useEffect, use } from "react";
import { useSessionStore } from "@/stores/sessionStore";
import { useCodeStore } from "@/stores/codeStore";
import { TruthPanel } from "@/components/TruthPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { CodeViewer } from "@/components/CodeViewer";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { PostMortemForm } from "@/components/PostMortemForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Code } from "lucide-react";

export default function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    challenge,
    status,
    isLoading,
    score,
    createSession,
    completeSession,
  } = useSessionStore();
  const setFiles = useCodeStore((s) => s.setFiles);

  useEffect(() => {
    createSession(id);
  }, [id, createSession]);

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
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left Panel — Truth */}
      <div className="w-[40%] min-w-[320px] border-r border-border/40 bg-card/30">
        <TruthPanel truthSpec={challenge.truthSpec} />
      </div>

      {/* Right Panel — Chat + Code */}
      <div className="flex flex-1 flex-col">
        {status === "completed" && score ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
            <ScoreDisplay score={score} />
          </div>
        ) : status === "active" ? (
          <>
            {/* Show post-mortem form as overlay when ready */}
            <Tabs defaultValue="chat" className="flex flex-1 flex-col">
              <div className="flex items-center border-b border-border/40 px-2">
                <TabsList className="h-10 bg-transparent">
                  <TabsTrigger value="chat" className="gap-1.5 text-xs">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-1.5 text-xs">
                    <Code className="h-3.5 w-3.5" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="submit" className="gap-1.5 text-xs">
                    Submit
                  </TabsTrigger>
                </TabsList>
                <Separator orientation="vertical" className="mx-2 h-5" />
                <span className="text-xs text-muted-foreground">
                  {challenge.title}
                </span>
              </div>

              <TabsContent value="chat" className="mt-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col">
                <ChatPanel />
              </TabsContent>

              <TabsContent value="code" className="mt-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col">
                <CodeViewer />
              </TabsContent>

              <TabsContent value="submit" className="mt-0 flex-1 p-6">
                <div className="mx-auto max-w-lg">
                  <PostMortemForm
                    onSubmit={completeSession}
                    isLoading={isLoading}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
