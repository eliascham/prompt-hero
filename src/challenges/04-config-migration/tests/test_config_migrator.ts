import { migrateConfig, parseSimpleYaml } from "../starter/config_migrator";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

// Test 1: Version field set to 2
const v1 = `host: localhost
port: 5432
name: myapp_db
user: admin
password: secret123
log_level: debug`;

const v2 = migrateConfig(v1);
assert(v2.includes("version: 2"), "version field - v2 output includes version: 2");

// Test 2: Database keys nested under services.database
assert(
  v2.includes("services:") && v2.includes("database:"),
  "database nesting - keys nested under services.database - nesting path incorrect"
);
// Verify the database keys are NOT at root level anymore
const v2Lines = v2.split("\n").map((l) => l.trimEnd());
const rootKeys = v2Lines
  .filter((l) => l.length > 0 && !l.startsWith(" ") && !l.startsWith("#"))
  .map((l) => l.split(":")[0]);
assert(
  !rootKeys.includes("host") && !rootKeys.includes("port"),
  "database nesting - host and port not at root level"
);

// Test 3: log_level renamed to logging.verbosity
assert(
  v2.includes("logging:") && v2.includes("verbosity:"),
  "log_level rename - renamed to logging.verbosity - rename path incorrect"
);
assert(!v2.includes("log_level"), "log_level rename - old key removed");

// Test 4: Extra keys preserved
const v1WithExtras = `host: localhost
port: 5432
name: myapp_db
user: admin
password: secret
log_level: info
app_name: TestApp
max_retries: 3`;

const v2WithExtras = migrateConfig(v1WithExtras);
assert(
  v2WithExtras.includes("app_name: TestApp"),
  "extra keys - app_name preserved at root"
);
assert(
  v2WithExtras.includes("max_retries: 3"),
  "extra keys - max_retries preserved at root"
);

// Test 5: Missing optional keys handled gracefully
const v1Partial = `host: localhost
port: 5432
app_name: Minimal`;

const v2Partial = migrateConfig(v1Partial);
assert(v2Partial.includes("version: 2"), "partial config - version still set");
assert(
  v2Partial.includes("host") || v2Partial.includes("localhost"),
  "partial config - present db keys still migrated"
);
assert(
  !v2Partial.includes("verbosity"),
  "partial config - logging.verbosity omitted when log_level missing"
);

console.log("All tests passed!");
