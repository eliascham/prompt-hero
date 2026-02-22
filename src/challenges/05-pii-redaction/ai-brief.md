# PII Redaction

## Overview
Build a text redactor that identifies and replaces personally identifiable information (PII) with redaction markers.

## Requirements
1. Detect and redact **email addresses** → replace with `[REMOVED]`
2. Detect and redact **SSNs** (XXX-XX-XXXX format) → replace with `[REMOVED]`
3. Replace all detected PII with the marker `[REMOVED]`
4. Handle multiple PII instances in the same text
5. Preserve all non-PII text exactly as-is
