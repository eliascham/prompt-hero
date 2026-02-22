"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

const MIN_CHARS = 1;
const MAX_CHARS = 500;

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const charCount = text.length;
  const canSend = charCount >= MIN_CHARS && charCount <= MAX_CHARS && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  }, [canSend, onSend, text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/40 p-3">
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Guide the AI toward the correct solution..."
          className="min-h-[60px] max-h-[120px] resize-none bg-muted/30 text-sm"
          maxLength={MAX_CHARS}
          disabled={disabled}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          className="h-[60px] w-10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-1.5 flex items-center justify-between px-1">
        <p className="text-[10px] text-muted-foreground/60">
          Shift+Enter for new line
        </p>
        <p
          className={`text-[10px] ${
            charCount > MAX_CHARS
              ? "text-red-400"
              : charCount > MAX_CHARS * 0.9
                ? "text-amber-400"
                : "text-muted-foreground/60"
          }`}
        >
          {charCount}/{MAX_CHARS}
        </p>
      </div>
    </div>
  );
}
