import type { TestResult, TestFeedbackHuman, TestFeedbackAI } from "@/lib/types";

/**
 * Returns full test output for human display.
 */
export function filterTestFeedbackForHuman(
  result: TestResult
): TestFeedbackHuman {
  return {
    testName: result.testName,
    passed: result.passed,
    rawOutput: result.rawOutput ?? "",
  };
}

/**
 * Returns only category + direction for the AI — never raw output.
 */
export function filterTestFeedbackForAI(result: TestResult): TestFeedbackAI {
  return {
    category: result.category,
    direction: result.direction ?? (result.passed ? "passing" : "failing"),
  };
}
