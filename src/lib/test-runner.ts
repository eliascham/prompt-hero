import { executeSandboxCommand, writeFileToSandbox } from "./sandbox";
import type { TestResult } from "./types";

/**
 * Runs test files in the sandbox and returns parsed results.
 */
export async function runTests(
  sessionId: string,
  testFiles: Record<string, string>
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const [filename, content] of Object.entries(testFiles)) {
    const sandboxPath = `/home/user/tests/${filename}`;
    await writeFileToSandbox(sessionId, sandboxPath, content);

    const { stdout, stderr, exitCode } = await executeSandboxCommand(
      sessionId,
      `cd /home/user && npx tsx tests/${filename} 2>&1`,
      30_000
    );

    const rawOutput = (stdout + "\n" + stderr).trim();
    const parsed = parseTestOutput(rawOutput, exitCode, filename);
    results.push(...parsed);
  }

  return results;
}

/**
 * Parses stdout/stderr from test execution into TestResult objects.
 * Tests use a simple protocol: lines starting with PASS: or FAIL: indicate results.
 * If no protocol lines are found, treat the whole run as a single test.
 */
export function parseTestOutput(
  rawOutput: string,
  exitCode: number,
  filename: string
): TestResult[] {
  const lines = rawOutput.split("\n");
  const results: TestResult[] = [];
  const now = new Date().toISOString();

  // Look for structured test output: PASS: name or FAIL: name - reason
  const testLineRegex = /^(PASS|FAIL):\s*(.+)/;

  for (const line of lines) {
    const match = line.match(testLineRegex);
    if (match) {
      const passed = match[1] === "PASS";
      const rest = match[2];

      // Split "test name - direction hint" or just "test name"
      const dashIdx = rest.indexOf(" - ");
      const testName = dashIdx >= 0 ? rest.slice(0, dashIdx).trim() : rest.trim();
      const direction = dashIdx >= 0 ? rest.slice(dashIdx + 3).trim() : undefined;

      // Derive category from filename: "test_invoice_parser.ts" -> "invoice parser"
      const category = filename
        .replace(/^test[_-]?/, "")
        .replace(/\.[tj]sx?$/, "")
        .replace(/[_-]/g, " ");

      results.push({
        passed,
        testName,
        category,
        direction,
        rawOutput,
        timestamp: now,
      });
    }
  }

  // Fallback: if no structured lines found, produce a single result
  if (results.length === 0) {
    const category = filename
      .replace(/^test[_-]?/, "")
      .replace(/\.[tj]sx?$/, "")
      .replace(/[_-]/g, " ");

    results.push({
      passed: exitCode === 0,
      testName: filename,
      category,
      direction: exitCode === 0 ? undefined : "test execution failed",
      rawOutput,
      timestamp: now,
    });
  }

  return results;
}
