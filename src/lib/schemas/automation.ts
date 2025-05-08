import { z } from 'zod';

// Base schema for automation data
export const automationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  trigger: z.string().min(1, 'Trigger is required'),
  action: z.string().min(1, 'Action is required'),
  isActive: z.boolean().default(true),
  clientId: z.string().min(1, 'Client ID is required'),
  createdById: z.string().min(1, 'Creator ID is required'),
  config: z.any().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Schema for creating a new automation
export const createAutomationSchema = automationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  config: z.object({}).passthrough().optional(),
});

// Schema for updating an existing automation
export const updateAutomationSchema = automationSchema
  .partial()
  .omit({
    id: true,
    clientId: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
  }).extend({
    config: z.object({}).passthrough().optional(),
  });

// Schema for automation response with additional nested fields
export const automationResponseSchema = automationSchema.extend({
  client: z.object({
    id: z.string(),
    name: z.string(),
  }),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }),
});

// Export types
export type Automation = z.infer<typeof automationSchema>;
export type CreateAutomation = z.infer<typeof createAutomationSchema>;
export type UpdateAutomation = z.infer<typeof updateAutomationSchema>;
export type AutomationResponse = z.infer<typeof automationResponseSchema>; 