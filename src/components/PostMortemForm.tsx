"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch, Send } from "lucide-react";

interface PostMortemFormProps {
  onSubmit: (postMortem: string) => void;
  isLoading: boolean;
}

export function PostMortemForm({ onSubmit, isLoading }: PostMortemFormProps) {
  const [text, setText] = useState("");

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSearch className="h-4 w-4 text-violet-400" />
          Post-Mortem Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
