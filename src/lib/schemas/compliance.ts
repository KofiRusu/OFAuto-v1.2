import { z } from 'zod';

// Enum schemas
export const ReportTypeSchema = z.enum(['DM_CONTENT', 'POST_CONTENT', 'PROFILE_CONTENT']);
export const ReportStatusSchema = z.enum(['PENDING', 'REVIEWED', 'RESOLVED']);
export const RequestStatusSchema = z.enum(['PENDING', 'COMPLETED', 'REJECTED']);

// Report creation schema
export const ComplianceReportCreateSchema = z.object({
  reporterId: z.string().uuid("Invalid reporter ID"),
  type: ReportTypeSchema,
  contentId: z.string().optional(),
  details: z.string().min(10, "Please provide detailed information about the issue").max(2000),
});

// Report response schema (for API responses)
export const ComplianceReportResponseSchema = z.object({
  id: z.string().uuid(),
  reporterId: z.string().uuid(),
  type: ReportTypeSchema,
  contentId: z.string().optional().nullable(),
  details: z.string(),
  status: ReportStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Report list query schema (for filtering reports)
export const ReportListQuerySchema = z.object({
  status: ReportStatusSchema.optional(),
  type: ReportTypeSchema.optional(),
  limit: z.number().int().positive().default(50),
  cursor: z.string().optional(), // For pagination
});

// Report update schema (for admins to update status)
export const ReportUpdateSchema = z.object({
  id: z.string().uuid("Invalid report ID"),
  status: ReportStatusSchema,
  adminNotes: z.string().optional(),
});

// Takedown request creation schema
export const TakedownRequestCreateSchema = z.object({
  reportId: z.string().uuid("Invalid report ID"),
  requestedBy: z.string().uuid("Invalid requester ID"),
  reason: z.string().min(10, "Please provide a reason for the takedown request").max(1000),
});

// Takedown request response schema
export const TakedownRequestResponseSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  requestedBy: z.string().uuid(),
  status: RequestStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Takedown request update schema (for changing status)
export const TakedownRequestUpdateSchema = z.object({
  id: z.string().uuid("Invalid takedown request ID"),
  status: RequestStatusSchema,
  notes: z.string().optional(),
});

// Takedown list query schema
export const TakedownListQuerySchema = z.object({
  status: RequestStatusSchema.optional(),
  limit: z.number().int().positive().default(50),
  cursor: z.string().optional(), // For pagination
});

// Export types
export type ComplianceReportCreate = z.infer<typeof ComplianceReportCreateSchema>;
export type ComplianceReportResponse = z.infer<typeof ComplianceReportResponseSchema>;
export type ReportListQuery = z.infer<typeof ReportListQuerySchema>;
export type ReportUpdate = z.infer<typeof ReportUpdateSchema>;
export type TakedownRequestCreate = z.infer<typeof TakedownRequestCreateSchema>;
export type TakedownRequestResponse = z.infer<typeof TakedownRequestResponseSchema>;
export type TakedownRequestUpdate = z.infer<typeof TakedownRequestUpdateSchema>;
export type TakedownListQuery = z.infer<typeof TakedownListQuerySchema>; 