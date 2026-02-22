export type Priority = "critical" | "high" | "medium" | "low";
export type Channel = "sms" | "email" | "push";

export interface Notification {
  userId: string;
  priority: Priority;
  message: string;
}

export interface UserPreferences {
  optedOutChannels: Channel[];
}

/**
 * Routes a notification to the appropriate channels based on priority
 * and user preferences.
 * @param notification - The notification to route
 * @param preferences - Optional user preferences (opted-out channels)
 * @returns Array of channels the notification was sent through
 */
export function routeNotification(
  notification: Notification,
  preferences?: UserPreferences
): Channel[] {
  // TODO: Implement notification routing
  return [];
}
