import { z } from 'zod';

// Define the TaxFormType enum to match Prisma
export const TaxFormTypeSchema = z.enum(['US_1099', 'EU_VAT', 'OTHER']);

// Schema for creating a tax form
export const TaxFormCreateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  type: TaxFormTypeSchema,
});

// Schema for tax form response
export const TaxFormResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  year: z.number().int(),
  type: TaxFormTypeSchema,
  pdfUrl: z.string().url().nullable().optional(),
  generatedAt: z.date(),
});

// Schema for downloading a tax form
export const TaxFormDownloadSchema = z.object({
  id: z.string().uuid("Invalid tax form ID"),
});

// Schema for listing tax forms
export const TaxFormListQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID").optional(),
  year: z.number().int().optional(),
  type: TaxFormTypeSchema.optional(),
});

// Export types
export type TaxFormType = z.infer<typeof TaxFormTypeSchema>;
export type TaxFormCreate = z.infer<typeof TaxFormCreateSchema>;
export type TaxFormResponse = z.infer<typeof TaxFormResponseSchema>;
export type TaxFormDownload = z.infer<typeof TaxFormDownloadSchema>;
export type TaxFormListQuery = z.infer<typeof TaxFormListQuerySchema>; 