import { z } from 'zod';

/**
 * Schema for ActivityLog data
 */
export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  actionType: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
});

export type ActivityLog = z.infer<typeof ActivityLogSchema>;

/**
 * Schema for creating an ActivityLog entry
 */
export const ActivityLogCreateSchema = z.object({
  userId: z.string(),
  actionType: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ActivityLogCreate = z.infer<typeof ActivityLogCreateSchema>;

/**
 * Schema for getting model activity
 */
export const GetModelActivitySchema = z.object({
  modelId: z.string(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
  actionTypes: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type GetModelActivity = z.infer<typeof GetModelActivitySchema>;

/**
 * Schema for response containing multiple activity logs
 */
export const ActivityLogListResponseSchema = z.object({
  logs: z.array(ActivityLogSchema),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
});

export type ActivityLogListResponse = z.infer<typeof ActivityLogListResponseSchema>;

/**
 * Schema for getting activity feed with pagination and filters
 */
export const GetActivityFeedSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  userId: z.string().optional(),
  actionType: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z.enum(['timestamp', 'actionType', 'userId']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetActivityFeedParams = z.infer<typeof GetActivityFeedSchema>;

/**
 * Schema for user statistics
 */
export const UserStatsSchema = z.object({
  totalActions: z.number().int(),
  actionsByType: z.record(z.string(), z.number().int()),
  mostRecentAction: ActivityLogSchema.optional(),
  activityByDay: z.array(
    z.object({
      date: z.string(),
      count: z.number().int(),
    })
  ),
});

export type UserStats = z.infer<typeof UserStatsSchema>;

/**
 * Schema for adding a new activity log entry
 */
export const AddActivityLogSchema = z.object({
  userId: z.string(),
  actionType: z.string(),
  description: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type AddActivityLogParams = z.infer<typeof AddActivityLogSchema>; 