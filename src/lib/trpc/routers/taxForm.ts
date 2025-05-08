import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { TaxFormService } from '@/lib/services/taxFormService';
import { 
  TaxFormCreateSchema, 
  TaxFormDownloadSchema, 
  TaxFormResponseSchema, 
  TaxFormListQuerySchema
} from '@/lib/schemas/taxForm';

export const taxFormRouter = createTRPCRouter({
  /**
   * Create a new tax form
   */
  create: protectedProcedure
    .input(TaxFormCreateSchema)
    .output(TaxFormResponseSchema)
    .mutation(async ({ input, ctx }) => {
      // Use the authenticated user's ID if not provided
      const userId = input.userId || ctx.auth.userId;
      
      // Verify the user has permission to create this tax form
      if (input.userId && input.userId !== ctx.auth.userId && ctx.auth.userRole !== 'ADMIN') {
        throw new Error('You do not have permission to create tax forms for other users.');
      }
      
      return TaxFormService.createTaxForm({ ...input, userId });
    }),

  /**
   * List tax forms for a user
   */
  list: protectedProcedure
    .input(TaxFormListQuerySchema)
    .query(async ({ input, ctx }) => {
      // Use the authenticated user's ID if not provided
      const userId = input.userId || ctx.auth.userId;
      
      // Verify the user has permission to list these tax forms
      if (input.userId && input.userId !== ctx.auth.userId && ctx.auth.userRole !== 'ADMIN') {
        throw new Error('You do not have permission to list tax forms for other users.');
      }
      
      return TaxFormService.listTaxForms(userId, input.year, input.type);
    }),

  /**
   * Get a tax form by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid('Invalid tax form ID') }))
    .query(async ({ input, ctx }) => {
      const taxForm = await TaxFormService.getTaxForm(input.id);
      
      // Verify the user has permission to view this tax form
      if (taxForm.userId !== ctx.auth.userId && ctx.auth.userRole !== 'ADMIN') {
        throw new Error('You do not have permission to view this tax form.');
      }
      
      return taxForm;
    }),

  /**
   * Generate PDF for a tax form
   */
  generatePdf: protectedProcedure
    .input(z.object({ 
      id: z.string().uuid('Invalid tax form ID'),
      data: z.record(z.any()).optional().default({})
    }))
    .mutation(async ({ input, ctx }) => {
      // First get the tax form to validate permissions
      const taxForm = await TaxFormService.getTaxForm(input.id);
      
      // Verify the user has permission to generate this tax form
      if (taxForm.userId !== ctx.auth.userId && ctx.auth.userRole !== 'ADMIN') {
        throw new Error('You do not have permission to generate this tax form.');
      }
      
      // Generate the PDF
      const pdfUrl = await TaxFormService.generatePdf(input.id, input.data);
      
      return { 
        success: true, 
        url: pdfUrl 
      };
    }),

  /**
   * Download a tax form
   */
  download: protectedProcedure
    .input(TaxFormDownloadSchema)
    .query(async ({ input, ctx }) => {
      // First get the tax form to validate permissions
      const taxForm = await TaxFormService.getTaxForm(input.id);
      
      // Verify the user has permission to download this tax form
      if (taxForm.userId !== ctx.auth.userId && ctx.auth.userRole !== 'ADMIN') {
        throw new Error('You do not have permission to download this tax form.');
      }
      
      if (!taxForm.pdfUrl) {
        throw new Error('This tax form does not have a generated PDF yet.');
      }
      
      return {
        url: taxForm.pdfUrl
      };
    }),
}); 