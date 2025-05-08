import { z } from 'zod';

// Define the ConnectionStatus enum to match Prisma
export const ConnectionStatusSchema = z.enum(['PENDING', 'CONNECTED', 'FAILED']);

// Schema for creating a CRM connection
export const CrmConnectionCreateSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  apiKey: z.string().min(1, "API Key is required"),
  domain: z.string().min(1, "Domain is required"),
});

// Schema for CRM connection response
export const CrmConnectionResponseSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  apiKey: z.string(),
  domain: z.string(),
  status: ConnectionStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema for testing a CRM connection
export const CrmTestConnectionSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
  domain: z.string().min(1, "Domain is required"),
});

// Schema for getting CRM connection status
export const CrmStatusQuerySchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
});

// Schema for CRM account data
export const CrmAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  source: z.literal('crm'),
});

// Schema for CRM contacts data
export const CrmContactSchema = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  source: z.literal('crm'),
});

// Schema for CRM status response
export const CrmStatusResponseSchema = z.object({
  connected: z.boolean(),
  connectionId: z.string().uuid().optional(),
  domain: z.string().optional(),
  lastSyncedAt: z.date().optional().nullable(),
  accountCount: z.number().optional(),
  contactCount: z.number().optional(),
  error: z.string().optional(),
});

// Export types
export type CrmConnectionCreate = z.infer<typeof CrmConnectionCreateSchema>;
export type CrmConnectionResponse = z.infer<typeof CrmConnectionResponseSchema>;
export type CrmTestConnection = z.infer<typeof CrmTestConnectionSchema>;
export type CrmStatusQuery = z.infer<typeof CrmStatusQuerySchema>;
export type CrmAccount = z.infer<typeof CrmAccountSchema>;
export type CrmContact = z.infer<typeof CrmContactSchema>;
export type CrmStatusResponse = z.infer<typeof CrmStatusResponseSchema>;
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>; 