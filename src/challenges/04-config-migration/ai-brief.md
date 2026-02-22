# Config File Migration

## Overview
Migrate YAML configuration files from v1 format to v2 format with restructuring and validation.

## Requirements
1. Accept a v1 YAML config string and return a v2 YAML config string
2. Nest database keys under `database.connection` (host, port, name, user, password)
3. Rename `log_level` to `logging.level` (nested under `logging` key)
4. Set `version: 2` at the root level
5. Validate that all required database keys are present and throw if any are missing
6. Strip YAML comments during migration
7. Output valid YAML
