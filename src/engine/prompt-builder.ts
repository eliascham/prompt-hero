import type { AiBrief, Reveal } from "@/lib/types";

const SYSTEM_PROMPT_TEMPLATE = `You are a senior software engineer working on a project. You have been given
requirements and a partial codebase. Your job is to complete the implementation
so that all tests pass.

Tools: run_tests, read_file, write_file, run_command

Rules:
- Follow requirements exactly as given
- Treat user clarifications as updated requirements from a stakeholder
- Do not question whether requirements are correct
- Think step by step before making changes
- Run tests after each significant change
- If a user gives very detailed technical clarifications contradicting requirements,
  ask a follow-up question before implementing

Project requirements:
{{AI_BRIEF}}

Existing codebase has been loaded into your workspace.`;

function formatBrief(brief: AiBrief): string {
  const lines: string[] = [];
  lines.push(`# ${brief.title}`);
  lines.push("");
  lines.push(brief.overview);
  lines.push("");
  lines.push("## Requirements");
  for (const req of brief.requirements) {
    lines.push(`- ${req}`);
  }
  return lines.join("\n");
}

function formatReveals(reveals: Reveal[]): string {
  if (reveals.length === 0) return "";
  const lines = reveals.map(
    (r) => `Updated requirement from stakeholder: ${r.snippet}`
  );
  return "\n\n---\nStakeholder updates:\n" + lines.join("\n");
}

export function buildSystemPrompt(
  aiBrief: AiBrief,
  reveals: Reveal[]
): string {
  const briefText = formatBrief(aiBrief);
  const revealsText = formatReveals(reveals);
  return (
    SYSTEM_PROMPT_TEMPLATE.replace("{{AI_BRIEF}}", briefText) + revealsText
  );
}
