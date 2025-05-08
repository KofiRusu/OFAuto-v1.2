import { z } from 'zod';

// Input schema for creating a new trend
export const TrendCreateSchema = z.object({
  name: z.string().min(1, "Trend name is required"),
  source: z.string().min(1, "Source is required"),
});

// Input schema for creating a trend metric
export const TrendMetricCreateSchema = z.object({
  trendId: z.string().uuid("Invalid trend ID"),
  platform: z.string().min(1, "Platform is required"),
  value: z.number().min(0, "Value must be positive"),
});

// Input schema for batch trend detection (from webhooks/APIs)
export const TrendDetectionBatchSchema = z.object({
  trends: z.array(
    z.object({
      name: z.string().min(1),
      source: z.string().min(1),
      metrics: z.array(
        z.object({
          platform: z.string().min(1),
          value: z.number(),
        })
      ).optional().default([]),
    })
  ),
});

// Query schema for fetching recent trends
export const RecentTrendsQuerySchema = z.object({
  limit: z.number().int().positive().default(10),
  source: z.string().optional(),
  since: z.string().datetime().optional(), // ISO datetime string
});

// Query schema for fetching trend metrics
export const TrendMetricsQuerySchema = z.object({
  trendId: z.string().uuid("Invalid trend ID"),
  platform: z.string().optional(),
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

// Response schema for a trend
export const TrendResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  source: z.string(),
  detectedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metrics: z.array(
    z.object({
      id: z.string().uuid(),
      platform: z.string(),
      value: z.number(),
      timestamp: z.date(),
    })
  ).optional(),
});

// Response schema for a trend metric
export const TrendMetricResponseSchema = z.object({
  id: z.string().uuid(),
  trendId: z.string().uuid(),
  platform: z.string(),
  value: z.number(),
  timestamp: z.date(),
});

// Schema for trend settings
export const TrendSettingsSchema = z.object({
  refreshInterval: z.number().int().positive().default(60), // minutes
  sources: z.array(
    z.object({
      name: z.string().min(1),
      enabled: z.boolean().default(true),
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      refreshInterval: z.number().int().positive().optional(),
    })
  ),
  autoSuggestPosts: z.boolean().default(true),
  minEngagementThreshold: z.number().default(0.5),
});

// Export types
export type TrendCreate = z.infer<typeof TrendCreateSchema>;
export type TrendMetricCreate = z.infer<typeof TrendMetricCreateSchema>;
export type TrendDetectionBatch = z.infer<typeof TrendDetectionBatchSchema>;
export type RecentTrendsQuery = z.infer<typeof RecentTrendsQuerySchema>;
export type TrendMetricsQuery = z.infer<typeof TrendMetricsQuerySchema>;
export type TrendResponse = z.infer<typeof TrendResponseSchema>;
export type TrendMetricResponse = z.infer<typeof TrendMetricResponseSchema>;
export type TrendSettings = z.infer<typeof TrendSettingsSchema>; 