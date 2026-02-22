/**
 * Migrates a v1 YAML config to v2 format.
 * @param v1Yaml - Raw YAML string in v1 format
 * @returns YAML string in v2 format
 */
export function migrateConfig(v1Yaml: string): string {
  // TODO: Implement migration
  return "";
}

/**
 * Simple YAML parser for flat key-value configs.
 * Handles basic YAML (no arrays, no deep nesting in input).
 */
export function parseSimpleYaml(yaml: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  const lines = yaml.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let value: string | number = trimmed.slice(colonIdx + 1).trim();
    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num) && value !== "") {
      value = num;
    }
    result[key] = value;
  }
  return result;
}

/**
 * Serializes a nested object to YAML string.
 */
export function toYaml(obj: Record<string, unknown>, indent = 0): string {
  let result = "";
  const prefix = "  ".repeat(indent);
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result += `${prefix}${key}:\n`;
      result += toYaml(value as Record<string, unknown>, indent + 1);
    } else {
      result += `${prefix}${key}: ${value}\n`;
    }
  }
  return result;
}
