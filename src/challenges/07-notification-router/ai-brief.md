# Notification Router

## Overview
Build a notification routing system that sends notifications through appropriate channels based on priority.

## Requirements
1. Accept a notification with: userId, priority (critical/high/medium/low), message
2. Route by priority:
   - **critical** → SMS + email
   - **high** → SMS + email
   - **medium** → email + push
   - **low** → push only
3. Accept user preferences for notification channels
4. Return the list of channels the notification was sent through
