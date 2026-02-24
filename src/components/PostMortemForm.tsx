"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface PostMortemFormProps {
  onSubmit: (postMortem: string) => void;
  isLoading: boolean;
}

export function PostMortemForm({ onSubmit, isLoading }: PostMortemFormProps) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Describe what you believe the AI&apos;s flawed brief said differently
        from the truth. What were the specific mismatches you identified?
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="The AI's brief likely stated that... However, the truth spec requires..."
        className="min-h-[100px] resize-none bg-muted/30 text-sm"
        disabled={isLoading}
      />
      <Button
        onClick={() => onSubmit(text)}
        disabled={text.trim().length < 10 || isLoading}
        className="w-full gap-2"
      >
        <Send className="h-3.5 w-3.5" />
        Submit Analysis
      </Button>
    </div>
  );
}
