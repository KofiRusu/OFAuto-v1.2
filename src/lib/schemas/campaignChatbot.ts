import { z } from 'zod';

/**
 * Schema for a single campaign idea
 */
export const CampaignIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export type CampaignIdea = z.infer<typeof CampaignIdeaSchema>;

/**
 * Schema for requesting campaign ideas
 */
export const CampaignIdeaRequestSchema = z.object({
  context: z.string().min(10, 'Please provide more context (at least 10 characters)'),
  platform: z.string().optional(),
  targetAudience: z.string().optional(),
  budget: z.number().optional(),
  goals: z.string().optional(),
});

export type CampaignIdeaRequest = z.infer<typeof CampaignIdeaRequestSchema>;

/**
 * Schema for campaign idea response
 */
export const CampaignIdeaResponseSchema = z.object({
  ideas: z.array(CampaignIdeaSchema),
});

export type CampaignIdeaResponse = z.infer<typeof CampaignIdeaResponseSchema>; 