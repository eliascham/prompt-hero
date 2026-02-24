import type { TestResult } from "@/lib/types";

export interface ToolExecutionResult {
  output: string;
  testResults?: TestResult[];
}

/**
 * Executes a tool call. Uses E2B sandbox if E2B_API_KEY is set,
 * otherwise falls back to mock execution.
 */
export async function executeTool(
  sessionId: string,
  toolName: string,
  input: Record<string, unknown>,
  starterFiles: Record<string, string>,
  testFiles?: Record<string, string>,
): Promise<ToolExecutionResult> {
  if (process.env.E2B_API_KEY) {
    return executeWithE2B(sessionId, toolName, input, starterFiles, testFiles);
  }
  return mockToolExecution(toolName, input, starterFiles);
}

/**
 * Real execution via E2B sandbox.
 */
async function executeWithE2B(
  sessionId: string,
  toolName: string,
  input: Record<string, unknown>,
  starterFiles: Record<string, string>,
  testFiles?: Record<string, string>,
): Promise<ToolExecutionResult> {
  // Dynamic import to avoid errors when E2B is not configured
  const {
    createSandbox,
    getSandbox,
    readFileFromSandbox,
    writeFileToSandbox,
    executeSandboxCommand,
  } = await import("@/lib/sandbox");
  const { runTests } = await import("@/lib/test-runner");

  // Ensure sandbox exists for this session, seeded with starter files
  if (!getSandbox(sessionId)) {
    await createSandbox(sessionId, starterFiles);
  }

  switch (toolName) {
    case "read_file": {
      const path = input.path as string;
      try {
        const content = await readFileFromSandbox(
          sessionId,
          `/home/user/${path}`,
        );
        return { output: content };
      } catch {
        return { output: `Error: File not found: ${path}` };
      }
    }
    case "write_file": {
      const path = input.path as string;
      const content = input.content as string;
      await writeFileToSandbox(sessionId, `/home/user/${path}`, content);
      return { output: `Successfully wrote to ${path}` };
    }
    case "run_tests": {
      if (!testFiles || Object.keys(testFiles).length === 0) {
        return { output: "No test files available", testResults: [] };
      }
      const results = await runTests(sessionId, testFiles);
      const passed = results.filter((r) => r.passed).length;
      const failed = results.length - passed;
      return {
        output: `${results.length} tests run: ${passed} passed, ${failed} failed`,
        testResults: results,
      };
    }
    case "run_command": {
      const command = input.command as string;
      const { stdout, stderr, exitCode } = await executeSandboxCommand(
        sessionId,
        command,
      );
      const output = (stdout + (stderr ? `\n${stderr}` : "")).trim();
      return {
        output: `$ ${command}\n${output}\nExit code: ${exitCode}`,
      };
    }
    default:
      return { output: "Unknown tool" };
  }
}

/**
 * Mock tool execution — returns plausible responses.
 * Used when E2B_API_KEY is not set (local dev / demo).
 */
function mockToolExecution(
  toolName: string,
  input: Record<string, unknown>,
  starterFiles: Record<string, string>,
): ToolExecutionResult {
  switch (toolName) {
    case "read_file": {
      const path = input.path as string;
      const content = starterFiles[path];
      if (content) {
        return { output: content };
      }
      return { output: `Error: File not found: ${path}` };
    }
    case "write_file": {
      const path = input.path as string;
      starterFiles[path] = input.content as string;
      return { output: `Successfully wrote to ${path}` };
    }
    case "run_tests": {
      const results: TestResult[] = [
        {
          passed: true,
          testName: "basic functionality",
          category: "core",
          direction: "passing",
          rawOutput: "Test passed: basic functionality works as expected",
          timestamp: new Date().toISOString(),
        },
        {
          passed: false,
          testName: "edge case handling",
          category: "edge-cases",
          direction: "output format incorrect",
          rawOutput:
            'Expected output to match format "key: value" but received "key=value"',
          timestamp: new Date().toISOString(),
        },
      ];
      return {
        output: `2 tests run: 1 passed, 1 failed`,
        testResults: results,
      };
    }
    case "run_command": {
      return { output: `$ ${input.command}\nCommand executed successfully.` };
    }
    default:
      return { output: "Unknown tool" };
  }
}
