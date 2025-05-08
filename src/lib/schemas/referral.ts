import { z } from 'zod';

/**
 * Referral status enum
 */
export const ReferralStatusEnum = z.enum(['PENDING', 'COMPLETED', 'CANCELLED'], {
  required_error: 'Referral status is required',
  invalid_type_error: 'Invalid referral status',
});

/**
 * Schema for creating a new referral
 */
export const ReferralCreateSchema = z.object({
  refereeId: z.string().min(1, { message: 'Referee ID is required' }),
});

/**
 * Schema for updating a referral's status
 */
export const ReferralUpdateSchema = z.object({
  id: z.string().min(1, { message: 'Referral ID is required' }),
  status: ReferralStatusEnum,
  bonusAmount: z.number().min(0).optional(),
});

/**
 * Schema for referral user info (used in response schemas)
 */
const ReferralUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  avatar: z.string().nullable(),
});

/**
 * Schema for referral bonus data
 */
export const ReferralBonusSchema = z.object({
  id: z.string(),
  referralId: z.string(),
  amount: z.number(),
  paidAt: z.date().nullable(),
  createdAt: z.date(),
});

/**
 * Schema for referral response data
 */
export const ReferralResponseSchema = z.object({
  id: z.string(),
  referrerId: z.string(),
  refereeId: z.string(),
  status: ReferralStatusEnum,
  createdAt: z.date(),
  referrer: ReferralUserSchema.optional(),
  referee: ReferralUserSchema.optional(),
  bonuses: z.array(ReferralBonusSchema).optional(),
});

/**
 * Schema for paginated referral list response
 */
export const ReferralListResponseSchema = z.object({
  referrals: z.array(ReferralResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

/**
 * Typescript type definitions
 */
export type ReferralStatus = z.infer<typeof ReferralStatusEnum>;
export type ReferralCreate = z.infer<typeof ReferralCreateSchema>;
export type ReferralUpdate = z.infer<typeof ReferralUpdateSchema>;
export type ReferralResponse = z.infer<typeof ReferralResponseSchema>;
export type ReferralListResponse = z.infer<typeof ReferralListResponseSchema>;
export type ReferralBonus = z.infer<typeof ReferralBonusSchema>; 