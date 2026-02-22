import { redactPII } from "../starter/pii_redactor";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

// Test 1: Email redaction
const emailText = "Contact us at john.doe@example.com for details.";
const emailResult = redactPII(emailText);
assert(
  emailResult.includes("[REDACTED_EMAIL]"),
  "email redaction - email replaced with [REDACTED_EMAIL] - marker type incorrect"
);
assert(
  !emailResult.includes("john.doe@example.com"),
  "email redaction - original email removed"
);

// Test 2: Phone redaction
const phoneText = "Call me at 555-123-4567 or (555) 987-6543.";
const phoneResult = redactPII(phoneText);
assert(
  phoneResult.includes("[REDACTED_PHONE]"),
  "phone redaction - phone replaced with [REDACTED_PHONE] - phone detection missing"
);
assert(
  !phoneResult.includes("555-123-4567"),
  "phone redaction - original phone number removed"
);

// Test 3: SSN redaction
const ssnText = "My SSN is 123-45-6789, please keep it safe.";
const ssnResult = redactPII(ssnText);
assert(
  ssnResult.includes("[REDACTED_SSN]"),
  "SSN redaction - SSN replaced with [REDACTED_SSN] - marker type incorrect"
);
assert(
  !ssnResult.includes("123-45-6789"),
  "SSN redaction - original SSN removed"
);

// Test 4: Type-specific markers (not generic [REMOVED])
const mixedText = "Email: test@test.com, SSN: 111-22-3333";
const mixedResult = redactPII(mixedText);
assert(
  !mixedResult.includes("[REMOVED]"),
  "type-specific markers - does not use generic [REMOVED] marker - wrong marker type"
);
assert(
  mixedResult.includes("[REDACTED_EMAIL]") && mixedResult.includes("[REDACTED_SSN]"),
  "type-specific markers - uses type-specific markers for each PII type"
);

// Test 5: Multiple PII in one text
const multiText =
  "User john@mail.com (SSN: 999-88-7777) called from (555) 111-2222 and also uses jane@work.org.";
const multiResult = redactPII(multiText);
const emailCount = (multiResult.match(/\[REDACTED_EMAIL\]/g) || []).length;
const phoneCount = (multiResult.match(/\[REDACTED_PHONE\]/g) || []).length;
const ssnCount = (multiResult.match(/\[REDACTED_SSN\]/g) || []).length;
assert(emailCount === 2, "multiple PII - two emails redacted");
assert(phoneCount === 1, "multiple PII - one phone redacted");
assert(ssnCount === 1, "multiple PII - one SSN redacted");

// Test 6: No PII passthrough
const cleanText = "This is a normal sentence with no personal data.";
const cleanResult = redactPII(cleanText);
assert(
  cleanResult === cleanText,
  "no PII passthrough - text without PII returned unchanged"
);

console.log("All tests passed!");
