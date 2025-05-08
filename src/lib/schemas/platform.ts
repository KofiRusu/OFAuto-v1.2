import { z } from 'zod';

// Enum for platform status
export const platformStatusEnum = z.enum([
  'PENDING',
  'ACTIVE',
  'ERROR',
  'DISCONNECTED',
]);

// Base schema for platform data
export const platformSchema = z.object({
  id: z.string(),
  type: z.string().min(1, 'Platform type is required'),
  name: z.string().min(1, 'Name is required'),
  username: z.string().optional().nullable(),
  userId: z.string().min(1, 'User ID is required'),
  clientId: z.string().optional().nullable(),
  status: platformStatusEnum.default('PENDING'),
  lastCheckedAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Schema for creating a new platform
export const createPlatformSchema = platformSchema.omit({
  id: true,
  lastCheckedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating an existing platform
export const updatePlatformSchema = platformSchema
  .partial()
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  });

// Schema for platform response with additional nested fields
export const platformResponseSchema = platformSchema.extend({
  client: z.object({
    id: z.string(),
    name: z.string(),
  }).optional().nullable(),
});

// Export types
export type Platform = z.infer<typeof platformSchema>;
export type CreatePlatform = z.infer<typeof createPlatformSchema>;
export type UpdatePlatform = z.infer<typeof updatePlatformSchema>;
export type PlatformResponse = z.infer<typeof platformResponseSchema>; 