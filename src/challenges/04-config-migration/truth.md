# Config File Migration

## Overview
Migrate YAML configuration files from v1 format to v2 format, with specific restructuring rules.

## Requirements
1. Accept a v1 YAML config string and return a v2 YAML config string
2. Nest database-related keys (host, port, name, user, password) under `services.database`
3. Rename `log_level` to `logging.verbosity` (nested under `logging` key)
4. Set `version: 2` at the root level
5. Preserve all other top-level keys unchanged
6. Output valid YAML

## Edge Cases
- v1 config may not have all database keys — migrate only those present
- log_level may be missing — omit logging.verbosity if so
- Extra unknown keys should be preserved at root level
- Handle numeric values correctly (port should remain a number)

## Test Summary
5 tests covering: basic migration, database nesting, log_level renaming, version field, and preservation of extra keys.
