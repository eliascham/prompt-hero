import { routeNotification, Notification, UserPreferences, Channel } from "../starter/notification_router";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

function arraysEqual(a: Channel[], b: Channel[]): boolean {
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.length === sortedB.length && sortedA.every((v, i) => v === sortedB[i]);
}

// Test 1: Critical routes to SMS + email + push
const criticalNotif: Notification = { userId: "u1", priority: "critical", message: "Server down!" };
const criticalResult = routeNotification(criticalNotif);
assert(
  arraysEqual(criticalResult, ["sms", "email", "push"]),
  "critical routing - sends via SMS + email + push - channel list incorrect"
);

// Test 2: High routes to SMS + email
const highNotif: Notification = { userId: "u1", priority: "high", message: "High alert" };
const highResult = routeNotification(highNotif);
assert(
  arraysEqual(highResult, ["sms", "email"]),
  "high routing - sends via SMS + email"
);

// Test 3: Medium routes to email + push, Low routes to push only
const mediumNotif: Notification = { userId: "u1", priority: "medium", message: "Update" };
const mediumResult = routeNotification(mediumNotif);
assert(
  arraysEqual(mediumResult, ["email", "push"]),
  "medium routing - sends via email + push"
);

const lowNotif: Notification = { userId: "u1", priority: "low", message: "FYI" };
const lowResult = routeNotification(lowNotif);
assert(
  arraysEqual(lowResult, ["push"]),
  "low routing - sends via push only"
);

// Test 4: Opt-out removes channels
const optOutPrefs: UserPreferences = { optedOutChannels: ["sms"] };
const criticalWithOptOut = routeNotification(criticalNotif, optOutPrefs);
assert(
  arraysEqual(criticalWithOptOut, ["email", "push"]),
  "opt-out - SMS removed from critical when opted out - opt-out not applied"
);

// Test 5: Cannot add channels beyond priority level
// User tries to have all channels but is only medium priority (email + push)
// Even if user hasn't opted out, they can't get SMS for medium
const noOptOut: UserPreferences = { optedOutChannels: [] };
const mediumWithPrefs = routeNotification(mediumNotif, noOptOut);
assert(
  !mediumWithPrefs.includes("sms"),
  "cannot add channels - medium priority cannot get SMS even with no opt-outs - channel escalation allowed"
);
assert(
  arraysEqual(mediumWithPrefs, ["email", "push"]),
  "cannot add channels - medium stays at email + push"
);

// Test 6: All channels opted out → empty array
const allOptedOut: UserPreferences = { optedOutChannels: ["sms", "email", "push"] };
const silentResult = routeNotification(criticalNotif, allOptedOut);
assert(
  silentResult.length === 0,
  "all opted out - notification silently dropped when all channels opted out"
);

console.log("All tests passed!");
