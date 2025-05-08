import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { ChatbotAutomationService } from '@/lib/services/chatbotAutomationService';
import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';
import {
  ChatbotAutomationCreateSchema,
  ChatbotAutomationUpdateSchema,
  ChatbotAutomationTriggerSchema,
  ChatbotAutomationQuerySchema,
  ChatbotAutomationFromPromptSchema,
  ChatbotAutomationListFromPromptSchema,
  ChatbotAutomationExecuteSchema,
} from '@/lib/schemas/chatbotAutomation';
import { chatbotAutomationService } from '@/lib/services/chatbotAutomationService';

// Create manager-only procedure
const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user's role is either MANAGER or ADMIN from the request headers
  const userRole = ctx.auth.userRole;

  if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only managers and administrators can access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Add any additional context needed by manager-only procedures
    },
  });
});

export const chatbotAutomationRouter = createTRPCRouter({
  /**
   * Create a new chatbot automation
   * Restricted to MANAGER and ADMIN
   */
  createAutomation: managerProcedure
    .input(ChatbotAutomationCreateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Create the automation using the service
        const automation = await ChatbotAutomationService.createAutomation(
          input,
          ctx.auth.userId
        );

        return {
          success: true,
          automation,
        };
      } catch (error) {
        console.error('Error creating chatbot automation:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create automation',
          cause: error,
        });
      }
    }),

  /**
   * Get all automations with optional filtering
   * Restricted to MANAGER and ADMIN
   */
  getAutomations: managerProcedure
    .input(ChatbotAutomationQuerySchema.optional())
    .query(async ({ input, ctx }) => {
      try {
        // Get automations using the service
        const automations = await ChatbotAutomationService.getAutomations(input || {});

        return {
          success: true,
          automations,
        };
      } catch (error) {
        console.error('Error fetching chatbot automations:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch automations',
          cause: error,
        });
      }
    }),

  /**
   * Get a single automation by ID
   * Restricted to MANAGER and ADMIN
   */
  getAutomation: managerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        // Get the automation using the service
        const automation = await ChatbotAutomationService.getAutomationById(input.id);

        return {
          success: true,
          automation,
        };
      } catch (error) {
        console.error(`Error fetching chatbot automation ${input.id}:`, error);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Automation with ID ${input.id} not found`,
          cause: error,
        });
      }
    }),

  /**
   * Update an existing automation
   * Restricted to MANAGER and ADMIN
   */
  updateAutomation: managerProcedure
    .input(ChatbotAutomationUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Update the automation using the service
        const automation = await ChatbotAutomationService.updateAutomation(input);

        return {
          success: true,
          automation,
        };
      } catch (error) {
        console.error(`Error updating chatbot automation ${input.id}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update automation',
          cause: error,
        });
      }
    }),

  /**
   * Delete an automation
   * Restricted to MANAGER and ADMIN
   */
  deleteAutomation: managerProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Delete the automation using the service
        await ChatbotAutomationService.deleteAutomation(input.id);

        return {
          success: true,
        };
      } catch (error) {
        console.error(`Error deleting chatbot automation ${input.id}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete automation',
          cause: error,
        });
      }
    }),

  /**
   * Manually trigger an automation
   * Restricted to MANAGER and ADMIN
   */
  triggerAutomation: managerProcedure
    .input(ChatbotAutomationTriggerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Trigger the automation using the service
        const result = await ChatbotAutomationService.triggerAutomation(
          input.id,
          input.inputs || {}
        );

        return {
          success: true,
          result,
        };
      } catch (error) {
        console.error(`Error triggering chatbot automation ${input.id}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to trigger automation',
          cause: error,
        });
      }
    }),

  /**
   * Create a chatbot automation from a natural language prompt
   * Restricted to MANAGER and ADMIN
   */
  createFromPrompt: managerProcedure
    .input(ChatbotAutomationFromPromptSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Generate automation structure from prompt
        const automationData = await chatbotAutomationService.generateFromPrompt(
          input.prompt,
          ctx.auth.userId
        );

        // Convert the generated data to a valid automation input 
        const createInput = {
          name: automationData.name,
          personaId: input.personaId || automationData.suggestedPersonaId || '00000000-0000-0000-0000-000000000000', // Default or suggested persona
          triggerType: automationData.triggerType,
          triggerData: automationData.triggerData,
          actions: automationData.actions.map((action, index) => ({
            type: action.type,
            name: `Action ${index + 1}`,
            config: {
              content: action.content,
              delay: action.delay || 0,
              condition: action.condition,
            },
            order: index,
          })),
          isActive: true,
        };

        // Create the automation using the service
        const automation = await ChatbotAutomationService.createAutomation(
          createInput,
          ctx.auth.userId
        );

        return {
          success: true,
          automation,
          originalPrompt: input.prompt,
        };
      } catch (error) {
        console.error('Error creating automation from prompt:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create automation from prompt',
          cause: error,
        });
      }
    }),

  /**
   * List potential automation ideas from a prompt
   * Restricted to MANAGER and ADMIN
   */
  listFromPrompt: managerProcedure
    .input(ChatbotAutomationListFromPromptSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Get automation suggestions from the prompt
        const suggestions = await chatbotAutomationService.listFromPrompt(
          input.prompt,
          ctx.auth.userId,
          input.count
        );

        return {
          success: true,
          suggestions,
          originalPrompt: input.prompt,
        };
      } catch (error) {
        console.error('Error listing automations from prompt:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate automation suggestions',
          cause: error,
        });
      }
    }),

  /**
   * Execute an automation with optional context
   * Restricted to MANAGER and ADMIN
   */
  executeAutomation: managerProcedure
    .input(ChatbotAutomationExecuteSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Execute the automation
        const result = await chatbotAutomationService.executeAutomation(
          input.automationId,
          input.context || {}
        );

        return {
          success: result.success,
          results: result.results,
        };
      } catch (error) {
        console.error(`Error executing automation ${input.automationId}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to execute automation',
          cause: error,
        });
      }
    }),
}); 