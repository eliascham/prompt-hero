"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { ToolCallCard } from "./ToolCallCard";
import { TestResultBadge } from "./TestResultBadge";
import { ChatInput } from "./ChatInput";
import { useSessionStore } from "@/stores/sessionStore";
import type { ChatMessage, ToolCallRecord, TestResult } from "@/lib/types";
import { Loader2, MessageSquare } from "lucide-react";

export function ChatPanel() {
  const messages = useSessionStore((s) => s.messages);
  const toolCalls = useSessionStore((s) => s.toolCalls);
  const testResults = useSessionStore((s) => s.testResults);
  const isStreaming = useSessionStore((s) => s.isStreaming);
  const status = useSessionStore((s) => s.status);
  const sendMessage = useSessionStore((s) => s.sendMessage);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, toolCalls, testResults]);

  // Interleave messages, tool calls, and test results by timestamp
  type TimelineItem =
    | { kind: "message"; item: ChatMessage }
    | { kind: "toolCall"; item: ToolCallRecord }
    | { kind: "testResult"; item: TestResult };

  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ kind: "message" as const, item: m })),
    ...toolCalls.map((t) => ({ kind: "toolCall" as const, item: t })),
    ...testResults.map((t) => ({ kind: "testResult" as const, item: t })),
  ].sort(
    (a, b) =>
      new Date(a.item.timestamp).getTime() -
      new Date(b.item.timestamp).getTime()
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex h-10 items-center justify-between border-b border-border/40 px-3">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Chat</span>
        </div>
        {messages.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {messages.length} msg{messages.length !== 1 && "s"}
          </span>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {timeline.length === 0 && (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Start a conversation to guide the AI...
            </div>
          )}
          {timeline.map((entry, i) => {
            switch (entry.kind) {
              case "message":
                return <MessageBubble key={`msg-${i}`} message={entry.item} />;
              case "toolCall":
                return (
                  <ToolCallCard key={`tc-${i}`} toolCall={entry.item} />
                );
              case "testResult":
                return (
                  <TestResultBadge key={`tr-${i}`} result={entry.item} />
                );
            }
          })}
          {isStreaming && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              AI is thinking...
            </div>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <ChatInput
        onSend={sendMessage}
        disabled={isStreaming || status !== "active"}
      />
    </div>
  );
}
