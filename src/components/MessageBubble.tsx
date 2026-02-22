"use client";

import type { ChatMessage } from "@/lib/types";
import { User, Bot, Info } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex items-start gap-2 px-4 py-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <p className="text-sm italic text-amber-400/80">{message.content}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 ${
        isUser ? "" : "bg-muted/30"
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-violet-500/15 text-violet-400"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-medium text-muted-foreground">
          {isUser ? "You" : "AI"}
        </p>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}
