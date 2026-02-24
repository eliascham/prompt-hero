import { Sandbox } from "@e2b/code-interpreter";

const SANDBOX_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface SandboxInstance {
  sandbox: Sandbox;
  sessionId: string;
}

const activeSandboxes = new Map<string, SandboxInstance>();

const MAX_CREATE_RETRIES = 2;

/**
 * Creates a new E2B sandbox for an isolated coding session.
 * Retries once on timeout since cold starts can be slow.
 */
export async function createSandbox(
  sessionId: string,
  starterFiles?: Record<string, string>
): Promise<SandboxInstance> {
  // Close existing sandbox for this session if any
  if (activeSandboxes.has(sessionId)) {
    await closeSandbox(sessionId);
  }

  let sandbox: Sandbox | null = null;
  for (let attempt = 1; attempt <= MAX_CREATE_RETRIES; attempt++) {
    try {
      sandbox = await Sandbox.create({
        timeoutMs: SANDBOX_TIMEOUT_MS,
      });
      break;
    } catch (err) {
      console.warn(`Sandbox creation attempt ${attempt} failed:`, err);
      if (attempt === MAX_CREATE_RETRIES) throw err;
    }
  }

  if (!sandbox) throw new Error("Failed to create sandbox");

  // Write starter files into sandbox in parallel
  if (starterFiles) {
    await Promise.all(
      Object.entries(starterFiles).map(([filename, content]) =>
        sandbox!.files.write(`/home/user/${filename}`, content)
      )
    );
  }

  const instance: SandboxInstance = { sandbox, sessionId };
  activeSandboxes.set(sessionId, instance);
  return instance;
}

/**
 * Executes a shell command inside the sandbox.
 */
export async function executeSandboxCommand(
  sessionId: string,
  command: string,
  timeoutMs = 30_000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const instance = activeSandboxes.get(sessionId);
  if (!instance) throw new Error(`No sandbox found for session ${sessionId}`);

  const result = await instance.sandbox.commands.run(command, {
    timeoutMs,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

/**
 * Writes a file into the sandbox filesystem.
 */
export async function writeFileToSandbox(
  sessionId: string,
  path: string,
  content: string
): Promise<void> {
  const instance = activeSandboxes.get(sessionId);
  if (!instance) throw new Error(`No sandbox found for session ${sessionId}`);

  await instance.sandbox.files.write(path, content);
}

/**
 * Reads a file from the sandbox filesystem.
 */
export async function readFileFromSandbox(
  sessionId: string,
  path: string
): Promise<string> {
  const instance = activeSandboxes.get(sessionId);
  if (!instance) throw new Error(`No sandbox found for session ${sessionId}`);

  return await instance.sandbox.files.read(path);
}

/**
 * Closes and cleans up a sandbox for a session.
 */
export async function closeSandbox(sessionId: string): Promise<void> {
  const instance = activeSandboxes.get(sessionId);
  if (!instance) return;

  try {
    await instance.sandbox.kill();
  } catch {
    // Best-effort cleanup
  }
  activeSandboxes.delete(sessionId);
}

/**
 * Returns the sandbox instance for a session, if it exists.
 */
export function getSandbox(sessionId: string): SandboxInstance | undefined {
  return activeSandboxes.get(sessionId);
}
