import { z } from 'zod';

// KYC Review Schemas
export const kycReviewSchema = z.object({
  id: z.string().cuid(),
  profileId: z.string(),
  reviewerId: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ADDITIONAL_INFO_REQUESTED']),
  reason: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  documentUrls: z.array(z.string().url()),
  reviewedAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Schema for creating a new KYC review
export const createKycReviewSchema = kycReviewSchema.omit({
  id: true,
  reviewerId: true, // Will be set from the authenticated user
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
});

// Schema for updating an existing KYC review
export const updateKycReviewSchema = kycReviewSchema
  .partial()
  .omit({
    id: true,
    profileId: true,
    reviewerId: true,
    createdAt: true,
    updatedAt: true,
  });

// Schema for approving a KYC review
export const approveKycReviewSchema = z.object({
  id: z.string(),
  reason: z.string().optional(),
});

// Schema for rejecting a KYC review
export const rejectKycReviewSchema = z.object({
  id: z.string(),
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
  reason: z.string().optional(),
});

// Schema for requesting additional information
export const requestAdditionalInfoSchema = z.object({
  id: z.string(),
  reason: z.string().min(1, 'Please specify what additional information is needed'),
  documentTypes: z.array(z.string()).optional(),
});

// Response schema with profile information
export const kycReviewResponseSchema = kycReviewSchema.extend({
  profile: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string().nullable().optional(),
    phoneNumber: z.string(),
    kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'REVIEW']),
  }).optional(),
  reviewer: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(),
});

// Add new schema definitions from the request
export const KycReviewRead = z.object({
  id: z.string(),
  profileId: z.string(),
  reviewerId: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'PENDING', 'APPROVED', 'REJECTED', 'ADDITIONAL_INFO_REQUESTED']),
  reason: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  reviewedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const KycReviewUpdate = z.object({
  id: z.string(),
  status: z.enum(['approved', 'rejected', 'APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});

export const KycReviewCreate = z.object({
  profileId: z.string(),
});

// Schema for file upload/download
export const fileUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  profileId: z.string(),
  fileType: z.enum(['IDENTIFICATION', 'ADDRESS_PROOF', 'TAX_DOCUMENT', 'CONTRACT', 'OTHER']),
});

export const fileDownloadUrlSchema = z.object({
  fileKey: z.string().min(1),
});

// Export types
export type KycReview = z.infer<typeof kycReviewSchema>;
export type CreateKycReview = z.infer<typeof createKycReviewSchema>;
export type UpdateKycReview = z.infer<typeof updateKycReviewSchema>;
export type ApproveKycReview = z.infer<typeof approveKycReviewSchema>;
export type RejectKycReview = z.infer<typeof rejectKycReviewSchema>;
export type RequestAdditionalInfo = z.infer<typeof requestAdditionalInfoSchema>;
export type KycReviewResponse = z.infer<typeof kycReviewResponseSchema>;
export type FileUploadUrlRequest = z.infer<typeof fileUploadUrlSchema>;
export type FileDownloadUrlRequest = z.infer<typeof fileDownloadUrlSchema>; 