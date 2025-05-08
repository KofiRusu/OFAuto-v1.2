import { z } from 'zod';

// Enum for campaign status
export const campaignStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED',
]);

// Base schema for campaign data
export const campaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  platform: z.string().min(1, 'Platform is required'),
  budget: z.number().int().nullable().optional(),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  status: campaignStatusEnum.default('DRAFT'),
  clientId: z.string().min(1, 'Client ID is required'),
  createdById: z.string().min(1, 'Creator ID is required'),
  metrics: z.any().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Schema for creating a new campaign
export const createCampaignSchema = campaignSchema.omit({
  id: true,
  metrics: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  platformIds: z.array(z.string()).optional(),
});

// Schema for updating an existing campaign
export const updateCampaignSchema = campaignSchema
  .partial()
  .omit({
    id: true,
    clientId: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
  }).extend({
    startDate: z.string().min(1, 'Start date is required').optional(),
    endDate: z.string().optional(),
    platformIds: z.array(z.string()).optional(),
  });

// Schema for campaign response with additional nested fields
export const campaignResponseSchema = campaignSchema.extend({
  client: z.object({
    id: z.string(),
    name: z.string(),
  }),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }),
  platforms: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
    })
  ).optional(),
});

// Export types
export type Campaign = z.infer<typeof campaignSchema>;
export type CreateCampaign = z.infer<typeof createCampaignSchema>;
export type UpdateCampaign = z.infer<typeof updateCampaignSchema>;
export type CampaignResponse = z.infer<typeof campaignResponseSchema>; 