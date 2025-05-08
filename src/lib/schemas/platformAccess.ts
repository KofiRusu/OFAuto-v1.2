import { z } from 'zod';

/**
 * Platform information schema
 */
export const PlatformInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  username: z.string().nullable(),
  status: z.string(),
});

export type PlatformInfo = z.infer<typeof PlatformInfoSchema>;

/**
 * Platform access response schema
 */
export const PlatformAccessResponseSchema = z.object({
  id: z.string().uuid(),
  platformId: z.string(),
  userId: z.string(),
  approved: z.boolean(),
  createdAt: z.date(),
  platform: PlatformInfoSchema.optional(),
});

export type PlatformAccessResponse = z.infer<typeof PlatformAccessResponseSchema>;

/**
 * Platform access update schema
 */
export const PlatformAccessUpdateSchema = z.object({
  platformId: z.string(),
  userId: z.string(),
  approved: z.boolean(),
});

export type PlatformAccessUpdate = z.infer<typeof PlatformAccessUpdateSchema>;

/**
 * Get user platforms query schema
 */
export const GetUserPlatformsSchema = z.object({
  userId: z.string().optional(),
  includeUnapproved: z.boolean().optional().default(false),
});

export type GetUserPlatforms = z.infer<typeof GetUserPlatformsSchema>;

/**
 * Response schema for list of platform access records
 */
export const PlatformAccessListResponseSchema = z.object({
  platformAccess: z.array(PlatformAccessResponseSchema),
});

export type PlatformAccessListResponse = z.infer<typeof PlatformAccessListResponseSchema>; 