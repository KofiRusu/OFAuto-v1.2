import { z } from 'zod';

/**
 * Notification type enum
 * Used to categorize different types of notifications
 */
export const NotificationType = z.enum([
  'ACTIVITY_UPDATE',
  'PLATFORM_ACCESS_CHANGED',
  'NEW_POST_SCHEDULED',
  'POST_PUBLISHED',
  'PERFORMANCE_REPORT',
  'MANAGER_MESSAGE',
  'SYSTEM_ALERT',
  'OTHER'
]);

export type NotificationType = z.infer<typeof NotificationType>;

/**
 * Base notification schema
 */
export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  type: NotificationType,
  title: z.string(),
  message: z.string(),
  payload: z.record(z.unknown()).optional(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
});

export type Notification = z.infer<typeof NotificationSchema>;

/**
 * Schema for creating a new notification
 */
export const CreateNotificationSchema = z.object({
  userId: z.string(),
  type: NotificationType,
  title: z.string(),
  message: z.string(),
  payload: z.record(z.unknown()).optional(),
});

export type CreateNotification = z.infer<typeof CreateNotificationSchema>;

/**
 * Schema for sending notifications to multiple users
 */
export const SendNotificationSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  type: NotificationType,
  title: z.string(),
  message: z.string(),
  payload: z.record(z.unknown()).optional(),
});

export type SendNotification = z.infer<typeof SendNotificationSchema>;

/**
 * Schema for getting notifications
 */
export const GetNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
  filterRead: z.boolean().optional(),
  filterUnread: z.boolean().optional(),
  type: NotificationType.optional(),
});

export type GetNotifications = z.infer<typeof GetNotificationsSchema>;

/**
 * Schema for marking notifications as read
 */
export const MarkReadSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one notification ID is required'),
});

export type MarkRead = z.infer<typeof MarkReadSchema>;

/**
 * Schema for marking all notifications as read
 */
export const MarkAllReadSchema = z.object({
  userId: z.string().optional(), // If not provided, will use the authenticated user
});

export type MarkAllRead = z.infer<typeof MarkAllReadSchema>;

/**
 * Notification response schema
 */
export const NotificationResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  nextCursor: z.string().uuid().optional(),
  totalCount: z.number().int(),
}); 