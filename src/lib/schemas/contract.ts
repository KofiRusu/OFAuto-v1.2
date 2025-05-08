import { z } from 'zod';

/**
 * Schema for creating a new contract
 */
export const ContractCreateSchema = z.object({
  modelId: z.string().min(1, 'Model ID is required'),
  managerId: z.string().min(1, 'Manager ID is required'),
  documentUrl: z.string().url('A valid document URL is required'),
});

/**
 * Schema for updating a contract's status
 */
export const ContractUpdateSchema = z.object({
  id: z.string().min(1, 'Contract ID is required'),
  status: z.enum(['PENDING', 'SIGNED', 'REJECTED'], {
    required_error: 'Contract status is required',
    invalid_type_error: 'Contract status must be PENDING, SIGNED, or REJECTED',
  }),
  signedAt: z.date().optional(),
});

/**
 * Schema for a contract response with related user data
 */
export const ContractResponseSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  managerId: z.string(),
  documentUrl: z.string().url(),
  status: z.enum(['PENDING', 'SIGNED', 'REJECTED']),
  signedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  model: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(),
  manager: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(),
});

/**
 * Type definitions based on the schemas
 */
export type ContractCreate = z.infer<typeof ContractCreateSchema>;
export type ContractUpdate = z.infer<typeof ContractUpdateSchema>;
export type ContractResponse = z.infer<typeof ContractResponseSchema>;

/**
 * Additional schema for listing contracts with pagination
 */
export const ContractListResponseSchema = z.object({
  contracts: z.array(ContractResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

export type ContractListResponse = z.infer<typeof ContractListResponseSchema>; 