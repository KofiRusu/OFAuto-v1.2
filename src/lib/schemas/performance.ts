import { z } from 'zod';

/**
 * Schema for metrics in a performance report
 */
export const PerformanceMetricsSchema = z.object({
  earnings: z.number().optional(),
  posts: z.number().optional(),
  engagement: z.number().optional(),
  followers: z.number().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
  shares: z.number().optional(),
  views: z.number().optional(),
  conversionRate: z.number().optional(),
  growthRate: z.number().optional(),
}).catchall(z.number());

export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;

/**
 * Schema for creating a performance report
 */
export const PerformanceReportCreateSchema = z.object({
  modelId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  metrics: PerformanceMetricsSchema,
});

export type PerformanceReportCreate = z.infer<typeof PerformanceReportCreateSchema>;

/**
 * Schema for performance report response
 */
export const PerformanceReportResponseSchema = z.object({
  id: z.string().uuid(),
  modelId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  metrics: PerformanceMetricsSchema,
  createdAt: z.date(),
  model: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(),
});

export type PerformanceReportResponse = z.infer<typeof PerformanceReportResponseSchema>;

/**
 * Schema for getting a list of performance reports
 */
export const GetPerformanceReportsSchema = z.object({
  modelId: z.string().optional(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type GetPerformanceReports = z.infer<typeof GetPerformanceReportsSchema>;

/**
 * Schema for response containing multiple performance reports
 */
export const PerformanceReportListResponseSchema = z.object({
  reports: z.array(PerformanceReportResponseSchema),
  total: z.number().int(),
  offset: z.number().int(),
  limit: z.number().int(),
});

export type PerformanceReportListResponse = z.infer<typeof PerformanceReportListResponseSchema>; 