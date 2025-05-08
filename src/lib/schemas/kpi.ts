import { z } from 'zod';

/**
 * Schema for creating a new KPI
 */
export const KpiCreateSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  targetValue: z.number().positive("Target value must be positive"),
  dueDate: z.date().optional(),
});

export type KpiCreate = z.infer<typeof KpiCreateSchema>;

/**
 * Schema for updating a KPI
 */
export const KpiUpdateSchema = z.object({
  id: z.string().uuid(),
  currentValue: z.number().min(0, "Current value cannot be negative").optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'AT_RISK']).optional(),
  name: z.string().min(1, "Name is required").optional(),
  targetValue: z.number().positive("Target value must be positive").optional(),
  dueDate: z.date().optional().nullable(),
});

export type KpiUpdate = z.infer<typeof KpiUpdateSchema>;

/**
 * Schema for KPI response
 */
export const KpiResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  targetValue: z.number(),
  currentValue: z.number(),
  dueDate: z.date().nullable(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type KpiResponse = z.infer<typeof KpiResponseSchema>;

/**
 * Schema for listing KPIs with optional filters
 */
export const KpiListSchema = z.object({
  userId: z.string().uuid().optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'AT_RISK']).optional(),
});

export type KpiList = z.infer<typeof KpiListSchema>;

/**
 * Schema for deleting a KPI
 */
export const KpiDeleteSchema = z.object({
  id: z.string().uuid(),
});

export type KpiDelete = z.infer<typeof KpiDeleteSchema>; 