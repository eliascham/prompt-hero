# Notification Router

## Overview
Build a notification routing system that sends notifications through appropriate channels based on priority level, with user opt-out support.

## Requirements
1. Accept a notification with: userId, priority (critical/high/medium/low), message
2. Route by priority:
   - **critical** → SMS + email + push
   - **high** → SMS + email
   - **medium** → email + push
   - **low** → push only
3. Accept user preferences with opted-out channels
4. Users can **opt out** of channels but **cannot add channels** beyond their priority level
5. Return the list of channels the notification was actually sent through
6. If all channels are opted out, return empty array (notification is silently dropped)

## Edge Cases
- User opts out of all channels for their priority level → empty send list
- User opt-out for a channel not in their priority level has no effect
- Unknown priority level should throw an error
- Missing user preferences → use defaults (no opt-outs)

## Test Summary
6 tests covering: critical routing, high routing, medium/low routing, opt-out behavior, cannot-add-channels rule, and all-opted-out scenario.
