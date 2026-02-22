# PII Redaction

## Overview
Build a text redactor that identifies and replaces personally identifiable information (PII) with type-specific markers.

## Requirements
1. Detect and redact **email addresses** → replace with `[REDACTED_EMAIL]`
2. Detect and redact **phone numbers** → replace with `[REDACTED_PHONE]`
3. Detect and redact **SSNs** (XXX-XX-XXXX format) → replace with `[REDACTED_SSN]`
4. Use type-specific markers (not a generic marker)
5. Handle multiple PII instances in the same text
6. Preserve all non-PII text exactly as-is

## Edge Cases
- Text with no PII should be returned unchanged
- Multiple PII types in the same line
- Phone formats: (555) 123-4567, 555-123-4567, 555.123.4567
- Emails with various TLDs and subdomains
- SSNs must match exactly XXX-XX-XXXX (9 digits with dashes)

## Test Summary
6 tests covering: email redaction, phone redaction, SSN redaction, type-specific markers, multiple PII in one text, and no-PII passthrough.
