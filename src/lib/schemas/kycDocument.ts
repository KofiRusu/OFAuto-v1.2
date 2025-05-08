import { z } from 'zod';

/**
 * Available KYC document types
 */
export const KycTypeEnum = z.enum(['ID_FRONT', 'ID_BACK', 'TAX_FORM'], {
  required_error: 'Document type is required',
  invalid_type_error: 'Document type must be ID_FRONT, ID_BACK, or TAX_FORM',
});

/**
 * Available KYC document statuses
 */
export const KycStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO'], {
  required_error: 'Document status is required',
  invalid_type_error: 'Document status must be PENDING, APPROVED, REJECTED, or NEEDS_INFO',
});

/**
 * Schema for creating a new KYC document
 */
export const KycDocumentCreateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: KycTypeEnum,
  fileUrl: z.string().url('A valid file URL is required'),
});

/**
 * Schema for updating a KYC document status (used by reviewers)
 */
export const KycDocumentUpdateSchema = z.object({
  id: z.string().min(1, 'Document ID is required'),
  status: KycStatusEnum,
  reviewerId: z.string().min(1, 'Reviewer ID is required'),
  reviewedAt: z.date().optional().default(() => new Date()),
  notes: z.string().optional(),
});

/**
 * Schema for a KYC document response
 */
export const KycDocumentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: KycTypeEnum,
  fileUrl: z.string().url(),
  status: KycStatusEnum,
  submittedAt: z.date(),
  reviewedAt: z.date().nullable(),
  reviewerId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(),
  reviewer: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional().nullable(),
});

/**
 * Additional schema for listing KYC documents with pagination
 */
export const KycDocumentListResponseSchema = z.object({
  documents: z.array(KycDocumentResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

/**
 * Type definitions based on the schemas
 */
export type KycType = z.infer<typeof KycTypeEnum>;
export type KycStatus = z.infer<typeof KycStatusEnum>;
export type KycDocumentCreate = z.infer<typeof KycDocumentCreateSchema>;
export type KycDocumentUpdate = z.infer<typeof KycDocumentUpdateSchema>;
export type KycDocumentResponse = z.infer<typeof KycDocumentResponseSchema>;
export type KycDocumentListResponse = z.infer<typeof KycDocumentListResponseSchema>; 