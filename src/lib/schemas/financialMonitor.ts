import { z } from 'zod';

/**
 * Schema for financial metric data
 */
export const FinancialMetricSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  category: z.string(),
  amount: z.number(),
  currency: z.string().default('USD'),
  date: z.date(),
  description: z.string().nullable().optional(),
  trend: z.number().nullable().optional(),
  variance: z.number().nullable().optional(),
  createdAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }).nullable().optional(),
  client: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable().optional(),
});

export type FinancialMetric = z.infer<typeof FinancialMetricSchema>;

/**
 * Schema for getting financial trends with filters
 */
export const GetFinancialTrendsSchema = z.object({
  userId: z.string().optional(),
  clientId: z.string().optional(),
  category: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  includeTrend: z.boolean().default(true),
  includeVariance: z.boolean().default(true),
});

export type GetFinancialTrendsParams = z.infer<typeof GetFinancialTrendsSchema>;

/**
 * Schema for adding a new financial metric
 */
export const AddFinancialMetricSchema = z.object({
  userId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  category: z.string(),
  amount: z.number(),
  currency: z.string().default('USD'),
  date: z.date().default(() => new Date()),
  description: z.string().optional(),
});

export type AddFinancialMetricParams = z.infer<typeof AddFinancialMetricSchema>;

/**
 * Schema for financial summary data
 */
export const FinancialSummarySchema = z.object({
  totalRevenue: z.number(),
  totalExpenses: z.number(),
  netProfit: z.number(),
  topCategories: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })
  ),
  monthlyTrend: z.array(
    z.object({
      month: z.string(),
      revenue: z.number(),
      expenses: z.number(),
      profit: z.number(),
    })
  ),
});

export type FinancialSummary = z.infer<typeof FinancialSummarySchema>; 